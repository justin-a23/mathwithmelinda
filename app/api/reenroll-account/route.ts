import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { isStaffCognitoUser } from '@/app/lib/staffGuard'
import { appsyncClient } from '@/app/lib/appsync'

/**
 * Re-enroll safety net for Past Students.
 *
 * The re-enroll flow assumes the student's Cognito account still exists
 * ("sign in with last year's credentials"). On 2026-08-22 that assumption
 * failed: Meredith Jones's account had been deleted before the 7/29 profile
 * re-import, she was re-enrolled anyway, and got "no account found" at
 * sign-in. Her account had to be rebuilt by hand — AdminCreateUser, then
 * re-pointing StudentProfile.userId and the Enrollment rows at the new sub.
 *
 * This route does that check (and, on request, that rebuild) BEFORE the
 * approval writes anything:
 *
 *   { action: "check",  profileId }  → does a Cognito user exist for the
 *     profile's email, and does its sub match profile.userId?
 *   { action: "repair", profileId }  → make the profile point at a live
 *     account: relink to the existing user if one exists under the email,
 *     otherwise recreate the account (verified email, suppressed invite,
 *     random permanent password — the student uses Forgot Password), then
 *     re-point the profile and every row keyed by the old sub.
 */

function makeCognitoClient() {
  // Amplify Console blocks "AWS_" prefix env vars, so we use MWM_ prefix in production.
  // Local dev still works with AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from .env.local.
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  if (accessKeyId && secretAccessKey) {
    return new CognitoIdentityProviderClient({
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return new CognitoIdentityProviderClient({ region: 'us-east-1' })
}

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV'

const getStudentProfileQuery = /* GraphQL */`
  query GetStudentProfileForReenroll($id: ID!) {
    getStudentProfile(id: $id) { id userId email firstName lastName status }
  }
`

const updateProfileUserIdMutation = /* GraphQL */`
  mutation RepointStudentProfile($input: UpdateStudentProfileInput!) {
    updateStudentProfile(input: $input) { id userId }
  }
`

// Rows keyed by the student's sub that must follow it to the new account.
// ReportCardRecord is keyed by profile id, so it needs no re-pointing.
const listEnrollmentsBySubQuery = /* GraphQL */`
  query ListEnrollmentsBySub($filter: ModelEnrollmentFilterInput) {
    listEnrollments(filter: $filter, limit: 500) { items { id } }
  }
`
const listSubmissionsBySubQuery = /* GraphQL */`
  query ListSubmissionsBySub($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 1000) { items { id } }
  }
`
const listMessagesBySubQuery = /* GraphQL */`
  query ListMessagesBySub($filter: ModelMessageFilterInput) {
    listMessages(filter: $filter, limit: 500) { items { id } }
  }
`

const UPDATE_MUTATIONS = {
  enrollment: 'mutation RepointEnroll($input: UpdateEnrollmentInput!) { updateEnrollment(input: $input) { id } }',
  submission: 'mutation RepointSub($input: UpdateSubmissionInput!) { updateSubmission(input: $input) { id } }',
  message:    'mutation RepointMsg($input: UpdateMessageInput!) { updateMessage(input: $input) { id } }',
} as const

async function findCognitoUserByEmail(cognito: CognitoIdentityProviderClient, email: string) {
  const result = await cognito.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `email = "${email}"`,
    Limit: 1,
  }))
  const user = result.Users?.[0]
  if (!user?.Username) return null
  const sub = user.Attributes?.find(a => a.Name === 'sub')?.Value
  return sub ? { username: user.Username, sub } : null
}

/**
 * Random password satisfying every Cognito policy class (upper, lower, digit,
 * symbol, length). It is never shown to anyone — the account is created with
 * it as a PERMANENT password so it skips FORCE_CHANGE_PASSWORD, and the
 * student sets their own via Forgot Password.
 */
function randomPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^&*'
  const all = upper + lower + digits + symbols
  const bytes = randomBytes(28)
  const chars = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ]
  for (let i = 4; i < bytes.length; i++) chars.push(all[bytes[i] % all.length])
  return chars.join('')
}

/**
 * Re-point every row keyed by the old sub at the new one. Best-effort, same
 * philosophy as delete-student's cascade: individual failures are collected
 * and reported, not fatal — a partially re-pointed history is strictly better
 * than refusing to fix the login.
 */
async function repointStudentRows(
  gql: ReturnType<typeof appsyncClient>,
  oldSub: string,
  newSub: string,
) {
  const counts = { enrollments: 0, submissions: 0, messages: 0 }
  const errors: string[] = []
  const jobs: [keyof typeof counts, string, keyof typeof UPDATE_MUTATIONS][] = [
    ['enrollments', listEnrollmentsBySubQuery, 'enrollment'],
    ['submissions', listSubmissionsBySubQuery, 'submission'],
    ['messages', listMessagesBySubQuery, 'message'],
  ]
  for (const [key, listQuery, mutation] of jobs) {
    try {
      const d = await gql(listQuery, { filter: { studentId: { eq: oldSub } } })
      const items: { id: string }[] = (d ? (Object.values(d)[0] as any) : null)?.items || []
      await Promise.all(items.map(item =>
        gql(UPDATE_MUTATIONS[mutation], { input: { id: item.id, studentId: newSub } })
          .catch((e: any) => errors.push(`${mutation} ${item.id}: ${e.message}`))
      ))
      counts[key] = items.length
    } catch (e: any) {
      errors.push(`list ${key}: ${e.message}`)
    }
  }
  return { counts, errors }
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  const { action, profileId } = await request.json()
  if (!profileId || (action !== 'check' && action !== 'repair')) {
    return NextResponse.json({ error: 'Expected profileId and action "check" or "repair"' }, { status: 400 })
  }

  const gql = appsyncClient(auth.token)

  // The profile is the source of truth for email and current sub — don't trust
  // the client's copy, it may be stale by the time the button is clicked.
  let profile: { id: string; userId: string; email: string; status: string | null }
  try {
    const d = await gql(getStudentProfileQuery, { id: profileId })
    profile = d?.getStudentProfile
    if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load student profile' }, { status: 500 })
  }

  const cognito = makeCognitoClient()
  let existing: { username: string; sub: string } | null
  try {
    existing = await findCognitoUserByEmail(cognito, profile.email)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Cognito lookup failed' }, { status: 500 })
  }

  if (action === 'check') {
    return NextResponse.json({
      exists: !!existing,
      subMatches: !!existing && existing.sub === profile.userId,
    })
  }

  // ── repair ──
  let mode: 'recreated' | 'relinked'
  let newSub: string

  if (existing) {
    // An account already exists under this email — the profile just points at
    // the wrong sub (e.g. profile re-imported after the account was rebuilt).
    // Never relink a StudentProfile onto a staff login.
    try {
      if (await isStaffCognitoUser(cognito, USER_POOL_ID, existing.username)) {
        return NextResponse.json({ error: 'That email belongs to a teacher/admin account — refusing to link a student profile to it.' }, { status: 409 })
      }
    } catch (err: any) {
      return NextResponse.json({ error: `Could not verify the existing account's groups: ${err.message}` }, { status: 500 })
    }
    mode = 'relinked'
    newSub = existing.sub
  } else {
    try {
      const created = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: profile.email,
        MessageAction: 'SUPPRESS',
        TemporaryPassword: randomPassword(),
        UserAttributes: [
          { Name: 'email', Value: profile.email },
          { Name: 'email_verified', Value: 'true' },
        ],
      }))
      const sub = created.User?.Attributes?.find(a => a.Name === 'sub')?.Value
      const username = created.User?.Username
      if (!sub || !username) throw new Error('Cognito did not return the new user\'s sub')
      // Permanent random password: skips FORCE_CHANGE_PASSWORD so the
      // Forgot Password flow is the one and only way in.
      await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: randomPassword(),
        Permanent: true,
      }))
      mode = 'recreated'
      newSub = sub
      console.log('Recreated Cognito account for re-enroll:', profile.email, '→', sub)
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to recreate the Cognito account' }, { status: 500 })
    }
  }

  const oldSub = profile.userId
  let repoint: Awaited<ReturnType<typeof repointStudentRows>> = { counts: { enrollments: 0, submissions: 0, messages: 0 }, errors: [] }
  if (newSub !== oldSub) {
    // Profile first: if anything after this fails, the login works and the
    // approval that follows stamps the new sub into the rows it creates.
    try {
      await gql(updateProfileUserIdMutation, { input: { id: profile.id, userId: newSub } })
    } catch (err: any) {
      return NextResponse.json({ error: `Account ${mode} (${newSub}) but the profile update failed: ${err.message}` }, { status: 500 })
    }
    repoint = await repointStudentRows(gql, oldSub, newSub)
    if (repoint.errors.length > 0) {
      console.warn('Partial re-point errors:', repoint.errors.slice(0, 10))
    }
    console.log('Re-pointed student rows', { profileId: profile.id, oldSub, newSub, counts: repoint.counts })
  }

  return NextResponse.json({
    success: true,
    mode,
    userId: newSub,
    repointCounts: repoint.counts,
    repointErrorCount: repoint.errors.length,
  })
}
