import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { s3 } from '@/app/lib/s3'
import { validateToken, incrementUploadCount } from '@/app/lib/uploadToken'
import { validateFileType, isFileTooLarge, MAX_FILE_SIZE } from '@/app/lib/fileValidation'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'

/**
 * Mobile upload endpoint — authenticated by upload token, NOT Cognito.
 * The phone has no Cognito session; the token IS the authorization.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing upload token' }, { status: 401 })
  }

  // Rate limit: 20 uploads per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(`mobile:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 })
  }

  // Validate the upload token
  const tokenCheck = await validateToken(token)
  if (!tokenCheck.valid) {
    const status = tokenCheck.reason === 'Token expired' ? 410 : 401
    return NextResponse.json({ error: tokenCheck.reason }, { status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File size check
    if (isFileTooLarge(file.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Magic-byte file type validation
    const typeCheck = validateFileType(buffer)
    if (!typeCheck.valid) {
      return NextResponse.json(
        { error: `Unsupported file type. Please upload a photo or PDF.` },
        { status: 400 }
      )
    }

    // HEIC → JPEG conversion (same logic as /api/submit)
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
      || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    let uploadBuffer: Buffer
    let contentType: string
    let filename: string

    if (isPdf) {
      uploadBuffer = buffer
      contentType = 'application/pdf'
      filename = file.name
    } else if (isHeic) {
      const heicConvert = (await import('heic-convert')).default
      const converted = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 })
      uploadBuffer = Buffer.from(converted)
      contentType = 'image/jpeg'
      filename = file.name.replace(/\.[^.]+$/, '.jpg')
    } else {
      uploadBuffer = buffer
      contentType = file.type || 'image/jpeg'
      filename = file.name
    }

    // S3 key: same pattern as /api/submit for consistency
    const { studentId, lessonId } = tokenCheck
    const key = `submissions/${studentId}/${lessonId}/${Date.now()}-${filename}`

    await s3.send(new PutObjectCommand({
      Bucket: 'mathwithmelinda-submissions',
      Key: key,
      Body: uploadBuffer,
      ContentType: contentType,
    }))

    // Atomically increment upload count (rejects if maxUploads exceeded)
    const incremented = await incrementUploadCount(token, key)
    if (!incremented) {
      // Rare race condition — file already uploaded to S3 but token maxed out.
      // The file is harmless in S3; just tell the client they're done.
      return NextResponse.json({ error: 'Maximum uploads reached' }, { status: 409 })
    }

    return NextResponse.json({ key, success: true })
  } catch (err: any) {
    console.error('Error in mobile upload:', err)
    const message = err?.message || 'Failed to process upload'
    if (message.includes('credentials') || message.includes('Could not load')) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
