'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

const GET_STUDENT_PROFILE = /* GraphQL */ `
  query GetStudentProfile($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items { id firstName lastName email courseId }
    }
  }
`

const LIST_SEMESTERS_FOR_COURSE = /* GraphQL */ `
  query ListSemestersForCourse($courseId: String!) {
    listSemesters(filter: { courseId: { eq: $courseId } }, limit: 50) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent quizWeightPercent testWeightPercent
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

const LIST_MY_SUBMISSIONS = /* GraphQL */ `
  query ListMySubmissions($studentId: String!) {
    listSubmissions(filter: { studentId: { eq: $studentId } }, limit: 500) {
      items { id studentId content grade status isArchived teacherComment submittedAt }
    }
  }
`

type StudentProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  courseId: string | null
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
}

type LessonColumn = {
  lessonId: string
  title: string
  order: number
  category: string
  templateId: string | null
}

type AssignmentGrade = {
  col: LessonColumn
  grade: string | null | 'pending'
  teacherComment: string | null
  submittedAt: string | null
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

function gradeColor(letter: string): { bg: string; text: string; border: string } {
  if (letter === 'A') return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }
  if (letter === 'B') return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' }
  if (letter === 'C') return { bg: '#fef9c3', text: '#a16207', border: '#fde68a' }
  if (letter === 'D') return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }
  if (letter === 'F') return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' }
  return { bg: 'var(--gray-light)', text: 'var(--gray-mid)', border: 'var(--gray-light)' }
}

function scoreColor(n: number, gradeA: number, gradeB: number, gradeC: number, gradeD: number) {
  const l = letterGrade(n, gradeA, gradeB, gradeC, gradeD)
  return gradeColor(l)
}

export default function StudentGradesPage() {
  const { user } = useAuthenticator()
  const router = useRouter()

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [assignments, setAssignments] = useState<AssignmentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    const userId = user?.signInDetails?.loginId || user?.userId
    if (!userId) return
    loadProfile(userId)
  }, [user?.userId])

  useEffect(() => {
    if (selectedSemesterId && profile) {
      loadGrades(selectedSemesterId)
    }
  }, [selectedSemesterId])

  async function loadProfile(userId: string) {
    setLoading(true)
    try {
      const res = await (client.graphql({
        query: GET_STUDENT_PROFILE,
        variables: { userId },
      }) as any)
      const items = res.data.listStudentProfiles.items
      if (items.length === 0) { setLoading(false); return }
      const p: StudentProfile = items[0]
      setProfile(p)

      if (!p.courseId) { setLoading(false); return }

      // Load semesters for their course
      const semRes = await (client.graphql({
        query: LIST_SEMESTERS_FOR_COURSE,
        variables: { courseId: p.courseId },
      }) as any)
      const sems: Semester[] = semRes.data.listSemesters.items
      const sorted = [...sems].sort((a, b) => b.startDate.localeCompare(a.startDate))
      setSemesters(sorted)

      const active = sorted.find(s => s.isActive)
      if (active) setSelectedSemesterId(active.id)
      else if (sorted.length > 0) setSelectedSemesterId(sorted[0].id)
    } catch (err) {
      console.error('Error loading profile/semesters:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadGrades(semesterId: string) {
    const sem = semesters.find(s => s.id === semesterId)
    if (!sem || !sem.courseId || !profile) return

    setDataLoading(true)
    try {
      // 1. Load all weekly plans, filter client-side
      const plansRes = await (client.graphql({ query: LIST_WEEKLY_PLANS }) as any)
      const allPlans = plansRes.data.listWeeklyPlans.items

      const plansInRange = allPlans.filter((p: any) =>
        p.weekStartDate >= sem.startDate &&
        p.weekStartDate <= sem.endDate &&
        p.courseWeeklyPlansId === sem.courseId
      )

      // 2. Collect plan items with lessons
      const lessonMap = new Map<string, any>()
      const templateIds = new Set<string>()
      for (const plan of plansInRange) {
        for (const item of plan.items?.items || []) {
          if (item.lesson && !lessonMap.has(item.lesson.id)) {
            lessonMap.set(item.lesson.id, item)
            if (item.lessonTemplateId) templateIds.add(item.lessonTemplateId)
          }
        }
      }

      // 3. Load lesson templates for categories
      const templateMap = new Map<string, any>()
      if (templateIds.size > 0) {
        const tmplRes = await (client.graphql({
          query: LIST_LESSON_TEMPLATES,
          variables: { filter: { courseLessonTemplatesId: { eq: sem.courseId } } },
        }) as any)
        for (const t of tmplRes.data.listLessonTemplates.items) {
          templateMap.set(t.id, t)
        }
      }

      // 4. Build sorted columns
      const cols: LessonColumn[] = []
      for (const [lessonId, item] of lessonMap.entries()) {
        const lesson = item.lesson
        const tmpl = item.lessonTemplateId ? templateMap.get(item.lessonTemplateId) : null
        const cat = categoryLabel(tmpl?.lessonCategory)
        const order = lesson.order ?? tmpl?.lessonNumber ?? 9999
        cols.push({ lessonId, title: lesson.title, order, category: cat, templateId: item.lessonTemplateId || null })
      }
      cols.sort((a, b) => a.order - b.order)

      // 5. Load student's submissions
      const studentId = profile.email || user?.signInDetails?.loginId || user?.userId || ''
      const subsRes = await (client.graphql({
        query: LIST_MY_SUBMISSIONS,
        variables: { studentId },
      }) as any)
      const allSubs = subsRes.data.listSubmissions.items

      // Also try userId as fallback if email produced nothing
      let subs = allSubs.filter((s: any) => !s.isArchived)
      if (subs.length === 0 && user?.userId && user.userId !== studentId) {
        const subsRes2 = await (client.graphql({
          query: LIST_MY_SUBMISSIONS,
          variables: { studentId: user.userId },
        }) as any)
        subs = subsRes2.data.listSubmissions.items.filter((s: any) => !s.isArchived)
      }

      // 6. Match submissions to lessons
      const lessonIdSet = new Set(cols.map(c => c.lessonId))
      const subByLesson = new Map<string, { grade: string | null; teacherComment: string | null; submittedAt: string | null }>()
      for (const sub of subs) {
        let parsedLessonId: string | null = null
        try {
          const content = JSON.parse(sub.content || '{}')
          parsedLessonId = content.lessonId || null
        } catch { continue }
        if (!parsedLessonId || !lessonIdSet.has(parsedLessonId)) continue
        subByLesson.set(parsedLessonId, {
          grade: sub.grade,
          teacherComment: sub.teacherComment,
          submittedAt: sub.submittedAt,
        })
      }

      // 7. Build assignment grades list
      const result: AssignmentGrade[] = cols.map(col => {
        const sub = subByLesson.get(col.lessonId)
        if (!sub) return { col, grade: null, teacherComment: null, submittedAt: null }
        return {
          col,
          grade: sub.grade ? sub.grade : 'pending',
          teacherComment: sub.teacherComment,
          submittedAt: sub.submittedAt,
        }
      })

      setAssignments(result)
    } catch (err: any) {
      console.error('Error loading grades:', JSON.stringify(err, null, 2), err?.errors || err?.message || err)
    } finally {
      setDataLoading(false)
    }
  }

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId)

  // Compute weighted average
  const gradeA = selectedSemester?.gradeA ?? 90
  const gradeB = selectedSemester?.gradeB ?? 80
  const gradeC = selectedSemester?.gradeC ?? 70
  const gradeD = selectedSemester?.gradeD ?? 60
  const lessonW = (selectedSemester?.lessonWeightPercent ?? 60) / 100
  const quizW = (selectedSemester?.quizWeightPercent ?? 20) / 100
  const testW = (selectedSemester?.testWeightPercent ?? 20) / 100

  const byCategory: Record<string, number[]> = { lesson: [], quiz: [], test: [] }
  for (const ag of assignments) {
    if (ag.grade && ag.grade !== 'pending') {
      const n = parseFloat(ag.grade)
      if (!isNaN(n)) byCategory[ag.col.category]?.push(n)
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

  const overallAvg = weightedTotal > 0 ? weightedSum / weightedTotal : null
  const overallLetter = overallAvg !== null ? letterGrade(overallAvg, gradeA, gradeB, gradeC, gradeD) : '—'
  const letterColors = overallLetter !== '—' ? gradeColor(overallLetter) : { bg: 'var(--gray-light)', text: 'var(--gray-mid)', border: 'var(--gray-light)' }

  const gradedCount = assignments.filter(a => a.grade && a.grade !== 'pending').length
  const pendingCount = assignments.filter(a => a.grade === 'pending').length
  const notStartedCount = assignments.filter(a => !a.grade).length

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .grade-row { transition: background 0.1s; }
        .grade-row:hover { background: rgba(123,79,166,0.04) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '18px' }}>My Grades</span>
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ padding: '32px 40px 80px', maxWidth: '760px', margin: '0 auto' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '80px 0', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading…
          </div>
        ) : !profile ? (
          <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '80px 0' }}>No student profile found.</p>
        ) : semesters.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '80px 0' }}>No academic year set up for your course yet.</p>
        ) : (
          <>
            {/* Semester tabs */}
            {semesters.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {semesters.map(s => (
                  <button key={s.id} onClick={() => setSelectedSemesterId(s.id)}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                      borderColor: selectedSemesterId === s.id ? 'var(--plum)' : 'var(--gray-light)',
                      background: selectedSemesterId === s.id ? 'var(--plum)' : 'var(--background)',
                      color: selectedSemesterId === s.id ? 'white' : 'var(--gray-mid)',
                    }}>
                    {s.name}{s.isActive ? ' ●' : ''}
                  </button>
                ))}
              </div>
            )}

            {dataLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '48px 0', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Loading grades…
              </div>
            ) : (
              <>
                {/* ── GRADE HERO ── */}
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '16px', padding: '28px 32px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {/* Big letter grade */}
                  <div style={{ width: 88, height: 88, borderRadius: '20px', background: letterColors.bg, border: `2px solid ${letterColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '44px', fontWeight: 900, color: letterColors.text, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{overallLetter}</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', fontWeight: 500, marginBottom: '4px' }}>
                      {selectedSemester?.course?.title} — {selectedSemester?.name}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                      {overallAvg !== null ? overallAvg.toFixed(1) + '%' : 'No grades yet'}
                    </div>
                    {overallAvg !== null && (
                      <div style={{ marginTop: '10px', height: 8, background: 'var(--gray-light)', borderRadius: 4, overflow: 'hidden', maxWidth: 320 }}>
                        <div style={{ height: '100%', width: `${overallAvg}%`, background: letterColors.text, borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    )}
                  </div>

                  {/* Summary counts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>✓ {gradedCount} graded</div>
                    <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>⏳ {pendingCount} pending</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', fontWeight: 500 }}>○ {notStartedCount} not started</div>
                  </div>
                </div>

                {/* ── CATEGORY BREAKDOWN ── */}
                {(lAvg !== null || qAvg !== null || tAvg !== null) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Lessons', icon: '📖', avg: lAvg, weight: selectedSemester?.lessonWeightPercent ?? 60, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
                      { label: 'Participation', icon: '✏️', avg: qAvg, weight: selectedSemester?.quizWeightPercent ?? 20, color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
                      { label: 'Tests', icon: '📝', avg: tAvg, weight: selectedSemester?.testWeightPercent ?? 20, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
                    ].map(cat => (
                      <div key={cat.label} style={{ background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: '12px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: cat.color }}>{cat.icon} {cat.label}</span>
                          <span style={{ fontSize: '11px', color: cat.color, opacity: 0.7 }}>{cat.weight}% of grade</span>
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: cat.color, fontFamily: 'var(--font-display)' }}>
                          {cat.avg !== null ? cat.avg.toFixed(1) + '%' : '—'}
                        </div>
                        {cat.avg !== null && (
                          <div style={{ marginTop: '8px', height: 4, background: `${cat.color}22`, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cat.avg}%`, background: cat.color, borderRadius: 2 }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ASSIGNMENT LIST ── */}
                {assignments.length === 0 ? (
                  <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '32px 0' }}>
                    No assignments found in this academic year's date range.
                  </p>
                ) : (
                  <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '12px 20px', borderBottom: '2px solid var(--gray-light)', background: 'rgba(123,79,166,0.03)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ flex: 1, fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase' }}>Assignment</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', minWidth: '80px', textAlign: 'center' }}>Score</span>
                    </div>

                    {assignments.map((ag, i) => {
                      const isEven = i % 2 === 0
                      const catColor = ag.col.category === 'test' ? '#dc2626' : ag.col.category === 'quiz' ? '#d97706' : '#16a34a'
                      const catBg = ag.col.category === 'test' ? '#fef2f2' : ag.col.category === 'quiz' ? '#fffbeb' : '#f0fdf4'
                      const catIcon = ag.col.category === 'test' ? '📝' : ag.col.category === 'quiz' ? '✏️' : '📖'
                      const isExpanded = expandedId === ag.col.lessonId

                      let scoreEl: React.ReactNode
                      if (!ag.grade) {
                        scoreEl = <span style={{ fontSize: '12px', color: 'var(--gray-light)' }}>Not started</span>
                      } else if (ag.grade === 'pending') {
                        scoreEl = (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#b45309', background: '#fef9c3', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                            Pending
                          </span>
                        )
                      } else {
                        const n = parseFloat(ag.grade)
                        if (!isNaN(n)) {
                          const l = letterGrade(n, gradeA, gradeB, gradeC, gradeD)
                          const sc = scoreColor(n, gradeA, gradeB, gradeC, gradeD)
                          scoreEl = (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: sc.bg, color: sc.text, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${sc.border}` }}>{l}</span>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{n % 1 === 0 ? n : n.toFixed(1)}</span>
                            </span>
                          )
                        } else {
                          scoreEl = <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{ag.grade}</span>
                        }
                      }

                      const hasComment = ag.teacherComment && ag.teacherComment.trim().length > 0

                      return (
                        <div key={ag.col.lessonId}>
                          <div
                            className="grade-row"
                            onClick={() => hasComment ? setExpandedId(isExpanded ? null : ag.col.lessonId) : undefined}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                              background: isEven ? 'var(--background)' : 'rgba(0,0,0,0.015)',
                              borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                              cursor: hasComment ? 'pointer' : 'default',
                            }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: catBg, color: catColor, border: `1px solid ${catColor}22`, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                              {catIcon}
                            </span>
                            <span style={{ flex: 1, fontSize: '14px', color: 'var(--foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ag.col.title}>
                              {ag.col.title}
                            </span>
                            {ag.submittedAt && (
                              <span style={{ fontSize: '11px', color: 'var(--gray-mid)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                {new Date(ag.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <div style={{ flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{scoreEl}</div>
                            {hasComment && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="2"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>

                          {/* Teacher comment expansion */}
                          {isExpanded && hasComment && (
                            <div style={{ padding: '12px 20px 14px 52px', background: 'rgba(123,79,166,0.03)', borderTop: '1px solid rgba(123,79,166,0.1)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Teacher Comment
                              </div>
                              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.6 }}>
                                {ag.teacherComment}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
