import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/app/lib/uploadToken'

/**
 * Token validation endpoint for the phone snap page.
 * No Cognito auth required — the token is the credential.
 * Returns whether the token is valid + remaining upload count.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'Missing token' })
  }

  const result = await validateToken(token)

  return NextResponse.json({
    valid: result.valid,
    reason: result.reason,
    remainingUploads: result.remainingUploads,
  })
}
