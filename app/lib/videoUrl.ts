/**
 * Lesson videos are stored as raw S3 keys ("prealgebra/Pre Algebra - Lesson 15
 * - Applications of %.mp4") and played through CloudFront. The key must be
 * URL-encoded per segment: filenames carry spaces, ampersands, commas — and in
 * the percent unit, literal % signs, which make a raw interpolated URL an
 * invalid percent-escape that CloudFront rejects with 400 (video silently
 * refuses to play; first hit by a Pre-Algebra student on Lesson 15).
 *
 * Already-absolute http(s) URLs pass through untouched.
 */

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

export function playableVideoUrl(v: string): string {
  if (/^https?:\/\//.test(v)) return v
  return CLOUDFRONT_URL + '/' + v.split('/').map(encodeURIComponent).join('/')
}
