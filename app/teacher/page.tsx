'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../src/graphql/queries'
import TeacherNav from '../components/TeacherNav'
import { useRoleGuard } from '../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'
import { fetchAllPages } from '@/app/lib/fetchAllPages'

const client = generateClient()

type Course = {
  id: string
  title: string
  description: string | null
  gradeLevel: string | null
  isArchived: boolean | null
}

type CourseWeekStats = {
  courseId: string
  assigned: number   // total expected this week (plan items × assigned students)
  received: number   // actually submitted this week
  graded: number     // graded submissions this week
  late: number       // past due, no submission
  avg: number | null      // class average of graded work submitted this week
  prevAvg: number | null  // same, for last week — drives the trend arrow
  videoAssigned: number   // video lessons this week × assigned students
  videoWatched: number    // of those, watched (completed or ≥90%)
}

type TurnInRow = {
  profileId: string
  name: string
  submitted: number
  total: number
  missing: string[]  // short labels like "L4" for the lessons not yet turned in
}

type CourseTurnIns = {
  courseId: string
  weekStartDate: string  // the most recent scheduled week for this course
  rows: TurnInRow[]
}

type AttentionRow = {
  id: string          // StudentProfile row id
  name: string
  late: number                              // past-due assignments not turned in
  quiet: boolean                            // nothing submitted this week
  drop: { from: number; to: number } | null // recent graded avg vs prior avg
}

type GradeScale = { courseId: string | null; isActive: boolean | null; gradeA: number | null; gradeB: number | null; gradeC: number | null; gradeD: number | null }

const listRecentSubmissionsQuery = /* GraphQL */`
  query ListRecentSubmissions($nextToken: String) {
    listSubmissions(limit: 500, nextToken: $nextToken) {
      nextToken
      items {
        id
        studentId
        content
        grade
        status
        submittedAt
        isArchived
      }
    }
  }
`

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekRange(monday: Date): string {
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return monday.toLocaleDateString('en-US', opts) + ' – ' + friday.toLocaleDateString('en-US', opts)
}

function GradingBar({ graded, received }: { graded: number; received: number }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  const pct = received > 0 ? (graded / received) * 100 : 0
  const allDone = received > 0 && graded >= received

  return (
    <div style={{
      position: 'relative',
      height: '12px',
      borderRadius: '6px',
      background: received > 0 ? 'rgba(164,120,200,0.18)' : 'var(--gray-light)',
      overflow: 'hidden',
      flex: 1,
    }}>
      {received > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: ready ? pct + '%' : '0%',
          background: allDone ? 'var(--accent)' : 'var(--plum)',
          borderRadius: '6px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}
    </div>
  )
}

/** Video bar — same shape as GradingBar, accent-gold so it reads as its own metric. */
function VideoBar({ watched, assigned }: { watched: number; assigned: number }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  const pct = assigned > 0 ? (watched / assigned) * 100 : 0

  return (
    <div style={{
      position: 'relative',
      height: '12px',
      borderRadius: '6px',
      background: assigned > 0 ? 'rgba(242,201,76,0.18)' : 'var(--gray-light)',
      overflow: 'hidden',
      flex: 1,
    }}>
      {assigned > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: ready ? pct + '%' : '0%',
          background: 'var(--accent)',
          borderRadius: '6px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}
    </div>
  )
}

/**
 * Submission bar — shows how many of the assigned items have been turned in.
 * Late segment (past-due, not turned in) sits next to the filled plum but is
 * STRIPED, not solid — solid red read as additional progress ("1 of 5" looked
 * like 2 of 5). Stripes read as a problem region, not fill.
 * Layout (stacked):
 *   [  turned-in (plum)  |  late (striped red)  |  not yet due (gray)  ]
 */
function SubmissionBar({ submitted, late, assigned }: { submitted: number; late: number; assigned: number }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (assigned <= 0) {
    return (
      <div style={{ position: 'relative', height: '12px', borderRadius: '6px', background: 'var(--gray-light)', overflow: 'hidden', flex: 1 }} />
    )
  }

  const submittedPct = Math.min(100, (submitted / assigned) * 100)
  const latePct = Math.min(100 - submittedPct, (late / assigned) * 100)

  return (
    <div style={{
      position: 'relative', height: '12px', borderRadius: '6px',
      background: 'rgba(164,120,200,0.18)', overflow: 'hidden', flex: 1, display: 'flex',
    }}>
      {/* Submitted portion (plum) */}
      <div style={{
        width: ready ? submittedPct + '%' : '0%',
        background: 'var(--plum)',
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }} />
      {/* Late portion (striped red — a warning zone, not filled progress) */}
      <div style={{
        width: ready ? latePct + '%' : '0%',
        background: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.75) 0 5px, rgba(220,38,38,0.25) 5px 10px)',
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

const listPendingStudentsQuery = /* GraphQL */`
  query ListPendingStudents($nextToken: String) {
    listStudentProfiles(limit: 200, filter: { status: { eq: "pending" } }, nextToken: $nextToken) {
      nextToken
      items { id firstName lastName email gradeLevel }
    }
  }
`

const listActiveStudentsQuery = /* GraphQL */`
  query ListActiveStudents($nextToken: String) {
    listStudentProfiles(limit: 200, filter: { status: { eq: "active" } }, nextToken: $nextToken) {
      nextToken
      items { id userId email firstName lastName courseId }
    }
  }
`

const listAllSubmissionsForAlertsQuery = /* GraphQL */`
  query ListAllSubmissionsForAlerts($nextToken: String) {
    listSubmissions(limit: 1000, nextToken: $nextToken) {
      nextToken
      items {
        id
        studentId
        grade
        submittedAt
        isArchived
        content
      }
    }
  }
`

const listWeeklyPlansQuery = /* GraphQL */`
  query ListWeeklyPlans($nextToken: String) {
    listWeeklyPlans(limit: 500, nextToken: $nextToken) {
      nextToken
      items {
        id
        weekStartDate
        assignedStudentIds
        courseWeeklyPlansId
        course { id title }
        items {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            isInClass
            lesson { id title videoUrl }
          }
        }
      }
    }
  }
`

const listZoomMeetingsQuery = /* GraphQL */`
  query ListZoomMeetings($nextToken: String) {
    listZoomMeetings(limit: 100, nextToken: $nextToken) {
      nextToken
      items { id topic startTime durationMinutes startUrl joinUrl }
    }
  }
`

const listAssignmentCountQuery = /* GraphQL */`
  query ListAssignmentCount {
    listAssignments(limit: 1) {
      items { id }
    }
  }
`

// NOTE: no server-side filter — AppSync applies `limit` to the table scan
// BEFORE filtering, so a filtered query with a small limit silently drops rows.
const listVideoWatchesQuery = /* GraphQL */`
  query ListVideoWatchesForDashboard($nextToken: String) {
    listVideoWatches(limit: 1000, nextToken: $nextToken) {
      nextToken
      items { studentId lessonId percentWatched completed }
    }
  }
`

const listGradeScalesQuery = /* GraphQL */`
  query ListGradeScales($nextToken: String) {
    listSemesters(limit: 100, nextToken: $nextToken) {
      nextToken
      items { id courseId isActive gradeA gradeB gradeC gradeD }
    }
  }
`


type Alert = {
  id: string
  level: 'urgent' | 'warning' | 'info'
  message: string
  href?: string
  /** Shows an ✕ that hides the alert for the rest of the day (localStorage). */
  dismissible?: boolean
}

/** Local-date key so a dismissal expires at midnight, not 24h later. */
function todayKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

function alertDismissed(id: string): boolean {
  try { return localStorage.getItem(`mwm-alert-dismissed:${id}`) === todayKey() } catch { return false }
}

function dismissAlertForToday(id: string) {
  try { localStorage.setItem(`mwm-alert-dismissed:${id}`, todayKey()) } catch { /* private mode */ }
}


export default function TeacherDashboard() {
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStats, setWeekStats] = useState<CourseWeekStats[]>([])
  const [turnIns, setTurnIns] = useState<CourseTurnIns[]>([])
  // Friday banner: true once every in-class item this week is fully checked off
  const [participationDone, setParticipationDone] = useState(false)
  // Next-week planning progress: courseId → lesson count scheduled for next week
  const [nextWeekPlans, setNextWeekPlans] = useState<Map<string, number>>(new Map())
  const [gradeScales, setGradeScales] = useState<GradeScale[]>([])
  const [attention, setAttention] = useState<AttentionRow[]>([])
  const [overdueStats, setOverdueStats] = useState<{ courseId: string; ungraded: number }[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [pendingStudents, setPendingStudents] = useState<{ id: string; firstName: string; lastName: string; email: string; gradeLevel: string | null }[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [briefing, setBriefing] = useState<string>('')
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [todayMeetings, setTodayMeetings] = useState<{ topic: string; startTime: string; startUrl: string | null; joinUrl: string }[]>([])

  const BRIEFING_CACHE_KEY = 'mwm:teacherBriefing:v2'

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 60 seconds (data only — not briefing)
    const interval = setInterval(fetchAll, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  function fetchAll() {
    fetchCourses()
    fetchWeekStats()
    fetchPendingStudents()
    fetchAlerts()
    fetchMeetingsAndBriefing(false)
  }

  // Load cached briefing on mount (use Central Time so cache flips at midnight CDT)
  useEffect(() => {
    const nowCT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const today = `${nowCT.getFullYear()}-${String(nowCT.getMonth() + 1).padStart(2, '0')}-${String(nowCT.getDate()).padStart(2, '0')}`
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEFING_CACHE_KEY) || '{}')
      if (cached.date === today && cached.text) {
        setBriefing(cached.text)
      }
    } catch { /* ignore */ }
  }, [])

  async function fetchPendingStudents() {
    try {
      const items = await fetchAllPages(client, listPendingStudentsQuery, 'listStudentProfiles')
      setPendingStudents(items)
    } catch { /* silent */ }
  }

  async function fetchMeetingsAndBriefing(force = false) {
    // Use Central Time for cache key so briefing flips at midnight CDT, not UTC
    const nowCT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const today = `${nowCT.getFullYear()}-${String(nowCT.getMonth() + 1).padStart(2, '0')}-${String(nowCT.getDate()).padStart(2, '0')}`

    // Check cache first — skip API call if we have today's briefing and not forcing
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(BRIEFING_CACHE_KEY) || '{}')
        if (cached.date === today && cached.text) {
          // Still fetch meetings data to update the meeting cards
          // but skip the Claude API call
          fetchTodayMeetingsOnly()
          return
        }
      } catch { /* ignore */ }
    }

    setBriefingLoading(true)
    try {
      const now = new Date()
      const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
      const monday = getMonday(now)
      const weekStartMs = monday.getTime()
      const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7)
      const nextMondayStr = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`

      // Fetch everything needed for the briefing in parallel — each query is wrapped
      // so one failure doesn't crash the whole briefing
      const safe = (p: Promise<any>) => p.then(r => r).catch(() => null)
      const [meetingsRes, subsRes, studentsRes, plansRes, pendingRes, assignRes] = await Promise.all([
        safe(fetchAllPages(client, listZoomMeetingsQuery, 'listZoomMeetings')),
        safe(fetchAllPages(client, listAllSubmissionsForAlertsQuery, 'listSubmissions')),
        safe(fetchAllPages(client, listActiveStudentsQuery, 'listStudentProfiles')),
        safe(fetchAllPages(client, listWeeklyPlansQuery, 'listWeeklyPlans')),
        safe(fetchAllPages(client, listPendingStudentsQuery, 'listStudentProfiles')),
        safe(client.graphql({ query: listAssignmentCountQuery }) as any),
      ])

      const hasAssignments = (assignRes?.data?.listAssignments?.items?.length ?? 0) > 0

      // Today's meetings
      const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
      const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999)
      const meetingItems = meetingsRes ?? []
      const meetsToday = (meetingItems as any[])
        .filter(m => { const s = new Date(m.startTime); return s >= dayStart && s <= dayEnd })
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
      setTodayMeetings(meetsToday)

      const meetingLines = meetsToday.length === 0
        ? 'No Zoom meetings today.'
        : meetsToday.map((m: any) => {
            const t = new Date(m.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            const minUntil = Math.round((new Date(m.startTime).getTime() - now.getTime()) / 60000)
            const endTime = new Date(new Date(m.startTime).getTime() + m.durationMinutes * 60000)
            const status = now > endTime ? 'already ended' : minUntil <= 0 ? 'happening NOW' : `in ${minUntil} minutes`
            return `- "${m.topic}" at ${t} (${status})`
          }).join('\n')

      // Ungraded submissions
      const allSubs = subsRes ?? []
      const ungradedThisWeek = allSubs.filter((s: any) => !s.isArchived && !s.grade && s.submittedAt && new Date(s.submittedAt).getTime() >= weekStartMs)
      const staleUngraded = allSubs.filter((s: any) => !s.isArchived && !s.grade && s.submittedAt && new Date(s.submittedAt) < new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))

      // Students who haven't submitted this week
      const submittedThisWeek = new Set(allSubs.filter((s: any) => !s.isArchived && s.submittedAt && new Date(s.submittedAt).getTime() >= weekStartMs).map((s: any) => s.studentId))
      const activeStudents: any[] = studentsRes ?? []
      const notSubmitted = activeStudents.filter(s => !submittedThisWeek.has(s.userId) && !submittedThisWeek.has(s.email))

      // Next week planned?
      const weeklyPlans: any[] = plansRes ?? []
      const nextWeekPlanned = weeklyPlans.some((p: any) => p.weekStartDate === nextMondayStr)
      const dayOfWeek = now.getDay()
      const isEndOfWeek = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 0 || dayOfWeek === 6

      // Pending students
      const pendingItems = pendingRes ?? []
      const pendingCount = pendingItems.length
      const pendingNames = pendingItems.slice(0, 3).map((s: any) => `${s.firstName} ${s.lastName}`).join(', ')

      const gradingSection = hasAssignments
        ? `GRADING:
- Ungraded submissions this week: ${ungradedThisWeek.length}
- Submissions ungraded for 5+ days: ${staleUngraded.length}
- Active students who haven't submitted anything this week: ${notSubmitted.length}${notSubmitted.length > 0 ? ` (${notSubmitted.slice(0,3).map((s:any)=>s.firstName).join(', ')})` : ''}`
        : `GRADING:
- No assignments have been created yet — nothing to grade.`

      // Context for AI — keep it light since stats are shown live in the dashboard.
      // The AI just writes a warm personal greeting, not a status report.
      const context = `Current date/time: ${todayStr}
Day of the week: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
Number of active students: ${activeStudents.length}
Today's meetings: ${meetsToday.length === 0 ? 'none' : meetsToday.map((m: any) => m.topic).join(', ')}`

      const res = await apiFetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Briefing API response error:', res.status, text)
        setBriefing('Could not load briefing — check that the API key is configured.')
        return
      }
      const data = await res.json()
      if (data.error) {
        console.error('Briefing API error:', data.error)
        setBriefing('Could not load briefing — check that the API key is configured.')
      } else if (data.briefing) {
        setBriefing(data.briefing)
        localStorage.setItem(BRIEFING_CACHE_KEY, JSON.stringify({ date: today, text: data.briefing }))
      } else {
        setBriefing('All clear today, Melinda — no urgent items to flag.')
      }
    } catch (err: any) {
      console.error('Briefing fetch error:', err)
      setBriefing('Could not load briefing — please try again.')
    } finally {
      setBriefingLoading(false)
    }
  }

  async function fetchTodayMeetingsOnly() {
    try {
      const now = new Date()
      const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
      const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999)
      const meetingItems = await fetchAllPages(client, listZoomMeetingsQuery, 'listZoomMeetings')
      const meetsToday = (meetingItems as any[])
        .filter(m => { const s = new Date(m.startTime); return s >= dayStart && s <= dayEnd })
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
      setTodayMeetings(meetsToday)
    } catch { /* non-critical */ }
  }

  async function fetchAlerts() {
    try {
      const now = new Date()
      const monday = getMonday(now)
      const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7)
      const nextMondayStr = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`
      const dayOfWeek = now.getDay() // 0=Sun,1=Mon...5=Fri,6=Sat
      const newAlerts: Alert[] = []

      const safeQ = (p: Promise<any>) => p.then(r => r).catch(() => null)
      const [subsResult, studentsResult, plansResult, assignResult] = await Promise.all([
        safeQ(fetchAllPages(client, listAllSubmissionsForAlertsQuery, 'listSubmissions')),
        safeQ(fetchAllPages(client, listActiveStudentsQuery, 'listStudentProfiles')),
        safeQ(fetchAllPages(client, listWeeklyPlansQuery, 'listWeeklyPlans')),
        safeQ(client.graphql({ query: listAssignmentCountQuery }) as any),
      ])

      const allSubs = subsResult ?? []
      const activeStudents: { id: string; userId: string; email: string; firstName: string; lastName: string; courseId?: string | null }[] =
        studentsResult ?? []
      const weeklyPlans: any[] = plansResult ?? []
      const hasAnyAssignments = (assignResult?.data?.listAssignments?.items?.length ?? 0) > 0

      // Helper: compute due datetime for a plan item (mirrors getDueStatus on dashboard)
      function dueDateOf(weekStartDate: string, dayOfWeek: string, dueTime: string | null): Date | null {
        if (!dueTime) return null
        if (dueTime.includes('T') && dueTime.length > 10) {
          const d = new Date(dueTime)
          return isNaN(d.getTime()) ? null : d
        }
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const offset = days.indexOf(dayOfWeek)
        if (offset < 0) return null
        const base = new Date(weekStartDate + 'T00:00:00')
        base.setDate(base.getDate() + offset)
        const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
        const y = base.getFullYear()
        const mo = String(base.getMonth() + 1).padStart(2, '0')
        const d = String(base.getDate()).padStart(2, '0')
        const dt = new Date(`${y}-${mo}-${d}T${timePart}`)
        return isNaN(dt.getTime()) ? null : dt
      }

      // Build per-student late-assignment counts.
      // For each plan item that's past due, check each assigned student's submission.
      const lateByStudent = new Map<string, { name: string; count: number; firstName: string }>()
      if (hasAnyAssignments) {
        // Index submissions by studentId → set of submitted lessonIds
        const submittedLessonsByStudent = new Map<string, Set<string>>()
        for (const s of allSubs) {
          if (s.isArchived) continue
          if (!s.submittedAt) continue
          let lessonId: string | null = null
          try { lessonId = JSON.parse(s.content || '{}').lessonId || null } catch { /* skip */ }
          if (!lessonId) continue
          if (!submittedLessonsByStudent.has(s.studentId)) submittedLessonsByStudent.set(s.studentId, new Set())
          submittedLessonsByStudent.get(s.studentId)!.add(lessonId)
        }

        for (const plan of weeklyPlans) {
          const courseId = plan.courseWeeklyPlansId || plan.course?.id
          if (!courseId) continue

          // Determine which students this plan applies to
          let assignedIds: string[] | null = null
          if (plan.assignedStudentIds) {
            try {
              const parsed = typeof plan.assignedStudentIds === 'string'
                ? JSON.parse(plan.assignedStudentIds)
                : plan.assignedStudentIds
              if (Array.isArray(parsed) && parsed.length > 0) assignedIds = parsed
            } catch { /* ignore */ }
          }
          // Default = all active students enrolled in this course
          const studentsForPlan = assignedIds
            ? activeStudents.filter(st => assignedIds!.includes(st.userId))
            : activeStudents.filter(st => st.courseId === courseId)

          const planItems = plan.items?.items || []
          for (const item of planItems) {
            if (!item.lesson) continue
            if (item.isPublished === false) continue
            const due = dueDateOf(plan.weekStartDate, item.dayOfWeek, item.dueTime)
            if (!due || due >= now) continue // not due yet
            // For each assigned student, count missing submission for this lesson
            for (const st of studentsForPlan) {
              const submittedSet = submittedLessonsByStudent.get(st.userId) || submittedLessonsByStudent.get(st.email) || new Set()
              if (submittedSet.has(item.lesson.id)) continue
              const key = st.id
              if (!lateByStudent.has(key)) {
                lateByStudent.set(key, { name: `${st.firstName} ${st.lastName}`, firstName: st.firstName, count: 0 })
              }
              lateByStudent.get(key)!.count++
            }
          }
        }
      }

      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      const weekStartMs = monday.getTime()

      // Only show submission-related alerts if assignments have been created
      if (hasAnyAssignments) {
        // 1. Ungraded submissions older than 5 days
        const staleUngraded = allSubs.filter((s: any) =>
          !s.isArchived && !s.grade && s.submittedAt && new Date(s.submittedAt) < fiveDaysAgo
        )
        if (staleUngraded.length > 0) {
          newAlerts.push({
            id: 'stale-ungraded',
            level: 'urgent',
            message: `${staleUngraded.length} submission${staleUngraded.length > 1 ? 's have' : ' has'} been waiting to be graded for 5+ days`,
            href: '/teacher/grades',
          })
        }

        // 1b. Students with past-due assignments not turned in
        if (lateByStudent.size > 0) {
          const lateRows = Array.from(lateByStudent.values()).sort((a, b) => b.count - a.count)
          const totalLate = lateRows.reduce((sum, r) => sum + r.count, 0)
          const namesPart = lateRows.slice(0, 3).map(r => `${r.firstName} (${r.count})`).join(', ')
          const extra = lateRows.length > 3 ? ` +${lateRows.length - 3} more` : ''
          newAlerts.push({
            id: 'late-assignments',
            level: 'urgent',
            message: `${totalLate} late assignment${totalLate > 1 ? 's' : ''} across ${lateRows.length} student${lateRows.length > 1 ? 's' : ''} — ${namesPart}${extra}`,
            href: '/teacher/grades',
          })
        }

        // 2. Students who haven't submitted anything this week
        const submittedThisWeek = new Set(
          allSubs
            .filter((s: any) => !s.isArchived && s.submittedAt && new Date(s.submittedAt).getTime() >= weekStartMs)
            .map((s: any) => s.studentId)
        )
        const notSubmitted = activeStudents.filter(s => !submittedThisWeek.has(s.userId) && !submittedThisWeek.has(s.email))
        if (notSubmitted.length > 0 && notSubmitted.length <= activeStudents.length) {
          const names = notSubmitted.slice(0, 3).map(s => s.firstName).join(', ')
          const extra = notSubmitted.length > 3 ? ` +${notSubmitted.length - 3} more` : ''
          newAlerts.push({
            id: 'no-submission-this-week',
            level: 'warning',
            message: `${notSubmitted.length} student${notSubmitted.length > 1 ? 's haven\'t' : ' hasn\'t'} submitted anything this week — ${names}${extra}`,
            href: '/teacher/grades',
          })
        }

        // ── Needs-attention rows: late work, silence, or slipping grades ──
        // Reuses the late/quiet data computed above; adds a grade trend per
        // student (recent 3 graded vs the prior average, 7+ point drop flags).
        const rowByProfileId = new Map<string, AttentionRow>()
        const rowFor = (st: { id: string; firstName: string; lastName: string }) => {
          if (!rowByProfileId.has(st.id)) {
            rowByProfileId.set(st.id, { id: st.id, name: `${st.firstName} ${st.lastName}`, late: 0, quiet: false, drop: null })
          }
          return rowByProfileId.get(st.id)!
        }

        for (const st of activeStudents) {
          const late = lateByStudent.get(st.id)?.count ?? 0
          if (late > 0) rowFor(st).late = late

          if (notSubmitted.some(n => n.id === st.id)) rowFor(st).quiet = true

          // Grade trend — needs at least 5 graded submissions to say anything
          const graded = allSubs
            .filter((s: any) => !s.isArchived && s.submittedAt && s.grade
              && (s.studentId === st.userId || s.studentId === st.email))
            .map((s: any) => ({ ts: new Date(s.submittedAt).getTime(), n: parseFloat(s.grade) }))
            .filter((g: any) => !isNaN(g.n))
            .sort((a: any, b: any) => a.ts - b.ts)
          if (graded.length >= 5) {
            const recent = graded.slice(-3).map((g: any) => g.n)
            const prior = graded.slice(0, -3).slice(-5).map((g: any) => g.n)
            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
            const from = Math.round(avg(prior))
            const to = Math.round(avg(recent))
            if (from - to >= 7) rowFor(st).drop = { from, to }
          }
        }

        const attentionRows = Array.from(rowByProfileId.values())
          .filter(r => r.late > 0 || r.quiet || r.drop)
          .sort((a, b) =>
            (b.late - a.late)
            || ((b.drop ? b.drop.from - b.drop.to : 0) - (a.drop ? a.drop.from - a.drop.to : 0))
            || Number(b.quiet) - Number(a.quiet))
        setAttention(attentionRows)
      }

      // 3. Next week's plans not set yet (warn Thu/Fri/weekend).
      // "Done" means every class with active students has a plan for next week
      // — a single planned class no longer silences the reminder. Weeks where
      // Melinda deliberately runs fewer classes are handled by the ✕: dismissal
      // hides it for the rest of the day.
      if ((dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 0 || dayOfWeek === 6)
          && !alertDismissed('next-week-not-planned')) {
        const activeCourseIds = [...new Set(activeStudents.map(s => s.courseId).filter(Boolean))] as string[]
        const plannedCourseIds = new Set(
          weeklyPlans
            .filter(p => p.weekStartDate === nextMondayStr)
            .map(p => p.courseWeeklyPlansId || p.course?.id)
            .filter(Boolean)
        )
        const missingIds = activeCourseIds.filter(id => !plannedCourseIds.has(id))
        if (missingIds.length > 0) {
          // Course titles: any week's plan for that course carries them.
          const titleById = new Map<string, string>()
          for (const p of weeklyPlans) {
            const cid = p.courseWeeklyPlansId || p.course?.id
            if (cid && p.course?.title) titleById.set(cid, p.course.title)
          }
          const missingNames = missingIds.map(id => titleById.get(id) || 'a new class')
          const dayName = dayOfWeek === 4 ? 'Thursday' : dayOfWeek === 5 ? 'Friday' : 'the weekend'
          const allMissing = missingIds.length === activeCourseIds.length
          newAlerts.push({
            id: 'next-week-not-planned',
            level: 'warning',
            message: allMissing
              ? `It's ${dayName} — next week's assignments haven't been set yet`
              : `It's ${dayName} — next week isn't planned yet for ${missingNames.join(', ')}`,
            href: '/teacher/plans',
            dismissible: true,
          })
        }
      }

      // 4. Students who have never submitted (only if assignments exist)
      if (hasAnyAssignments) {
        const studentSubCounts: Record<string, number> = {}
        for (const s of allSubs) {
          if (s.isArchived) continue
          const sid = s.studentId
          if (!studentSubCounts[sid]) studentSubCounts[sid] = 0
          studentSubCounts[sid]++
        }
        const neverSubmitted = activeStudents.filter(s =>
          !studentSubCounts[s.userId] && !studentSubCounts[s.email]
        )
        if (neverSubmitted.length > 0) {
          const names = neverSubmitted.slice(0, 2).map(s => s.firstName).join(', ')
          const extra = neverSubmitted.length > 2 ? ` +${neverSubmitted.length - 2} more` : ''
          newAlerts.push({
            id: 'never-submitted',
            level: 'info',
            message: `${neverSubmitted.length} active student${neverSubmitted.length > 1 ? 's have' : ' has'} never submitted work — ${names}${extra}`,
            href: '/teacher/students',
          })
        }
      }

      setAlerts(newAlerts)
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }

  async function fetchCourses() {
    try {
      const items = await fetchAllPages<Course>(client, listCourses, 'listCourses')
      setCourses(items)
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeekStats() {
    try {
      const now = new Date()
      const monday = getMonday(now)
      const weekStartMs = monday.getTime()
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999)
      const mondayDateStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

      // Helper: parse dueTime ("HH:mm" or full ISO) using weekStart + dayOfWeek
      function dueDateOf(weekStartDate: string, dayOfWeek: string, dueTime: string | null): Date | null {
        if (!dueTime) return null
        if (dueTime.includes('T') && dueTime.length > 10) {
          const d = new Date(dueTime)
          return isNaN(d.getTime()) ? null : d
        }
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const offset = days.indexOf(dayOfWeek)
        if (offset < 0) return null
        const base = new Date(weekStartDate + 'T00:00:00')
        base.setDate(base.getDate() + offset)
        const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
        const y = base.getFullYear()
        const mo = String(base.getMonth() + 1).padStart(2, '0')
        const d = String(base.getDate()).padStart(2, '0')
        const dt = new Date(`${y}-${mo}-${d}T${timePart}`)
        return isNaN(dt.getTime()) ? null : dt
      }

      // Fetch everything in parallel
      const safeQ = (p: Promise<any>) => p.then(r => r).catch(() => null)
      const [subsRes, plansRes, studentsRes, watchesRes, scalesRes] = await Promise.all([
        safeQ(fetchAllPages(client, listRecentSubmissionsQuery, 'listSubmissions')),
        safeQ(fetchAllPages(client, listWeeklyPlansQuery, 'listWeeklyPlans')),
        safeQ(fetchAllPages(client, listActiveStudentsQuery, 'listStudentProfiles')),
        safeQ(fetchAllPages(client, listVideoWatchesQuery, 'listVideoWatches')),
        safeQ(fetchAllPages(client, listGradeScalesQuery, 'listSemesters')),
      ])

      const allSubs = subsRes ?? []
      const allPlans = plansRes ?? []
      const activeStudents: { id: string; userId: string; email: string; firstName: string; lastName: string; courseId?: string | null }[] =
        studentsRes ?? []
      setGradeScales(scalesRes ?? [])

      // Best watch progress per student+lesson. VideoWatch.studentId is the
      // Cognito sub (see app/lib/identity.ts) and lessonId is the Lesson row id
      // — the same ids the plan items and active students carry below.
      const watchByKey = new Map<string, { percent: number; completed: boolean }>()
      for (const w of watchesRes ?? []) {
        const key = `${w.studentId}:${w.lessonId}`
        const prev = watchByKey.get(key)
        const percent = w.percentWatched ?? 0
        if (!prev || percent > prev.percent) {
          watchByKey.set(key, { percent, completed: !!w.completed })
        }
      }

      // Build: submittedLessonsByStudent for "is this lesson turned in?" lookup
      const submittedLessonsByStudent = new Map<string, Set<string>>()
      for (const sub of allSubs) {
        if (sub.isArchived) continue
        if (!sub.submittedAt) continue
        let lessonId: string | null = null
        try { lessonId = JSON.parse(sub.content || '{}').lessonId || null } catch { continue }
        if (!lessonId) continue
        if (!submittedLessonsByStudent.has(sub.studentId)) submittedLessonsByStudent.set(sub.studentId, new Set())
        submittedLessonsByStudent.get(sub.studentId)!.add(lessonId)
      }

      // Initialize per-course counters
      const byCourse: Record<string, CourseWeekStats> = {}
      const bumpCourse = (courseId: string) => {
        if (!byCourse[courseId]) byCourse[courseId] = { courseId, assigned: 0, received: 0, graded: 0, late: 0, avg: null, prevAvg: null, videoAssigned: 0, videoWatched: 0 }
        return byCourse[courseId]
      }

      // ── Count "assigned" and "late" from the weekly plans for THIS WEEK ──
      const thisWeeksPlans = allPlans.filter((p: any) => p.weekStartDate === mondayDateStr)

      // ── Next week's planning progress (drives the Next Week card) ──
      {
        const nextMonday = new Date(monday)
        nextMonday.setDate(monday.getDate() + 7)
        const nextMondayStr = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`
        const nw = new Map<string, number>()
        for (const p of allPlans.filter((x: any) => x.weekStartDate === nextMondayStr)) {
          const cid = p.courseWeeklyPlansId || p.course?.id
          if (!cid) continue
          const lessonCount = (p.items?.items || []).filter((i: any) => i.lesson).length
          nw.set(cid, (nw.get(cid) || 0) + lessonCount)
        }
        setNextWeekPlans(nw)
      }

      // ── Friday participation completeness (drives the Friday banner) ──
      // Done = every active student assigned to every in-class item this week
      // has a submission for its lesson — a real one or a participation credit
      // (Give Credit writes a normal submission, so one lookup covers both).
      {
        const checks: boolean[] = []
        for (const plan of thisWeeksPlans) {
          const courseId = plan.courseWeeklyPlansId || plan.course?.id
          let assignedIds: string[] | null = null
          if (plan.assignedStudentIds) {
            try {
              const parsed = typeof plan.assignedStudentIds === 'string'
                ? JSON.parse(plan.assignedStudentIds)
                : plan.assignedStudentIds
              if (Array.isArray(parsed) && parsed.length > 0) assignedIds = parsed
            } catch { /* treat as all */ }
          }
          const roster = assignedIds
            ? activeStudents.filter(st => assignedIds!.includes(st.userId) || assignedIds!.includes(st.email))
            : activeStudents.filter(st => st.courseId === courseId)
          for (const item of plan.items?.items || []) {
            if (!item.lesson) continue
            if (item.isPublished === false) continue
            const inClass = item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday')
            if (!inClass) continue
            const covered = roster.every(st => {
              const set = submittedLessonsByStudent.get(st.userId) || submittedLessonsByStudent.get(st.email)
              return !!set && set.has(item.lesson.id)
            })
            checks.push(covered)
          }
        }
        setParticipationDone(checks.length > 0 && checks.every(Boolean))
      }
      for (const plan of thisWeeksPlans) {
        const courseId = plan.courseWeeklyPlansId || plan.course?.id
        if (!courseId) continue

        // Who are the students assigned to this plan?
        let assignedIds: string[] | null = null
        if (plan.assignedStudentIds) {
          try {
            const parsed = typeof plan.assignedStudentIds === 'string'
              ? JSON.parse(plan.assignedStudentIds)
              : plan.assignedStudentIds
            if (Array.isArray(parsed) && parsed.length > 0) assignedIds = parsed
          } catch { /* treat as all */ }
        }
        const studentsForPlan = assignedIds
          ? activeStudents.filter(st => assignedIds!.includes(st.userId))
          : activeStudents.filter(st => st.courseId === courseId)

        const items = plan.items?.items || []
        for (const item of items) {
          if (!item.lesson) continue
          if (item.isPublished === false) continue
          const due = dueDateOf(plan.weekStartDate, item.dayOfWeek, item.dueTime)
          for (const st of studentsForPlan) {
            bumpCourse(courseId).assigned += 1
            // Late if due date passed and student hasn't submitted this lesson
            if (due && due < now) {
              const submittedSet = submittedLessonsByStudent.get(st.userId)
                || submittedLessonsByStudent.get(st.email)
                || new Set()
              if (!submittedSet.has(item.lesson.id)) {
                bumpCourse(courseId).late += 1
              }
            }
            // Video gauge: lessons with a video count one watch per student
            if (item.lesson.videoUrl) {
              bumpCourse(courseId).videoAssigned += 1
              const watch = watchByKey.get(`${st.userId}:${item.lesson.id}`)
              if (watch && (watch.completed || watch.percent >= 90)) {
                bumpCourse(courseId).videoWatched += 1
              }
            }
          }
        }
      }

      // ── Count "received" and "graded" from submissions this week ──
      for (const sub of allSubs) {
        if (sub.isArchived) continue
        if (!sub.submittedAt) continue
        if (new Date(sub.submittedAt).getTime() < weekStartMs) continue

        let courseId = ''
        try { courseId = JSON.parse(sub.content || '{}').courseId || '' } catch { continue }
        if (!courseId) continue
        bumpCourse(courseId).received += 1
        if (sub.grade) bumpCourse(courseId).graded += 1
      }

      // ── Class average this week vs last, per course ──
      const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7)
      const lastMondayMs = lastMonday.getTime()
      const thisWeekGrades: Record<string, number[]> = {}
      const lastWeekGrades: Record<string, number[]> = {}
      for (const sub of allSubs) {
        if (sub.isArchived || !sub.submittedAt || !sub.grade) continue
        const n = parseFloat(sub.grade)
        if (isNaN(n)) continue
        let courseId = ''
        try { courseId = JSON.parse(sub.content || '{}').courseId || '' } catch { continue }
        if (!courseId) continue
        const ts = new Date(sub.submittedAt).getTime()
        if (ts >= weekStartMs) {
          (thisWeekGrades[courseId] ||= []).push(n)
        } else if (ts >= lastMondayMs) {
          (lastWeekGrades[courseId] ||= []).push(n)
        }
      }
      const mean = (arr: number[] | undefined) =>
        arr && arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
      for (const courseId of new Set([...Object.keys(thisWeekGrades), ...Object.keys(lastWeekGrades)])) {
        const stat = bumpCourse(courseId)
        stat.avg = mean(thisWeekGrades[courseId])
        stat.prevAvg = mean(lastWeekGrades[courseId])
      }

      setWeekStats(Object.values(byCourse))

      // ── Turn-ins: per-student progress on each course's MOST RECENT
      // scheduled week. Deliberately not keyed to the calendar week like the
      // stats above: the 2026-27 opener was scheduled on the 8/17 calendar row
      // but worked (and due) the following week, which left every
      // calendar-keyed stat blank exactly when Melinda most wanted to know who
      // had turned what in. The latest week that has started is the one being
      // worked, whatever row it was scheduled on.
      {
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const plansByCourse = new Map<string, any[]>()
        for (const p of allPlans) {
          const cid = p.courseWeeklyPlansId || p.course?.id
          if (!cid) continue
          if (!plansByCourse.has(cid)) plansByCourse.set(cid, [])
          plansByCourse.get(cid)!.push(p)
        }
        const result: CourseTurnIns[] = []
        for (const [cid, coursePlans] of plansByCourse) {
          const started = coursePlans.filter(p => p.weekStartDate <= todayStr)
          if (started.length === 0) continue

          const rowsForWeek = (week: string): Map<string, TurnInRow> => {
            const rows = new Map<string, TurnInRow>()
            for (const plan of coursePlans.filter(p => p.weekStartDate === week)) {
              let assignedIds: string[] | null = null
              if (plan.assignedStudentIds) {
                try {
                  const parsed = typeof plan.assignedStudentIds === 'string'
                    ? JSON.parse(plan.assignedStudentIds)
                    : plan.assignedStudentIds
                  if (Array.isArray(parsed) && parsed.length > 0) assignedIds = parsed
                } catch { /* treat as all */ }
              }
              const roster = assignedIds
                ? activeStudents.filter(st => assignedIds!.includes(st.userId) || assignedIds!.includes(st.email))
                : activeStudents.filter(st => st.courseId === cid)
              for (const item of plan.items?.items || []) {
                if (!item.lesson) continue
                if (item.isPublished === false) continue
                // In-class days are credited on the Participation page, not
                // self-submitted — counting them here would show every student
                // "missing 1" all week long.
                const inClass = item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday')
                if (inClass) continue
                const m = (item.lesson.title || '').match(/Lesson\s+([\d.]+[a-z]?)/i)
                const label = m ? `L${m[1]}` : (item.lesson.title || '?').slice(0, 12)
                for (const st of roster) {
                  if (!rows.has(st.id)) {
                    rows.set(st.id, { profileId: st.id, name: `${st.firstName} ${st.lastName}`, submitted: 0, total: 0, missing: [] })
                  }
                  const row = rows.get(st.id)!
                  row.total += 1
                  const set = submittedLessonsByStudent.get(st.userId) || submittedLessonsByStudent.get(st.email)
                  if (set && set.has(item.lesson.id)) row.submitted += 1
                  else row.missing.push(label)
                }
              }
            }
            return rows
          }

          // Walk started weeks newest-first and take the first with countable
          // work. "Most recent week" alone is not enough: the week of 8/24 was
          // scheduled as a single in-class Friday item, which made the panel
          // vanish entirely while the 8/17 week's turn-ins were due that day.
          const weeks = [...new Set(started.map(p => p.weekStartDate as string))].sort().reverse()
          let week = ''
          let rows = new Map<string, TurnInRow>()
          for (const w of weeks) {
            const r = rowsForWeek(w)
            if (r.size > 0) { week = w; rows = r; break }
          }
          if (!week) continue
          // Plan items arrive unordered from AppSync — sort each student's
          // missing list by lesson number so it reads "L1, L2, L4".
          for (const row of rows.values()) {
            row.missing.sort((a, b) => (parseFloat(a.slice(1)) || 0) - (parseFloat(b.slice(1)) || 0))
          }
          result.push({
            courseId: cid,
            weekStartDate: week,
            // Furthest behind first; ties alphabetical so the order is stable
            rows: [...rows.values()].sort((a, b) => (a.submitted - b.submitted) || a.name.localeCompare(b.name)),
          })
        }
        setTurnIns(result)
      }

      // ── Count overdue: submissions from before this week that are still ungraded ──
      const overdueByCourse: Record<string, number> = {}
      for (const sub of allSubs) {
        if (sub.isArchived) continue
        if (!sub.submittedAt) continue
        if (sub.grade) continue  // already graded, not overdue
        if (new Date(sub.submittedAt).getTime() >= weekStartMs) continue  // this week, not overdue

        let courseId = ''
        try { courseId = JSON.parse(sub.content || '{}').courseId || '' } catch { continue }
        if (!courseId) continue
        overdueByCourse[courseId] = (overdueByCourse[courseId] || 0) + 1
      }
      setOverdueStats(
        Object.entries(overdueByCourse).map(([courseId, ungraded]) => ({ courseId, ungraded }))
      )
    } catch (err) {
      console.error('Error fetching week stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const monday = getMonday(new Date())
  const weekRangeLabel = formatWeekRange(monday)
  const courseOrder = ['Arithmetic 6', 'Middle School Math', 'Pre-Algebra', 'Algebra 1']
  const activeCourses = courses.filter(c => !c.isArchived).sort((a, b) => {
    const ai = courseOrder.indexOf(a.title)
    const bi = courseOrder.indexOf(b.title)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  // Letter for a course average, from the course's active semester thresholds
  // (Melinda configures these per semester), standard scale as fallback.
  function letterFor(courseId: string, avg: number): string {
    const scale = gradeScales.find(s => s.isActive && s.courseId === courseId)
      || gradeScales.find(s => s.isActive)
    const a = scale?.gradeA ?? 90, b = scale?.gradeB ?? 80, c = scale?.gradeC ?? 70, d = scale?.gradeD ?? 60
    return avg >= a ? 'A' : avg >= b ? 'B' : avg >= c ? 'C' : avg >= d ? 'D' : 'F'
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* ── FRIDAY PARTICIPATION SHORTCUT ── */}
        {/* Flips to a success state once every class is checked off, and stays
            that way for the rest of the day — done work shouldn't keep nagging. */}
        {new Date().getDay() === 5 && (participationDone ? (
          <div
            onClick={() => router.push('/teacher/participation')}
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '18px' }}>🎉</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#15803d' }}>Great job — participation is done for today</div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                Every student in every class has been checked off for this week&apos;s in-class assignments
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => router.push('/teacher/participation')}
            style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', background: 'var(--background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '18px' }}>✏️</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--plum)' }}>It&apos;s Friday — take class participation</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-dark)', marginTop: '2px' }}>
                Check off who&apos;s in class to give credit for today&apos;s in-class assignment
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        ))}

        {/* ── AI BRIEFING + LIVE STATS + TODAY'S MEETINGS ── */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '22px 28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--plum-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <span style={{ fontSize: '18px' }}>✨</span>
            </div>
            <div style={{ flex: 1 }}>
              {briefingLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--plum)', opacity: 0.4, animation: 'pulse 1.2s ease-in-out infinite' }} />
                  <span style={{ fontSize: '14px', color: 'var(--gray-mid)', fontStyle: 'italic' }}>Getting your briefing…</span>
                </div>
              ) : briefing ? (() => {
                const paragraphs = briefing.split('\n\n')
                const aiNote = paragraphs.slice(0, 1)
                const encouragement = paragraphs.slice(1)

                // Live stats from already-loaded data
                const totalUngraded = weekStats.reduce((sum, s) => sum + Math.max(0, s.received - s.graded), 0)
                  + overdueStats.reduce((sum, s) => sum + s.ungraded, 0)
                const pendingCount = pendingStudents.length
                const urgentAlerts = alerts.filter(a => a.level === 'urgent').length

                return (
                  <div>
                    {/* AI personal note (cached per day) */}
                    {aiNote.map((p, i) => (
                      <p key={i} style={{ fontSize: '15px', color: 'var(--foreground)', lineHeight: '1.65', margin: '0 0 10px' }}>{p}</p>
                    ))}

                    {/* Live stats — refresh every 60s */}
                    {!statsLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: totalUngraded === 0 ? 'var(--accent)' : 'var(--foreground)' }}>
                          {totalUngraded === 0 ? '✅ All graded' : `📋 ${totalUngraded} to grade`}
                        </span>
                        {pendingCount > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#92400E' }}>
                            · 👤 {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {urgentAlerts > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#dc2626' }}>
                            · ⚠ {urgentAlerts} urgent
                          </span>
                        )}
                        {todayMeetings.length > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--foreground)' }}>
                            · 🎥 {todayMeetings.length} meeting{todayMeetings.length !== 1 ? 's' : ''} today
                          </span>
                        )}
                      </div>
                    )}

                    {/* Scripture/prayer (cached per day) */}
                    {encouragement.map((p, i) => (
                      <p key={i} style={{ fontSize: '13px', color: 'var(--gray-mid)', lineHeight: '1.6', margin: 0, fontStyle: p.startsWith('"') ? 'italic' : 'normal' }}>{p}</p>
                    ))}
                  </div>
                )
              })() : (
                <button
                  onClick={() => fetchMeetingsAndBriefing(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--plum)', fontSize: '14px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}
                >
                  Get today's briefing →
                </button>
              )}
            </div>
            {/* Manual refresh button */}
            {!briefingLoading && briefing && (
              <button
                onClick={() => fetchMeetingsAndBriefing(true)}
                title="Refresh briefing"
                style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', padding: '4px', borderRadius: '4px', fontSize: '14px', flexShrink: 0, lineHeight: 1 }}
              >
                ↺
              </button>
            )}
          </div>

          {/* Today's meetings — shown below briefing if any */}
          {todayMeetings.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayMeetings.map(m => {
                const start = new Date(m.startTime)
                const end = new Date(start.getTime() + 60 * 60000)
                const now2 = new Date()
                const isLive = now2 >= start && now2 < end
                const minUntil = Math.round((start.getTime() - now2.getTime()) / 60000)
                const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                return (
                  <div key={m.startTime + m.topic} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: isLive ? '#F0FDF4' : 'var(--page-bg)', border: `1px solid ${isLive ? '#86EFAC' : 'var(--gray-light)'}` }}>
                    <span style={{ fontSize: '14px' }}>🎥</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{m.topic}</span>
                      <span style={{ fontSize: '13px', color: 'var(--gray-mid)', marginLeft: '8px' }}>{timeStr}</span>
                    </div>
                    {isLive && <span style={{ fontSize: '12px', fontWeight: 700, background: 'var(--plum-light)', color: '#166534', borderRadius: '20px', padding: '2px 10px' }}>🔴 Live</span>}
                    {!isLive && minUntil > 0 && minUntil <= 120 && <span style={{ fontSize: '12px', fontWeight: 600, background: '#FEF3C7', color: '#92400E', borderRadius: '20px', padding: '2px 10px' }}>In {minUntil} min</span>}
                    <a href={m.startUrl || m.joinUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: isLive ? 'var(--accent)' : '#0b5cff', color: 'white', borderRadius: '6px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      {isLive ? 'Join Now' : 'Start'}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── PENDING STUDENTS BANNER ── */}
        {pendingStudents.length > 0 && (
          <div
            onClick={() => router.push('/teacher/students')}
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>
                {pendingStudents.length === 1
                  ? `${pendingStudents[0].firstName} ${pendingStudents[0].lastName} is waiting to join`
                  : `${pendingStudents.length} students are waiting for approval`}
              </div>
              <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                {pendingStudents.length === 1
                  ? `${pendingStudents[0].email}${pendingStudents[0].gradeLevel ? ` · Grade ${pendingStudents[0].gradeLevel}` : ''} — click to review`
                  : pendingStudents.slice(0, 3).map(s => s.firstName).join(', ') + (pendingStudents.length > 3 ? ` and ${pendingStudents.length - 3} more` : '') + ' — click to review'}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        )}

        {/* ── SMART ALERTS ── */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {alerts.map(alert => {
              const colors = {
                urgent: { bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626', text: '#991B1B', sub: '#B91C1C' },
                warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', text: '#92400E', sub: '#B45309' },
                info: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB', text: '#1E3A8A', sub: '#1D4ED8' },
              }[alert.level]
              const icons = {
                urgent: <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>,
                warning: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
                info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
              }[alert.level]
              return (
                <div
                  key={alert.id}
                  onClick={() => alert.href && router.push(alert.href)}
                  style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: alert.href ? 'pointer' : 'default' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{icons}</svg>
                  <span style={{ fontSize: '14px', color: colors.text, fontWeight: 500, flex: 1 }}>{alert.message}</span>
                  {alert.href && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.sub} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  )}
                  {alert.dismissible && (
                    <button
                      title="Dismiss for the rest of today"
                      onClick={e => {
                        e.stopPropagation()
                        dismissAlertForToday(alert.id)
                        setAlerts(prev => prev.filter(a => a.id !== alert.id))
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '2px', display: 'flex', flexShrink: 0, opacity: 0.55 }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── STUDENTS NEEDING ATTENTION ── */}
        {attention.length > 0 && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
                Students Needing Attention
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>Click a student to open the gradebook</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {attention.map((row, idx) => (
                <div
                  key={row.id}
                  onClick={() => router.push('/teacher/gradebook')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
                    paddingTop: '12px', paddingBottom: '12px', cursor: 'pointer',
                    borderBottom: idx === attention.length - 1 ? 'none' : '1px solid var(--gray-light)',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--plum-light)', color: 'var(--plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                    {row.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--foreground)', minWidth: '140px' }}>
                    {row.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {row.late > 0 && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', background: '#FEE2E2', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: '20px' }}>
                        ⚠ {row.late} late
                      </span>
                    )}
                    {row.drop && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 10px', borderRadius: '20px' }}>
                        📉 slipping: {row.drop.from} → {row.drop.to}
                      </span>
                    )}
                    {row.quiet && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', background: 'var(--gray-light)', padding: '2px 10px', borderRadius: '20px' }}>
                        Nothing submitted this week
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OVERDUE (previous weeks, ungraded) ── */}
        {!statsLoading && overdueStats.length > 0 && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>
                Overdue Grading
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>From previous weeks</span>
            </div>
            <div>
              {activeCourses.map((course, idx) => {
                const stat = overdueStats.find(s => s.courseId === course.id)
                if (!stat || stat.ungraded === 0) return null

                return (
                  <div key={course.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--gray-light)',
                  }}>
                    <span style={{ width: '160px', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', lineHeight: 1.2 }}>
                      {course.title}
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'rgba(242,201,76,0.15)',
                        padding: '2px 10px', borderRadius: '20px',
                      }}>
                        {stat.ungraded} ungraded
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── THIS WEEK ── */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
              This Week's Grading
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{weekRangeLabel}</span>
          </div>

          {loading || statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ width: '160px', height: '16px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '90px', height: '10px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                    <div style={{ flex: 1, height: '10px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '90px', height: '10px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                    <div style={{ flex: 1, height: '10px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : activeCourses.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>No active courses.</p>
          ) : (
            <div>
              {activeCourses.map((course, idx) => {
                const stat = weekStats.find(s => s.courseId === course.id)
                const assigned = stat?.assigned ?? 0
                const received = stat?.received ?? 0
                const graded = stat?.graded ?? 0
                const late = stat?.late ?? 0
                const isLast = idx === activeCourses.length - 1
                const submissionPct = assigned > 0 ? Math.round((received / assigned) * 100) : 0
                const gradingPct = received > 0 ? Math.round((graded / received) * 100) : 0
                const allSubmitted = assigned > 0 && received >= assigned
                const allGraded = received > 0 && graded >= received

                return (
                  <div key={course.id} style={{
                    paddingTop: '18px', paddingBottom: '18px',
                    borderBottom: isLast ? 'none' : '1px solid var(--gray-light)',
                  }}>
                    {/* Course title + overall summary */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', lineHeight: 1.2 }}>
                        {course.title}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--gray-mid)' }}>
                        {stat?.avg != null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--plum)', background: 'var(--plum-light)', padding: '2px 10px', borderRadius: '20px' }}>
                              Avg {stat.avg} · {letterFor(course.id, stat.avg)}
                            </span>
                            {stat.prevAvg != null && stat.avg - stat.prevAvg !== 0 && (
                              <span style={{ fontWeight: 700, color: stat.avg > stat.prevAvg ? '#15803d' : '#b91c1c' }}>
                                {stat.avg > stat.prevAvg ? '▲' : '▼'} {Math.abs(stat.avg - stat.prevAvg)}
                              </span>
                            )}
                          </span>
                        )}
                        <span>{assigned > 0 ? `${assigned} assigned` : 'No assignments this week'}</span>
                      </span>
                    </div>

                    {assigned === 0 && received === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--gray-mid)', fontStyle: 'italic', paddingLeft: '4px' }}>
                        Nothing scheduled this week.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Submitted row — only show when there are assigned items */}
                        {assigned > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ width: '90px', flexShrink: 0, fontSize: '12px', color: 'var(--gray-dark)', fontWeight: 600, letterSpacing: '0.3px' }}>
                            Submitted
                          </span>
                          <SubmissionBar submitted={received} late={late} assigned={assigned} />
                          <div style={{ width: '200px', flexShrink: 0, textAlign: 'right', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <span style={{ color: 'var(--gray-mid)' }}>
                              <span style={{ fontWeight: 600, color: allSubmitted ? 'var(--accent)' : 'var(--foreground)' }}>{received}</span>
                              {' of '}
                              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{assigned}</span>
                            </span>
                            {late > 0 ? (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                                ⚠ {late} late
                              </span>
                            ) : allSubmitted ? (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', background: 'var(--plum-light)', padding: '2px 8px', borderRadius: '20px' }}>
                                ✓ All in
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '2px 8px', borderRadius: '20px' }}>
                                {submissionPct}%
                              </span>
                            )}
                          </div>
                        </div>
                        )}

                        {/* Graded row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ width: '90px', flexShrink: 0, fontSize: '12px', color: 'var(--gray-dark)', fontWeight: 600, letterSpacing: '0.3px' }}>
                            Graded
                          </span>
                          <GradingBar graded={graded} received={received} />
                          <div style={{ width: '200px', flexShrink: 0, textAlign: 'right', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            {received > 0 ? (
                              <>
                                <span style={{ color: 'var(--gray-mid)' }}>
                                  <span style={{ fontWeight: 600, color: allGraded ? 'var(--accent)' : 'var(--foreground)' }}>{graded}</span>
                                  {' of '}
                                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{received}</span>
                                  {' turned in'}
                                </span>
                                <span style={{
                                  fontSize: '12px', fontWeight: 700,
                                  color: allGraded ? 'var(--accent)' : 'var(--plum)',
                                  background: allGraded ? 'var(--plum-light)' : 'var(--plum-light)',
                                  padding: '2px 8px', borderRadius: '20px',
                                }}>
                                  {allGraded ? '✓ Done' : gradingPct + '%'}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--gray-mid)', fontStyle: 'italic' }}>
                                Nothing to grade yet
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Videos row — only when this week's plan has video lessons */}
                        {(stat?.videoAssigned ?? 0) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ width: '90px', flexShrink: 0, fontSize: '12px', color: 'var(--gray-dark)', fontWeight: 600, letterSpacing: '0.3px' }}>
                              Videos
                            </span>
                            <VideoBar watched={stat!.videoWatched} assigned={stat!.videoAssigned} />
                            <div style={{ width: '200px', flexShrink: 0, textAlign: 'right', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <span style={{ color: 'var(--gray-mid)' }}>
                                <span style={{ fontWeight: 600, color: stat!.videoWatched >= stat!.videoAssigned ? 'var(--accent)' : 'var(--foreground)' }}>{stat!.videoWatched}</span>
                                {' of '}
                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{stat!.videoAssigned}</span>
                                {' watched'}
                              </span>
                              <span style={{
                                fontSize: '12px', fontWeight: 700,
                                color: stat!.videoWatched >= stat!.videoAssigned ? 'var(--accent)' : 'var(--gray-mid)',
                                background: stat!.videoWatched >= stat!.videoAssigned ? 'rgba(242,201,76,0.15)' : 'var(--gray-light)',
                                padding: '2px 8px', borderRadius: '20px',
                              }}>
                                {stat!.videoWatched >= stat!.videoAssigned ? '✓ All' : Math.round((stat!.videoWatched / stat!.videoAssigned) * 100) + '%'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── TURN-INS BY STUDENT ── */}
        {/* Who has turned in what, per course, on the most recent scheduled
            week — the roster-level view the per-course bars above can't give. */}
        {!loading && turnIns.length > 0 && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
                Turn-ins by Student
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                Each class&apos;s most recent scheduled week · in-class days are tracked on Participation
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '16px' }}>
              {activeCourses.map(course => {
                const ti = turnIns.find(t => t.courseId === course.id)
                if (!ti) return null
                const weekLabel = new Date(ti.weekStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const doneRows = ti.rows.filter(r => r.submitted >= r.total)
                const behindRows = ti.rows.filter(r => r.submitted < r.total)
                return (
                  <div key={course.id} style={{ border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{course.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>week of {weekLabel}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {behindRows.map(r => (
                        <div key={r.profileId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--foreground)', fontWeight: 500, minWidth: '120px' }}>{r.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: r.submitted === 0 ? '#b91c1c' : '#b45309', background: r.submitted === 0 ? '#fee2e2' : '#fef3c7', padding: '1px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                            {r.submitted} of {r.total}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                            missing {r.missing.slice(0, 6).join(', ')}{r.missing.length > 6 ? ` +${r.missing.length - 6}` : ''}
                          </span>
                        </div>
                      ))}
                      {behindRows.length === 0 && (
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>✓ Everyone is caught up</div>
                      )}
                      {doneRows.length > 0 && behindRows.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                          ✓ All in: {doneRows.map(r => r.name.split(' ')[0]).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── NEXT WEEK PLANNING ── */}
        {/* This page is all about the current week — this card is the one
            forward-looking piece: which classes are already scheduled for
            next week, and a one-click jump to schedule the rest. */}
        {!loading && activeCourses.length > 0 && (() => {
          const nextMonday = new Date(monday)
          nextMonday.setDate(monday.getDate() + 7)
          const plannedCount = activeCourses.filter(c => nextWeekPlans.has(c.id)).length
          const allPlanned = plannedCount === activeCourses.length
          return (
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
                  Next Week&apos;s Assignments
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{formatWeekRange(nextMonday)}</span>
              </div>

              {allPlanned ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '16px' }}>🎉</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#15803d' }}>All {activeCourses.length} classes are scheduled for next week</span>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '14px' }}>
                  {plannedCount} of {activeCourses.length} classes scheduled
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeCourses.map((course, idx) => {
                  const count = nextWeekPlans.get(course.id)
                  const planned = count !== undefined
                  return (
                    <div key={course.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      paddingTop: '10px', paddingBottom: '10px',
                      borderBottom: idx === activeCourses.length - 1 ? 'none' : '1px solid var(--gray-light)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--foreground)', flex: 1 }}>{course.title}</span>
                      {planned ? (
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                          ✓ Scheduled{count ? ` — ${count} lesson${count !== 1 ? 's' : ''}` : ''}
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)' }}>Not scheduled yet</span>
                          <button
                            onClick={() => router.push('/teacher/schedule?courseId=' + course.id)}
                            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            Schedule →
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

      </main>
    </div>
  )
}
