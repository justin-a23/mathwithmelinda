import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'

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

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

const deleteStudentProfileMutation = /* GraphQL */`
  mutation DeleteStudentProfile($input: DeleteStudentProfileInput!) {
    deleteStudentProfile(input: $input) { id }
  }
`

// Find-by-filter query variants: studentId on Submissions/Messages, parentId or
// ParentStudent linkage, etc. All keyed by the student's userId (sub) or email.
const listStudentSubmissionsQuery = /* GraphQL */`
  query ListStudentSubs($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 1000) { items { id } }
  }
`
const listStudentEnrollmentsQuery = /* GraphQL */`
  query ListStudentEnrollments($filter: ModelEnrollmentFilterInput) {
    listEnrollments(filter: $filter, limit: 500) { items { id } }
  }
`
const listStudentMessagesQuery = /* GraphQL */`
  query ListStudentMessages($filter: ModelMessageFilterInput) {
    listMessages(filter: $filter, limit: 500) { items { id } }
  }
`
const listStudentParentLinksQuery = /* GraphQL */`
  query ListStudentParentLinks($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 200) { items { id } }
  }
`
const listStudentReportsQuery = /* GraphQL */`
  query ListStudentReports($filter: ModelReportCardRecordFilterInput) {
    listReportCardRecords(filter: $filter, limit: 500) { items { id } }
  }
`
const listStudentInvitesQuery = /* GraphQL */`
  query ListStudentInvites($filter: ModelStudentInviteFilterInput) {
    listStudentInvites(filter: $filter, limit: 200) { items { id } }
  }
`

const DELETE_MUTATIONS = {
  submission:   'mutation DelSub($input: DeleteSubmissionInput!) { deleteSubmission(input: $input) { id } }',
  enrollment:   'mutation DelEnroll($input: DeleteEnrollmentInput!) { deleteEnrollment(input: $input) { id } }',
  message:      'mutation DelMsg($input: DeleteMessageInput!) { deleteMessage(input: $input) { id } }',
  parentLink:   'mutation DelPS($input: DeleteParentStudentInput!) { deleteParentStudent(input: $input) { id } }',
  reportCard:   'mutation DelRC($input: DeleteReportCardRecordInput!) { deleteReportCardRecord(input: $input) { id } }',
  studentInvite:'mutation DelSI($input: DeleteStudentInviteInput!) { deleteStudentInvite(input: $input) { id } }',
} as const

async function gql(query: string, variables: any) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

async function deleteStudentProfile(profileId: string) {
  return gql(deleteStudentProfileMutation, { input: { id: profileId } })
}

/**
 * Cascade-delete everything tied to a student: submissions, enrollments,
 * messages, parent links, report cards, and any outstanding invites.
 * Individual failures are logged but don't stop the overall deletion —
 * better to over-clean than leave inconsistent state. Returns counts.
 */
async function cascadeDeleteStudentData(userId: string, email: string, profileId: string) {
  const counts = { submissions: 0, enrollments: 0, messages: 0, parentLinks: 0, reports: 0, invites: 0 }
  const errors: string[] = []

  // 1) Submissions — Submission.studentId holds email OR sub (legacy inconsistency)
  const submissionFilter = { or: [{ studentId: { eq: userId } }, { studentId: { eq: email } }] }
  try {
    const d = await gql(listStudentSubmissionsQuery, { filter: submissionFilter })
    const items = d?.listSubmissions?.items || []
    await Promise.all(items.map((s: any) =>
      gql(DELETE_MUTATIONS.submission, { input: { id: s.id } }).catch((e: any) => errors.push(`submission ${s.id}: ${e.message}`))
    ))
    counts.submissions = items.length
  } catch (e: any) { errors.push(`list submissions: ${e.message}`) }

  // 2) Enrollments — keyed by studentId (sub)
  try {
    const d = await gql(listStudentEnrollmentsQuery, { filter: { studentId: { eq: userId } } })
    const items = d?.listEnrollments?.items || []
    await Promise.all(items.map((e: any) =>
      gql(DELETE_MUTATIONS.enrollment, { input: { id: e.id } }).catch((err: any) => errors.push(`enrollment ${e.id}: ${err.message}`))
    ))
    counts.enrollments = items.length
  } catch (e: any) { errors.push(`list enrollments: ${e.message}`) }

  // 3) Messages — studentId field (same email/sub ambiguity)
  try {
    const d = await gql(listStudentMessagesQuery, { filter: { or: [{ studentId: { eq: userId } }, { studentId: { eq: email } }] } })
    const items = d?.listMessages?.items || []
    await Promise.all(items.map((m: any) =>
      gql(DELETE_MUTATIONS.message, { input: { id: m.id } }).catch((err: any) => errors.push(`message ${m.id}: ${err.message}`))
    ))
    counts.messages = items.length
  } catch (e: any) { errors.push(`list messages: ${e.message}`) }

  // 4) ParentStudent links — keyed by studentEmail (free-text)
  try {
    const d = await gql(listStudentParentLinksQuery, { filter: { studentEmail: { eq: email } } })
    const items = d?.listParentStudents?.items || []
    await Promise.all(items.map((p: any) =>
      gql(DELETE_MUTATIONS.parentLink, { input: { id: p.id } }).catch((err: any) => errors.push(`parentLink ${p.id}: ${err.message}`))
    ))
    counts.parentLinks = items.length
  } catch (e: any) { errors.push(`list parentLinks: ${e.message}`) }

  // 5) ReportCardRecord — keyed by studentId (profile id)
  try {
    const d = await gql(listStudentReportsQuery, { filter: { studentId: { eq: profileId } } })
    const items = d?.listReportCardRecords?.items || []
    await Promise.all(items.map((r: any) =>
      gql(DELETE_MUTATIONS.reportCard, { input: { id: r.id } }).catch((err: any) => errors.push(`reportCard ${r.id}: ${err.message}`))
    ))
    counts.reports = items.length
  } catch (e: any) { errors.push(`list reports: ${e.message}`) }

  // 6) StudentInvite — any outstanding invites for this student email
  try {
    const d = await gql(listStudentInvitesQuery, { filter: { studentEmail: { eq: email } } })
    const items = d?.listStudentInvites?.items || []
    await Promise.all(items.map((i: any) =>
      gql(DELETE_MUTATIONS.studentInvite, { input: { id: i.id } }).catch((err: any) => errors.push(`invite ${i.id}: ${err.message}`))
    ))
    counts.invites = items.length
  } catch (e: any) { errors.push(`list invites: ${e.message}`) }

  return { counts, errors }
}

/**
 * Find the Cognito Username for a user by their sub (userId).
 * Cognito's AdminDeleteUser requires the pool Username, not the sub.
 * We use ListUsers with a sub filter to get the real Username.
 */
async function findCognitoUsername(cognito: CognitoIdentityProviderClient, sub: string): Promise<string | null> {
  const result = await cognito.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `sub = "${sub}"`,
    Limit: 1,
  }))
  const user = result.Users?.[0]
  return user?.Username ?? null
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  const { username: userId, profileId, email } = await request.json()

  if (!userId || !profileId) {
    return NextResponse.json({ error: 'Missing userId or profileId' }, { status: 400 })
  }

  let cognitoDeleted = false
  let cognitoError = ''
  let cascadeCounts: Record<string, number> = {}
  let cascadeErrors: string[] = []

  // 1) Cascade-delete related data first (best-effort; logs failures but continues)
  if (email) {
    try {
      const result = await cascadeDeleteStudentData(userId, email, profileId)
      cascadeCounts = result.counts
      cascadeErrors = result.errors
      if (result.errors.length > 0) {
        console.warn('Partial cascade delete errors:', result.errors.slice(0, 10))
      }
      console.log('Cascade delete counts:', cascadeCounts)
    } catch (err: any) {
      console.error('Cascade delete failed (continuing to profile delete):', err)
      cascadeErrors.push(err?.message || 'cascade delete failed')
    }
  } else {
    console.warn('No email provided — skipping cascade. Orphans will be left.')
  }

  // 2) Delete from Cognito — look up actual Username by sub first
  try {
    const cognito = makeCognitoClient()
    const cognitoUsername = await findCognitoUsername(cognito, userId)
    if (!cognitoUsername) {
      cognitoDeleted = true
      console.log('Cognito user not found by sub — may already be deleted:', userId)
    } else {
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername }))
      cognitoDeleted = true
      console.log('Cognito user deleted:', cognitoUsername)
    }
  } catch (err: any) {
    cognitoError = err?.message || 'Cognito deletion failed'
    console.error('Cognito deletion failed:', cognitoError)
  }

  // 3) Delete the StudentProfile itself (last, so we have the id for all the filters above)
  try {
    await deleteStudentProfile(profileId)
  } catch (err: any) {
    console.error('Error deleting student profile from DB:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete student record' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    cognitoDeleted,
    cognitoError: cognitoError || null,
    cascadeCounts,
    cascadeErrorCount: cascadeErrors.length,
  })
}
