'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const listPlansWithItemsQuery = /* GraphQL */`
  query ListPlansForParticipation($filter: ModelWeeklyPlanFilterInput) {
    listWeeklyPlans(filter: $filter, limit: 500) {
      items {
        id
        weekStartDate
        assignedStudentIds
        items {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            isInClass
            lessonTemplateId
            lesson { id title order }
          }
        }
      }
    }
  }
`

const listActiveStudentsQuery = /* GraphQL */`
  query ListActiveStudentsForCourse($courseId: String!) {
    listStudentProfiles(filter: { courseId: { eq: $courseId }, status: { eq: "active" } }, limit: 200) {
      items { id userId email firstName lastName preferredName }
    }
  }
`

const listSubmissionsPageQuery = /* GraphQL */`
  query ListSubmissionsForParticipation($nextToken: String) {
    listSubmissions(limit: 1000, nextToken: $nextToken) {
      items { id studentId content grade status isArchived }
      nextToken
    }
  }
`

type Course = { id: string; title: string; isArchived?: boolean | null }
type PlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  isInClass: boolean | null
  lessonTemplateId: string | null
  lesson: { id: string; title: string; order: number | null } | null
}
type Plan = { id: string; weekStartDate: string; assignedStudentIds: string | null; items?: { items: PlanItem[] } | null }
type Student = { id: string; userId: string; email: string; firstName: string; lastName: string; preferredName: string | null }
type Sub = { id: string; studentId: string; content: string | null; grade: string | null; status: string | null; isArchived: boolean | null }

// One selectable in-class assignment: a plan item plus its week context.
type InClassOption = {
  itemId: string
  lessonId: string
  lessonTitle: string
  lessonOrder: number | null
  lessonTemplateId: string | null
  dayOfWeek: string
  dueTime: string | null
  weekStartDate: string
  assignedStudentIds: string | null
}

type StudentRow = {
  student: Student
  // none: no submission — eligible for credit
  // credited: has a teacher-given participation credit (can be undone)
  // submitted: turned the work in themselves (absent-student path) — hands off
  state: 'none' | 'credited' | 'submitted'
  submissionId: string | null
  grade: string | null
}

function weekLabel(weekStartDate: string): string {
  const d = new Date(weekStartDate + 'T00:00:00')
  if (isNaN(d.getTime())) return weekStartDate
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ParticipationPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [options, setOptions] = useState<InClassOption[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [subs, setSubs] = useState<Sub[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [justCredited, setJustCredited] = useState(0)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    async function fetchCourses() {
      try {
        const result = await client.graphql({ query: listCourses }) as any
        const items = (result.data.listCourses.items as Course[]).filter(c => !c.isArchived)
        items.sort((a, b) => a.title.localeCompare(b.title))
        setCourses(items)
      } catch (err) { console.error(err) }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) return
    let cancelled = false

    async function loadCourseData() {
      setLoadingData(true)
      setOptions([])
      setSelectedItemId('')
      setSubs([])
      setJustCredited(0)
      setSaveError('')
      try {
        const [plansRes, studentsRes] = await Promise.all([
          client.graphql({
            query: listPlansWithItemsQuery,
            variables: { filter: { courseWeeklyPlansId: { eq: selectedCourseId } } }
          }) as any,
          client.graphql({
            query: listActiveStudentsQuery,
            variables: { courseId: selectedCourseId }
          }) as any,
        ])
        if (cancelled) return

        const plans: Plan[] = plansRes.data.listWeeklyPlans.items
        const opts: InClassOption[] = []
        for (const plan of plans) {
          for (const item of plan.items?.items || []) {
            if (!item.lesson) continue
            // Items saved before the isInClass flag persisted have it null —
            // Friday defaulted to in-class on the schedule page, so treat
            // legacy Fridays as in-class too.
            const inClass = item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday')
            if (!inClass) continue
            opts.push({
              itemId: item.id,
              lessonId: item.lesson.id,
              lessonTitle: item.lesson.title,
              lessonOrder: item.lesson.order,
              lessonTemplateId: item.lessonTemplateId,
              dayOfWeek: item.dayOfWeek,
              dueTime: item.dueTime,
              weekStartDate: plan.weekStartDate,
              assignedStudentIds: plan.assignedStudentIds,
            })
          }
        }
        opts.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
        setOptions(opts)

        // Default to the current week's in-class day; otherwise the most
        // recent past one — that's the one Melinda is standing in front of.
        const now = new Date()
        const current = opts.find(o => {
          const start = new Date(o.weekStartDate + 'T00:00:00')
          const end = new Date(start); end.setDate(start.getDate() + 7)
          return now >= start && now < end
        })
        const firstPast = opts.find(o => new Date(o.weekStartDate + 'T00:00:00') <= now)
        setSelectedItemId(current?.itemId || firstPast?.itemId || opts[0]?.itemId || '')

        const studentItems: Student[] = studentsRes.data.listStudentProfiles.items
        studentItems.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
        setStudents(studentItems)

        // Submissions can't be filtered by lesson server-side (the lesson id
        // lives inside the content JSON), so page through all of them.
        const allSubs: Sub[] = []
        let nextToken: string | null = null
        do {
          const subsRes: any = await client.graphql({
            query: listSubmissionsPageQuery,
            variables: { nextToken }
          })
          allSubs.push(...subsRes.data.listSubmissions.items)
          nextToken = subsRes.data.listSubmissions.nextToken
        } while (nextToken)
        if (cancelled) return
        setSubs(allSubs)
      } catch (err) {
        console.error('Error loading participation data:', err)
        if (!cancelled) setSaveError('Could not load data for this class. Try again.')
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }

    loadCourseData()
    return () => { cancelled = true }
  }, [selectedCourseId])

  const selectedOption = options.find(o => o.itemId === selectedItemId) || null

  // Build per-student rows for the selected assignment
  const rows: StudentRow[] = (() => {
    if (!selectedOption) return []
    let assignedIds: string[] | null = null
    if (selectedOption.assignedStudentIds) {
      try {
        const parsed = JSON.parse(selectedOption.assignedStudentIds)
        if (Array.isArray(parsed) && parsed.length > 0) assignedIds = parsed
      } catch { /* treat as all students */ }
    }
    const result: StudentRow[] = []
    for (const s of students) {
      if (assignedIds && !assignedIds.includes(s.userId) && !assignedIds.includes(s.email)) continue
      let state: StudentRow['state'] = 'none'
      let submissionId: string | null = null
      let grade: string | null = null
      for (const sub of subs) {
        if (sub.isArchived) continue
        if (sub.studentId !== s.userId && sub.studentId !== s.email) continue
        let content: any = null
        try { content = JSON.parse(sub.content || '{}') } catch { continue }
        if (content.lessonId !== selectedOption.lessonId) continue
        submissionId = sub.id
        grade = sub.grade
        state = content.participationCredit ? 'credited' : 'submitted'
        break
      }
      result.push({ student: s, state, submissionId, grade })
    }
    return result
  })()

  // Default-check everyone whenever the assignment changes — Melinda unchecks
  // the absent ones. Deliberately NOT keyed on `subs`: after Give Credit
  // updates the submission list, re-running this would re-check the absent
  // students she just unchecked. Students who already submitted stay in the
  // set harmlessly — every credit path filters through `eligible`.
  useEffect(() => {
    if (!selectedItemId) { setChecked(new Set()); return }
    setChecked(new Set(students.map(s => s.userId)))
    setJustCredited(0)
    setSaveError('')
  }, [selectedItemId, students])

  function toggle(userId: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const eligible = rows.filter(r => r.state === 'none')
  const allChecked = eligible.length > 0 && eligible.every(r => checked.has(r.student.userId))

  function toggleAll() {
    if (allChecked) setChecked(new Set())
    else setChecked(new Set(eligible.map(r => r.student.userId)))
  }

  async function giveCredit() {
    if (!selectedOption || checked.size === 0 || saving) return
    setSaving(true)
    setSaveError('')
    const course = courses.find(c => c.id === selectedCourseId)
    try {
      const { createSubmission } = await import('../../../src/graphql/mutations')
      const now = new Date().toISOString()
      const created: Sub[] = []
      for (const row of eligible) {
        if (!checked.has(row.student.userId)) continue
        const content = JSON.stringify({
          notes: 'Present in class — participation credit given by teacher.',
          files: [],
          lessonId: selectedOption.lessonId,
          lessonTitle: selectedOption.lessonTitle,
          courseId: selectedCourseId,
          courseTitle: course?.title || '',
          weeklyPlanItemId: selectedOption.itemId,
          dueDateTime: null,
          lessonTemplateId: selectedOption.lessonTemplateId,
          answers: {},
          participationCredit: true,
        })
        const res = await (client.graphql({
          query: createSubmission,
          variables: { input: {
            studentId: row.student.userId,
            content,
            submittedAt: now,
            status: 'submitted',
            grade: '100',
            teacherComment: 'Present in class ✓',
            lessonTemplateId: selectedOption.lessonTemplateId,
          } }
        }) as any)
        const id = res.data?.createSubmission?.id
        if (id) {
          created.push({ id, studentId: row.student.userId, content, grade: '100', status: 'submitted', isArchived: false })
        }
      }
      setSubs(prev => [...prev, ...created])
      setJustCredited(created.length)
      setChecked(new Set())
    } catch (err: any) {
      console.error('Error giving participation credit:', err)
      const msg = err?.errors?.[0]?.message || err?.message || 'Unknown error.'
      setSaveError(`Some credits may not have saved: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  async function undoCredit(row: StudentRow) {
    if (!row.submissionId || row.state !== 'credited' || undoingId) return
    setUndoingId(row.submissionId)
    try {
      const { deleteSubmission } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: deleteSubmission,
        variables: { input: { id: row.submissionId } }
      })
      setSubs(prev => prev.filter(s => s.id !== row.submissionId))
    } catch (err) {
      console.error('Error undoing credit:', err)
      setSaveError('Could not remove that credit. Try again.')
    } finally {
      setUndoingId(null)
    }
  }

  if (checking) return null

  const checkedCount = eligible.filter(r => checked.has(r.student.userId)).length

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>In-Class Participation</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px', lineHeight: 1.6 }}>
          Check off who was in class and give them credit for the day&apos;s in-class assignment — it comes off their
          to-do list and counts as Participation in their grade. Students who weren&apos;t there keep the assignment
          and turn it in online like any other day.
        </p>

        {/* Class picker */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '8px' }}>Class</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {courses.map(c => {
              const active = c.id === selectedCourseId
              return (
                <button key={c.id} onClick={() => setSelectedCourseId(c.id)}
                  style={{
                    background: active ? 'var(--plum)' : 'var(--background)',
                    color: active ? 'white' : 'var(--gray-dark)',
                    border: `1px solid ${active ? 'var(--plum)' : 'var(--gray-light)'}`,
                    padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: active ? 600 : 500, fontFamily: 'var(--font-body)',
                  }}>
                  {c.title}
                </button>
              )
            })}
          </div>
        </div>

        {selectedCourseId && (
          loadingData ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Loading class data…</p>
          ) : options.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>
              No in-class assignments scheduled for this class yet. Mark a day as “In-class assignment” on the Schedule page first.
            </p>
          ) : (
            <>
              {/* Assignment picker */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>In-class assignment</label>
                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
                  style={{ width: '100%', maxWidth: '460px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                  {options.map(o => (
                    <option key={o.itemId} value={o.itemId}>
                      Week of {weekLabel(o.weekStartDate)} · {o.dayOfWeek} — {o.lessonOrder ? `Lesson ${o.lessonOrder} — ` : ''}{o.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student roster */}
              {selectedOption && (
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: 0 }}>Who was in class?</h2>
                    {eligible.length > 0 && (
                      <button onClick={toggleAll}
                        style={{ background: 'transparent', border: 'none', color: 'var(--plum)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: 0 }}>
                        {allChecked ? 'Uncheck all' : 'Check all'}
                      </button>
                    )}
                  </div>

                  {rows.length === 0 ? (
                    <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: 0 }}>No active students are assigned this work.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {rows.map((row, idx) => {
                        const name = `${row.student.preferredName || row.student.firstName} ${row.student.lastName}`
                        const isChecked = checked.has(row.student.userId)
                        return (
                          <div key={row.student.userId}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx === rows.length - 1 ? 'none' : '1px solid var(--gray-light)' }}>
                            {row.state === 'none' ? (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, userSelect: 'none' }}>
                                <input type="checkbox" checked={isChecked} onChange={() => toggle(row.student.userId)}
                                  style={{ width: '18px', height: '18px', accentColor: 'var(--plum)', cursor: 'pointer' }}/>
                                <span style={{ fontSize: '15px', color: 'var(--foreground)' }}>{name}</span>
                              </label>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <span style={{ width: '18px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✓</span>
                                <span style={{ fontSize: '15px', color: 'var(--foreground)' }}>{name}</span>
                                {row.state === 'credited' ? (
                                  <>
                                    <span style={{ fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '2px 10px' }}>
                                      ✏️ Present — credit given
                                    </span>
                                    <button onClick={() => undoCredit(row)} disabled={undoingId === row.submissionId}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}>
                                      {undoingId === row.submissionId ? 'Removing…' : 'Undo'}
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '12px', fontWeight: 600, background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', borderRadius: '20px', padding: '2px 10px' }}>
                                    {row.grade ? `Turned in — graded ${row.grade}` : 'Turned in — needs grading'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Action row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button onClick={giveCredit} disabled={saving || checkedCount === 0}
                      style={{
                        background: saving || checkedCount === 0 ? 'var(--gray-light)' : 'var(--plum)',
                        color: saving || checkedCount === 0 ? 'var(--gray-mid)' : 'white',
                        padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: saving || checkedCount === 0 ? 'default' : 'pointer',
                        fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)',
                      }}>
                      {saving ? 'Saving…' : `Give Credit${checkedCount > 0 ? ` (${checkedCount})` : ''}`}
                    </button>
                    {justCredited > 0 && (
                      <span style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>
                        ✓ Credit given to {justCredited} student{justCredited !== 1 ? 's' : ''}
                      </span>
                    )}
                    {saveError && <span style={{ color: '#dc2626', fontSize: '14px' }}>{saveError}</span>}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* ── Season attendance summary ─────────────────────────────────── */}
        {selectedCourseId && !loadingData && options.length > 0 && (() => {
          const nowMs = Date.now()
          // In-class days already held (due datetime passed; else week over)
          const heldOpts = options.filter(o => {
            if (o.dueTime) {
              const d = new Date(o.dueTime).getTime()
              if (!isNaN(d)) return d <= nowMs
            }
            const ws = new Date(o.weekStartDate + 'T00:00:00')
            const we = new Date(ws); we.setDate(ws.getDate() + 7)
            return we.getTime() <= nowMs
          })
          if (heldOpts.length === 0) return null

          const summary = students.map(st => {
            let held = 0, present = 0
            const missed: string[] = []
            for (const o of heldOpts) {
              // respect per-assignment student targeting
              if (o.assignedStudentIds) {
                try {
                  const ids = JSON.parse(o.assignedStudentIds)
                  if (Array.isArray(ids) && ids.length > 0 && !ids.includes(st.userId) && !ids.includes(st.email)) continue
                } catch { /* all students */ }
              }
              held++
              const credited = subs.some(sub => {
                if (sub.isArchived) return false
                if (sub.studentId !== st.userId && sub.studentId !== st.email) return false
                try {
                  const c = JSON.parse(sub.content || '{}')
                  return c.lessonId === o.lessonId && c.participationCredit === true
                } catch { return false }
              })
              if (credited) present++
              else missed.push(weekLabel(o.weekStartDate))
            }
            return { st, held, present, missed }
          }).filter(r => r.held > 0)
            .sort((a, b) => a.st.lastName.localeCompare(b.st.lastName) || a.st.firstName.localeCompare(b.st.firstName))

          if (summary.length === 0) return null
          return (
            <div style={{ marginTop: '40px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Season Attendance
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gray-mid)', margin: '0 0 14px' }}>
                In-class days attended, out of the {heldOpts.length} held so far in this class.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.map(({ st, held, present, missed }) => (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 12px', background: 'var(--page-bg)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
                      {st.lastName}, {st.preferredName || st.firstName}
                    </span>
                    {present === held ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                        ⭐ Perfect · {present}/{held}
                      </span>
                    ) : (
                      <span
                        title={missed.length > 0 ? `Missed: ${missed.join(', ')}` : undefined}
                        style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px', background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', cursor: missed.length > 0 ? 'help' : 'default' }}>
                        🏫 {present}/{held} in class
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </main>
    </div>
  )
}
