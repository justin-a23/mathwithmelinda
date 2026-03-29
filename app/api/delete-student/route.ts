import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'

const cognito = new CognitoIdentityProviderClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

const deleteStudentProfileMutation = /* GraphQL */`
  mutation DeleteStudentProfile($input: DeleteStudentProfileInput!) {
    deleteStudentProfile(input: $input) {
      id
    }
  }
`

async function deleteStudentProfile(profileId: string) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': APPSYNC_API_KEY,
    },
    body: JSON.stringify({
      query: deleteStudentProfileMutation,
      variables: { input: { id: profileId } },
    }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

export async function POST(request: NextRequest) {
  try {
    const { username, profileId } = await request.json()

    if (!username || !profileId) {
      return NextResponse.json({ error: 'Missing username or profileId' }, { status: 400 })
    }

    // Delete from Cognito first
    await cognito.send(new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))

    // Then delete the StudentProfile record
    await deleteStudentProfile(profileId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting student:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete student' }, { status: 500 })
  }
}
