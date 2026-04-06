import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { NextRequest, NextResponse } from 'next/server'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || 'u1tcs496gjon44dpcqdjfr1bd',
})

export type AuthUser = {
  userId: string
  groups: string[]
  role: 'teacher' | 'student' | 'parent' | 'unknown'
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await verifier.verify(token)
    const groups: string[] = (payload['cognito:groups'] as string[]) || []
    let role: AuthUser['role'] = 'unknown'
    if (groups.includes('teacher')) role = 'teacher'
    else if (groups.includes('parent')) role = 'parent'
    else if (groups.includes('student')) role = 'student'
    return { userId: payload.sub, groups, role }
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
