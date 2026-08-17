import {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NextRequest, NextResponse } from 'next/server'
import { APPSYNC_ENDPOINT } from '@/app/lib/appsync'
import outputs from '@/amplify_outputs.json'

/**
 * Instantly confirm a Cognito account created through an email-bound invite.
 *
 * The verification code exists to prove the person owns the email address they
 * typed. Invited signups never typed one: the address came from Melinda's
 * invite and the signup form locks it. Asking a 13-year-old to go find a
 * 6-digit code adds a step that proves nothing — and skipping it is where
 * signups were getting stranded (unconfirmed account, no profile, invisible
 * on every teacher page).
 *
 * Deliberately unauthenticated: it runs mid-signup, before any session exists.
 * The invite token is the credential — it was delivered to the very inbox the
 * code would have been, so possessing it is the same proof of ownership.
 *
 * Fails closed on every path: any decline or error just leaves the caller on
 * the normal code-verification step, so nothing here can block a signup.
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

const studentInviteByTokenQuery = /* GraphQL */`
  query StudentInviteByToken($filter: ModelStudentInviteFilterInput) {
    listStudentInvites(filter: $filter, limit: 1) {
      items { id email used }
    }
  }
`

const parentInviteByTokenQuery = /* GraphQL */`
  query ParentInviteByToken($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 1) {
      items { id parentEmail used }
    }
  }
`

// Invites allow publicApiKey read precisely so they can be resolved pre-auth;
// appsyncClient() is not used here because in userPool mode it requires a
// session token, which mid-signup callers do not have. The key comes from
// amplify_outputs.json, NOT the APPSYNC_API_KEY env var — that var still holds
// the Gen 1 key, and the outputs file guarantees a key that matches the
// endpoint the same build deployed against.
async function apiKeyQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': (outputs as any).data.api_key },
    body: JSON.stringify({ query, variables }),
  })
  const json: any = await res.json()
  if (json?.errors?.length) {
    throw new Error(json.errors.map((e: any) => e?.message || 'unknown error').join('; '))
  }
  return json?.data as T
}

export async function POST(req: NextRequest) {
  let token = ''
  let email = ''
  try {
    const body = await req.json()
    token = String(body?.token || '').trim()
    email = String(body?.email || '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!token || !email) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    // The token must resolve to an unused invite whose email matches the
    // account being confirmed. Email-less (link-shared) parent invites cannot
    // prove inbox ownership, so they keep the normal code step.
    const student = await apiKeyQuery<{ listStudentInvites: { items: { email: string, used: boolean | null }[] } }>(
      studentInviteByTokenQuery, { filter: { token: { eq: token } } }
    )
    let inviteEmail: string | null = null
    let used: boolean | null = null
    const sInv = student?.listStudentInvites?.items?.[0]
    if (sInv) {
      inviteEmail = sInv.email?.toLowerCase() || null
      used = sInv.used
    } else {
      const parent = await apiKeyQuery<{ listParentInvites: { items: { parentEmail: string | null, used: boolean | null }[] } }>(
        parentInviteByTokenQuery, { filter: { token: { eq: token } } }
      )
      const pInv = parent?.listParentInvites?.items?.[0]
      if (pInv) {
        inviteEmail = pInv.parentEmail?.toLowerCase() || null
        used = pInv.used
      }
    }

    if (!inviteEmail || used === true || inviteEmail !== email) {
      return NextResponse.json({ ok: false }, { status: 403 })
    }

    const cognito = makeCognitoClient()
    const found = await cognito.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    }))
    const user = found.Users?.[0]
    if (!user?.Username) return NextResponse.json({ ok: false }, { status: 404 })

    // Already confirmed (a retry, or a race) is success, not an error — the
    // caller's next step either way is to sign in.
    if (user.UserStatus === 'UNCONFIRMED') {
      await cognito.send(new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.Username,
      }))
    } else if (user.UserStatus !== 'CONFIRMED') {
      return NextResponse.json({ ok: false }, { status: 409 })
    }
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: user.Username,
      UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
    }))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('invite-confirm failed:', err?.message || err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
