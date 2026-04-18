'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../../components/TeacherNav'
import MwmLogo from '../../../components/MwmLogo'
import { useRoleGuard } from '../../../hooks/useRoleGuard'

const client = generateClient()

// ── Queries ──────────────────────────────────────────────────────────────────

const GET_STUDENT = /* GraphQL */ `
  query GetStudent($id: ID!) {
    getStudentProfile(id: $id) {
      id userId email firstName lastName preferredName
      gradeLevel courseId profilePictureKey status
      enrolledAt archivedAt
    }
  }
`

const LIST_ALL_SEMESTERS = /* GraphQL */ `
  query ListAllSemesters {
    listSemesters(limit: 200) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent quizWeightPercent testWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
        academicYear { id year }
      }
    }
  }
`

const LIST_ALL_PLANS = /* GraphQL */ `
  query ListAllPlans {
    listWeeklyPlans(limit: 500) {
      items {
        id weekStartDate courseWeeklyPlansId assignedStudentIds
        items {
          items {
            id dayOfWeek lessonTemplateId isPublished
            lesson { id title order }
          }
        }
      }
    }
  }
`

const LIST_TEMPLATES = /* GraphQL */ `
  query ListTemplates($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { id lessonCategory lessonNumber }
      nextToken
    }
  }
`

const LIST_STUDENT_SUBS = /* GraphQL */ `
  query ListStudentSubs($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 1000) {
      items { id studentId content grade status isArchived submittedAt }
    }
  }
`

const LIST_STUDENT_REPORTS = /* GraphQL */ `
  query ListStudentReports($filter: ModelReportCardRecordFilterInput) {
    listReportCardRecords(filter: $filter, limit: 200) {
      items {
        id studentId semesterId quarterId reportTitle finalLetter
        weightedAvg comment sentAt recipientEmails
      }
    }
  }
`

// ── Types ────────────────────────────────────────────────────────────────────

type Student = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  preferredName: string | null
  gradeLevel: string | null
  courseId: string | null
  profilePictureKey: string | null
  status: string | null
  enrolledAt: string | null
  archivedAt: string | null
}

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
  lessonWeightPercent: number | null
  quizWeightPercent: number | null
  testWeightPercent: number | null
  gradeA: number | null
  gradeB: number | null
  gradeC: number | null
  gradeD: number | null
  course: { id: string; title: string } | null
  academicYear: { id: string; year: string } | null
}

type SemesterSummary = {
  semester: Semester
  lessonsGraded: number
  lessonsAssigned: number
  lessonAvg: number | null
  quizAvg: number | null
  testAvg: number | null
  weightedAvg: number | null
  letter: string
  reports: {
    id: string
    title: string
    sentAt: string
    finalLetter: string | null
    weightedAvg: number | null
    quarterId: string | null
  }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function categoryLabel(cat: string | null | undefined): string {
  const c = (cat || '').toLowerCase()
  if (c.includes('quiz')) return 'quiz'
  if (c.includes('test') || c.includes('exam')) return 'test'
  return 'lesson'
}

function letterGrade(avg: number, a: number, b: number, c: number, d: number): string {
  if (avg >= a) return 'A'
  if (avg >= b) return 'B'
  if (avg >= c) return 'C'
  if (avg >= d) return 'D'
  return 'F'
}

function letterColor(letter: string) {
  if (letter === 'A') return { bg: '#dcfce7', text: '#15803d' }
  if (letter === 'B') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (letter === 'C') return { bg: '#fef9c3', text: '#a16207' }
  if (letter === 'D') return { bg: '#ffedd5', text: '#c2410c' }
  if (letter === 'F') return { bg: '#fee2e2', text: '#dc2626' }
  return { bg: '#f3f4f6', text: '#6b7280' }
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtYear(iso: string): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Unknown'
  return d.getFullYear().toString()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TranscriptPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const params = useParams()
  const { checking } = useRoleGuard('teacher')
  const studentId = params?.studentId as string

  const [student, setStudent] = useState<Student | null>(null)
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (studentId) loadTranscript()
  }, [studentId])

  async function loadTranscript() {
    setLoading(true)
    setError('')
    try {
      // 1) Student profile
      const stuRes = await (client.graphql({ query: GET_STUDENT, variables: { id: studentId } }) as any)
      const stu: Student | null = stuRes.data.getStudentProfile
      if (!stu) { setError('Student not found.'); setLoading(false); return }
      setStudent(stu)

      // 2) All semesters (we'll filter to those matching courses the student was enrolled in)
      const semRes = await (client.graphql({ query: LIST_ALL_SEMESTERS }) as any)
      const allSems: Semester[] = semRes.data.listSemesters.items

      // 3) All weekly plans
      const plansRes = await (client.graphql({ query: LIST_ALL_PLANS }) as any)
      const allPlans: any[] = plansRes.data.listWeeklyPlans.items

      // 4) Student's submissions (by userId OR email — legacy inconsistency)
      const subsRes = await (client.graphql({
        query: LIST_STUDENT_SUBS,
        variables: { filter: { or: [{ studentId: { eq: stu.userId } }, { studentId: { eq: stu.email } }] } },
      }) as any)
      const allSubs = subsRes.data.listSubmissions.items

      // Map lessonId -> grade for this student
      const gradeMap: Record<string, string | 'pending'> = {}
      for (const sub of allSubs) {
        if (sub.isArchived) continue
        let parsed: any = {}
        try { parsed = JSON.parse(sub.content || '{}') } catch { continue }
        const lid = parsed.lessonId
        if (!lid) continue
        gradeMap[lid] = sub.grade ? sub.grade : 'pending'
      }

      // 5) Report cards for this student (records live under StudentProfile.id)
      const reportsRes = await (client.graphql({
        query: LIST_STUDENT_REPORTS,
        variables: { filter: { studentId: { eq: stu.id } } },
      }) as any)
      const allReports = reportsRes.data.listReportCardRecords.items

      // 6) For each semester, compute the student's performance
      //    Only include semesters whose course matches any plan the student was on
      //    (this catches multi-course students who changed courses over time)
      const summaries: SemesterSummary[] = []
      const enrolledMs = stu.enrolledAt ? new Date(stu.enrolledAt).getTime() : null

      for (const sem of allSems) {
        if (!sem.courseId) continue

        // Plans for this course in this semester's range + respect enrolledAt + assignedStudentIds
        const plansInSem = allPlans.filter((p: any) => {
          if (p.weekStartDate < sem.startDate || p.weekStartDate > sem.endDate) return false
          if (p.courseWeeklyPlansId !== sem.courseId) return false
          if (enrolledMs !== null) {
            const weekStart = new Date(p.weekStartDate + 'T00:00:00')
            const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
            if (weekEnd.getTime() < enrolledMs) return false
          }
          if (p.assignedStudentIds) {
            try {
              const ids = typeof p.assignedStudentIds === 'string' ? JSON.parse(p.assignedStudentIds) : p.assignedStudentIds
              if (Array.isArray(ids) && ids.length > 0 && !ids.includes(stu.userId)) return false
            } catch { /* treat as all students */ }
          }
          return true
        })

        // Build unique lesson ids for this semester
        const lessonIds = new Set<string>()
        const templateIds = new Set<string>()
        const lessonTemplateMap: Record<string, string | null> = {}
        for (const plan of plansInSem) {
          for (const it of plan.items?.items || []) {
            if (!it.lesson) continue
            if (it.isPublished === false) continue
            lessonIds.add(it.lesson.id)
            if (it.lessonTemplateId) {
              templateIds.add(it.lessonTemplateId)
              lessonTemplateMap[it.lesson.id] = it.lessonTemplateId
            }
          }
        }

        if (lessonIds.size === 0) continue // student wasn't enrolled for this semester

        // Load category info from templates
        const catMap: Record<string, string> = {}
        if (templateIds.size > 0) {
          let nextToken: string | null = null
          do {
            const tmplRes = await (client.graphql({
              query: LIST_TEMPLATES,
              variables: { filter: { courseLessonTemplatesId: { eq: sem.courseId } }, limit: 500, nextToken },
            }) as any)
            for (const t of tmplRes.data.listLessonTemplates.items) {
              catMap[t.id] = categoryLabel(t.lessonCategory)
            }
            nextToken = tmplRes.data.listLessonTemplates.nextToken
          } while (nextToken)
        }

        // Compute averages
        const byCat: Record<string, number[]> = { lesson: [], quiz: [], test: [] }
        let lessonsGraded = 0
        for (const lid of lessonIds) {
          const g = gradeMap[lid]
          if (g && g !== 'pending') {
            const n = parseFloat(g)
            if (!isNaN(n)) {
              const tplId = lessonTemplateMap[lid]
              const cat = tplId ? (catMap[tplId] || 'lesson') : 'lesson'
              byCat[cat].push(n)
              lessonsGraded++
            }
          }
        }
        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
        const lAvg = avg(byCat.lesson)
        const qAvg = avg(byCat.quiz)
        const tAvg = avg(byCat.test)
        const lW = (sem.lessonWeightPercent ?? 60) / 100
        const qW = (sem.quizWeightPercent ?? 20) / 100
        const tW = (sem.testWeightPercent ?? 20) / 100
        let weightedSum = 0, weightedTotal = 0
        if (lAvg !== null) { weightedSum += lAvg * lW; weightedTotal += lW }
        if (qAvg !== null) { weightedSum += qAvg * qW; weightedTotal += qW }
        if (tAvg !== null) { weightedSum += tAvg * tW; weightedTotal += tW }
        const weightedAvg = weightedTotal > 0 ? weightedSum / weightedTotal : null
        const letter = weightedAvg !== null
          ? letterGrade(weightedAvg, sem.gradeA ?? 90, sem.gradeB ?? 80, sem.gradeC ?? 70, sem.gradeD ?? 60)
          : '—'

        // Report cards for THIS semester — sent ones only
        const reports = allReports
          .filter((r: any) => r.semesterId === sem.id && r.recipientEmails)
          .map((r: any) => ({
            id: r.id,
            title: r.reportTitle || 'Report Card',
            sentAt: r.sentAt,
            finalLetter: r.finalLetter,
            weightedAvg: r.weightedAvg,
            quarterId: r.quarterId,
          }))
          .sort((a: any, b: any) => (a.sentAt || '').localeCompare(b.sentAt || ''))

        summaries.push({
          semester: sem,
          lessonsGraded,
          lessonsAssigned: lessonIds.size,
          lessonAvg: lAvg,
          quizAvg: qAvg,
          testAvg: tAvg,
          weightedAvg,
          letter,
          reports,
        })
      }

      // Sort newest first
      summaries.sort((a, b) => b.semester.startDate.localeCompare(a.semester.startDate))
      setSemesterSummaries(summaries)
    } catch (err: any) {
      console.error('Transcript load error:', err)
      setError(err?.message || 'Failed to load transcript.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  const fullName = student ? `${student.firstName} ${student.lastName}` : ''
  const enrolledYear = student?.enrolledAt ? fmtYear(student.enrolledAt) : null
  const archivedYear = student?.archivedAt ? fmtYear(student.archivedAt) : null
  const yearRange = enrolledYear && archivedYear && enrolledYear !== archivedYear
    ? `${enrolledYear}–${archivedYear}`
    : enrolledYear || archivedYear || null

  // Cumulative weighted average across all semesters
  const allWeighted = semesterSummaries
    .map(s => s.weightedAvg)
    .filter((x): x is number => x !== null)
  const cumulativeAvg = allWeighted.length > 0
    ? allWeighted.reduce((a, b) => a + b, 0) / allWeighted.length
    : null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .transcript-page { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
          @page { margin: 0.5in; size: letter; }
        }
      `}</style>

      <div className="no-print"><TeacherNav /></div>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Header bar — not printed */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/teacher/students')}
            style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
            ← Back to Students
          </button>
          {!loading && student && (
            <button
              onClick={() => window.print()}
              style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print / Save as PDF
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>Loading transcript…</div>
        ) : error || !student ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', padding: '24px', color: '#b91c1c' }}>
            {error || 'Student not found.'}
          </div>
        ) : (
          <div className="transcript-page" style={{ background: 'white', color: '#111', borderRadius: '8px', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', padding: '48px 56px' }}>

            {/* ── Header banner ── */}
            <div style={{ background: '#1E1E2E', borderRadius: '12px 12px 0 0', margin: '-48px -56px 0', padding: '28px 56px 20px', marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <MwmLogo size={48} variant="dark" showWordmark />
              </div>
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.55)', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                Student Transcript
              </div>
            </div>

            {/* ── Student identity ── */}
            <div style={{ padding: '28px 0 20px', borderBottom: '2px solid #1a1a2e' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', fontFamily: 'var(--font-display)', margin: '0 0 6px' }}>
                {fullName}
              </h1>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#555' }}>
                {student.gradeLevel && <span>Grade {student.gradeLevel}</span>}
                {yearRange && <span>• Enrolled {yearRange}</span>}
                {student.status === 'archived' && (
                  <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '1px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                    Archived
                  </span>
                )}
                {student.status === 'active' && (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* ── Cumulative summary ── */}
            {cumulativeAvg !== null && (
              <div style={{ background: '#f8f6fb', border: '2px solid #e9e0f5', borderRadius: '12px', padding: '20px 28px', marginTop: '24px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '24px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#999', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Cumulative Average</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                    {cumulativeAvg.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>
                  Across <strong>{semesterSummaries.length} term{semesterSummaries.length !== 1 ? 's' : ''}</strong>
                  {' · '}
                  {semesterSummaries.reduce((sum, s) => sum + s.lessonsGraded, 0)} of {semesterSummaries.reduce((sum, s) => sum + s.lessonsAssigned, 0)} lessons graded
                </div>
                <div style={{ width: 60, height: 60, borderRadius: 12, background: letterColor(letterGrade(cumulativeAvg, 90, 80, 70, 60)).bg, color: letterColor(letterGrade(cumulativeAvg, 90, 80, 70, 60)).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {letterGrade(cumulativeAvg, 90, 80, 70, 60)}
                </div>
              </div>
            )}

            {/* ── Per-semester breakdown ── */}
            <div style={{ marginTop: '32px' }}>
              {semesterSummaries.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '24px 0' }}>
                  No graded work on record yet.
                </p>
              ) : semesterSummaries.map(summary => {
                const { semester: sem } = summary
                const chip = letterColor(summary.letter)
                return (
                  <div key={sem.id} style={{ borderTop: '1px solid #e5e7eb', padding: '24px 0' }}>
                    {/* Semester heading */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {sem.academicYear?.year || ''}
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#1a1a2e', margin: '0 0 4px' }}>
                          {sem.course?.title || 'Course'} — {sem.name}
                        </h2>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {fmtDate(sem.startDate)} – {fmtDate(sem.endDate)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                            {summary.weightedAvg !== null ? summary.weightedAvg.toFixed(1) + '%' : '—'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {summary.lessonsGraded} of {summary.lessonsAssigned} graded
                          </div>
                        </div>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: chip.bg, color: chip.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                          {summary.letter}
                        </div>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: summary.reports.length > 0 ? '14px' : '0' }}>
                      {[
                        { label: 'Lessons', avg: summary.lessonAvg, weight: sem.lessonWeightPercent ?? 60 },
                        { label: 'Participation', avg: summary.quizAvg, weight: sem.quizWeightPercent ?? 20 },
                        { label: 'Tests', avg: summary.testAvg, weight: sem.testWeightPercent ?? 20 },
                      ].map(c => (
                        <div key={c.label} style={{ fontSize: '12px', color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '4px 12px', borderRadius: '20px' }}>
                          <strong>{c.label}</strong> ({c.weight}%): {c.avg !== null ? c.avg.toFixed(1) + '%' : '—'}
                        </div>
                      ))}
                    </div>

                    {/* Report cards sent */}
                    {summary.reports.length > 0 && (
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Report Cards Sent
                        </div>
                        {summary.reports.map(r => (
                          <div key={r.id} style={{ fontSize: '13px', color: '#374151', padding: '3px 0' }}>
                            • {r.title}{r.sentAt ? ` — ${fmtDate(r.sentAt)}` : ''}{r.finalLetter ? ` · ${r.finalLetter}` : ''}{r.weightedAvg !== null && r.weightedAvg !== undefined ? ` (${r.weightedAvg.toFixed(1)}%)` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
              Transcript generated {fmtDate(new Date().toISOString())} · Math with Melinda · mathwithmelinda.com
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
