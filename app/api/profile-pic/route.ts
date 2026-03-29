import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

const BUCKET = 'mathwithmelinda-submissions'

// GET /api/profile-pic?key=profiles/... — returns a signed read URL
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Profile pic GET error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST /api/profile-pic — multipart upload, saves to S3 server-side
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = 'profiles/' + userId + '.jpg'

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }))

    return NextResponse.json({ key })
  } catch (err: any) {
    console.error('Profile pic POST error:', err)
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}
