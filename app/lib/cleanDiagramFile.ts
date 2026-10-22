import { cleanDiagram, grayToRGBA, looksLikePhoto } from './cleanDiagram'

/** Long edge the photo is scaled to before cleaning; keeps it well under a second */
const WORK_MAX = 2400
/** Width of the saved image; prints sharp at the 520px work-surface width */
const OUT_MAX_WIDTH = 1600

/**
 * Browser-side: return a cleaned-up JPEG of a diagram photo, or null when the
 * image is already clean (white background) or can't be decoded. Never throws,
 * so a failure just means the original gets uploaded as before.
 */
export async function cleanDiagramFile(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, WORK_MAX / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale)
    const work = document.createElement('canvas')
    work.width = w; work.height = h
    const ctx = work.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const pixels = ctx.getImageData(0, 0, w, h)
    if (!looksLikePhoto(pixels)) return null

    const cleaned = cleanDiagram(pixels)
    const full = document.createElement('canvas')
    full.width = cleaned.width; full.height = cleaned.height
    full.getContext('2d')!.putImageData(new ImageData(grayToRGBA(cleaned), cleaned.width, cleaned.height), 0, 0)

    const outScale = Math.min(1, OUT_MAX_WIDTH / cleaned.width)
    const out = document.createElement('canvas')
    out.width = Math.round(cleaned.width * outScale); out.height = Math.round(cleaned.height * outScale)
    const octx = out.getContext('2d')!
    octx.imageSmoothingQuality = 'high'
    octx.drawImage(full, 0, 0, out.width, out.height)

    const blob = await new Promise<Blob | null>(res => out.toBlob(res, 'image/jpeg', 0.88))
    if (!blob) return null
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '-clean.jpg', { type: 'image/jpeg' })
  } catch (err) {
    console.warn('Diagram cleanup skipped:', err)
    return null
  }
}
