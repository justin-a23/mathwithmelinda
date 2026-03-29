import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

async function convertToJpeg(buffer: Buffer, contentType: string): Promise<Buffer> {
  if (contentType === 'image/heic' || contentType === 'image/heif') {
    const heicConvert = (await import('heic-convert')).default
    const converted = await heicConvert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.9
    })
    return Buffer.from(converted)
  }
  return sharp(buffer).jpeg({ quality: 90 }).toBuffer()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string
    const lessonId = formData.get('lessonId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    let uploadBuffer: Buffer
    let contentType: string
    let filename: string

    if (isPdf) {
      uploadBuffer = buffer
      contentType = 'application/pdf'
      filename = file.name
    } else {
      uploadBuffer = await convertToJpeg(buffer, file.type)
      contentType = 'image/jpeg'
      filename = file.name.replace(/\.[^.]+$/, '.jpg')
    }

    const key = `submissions/${studentId}/${lessonId}/${Date.now()}-${filename}`

    await s3.send(new PutObjectCommand({
      Bucket: 'mathwithmelinda-submissions',
      Key: key,
      Body: uploadBuffer,
      ContentType: contentType,
    }))

    return NextResponse.json({ key, url: `https://mathwithmelinda-submissions.s3.us-east-1.amazonaws.com/${key}` })
  } catch (err) {
    console.error('Error processing submission:', err)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}