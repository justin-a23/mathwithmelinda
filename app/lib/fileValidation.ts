/**
 * Server-side file validation: magic-byte type detection + size enforcement.
 * Used by /api/submit and /api/mobile-upload to reject bad files before S3 upload.
 */

export const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

const SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], },     // RIFF (WebP starts with RIFF....WEBP)
]

/** Check if buffer matches a HEIC/HEIF file (ftyp box with heic/heix/mif1 brand) */
function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  // HEIC files have 'ftyp' at offset 4
  if (buffer[4] !== 0x66 || buffer[5] !== 0x74 || buffer[6] !== 0x79 || buffer[7] !== 0x70) return false
  // Check major brand at offset 8: heic, heix, mif1, msf1
  const brand = buffer.subarray(8, 12).toString('ascii')
  return ['heic', 'heix', 'mif1', 'msf1'].includes(brand)
}

export type FileTypeResult = {
  valid: boolean
  detectedType: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'image/webp']

/**
 * Validate file type by inspecting magic bytes. Does NOT trust Content-Type header.
 * Returns detected MIME type and whether it's in the allowed list.
 */
export function validateFileType(buffer: Buffer): FileTypeResult {
  if (buffer.length < 12) {
    return { valid: false, detectedType: 'unknown (too small)' }
  }

  // Check HEIC first (special detection)
  if (isHeic(buffer)) {
    return { valid: true, detectedType: 'image/heic' }
  }

  // Check standard signatures
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0
    const match = sig.bytes.every((byte, i) => buffer[offset + i] === byte)
    if (match) {
      // Extra check for WebP: bytes 8-11 must be 'WEBP'
      if (sig.type === 'image/webp') {
        const webpTag = buffer.subarray(8, 12).toString('ascii')
        if (webpTag !== 'WEBP') continue
      }
      return { valid: ALLOWED_TYPES.includes(sig.type), detectedType: sig.type }
    }
  }

  return { valid: false, detectedType: 'unknown' }
}

/**
 * Check file size against the max limit. Call this BEFORE reading the full buffer
 * when possible (e.g. from Content-Length header or File.size).
 */
export function isFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > MAX_FILE_SIZE
}
