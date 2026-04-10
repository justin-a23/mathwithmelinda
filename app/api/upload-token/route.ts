import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { createToken } from '@/app/lib/uploadToken'
import { checkRateLimit } from '@/app/lib/rateLimit'

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

    // studentId comes from the auth token, not the client — cannot be spoofed
    const token = await createToken(auth.userId, lessonId)

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
