import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

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