import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const s3 = new S3Client({ region: 'us-east-1' })

const BUCKET = 'mathwithmelinda-submissions'

// GET /api/profile-pic?key=profiles/... — returns a signed read URL
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Profile pic GET error:', err)
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}

// POST /api/profile-pic — multipart upload, saves to S3 server-side
export async function POST(request: NextRequest) {
  let step = 'parse formData'
  try {
    const formData = await request.formData()

    step = 'get file/userId'
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) return NextResponse.json({ error: 'Missing file in form data' }, { status: 400 })
    if (!userId) return NextResponse.json({ error: 'Missing userId in form data' }, { status: 400 })

    step = 'read file buffer'
    const buffer = Buffer.from(await file.arrayBuffer())

    step = 'upload to S3'
    const key = 'profiles/' + userId + '.jpg'
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }))

    return NextResponse.json({ key })
  } catch (err: any) {
    console.error(`Profile pic POST error at step [${step}]:`, err)
    return NextResponse.json({ error: `[${step}] ${err?.message || 'Unknown error'}` }, { status: 500 })
  }
}
