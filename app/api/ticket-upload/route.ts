import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { s3, SUBMISSIONS_BUCKET } from '@/app/lib/s3'
import { validateFileType, isFileTooLarge, MAX_FILE_SIZE } from '@/app/lib/fileValidation'
import { checkRateLimit } from '@/app/lib/rateLimit'
import { normalizeUploadFile } from '@/app/lib/normalizeUpload'
import { sanitizeKeySegment } from '@/app/lib/ownershipRules'

/**
 * Screenshot upload for IT tickets. Staff-only in Phase 1.
 *
 * Keys land under tickets/{sub}/ — the sub (not email) so desktop uploads and
 * phone-QR uploads (whose tokens are teacher-minted with the sub as owner)
 * share one namespace. Viewing goes through /api/view-submission, whose
 * ownership rules already allow staff to read any structurally valid key and
 * deny students/parents anything outside submissions/{their email}/.
 */
export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  if (!checkRateLimit(`ticket-upload:${auth.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (isFileTooLarge(file.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const typeCheck = validateFileType(buffer)
    if (!typeCheck.valid) {
      return NextResponse.json(
        { error: `Unsupported file type (${typeCheck.detectedType}). Please upload a JPEG, PNG, HEIC, WebP, or PDF file.` },
        { status: 400 }
      )
    }

    const { buffer: uploadBuffer, contentType, filename } = await normalizeUploadFile(file, buffer)

    const safeFilename = sanitizeKeySegment(filename) || 'screenshot'
    const key = `tickets/${sanitizeKeySegment(auth.userId)}/${Date.now()}-${safeFilename}`

    await s3.send(new PutObjectCommand({
      Bucket: SUBMISSIONS_BUCKET,
      Key: key,
      Body: uploadBuffer,
      ContentType: contentType,
    }))

    return NextResponse.json({ key })
  } catch (err: any) {
    console.error('Error in ticket upload:', err)
    const message = err?.message || 'Failed to process upload'
    if (message.includes('credentials') || message.includes('Could not load')) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
