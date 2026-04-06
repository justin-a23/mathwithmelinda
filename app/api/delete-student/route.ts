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

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY!

const deleteStudentProfileMutation = /* GraphQL */`
  mutation DeleteStudentProfile($input: DeleteStudentProfileInput!) {
    deleteStudentProfile(input: $input) { id }
  }
`

async function deleteStudentProfile(profileId: string) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query: deleteStudentProfileMutation, variables: { input: { id: profileId } } }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
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

  const { username: userId, profileId } = await request.json()

  if (!userId || !profileId) {
    return NextResponse.json({ error: 'Missing userId or profileId' }, { status: 400 })
  }

  let cognitoDeleted = false
  let cognitoError = ''

  // Delete from Cognito — look up actual Username by sub first
  try {
    const cognito = makeCognitoClient()

    // Find the real Cognito Username via ListUsers (sub filter)
    const cognitoUsername = await findCognitoUsername(cognito, userId)

    if (!cognitoUsername) {
      // User not found in Cognito — already deleted or never existed
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

  // Always delete the DynamoDB record
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
  })
}
