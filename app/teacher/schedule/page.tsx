'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses, listStudentProfiles } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }
type LessonTemplate = {
  id: string; lessonNumber: number; title: string; instructions: string | null
  worksheetUrl: string | null; videoUrl: string | null
  assignmentType: string | null
  questions?: { items: { id: string }[] } | null
}

// Local query instead of the generated one: the mode chip under each day needs
// the question count, which the generated listLessonTemplates doesn't select.
const listLessonTemplatesForSchedule = /* GraphQL */ `
  query ListLessonTemplatesForSchedule($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id lessonNumber title instructions worksheetUrl videoUrl assignmentType
        questions { items { id } }
      }
      nextToken
    }
  }
`
type StudentProfile = { id: string; userId: string; email: string; firstName: string; lastName: string; courseId: string | null }

type DayPlan = {
  day: string
  lessonTemplateId: string
  lessonNumber: string
  lessonTitle: string
  instructions: string
  videoUrl: string
  dueDate: string
  dueTime: string
  isPublished: boolean
  isInClass: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function getDefaultDueDate(day: string, weekStartDate: string): string {
  if (!weekStartDate) return ''
  const start = new Date(weekStartDate + 'T00:00:00')
  const offsets: Record<string, number> = { Monday: 1, Tuesday: 1, Wednesday: 3, Thursday: 3, Friday: 4 }
  const offset = offsets[day] ?? 0
  const due = new Date(start)
  due.setDate(start.getDate() + offset)
  return due.toISOString().split('T')[0]
}

function getDefaultDueTime(_day: string): string {
  return '17:00'
}

/**
 * What students will actually be asked to do for this lesson — shown under the
 * dropdown so Melinda catches surprises during her weekly review. The main one:
 * old-course lessons that still carry leftover test questions from early
 * experiments would quietly become digital-question assignments.
 */
function LessonModeNote({ template, courseId }: { template: LessonTemplate | undefined; courseId: string }) {
  const router = useRouter()
  if (!template) return null
  const qCount = template.questions?.items?.length || 0
  if (qCount > 0) {
    return (
      <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span>📝 {qCount} digital question{qCount !== 1 ? 's' : ''} — students answer on the platform</span>
        <a
          onClick={e => { e.preventDefault(); router.push(`/teacher/library/${courseId}`) }}
          href={`/teacher/library/${courseId}`}
          style={{ color: 'var(--plum)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
          Review lesson →
        </a>
      </div>
    )
  }
  if (template.worksheetUrl) {
    return <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)' }}>🖨 Printable worksheet — photo upload</div>
  }
  return <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)' }}>📷 Book work — follow the video, photo upload</div>
}

function ScheduleWeekInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checking } = useRoleGuard('teacher')
  const preselectedCourseId = searchParams.get('courseId') || ''

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId)
  const [selectedCourseName, setSelectedCourseName] = useState('')
  const [lessonTemplates, setLessonTemplates] = useState<LessonTemplate[]>([])
  const [weekStartDate, setWeekStartDate] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [assignToAll, setAssignToAll] = useState(true)
  const [days, setDays] = useState<DayPlan[]>(
    DAYS.map(day => ({
      day,
      lessonTemplateId: '',
      lessonNumber: '',
      lessonTitle: '',
      instructions: '',
      videoUrl: '',
      dueDate: '',
      dueTime: getDefaultDueTime(day),
      isPublished: false,
      isInClass: day === 'Friday'
    }))
  )
  // Extra assignments beyond the Mon–Fri grid — same shape as a day row, but
  // the due date is teacher-chosen rather than derived from the week start.
  const [extras, setExtras] = useState<DayPlan[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Synchronous double-click guard. The disabled={saving} on the button is
  // not enough: two rapid clicks both read saving=false before React commits
  // the state update, and each created a full week of duplicate assignments.
  const savingRef = useRef(false)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  // If no courseId in URL, load all courses so teacher can pick one
  useEffect(() => {
    if (!preselectedCourseId) {
      async function fetchCourses() {
        try {
          const result = await client.graphql({ query: listCourses })
          setCourses(result.data.listCourses.items as Course[])
        } catch (err) { console.error(err) }
      }
      fetchCourses()
    }
  }, [preselectedCourseId])

  // When course is known, fetch lessons and course name
  useEffect(() => {
    if (!selectedCourseId) return

    async function fetchLessons() {
      try {
        let allItems: LessonTemplate[] = []
        let nextToken: string | null = null
        do {
          const result: any = await client.graphql({
            query: listLessonTemplatesForSchedule,
            variables: { filter: { courseLessonTemplatesId: { eq: selectedCourseId } }, limit: 500, nextToken }
          })
          allItems = [...allItems, ...result.data.listLessonTemplates.items]
          nextToken = result.data.listLessonTemplates.nextToken
        } while (nextToken)
        allItems.sort((a, b) => a.lessonNumber - b.lessonNumber)
        setLessonTemplates(allItems)
      } catch (err) { console.error(err) }
    }

    async function fetchStudents() {
      try {
        const result = await client.graphql({
          query: listStudentProfiles,
          // Only active students are assignable. `ne: 'removed'` let archived
          // (past-year) and declined profiles through — they keep their
          // courseId, so they showed up here as if work could be assigned to
          // them. Verified 2026-08-04: every profile row has an explicit
          // status, so requiring 'active' drops no legacy rows.
          variables: { filter: { courseId: { eq: selectedCourseId }, status: { eq: 'active' } }, limit: 200 }
        }) as any
        const items = result.data.listStudentProfiles.items as StudentProfile[]
        setStudents(items)
        // Default: all selected
        setSelectedStudentIds(new Set(items.map(s => s.userId)))
        setAssignToAll(true)
      } catch (err) { console.error(err) }
    }

    fetchLessons()
    fetchStudents()

    // If preselected, find course name
    if (preselectedCourseId) {
      async function fetchCourseName() {
        try {
          const result = await client.graphql({ query: listCourses }) as any
          const found = result.data.listCourses.items.find((c: Course) => c.id === preselectedCourseId)
          if (found) setSelectedCourseName(found.title)
        } catch (err) { console.error(err) }
      }
      fetchCourseName()
    }
  }, [selectedCourseId, preselectedCourseId])

  useEffect(() => {
    if (!weekStartDate) return
    setDays(prev => prev.map(day => ({
      ...day,
      dueDate: getDefaultDueDate(day.day, weekStartDate)
    })))
  }, [weekStartDate])

  function toggleStudent(userId: string) {
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setAssignToAll(false)
  }

  function toggleAll() {
    if (assignToAll) {
      setAssignToAll(false)
      setSelectedStudentIds(new Set())
    } else {
      setAssignToAll(true)
      setSelectedStudentIds(new Set(students.map(s => s.userId)))
    }
  }

  function selectLesson(dayIndex: number, templateId: string) {
    // Choosing "Select lesson..." clears the day — needed to undo an auto-fill.
    if (!templateId) {
      const updated = [...days]
      updated[dayIndex] = {
        ...updated[dayIndex],
        lessonTemplateId: '', lessonNumber: '', lessonTitle: '',
        instructions: '', videoUrl: '', isPublished: false,
      }
      setDays(updated)
      return
    }
    const template = lessonTemplates.find(t => t.id === templateId)
    if (!template) return
    const fill = (row: DayPlan, t: LessonTemplate): DayPlan => ({
      ...row,
      lessonTemplateId: t.id,
      lessonNumber: String(t.lessonNumber),
      lessonTitle: t.title,
      instructions: t.instructions || '',
      videoUrl: t.videoUrl || '',
      // Auto-publish on selection; the checkbox stays editable for the rare
      // lesson Melinda wants staged but hidden.
      isPublished: true,
    })
    const updated = [...days]
    updated[dayIndex] = fill(updated[dayIndex], template)
    // Auto-fill the REST of the week: each still-empty later day gets the next
    // lesson in library order. Days she already chose are never overwritten.
    let next = lessonTemplates.findIndex(t => t.id === templateId) + 1
    for (let i = dayIndex + 1; i < updated.length && next < lessonTemplates.length; i++) {
      if (updated[i].lessonTemplateId) continue
      updated[i] = fill(updated[i], lessonTemplates[next])
      next++
    }
    setDays(updated)
  }

  function updateDay(index: number, field: keyof DayPlan, value: string | boolean) {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  /** Blank Mon–Fri rows + no extras — the page's initial state. */
  function emptyWeek(): DayPlan[] {
    return DAYS.map(day => ({
      day,
      lessonTemplateId: '', lessonNumber: '', lessonTitle: '',
      instructions: '', videoUrl: '',
      dueDate: '', dueTime: getDefaultDueTime(day),
      isPublished: false,
      isInClass: day === 'Friday',
    }))
  }

  function resetWeek() {
    setDays(emptyWeek())
    setExtras([])
    setSaveError('')
    setSaved(false)
  }

  /**
   * Switching course must clear the day rows: the chosen lesson ids belong to
   * the OLD course's library, so the dropdowns went blank but the rows kept
   * their publish flags, videos and instructions — half a ghost schedule.
   */
  function changeCourse(courseId: string) {
    setSelectedCourseId(courseId)
    resetWeek()
  }

  function addExtra() {
    setExtras(prev => [...prev, {
      day: 'Additional',
      lessonTemplateId: '',
      lessonNumber: '',
      lessonTitle: '',
      instructions: '',
      videoUrl: '',
      dueDate: '',
      dueTime: '17:00',
      isPublished: false,
      isInClass: false,
    }])
  }

  function removeExtra(index: number) {
    setExtras(prev => prev.filter((_, i) => i !== index))
  }

  function selectExtraLesson(index: number, templateId: string) {
    const template = lessonTemplates.find(t => t.id === templateId)
    if (!template) return
    setExtras(prev => prev.map((x, i) => i !== index ? x : {
      ...x,
      lessonTemplateId: templateId,
      lessonNumber: String(template.lessonNumber),
      lessonTitle: template.title,
      instructions: template.instructions || '',
      videoUrl: template.videoUrl || '',
      isPublished: true,
    }))
  }

  function updateExtra(index: number, field: keyof DayPlan, value: string | boolean) {
    setExtras(prev => prev.map((x, i) => i !== index ? x : { ...x, [field]: value }))
  }

  async function saveSchedule() {
    if (!selectedCourseId || !weekStartDate) return
    if (savingRef.current) return
    savingRef.current = true
    // The Mon–Fri rows get default due dates from the week start, but an
    // additional assignment's whole point is a chosen date — refuse to guess.
    if (extras.some(x => x.lessonNumber && !x.dueDate)) {
      setSaveError('Each additional assignment needs a due date.')
      savingRef.current = false
      return
    }
    // Same lesson on two days is almost always a slip of the dropdown —
    // confirm before students see it twice.
    {
      const chosen = [...days, ...extras].filter(d => d.lessonTemplateId)
      const byTemplate = new Map<string, DayPlan[]>()
      for (const d of chosen) {
        byTemplate.set(d.lessonTemplateId, [...(byTemplate.get(d.lessonTemplateId) || []), d])
      }
      const dups = [...byTemplate.values()].filter(rows => rows.length > 1)
      if (dups.length > 0) {
        const lines = dups.map(rows =>
          `• Lesson ${rows[0].lessonNumber} — ${rows[0].lessonTitle} (${rows.map(r => r.day).join(' and ')})`
        ).join('\n')
        const proceed = window.confirm(
          `You've scheduled the same lesson more than once this week:\n\n${lines}\n\n` +
          `Students would be assigned it twice. Save anyway?`
        )
        if (!proceed) {
          savingRef.current = false
          return
        }
      }
    }
    setSaving(true)
    setSaveError('')
    try {
      // A schedule for this course + week may already exist (double-click,
      // back-button resave, or a genuine second plan for a student subset).
      // Creating it silently doubles every assignment on the student side,
      // so surface it and let Melinda decide.
      try {
        const dupRes = await (client.graphql({
          query: /* GraphQL */`
            query CheckExistingWeekPlan($filter: ModelWeeklyPlanFilterInput) {
              listWeeklyPlans(filter: $filter, limit: 500) {
                items { id }
              }
            }
          `,
          variables: { filter: { courseWeeklyPlansId: { eq: selectedCourseId }, weekStartDate: { eq: weekStartDate } } }
        }) as any)
        const existing = dupRes?.data?.listWeeklyPlans?.items ?? []
        if (existing.length > 0) {
          const proceed = window.confirm(
            `A schedule for this course starting ${weekStartDate} already exists — students would see the week's work twice.\n\n` +
            `To change that week, delete the existing plan under Assigned Work first.\n\n` +
            `Create a second schedule for this week anyway?`
          )
          if (!proceed) {
            setSaving(false)
            savingRef.current = false
            return
          }
        }
      } catch { /* dup check is best-effort — never block saving on its failure */ }

      const { createWeeklyPlan, createWeeklyPlanItem, createLesson } = await import('../../../src/graphql/mutations')

      // Build assignedStudentIds — null means all students
      const assignedStudentIds = assignToAll ? null : JSON.stringify([...selectedStudentIds])

      const planResult = await client.graphql({
        query: createWeeklyPlan,
        variables: { input: {
          weekStartDate,
          courseWeeklyPlansId: selectedCourseId,
          assignedStudentIds
        } }
      }) as any
      const planId = planResult.data?.createWeeklyPlan?.id
      if (!planId) throw new Error('Failed to create weekly plan — no ID returned.')

      for (const day of [...days, ...extras]) {
        if (!day.lessonNumber) continue
        const lessonResult = await (client.graphql({
          query: createLesson,
          variables: { input: {
            title: day.lessonTitle || `Lesson ${day.lessonNumber}`,
            order: parseInt(day.lessonNumber) || 0,
            isPublished: day.isPublished,
            courseLessonsId: selectedCourseId,
            videoUrl: day.videoUrl || '',
            instructions: day.instructions || ''
          } as any}
        }) as any)
        const lessonId = lessonResult.data?.createLesson?.id
        if (!lessonId) throw new Error(`Failed to create lesson for ${day.day}.`)
        await client.graphql({
          query: createWeeklyPlanItem,
          variables: { input: {
            dayOfWeek: day.day,
            dueTime: `${day.dueDate}T${day.dueTime}`,
            isPublished: day.isPublished,
            isInClass: day.isInClass,
            weeklyPlanItemsId: planId,
            lessonWeeklyPlanItemsId: lessonId,
            lessonTemplateId: day.lessonTemplateId || null
          }}
        })
      }
      setSaved(true)
      setTimeout(() => router.push('/teacher'), 1500)
    } catch (err: any) {
      console.error('Error saving schedule:', err)
      const msg = err?.errors?.[0]?.message || err?.message || 'Unknown error. Check the console for details.'
      setSaveError(msg)
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  const allSelected = students.length > 0 && selectedStudentIds.size === students.length

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Schedule a Week</h1>
        {selectedCourseName && (
          <p style={{ color: 'var(--plum)', fontWeight: 500, marginBottom: '4px', fontSize: '15px' }}>{selectedCourseName}</p>
        )}
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Select a week, assign students, then pick lessons for each day. Use “Add Additional Work” for extra assignments due on dates you choose.</p>

        {/* Course selector — only shown if no courseId in URL */}
        {!preselectedCourseId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
            <select value={selectedCourseId} onChange={e => changeCourse(e.target.value)}
              style={{ width: '320px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        {/* Week date */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Week Starting (Monday)</label>
          <input
            ref={dateInputRef}
            type="date"
            value={weekStartDate}
            onChange={e => { setWeekStartDate(e.target.value); e.target.blur() }}
            style={{ width: '220px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer' }}
          />
        </div>

        {/* Student assignment */}
        {selectedCourseId && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: 0 }}>Assign to Students</h2>
              <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                {assignToAll || selectedStudentIds.size === students.length
                  ? 'All students'
                  : `${selectedStudentIds.size} of ${students.length} selected`}
              </span>
            </div>
            {students.length === 0 ? (
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: 0 }}>
                No students found for this course. Students are matched by their Course ID in their profile.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* Select All toggle */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  background: allSelected ? 'var(--plum)' : 'var(--gray-light)',
                  color: allSelected ? 'white' : 'var(--gray-dark)',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  border: `1px solid ${allSelected ? 'var(--plum)' : 'var(--gray-light)'}`,
                  userSelect: 'none'
                }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ display: 'none' }}/>
                  {allSelected ? '✓ ' : ''}All Students
                </label>
                {/* Individual student chips */}
                {students.map(s => {
                  const checked = selectedStudentIds.has(s.userId)
                  return (
                    <label key={s.userId} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      background: checked ? 'var(--plum-light)' : 'white',
                      color: checked ? 'var(--plum)' : 'var(--gray-dark)',
                      padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                      border: `1px solid ${checked ? 'var(--plum-mid)' : 'var(--gray-light)'}`,
                      userSelect: 'none'
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.userId)} style={{ display: 'none' }}/>
                      {checked ? '✓ ' : ''}{s.firstName} {s.lastName}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Day rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {days.map((day, i) => (
            <div key={day.day} style={{ background: day.isInClass ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${day.isInClass ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '20px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{day.day}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={day.isInClass} onChange={e => updateDay(i, 'isInClass', e.target.checked)}/>
                  In-class assignment
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'start' }}>
                <div>
                  <select value={day.lessonTemplateId} onChange={e => selectLesson(i, e.target.value)}
                    disabled={!selectedCourseId}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="">Select lesson...</option>
                    {lessonTemplates.map(t => <option key={t.id} value={t.id}>Lesson {t.lessonNumber} — {t.title}</option>)}
                  </select>
                  {day.lessonTemplateId && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 500, color: day.videoUrl ? '#059669' : '#B45309' }}>
                      {day.videoUrl ? '✓ Video attached' : '⚠ No video for this lesson'}
                    </div>
                  )}
                  {day.lessonTemplateId && (
                    <LessonModeNote template={lessonTemplates.find(t => t.id === day.lessonTemplateId)} courseId={selectedCourseId} />
                  )}
                  <textarea
                    value={day.instructions}
                    onChange={e => updateDay(i, 'instructions', e.target.value)}
                    rows={2}
                    placeholder="Instructions for students..."
                    style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <input type="date" value={day.dueDate} onChange={e => updateDay(i, 'dueDate', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                </div>
                <div>
                  <input type="time" value={day.dueTime} onChange={e => updateDay(i, 'dueTime', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer', paddingTop: '10px' }}>
                  <input type="checkbox" checked={day.isPublished} onChange={e => updateDay(i, 'isPublished', e.target.checked)}/>
                  Publish
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Additional assignments — beyond the Mon–Fri grid, due on chosen dates */}
        {extras.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            {extras.map((extra, i) => (
              <div key={i} style={{ background: 'var(--background)', border: '1px dashed var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--plum)' }}>
                    Additional Assignment{extras.length > 1 ? ` ${i + 1}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={extra.isInClass} onChange={e => updateExtra(i, 'isInClass', e.target.checked)}/>
                      In-class assignment
                    </label>
                    <button onClick={() => removeExtra(i)} title="Remove this assignment"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'start' }}>
                  <div>
                    <select value={extra.lessonTemplateId} onChange={e => selectExtraLesson(i, e.target.value)}
                      disabled={!selectedCourseId}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                      <option value="">Select lesson...</option>
                      {lessonTemplates.map(t => <option key={t.id} value={t.id}>Lesson {t.lessonNumber} — {t.title}</option>)}
                    </select>
                    {extra.lessonTemplateId && (
                      <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 500, color: extra.videoUrl ? '#059669' : '#B45309' }}>
                        {extra.videoUrl ? '✓ Video attached' : '⚠ No video for this lesson'}
                      </div>
                    )}
                    {extra.lessonTemplateId && (
                      <LessonModeNote template={lessonTemplates.find(t => t.id === extra.lessonTemplateId)} courseId={selectedCourseId} />
                    )}
                    <textarea
                      value={extra.instructions}
                      onChange={e => updateExtra(i, 'instructions', e.target.value)}
                      rows={2}
                      placeholder="Instructions for students..."
                      style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <input type="date" value={extra.dueDate} onChange={e => updateExtra(i, 'dueDate', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${extra.lessonNumber && !extra.dueDate ? '#f59e0b' : 'var(--gray-light)'}`, borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                    {extra.lessonNumber && !extra.dueDate && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#B45309' }}>Pick a due date</div>
                    )}
                  </div>
                  <div>
                    <input type="time" value={extra.dueTime} onChange={e => updateExtra(i, 'dueTime', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer', paddingTop: '10px' }}>
                    <input type="checkbox" checked={extra.isPublished} onChange={e => updateExtra(i, 'isPublished', e.target.checked)}/>
                    Publish
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add additional work */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={addExtra}
            style={{ background: 'transparent', color: 'var(--plum)', border: '1px dashed var(--plum-mid)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            + Add Additional Work
          </button>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={saveSchedule} disabled={saving || !selectedCourseId || !weekStartDate}
            style={{ background: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-light)' : 'var(--plum)', color: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
            {saving ? 'Saving...' : 'Save Week Schedule'}
          </button>
          <button
            onClick={() => {
              const hasWork = [...days, ...extras].some(d => d.lessonTemplateId || d.instructions)
              if (!hasWork || window.confirm('Clear every day and start this week over?')) resetWeek()
            }}
            disabled={saving}
            style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Start Over
          </button>
          {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>✓ Saved! Redirecting...</span>}
          {saveError && <span style={{ color: '#dc2626', fontSize: '14px' }}>Error: {saveError}</span>}
        </div>
      </main>
    </div>
  )
}

export default function ScheduleWeek() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', fontFamily: 'var(--font-body)' }}>Loading...</div>}>
      <ScheduleWeekInner />
    </Suspense>
  )
}
