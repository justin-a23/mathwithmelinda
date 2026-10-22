/**
 * Make a phone photo of a textbook diagram print like a photocopy: gray paper
 * becomes white, lines become black, empty margins are trimmed.
 *
 * Pure pixel math on RGBA data, so the browser (canvas ImageData, used by the
 * lesson editor's "Add image") and Node scripts (sharp raw output, used by the
 * one-time backfill) produce identical results. No native deps on the server,
 * nothing that can hit Amplify's 30s route limit.
 *
 * Steps:
 *   1. Grayscale.
 *   2. Flatten lighting: estimate the paper brightness per region (bright
 *      percentile of each tile, smoothed) and divide it out, so a shadow in one
 *      corner doesn't stay gray.
 *   3. Levels: near-paper → pure white (this also drops faint bleed-through
 *      from the other side of the page), ink → black, gentle ramp between so
 *      light marks and anti-aliased edges survive. Not a hard threshold.
 *   4. Trim to the ink plus a small margin.
 */

export type RGBAImage = { width: number; height: number; data: Uint8ClampedArray | Uint8Array }
export type GrayImage = { width: number; height: number; data: Uint8ClampedArray }

/**
 * Relative brightness (pixel ÷ local paper) at or above this → white. 0.82
 * erased the printed gridlines on blank graphs (they're as faint as page
 * bleed-through); 0.92 keeps the grid and leaves bleed-through barely visible.
 */
const WHITE_POINT = 0.92
/** At or below this → black */
const BLACK_POINT = 0.45
/** Output value below which a pixel counts as ink when trimming */
const INK = 160
/** Tile size for the paper-brightness estimate */
const TILE = 32

/**
 * True for a photo of paper (gray or tinted background) that cleanup helps.
 * False for scans/screenshots whose background is already white: those gain
 * nothing, and some carry meaningful color (highlighted triangles) that
 * grayscale would erase. Measured on the 36 diagrams live in Oct 2026: phone
 * photos' paper sat at 197–231, every clean scan at 255.
 */
export function looksLikePhoto(img: RGBAImage): boolean {
  const n = img.width * img.height
  const hist = new Uint32Array(256)
  // Sample every 4th pixel; plenty for a percentile
  let count = 0
  for (let i = 0; i < n; i += 4) {
    const d = img.data
    hist[Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2])]++
    count++
  }
  let target = count * 0.9
  let v = 0
  while (v < 255 && target > hist[v]) { target -= hist[v]; v++ }
  return v < 245
}

export function cleanDiagram(img: RGBAImage): GrayImage {
  const { width: w, height: h, data } = img
  const n = w * h

  const gray = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  }

  // Paper brightness per tile: the 90th percentile, so a tile with lines in it
  // still reads as paper. Then a 3×3 box blur across tiles to smooth seams.
  const tw = Math.ceil(w / TILE)
  const th = Math.ceil(h / TILE)
  const tiles = new Float32Array(tw * th)
  const hist = new Uint32Array(256)
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      hist.fill(0)
      let count = 0
      for (let y = ty * TILE; y < Math.min(h, (ty + 1) * TILE); y++) {
        for (let x = tx * TILE; x < Math.min(w, (tx + 1) * TILE); x++) {
          hist[Math.round(gray[y * w + x])]++
          count++
        }
      }
      let target = count * 0.9
      let v = 0
      while (v < 255 && target > hist[v]) { target -= hist[v]; v++ }
      tiles[ty * tw + tx] = v
    }
  }
  const smooth = new Float32Array(tw * th)
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      let sum = 0, c = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = ty + dy, xx = tx + dx
          if (yy >= 0 && yy < th && xx >= 0 && xx < tw) { sum += tiles[yy * tw + xx]; c++ }
        }
      }
      // Floor keeps an all-ink tile (solid black region) from being "paper"
      smooth[ty * tw + tx] = Math.max(sum / c, 96)
    }
  }

  // Bilinear paper estimate at each pixel, then levels
  const out = new Uint8ClampedArray(n)
  for (let y = 0; y < h; y++) {
    const fy = Math.min(Math.max((y + 0.5) / TILE - 0.5, 0), th - 1)
    const y0 = Math.floor(fy), y1 = Math.min(y0 + 1, th - 1), wy = fy - y0
    for (let x = 0; x < w; x++) {
      const fx = Math.min(Math.max((x + 0.5) / TILE - 0.5, 0), tw - 1)
      const x0 = Math.floor(fx), x1 = Math.min(x0 + 1, tw - 1), wx = fx - x0
      const paper =
        (smooth[y0 * tw + x0] * (1 - wx) + smooth[y0 * tw + x1] * wx) * (1 - wy) +
        (smooth[y1 * tw + x0] * (1 - wx) + smooth[y1 * tw + x1] * wx) * wy
      const rel = gray[y * w + x] / paper
      const t = (rel - BLACK_POINT) / (WHITE_POINT - BLACK_POINT)
      out[y * w + x] = t <= 0 ? 0 : t >= 1 ? 255 : Math.round(255 * t)
    }
  }

  return trim({ width: w, height: h, data: out })
}

/** Crop to the bounding box of ink, keeping a margin. Unchanged if there's no ink. */
function trim(img: GrayImage): GrayImage {
  const { width: w, height: h, data } = img
  // A row/column needs a few ink pixels to count, so specks don't stop the trim
  const minInk = 3
  const rowInk = (y: number) => { let c = 0; for (let x = 0; x < w; x++) if (data[y * w + x] < INK) c++; return c >= minInk }
  const colInk = (x: number) => { let c = 0; for (let y = 0; y < h; y++) if (data[y * w + x] < INK) c++; return c >= minInk }
  let top = 0; while (top < h && !rowInk(top)) top++
  if (top === h) return img
  let bottom = h - 1; while (bottom > top && !rowInk(bottom)) bottom--
  let left = 0; while (left < w && !colInk(left)) left++
  let right = w - 1; while (right > left && !colInk(right)) right--

  const margin = Math.round(Math.max(w, h) * 0.02)
  top = Math.max(0, top - margin); bottom = Math.min(h - 1, bottom + margin)
  left = Math.max(0, left - margin); right = Math.min(w - 1, right + margin)
  const cw = right - left + 1, ch = bottom - top + 1
  const cropped = new Uint8ClampedArray(cw * ch)
  for (let y = 0; y < ch; y++) {
    cropped.set(data.subarray((top + y) * w + left, (top + y) * w + left + cw), y * cw)
  }
  return { width: cw, height: ch, data: cropped }
}

/** Expand a grayscale result back to RGBA (for canvas putImageData). */
export function grayToRGBA(img: GrayImage): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(img.width * img.height * 4)
  for (let i = 0; i < img.data.length; i++) {
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = img.data[i]
    out[i * 4 + 3] = 255
  }
  return out
}
