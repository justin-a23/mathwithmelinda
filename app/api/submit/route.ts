import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { s3 } from '../../lib/s3'

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
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
      || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    let uploadBuffer: Buffer
    let contentType: string
    let filename: string

    if (isPdf) {
      // Upload PDF as-is
      uploadBuffer = buffer
      contentType = 'application/pdf'
      filename = file.name
    } else if (isHeic) {
      // Convert HEIC/HEIF to JPEG (iPhone format)
      const heicConvert = (await import('heic-convert')).default
      const converted = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 })
      uploadBuffer = Buffer.from(converted)
      contentType = 'image/jpeg'
      filename = file.name.replace(/\.[^.]+$/, '.jpg')
    } else {
      // JPG, PNG, etc — upload directly, no processing needed
      uploadBuffer = buffer
      contentType = file.type || 'image/jpeg'
      filename = file.name
    }

    const key = `submissions/${studentId}/${lessonId}/${Date.now()}-${filename}`

    await s3.send(new PutObjectCommand({
      Bucket: 'mathwithmelinda-submissions',
      Key: key,
      Body: uploadBuffer,
      ContentType: contentType,
    }))

    return NextResponse.json({ key, url: `https://mathwithmelinda-submissions.s3.us-east-1.amazonaws.com/${key}` })
  } catch (err: any) {
    console.error('Error processing submission:', err)
    // Surface actionable error details — S3 credential issues show up here in production
    const message = err?.message || err?.name || 'Failed to process upload'
    const code = err?.name || err?.Code || ''
    if (code === 'CredentialsProviderError' || message.includes('credentials') || message.includes('Could not load')) {
      return NextResponse.json({ error: 'Server configuration error: AWS credentials not set. Contact your administrator.' }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
