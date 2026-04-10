/**
 * In-memory sliding-window rate limiter.
 * Keyed by an identifier (IP address, userId, etc).
 * Fine for ~50 concurrent students — no Redis needed.
 */

import { NextRequest } from 'next/server'

type WindowEntry = { timestamps: number[] }

const windows = new Map<string, WindowEntry>()

// Cleanup stale entries every 5 minutes to prevent slow memory growth
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, entry] of windows) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    if (entry.timestamps.length === 0) windows.delete(key)
  }
}

/**
 * Check if a request is within the rate limit.
 * @returns true if the request is ALLOWED, false if it should be REJECTED.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  cleanup(windowMs)

  const entry = windows.get(key) ?? { timestamps: [] }
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > now - windowMs)

  if (entry.timestamps.length >= limit) {
    return false // rate limited
  }

  entry.timestamps.push(now)
  windows.set(key, entry)
  return true // allowed
}

/** Extract client IP from a Next.js request (handles x-forwarded-for from CDN/proxy). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}
