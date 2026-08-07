'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import MwmLogo from '../components/MwmLogo'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import { useTheme } from '../ThemeProvider'
import { apiFetch } from '@/app/lib/apiFetch'
import { useRoleGuard } from '../hooks/useRoleGuard'
import MathRenderer from '../components/MathRenderer'

const client = generateClient()

// Per-question detail for the answers section. Selects ONLY parent-readable
// fields — correctAnswer is teacher-only at the field level, and including it
// would error the whole query for a parent (see the 2026-08-04 student fix).
const getLessonTemplateQuestions = /* GraphQL */`
  query GetLessonTemplateQuestions($id: ID!) {
    getLessonTemplate(id: $id) {
      questions {
        items { id order questionText questionType }
      }
    }
  }
`

/**
 * ParentStudent links a parent to a child by EMAIL, but Submission.studentId
 * holds the child's Cognito sub. This bridges the two.
 *
 * Resolving at query time rather than storing the sub on ParentStudent is
 * deliberate: the link is created from an invite before the child necessarily
 * has an account, so an email is the only identifier available at that point.
 */
const getStudentSubByEmail = /* GraphQL */`
  query GetStudentSubByEmail($email: String!) {
    listStudentProfiles(filter: { email: { eq: $email } }, limit: 1000) {
      items { id userId courseId }
    }
  }
`

// Sent report cards for this child. ReportCardRecord.studentId holds the
// StudentProfile row id (NOT the Cognito sub the submissions use), which is
// why the profile lookup above also selects id.
const listReportCardsForStudent = /* GraphQL */`
  query ListReportCardsForStudent($filter: ModelReportCardRecordFilterInput) {
    listReportCardRecords(filter: $filter, limit: 200) {
      items {
        id studentId reportTitle semesterName courseName
        finalLetter weightedAvg comment sentAt recipientEmails quarterBreakdown
      }
    }
  }
`

// Grade-letter thresholds live on the Semester (Melinda configures them per
// course). One small scan; falls back to the standard 90/80/70/60 scale.
const listSemestersForScale = /* GraphQL */`
  query ListSemestersForScale {
    listSemesters(limit: 200) {
      items { id courseId isActive gradeA gradeB gradeC gradeD }
    }
  }
`

const listParentStudents = /* GraphQL */`
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 1000) {
      items {
        id
        parentId
        studentEmail
        studentName
      }
    }
  }
`

const listSubmissionsByStudent = /* GraphQL */`
  query ListSubmissions($studentId: String!) {
    listSubmissionsByStudentId(studentId: $studentId, limit: 500) {
      items {
        id
        studentId
        content
        grade
        teacherComment
        submittedAt
        assignment {
          id
          title
          dueDate
          course {
            id
            title
          }
        }
      }
    }
  }
`

type Child = {
  id: string
  parentId: string
  studentEmail: string
  studentName: string
}

type Submission = {
  id: string
  studentId: string
  content: string | null
  grade: string | null
  teacherComment: string | null
  submittedAt: string | null
  assignment?: {
    id: string
    title: string
    dueDate: string | null
    course?: { id: string; title: string } | null
  } | null
}

type ReportCard = {
  id: string
  studentId: string
  reportTitle: string
  semesterName: string
  courseName: string
  finalLetter: string | null
  weightedAvg: number | null
  comment: string | null
  sentAt: string
  recipientEmails: string | null
  quarterBreakdown: string | null
}

type Question = { id: string; order: number; questionText: string; questionType: string }
type GradedQuestion = { id: string; questionText: string; questionType: string; correct: boolean; studentAnswer: string | null; correctAnswer: string | null }

function letterChip(letter: string | null): { bg: string; text: string } {
  if (letter === 'A') return { bg: '#dcfce7', text: '#15803d' }
  if (letter === 'B') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (letter === 'C') return { bg: '#fef9c3', text: '#a16207' }
  if (letter === 'D') return { bg: '#ffedd5', text: '#c2410c' }
  if (letter === 'F') return { bg: '#fee2e2', text: '#dc2626' }
  return { bg: '#f3f4f6', text: '#374151' }
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Due date + late flag from a submission's content JSON (best-effort). */
function dueInfo(sub: { content: string | null; submittedAt: string | null }): { due: string | null; late: boolean } {
  try {
    const parsed = JSON.parse(sub.content || '{}')
    if (!parsed.dueDateTime) return { due: null, late: false }
    const due = new Date(parsed.dueDateTime)
    if (isNaN(due.getTime())) return { due: null, late: false }
    const late = !!sub.submittedAt && new Date(sub.submittedAt) > due
    return { due: parsed.dueDateTime, late }
  } catch { return { due: null, late: false } }
}

export default function ParentDashboard() {
  useRoleGuard('parent')
  const { authStatus, signOut } = useAuthenticator()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [gradeScale, setGradeScale] = useState({ a: 90, b: 80, c: 70, d: 60 })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [questionMap, setQuestionMap] = useState<Record<string, Question[]>>({})
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set())
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [openReportCardId, setOpenReportCardId] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    fetchChildren()
  }, [authStatus])

  useEffect(() => {
    if (!selectedChild) return
    fetchSubmissions(selectedChild.studentEmail)
  }, [selectedChild])

  async function fetchChildren() {
    try {
      const currentUser = await getCurrentUser()
      const result = await client.graphql({
        query: listParentStudents,
        variables: { filter: { parentId: { eq: currentUser.userId } } }
      }) as any
      const items = (result.data as { listParentStudents: { items: Child[] } }).listParentStudents.items
      setChildren(items)
      if (items.length === 1) setSelectedChild(items[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingChildren(false)
    }
  }

  async function fetchSubmissions(studentEmail: string) {
    setLoadingSubmissions(true)
    setSelectedSubmission(null)
    setImageUrls([])
    try {
      const profileRes = await client.graphql({
        query: getStudentSubByEmail,
        variables: { email: studentEmail }
      }) as any
      const childProfile = profileRes.data.listStudentProfiles.items[0]
      const studentSub = childProfile?.userId

      // Sent report cards (drafts have null recipientEmails and stay teacher-only).
      // The truthy check is client-side because DynamoDB stores explicit nulls,
      // which attributeExists-style filters treat as present.
      setReportCards([])
      setOpenReportCardId(null)
      if (childProfile?.id) {
        try {
          const rcRes = await (client.graphql({
            query: listReportCardsForStudent,
            variables: { filter: { studentId: { eq: childProfile.id } } },
          }) as any)
          const rcs = (rcRes.data.listReportCardRecords.items as ReportCard[])
            .filter(r => r.recipientEmails)
            .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
          setReportCards(rcs)
        } catch { /* section simply stays hidden */ }
      }
      // Resolve the child's course's active-semester grade scale (best-effort)
      if (childProfile?.courseId) {
        try {
          const semRes = await (client.graphql({ query: listSemestersForScale }) as any)
          const sems = semRes.data.listSemesters.items as any[]
          const sem = sems.find(x => x.courseId === childProfile.courseId && x.isActive) || sems.find(x => x.courseId === childProfile.courseId)
          if (sem) setGradeScale({ a: sem.gradeA ?? 90, b: sem.gradeB ?? 80, c: sem.gradeC ?? 70, d: sem.gradeD ?? 60 })
        } catch { /* keep default scale */ }
      }
      if (!studentSub) {
        // Linked child has no profile — invited but never signed up, or archived.
        setSubmissions([])
        return
      }

      const result = await client.graphql({
        query: listSubmissionsByStudent,
        variables: { studentId: studentSub }
      }) as any
      const items = (result.data as any).listSubmissionsByStudentId.items as Submission[]
      const sorted = items.sort((a, b) => {
        if (!a.submittedAt) return 1
        if (!b.submittedAt) return -1
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      })
      setSubmissions(sorted)
      // Start with only the newest week expanded
      {
        const weeks = [...new Set(sorted.filter((x: Submission) => x.grade).map((x: Submission) => weekOf(x)))].sort()
        setOpenWeeks(new Set(weeks.length ? [weeks[weeks.length - 1] as string] : []))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  function courseLabel(sub: Submission): string {
    if (sub.assignment?.course?.title) return sub.assignment.course.title
    // Schedule-flow submissions carry their labels in the content JSON, not
    // the (null) assignment relation — same source the teacher pages read.
    try { return JSON.parse(sub.content || '{}').courseTitle || 'Course' } catch { return 'Course' }
  }

  function lessonLabel(sub: Submission): string {
    if (sub.assignment?.title) return sub.assignment.title
    try { return JSON.parse(sub.content || '{}').lessonTitle || 'Lesson' } catch { return 'Lesson' }
  }

  function letterFor(avg: number): string {
    const t = gradeScale
    if (avg >= t.a) return 'A'
    if (avg >= t.b) return 'B'
    if (avg >= t.c) return 'C'
    if (avg >= t.d) return 'D'
    return 'F'
  }

  async function openSubmission(sub: Submission) {
    setSelectedSubmission(sub)
    setImageUrls([])
    if (!sub.content) return
    try {
      const parsed = JSON.parse(sub.content)
      if (parsed.files && parsed.files.length > 0) {
        const urls = await Promise.all(
          parsed.files.map(async (key: string) => {
            const res = await apiFetch('/api/view-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key })
            })
            if (!res.ok) return null
            const { url } = await res.json()
            return url || null
          })
        )
        // Drop failures rather than rendering broken <img> tags
        setImageUrls(urls.filter(Boolean))
      }
      // Fetch the lesson's questions so answers can be shown alongside them
      const templateId: string | undefined = parsed.lessonTemplateId
      if (templateId && !questionMap[templateId]) {
        try {
          const result = await (client.graphql({
            query: getLessonTemplateQuestions,
            variables: { id: templateId }
          }) as any)
          const qs: Question[] = result.data.getLessonTemplate?.questions?.items || []
          qs.sort((a, b) => a.order - b.order)
          setQuestionMap(prev => ({ ...prev, [templateId]: qs }))
        } catch (err) {
          console.error('Error fetching template questions:', err)
        }
      }
    } catch {}
  }

  const graded = submissions.filter(s => s.grade)
  const pending = submissions.filter(s => !s.grade)

  // Monday of the week a submission belongs to — from its due date when the
  // content JSON carries one, else the submission time. Used to group the
  // graded list: 150 lessons/year is unreadable flat, one line per week isn't.
  function weekOf(sub: Submission): string {
    let base: Date | null = null
    try {
      const c = JSON.parse(sub.content || '{}')
      if (c.dueDateTime) base = new Date(c.dueDateTime)
    } catch { /* fall through */ }
    if ((!base || isNaN(base.getTime())) && sub.submittedAt) base = new Date(sub.submittedAt)
    if (!base || isNaN(base.getTime())) return 'unknown'
    const d = new Date(base); d.setHours(0, 0, 0, 0)
    const dow = (d.getDay() + 6) % 7 // Monday = 0
    d.setDate(d.getDate() - dow)
    return d.toISOString().slice(0, 10)
  }

  function weekTitle(week: string): string {
    const d = new Date(week + 'T00:00:00')
    if (isNaN(d.getTime())) return 'Other'
    return 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const gradedWeekGroups = (() => {
    const m = new Map<string, Submission[]>()
    for (const sub of graded) {
      const k = weekOf(sub)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(sub)
    }
    return [...m.entries()].map(([week, items]) => {
      const nums = items.map(x => parseFloat(x.grade || '')).filter(n => !isNaN(n))
      return { week, items, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }
    }).sort((a, b) => b.week.localeCompare(a.week))
  })()

  function toggleWeek(week: string) {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  if (loadingChildren) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MwmLogo size={36} showWordmark badge="Parent" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={() => router.push('/parent/messages')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            Messages
          </button>
          <button onClick={() => router.push('/parent/syllabus')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            Syllabus
          </button>
          <button onClick={async () => { await signOut(); router.replace('/login') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      {children.length === 0 ? (
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>No students linked yet</div>
          <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>
            Ask Melinda to send you a parent invite link. Once you click it and confirm, your child's grades and submissions will appear here.
          </p>
        </main>
      ) : (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>

          {/* Child selector (only shown if multiple children) */}
          {children.length > 1 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '12px' }}>Select Student</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {children.map(child => (
                  <button key={child.id} onClick={() => setSelectedChild(child)}
                    style={{ background: selectedChild?.id === child.id ? 'var(--plum)' : 'var(--background)', color: selectedChild?.id === child.id ? 'white' : 'var(--foreground)', border: `1px solid ${selectedChild?.id === child.id ? 'var(--plum)' : 'var(--gray-light)'}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    {child.studentName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedChild && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>{selectedChild.studentName}</h1>
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>{selectedChild.studentEmail}</p>
              </div>

              {/* Summary bar */}
              {!loadingSubmissions && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--plum)' }}>{submissions.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 500 }}>Total Submitted</div>
                  </div>
                  <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)' }}>{graded.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Graded</div>
                  </div>
                  <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)' }}>{pending.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Awaiting Grade</div>
                  </div>
                  {graded.length > 0 && (() => {
                    const numGrades = graded.map(s => parseFloat(s.grade || '0')).filter(n => !isNaN(n))
                    if (numGrades.length === 0) return null
                    const avg = numGrades.reduce((a, b) => a + b, 0) / numGrades.length
                    return (
                      <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          {avg.toFixed(1)}
                          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--plum)', background: 'var(--plum-light)', borderRadius: '6px', padding: '1px 9px' }}>{letterFor(avg)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Avg Grade</div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ── Report Cards ── */}
              {!loadingSubmissions && reportCards.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '10px' }}>
                    Report Cards ({reportCards.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reportCards.map(rc => {
                      const open = openReportCardId === rc.id
                      const chip = letterChip(rc.finalLetter)
                      let trend: { quarterName: string; weightedAvg: number | null; letter: string }[] = []
                      try { trend = JSON.parse(rc.quarterBreakdown || '[]') } catch { /* no trend */ }
                      return (
                        <div key={rc.id} style={{ border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--background)' }}>
                          <button
                            onClick={() => setOpenReportCardId(open ? null : rc.id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: chip.bg, color: chip.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', fontFamily: 'var(--font-display)', flexShrink: 0, border: `1px solid ${chip.text}33` }}>
                              {rc.finalLetter || '—'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                                {rc.reportTitle} · {rc.courseName}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                                {rc.semesterName} · {new Date(rc.sentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                {rc.weightedAvg !== null && ` · ${rc.weightedAvg.toFixed(1)}% weighted average`}
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2"
                              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>
                          {open && (
                            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--gray-light)' }}>
                              {trend.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                                  {trend.map(q => {
                                    const qc = letterChip(q.letter)
                                    return (
                                      <div key={q.quarterName} style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '8px 14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--plum)', marginBottom: '2px' }}>{q.quarterName}</div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{q.weightedAvg !== null ? q.weightedAvg.toFixed(1) + '%' : '—'}</span>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: qc.text, background: qc.bg, borderRadius: '6px', padding: '0 7px' }}>{q.letter}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {rc.comment && (
                                <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--foreground)', fontStyle: 'italic', lineHeight: 1.6, background: 'var(--plum-light)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid var(--plum)' }}>
                                  &ldquo;{rc.comment}&rdquo;
                                  <div style={{ fontSize: '11px', color: 'var(--plum)', marginTop: '8px', fontStyle: 'normal', fontWeight: 600 }}>— Melinda</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '32px' }}>
                {/* Submission list */}
                <div style={{ width: '320px', flexShrink: 0 }}>
                  {loadingSubmissions ? (
                    <p style={{ color: 'var(--gray-mid)' }}>Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No submissions yet.</p>
                  ) : (
                    <>
                      {pending.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                            Awaiting Grade ({pending.length})
                          </div>
                          {pending.map(sub => (
                            <div key={sub.id} onClick={() => openSubmission(sub)}
                              style={{ background: selectedSubmission?.id === sub.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === sub.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,166,0.12)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '3px' }}>
                                {courseLabel(sub)}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '3px' }}>
                                {lessonLabel(sub)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                                {sub.submittedAt ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString()}` : ''}
                                {dueInfo(sub).late && <span style={{ color: '#B91C1C', fontWeight: 700, marginLeft: '6px' }}>· late</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {graded.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '10px' }}>
                            Graded ({graded.length})
                          </div>
                          {gradedWeekGroups.map(group => (
                            <div key={group.week} style={{ marginBottom: '10px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                              <button onClick={() => toggleWeek(group.week)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'rgba(123,79,166,0.04)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                                <span style={{ fontSize: '11px', color: 'var(--plum)', transform: openWeeks.has(group.week) ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--foreground)', flex: 1 }}>{weekTitle(group.week)}</span>
                                <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>{group.items.length} graded</span>
                                {group.avg !== null && (
                                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--plum)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{group.avg.toFixed(0)} avg</span>
                                )}
                              </button>
                              {openWeeks.has(group.week) && (
                                <div style={{ padding: '8px 8px 0' }}>
                          {group.items.map(sub => (
                            <div key={sub.id} onClick={() => openSubmission(sub)}
                              style={{ background: selectedSubmission?.id === sub.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === sub.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,166,0.12)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
                                  {courseLabel(sub)}
                                </div>
                                <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{sub.grade}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '3px' }}>
                                {lessonLabel(sub)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                                {sub.submittedAt ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString()}` : ''}
                                {dueInfo(sub).late && <span style={{ color: '#B91C1C', fontWeight: 700, marginLeft: '6px' }}>· late</span>}
                              </div>
                            </div>
                          ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Detail panel */}
                {selectedSubmission ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '4px' }}>
                        {lessonLabel(selectedSubmission)}
                      </h2>
                      {(() => {
                        const { due, late } = dueInfo(selectedSubmission)
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '13px', color: 'var(--gray-mid)' }}>
                            <span>{courseLabel(selectedSubmission)}</span>
                            {due && <span>· Due {fmtDateTime(due)}</span>}
                            {selectedSubmission.submittedAt && <span>· Submitted {fmtDateTime(selectedSubmission.submittedAt)}</span>}
                            {late && (
                              <span style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: '20px' }}>
                                Turned in late
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      {/* Grade */}
                      {selectedSubmission.grade && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Grade</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--plum)' }}>{selectedSubmission.grade}</div>
                          </div>
                          {selectedSubmission.teacherComment && (
                            <div style={{ flex: 1, borderLeft: '1px solid var(--plum-mid)', paddingLeft: '16px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Melinda's Comment</div>
                              <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6' }}>{selectedSubmission.teacherComment}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!selectedSubmission.grade && (
                        <div style={{ background: 'var(--gray-light)', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--gray-mid)' }}>
                          Not graded yet — check back soon.
                        </div>
                      )}

                      {/* Student notes */}
                      {selectedSubmission.content && (() => {
                        try {
                          const parsed = JSON.parse(selectedSubmission.content)
                          return parsed.notes ? (
                            <div style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Student notes</div>
                              <p style={{ fontSize: '14px', color: 'var(--foreground)' }}>{parsed.notes}</p>
                            </div>
                          ) : null
                        } catch { return null }
                      })()}

                      {/* Question-by-question detail. Once Melinda has graded,
                          content.gradedQuestions carries per-question right/wrong
                          plus the correct answer — show that. Before grading,
                          show the student's answers clearly labeled as theirs. */}
                      {selectedSubmission.content && (() => {
                        let parsed: Record<string, any> = {}
                        try { parsed = JSON.parse(selectedSubmission.content) } catch { return null }

                        const graded: GradedQuestion[] = Array.isArray(parsed.gradedQuestions) ? parsed.gradedQuestions : []
                        if (graded.length > 0) {
                          const gradable = graded.filter(g => g.questionType !== 'section_header')
                          const nCorrect = gradable.filter(g => g.correct).length
                          return (
                            <div style={{ marginBottom: '20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  Graded Results
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', background: 'var(--plum-light)', padding: '1px 10px', borderRadius: '20px' }}>
                                  {nCorrect} of {gradable.length} correct
                                </span>
                              </div>
                              {/* Translucent tints + theme-var text (matches the student
                                  My Grades breakdown) — solid light fills made the text
                                  invisible in dark mode. */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {gradable.map((g, i) => (
                                  <div key={g.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                                    background: g.correct ? 'rgba(21,128,61,0.06)' : 'rgba(220,38,38,0.06)',
                                    border: `1px solid ${g.correct ? 'rgba(21,128,61,0.15)' : 'rgba(220,38,38,0.15)'}`,
                                  }}>
                                    <div style={{
                                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                                      background: g.correct ? '#dcfce7' : '#fee2e2',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      {g.correct
                                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                                        <span style={{ fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                                        <MathRenderer text={g.questionText} />
                                      </div>
                                      <div style={{ marginTop: '4px', fontSize: '13px', color: g.correct ? '#15803d' : '#dc2626' }}>
                                        Student&apos;s answer:{' '}
                                        {g.studentAnswer
                                          ? <span style={{ fontWeight: 600 }}><MathRenderer text={g.studentAnswer} /></span>
                                          : <span style={{ fontStyle: 'italic' }}>No answer given</span>}
                                      </div>
                                      {!g.correct && g.correctAnswer && (
                                        <div style={{ marginTop: '2px', fontSize: '13px', color: '#15803d' }}>
                                          Correct answer: <span style={{ fontWeight: 600 }}><MathRenderer text={g.correctAnswer} /></span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }

                        const templateId: string | undefined = parsed.lessonTemplateId
                        const questions: Question[] = (templateId && questionMap[templateId]) || []
                        const answers: Record<string, string> = parsed.answers || {}
                        const answerable = questions.filter(q => q.questionType !== 'section_header' && q.questionType !== 'show_work')
                        if (answerable.length === 0) return null
                        return (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Questions &amp; Student&apos;s Answers
                              <span style={{ marginLeft: '8px', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(not graded yet)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {(() => {
                                let qNum = 0
                                return questions.map(q => {
                                  const isHeader = q.questionType === 'section_header'
                                  const isShowWork = q.questionType === 'show_work'
                                  if (!isHeader) qNum++
                                  if (isHeader || isShowWork) return null
                                  const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
                                  const qLabel = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
                                  const qBody = bookNumMatch ? bookNumMatch[2] : q.questionText
                                  return (
                                    <div key={q.id} style={{ padding: '12px 14px', background: 'var(--page-bg)', borderRadius: '8px', border: '1px solid var(--gray-light)' }}>
                                      <div style={{ display: 'flex', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-mid)', marginBottom: '6px' }}>
                                        <span style={{ flexShrink: 0 }}>{qLabel}</span>
                                        <MathRenderer text={qBody} />
                                      </div>
                                      <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)' }}>Student&apos;s answer: </span>
                                        {answers[q.id]
                                          ? <MathRenderer text={answers[q.id]} />
                                          : <span style={{ color: 'var(--gray-mid)' }}>No answer given</span>}
                                      </div>
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Photos */}
                      {imageUrls.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Submitted Work ({imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))', gap: '10px' }}>
                            {imageUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Work ${i + 1}`}
                                  style={{ width: '100%', minHeight: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-light)', cursor: 'pointer' }}
                                  onError={e => (e.currentTarget.style.display = 'none')}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Select a submission to view details.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  )
}
