import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'

// Use env var credentials when available (Amplify), fall back to IAM role
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

export async function POST(request: NextRequest) {
  const { username, profileId } = await request.json()

  if (!username || !profileId) {
    return NextResponse.json({ error: 'Missing username or profileId' }, { status: 400 })
  }

  let cognitoDeleted = false
  let cognitoError = ''

  // Attempt Cognito deletion — non-fatal if it fails
  try {
    const cognito = makeCognitoClient()
    await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: username }))
    cognitoDeleted = true
  } catch (err: any) {
    cognitoError = err?.message || 'Cognito deletion failed'
    console.warn('Cognito deletion failed (continuing):', cognitoError)
  }

  // Always delete the DynamoDB record — this removes them from all UI views
  try {
    await deleteStudentProfile(profileId)
  } catch (err: any) {
    console.error('Error deleting student profile from DB:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete student record' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    cognitoDeleted,
    ...(cognitoError ? { cognitoNote: 'Account removed from app. Cognito account may need manual cleanup.' } : {}),
  })
}
