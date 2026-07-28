import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { APPSYNC_ENDPOINT, appsyncHeaders } from '@/app/lib/appsync'

function makeCognitoClient() {
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

/**
 * Marks a StudentProfile as archived in DynamoDB — does NOT delete it.
 * Preserving the record keeps name/course info intact for historical grade lookups.
 */
const archiveStudentProfileMutation = /* GraphQL */`
  mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
    updateStudentProfile(input: $input) { id status }
  }
`

async function markProfileArchived(profileId: string) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: appsyncHeaders(),
    body: JSON.stringify({
      query: archiveStudentProfileMutation,
      // Stamp archivedAt so past students can be grouped by year in the transcript view
      variables: { input: { id: profileId, status: 'archived', archivedAt: new Date().toISOString() } },
    }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

async function findCognitoUsername(cognito: CognitoIdentityProviderClient, sub: string): Promise<string | null> {
  const result = await cognito.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `sub = "${sub}"`,
    Limit: 1,
  }))
  return result.Users?.[0]?.Username ?? null
}

/**
 * POST /api/archive-student
 *
 * Archives a student at year end:
 *   1. Deletes their Cognito account (they must re-register next year)
 *   2. Marks their StudentProfile status = 'archived' (preserves all history)
 *
 * All Submission records (grades, comments, photos) remain untouched.
 * The teacher can still view full grade history via the grades and gradebook pages.
 */
export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  const { userId, profileId } = await request.json()

  if (!userId || !profileId) {
    return NextResponse.json({ error: 'Missing userId or profileId' }, { status: 400 })
  }

  let cognitoDeleted = false
  let cognitoError = ''

  // ORDER MATTERS — do not swap these back.
  //
  // Deleting the Cognito account first means any failure in the second step
  // destroys the recoverable half and keeps the unrecoverable one: the student
  // can no longer log in, but their profile still reads "active", so they sit
  // on the teacher's roster as a current student with nothing marking them
  // archived. That happened in production on 2026-07-28 to both students.
  //
  // This way round a failure is benign: profile archived, login still works —
  // visible, and fixed by simply running the archive again.

  // 1. Record the archive first — the durable, reversible half.
  try {
    await markProfileArchived(profileId)
  } catch (err: any) {
    console.error('Error archiving student profile:', err)
    return NextResponse.json({ error: err.message || 'Failed to archive student record' }, { status: 500 })
  }

  // 2. Then remove the login. Non-fatal: the archive itself already stuck.
  try {
    const cognito = makeCognitoClient()
    const cognitoUsername = await findCognitoUsername(cognito, userId)
    if (!cognitoUsername) {
      cognitoDeleted = true
      console.log('Cognito user not found by sub (may already be deleted):', userId)
    } else {
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername }))
      cognitoDeleted = true
      console.log('Cognito account archived (deleted):', cognitoUsername)
    }
  } catch (err: any) {
    cognitoError = err?.message || 'Cognito deletion failed'
    console.error('Cognito deletion failed during archive:', cognitoError)
  }

  return NextResponse.json({ success: true, cognitoDeleted, cognitoError: cognitoError || null })
}
