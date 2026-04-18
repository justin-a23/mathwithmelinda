'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent testWeightPercent quizWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
        academicYear { id year quarters { items { id name startDate endDate order } } }
      }
    }
  }
`

const LIST_WEEKLY_PLANS = /* GraphQL */ `
  query ListWeeklyPlans {
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

const LIST_LESSON_TEMPLATES = /* GraphQL */ `
  query ListLessonTemplates($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { id lessonCategory lessonNumber }
      nextToken
    }
  }
`

const LIST_STUDENTS = /* GraphQL */ `
  query ListStudents($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter, limit: 200) {
      items { id userId email firstName lastName courseId status enrolledAt }
    }
  }
`

const LIST_ALL_SUBMISSIONS = /* GraphQL */ `
  query ListAllSubmissions {
    listSubmissions(limit: 1000) {
      items { id studentId content grade status isArchived }
    }
  }
`

type Quarter = {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
}

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
  academicYear: { id: string; year: string; quarters: { items: Quarter[] } } | null
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
  assignedStudentIds: string | null
  items: { items: PlanItem[] } | null
}

type LessonTemplate = {
  id: string
  lessonCategory: string | null
  lessonNumber: number | null
}

type StudentProfile = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  courseId: string | null
  status: string | null
  enrolledAt: string | null
}

type Submission = {
  id: string
  studentId: string
  content: string | null
  grade: string | null
  status: string | null
  isArchived: boolean | null
}

type LessonColumn = {
  lessonId: string
  title: string
  order: number
  category: string
  templateId: string | null
}

type StudentRow = {
  student: StudentProfile
  grades: Record<string, string | null | 'pending'>
  avg: number | null
  letter: string
  assignedLessonIds: Set<string>
}

function categoryLabel(cat: string | null | undefined): string {
  const c = (cat || '').toLowerCase()
  if (c.includes('quiz')) return 'quiz'
  if (c.includes('test') || c.includes('exam')) return 'test'
  return 'lesson'
}

function letterGrade(avg: number, gradeA: number, gradeB: number, gradeC: number, gradeD: number): string {
  if (avg >= gradeA) return 'A'
  if (avg >= gradeB) return 'B'
  if (avg >= gradeC) return 'C'
  if (avg >= gradeD) return 'D'
  return 'F'
}

function gradeChip(letter: string): { bg: string; text: string } {
  if (letter === 'A') return { bg: '#dcfce7', text: '#15803d' }
  if (letter === 'B') return { bg: '#dbeafe', text: '#1d4ed8' }
  if (letter === 'C') return { bg: '#fef9c3', text: '#a16207' }
  if (letter === 'D') return { bg: '#ffedd5', text: '#c2410c' }
  if (letter === 'F') return { bg: '#fee2e2', text: '#dc2626' }
  return { bg: 'transparent', text: 'var(--foreground)' }
}

export default function GradebookPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const [columns, setColumns] = useState<LessonColumn[]>([])
  const [rows, setRows] = useState<StudentRow[]>([])

  // Quarter filter
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>('')

  // View state
  const [view, setView] = useState<'students' | 'assignment'>('students')
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [selectedColId, setSelectedColId] = useState<string>('')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadSemesters()
  }, [])

  useEffect(() => {
    if (selectedSemesterId) {
      loadGradebook(selectedSemesterId)
    }
  }, [selectedSemesterId, selectedQuarterId])

  async function loadSemesters() {
    setLoading(true)
    try {
      const res = await (client.graphql({ query: LIST_SEMESTERS }) as any)
      const items: Semester[] = res.data.listSemesters.items
      const sorted = [...items].sort((a, b) => b.startDate.localeCompare(a.startDate))
      setSemesters(sorted)
      const active = sorted.find(s => s.isActive)
      if (active) setSelectedSemesterId(active.id)
    } catch (err) {
      console.error('Error loading semesters:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadGradebook(semesterId: string) {
    const sem = semesters.find(s => s.id === semesterId)
    if (!sem || !sem.courseId) return

    setDataLoading(true)
    try {
      // 1. Load all weekly plans and filter client-side
      const plansRes = await (client.graphql({ query: LIST_WEEKLY_PLANS }) as any)
      const allPlans: WeeklyPlan[] = plansRes.data.listWeeklyPlans.items

      // 2. Filter to this course + date range (quarter or full semester)
      const quarters = [...(sem.academicYear?.quarters?.items || [])].sort((a, b) => a.order - b.order)
      const selectedQ = quarters.find(q => q.id === selectedQuarterId)
      const filterStart = selectedQ ? selectedQ.startDate : sem.startDate
      const filterEnd = selectedQ ? selectedQ.endDate : sem.endDate

      const plansInRange = allPlans.filter(p => {
        const inRange = p.weekStartDate >= filterStart && p.weekStartDate <= filterEnd
        const courseMatch = !sem.courseId || p.courseWeeklyPlansId === sem.courseId
        return inRange && courseMatch
      })

      // 3. Collect all plan items with lessons + track assigned students per lesson
      // lessonAssignedStudents: lessonId → null (all students) or Set<userId>
      // lessonWeekEndMs: lessonId → latest week-end-ms (used for enrollment-date filtering)
      const lessonAssignedStudents = new Map<string, Set<string> | null>()
      const lessonWeekEndMs = new Map<string, number>()
      const allPlanItems: PlanItem[] = []
      for (const plan of plansInRange) {
        // Parse assignedStudentIds for this plan
        let planStudentIds: string[] | null = null
        if (plan.assignedStudentIds) {
          try {
            const parsed = typeof plan.assignedStudentIds === 'string'
              ? JSON.parse(plan.assignedStudentIds)
              : plan.assignedStudentIds
            if (Array.isArray(parsed) && parsed.length > 0) planStudentIds = parsed
          } catch { /* parse error — treat as all students */ }
        }

        // Compute end-of-week ms for this plan (Sunday end)
        const weekStartDate = new Date(plan.weekStartDate + 'T00:00:00')
        const weekEnd = new Date(weekStartDate); weekEnd.setDate(weekStartDate.getDate() + 7)
        const planWeekEndMs = weekEnd.getTime()

        for (const item of plan.items?.items || []) {
          if (item.lesson) {
            allPlanItems.push(item)
            const lid = item.lesson.id
            const existing = lessonAssignedStudents.get(lid)
            if (existing === null) {
              // Already unrestricted from another plan — stays unrestricted
            } else if (planStudentIds === null) {
              // This plan is for all students — mark lesson as unrestricted
              lessonAssignedStudents.set(lid, null)
            } else if (existing === undefined) {
              // First time seeing this lesson
              lessonAssignedStudents.set(lid, new Set(planStudentIds))
            } else {
              // Merge: add these students to existing set
              for (const sid of planStudentIds) existing.add(sid)
            }
            // Track latest week this lesson appeared in
            const prev = lessonWeekEndMs.get(lid) || 0
            if (planWeekEndMs > prev) lessonWeekEndMs.set(lid, planWeekEndMs)
          }
        }
      }

      // 4. Deduplicate by lesson id
      const lessonMap = new Map<string, PlanItem>()
      const templateIds = new Set<string>()
      for (const item of allPlanItems) {
        if (item.lesson && !lessonMap.has(item.lesson.id)) {
          lessonMap.set(item.lesson.id, item)
          if (item.lessonTemplateId) templateIds.add(item.lessonTemplateId)
        }
      }

      // 5. Load lesson templates for category info (paginated)
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

      // 6. Build sorted columns
      const cols: LessonColumn[] = []
      for (const [lessonId, item] of lessonMap.entries()) {
        const lesson = item.lesson!
        const tmpl = item.lessonTemplateId ? templateMap.get(item.lessonTemplateId) : null
        const cat = categoryLabel(tmpl?.lessonCategory)
        const order = lesson.order ?? tmpl?.lessonNumber ?? 9999
        cols.push({ lessonId, title: lesson.title, order, category: cat, templateId: item.lessonTemplateId || null })
      }
      cols.sort((a, b) => a.order - b.order)

      // 7. Load students
      const studentsRes = await (client.graphql({
        query: LIST_STUDENTS,
        variables: { filter: { courseId: { eq: sem.courseId }, status: { ne: 'removed' } } },
      }) as any)
      const students: StudentProfile[] = studentsRes.data.listStudentProfiles.items.filter(
        (s: StudentProfile) => s.status !== 'removed'
      )

      // 8. Load all submissions
      const subsRes = await (client.graphql({ query: LIST_ALL_SUBMISSIONS }) as any)
      const allSubs: Submission[] = subsRes.data.listSubmissions.items

      // 9. Match submissions to lessons
      const lessonIdSet = new Set(cols.map(c => c.lessonId))
      type SubMatch = { lessonId: string; grade: string | null; status: string | null }
      const subsByStudent = new Map<string, SubMatch[]>()

      for (const sub of allSubs) {
        if (sub.isArchived) continue
        let parsedLessonId: string | null = null
        try {
          const content = JSON.parse(sub.content || '{}')
          parsedLessonId = content.lessonId || null
        } catch { continue }
        if (!parsedLessonId || !lessonIdSet.has(parsedLessonId)) continue
        if (!subsByStudent.has(sub.studentId)) subsByStudent.set(sub.studentId, [])
        subsByStudent.get(sub.studentId)!.push({ lessonId: parsedLessonId, grade: sub.grade, status: sub.status })
      }

      // 10. Build rows
      const gradeA = sem.gradeA ?? 90
      const gradeB = sem.gradeB ?? 80
      const gradeC = sem.gradeC ?? 70
      const gradeD = sem.gradeD ?? 60
      const lessonW = (sem.lessonWeightPercent ?? 60) / 100
      const quizW = (sem.quizWeightPercent ?? 20) / 100
      const testW = (sem.testWeightPercent ?? 20) / 100

      // Helper: check if a student is assigned to a lesson (respects assignedStudentIds
      // on the plan AND the student's enrolledAt — pre-enrollment lessons don't count).
      function isStudentAssigned(studentUserId: string, studentEnrolledAt: string | null, lessonId: string): boolean {
        const assigned = lessonAssignedStudents.get(lessonId)
        if (assigned !== null && assigned !== undefined && !assigned.has(studentUserId)) return false
        // Enrollment cutoff: if student enrolled after the lesson's week ended, they don't get it.
        if (studentEnrolledAt) {
          const enrolledMs = new Date(studentEnrolledAt).getTime()
          const weekEnd = lessonWeekEndMs.get(lessonId)
          if (weekEnd && weekEnd < enrolledMs) return false
        }
        return true
      }

      const studentRows: StudentRow[] = []
      for (const student of students) {
        const studentIds = [student.userId, student.email].filter(Boolean)
        let studentSubs: SubMatch[] = []
        for (const sid of studentIds) {
          const found = subsByStudent.get(sid)
          if (found) { studentSubs = found; break }
        }

        // Only include grades for lessons this student is assigned to
        const grades: Record<string, string | null | 'pending'> = {}
        for (const sub of studentSubs) {
          if (isStudentAssigned(student.userId, student.enrolledAt, sub.lessonId)) {
            grades[sub.lessonId] = sub.grade ? sub.grade : 'pending'
          }
        }

        // Only calculate averages for assigned lessons
        const studentCols = cols.filter(col => isStudentAssigned(student.userId, student.enrolledAt, col.lessonId))
        const assignedLessonIds = new Set(studentCols.map(c => c.lessonId))
        const byCategory: Record<string, number[]> = { lesson: [], quiz: [], test: [] }
        for (const col of studentCols) {
          const g = grades[col.lessonId]
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

        const avg = weightedTotal > 0 ? weightedSum / weightedTotal : null
        const letter = avg !== null ? letterGrade(avg, gradeA, gradeB, gradeC, gradeD) : '—'
        studentRows.push({ student, grades, avg, letter, assignedLessonIds })
      }

      studentRows.sort((a, b) => {
        const la = a.student.lastName.toLowerCase()
        const lb = b.student.lastName.toLowerCase()
        if (la < lb) return -1
        if (la > lb) return 1
        return a.student.firstName.toLowerCase().localeCompare(b.student.firstName.toLowerCase())
      })

      setColumns(cols)
      setRows(studentRows)
      if (cols.length > 0) setSelectedColId(cols[0].lessonId)
    } catch (err: any) {
      console.error('Error loading gradebook:', JSON.stringify(err, null, 2), err?.errors || err?.message || err)
    } finally {
      setDataLoading(false)
    }
  }

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId)

  const classAvg = rows.length > 0 ? (() => {
    const avgs = rows.map(r => r.avg).filter(a => a !== null) as number[]
    return avgs.length > 0 ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null
  })() : null

  const selectedCol = columns.find(c => c.lessonId === selectedColId) || columns[0] || null

  // For "By Assignment" view: per-student grade for the selected column
  const assignmentRows = selectedCol
    ? rows.map(r => ({
        student: r.student,
        grade: r.grades[selectedCol.lessonId] ?? null,
      }))
    : []

  const assignmentGrades = assignmentRows
    .map(r => r.grade)
    .filter(g => g && g !== 'pending')
    .map(g => parseFloat(g!))
    .filter(n => !isNaN(n))

  const assignmentAvg = assignmentGrades.length > 0
    ? assignmentGrades.reduce((a, b) => a + b, 0) / assignmentGrades.length
    : null
  const assignmentHigh = assignmentGrades.length > 0 ? Math.max(...assignmentGrades) : null
  const assignmentLow = assignmentGrades.length > 0 ? Math.min(...assignmentGrades) : null
  const assignmentSubmitted = assignmentRows.filter(r => r.grade !== null).length

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gb-student-card { transition: box-shadow 0.15s; cursor: pointer; }
        .gb-student-card:hover { box-shadow: 0 4px 16px rgba(123,79,166,0.12) !important; }
        .gb-assign-row:hover { background: rgba(123,79,166,0.04) !important; }
      `}</style>

      <TeacherNav />

      <main style={{ padding: '32px 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Term</label>
            <select value={selectedSemesterId} onChange={e => { setSelectedSemesterId(e.target.value); setSelectedQuarterId(''); setExpandedStudentId(null) }}
              style={{ padding: '10px 36px 10px 14px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', minWidth: '280px', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
              <option value="">Select a term…</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.course?.title ? `${s.course.title} — ` : ''}{s.name}{s.isActive ? ' ●' : ''}</option>
              ))}
            </select>
          </div>

          {/* Quarter filter — only show if semester has quarters */}
          {selectedSemester && (() => {
            const quarters = [...(selectedSemester.academicYear?.quarters?.items || [])].sort((a, b) => a.order - b.order)
            return quarters.length > 0 ? (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Quarter</label>
                <select value={selectedQuarterId} onChange={e => { setSelectedQuarterId(e.target.value); setExpandedStudentId(null) }}
                  style={{ padding: '10px 36px 10px 14px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', minWidth: '180px', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                  <option value="">Full Semester</option>
                  {quarters.map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>
            ) : null
          })()}

          {selectedSemester && !dataLoading && rows.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {[
                { label: 'Students', value: String(rows.length) },
                { label: 'Assignments', value: String(columns.length) },
                { label: 'Class Avg', value: classAvg !== null ? classAvg.toFixed(1) + '%' : '—' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingBottom: '4px' }}>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>📖 {selectedSemester.lessonWeightPercent ?? 60}%</span>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>✏️ Participation {selectedSemester.quizWeightPercent ?? 20}%</span>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 600 }}>📝 {selectedSemester.testWeightPercent ?? 20}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading / empty states */}
        {loading ? (
          <p style={{ color: 'var(--gray-mid)', padding: '48px 0', textAlign: 'center' }}>Loading…</p>
        ) : !selectedSemesterId ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3, display: 'block', margin: '0 auto 16px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            <p style={{ fontSize: '16px', margin: 0 }}>Select a term to view the gradebook</p>
          </div>
        ) : dataLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '48px 0', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading gradebook…
          </div>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '48px 0' }}>No students found for this course.</p>
        ) : columns.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '48px 0' }}>No lessons found in weekly plans within this term's date range.</p>
        ) : (
          <>
            {/* View toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {(['students', 'assignment'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                    borderColor: view === v ? 'var(--plum)' : 'var(--gray-light)',
                    background: view === v ? 'var(--plum)' : 'var(--background)',
                    color: view === v ? 'white' : 'var(--gray-mid)',
                  }}>
                  {v === 'students' ? '👥 By Student' : '📋 By Assignment'}
                </button>
              ))}
            </div>

            {/* ── BY STUDENT VIEW ── */}
            {view === 'students' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rows.map(row => {
                  const isExpanded = expandedStudentId === row.student.id
                  const studentColumns = columns.filter(c => row.assignedLessonIds.has(c.lessonId))
                  const gradedCount = Object.values(row.grades).filter(g => g && g !== 'pending').length
                  const totalAssigned = Object.keys(row.grades).length
                  const chip = gradeChip(row.letter)

                  return (
                    <div key={row.student.id}
                      className="gb-student-card"
                      onClick={() => setExpandedStudentId(isExpanded ? null : row.student.id)}
                      style={{
                        background: 'var(--background)',
                        border: '1px solid var(--gray-light)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: isExpanded ? '0 4px 16px rgba(123,79,166,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                      }}>

                      {/* Row header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px' }}>
                        {/* Avatar */}
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--plum)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                          {row.student.firstName?.[0]?.toUpperCase()}{row.student.lastName?.[0]?.toUpperCase()}
                        </div>

                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)' }}>
                            {row.student.lastName}, {row.student.firstName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                            {gradedCount} graded · {totalAssigned - gradedCount} pending · {studentColumns.length - totalAssigned} not started
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ width: 120, flexShrink: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginBottom: '4px', textAlign: 'right' }}>{totalAssigned}/{studentColumns.length}</div>
                          <div style={{ height: 6, background: 'var(--gray-light)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${studentColumns.length > 0 ? (totalAssigned / studentColumns.length) * 100 : 0}%`, background: 'var(--plum)', borderRadius: 3 }} />
                          </div>
                        </div>

                        {/* Avg */}
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                          <div style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                            {row.avg !== null ? row.avg.toFixed(1) + '%' : '—'}
                          </div>
                        </div>

                        {/* Letter grade badge */}
                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: chip.bg, color: chip.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                          {row.letter}
                        </div>

                        {/* Expand chevron */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>

                      {/* Expanded: assignment list */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid var(--gray-light)', padding: '0' }}>
                          {/* Print Report Card button */}
                          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--gray-light)', background: 'rgba(123,79,166,0.03)', display: 'flex', justifyContent: 'flex-end' }}
                            onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                const params = new URLSearchParams({ studentId: row.student.id, semesterId: selectedSemesterId })
                                if (selectedQuarterId) params.set('quarterId', selectedQuarterId)
                                router.push(`/teacher/report-card?${params.toString()}`)
                              }}
                              style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                              </svg>
                              {selectedQuarterId ? `Report Card (${(() => { const q = (selectedSemester?.academicYear?.quarters?.items || []).find((q: Quarter) => q.id === selectedQuarterId); return q ? q.name : 'Quarter' })()})` : 'Report Card'}
                            </button>
                          </div>
                          {studentColumns.map((col, i) => {
                            const g = row.grades[col.lessonId]
                            const isEven = i % 2 === 0
                            const catColor = col.category === 'test' ? '#dc2626' : col.category === 'quiz' ? '#d97706' : '#16a34a'
                            const catBg = col.category === 'test' ? '#fef2f2' : col.category === 'quiz' ? '#fffbeb' : '#f0fdf4'
                            const catLabel = col.category === 'test' ? '📝 Test' : col.category === 'quiz' ? '✏️ Participation' : '📖 Lesson'

                            let gradeEl: React.ReactNode
                            if (!g) {
                              gradeEl = <span style={{ fontSize: '12px', color: 'var(--gray-light)' }}>Not started</span>
                            } else if (g === 'pending') {
                              gradeEl = (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#b45309', background: '#fef9c3', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                                  Pending
                                </span>
                              )
                            } else {
                              const n = parseFloat(g)
                              if (!isNaN(n)) {
                                const sem = selectedSemester!
                                const l = letterGrade(n, sem.gradeA ?? 90, sem.gradeB ?? 80, sem.gradeC ?? 70, sem.gradeD ?? 60)
                                const { bg, text } = gradeChip(l)
                                gradeEl = (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ background: bg, color: text, fontWeight: 700, fontSize: '13px', padding: '3px 10px', borderRadius: '20px' }}>{l}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{n % 1 === 0 ? n : n.toFixed(1)}</span>
                                  </span>
                                )
                              } else {
                                gradeEl = <span style={{ fontSize: '13px', color: 'var(--gray-dark)' }}>{g}</span>
                              }
                            }

                            return (
                              <div key={col.lessonId} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px', background: isEven ? 'var(--background)' : 'rgba(0,0,0,0.015)', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)' }}>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: catBg, color: catColor, border: `1px solid ${catColor}22`, fontWeight: 600, flexShrink: 0 }}>{catLabel}</span>
                                <span style={{ flex: 1, fontSize: '13px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={col.title}>{col.title}</span>
                                <div style={{ flexShrink: 0 }}>{gradeEl}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── BY ASSIGNMENT VIEW ── */}
            {view === 'assignment' && (
              <div>
                {/* Assignment picker */}
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Assignment</label>
                    <select value={selectedColId} onChange={e => setSelectedColId(e.target.value)}
                      style={{ padding: '10px 36px 10px 14px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', minWidth: '360px', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      {columns.map(col => {
                        const icon = col.category === 'test' ? '📝' : col.category === 'quiz' ? '✏️' : '📖'
                        return <option key={col.lessonId} value={col.lessonId}>{icon} {col.title}</option>
                      })}
                    </select>
                  </div>

                  {/* Class stats */}
                  {selectedCol && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '0' }}>
                      {[
                        { label: 'Submitted', value: String(assignmentSubmitted) },
                        { label: 'Class Avg', value: assignmentAvg !== null ? assignmentAvg.toFixed(1) + '%' : '—' },
                        { label: 'High', value: assignmentHigh !== null ? String(assignmentHigh) : '—' },
                        { label: 'Low', value: assignmentLow !== null ? String(assignmentLow) : '—' },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center', minWidth: '60px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gray-mid)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Student list for selected assignment */}
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', padding: '10px 20px', borderBottom: '2px solid var(--gray-light)', background: 'rgba(123,79,166,0.03)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase' }}>Student</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>Score</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>Grade</span>
                  </div>

                  {assignmentRows.map((ar, i) => {
                    const g = ar.grade
                    const isEven = i % 2 === 0
                    let scoreEl: React.ReactNode
                    let letterEl: React.ReactNode

                    if (!g) {
                      scoreEl = <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>—</span>
                      letterEl = <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>—</span>
                    } else if (g === 'pending') {
                      scoreEl = (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#b45309' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                          Pending
                        </span>
                      )
                      letterEl = <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>—</span>
                    } else {
                      const n = parseFloat(g)
                      if (!isNaN(n)) {
                        const sem = selectedSemester!
                        const l = letterGrade(n, sem.gradeA ?? 90, sem.gradeB ?? 80, sem.gradeC ?? 70, sem.gradeD ?? 60)
                        const { bg, text } = gradeChip(l)
                        scoreEl = <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{n % 1 === 0 ? n : n.toFixed(1)}</span>
                        letterEl = <span style={{ background: bg, color: text, fontWeight: 800, fontSize: '14px', padding: '3px 12px', borderRadius: '20px' }}>{l}</span>
                      } else {
                        scoreEl = <span style={{ fontSize: '13px', color: 'var(--gray-dark)' }}>{g}</span>
                        letterEl = <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>—</span>
                      }
                    }

                    return (
                      <div key={ar.student.id} className="gb-assign-row"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', padding: '12px 20px', background: isEven ? 'var(--background)' : 'rgba(0,0,0,0.015)', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(123,79,166,0.12)', color: 'var(--plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                            {ar.student.firstName?.[0]?.toUpperCase()}{ar.student.lastName?.[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)' }}>
                            {ar.student.lastName}, {ar.student.firstName}
                          </span>
                        </div>
                        <div style={{ textAlign: 'center' }}>{scoreEl}</div>
                        <div style={{ textAlign: 'center' }}>{letterEl}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
