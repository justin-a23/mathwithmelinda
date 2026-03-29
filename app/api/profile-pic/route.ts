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

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Server-side upload: client sends the image blob directly
    if (contentType.startsWith('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const userId = formData.get('userId') as string | null
      if (!file || !userId) {
        return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const profileKey = 'profiles/' + userId + '.jpg'
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: profileKey,
        Body: buffer,
        ContentType: 'image/jpeg',
      }))
      return NextResponse.json({ key: profileKey })
    }

    // JSON actions: view (get signed read URL)
    const { action, key } = await request.json()

    if (action === 'view') {
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
      return NextResponse.json({ url: signedUrl })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Profile pic error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
