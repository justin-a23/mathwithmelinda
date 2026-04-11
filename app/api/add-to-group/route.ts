import { NextRequest, NextResponse } from 'next/server'
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { requireAuth } from '@/app/lib/auth'

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV'

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

/**
 * Add the authenticated user to a Cognito group.
 * Only allows adding to 'parent' group (self-service during invite acceptance).
 * Students and teachers are managed separately by the teacher.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { group } = await req.json()

    // Only allow self-adding to the parent group
    if (group !== 'parent') {
      return NextResponse.json({ error: 'Only the parent group can be self-assigned' }, { status: 403 })
    }

    // Already in the group? Skip.
    if (auth.groups.includes('parent')) {
      return NextResponse.json({ success: true, alreadyInGroup: true })
    }

    const cognito = makeCognitoClient()

    // Need the Cognito Username (not the sub) — look it up
    const listRes = await cognito.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `sub = "${auth.userId}"`,
      Limit: 1,
    }))
    const cognitoUser = listRes.Users?.[0]
    if (!cognitoUser?.Username) {
      return NextResponse.json({ error: 'User not found in Cognito' }, { status: 404 })
    }

    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoUser.Username,
      GroupName: 'parent',
    }))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error adding user to group:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
