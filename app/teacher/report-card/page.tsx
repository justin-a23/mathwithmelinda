'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

// ── Queries (same as gradebook) ──────────────────────────────────────────────

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent testWeightPercent quizWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
      }
    }
  }
`

const LIST_WEEKLY_PLANS = /* GraphQL */ `
  query ListWeeklyPlans {
    listWeeklyPlans(limit: 500) {
      items {
        id weekStartDate courseWeeklyPlansId
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

const LIST_LESSON_TEMPLATES = /* GraphQL */ `
  query ListLessonTemplates($filter: ModelLessonTemplateFilterInput) {
    listLessonTemplates(filter: $filter, limit: 200) {
      items { id lessonCategory lessonNumber }
    }
  }
`

const LIST_STUDENT_PROFILE = /* GraphQL */ `
  query ListStudentProfile($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter, limit: 1) {
      items { id userId email firstName lastName courseId }
    }
  }
`

const LIST_SUBMISSIONS_FOR_STUDENT = /* GraphQL */ `
  query ListSubmissionsForStudent($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 1000) {
      items { id studentId content grade status isArchived }
    }
  }
`

// ── Types ────────────────────────────────────────────────────────────────────

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
  lessonWeightPercent: number | null
  testWeightPercent: number | null
  quizWeightPercent: number | null
  gradeA: number | null
  gradeB: number | null
  gradeC: number | null
  gradeD: number | null
  course: { id: string; title: string } | null
}

type PlanItem = {
  id: string
  dayOfWeek: string
  lessonTemplateId: string | null
  isPublished: boolean | null
  lesson: { id: string; title: string; order: number | null } | null
}

type WeeklyPlan = {
  id: string
  weekStartDate: string
  courseWeeklyPlansId: string | null
  items: { items: PlanItem[] } | null
}

type LessonTemplate = {
  id: string
  lessonCategory: string | null
  lessonNumber: number | null
}

type LessonColumn = {
  lessonId: string
  title: string
  order: number
  category: string
  templateId: string | null
}

type AssignmentResult = {
  num: number
  lessonId: string
  title: string
  category: string
  score: string | null
  letter: string
}

type ReportData = {
  studentName: string
  courseName: string
  semesterName: string
  startDate: string
  endDate: string
  finalLetter: string
  weightedAvg: number | null
  lessonAvg: number | null
  quizAvg: number | null
  testAvg: number | null
  lessonWeight: number
  quizWeight: number
  testWeight: number
  assignments: AssignmentResult[]
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

function gradeChip(letter: string): { bg: string; text: string } {
  if (letter === 'A') return { bg: '#dcfce7', text: '#15803d' }
  if (letter === 'B') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (letter === 'C') return { bg: '#fef9c3', text: '#a16207' }
  if (letter === 'D') return { bg: '#ffedd5', text: '#c2410c' }
  if (letter === 'F') return { bg: '#fee2e2', text: '#dc2626' }
  return { bg: '#f3f4f6', text: '#374151' }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Inner component that reads search params ─────────────────────────────────

function ReportCardInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const params = useSearchParams()
  const { checking } = useRoleGuard('teacher')
  const studentId = params.get('studentId') || ''
  const semesterId = params.get('semesterId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const printedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!studentId || !semesterId) {
      setError('Missing studentId or semesterId in URL.')
      setLoading(false)
      return
    }
    loadReport()
  }, [studentId, semesterId])

  async function loadReport() {
    setLoading(true)
    setError('')
    try {
      // 1. Load semester
      const semRes = await (client.graphql({ query: LIST_SEMESTERS }) as any)
      const allSems: Semester[] = semRes.data.listSemesters.items
      const sem = allSems.find(s => s.id === semesterId)
      if (!sem || !sem.courseId) { setError('Semester not found.'); setLoading(false); return }

      // 2. Load student profile
      const profRes = await (client.graphql({
        query: LIST_STUDENT_PROFILE,
        variables: { filter: { id: { eq: studentId } } },
      }) as any)
      const profItems = profRes.data.listStudentProfiles.items
      if (profItems.length === 0) { setError('Student not found.'); setLoading(false); return }
      const prof = profItems[0]
      const studentName = `${prof.firstName} ${prof.lastName}`

      // 3. Load weekly plans and filter
      const plansRes = await (client.graphql({ query: LIST_WEEKLY_PLANS }) as any)
      const allPlans: WeeklyPlan[] = plansRes.data.listWeeklyPlans.items
      const plansInRange = allPlans.filter(p => {
        const inRange = p.weekStartDate >= sem.startDate && p.weekStartDate <= sem.endDate
        const courseMatch = !sem.courseId || p.courseWeeklyPlansId === sem.courseId
        return inRange && courseMatch
      })

      // 4. Collect plan items with lessons
      const allPlanItems: PlanItem[] = []
      for (const plan of plansInRange) {
        for (const item of plan.items?.items || []) {
          if (item.lesson) allPlanItems.push(item)
        }
      }

      // 5. Deduplicate by lesson id
      const lessonMap = new Map<string, PlanItem>()
      const templateIds = new Set<string>()
      for (const item of allPlanItems) {
        if (item.lesson && !lessonMap.has(item.lesson.id)) {
          lessonMap.set(item.lesson.id, item)
          if (item.lessonTemplateId) templateIds.add(item.lessonTemplateId)
        }
      }

      // 6. Load lesson templates
      const templateMap = new Map<string, LessonTemplate>()
      if (templateIds.size > 0) {
        const tmplRes = await (client.graphql({
          query: LIST_LESSON_TEMPLATES,
          variables: { filter: { courseLessonTemplatesId: { eq: sem.courseId } } },
        }) as any)
        for (const t of tmplRes.data.listLessonTemplates.items as LessonTemplate[]) {
          templateMap.set(t.id, t)
        }
      }

      // 7. Build columns
      const cols: LessonColumn[] = []
      for (const [lessonId, item] of lessonMap.entries()) {
        const lesson = item.lesson!
        const tmpl = item.lessonTemplateId ? templateMap.get(item.lessonTemplateId) : null
        const cat = categoryLabel(tmpl?.lessonCategory)
        const order = lesson.order ?? tmpl?.lessonNumber ?? 9999
        cols.push({ lessonId, title: lesson.title, order, category: cat, templateId: item.lessonTemplateId || null })
      }
      cols.sort((a, b) => a.order - b.order)

      // 8. Load submissions for student (by userId, email, or id)
      const studentIds = [prof.userId, prof.email, prof.id].filter(Boolean)
      let allSubs: { id: string; studentId: string; content: string | null; grade: string | null; status: string | null; isArchived: boolean | null }[] = []
      for (const sid of studentIds) {
        const subsRes = await (client.graphql({
          query: LIST_SUBMISSIONS_FOR_STUDENT,
          variables: { filter: { studentId: { eq: sid } } },
        }) as any)
        const items = subsRes.data.listSubmissions.items
        if (items.length > 0) { allSubs = items; break }
      }

      // 9. Build grade map
      const lessonIdSet = new Set(cols.map(c => c.lessonId))
      const gradeMap: Record<string, string | null> = {}
      for (const sub of allSubs) {
        if (sub.isArchived) continue
        try {
          const content = JSON.parse(sub.content || '{}')
          const lid = content.lessonId
          if (lid && lessonIdSet.has(lid)) {
            gradeMap[lid] = sub.grade || 'pending'
          }
        } catch { continue }
      }

      // 10. Build assignment results
      const gradeA = sem.gradeA ?? 90
      const gradeB = sem.gradeB ?? 80
      const gradeC = sem.gradeC ?? 70
      const gradeD = sem.gradeD ?? 60
      const lessonW = (sem.lessonWeightPercent ?? 60) / 100
      const quizW = (sem.quizWeightPercent ?? 20) / 100
      const testW = (sem.testWeightPercent ?? 20) / 100

      const assignments: AssignmentResult[] = cols.map((col, i) => {
        const g = gradeMap[col.lessonId]
        let score: string | null = null
        let letter = '—'
        if (g && g !== 'pending') {
          const n = parseFloat(g)
          if (!isNaN(n)) {
            score = n % 1 === 0 ? String(n) : n.toFixed(1)
            letter = letterGrade(n, gradeA, gradeB, gradeC, gradeD)
          } else {
            score = g
          }
        } else if (g === 'pending') {
          score = 'Pending'
        }
        return { num: i + 1, lessonId: col.lessonId, title: col.title, category: col.category, score, letter }
      })

      // 11. Category averages
      const byCategory: Record<string, number[]> = { lesson: [], quiz: [], test: [] }
      for (const col of cols) {
        const g = gradeMap[col.lessonId]
        if (g && g !== 'pending') {
          const n = parseFloat(g)
          if (!isNaN(n)) byCategory[col.category].push(n)
        }
      }
      const catAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
      const lAvg = catAvg(byCategory.lesson)
      const qAvg = catAvg(byCategory.quiz)
      const tAvg = catAvg(byCategory.test)

      let weightedSum = 0; let weightedTotal = 0
      if (lAvg !== null) { weightedSum += lAvg * lessonW; weightedTotal += lessonW }
      if (qAvg !== null) { weightedSum += qAvg * quizW; weightedTotal += quizW }
      if (tAvg !== null) { weightedSum += tAvg * testW; weightedTotal += testW }
      const weightedAvg = weightedTotal > 0 ? weightedSum / weightedTotal : null
      const finalLetter = weightedAvg !== null ? letterGrade(weightedAvg, gradeA, gradeB, gradeC, gradeD) : '—'

      setReport({
        studentName,
        courseName: sem.course?.title || 'Course',
        semesterName: sem.name,
        startDate: sem.startDate,
        endDate: sem.endDate,
        finalLetter,
        weightedAvg,
        lessonAvg: lAvg,
        quizAvg: qAvg,
        testAvg: tAvg,
        lessonWeight: sem.lessonWeightPercent ?? 60,
        quizWeight: sem.quizWeightPercent ?? 20,
        testWeight: sem.testWeightPercent ?? 20,
        assignments,
      })
    } catch (err: any) {
      console.error('Error loading report card:', err)
      setError('Failed to load report card data.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: 1px solid #ddd !important; }
          @page { margin: 0.75in; size: letter; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <TeacherNav />
      {report && (
        <div className="no-print" style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.print()}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / Save as PDF
          </button>
        </div>
      )}

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '80px 0', color: 'var(--gray-mid)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading report card…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626' }}>
            <p style={{ fontSize: '16px' }}>{error}</p>
            <button onClick={() => router.push('/teacher/gradebook')} style={{ marginTop: '16px', background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>
              Back to Gradebook
            </button>
          </div>
        ) : report ? (
          <div className="print-area" style={{ background: 'white', color: '#111', borderRadius: '8px', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', padding: '48px 56px' }}>

            {/* ── Report Card Header ── */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid #1a1a2e', paddingBottom: '24px', marginBottom: '32px' }}>
              {/* Logo row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{ width: '36px', height: '36px', background: '#7b4fa6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                    <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
                    <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.5px' }}>Math with Melinda</span>
              </div>
              <div style={{ fontSize: '13px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>Student Report Card</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Term</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>{report.semesterName}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{fmtDate(report.startDate)} – {fmtDate(report.endDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Date Printed</div>
                  <div style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: 600 }}>{printedDate}</div>
                </div>
              </div>
            </div>

            {/* ── Student Identity ── */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: '#1a1a2e', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{report.studentName}</div>
              <div style={{ fontSize: '16px', color: '#555', fontWeight: 500 }}>{report.courseName}</div>
            </div>

            {/* ── Summary Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '24px', background: '#f8f6fb', border: '2px solid #e9e0f5', borderRadius: '12px', padding: '20px 28px', marginBottom: '32px', alignItems: 'center' }}>
              {/* Final Grade Badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Final Grade</div>
                {(() => {
                  const { bg, text } = gradeChip(report.finalLetter)
                  return (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: report.finalLetter !== '—' ? bg : '#f3f4f6', color: report.finalLetter !== '—' ? text : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', fontWeight: 900, fontFamily: 'var(--font-display)', border: `2px solid ${report.finalLetter !== '—' ? text + '44' : '#e5e7eb'}` }}>
                      {report.finalLetter}
                    </div>
                  )
                })()}
              </div>

              {/* Weighted avg + dates */}
              <div style={{ paddingLeft: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {report.weightedAvg !== null ? report.weightedAvg.toFixed(1) + '%' : 'No grades yet'}
                </div>
                <div style={{ fontSize: '13px', color: '#777', marginTop: '4px' }}>Weighted average</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>{fmtDate(report.startDate)} – {fmtDate(report.endDate)}</div>
              </div>

              {/* Assignments count */}
              <div style={{ textAlign: 'center', paddingLeft: '8px', borderLeft: '1px solid #e9e0f5' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e', fontFamily: 'var(--font-display)' }}>
                  {report.assignments.filter(a => a.score && a.score !== 'Pending').length}
                  <span style={{ fontSize: '16px', color: '#999', fontWeight: 400 }}>/{report.assignments.length}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>Completed</div>
              </div>
            </div>

            {/* ── Category Breakdown ── */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Category Breakdown</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f0eaf8' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '6px 0 0 6px' }}>Category</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>Weight</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>Average</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '0 6px 6px 0' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Lessons', avg: report.lessonAvg, weight: report.lessonWeight },
                    { label: 'Participation', avg: report.quizAvg, weight: report.quizWeight },
                    { label: 'Tests', avg: report.testAvg, weight: report.testWeight },
                  ].map((row, i) => {
                    const letter = row.avg !== null
                      ? letterGrade(row.avg, report.finalLetter === 'A' ? 90 : 90, 80, 70, 60)
                      : '—'
                    const { bg, text } = row.avg !== null ? gradeChip(letter) : { bg: 'transparent', text: '#999' }
                    return (
                      <tr key={row.label} style={{ borderBottom: '1px solid #f0eaf8', background: i % 2 === 0 ? 'white' : '#faf8fd' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a2e' }}>{row.label}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#555' }}>{row.weight}%</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#1a1a2e' }}>
                          {row.avg !== null ? row.avg.toFixed(1) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {row.avg !== null ? (
                            <span style={{ background: bg, color: text, fontWeight: 700, fontSize: '13px', padding: '3px 12px', borderRadius: '20px', display: 'inline-block' }}>
                              {letter}
                            </span>
                          ) : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Assignment List ── */}
            <div style={{ marginBottom: '48px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Assignment Detail</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f0eaf8' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', width: '40px' }}>#</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>Assignment</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', width: '100px' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', width: '70px' }}>Score</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', width: '70px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {report.assignments.map((a, i) => {
                    const catColor = a.category === 'test' ? '#b91c1c' : a.category === 'quiz' ? '#d97706' : '#15803d'
                    const catBg = a.category === 'test' ? '#fef2f2' : a.category === 'quiz' ? '#fffbeb' : '#f0fdf4'
                    const catLabel = a.category === 'test' ? 'Test' : a.category === 'quiz' ? 'Participation' : 'Lesson'
                    const { bg, text } = a.letter !== '—' ? gradeChip(a.letter) : { bg: 'transparent', text: '#bbb' }

                    return (
                      <tr key={a.lessonId} style={{ borderBottom: '1px solid #f0eaf8', background: i % 2 === 0 ? 'white' : '#faf8fd', pageBreakInside: 'avoid' }}>
                        <td style={{ padding: '9px 12px', textAlign: 'center', color: '#999', fontSize: '12px' }}>{a.num}</td>
                        <td style={{ padding: '9px 12px', color: '#1a1a2e', fontWeight: 500 }}>{a.title}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ background: catBg, color: catColor, fontWeight: 600, fontSize: '11px', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' }}>{catLabel}</span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: a.score ? '#1a1a2e' : '#bbb', fontVariantNumeric: 'tabular-nums' }}>
                          {a.score || '—'}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          {a.letter !== '—' ? (
                            <span style={{ background: bg, color: text, fontWeight: 700, fontSize: '12px', padding: '2px 10px', borderRadius: '20px', display: 'inline-block' }}>{a.letter}</span>
                          ) : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#bbb', letterSpacing: '1px' }}>Generated by Math with Melinda</span>
              <span style={{ fontSize: '11px', color: '#bbb' }}>{printedDate}</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

// ── Page wrapper with Suspense for useSearchParams ───────────────────────────

export default function ReportCardPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--gray-mid)' }}>
        Loading…
      </div>
    }>
      <ReportCardInner />
    </Suspense>
  )
}
