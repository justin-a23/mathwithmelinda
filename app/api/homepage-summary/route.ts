import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { machineToken, gqlClient, listAll } from '@/app/lib/machineAuth'
import { needsGrading } from '@/app/lib/needsGrading'

/**
 * Read-only status feed for Melinda's NAS dashboard (Homepage's customapi
 * widget polls it about once a minute from the tailnet).
 *
 * Returns per-class progress plus the teacher queue, counts only, no student
 * names: this response leaves the platform for a self-hosted dashboard whose
 * config files are plain YAML. The caller proves itself with the shared
 * HOMEPAGE_SUMMARY_KEY header (same timing-safe check as the cron secret), and
 * the data is read as the group-less machine user, so even a leaked key can
 * only read what a student-tier session could.
 *
 * Shape (stable, the dashboard's mappings depend on it):
 *   { generatedAt, week: { monday, label },
 *     queue: { toGrade, unread, pending },
 *     courses: { algebra1: { name, weekNumber, totalWeeks, weekLabel, yearPercent,
 *                           lessonsThisWeek, expected, turnedIn, turnedInLabel,
 *                           toGrade, unread, lessonsScheduled, lessonsTotal, lessonsLabel }, ... } }
 * Course keys are the title with everything but letters and digits removed,
 * lower-cased, so they match the S3 video folder names.
 */

export const dynamic = 'force-dynamic'

const CACHE_MS = 45_000
let cache: { at: number; body: Summary } | null = null

function keyOk(req: NextRequest): boolean {
  const expected = process.env.HOMEPAGE_SUMMARY_KEY
  const got = req.headers.get('x-homepage-key')
  if (!expected || !got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ── Queries (all readable by the group-less machine user) ────────────────────
const LIST_COURSES = /* GraphQL */ `
  query C($nextToken: String) {
    listCourses(limit: 100, nextToken: $nextToken) { items { id title isArchived } nextToken }
  }
`
const LIST_SEMESTERS = /* GraphQL */ `
  query S($nextToken: String) {
    listSemesters(limit: 200, nextToken: $nextToken) { items { id courseId startDate endDate isActive } nextToken }
  }
`
const LIST_ACTIVE_STUDENTS = /* GraphQL */ `
  query P($nextToken: String) {
    listStudentProfiles(filter: { status: { eq: "active" } }, limit: 500, nextToken: $nextToken) {
      items { userId courseId } nextToken
    }
  }
`
const COUNT_PENDING = /* GraphQL */ `
  query Pend($nextToken: String) {
    listStudentProfiles(filter: { status: { eq: "pending" } }, limit: 500, nextToken: $nextToken) { items { id } nextToken }
  }
`
const LIST_PLANS = /* GraphQL */ `
  query W($nextToken: String) {
    listWeeklyPlans(limit: 500, nextToken: $nextToken) {
      items {
        id weekStartDate assignedStudentIds courseWeeklyPlansId
        items { items { id dayOfWeek isPublished isInClass } }
      }
      nextToken
    }
  }
`
const LIST_TEMPLATES = /* GraphQL */ `
  query T($nextToken: String) {
    listLessonTemplates(limit: 1000, nextToken: $nextToken) { items { id courseLessonTemplatesId isArchived } nextToken }
  }
`
const LIST_SUBMISSIONS = /* GraphQL */ `
  query Sub($nextToken: String) {
    listSubmissions(filter: { isArchived: { ne: true } }, limit: 1000, nextToken: $nextToken) {
      items { id studentId grade status content } nextToken
    }
  }
`
const LIST_UNREAD = /* GraphQL */ `
  query M($nextToken: String) {
    listMessages(filter: { isRead: { eq: false } }, limit: 500, nextToken: $nextToken) {
      items { id studentId isTeacherInitiated isArchivedByTeacher } nextToken
    }
  }
`

// ── Row shapes returned by the queries above ─────────────────────────────────
type CourseRow = { id: string; title: string; isArchived: boolean | null }
type SemesterRow = { id: string; courseId: string | null; startDate: string; endDate: string; isActive: boolean | null }
type StudentRow = { userId: string; courseId: string | null }
type IdRow = { id: string }
type PlanItemRow = { id: string; dayOfWeek: string; isPublished: boolean | null; isInClass: boolean | null }
type PlanRow = { id: string; weekStartDate: string; assignedStudentIds: string | null; courseWeeklyPlansId: string | null; items: { items: PlanItemRow[] } | null }
type TemplateRow = { id: string; courseLessonTemplatesId: string | null; isArchived: boolean | null }
type SubmissionRow = { id: string; studentId: string; grade: string | null; status: string | null; content: string | null }
type MessageRow = { id: string; studentId: string; isTeacherInitiated: boolean | null; isArchivedByTeacher: boolean | null }

// ── Week math (America/Chicago), same as the weekly reminder ─────────────────
function chicagoToday(): { ymd: string; weekdayMon1: number } {
  const now = new Date()
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(now)
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short' }).format(now)
  return { ymd, weekdayMon1: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd) + 1 }
}
function mondayOf(ymd: string, weekdayMon1: number): string {
  const d = new Date(ymd + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - (weekdayMon1 - 1))
  return d.toISOString().slice(0, 10)
}
const DAY_MS = 86_400_000
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS)
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Legacy Fridays (null isInClass) default to in-class, same as the dashboard. */
const isInClass = (it: { isInClass: boolean | null; dayOfWeek: string }) =>
  it.isInClass === true || (it.isInClass == null && it.dayOfWeek === 'Friday')

type CourseSummary = {
  name: string
  weekNumber: number | null
  totalWeeks: number | null
  weekLabel: string
  yearPercent: number | null
  lessonsThisWeek: number
  expected: number
  turnedIn: number
  turnedInLabel: string
  toGrade: number
  unread: number
  lessonsScheduled: number
  lessonsTotal: number
  lessonsLabel: string
}
type Summary = {
  generatedAt: string
  week: { monday: string; label: string }
  queue: { toGrade: number; unread: number; pending: number }
  courses: Record<string, CourseSummary>
}

async function build(): Promise<Summary> {
  const gql = gqlClient(await machineToken())
  const [courses, semesters, students, pending, plans, templates, submissions, unread] = await Promise.all([
    listAll<CourseRow>(gql, LIST_COURSES, 'listCourses'),
    listAll<SemesterRow>(gql, LIST_SEMESTERS, 'listSemesters'),
    listAll<StudentRow>(gql, LIST_ACTIVE_STUDENTS, 'listStudentProfiles'),
    listAll<IdRow>(gql, COUNT_PENDING, 'listStudentProfiles'),
    listAll<PlanRow>(gql, LIST_PLANS, 'listWeeklyPlans'),
    listAll<TemplateRow>(gql, LIST_TEMPLATES, 'listLessonTemplates'),
    listAll<SubmissionRow>(gql, LIST_SUBMISSIONS, 'listSubmissions'),
    listAll<MessageRow>(gql, LIST_UNREAD, 'listMessages'),
  ])

  const { ymd: today, weekdayMon1 } = chicagoToday()
  const monday = mondayOf(today, weekdayMon1)
  const weekLabel = new Date(monday + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

  const courseOfStudent = new Map<string, string>()
  for (const s of students) if (s.courseId) courseOfStudent.set(s.userId, s.courseId)

  // Unread = messages from students awaiting Melinda (teacher-initiated threads
  // are hers; archived ones are off her desk). Mirrors the nav badge's filter.
  const unreadLive = unread.filter((m) => !m.isTeacherInitiated && !m.isArchivedByTeacher)
  // Same rule as the nav badge and Grade Work page (app/lib/needsGrading.ts), so the three numbers agree.
  const ungraded = submissions.filter(needsGrading)

  const out: Record<string, CourseSummary> = {}
  for (const c of courses) {
    if (c.isArchived) continue
    const key = slug(c.title)
    const studentIds = new Set(students.filter((s) => s.courseId === c.id).map((s) => s.userId))

    // Semester: the active one, else the one whose dates contain today.
    const sems = semesters.filter((s) => s.courseId === c.id)
    const sem = sems.find((s) => s.isActive) || sems.find((s) => s.startDate <= today && today <= s.endDate) || null
    let weekNumber: number | null = null, totalWeeks: number | null = null, yearPercent: number | null = null
    if (sem) {
      totalWeeks = Math.max(1, Math.ceil((daysBetween(sem.startDate, sem.endDate) + 1) / 7))
      weekNumber = Math.min(totalWeeks, Math.max(1, Math.floor(daysBetween(sem.startDate, today) / 7) + 1))
      const span = Math.max(1, daysBetween(sem.startDate, sem.endDate))
      yearPercent = Math.max(0, Math.min(100, Math.round((daysBetween(sem.startDate, today) / span) * 100)))
    }

    const coursePlans = plans.filter((p) => p.courseWeeklyPlansId === c.id)
    const thisWeek = coursePlans.filter((p) => p.weekStartDate === monday)
    const thisWeekItems = thisWeek.flatMap((p) => (p.items?.items || []).filter((i) => i.isPublished !== false))
    const gradedItems = thisWeekItems.filter((i) => !isInClass(i))
    const itemIds = new Set(thisWeekItems.map((i) => i.id))

    // Who is expected: the plan's explicit list, else every active student in the class.
    let assigned = new Set<string>()
    for (const p of thisWeek) {
      try {
        const ids = (p.assignedStudentIds ? JSON.parse(p.assignedStudentIds) : []) as string[]
        ids.forEach(id => assigned.add(id))
      } catch { /* malformed list: fall through to the whole class */ }
    }
    if (assigned.size === 0) assigned = studentIds
    const expected = assigned.size * gradedItems.length

    // Turned in this week: one per (student, plan item), read from the submission's content JSON.
    const seen = new Set<string>()
    for (const s of submissions) {
      if (!assigned.has(s.studentId)) continue
      try {
        const itemId = JSON.parse(s.content || '{}')?.weeklyPlanItemId
        if (itemId && itemIds.has(itemId)) seen.add(s.studentId + '|' + itemId)
      } catch { /* non-JSON content: an old-format upload, not this week's */ }
    }
    const turnedIn = Math.min(expected, seen.size)

    const lessonsScheduled = coursePlans
      .filter((p) => p.weekStartDate <= monday)
      .reduce((n: number, p) => n + (p.items?.items || []).filter((i) => i.isPublished !== false).length, 0)
    const lessonsTotal = templates.filter((t) => t.courseLessonTemplatesId === c.id && !t.isArchived).length

    out[key] = {
      name: c.title,
      weekNumber, totalWeeks,
      weekLabel: weekNumber && totalWeeks ? `Week ${weekNumber} of ${totalWeeks}` : 'No active semester',
      yearPercent,
      lessonsThisWeek: thisWeekItems.length,
      expected, turnedIn,
      turnedInLabel: expected ? `${turnedIn} of ${expected}` : 'Nothing due',
      toGrade: ungraded.filter((s) => studentIds.has(s.studentId)).length,
      unread: unreadLive.filter((m) => courseOfStudent.get(m.studentId) === c.id).length,
      lessonsScheduled, lessonsTotal,
      lessonsLabel: lessonsTotal ? `${lessonsScheduled} of ${lessonsTotal}` : `${lessonsScheduled}`,
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    week: { monday, label: `Week of ${weekLabel}` },
    queue: { toGrade: ungraded.length, unread: unreadLive.length, pending: pending.length },
    courses: out,
  }
}

export async function GET(req: NextRequest) {
  if (!keyOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) cache = { at: Date.now(), body: await build() }
    return NextResponse.json(cache.body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'summary failed'
    console.error('homepage-summary failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
