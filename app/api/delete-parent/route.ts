import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'

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
const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

async function appsync(query: string, variables: Record<string, unknown>) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

const deleteParentProfileMutation = /* GraphQL */`
  mutation DeleteParentProfile($input: DeleteParentProfileInput!) {
    deleteParentProfile(input: $input) { id }
  }
`

const deleteParentStudentMutation = /* GraphQL */`
  mutation DeleteParentStudent($input: DeleteParentStudentInput!) {
    deleteParentStudent(input: $input) { id }
  }
`

const deleteParentStudentLinkMutation = /* GraphQL */`
  mutation DeleteParentStudentLink($input: DeleteParentStudentLinkInput!) {
    deleteParentStudentLink(input: $input) { id }
  }
`

const listParentStudentLinksByProfileQuery = /* GraphQL */`
  query ListParentStudentLinks($filter: ModelParentStudentLinkFilterInput) {
    listParentStudentLinks(filter: $filter, limit: 50) {
      items { id }
    }
  }
`

async function findCognitoUsername(cognito: CognitoIdentityProviderClient, sub: string): Promise<string | null> {
  const result = await cognito.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `sub = "${sub}"`,
    Limit: 1,
  }))
  return result.Users?.[0]?.Username ?? null
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  // userId = Cognito sub (from ParentStudent.parentId or ParentProfile.userId)
  // profileId = ParentProfile.id (may be null if no profile record exists)
  // parentStudentIds = all ParentStudent record IDs to delete
  const { userId, profileId, parentStudentIds = [] } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  let cognitoDeleted = false
  let cognitoError = ''

  // 1. Delete from Cognito
  try {
    const cognito = makeCognitoClient()
    const cognitoUsername = await findCognitoUsername(cognito, userId)
    if (!cognitoUsername) {
      cognitoDeleted = true
      console.log('Cognito parent not found by sub — may already be deleted:', userId)
    } else {
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername }))
      cognitoDeleted = true
      console.log('Cognito parent deleted:', cognitoUsername)
    }
  } catch (err: any) {
    cognitoError = err?.message || 'Cognito deletion failed'
    console.error('Cognito parent deletion failed:', cognitoError)
  }

  // 2. Delete all ParentStudent link records
  for (const id of parentStudentIds) {
    try {
      await appsync(deleteParentStudentMutation, { input: { id } })
    } catch (err) {
      console.error('Error deleting ParentStudent:', id, err)
    }
  }

  // 3. Delete ParentProfile + any ParentStudentLink records (if profile exists)
  if (profileId) {
    try {
      // Delete ParentStudentLink records that reference this parent profile
      const linkData = await appsync(listParentStudentLinksByProfileQuery, {
        filter: { parentProfileId: { eq: profileId } }
      })
      const links: { id: string }[] = linkData.listParentStudentLinks.items
      for (const link of links) {
        try {
          await appsync(deleteParentStudentLinkMutation, { input: { id: link.id } })
        } catch (err) {
          console.error('Error deleting ParentStudentLink:', link.id, err)
        }
      }
    } catch (err) {
      console.error('Error listing ParentStudentLinks:', err)
    }

    try {
      await appsync(deleteParentProfileMutation, { input: { id: profileId } })
    } catch (err: any) {
      console.error('Error deleting ParentProfile:', err)
      return NextResponse.json({ error: err.message || 'Failed to delete parent profile' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, cognitoDeleted, cognitoError: cognitoError || null })
}
