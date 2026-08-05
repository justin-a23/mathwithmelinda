import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { NextRequest, NextResponse } from 'next/server'
import { roleFromGroups, type Role } from './roles'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || 'u1tcs496gjon44dpcqdjfr1bd',
})

export type AuthUser = {
  userId: string
  groups: string[]
  role: Role
  /**
   * The raw, already-verified access token.
   *
   * Kept so server routes can authenticate to AppSync AS THE CALLER rather than
   * with the shared API key — required under Gen 2, whose per-model rules grant
   * teacher work to `group('teacher')` and deny the key outright. See
   * app/lib/appsync.ts.
   */
  token: string
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await verifier.verify(token)
    const groups: string[] = (payload['cognito:groups'] as string[]) || []
    // roleFromGroups is the single source of truth shared with the client:
    // group-less users ARE students (self-signup assigns no Cognito group).
    // This used to be an inline copy that mapped group-less to 'unknown' —
    // which the ownership checks deny across the board, so every real student
    // silently 403'd on their own submission previews while the client happily
    // treated them as students. `groups` is returned unchanged, so a route
    // that needs to tell admin from teacher can still check it.
    return { userId: payload.sub, groups, role: roleFromGroups(groups), token }
  } catch {
    return null
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/** Returns AuthUser or a NextResponse error. Caller must check: if (result instanceof NextResponse) return result */
export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await verifyAuth(request)
  if (!user) return unauthorized()
  return user
}

/** Teacher-only. Returns AuthUser or a NextResponse error. */
export async function requireTeacher(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await verifyAuth(request)
  if (!user) return unauthorized()
  if (user.role !== 'teacher') return forbidden()
  return user
}
