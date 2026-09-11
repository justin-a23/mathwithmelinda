/**
 * Shared vocabulary for the IT ticket system: the form, list, detail page,
 * and email builder all read from here so labels never drift.
 */

// Deliberately a hardcoded constant, not an env var: the client needs it, so
// an env var would be NEXT_PUBLIC_ and baked into the bundle anyway — and a
// server var would have to be added to the amplify.yml env grep or it would
// silently be undefined in production.
export const SUPPORT_INBOX = 'jsa.all@me.com'

export type TicketCategory = 'broken' | 'improvement' | 'question' | 'other'
export type TicketSeverity = 'critical' | 'important' | 'nice-to-have'
export type TicketStatus = 'new' | 'in_progress' | 'waiting_on_reporter' | 'resolved' | 'closed'

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  broken: "Something's broken",
  improvement: 'Suggest an improvement',
  question: 'I have a question',
  other: 'Something else',
}

export const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  critical: "Critical — I can't work",
  important: 'Important',
  'nice-to-have': 'Nice to have',
}

// Status is a free string in the schema (so an automated triage agent can add
// states without a deploy); unknown values fall back to the raw string in the
// UI rather than breaking.
export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In progress',
  waiting_on_reporter: 'Waiting on you',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const OPEN_STATUSES = ['new', 'in_progress', 'waiting_on_reporter']

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

/** Teacher pages offered in the "Which page were you on?" dropdown. */
export const KNOWN_PAGES: { value: string; label: string }[] = [
  { value: '/teacher', label: 'Dashboard' },
  { value: '/teacher/grades', label: 'Grade Work' },
  { value: '/teacher/gradebook', label: 'Gradebook' },
  { value: '/teacher/messages', label: 'Messages' },
  { value: '/teacher/students', label: 'Students' },
  { value: '/teacher/schedule', label: 'Schedule Week' },
  { value: '/teacher/plans', label: 'Assigned Work' },
  { value: '/teacher/library', label: 'Lesson Library' },
  { value: '/teacher/semesters', label: 'Academic Years' },
  { value: '/teacher/report-card', label: 'Report Card' },
  { value: '/teacher/upload', label: 'Upload Video' },
  { value: '/teacher/profile', label: 'My Profile' },
]

export type SupportTicket = {
  id: string
  requesterId: string
  requesterName: string | null
  requesterEmail: string | null
  category: string
  severity: string
  title: string
  description: string
  pageUrl: string | null
  stepsTaken: string | null
  actualBehavior: string | null
  expectedBehavior: string | null
  screenshotKeys: string | null
  status: string
  resolutionSummary: string | null
  resolvedAt: string | null
  submittedAt: string
}

export type SupportTicketNote = {
  id: string
  ticketId: string
  authorId: string
  authorName: string | null
  body: string
  createdAtIso: string
}

export function parseScreenshotKeys(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(k => typeof k === 'string') : []
  } catch {
    return []
  }
}
