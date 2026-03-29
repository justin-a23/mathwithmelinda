'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../src/graphql/queries'
import TeacherNav from '../components/TeacherNav'
import { useRoleGuard } from '../hooks/useRoleGuard'

const client = generateClient()

type Course = {
  id: string
  title: string
  description: string | null
  gradeLevel: string | null
  isArchived: boolean | null
}

type CourseWeekStats = {
  courseId: string
  received: number
  graded: number
}

const listRecentSubmissionsQuery = /* GraphQL */`
  query ListRecentSubmissions {
    listSubmissions(limit: 500) {
      items {
        id
        content
        grade
        status
        submittedAt
        isArchived
      }
    }
  }
`

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekRange(monday: Date): string {
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return monday.toLocaleDateString('en-US', opts) + ' – ' + friday.toLocaleDateString('en-US', opts)
}

function GradingBar({ graded, received }: { graded: number; received: number }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  const pct = received > 0 ? (graded / received) * 100 : 0
  const allDone = received > 0 && graded >= received

  return (
    <div style={{
      position: 'relative',
      height: '12px',
      borderRadius: '6px',
      background: received > 0 ? 'rgba(164,120,200,0.18)' : 'var(--gray-light)',
      overflow: 'hidden',
      flex: 1,
    }}>
      {received > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: ready ? pct + '%' : '0%',
          background: allDone ? '#22c55e' : 'var(--plum)',
          borderRadius: '6px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', gradeLevel: '' })
  const [saving, setSaving] = useState(false)
  const [weekStats, setWeekStats] = useState<CourseWeekStats[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
    fetchWeekStats()
  }, [])

  async function fetchCourses() {
    try {
      const result = await client.graphql({ query: listCourses })
      setCourses(result.data.listCourses.items as Course[])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeekStats() {
    try {
      const monday = getMonday(new Date())
      const weekStartMs = monday.getTime()

      const result = await (client.graphql({ query: listRecentSubmissionsQuery }) as any)
      const allSubs = result.data.listSubmissions.items as {
        id: string
        content: string | null
        grade: string | null
        status: string | null
        submittedAt: string | null
        isArchived: boolean | null
      }[]

      const byCourse: Record<string, { received: number; graded: number }> = {}

      for (const sub of allSubs) {
        if (sub.isArchived) continue
        if (!sub.submittedAt) continue
        if (new Date(sub.submittedAt).getTime() < weekStartMs) continue

        let courseId = ''
        try {
          const parsed = JSON.parse(sub.content || '{}')
          courseId = parsed.courseId || ''
        } catch { continue }

        if (!courseId) continue
        if (!byCourse[courseId]) byCourse[courseId] = { received: 0, graded: 0 }
        byCourse[courseId].received += 1
        if (sub.grade) byCourse[courseId].graded += 1
      }

      setWeekStats(
        Object.entries(byCourse).map(([courseId, data]) => ({ courseId, ...data }))
      )
    } catch (err) {
      console.error('Error fetching week stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  async function addCourse() {
    if (!newCourse.title) return
    setSaving(true)
    try {
      const { createCourse } = await import('../../src/graphql/mutations')
      await client.graphql({ query: createCourse, variables: { input: newCourse } })
      setNewCourse({ title: '', description: '', gradeLevel: '' })
      setShowAddCourse(false)
      fetchCourses()
    } catch (err) {
      console.error('Error creating course:', err)
    } finally {
      setSaving(false)
    }
  }

  const monday = getMonday(new Date())
  const weekRangeLabel = formatWeekRange(monday)
  const activeCourses = courses.filter(c => !c.isArchived)

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* ── THIS WEEK ── */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
              This Week's Grading
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{weekRangeLabel}</span>
          </div>

          {loading || statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '160px', height: '16px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--gray-light)' }} />
                  <div style={{ width: '140px', height: '14px', borderRadius: '4px', background: 'var(--gray-light)' }} />
                </div>
              ))}
            </div>
          ) : activeCourses.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>No active courses.</p>
          ) : (
            <div>
              {activeCourses.map((course, idx) => {
                const stat = weekStats.find(s => s.courseId === course.id)
                const received = stat?.received ?? 0
                const graded = stat?.graded ?? 0
                const pct = received > 0 ? Math.round((graded / received) * 100) : null
                const allDone = pct === 100
                const isLast = idx === activeCourses.length - 1

                return (
                  <div key={course.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--gray-light)',
                  }}>
                    <span style={{ width: '160px', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', lineHeight: 1.2 }}>
                      {course.title}
                    </span>
                    <GradingBar graded={graded} received={received} />
                    <div style={{ width: '200px', flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {received > 0 ? (
                        <>
                          <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                            <span style={{ fontWeight: 600, color: allDone ? '#16a34a' : 'var(--foreground)' }}>{graded}</span>
                            {' of '}
                            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{received}</span>
                            {' graded'}
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: 700,
                            color: allDone ? '#16a34a' : 'var(--plum)',
                            background: allDone ? '#dcfce7' : 'var(--plum-light)',
                            padding: '2px 8px', borderRadius: '20px',
                          }}>
                            {allDone ? '✓ Done' : pct + '%'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--gray-light)', fontStyle: 'italic' }}>
                          No submissions yet
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Course form */}
        {showAddCourse && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '20px' }}>New Course</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course Title</label>
                <input type="text" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. Algebra 2"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input type="text" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Short description"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Grade Level</label>
                <input type="text" value={newCourse.gradeLevel} onChange={e => setNewCourse({ ...newCourse, gradeLevel: e.target.value })} placeholder="e.g. 10"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={addCourse} disabled={saving}
                style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                {saving ? 'Saving...' : 'Save Course'}
              </button>
              <button onClick={() => setShowAddCourse(false)}
                style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── COURSES ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', margin: 0 }}>
            Your Courses
          </h2>
          <button
            onClick={() => setShowAddCourse(true)}
            style={{ background: 'var(--background)', color: 'var(--gray-dark)', border: '1px dashed var(--gray-light)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Course
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading courses...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {activeCourses.map(course => {
              const stat = weekStats.find(s => s.courseId === course.id)
              const received = stat?.received ?? 0
              const graded = stat?.graded ?? 0
              const pct = received > 0 ? Math.round((graded / received) * 100) : null
              const allDone = pct === 100

              return (
                <div key={course.id}
                  style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,79,166,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)' }}>{course.title}</div>
                      {pct !== null && (
                        <span style={{
                          fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', flexShrink: 0, marginLeft: '8px',
                          background: allDone ? '#dcfce7' : 'var(--plum-light)',
                          color: allDone ? '#16a34a' : 'var(--plum)',
                        }}>
                          {allDone ? '✓' : pct + '%'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '4px' }}>{course.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>Grade {course.gradeLevel}</div>
                  </div>

                  <div style={{ height: '12px', margin: '16px 0' }}>
                    {received > 0 && <GradingBar graded={graded} received={received} />}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => router.push('/teacher/library/' + course.id)}
                      style={{ background: 'var(--plum)', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                      Manage Lessons
                    </button>
                    <button onClick={() => router.push('/teacher/schedule?courseId=' + course.id)}
                      style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                      Schedule Week
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
