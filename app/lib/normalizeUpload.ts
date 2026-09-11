/**
 * Shared upload normalization: PDFs pass through, HEIC/HEIF (iPhone) converts
 * to JPEG, everything else uploads as-is. Extracted from /api/submit and
 * /api/mobile-upload when /api/ticket-upload became the third copy.
 *
 * Callers must run validateFileType (magic bytes) BEFORE this — it trusts
 * that the buffer is one of the allowed types.
 */
export async function normalizeUploadFile(
  file: File,
  buffer: Buffer
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const lowerName = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf')
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
    || lowerName.endsWith('.heic') || lowerName.endsWith('.heif')

  if (isPdf) {
    return { buffer, contentType: 'application/pdf', filename: file.name }
  }
  if (isHeic) {
    // Dynamic import keeps heic-convert lazy — it is heavy and most uploads
    // never need it.
    const heicConvert = (await import('heic-convert')).default
    const converted = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 })
    return {
      buffer: Buffer.from(converted),
      contentType: 'image/jpeg',
      filename: file.name.replace(/\.[^.]+$/, '.jpg'),
    }
  }
  // JPG, PNG, WebP — upload directly, no processing needed
  return { buffer, contentType: file.type || 'image/jpeg', filename: file.name }
}
