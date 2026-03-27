'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses, listLessonTemplates } from '../../../src/graphql/queries'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }
type LessonTemplate = { id: string; lessonNumber: number; title: string; instructions: string | null; worksheetUrl: string | null; videoUrl: string | null }

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

function getDefaultDueTime(day: string): string {
  if (day === 'Friday') return '17:00'
  if (day === 'Monday' || day === 'Tuesday') return '17:00'
  if (day === 'Wednesday' || day === 'Thursday') return '17:00'
  return '17:00'
}

export default function ScheduleWeek() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [lessonTemplates, setLessonTemplates] = useState<LessonTemplate[]>([])
  const [weekStartDate, setWeekStartDate] = useState('')
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

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    async function fetchCourses() {
      try {
        const result = await client.graphql({ query: listCourses })
        setCourses(result.data.listCourses.items as Course[])
      } catch (err) { console.error(err) }
    }
    fetchCourses()
  }, [])

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
    fetchLessons()
  }, [selectedCourseId])

  useEffect(() => {
    if (!weekStartDate) return
    setDays(prev => prev.map(day => ({
      ...day,
      dueDate: getDefaultDueDate(day.day, weekStartDate)
    })))
  }, [weekStartDate])

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
    try {
      const { createWeeklyPlan, createWeeklyPlanItem, createLesson } = await import('../../../src/graphql/mutations')

      const planResult = await client.graphql({
        query: createWeeklyPlan,
        variables: { input: { weekStartDate, courseWeeklyPlansId: selectedCourseId } }
      })
      const planId = planResult.data.createWeeklyPlan.id

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
        await client.graphql({
          query: createWeeklyPlanItem,
          variables: { input: {
            dayOfWeek: day.day,
            dueTime: `${day.dueDate}T${day.dueTime}`,
            isPublished: day.isPublished,
            weeklyPlanItemsId: planId,
            lessonWeeklyPlanItemsId: lessonResult.data.createLesson.id
          }}
        })
      }
      setSaved(true)
      setTimeout(() => router.push('/teacher'), 1500)
    } catch (err) {
      console.error('Error saving schedule:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', marginLeft: '8px' }}>Teacher</span>
        </div>
        <button onClick={() => router.push('/teacher')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ← Back
        </button>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Schedule a Week</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Select a course and week, then pick lessons for each day.</p>

        {/* Course + Week */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Week Starting (Monday)</label>
            <input type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
          </div>
        </div>

        {/* Day rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {days.map((day, i) => (
            <div key={day.day} style={{ background: day.isInClass ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${day.isInClass ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '20px' }}>
              
              {/* Day header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{day.day}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={day.isInClass} onChange={e => updateDay(i, 'isInClass', e.target.checked)}/>
                  In-class assignment
                </label>
              </div>

              {/* Lesson selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'start' }}>
                <div>
                  <select value={day.lessonTemplateId} onChange={e => selectLesson(i, e.target.value)}
                    disabled={!selectedCourseId}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="">Select lesson...</option>
                    {lessonTemplates.map(t => <option key={t.id} value={t.id}>Lesson {t.lessonNumber} — {t.title}</option>)}
                  </select>
                  {day.lessonTemplateId && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 500, color: day.videoUrl ? '#059669' : '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {day.videoUrl ? '✓ Video attached' : '⚠ No video for this lesson'}
                    </div>
                  )}
                  {day.instructions !== undefined && (
                   <textarea
                    value={day.instructions}
                    onChange={e => updateDay(i, 'instructions', e.target.value)}
                    rows={3}
                    placeholder="Instructions for students..."
                     style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                   />
                )}
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
          {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>Saved! Redirecting...</span>}
        </div>
      </main>
    </div>
  )
}