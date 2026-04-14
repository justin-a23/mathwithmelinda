'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

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
  query ListLessonTemplates($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { id lessonCategory lessonNumber }
      nextToken
    }
  }
`

const LIST_STUDENT_PROFILE = /* GraphQL */ `
  query ListStudentProfile($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter, limit: 500) {
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

  // Send report card
  const [studentEmail, setStudentEmail] = useState('')
  const [comment, setComment] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPolishing, setAiPolishing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

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
      setStudentEmail(prof.email || prof.userId || '')

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

      // 6. Load lesson templates (paginated)
      const templateMap = new Map<string, LessonTemplate>()
      if (templateIds.size > 0) {
        let tmplNextToken: string | null = null
        do {
          const tmplRes = await (client.graphql({
            query: LIST_LESSON_TEMPLATES,
            variables: { filter: { courseLessonTemplatesId: { eq: sem.courseId } }, limit: 500, nextToken: tmplNextToken },
          }) as any)
          for (const t of tmplRes.data.listLessonTemplates.items as LessonTemplate[]) {
            templateMap.set(t.id, t)
          }
          tmplNextToken = tmplRes.data.listLessonTemplates.nextToken
        } while (tmplNextToken)
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

  async function generateAiComment() {
    if (!report) return
    setAiGenerating(true)
    setSendError('')
    try {
      const res = await apiFetch('/api/report-card-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          studentName: report.studentName,
          courseName: report.courseName,
          semesterName: report.semesterName,
          finalLetter: report.finalLetter,
          weightedAvg: report.weightedAvg,
          lessonAvg: report.lessonAvg,
          quizAvg: report.quizAvg,
          testAvg: report.testAvg,
          lessonWeight: report.lessonWeight,
          quizWeight: report.quizWeight,
          testWeight: report.testWeight,
          completedCount: report.assignments.filter(a => a.score && a.score !== 'Pending').length,
          totalCount: report.assignments.length,
          assignments: report.assignments,
        }),
      })
      const json = await res.json()
      if (json.comment) setComment(json.comment)
      else setSendError(json.error || 'AI generation failed')
    } catch {
      setSendError('Could not reach AI — check your connection.')
    } finally {
      setAiGenerating(false)
    }
  }

  async function polishComment() {
    if (!comment.trim()) return
    setAiPolishing(true)
    setSendError('')
    try {
      const res = await apiFetch('/api/report-card-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'polish',
          draft: comment,
          studentName: report?.studentName,
        }),
      })
      const json = await res.json()
      if (json.comment) setComment(json.comment)
      else setSendError(json.error || 'Polish failed')
    } catch {
      setSendError('Could not reach AI — check your connection.')
    } finally {
      setAiPolishing(false)
    }
  }

  async function sendReportCard() {
    if (!report || !studentEmail) return
    setSending(true)
    setSent(false)
    setSendError('')

    const { bg: gradeBg, text: gradeText } = gradeChip(report.finalLetter)
    const commentHtml = comment.trim()
      ? `<div style="background:#f5f3ff;border-left:4px solid #7b4fa6;border-radius:8px;padding:18px 22px;margin:20px 0;font-size:15px;line-height:1.7;color:#2d1b4e;font-style:italic;">"${comment.trim().replace(/\n/g, '<br/>')}"<div style="font-size:12px;color:#9874c8;margin-top:10px;font-style:normal;font-weight:600;">— Melinda</div></div>`
      : ''

    const categoryRows = [
      report.lessonAvg !== null ? `<tr><td style="padding:8px 12px;color:#555;">Lessons</td><td style="padding:8px 12px;text-align:center;color:#555;">${report.lessonWeight}%</td><td style="padding:8px 12px;text-align:center;font-weight:700;color:#111;">${report.lessonAvg.toFixed(1)}%</td></tr>` : '',
      report.quizAvg !== null  ? `<tr><td style="padding:8px 12px;color:#555;">Participation</td><td style="padding:8px 12px;text-align:center;color:#555;">${report.quizWeight}%</td><td style="padding:8px 12px;text-align:center;font-weight:700;color:#111;">${report.quizAvg.toFixed(1)}%</td></tr>` : '',
      report.testAvg !== null  ? `<tr><td style="padding:8px 12px;color:#555;">Tests</td><td style="padding:8px 12px;text-align:center;color:#555;">${report.testWeight}%</td><td style="padding:8px 12px;text-align:center;font-weight:700;color:#111;">${report.testAvg.toFixed(1)}%</td></tr>` : '',
    ].filter(Boolean).join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#1E1E2E;padding:20px 28px;border-radius:10px 10px 0 0;display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;background:#7b4fa6;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="color:white;font-size:16px;line-height:1;font-weight:900">+</span>
          </div>
          <span style="color:white;font-size:18px;font-weight:700;">Math with Melinda</span>
        </div>

        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:32px 28px;">
          <div style="font-size:12px;font-weight:700;color:#7b4fa6;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
            ${report.semesterName} Report Card
          </div>
          <h1 style="font-size:26px;font-weight:800;color:#1a1a2e;margin:0 0 4px;">
            ${report.studentName}
          </h1>
          <div style="font-size:14px;color:#777;margin-bottom:24px;">${report.courseName}</div>

          <!-- Grade highlight -->
          <div style="display:flex;align-items:center;gap:20px;background:#f8f6fb;border:2px solid #e9e0f5;border-radius:12px;padding:18px 24px;margin-bottom:20px;">
            <div style="width:72px;height:72px;border-radius:14px;background:${gradeBg};color:${gradeText};display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:900;border:2px solid ${gradeText}44;flex-shrink:0;">
              ${report.finalLetter}
            </div>
            <div>
              <div style="font-size:30px;font-weight:800;color:#1a1a2e;line-height:1;">
                ${report.weightedAvg !== null ? report.weightedAvg.toFixed(1) + '%' : 'In progress'}
              </div>
              <div style="font-size:13px;color:#777;margin-top:3px;">Weighted average · ${report.assignments.filter(a => a.score && a.score !== 'Pending').length}/${report.assignments.length} assignments completed</div>
            </div>
          </div>

          ${commentHtml}

          <!-- Category breakdown -->
          ${categoryRows ? `
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
            <thead>
              <tr style="background:#f0eaf8;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:1px;text-transform:uppercase;">Category</th>
                <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#555;letter-spacing:1px;text-transform:uppercase;">Weight</th>
                <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#555;letter-spacing:1px;text-transform:uppercase;">Average</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>` : ''}

          <a href="https://mathwithmelinda.com/dashboard" style="display:inline-block;background:#7b4fa6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:20px;">
            View Full Grades →
          </a>

          <p style="font-size:12px;color:#aaa;margin:0;line-height:1.6;">
            For the full assignment breakdown and teacher comments on individual lessons, sign in to your dashboard at mathwithmelinda.com.
          </p>
        </div>
      </div>`

    const text = `${report.semesterName} Report Card — ${report.studentName}\n\nCourse: ${report.courseName}\nGrade: ${report.finalLetter}${report.weightedAvg !== null ? ` (${report.weightedAvg.toFixed(1)}%)` : ''}\n${comment.trim() ? `\nComment from Melinda:\n${comment.trim()}\n` : ''}\nView full grades at: https://mathwithmelinda.com/dashboard`

    try {
      // Email the student
      await apiFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: studentEmail,
          subject: `Your ${report.semesterName} Report Card — ${report.courseName}`,
          html,
          text,
        }),
      })

      // Email linked parents
      await apiFetch('/api/notify-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail,
          subject: `${report.studentName}'s ${report.semesterName} Report Card — ${report.courseName}`,
          html: html.replace(
            `View Full Grades →`,
            `View ${report.studentName}'s Grades →`
          ).replace(
            `href="https://mathwithmelinda.com/dashboard"`,
            `href="https://mathwithmelinda.com/parent"`
          ),
          text: text.replace(
            'https://mathwithmelinda.com/dashboard',
            'https://mathwithmelinda.com/parent'
          ),
        }),
      })

      setSent(true)
    } catch {
      setSendError('Send failed — check your connection and try again.')
    } finally {
      setSending(false)
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
                <svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="120" rx="20" fill="rgba(123,79,166,0.15)"/>
                  <g transform="translate(14, 28)">
                    <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60" stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4" stroke="#4E2B72" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4" stroke="#7B4FA6" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60" stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
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

        {/* ── Send Report Card Panel ── */}
        {report && (
          <div className="no-print" style={{ marginTop: '40px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', background: '#f5f3ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7b4fa6" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>Send Report Card</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Email this report card to {report.studentName} and their linked parents</div>
              </div>
            </div>

            {/* Comment area */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Teacher Comment <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--gray-mid)', textTransform: 'none', letterSpacing: 0 }}>(optional — shown in the email)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => { setComment(e.target.value); setSent(false) }}
                placeholder={`Write a personal note for ${report.studentName}, or use AI to generate one below…`}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-light)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* AI buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={generateAiComment}
                disabled={aiGenerating || aiPolishing}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: aiGenerating ? 'var(--gray-light)' : '#f5f3ff',
                  color: aiGenerating ? 'var(--gray-mid)' : '#7b4fa6',
                  border: '1px solid #e9d5ff',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: aiGenerating || aiPolishing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}>
                {aiGenerating ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                    Generate with AI
                  </>
                )}
              </button>

              <button
                onClick={polishComment}
                disabled={!comment.trim() || aiGenerating || aiPolishing}
                title={!comment.trim() ? 'Write something first, then polish it' : 'Let AI smooth out your writing while keeping your voice'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: (!comment.trim() || aiPolishing) ? 'var(--gray-light)' : '#fdf4ff',
                  color: (!comment.trim() || aiPolishing) ? 'var(--gray-mid)' : '#9333ea',
                  border: '1px solid #e9d5ff',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: (!comment.trim() || aiGenerating || aiPolishing) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: !comment.trim() ? 0.5 : 1,
                }}>
                {aiPolishing ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Polishing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Polish My Writing
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--gray-light)', marginBottom: '20px' }} />

            {/* Send button + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={sendReportCard}
                disabled={sending || sent}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: sent ? '#dcfce7' : sending ? 'var(--gray-light)' : 'var(--plum)',
                  color: sent ? '#15803d' : sending ? 'var(--gray-mid)' : 'white',
                  border: sent ? '1px solid #bbf7d0' : 'none',
                  borderRadius: '8px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: sending || sent ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}>
                {sent ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Sent!
                  </>
                ) : sending ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send to Student &amp; Parents
                  </>
                )}
              </button>

              {sent && (
                <div style={{ fontSize: '13px', color: '#15803d' }}>
                  Report card emailed to {report.studentName} and any linked parents.
                </div>
              )}

              {sendError && (
                <div style={{ fontSize: '13px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {sendError}
                </div>
              )}
            </div>

            {!studentEmail && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                No email address found for this student — report card will be sent to parents only.
              </div>
            )}
          </div>
        )}
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
