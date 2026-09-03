/**
 * Lesson titles imported from the markdown library already carry their own
 * "Lesson 8.1 — " prefix (the full heading is stored as the title). Surfaces
 * that decorate titles with a "Lesson {N} — " prefix of their own were
 * doubling it: "Lesson 8.1 — Lesson 8.1 — Properties of Equality…".
 *
 * Every place that composes a display title or a filename from a lesson
 * number + title goes through these two helpers so the prefix appears
 * exactly once, whatever shape the stored title has.
 */

/** Title for display: prefixes "Lesson {num} — " only when the stored title
 * doesn't already announce itself as a lesson. */
export function lessonDisplayTitle(
  num: number | string | null | undefined,
  title: string | null | undefined
): string {
  const t = (title || '').trim()
  const hasNum = num !== null && num !== undefined && num !== ''
  if (!t) return hasNum ? `Lesson ${num}` : 'Lesson'
  if (/^lesson\s/i.test(t)) return t
  return hasNum ? `Lesson ${num} — ${t}` : t
}

/** Bare title with any leading "Lesson {N} —/-/:" stripped — for callers that
 * add their own number, like the video filename builders. */
export function lessonBareTitle(title: string | null | undefined): string {
  const stripped = (title || '').replace(/^\s*lesson\s+[\d.]+[a-z]?\s*[—–:-]\s*/i, '').trim()
  return stripped || (title || '').trim()
}
