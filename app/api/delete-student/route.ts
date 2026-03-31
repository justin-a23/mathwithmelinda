import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'

function makeCognitoClient() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    return new CognitoIdentityProviderClient({
      region: 'us-east-1',
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    })
  }
  return new CognitoIdentityProviderClient({ region: 'us-east-1' })
}

const USER_POOL_ID = 'us-east-1_LvIY8oPmV'

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

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
