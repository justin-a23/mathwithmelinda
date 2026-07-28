import type { AuthUser } from './auth'

/**
 * Pure authorization rules for S3 object keys.
 *
 * Deliberately free of imports and I/O: these are the decisions that keep one
 * student out of another's work, so they should be exercisable directly by
 * scripts/test-ownership.ts without a network or a database. The lookups that
 * feed them live in ownership.ts.
 *
 * Key shapes in `mathwithmelinda-submissions`:
 *   submissions/{studentEmail}/{lessonId}/{timestamp}-{filename}
 *   profiles/{cognitoSub}.jpg
 */

/**
 * Reduce a client-supplied string to something safe to interpolate into an S3
 * key: no separators, no traversal, no control characters.
 *
 * Allowlist rather than blocklist — the input is a filename or a lesson id
 * chosen by the uploader, and trying to spot every way of writing `../` is a
 * losing game. Dots survive so extensions are preserved, but any run of them is
 * collapsed so `..` can't form.
 */
export function sanitizeKeySegment(segment: string | null | undefined): string {
  if (!segment) return ''
  return segment
    .replace(/[^A-Za-z0-9._@-]/g, '-')  // separators and anything exotic
    .replace(/\.{2,}/g, '.')            // collapse .. so traversal can't form
    .replace(/^[.-]+/, '')              // no leading dot or dash
    .slice(0, 120)
}

/** Reject traversal, absolute keys and empties regardless of who is asking. */
export function isStructurallySafeKey(key: string): boolean {
  return !!key && !key.includes('..') && !key.startsWith('/')
}

/**
 * Case-insensitive `submissions/{email}/` prefix match.
 *
 * The trailing slash matters: without it `submissions/a@b.com` would also match
 * `submissions/a@b.com.attacker.net/...`.
 */
export function ownsSubmissionPrefix(key: string, email: string): boolean {
  if (!email) return false
  return key.toLowerCase().startsWith(`submissions/${email.toLowerCase()}/`)
}

/** A user's own avatar key, which is namespaced by Cognito sub rather than email. */
export function isOwnProfileKey(key: string, userId: string): boolean {
  return key === `profiles/${userId}.jpg`
}

/**
 * Whether `auth` may read `key` from the submissions bucket, given the set of
 * student emails they are entitled to (their own, or their children's).
 *
 * Teachers may read anything structurally valid — they grade the work.
 */
export function canReadSubmissionKeyGiven(
  auth: AuthUser,
  key: string,
  entitledEmails: string[]
): boolean {
  if (!isStructurallySafeKey(key)) return false
  if (auth.role === 'teacher') return true
  if (isOwnProfileKey(key, auth.userId)) return true
  if (auth.role !== 'student' && auth.role !== 'parent') return false
  return entitledEmails.some(email => ownsSubmissionPrefix(key, email))
}

/**
 * Whether `auth` may read `key` as an avatar.
 *
 * Constrained to the `profiles/` prefix: this bucket also holds submitted
 * student work, so an unconstrained key would turn the avatar endpoint into a
 * general reader for it.
 */
export function canReadProfileKey(auth: AuthUser, key: string): boolean {
  if (!isStructurallySafeKey(key) || !key.startsWith('profiles/')) return false
  // The teacher sees student avatars in the roster and nav.
  if (auth.role === 'teacher') return true
  return isOwnProfileKey(key, auth.userId)
}
