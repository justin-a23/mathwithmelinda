import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { s3 } from '../../lib/s3'
import { validateFileType, isFileTooLarge, MAX_FILE_SIZE } from '@/app/lib/fileValidation'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'
import { resolveStudentEmail } from '@/app/lib/ownership'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  // Rate limit: 20 uploads per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(`submit:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string
    const lessonId = formData.get('lessonId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // studentId lands in the S3 key, so an unchecked value from the form body
    // would let a student file work under a classmate's namespace (and `..`
    // segments would escape it entirely). Teachers may upload on a student's
    // behalf; everyone else must match their own profile email.
    if (!studentId || studentId.includes('..') || studentId.includes('/')) {
      return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 })
    }
    if (auth.role !== 'teacher') {
      const ownEmail = await resolveStudentEmail(auth.userId)
      if (!ownEmail || ownEmail.toLowerCase() !== studentId.toLowerCase()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // File size check (before reading full buffer into memory)
    if (isFileTooLarge(file.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Server-side file type validation via magic bytes
    const typeCheck = validateFileType(buffer)
    if (!typeCheck.valid) {
      return NextResponse.json(
        { error: `Unsupported file type (${typeCheck.detectedType}). Please upload a JPEG, PNG, HEIC, WebP, or PDF file.` },
        { status: 400 }
      )
    }

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
