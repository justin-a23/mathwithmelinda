/**
 * The one definition of "waiting on the teacher to grade".
 *
 * A returned submission has no grade, but it is waiting on the STUDENT to
 * resubmit (resubmitting flips status back to 'submitted'), so it must not
 * count. The nav badge excluded returned rows while the Grade Work page did
 * not, and the two numbers disagreed (ticket 69532449).
 */
export function needsGrading(s: { grade?: string | null; status?: string | null; isArchived?: boolean | null }): boolean {
  return !s.grade && s.status !== 'returned' && !s.isArchived
}

/** Pages that change grades fire this so TeacherNav refreshes its badge now. */
export const NAV_COUNTS_EVENT = 'mwm:nav-counts'

export function refreshNavCounts() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NAV_COUNTS_EVENT))
}
