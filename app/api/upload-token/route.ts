import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { createToken } from '@/app/lib/uploadToken'
import { checkRateLimit } from '@/app/lib/rateLimit'
import { resolveStudentEmail } from '@/app/lib/ownership'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  // Rate limit: 5 token creations per minute per user
  if (!checkRateLimit(`token:${auth.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many token requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const { lessonId } = await request.json()
    if (!lessonId || typeof lessonId !== 'string') {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // The identity baked into the token becomes the S3 key's owner segment, so
    // it must match what /api/submit uses (the student's email) — otherwise
    // phone uploads land under a different namespace than computer uploads and
    // the student's own preview reads 403. Resolved server-side from the auth
    // token, not the client — cannot be spoofed. Falls back to the sub for
    // teachers (who have no student profile) and legacy safety.
    const ownEmail = auth.role === 'teacher' ? null : await resolveStudentEmail(auth.token, auth.userId)
    const token = await createToken(ownEmail || auth.userId, lessonId)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mathwithmelinda.com'
    const snapUrl = `${baseUrl}/snap?token=${token.tokenId}`

    return NextResponse.json({
      tokenId: token.tokenId,
      expiresAt: token.expiresAt,
      maxUploads: token.maxUploads,
      url: snapUrl,
    })
  } catch (err: any) {
    console.error('Error creating upload token:', err)
    return NextResponse.json({ error: 'Failed to create upload token' }, { status: 500 })
  }
}
