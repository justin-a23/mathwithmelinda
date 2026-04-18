import { NextRequest, NextResponse } from 'next/server'
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { requireAuth } from '@/app/lib/auth'

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV'
const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

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
 * Verify the authenticated user has at least one ParentStudent record —
 * meaning they've actually accepted a valid parent invite. Without this check,
 * any logged-in user (e.g. a student) could flip themselves into the parent
 * group via this endpoint.
 */
async function userHasParentStudentLink(userId: string): Promise<boolean> {
  const query = /* GraphQL */`
    query CheckParentLink($parentId: String!) {
      listParentStudents(filter: { parentId: { eq: $parentId } }, limit: 1) {
        items { id }
      }
    }
  `
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables: { parentId: userId } }),
  })
  const json = await res.json()
  return (json?.data?.listParentStudents?.items?.length ?? 0) > 0
}

/**
 * Add the authenticated user to a Cognito group.
 * Only allows adding to 'parent' group, and only if the user has accepted
 * at least one parent invite (enforced via ParentStudent record lookup).
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

    // Verify this user actually has a ParentStudent link — i.e. they've accepted a real invite.
    const hasLink = await userHasParentStudentLink(auth.userId)
    if (!hasLink) {
      return NextResponse.json({ error: 'No parent invite has been accepted for this account' }, { status: 403 })
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
