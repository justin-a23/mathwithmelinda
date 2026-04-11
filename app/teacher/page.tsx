'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../src/graphql/queries'
import TeacherNav from '../components/TeacherNav'
import { useRoleGuard } from '../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

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
  received: number
  graded: number
}

const listRecentSubmissionsQuery = /* GraphQL */`
  query ListRecentSubmissions {
    listSubmissions(limit: 500) {
      items {
        id
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
          background: allDone ? '#22c55e' : 'var(--plum)',
          borderRadius: '6px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}
    </div>
  )
}

const listPendingStudentsQuery = /* GraphQL */`
  query ListPendingStudents {
    listStudentProfiles(limit: 50, filter: { status: { eq: "pending" } }) {
      items { id firstName lastName email gradeLevel }
    }
  }
`

const listActiveStudentsQuery = /* GraphQL */`
  query ListActiveStudents {
    listStudentProfiles(limit: 200, filter: { status: { eq: "active" } }) {
      items { id userId email firstName lastName }
    }
  }
`

const listAllSubmissionsForAlertsQuery = /* GraphQL */`
  query ListAllSubmissionsForAlerts {
    listSubmissions(limit: 1000) {
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
  query ListWeeklyPlans {
    listWeeklyPlans(limit: 200) {
      items {
        id
        weekStart
        weekStartDate
        courseId
      }
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


type Alert = {
  id: string
  level: 'urgent' | 'warning' | 'info'
  message: string
  href?: string
}


export default function TeacherDashboard() {
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', gradeLevel: '' })
  const [saving, setSaving] = useState(false)
  const [weekStats, setWeekStats] = useState<CourseWeekStats[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [pendingStudents, setPendingStudents] = useState<{ id: string; firstName: string; lastName: string; email: string; gradeLevel: string | null }[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [briefing, setBriefing] = useState<string>('')
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [todayMeetings, setTodayMeetings] = useState<{ topic: string; startTime: string; startUrl: string | null; joinUrl: string }[]>([])

  const BRIEFING_CACHE_KEY = 'mwm:teacherBriefing'

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

  // Load cached briefing on mount
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEFING_CACHE_KEY) || '{}')
      if (cached.date === today && cached.text) {
        setBriefing(cached.text)
      }
    } catch { /* ignore */ }
  }, [])

  async function fetchPendingStudents() {
    try {
      const result = await (client.graphql({ query: listPendingStudentsQuery }) as any)
      setPendingStudents(result.data.listStudentProfiles.items)
    } catch { /* silent */ }
  }

  async function fetchMeetingsAndBriefing(force = false) {
    const today = new Date().toISOString().slice(0, 10)

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
      const nextMondayStr = nextMonday.toISOString().slice(0, 10)

      // Fetch everything needed for the briefing in parallel — each query is wrapped
      // so one failure doesn't crash the whole briefing
      const safe = (p: Promise<any>) => p.then(r => r).catch(() => null)
      const [meetingsRes, subsRes, studentsRes, plansRes, pendingRes, assignRes] = await Promise.all([
        safe(client.graphql({ query: `query { listZoomMeetings(limit: 100) { items { id topic startTime durationMinutes startUrl joinUrl } } }` }) as any),
        safe(client.graphql({ query: listAllSubmissionsForAlertsQuery }) as any),
        safe(client.graphql({ query: listActiveStudentsQuery }) as any),
        safe(client.graphql({ query: listWeeklyPlansQuery }) as any),
        safe(client.graphql({ query: listPendingStudentsQuery }) as any),
        safe(client.graphql({ query: listAssignmentCountQuery }) as any),
      ])

      const hasAssignments = (assignRes?.data?.listAssignments?.items?.length ?? 0) > 0

      // Today's meetings
      const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
      const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999)
      const meetingItems = meetingsRes?.data?.listZoomMeetings?.items ?? []
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
      const allSubs = subsRes?.data?.listSubmissions?.items ?? []
      const ungradedThisWeek = allSubs.filter((s: any) => !s.isArchived && !s.grade && s.submittedAt && new Date(s.submittedAt).getTime() >= weekStartMs)
      const staleUngraded = allSubs.filter((s: any) => !s.isArchived && !s.grade && s.submittedAt && new Date(s.submittedAt) < new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))

      // Students who haven't submitted this week
      const submittedThisWeek = new Set(allSubs.filter((s: any) => !s.isArchived && s.submittedAt && new Date(s.submittedAt).getTime() >= weekStartMs).map((s: any) => s.studentId))
      const activeStudents: any[] = studentsRes?.data?.listStudentProfiles?.items ?? []
      const notSubmitted = activeStudents.filter(s => !submittedThisWeek.has(s.userId) && !submittedThisWeek.has(s.email))

      // Next week planned?
      const weeklyPlans: any[] = plansRes?.data?.listWeeklyPlans?.items ?? []
      const nextWeekPlanned = weeklyPlans.some((p: any) => p.weekStart === nextMondayStr || p.weekStartDate === nextMondayStr)
      const dayOfWeek = now.getDay()
      const isEndOfWeek = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 0 || dayOfWeek === 6

      // Pending students
      const pendingItems = pendingRes?.data?.listStudentProfiles?.items ?? []
      const pendingCount = pendingItems.length
      const pendingNames = pendingItems.slice(0, 3).map((s: any) => `${s.firstName} ${s.lastName}`).join(', ')

      const gradingSection = hasAssignments
        ? `GRADING:
- Ungraded submissions this week: ${ungradedThisWeek.length}
- Submissions ungraded for 5+ days: ${staleUngraded.length}
- Active students who haven't submitted anything this week: ${notSubmitted.length}${notSubmitted.length > 0 ? ` (${notSubmitted.slice(0,3).map((s:any)=>s.firstName).join(', ')})` : ''}`
        : `GRADING:
- No assignments have been created yet — nothing to grade.`

      const context = `Current date/time: ${todayStr}

TODAY'S ZOOM MEETINGS:
${meetingLines}

${gradingSection}

PLANNING:
- Next week's assignments planned: ${nextWeekPlanned ? 'Yes' : 'No'}${!nextWeekPlanned && isEndOfWeek ? ' (it is end of week — this needs attention)' : ''}

PENDING STUDENT APPROVALS:
- ${pendingCount > 0 ? `${pendingCount} student(s) waiting for approval: ${pendingNames}` : 'None'}`

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
      const meetingsRes = await (client.graphql({
        query: `query { listZoomMeetings(limit: 100) { items { id topic startTime durationMinutes startUrl joinUrl } } }`
      }) as any)
      const meetsToday = (meetingsRes.data.listZoomMeetings.items as any[])
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
      const nextMondayStr = nextMonday.toISOString().slice(0, 10)
      const dayOfWeek = now.getDay() // 0=Sun,1=Mon...5=Fri,6=Sat
      const newAlerts: Alert[] = []

      const safeQ = (p: Promise<any>) => p.then(r => r).catch(() => null)
      const [subsResult, studentsResult, plansResult, assignResult] = await Promise.all([
        safeQ(client.graphql({ query: listAllSubmissionsForAlertsQuery }) as any),
        safeQ(client.graphql({ query: listActiveStudentsQuery }) as any),
        safeQ(client.graphql({ query: listWeeklyPlansQuery }) as any),
        safeQ(client.graphql({ query: listAssignmentCountQuery }) as any),
      ])

      const allSubs = subsResult?.data?.listSubmissions?.items ?? []
      const activeStudents: { id: string; userId: string; email: string; firstName: string; lastName: string }[] =
        studentsResult?.data?.listStudentProfiles?.items ?? []
      const weeklyPlans: { id: string; weekStart: string; courseId: string }[] =
        plansResult?.data?.listWeeklyPlans?.items ?? []
      const hasAnyAssignments = (assignResult?.data?.listAssignments?.items?.length ?? 0) > 0

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
      }

      // 3. Next week's plans not set yet (warn Thu/Fri/weekend)
      if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 0 || dayOfWeek === 6) {
        const nextWeekPlanned = weeklyPlans.some(p => p.weekStart === nextMondayStr)
        if (!nextWeekPlanned) {
          const dayName = dayOfWeek === 4 ? 'Thursday' : dayOfWeek === 5 ? 'Friday' : 'the weekend'
          newAlerts.push({
            id: 'next-week-not-planned',
            level: 'warning',
            message: `It's ${dayName} — next week's assignments haven't been set yet`,
            href: '/teacher/plans',
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
      const result = await client.graphql({ query: listCourses })
      setCourses(result.data.listCourses.items as Course[])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeekStats() {
    try {
      const monday = getMonday(new Date())
      const weekStartMs = monday.getTime()

      const result = await (client.graphql({ query: listRecentSubmissionsQuery }) as any)
      const allSubs = result.data.listSubmissions.items as {
        id: string
        content: string | null
        grade: string | null
        status: string | null
        submittedAt: string | null
        isArchived: boolean | null
      }[]

      const byCourse: Record<string, { received: number; graded: number }> = {}

      for (const sub of allSubs) {
        if (sub.isArchived) continue
        if (!sub.submittedAt) continue
        if (new Date(sub.submittedAt).getTime() < weekStartMs) continue

        let courseId = ''
        try {
          const parsed = JSON.parse(sub.content || '{}')
          courseId = parsed.courseId || ''
        } catch { continue }

        if (!courseId) continue
        if (!byCourse[courseId]) byCourse[courseId] = { received: 0, graded: 0 }
        byCourse[courseId].received += 1
        if (sub.grade) byCourse[courseId].graded += 1
      }

      setWeekStats(
        Object.entries(byCourse).map(([courseId, data]) => ({ courseId, ...data }))
      )
    } catch (err) {
      console.error('Error fetching week stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  async function addCourse() {
    if (!newCourse.title) return
    setSaving(true)
    try {
      const { createCourse } = await import('../../src/graphql/mutations')
      await client.graphql({ query: createCourse, variables: { input: newCourse } })
      setNewCourse({ title: '', description: '', gradeLevel: '' })
      setShowAddCourse(false)
      fetchCourses()
    } catch (err) {
      console.error('Error creating course:', err)
    } finally {
      setSaving(false)
    }
  }

  const monday = getMonday(new Date())
  const weekRangeLabel = formatWeekRange(monday)
  const activeCourses = courses.filter(c => !c.isArchived)

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: totalUngraded === 0 ? '#16a34a' : 'var(--foreground)' }}>
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
                    {isLive && <span style={{ fontSize: '12px', fontWeight: 700, background: '#dcfce7', color: '#166534', borderRadius: '20px', padding: '2px 10px' }}>🔴 Live</span>}
                    {!isLive && minUntil > 0 && minUntil <= 120 && <span style={{ fontSize: '12px', fontWeight: 600, background: '#FEF3C7', color: '#92400E', borderRadius: '20px', padding: '2px 10px' }}>In {minUntil} min</span>}
                    <a href={m.startUrl || m.joinUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: isLive ? '#16a34a' : '#0b5cff', color: 'white', borderRadius: '6px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
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
                </div>
              )
            })}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '160px', height: '16px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--gray-light)' }} />
                  <div style={{ width: '140px', height: '14px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                </div>
              ))}
            </div>
          ) : activeCourses.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>No active courses.</p>
          ) : (
            <div>
              {activeCourses.map((course, idx) => {
                const stat = weekStats.find(s => s.courseId === course.id)
                const received = stat?.received ?? 0
                const graded = stat?.graded ?? 0
                const pct = received > 0 ? Math.round((graded / received) * 100) : null
                const allDone = pct === 100
                const isLast = idx === activeCourses.length - 1

                return (
                  <div key={course.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--gray-light)',
                  }}>
                    <span style={{ width: '160px', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', lineHeight: 1.2 }}>
                      {course.title}
                    </span>
                    <GradingBar graded={graded} received={received} />
                    <div style={{ width: '200px', flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {received > 0 ? (
                        <>
                          <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                            <span style={{ fontWeight: 600, color: allDone ? '#16a34a' : 'var(--foreground)' }}>{graded}</span>
                            {' of '}
                            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{received}</span>
                            {' graded'}
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: 700,
                            color: allDone ? '#16a34a' : 'var(--plum)',
                            background: allDone ? '#dcfce7' : 'var(--plum-light)',
                            padding: '2px 8px', borderRadius: '20px',
                          }}>
                            {allDone ? '✓ Done' : pct + '%'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--gray-light)', fontStyle: 'italic' }}>
                          No submissions yet
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Course form */}
        {showAddCourse && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '20px' }}>New Course</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course Title</label>
                <input type="text" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. Algebra 2"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input type="text" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Short description"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Grade Level</label>
                <input type="text" value={newCourse.gradeLevel} onChange={e => setNewCourse({ ...newCourse, gradeLevel: e.target.value })} placeholder="e.g. 10"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={addCourse} disabled={saving}
                style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                {saving ? 'Saving...' : 'Save Course'}
              </button>
              <button onClick={() => setShowAddCourse(false)}
                style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── COURSES ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
            Your Courses
          </h2>
          <button
            onClick={() => setShowAddCourse(true)}
            style={{ background: 'var(--background)', color: 'var(--gray-dark)', border: '1px dashed var(--gray-light)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Course
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading courses...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {activeCourses.map(course => {
              const stat = weekStats.find(s => s.courseId === course.id)
              const received = stat?.received ?? 0
              const graded = stat?.graded ?? 0
              const pct = received > 0 ? Math.round((graded / received) * 100) : null
              const allDone = pct === 100

              return (
                <div key={course.id}
                  style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,79,166,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)' }}>{course.title}</div>
                      {pct !== null && (
                        <span style={{
                          fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', flexShrink: 0, marginLeft: '8px',
                          background: allDone ? '#dcfce7' : 'var(--plum-light)',
                          color: allDone ? '#16a34a' : 'var(--plum)',
                        }}>
                          {allDone ? '✓' : pct + '%'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '4px' }}>{course.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>Grade {course.gradeLevel}</div>
                  </div>

                  <div style={{ height: '12px', margin: '16px 0' }}>
                    {received > 0 && <GradingBar graded={graded} received={received} />}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => router.push('/teacher/library/' + course.id)}
                      style={{ background: 'var(--plum)', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                      Manage Lessons
                    </button>
                    <button onClick={() => router.push('/teacher/schedule?courseId=' + course.id)}
                      style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                      Schedule Week
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
