'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'

const client = generateClient()

type Course = {
  id: string
  title: string
  gradeLevel: string | null
}

type DayPlan = {
  day: string
  lessonNumber: string
  lessonTitle: string
  dueTime: string
  isPublished: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function ScheduleWeek() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [weekStartDate, setWeekStartDate] = useState<string>('')
  const [days, setDays] = useState<DayPlan[]>(
    DAYS.map(day => ({ day, lessonNumber: '', lessonTitle: '', dueTime: '17:00', isPublished: false }))
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
      } catch (err) {
        console.error(err)
      }
    }
    fetchCourses()
  }, [])

  function updateDay(index: number, field: keyof DayPlan, value: string | boolean) {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  async function saveSchedule() {
    if (!selectedCourse || !weekStartDate) return
    setSaving(true)
    try {
      const { createWeeklyPlan, createWeeklyPlanItem, createLesson } = await import('../../../src/graphql/mutations')
      
      const planResult = await client.graphql({
        query: createWeeklyPlan,
        variables: { input: { weekStartDate, courseWeeklyPlansId: selectedCourse } }
      })
      
      const planId = planResult.data.createWeeklyPlan.id

      for (const day of days) {
        if (!day.lessonNumber) continue

        const lessonResult = await client.graphql({
            query: createLesson,
            variables: { input: {
              title: day.lessonTitle || `Lesson ${day.lessonNumber}`,
              order: parseInt(day.lessonNumber),
              isPublished: day.isPublished,
              courseLessonsId: selectedCourse,
              videoUrl: ''
            }}
          })
          
          await client.graphql({
            query: createWeeklyPlanItem,
            variables: { input: {
              dayOfWeek: day.day,
              dueTime: day.dueTime,
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
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--white)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--charcoal)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--charcoal)', marginBottom: '8px' }}>Schedule a Week</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Plan lessons for each day of the week.</p>

        {/* Course + Week selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Select Course</label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Week Starting</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={e => setWeekStartDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        {/* Day rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {days.map((day, i) => (
            <div key={day.day} style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 120px 1fr 120px 100px', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--charcoal)' }}>{day.day}</div>
                <input
                  type="text"
                  placeholder="Lesson #"
                  value={day.lessonNumber}
                  onChange={e => updateDay(i, 'lessonNumber', e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                />
                <input
                  type="text"
                  placeholder="Lesson title"
                  value={day.lessonTitle}
                  onChange={e => updateDay(i, 'lessonTitle', e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                />
                <input
                  type="time"
                  value={day.dueTime}
                  onChange={e => updateDay(i, 'dueTime', e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={day.isPublished}
                    onChange={e => updateDay(i, 'isPublished', e.target.checked)}
                  />
                  Publish
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={saveSchedule}
            disabled={saving || !selectedCourse || !weekStartDate}
            style={{ background: saving || !selectedCourse || !weekStartDate ? 'var(--gray-light)' : 'var(--plum)', color: saving || !selectedCourse || !weekStartDate ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
            {saving ? 'Saving...' : 'Save Week Schedule'}
          </button>
          {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>Saved! Redirecting...</span>}
        </div>
      </main>
    </div>
  )
}