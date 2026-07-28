import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { canReadSubmissionKey } from '@/app/lib/ownership'

const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const s3 = new S3Client({
  region: 'us-east-1',
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { key } = await request.json()

    if (typeof key !== 'string' || !key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    // The key is caller-supplied — being signed in is not enough to read it.
    if (!(await canReadSubmissionKey(auth, key))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const command = new GetObjectCommand({
      Bucket: 'mathwithmelinda-submissions',
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({ url: signedUrl })
  } catch (err) {
    console.error('Error generating signed URL:', err)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}