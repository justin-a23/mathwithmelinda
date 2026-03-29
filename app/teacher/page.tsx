'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../src/graphql/queries'
import ThemeToggle from '../components/ThemeToggle'
import { useRoleGuard } from '../hooks/useRoleGuard'

const client = generateClient()

const getTeacherProfileQuery = /* GraphQL */`
  query GetTeacherProfile($userId: String!) {
    listTeacherProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items {
        id
        displayName
        profilePictureKey
      }
    }
  }
`

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

const listUnreadMessagesQuery = /* GraphQL */`
  query ListUnreadMessages {
    listMessages(filter: { isRead: { eq: false } }, limit: 200) {
      items { id isRead }
    }
  }
`

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

// Named component — avoids Turbopack IIFE issues
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
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', gradeLevel: '' })
  const [saving, setSaving] = useState(false)
  const [weekStats, setWeekStats] = useState<CourseWeekStats[]>([])
  const [totalUngraded, setTotalUngraded] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [teacherPicUrl, setTeacherPicUrl] = useState<string | null>(null)
  const [teacherDisplayName, setTeacherDisplayName] = useState('')
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    fetchCourses()
    fetchWeekStats()
    fetchUnreadMessages()
  }, [])

  useEffect(() => {
    const userId = user?.userId || user?.username || ''
    if (!userId) return
    async function loadTeacherProfile() {
      try {
        const result = await client.graphql({ query: getTeacherProfileQuery, variables: { userId } }) as any
        const items = result.data.listTeacherProfiles.items
        if (items.length > 0) {
          const p = items[0]
          if (p.displayName) setTeacherDisplayName(p.displayName)
          if (p.profilePictureKey) {
            const res = await fetch('/api/profile-pic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'view', key: p.profilePictureKey }),
            })
            const { url } = await res.json()
            setTeacherPicUrl(url)
          }
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err)
      }
    }
    loadTeacherProfile()
  }, [user?.userId, user?.username])

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

      // Count all ungraded submissions across all time (not just this week)
      const ungraded = allSubs.filter(s =>
        !s.isArchived && !s.grade && s.status !== 'returned'
      ).length
      setTotalUngraded(ungraded)
    } catch (err) {
      console.error('Error fetching week stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  async function fetchUnreadMessages() {
    try {
      const result = await (client.graphql({ query: listUnreadMessagesQuery }) as any)
      const items = result.data.listMessages.items
      setUnreadMessageCount(items.length)
    } catch (err) {
      console.error('Error fetching unread messages:', err)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <button
            onClick={() => router.push('/teacher/profile')}
            title={teacherDisplayName || 'My Profile'}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {teacherPicUrl ? (
                <img src={teacherPicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)' }}>
                    {teacherDisplayName ? teacherDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'M'}
                  </span>
                </div>
              )}
            </div>
            {teacherDisplayName && (
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>{teacherDisplayName.split(' ')[0]}</span>
            )}
          </button>
          <button onClick={async () => { await signOut(); router.replace('/login') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Teacher Dashboard</h1>
          <p style={{ color: 'var(--gray-mid)', marginBottom: '28px' }}>Manage your courses, lessons and students.</p>

          {/* Action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>

            {/* Grade Work — highlighted when ungraded work exists */}
            <button onClick={() => router.push('/teacher/grades')} style={{
              background: totalUngraded > 0 ? 'var(--plum)' : 'var(--background)',
              color: totalUngraded > 0 ? 'white' : 'var(--foreground)',
              border: `1px solid ${totalUngraded > 0 ? 'var(--plum)' : 'var(--gray-light)'}`,
              borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '8px', transition: 'box-shadow 0.15s',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Grade Work</div>
                <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>
                  {totalUngraded > 0 ? `${totalUngraded} pending` : 'All caught up'}
                </div>
              </div>
            </button>

            {/* Gradebook */}
            <button onClick={() => router.push('/teacher/gradebook')} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Gradebook</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>All student grades</div>
              </div>
            </button>

            {/* Assigned Work */}
            <button onClick={() => router.push('/teacher/plans')} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Assigned Work</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Weekly plans</div>
              </div>
            </button>

            {/* Students */}
            <button onClick={() => router.push('/teacher/students')} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Students</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Manage roster</div>
              </div>
            </button>

            {/* Semesters */}
            <button onClick={() => router.push('/teacher/semesters')} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Terms</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Grade weights & cutoffs</div>
              </div>
            </button>

            {/* Upload Video */}
            <button onClick={() => router.push('/teacher/upload')} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Upload Video</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Add lesson videos</div>
              </div>
            </button>

            {/* Messages */}
            <button onClick={() => router.push('/teacher/messages')} style={{
              background: unreadMessageCount > 0 ? 'var(--background)' : 'var(--background)',
              color: 'var(--foreground)',
              border: `1px solid ${unreadMessageCount > 0 ? 'var(--plum)' : 'var(--gray-light)'}`,
              borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Messages</span>
                  {unreadMessageCount > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px' }}>
                      {unreadMessageCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Student questions</div>
              </div>
            </button>

            {/* Add Course */}
            <button onClick={() => setShowAddCourse(true)} style={{
              background: 'var(--background)', color: 'var(--foreground)',
              border: '1px dashed var(--gray-light)', borderRadius: '12px', padding: '20px 16px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Add Course</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Create new course</div>
              </div>
            </button>

          </div>
        </div>

        {/* ── THIS WEEK ── */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: '48px' }}>
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
                    {/* Course name */}
                    <span style={{ width: '160px', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', lineHeight: 1.2 }}>
                      {course.title}
                    </span>

                    {/* Full-width bar */}
                    <GradingBar graded={graded} received={received} />

                    {/* Stats */}
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
        <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>
          Your Courses
        </h2>

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

                  {/* Text section grows to fill — this pushes bar + buttons to the same position in every card */}
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

                  {/* Bar — always rendered at same position, just invisible when no data */}
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
