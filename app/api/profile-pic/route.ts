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
    const { action, userId, key } = await request.json()

    if (action === 'upload') {
      const profileKey = 'profiles/' + userId + '.jpg'
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: profileKey,
        ContentType: 'image/jpeg',
      })
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
      return NextResponse.json({ signedUrl, key: profileKey })
    }

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
