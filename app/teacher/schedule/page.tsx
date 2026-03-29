'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses, listLessonTemplates, listStudentProfiles } from '../../../src/graphql/queries'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }
type LessonTemplate = { id: string; lessonNumber: number; title: string; instructions: string | null; worksheetUrl: string | null; videoUrl: string | null }
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

function ScheduleWeekInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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
        const result = await client.graphql({
          query: listLessonTemplates,
          variables: { filter: { courseLessonTemplatesId: { eq: selectedCourseId } }, limit: 500 }
        })
        const sorted = (result.data.listLessonTemplates.items as LessonTemplate[])
          .sort((a, b) => a.lessonNumber - b.lessonNumber)
        setLessonTemplates(sorted)
      } catch (err) { console.error(err) }
    }

    async function fetchStudents() {
      try {
        const result = await client.graphql({
          query: listStudentProfiles,
          variables: { filter: { courseId: { eq: selectedCourseId } }, limit: 200 }
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
    const template = lessonTemplates.find(t => t.id === templateId)
    if (!template) return
    const updated = [...days]
    updated[dayIndex] = {
      ...updated[dayIndex],
      lessonTemplateId: templateId,
      lessonNumber: String(template.lessonNumber),
      lessonTitle: template.title,
      instructions: template.instructions || '',
      videoUrl: template.videoUrl || '',
    }
    setDays(updated)
  }

  function updateDay(index: number, field: keyof DayPlan, value: string | boolean) {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  async function saveSchedule() {
    if (!selectedCourseId || !weekStartDate) return
    setSaving(true)
    setSaveError('')
    try {
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

      for (const day of days) {
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
    }
  }

  const allSelected = students.length > 0 && selectedStudentIds.size === students.length

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/teacher')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '18px' }}>Schedule Week</span>
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>Teacher</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={() => router.push('/teacher/profile')} title="My Profile" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            My Profile
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Schedule a Week</h1>
        {selectedCourseName && (
          <p style={{ color: 'var(--plum)', fontWeight: 500, marginBottom: '4px', fontSize: '15px' }}>{selectedCourseName}</p>
        )}
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Select a week, assign students, then pick lessons for each day.</p>

        {/* Course selector — only shown if no courseId in URL */}
        {!preselectedCourseId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
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

        {/* Save */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={saveSchedule} disabled={saving || !selectedCourseId || !weekStartDate}
            style={{ background: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-light)' : 'var(--plum)', color: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
            {saving ? 'Saving...' : 'Save Week Schedule'}
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
