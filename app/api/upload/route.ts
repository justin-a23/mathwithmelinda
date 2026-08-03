import { PutObjectCommand } from '@aws-sdk/client-s3'
import { presign } from '@/app/lib/presign'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
// The shared client resolves MWM_* credentials first — Amplify blocks AWS_-prefixed
// env vars, so a client built from AWS_ACCESS_KEY_ID alone has no usable identity
// in production and every presigned URL it signs is rejected. This route was the
// last one still doing that; localhost hid it because .env.local defines AWS_*.
import { s3, VIDEOS_BUCKET } from '@/app/lib/s3'

export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { filename, contentType, course } = await request.json()
    
    const key = `${course}/${filename}`
    
    const command = new PutObjectCommand({
      Bucket: VIDEOS_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const signedUrl = await presign(s3, command, { expiresIn: 3600 })

    return NextResponse.json({ signedUrl, key })
  } catch (err) {
    console.error('Error generating signed URL:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}