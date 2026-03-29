'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'
const findPlanItemByLessonQuery = /* GraphQL */`
  query FindPlanItemByLesson($filter: ModelWeeklyPlanItemFilterInput) {
    listWeeklyPlanItems(filter: $filter, limit: 1) {
      items { id }
    }
  }
`

const listWeeklyPlansWithItems = /* GraphQL */`
  query ListWeeklyPlansWithItems {
    listWeeklyPlans(limit: 500) {
      items {
        id
        weekStartDate
        assignedStudentIds
        course {
          id
          title
        }
        items {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            lesson {
              id
              title
              videoUrl
              order
            }
          }
        }
      }
    }
  }
`

const client = generateClient()

type ReturnedSubmission = {
  id: string
  lessonTitle: string
  courseTitle: string
  returnReason: string
  returnDueDate: string
  itemId: string
}

const listMySubmissionsQuery = /* GraphQL */`
  query ListMySubmissions($studentId: String!) {
    listSubmissions(filter: { studentId: { eq: $studentId } }, limit: 500) {
      items {
        id
        content
        status
        returnReason
        returnDueDate
        submittedAt
      }
    }
  }
`

const getStudentProfileQuery = /* GraphQL */`
  query GetStudentProfileByUser($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items {
        id
        firstName
        lastName
        preferredName
        profilePictureKey
        status
        courseId
      }
    }
  }
`

function getDueStatus(weekStartDate: string, dayOfWeek: string, dueTime: string | null): 'overdue' | 'due-today' | null {
  if (!dueTime) return null
  const now = new Date()
  let dueDate: Date

  if (dueTime.includes('T') && dueTime.length > 10) {
    dueDate = new Date(dueTime)
  } else {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const offset = days.indexOf(dayOfWeek)
    const base = new Date(weekStartDate + 'T00:00:00')
    if (offset >= 0) base.setDate(base.getDate() + offset)
    const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
    const y = base.getFullYear()
    const mo = String(base.getMonth() + 1).padStart(2, '0')
    const d = String(base.getDate()).padStart(2, '0')
    dueDate = new Date(`${y}-${mo}-${d}T${timePart}`)
  }

  if (isNaN(dueDate.getTime())) return null
  if (dueDate < now) return 'overdue'
  if (dueDate.toDateString() === now.toDateString()) return 'due-today'
  return null
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxSize = 200
      let w = img.width
      let h = img.height
      if (w > h) {
        if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize }
      } else {
        if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Compression failed'))
      }, 'image/jpeg', 0.75)
    }
    img.onerror = reject
    img.src = url
  })
}

type WeeklyPlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  lesson?: {
    id: string
    title: string
    videoUrl: string | null
    order: number | null
  } | null
}

type WeeklyPlan = {
  id: string
  weekStartDate: string
  assignedStudentIds?: string | null
  course?: {
    id: string
    title: string
  } | null
  items?: {
    items: WeeklyPlanItem[]
  } | null
}

export default function Dashboard() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([])
  const [loading, setLoading] = useState(true)
  useTheme() // keeps dark mode active via ThemeProvider context

  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profilePicKey, setProfilePicKey] = useState<string | null>(null)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submittedLessonIds, setSubmittedLessonIds] = useState<Set<string>>(new Set())
  const [returnedSubmissions, setReturnedSubmissions] = useState<ReturnedSubmission[]>([])

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    const userId = user?.userId || user?.username || ''
    const loginId = user?.signInDetails?.loginId || ''
    if (!userId) return

    async function loadDashboard() {
      try {
        // 1. Fetch profile first — we need courseId before we can filter plans
        const profileResult = await client.graphql({ query: getStudentProfileQuery, variables: { userId } }) as any
        const profileItems = profileResult.data.listStudentProfiles.items
        let studentCourseId = ''

        if (profileItems.length > 0) {
          const p = profileItems[0]
          if (p.status === 'removed') { signOut(); return }
          setProfileId(p.id)
          setProfileName((p.preferredName || p.firstName) + ' ' + p.lastName)
          studentCourseId = p.courseId || ''
          if (p.profilePictureKey) {
            setProfilePicKey(p.profilePictureKey)
            const res = await fetch('/api/profile-pic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'view', key: p.profilePictureKey })
            })
            const { url } = await res.json()
            setProfilePicUrl(url)
          }
        } else if (loginId) {
          setProfileName(loginId.split('@')[0])
        }

        // 2. Fetch plans + submissions in parallel, now that we have courseId
        const studentId = loginId || userId
        const [plansResult, subsResult] = await Promise.all([
          client.graphql({ query: listWeeklyPlansWithItems, variables: {} }) as any,
          client.graphql({ query: listMySubmissionsQuery, variables: { studentId } }) as any,
        ])

        // Filter plans: must match enrolled course AND be within date window
        const allPlans = plansResult.data.listWeeklyPlans.items as WeeklyPlan[]
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const fourWeeksAhead = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
        const relevant = allPlans
          .filter(p => {
            const d = new Date(p.weekStartDate + 'T00:00:00')
            if (d < weekAgo || d > fourWeeksAhead) return false
            // Only show plans for the student's enrolled course
            if (studentCourseId && p.course?.id !== studentCourseId) return false
            // Within their course: null/empty assignedStudentIds = all enrolled students
            if (!p.assignedStudentIds) return true
            try {
              const ids: string[] = JSON.parse(p.assignedStudentIds)
              return ids.length === 0 || ids.includes(userId)
            } catch { return true }
          })
          .sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime())
        setWeeklyPlans(relevant)

        // Build submitted lesson IDs — include returned ones so they stay hidden from the
        // weekly schedule (students reach them via the "Needs Revision" banner button)
        const subItems = subsResult.data.listSubmissions.items as { id: string; content: string | null; status?: string | null; returnReason?: string | null; returnDueDate?: string | null; submittedAt?: string | null }[]
        const lessonIds = new Set<string>()
        for (const sub of subItems) {
          try {
            const parsed = JSON.parse(sub.content || '{}')
            if (parsed.lessonId) lessonIds.add(parsed.lessonId)
          } catch { /* skip */ }
        }
        setSubmittedLessonIds(lessonIds)

        // Build a lessonId → weeklyPlanItemId map from ALL plans (not just recent ones)
        // so older returned submissions can still resolve their item ID
        const lessonToItemId: Record<string, string> = {}
        for (const plan of allPlans) {
          for (const item of plan.items?.items || []) {
            if (item.lesson?.id) lessonToItemId[item.lesson.id] = item.id
          }
        }

        // Find returned submissions and parse their lesson info
        const returned: ReturnedSubmission[] = []
        for (const sub of subItems) {
          if (sub.status === 'returned') {
            try {
              const c = JSON.parse(sub.content || '{}')
              let itemId = c.weeklyPlanItemId || lessonToItemId[c.lessonId] || ''

              // Last-resort: query AppSync directly if both lookups failed
              if (!itemId && c.lessonId) {
                try {
                  const r = await (client.graphql({
                    query: findPlanItemByLessonQuery,
                    variables: { filter: { lessonWeeklyPlanItemsId: { eq: c.lessonId } } }
                  }) as any)
                  itemId = r.data?.listWeeklyPlanItems?.items?.[0]?.id || ''
                } catch { /* ignore */ }
              }

              returned.push({
                id: sub.id,
                lessonTitle: c.lessonTitle || 'Assignment',
                courseTitle: c.courseTitle || '',
                returnReason: sub.returnReason || '',
                returnDueDate: sub.returnDueDate || '',
                itemId,
              })
            } catch { /* skip */ }
          }
        }
        setReturnedSubmissions(returned)
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user?.userId, user?.username])

  async function handlePicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profileId) return
    setUploadingPic(true)
    try {
      const userId = user?.userId || user?.username || ''
      // 1. Get presigned upload URL
      const res = await fetch('/api/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', userId })
      })
      const { signedUrl, key } = await res.json()

      // 2. Compress image client-side
      const compressed = await compressImage(file)

      // 3. Upload to S3
      await fetch(signedUrl, {
        method: 'PUT',
        body: compressed,
        headers: { 'Content-Type': 'image/jpeg' }
      })

      // 4. Save key to StudentProfile
      const { updateStudentProfile } = await import('../../src/graphql/mutations')
      await client.graphql({
        query: updateStudentProfile,
        variables: { input: { id: profileId, profilePictureKey: key } }
      })

      setProfilePicKey(key)
      const viewRes = await fetch('/api/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', key })
      })
      const { url } = await viewRes.json()
      setProfilePicUrl(url)
    } catch (err) {
      console.error('Error uploading profile pic:', err)
    } finally {
      setUploadingPic(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) // used in subtitle only

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
        </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{user?.signInDetails?.loginId}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => router.push('/student/submissions')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                My Work
              </button>
              <button onClick={() => router.push('/student/grades')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                My Grades
              </button>
              <button onClick={() => router.push('/profile')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                My Profile
              </button>
              <ThemeToggle />
              <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                Sign out
              </button>
            </div>
        </div>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => !uploadingPic && fileInputRef.current?.click()}
              title="Click to update photo"
              style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '3px solid var(--plum-mid)', position: 'relative' }}>
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--plum)' }}>
                    {profileName ? profileName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '?'}
                  </span>
                </div>
              )}
              {/* Hover overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploadingPic ? 1 : 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => { if (!uploadingPic) e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { if (!uploadingPic) e.currentTarget.style.opacity = '0' }}>
                <span style={{ fontSize: '11px', color: 'white', fontWeight: 600, textAlign: 'center' }}>
                  {uploadingPic ? 'Uploading...' : 'Change\nPhoto'}
                </span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicUpload} style={{ display: 'none' }} />
          </div>

          {/* Name + greeting */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
              {profileName ? 'Welcome back, ' + profileName.split(' ')[0] + '!' : 'Welcome back!'}
            </h1>
            {/* Course pills — derived from assigned weekly plans */}
            {weeklyPlans.length > 0 && (() => {
              const courseNames = [...new Set(weeklyPlans.map(p => p.course?.title).filter(Boolean))] as string[]
              return courseNames.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {courseNames.map(name => (
                    <span key={name} style={{ background: 'var(--plum-light)', color: 'var(--plum)', fontSize: '12px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px', border: '1px solid var(--plum-mid)' }}>
                      {name}
                    </span>
                  ))}
                </div>
              ) : null
            })()}
            <p style={{ color: 'var(--gray-mid)', margin: 0 }}>Today is {today}. Here are your lessons.</p>
          </div>
        </div>

        {returnedSubmissions.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>↩</span> Needs Revision
            </h2>
            {returnedSubmissions.map(r => (
              <div key={r.id} style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#92400e', fontSize: '14px', marginBottom: '4px' }}>
                    {r.lessonTitle}{r.courseTitle ? ` · ${r.courseTitle}` : ''}
                  </div>
                  {r.returnReason && (
                    <div style={{ fontSize: '13px', color: '#78350f', marginBottom: r.returnDueDate ? '4px' : '0' }}>
                      <span style={{ fontWeight: 500 }}>Melinda&apos;s note: </span>{r.returnReason}
                    </div>
                  )}
                  {r.returnDueDate && (
                    <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
                      📅 New due date: {new Date(r.returnDueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                </div>
                {r.itemId ? (
                  <button
                    onClick={() => router.push(`/lessons?id=${r.itemId}`)}
                    style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Revise &amp; Resubmit
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic', flexShrink: 0, maxWidth: '140px', textAlign: 'right', lineHeight: '1.4' }}>
                    Find this lesson in your schedule below ↓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading your lessons...</p>
        ) : weeklyPlans.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)' }}>No lessons scheduled yet. Check back soon!</p>
        ) : (
          weeklyPlans.map((plan) => {
            const visibleItems = (plan.items?.items || [])
              .filter(item => item.isPublished && !(item.lesson?.id && submittedLessonIds.has(item.lesson.id)))
              .sort((a, b) => {
                const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek)
              })
            if (visibleItems.length === 0) return null
            return (
              <div key={plan.id} style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>
                  Week of {new Date(plan.weekStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {visibleItems.map((item) => {
                    let dueLabel = '5:00 PM'
                    if (item.dueTime) {
                      const t = item.dueTime.includes('T') ? item.dueTime.split('T')[1] : item.dueTime
                      const d = new Date('2000-01-01T' + t)
                      if (!isNaN(d.getTime())) dueLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    }

                    const dueStatus = getDueStatus(plan.weekStartDate, item.dayOfWeek, item.dueTime)
                    const isOverdue = dueStatus === 'overdue'
                    const isDueToday = dueStatus === 'due-today'

                    const cardBg = isOverdue ? 'var(--background)' : isDueToday ? 'var(--plum-light)' : 'var(--background)'
                    const cardBorder = isOverdue ? '#fca5a5' : isDueToday ? 'var(--plum-mid)' : 'var(--gray-light)'

                    return (
                      <div key={item.id}
                        onClick={() => router.push('/lessons?id=' + item.id)}
                        style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,79,166,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ textTransform: 'uppercase', letterSpacing: '1px', color: isOverdue ? '#b91c1c' : 'var(--plum)' }}>{item.dayOfWeek}</span>
                            {isOverdue && (
                              <span style={{ background: '#FEE2E2', color: '#b91c1c', fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', letterSpacing: '0.3px' }}>
                                Past Due
                              </span>
                            )}
                            {isDueToday && (
                              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', letterSpacing: '0.3px' }}>
                                Due Today
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>
                            {item.lesson?.order ? 'Lesson ' + item.lesson.order + ' — ' : ''}{item.lesson?.title || 'Lesson'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '12px', color: isOverdue ? '#b91c1c' : 'var(--gray-mid)', marginBottom: '8px' }}>
                            Due by {dueLabel}
                          </div>
                          <span style={{ background: isOverdue ? '#b91c1c' : 'var(--plum)', color: 'white', fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>
                            {isOverdue ? 'Submit Late →' : 'Watch →'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}