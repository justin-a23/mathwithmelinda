import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const s3 = new S3Client({
  region: 'us-east-1',
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
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