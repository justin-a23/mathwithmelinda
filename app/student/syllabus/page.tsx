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
      items { id firstName lastName courseId }
    }
  }
`

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 200) {
      items {
        id name startDate endDate isActive courseId
        course { id title }
      }
    }
  }
`

const LIST_SYLLABUS_FOR_SEMESTER = /* GraphQL */ `
  query ListSyllabusForSemester($semesterId: String!) {
    listSyllabi(filter: { semesterId: { eq: $semesterId } }, limit: 1) {
      items { id publishedSections publishedAt }
    }
  }
`

type Section = { id: string; heading: string; body: string }

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
  course: { id: string; title: string } | null
}

function formatPublished(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  return `${new Date(start).toLocaleDateString('en-US', opts)} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

export default function StudentSyllabusPage() {
  const { user, authStatus } = useAuthenticator()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [courseTitle, setCourseTitle] = useState('')
  const [semesterName, setSemesterName] = useState('')
  const [semesterDates, setSemesterDates] = useState('')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [noSyllabus, setNoSyllabus] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/login')
  }, [authStatus, router])

  useEffect(() => {
    const userId = user?.userId || user?.username || ''
    if (!userId) return
    loadSyllabus(userId)
  }, [user?.userId])

  async function loadSyllabus(userId: string) {
    setLoading(true)
    try {
      // 1. Get student profile → courseId
      const profileRes = await (client.graphql({
        query: GET_STUDENT_PROFILE,
        variables: { userId },
      }) as any)
      const profiles = profileRes.data.listStudentProfiles.items
      if (!profiles.length) { setNoSyllabus(true); setLoading(false); return }
      const profile = profiles[0]
      if (!profile.courseId) { setNoSyllabus(true); setLoading(false); return }

      // 2. Get semesters for this course → find active or most recent
      const semRes = await (client.graphql({
        query: LIST_SEMESTERS,
      }) as any)
      const allSems: Semester[] = semRes.data.listSemesters.items
      const sems = allSems.filter(s => s.courseId === profile.courseId)
      const sorted = [...sems].sort((a, b) => b.startDate.localeCompare(a.startDate))
      const active = sorted.find(s => s.isActive) || sorted[0]
      if (!active) { setNoSyllabus(true); setLoading(false); return }

      setCourseTitle(active.course?.title ?? '')
      setSemesterName(active.name)
      if (active.startDate && active.endDate) {
        setSemesterDates(formatDateRange(active.startDate, active.endDate))
      }

      // 3. Get published syllabus for this semester
      const sylRes = await (client.graphql({
        query: LIST_SYLLABUS_FOR_SEMESTER,
        variables: { semesterId: active.id },
      }) as any)
      const syllabi = sylRes.data.listSyllabi.items
      if (!syllabi.length || !syllabi[0].publishedSections) {
        setNoSyllabus(true)
        setLoading(false)
        return
      }
      const syl = syllabi[0]
      setPublishedAt(syl.publishedAt)
      try { setSections(JSON.parse(syl.publishedSections)) } catch { setSections([]) }
    } catch (err) {
      console.error('Error loading syllabus:', err)
      setNoSyllabus(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Nav */}
      <nav style={{
        background: 'var(--nav-bg)',
        padding: '0 48px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white" />
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <button
            onClick={() => router.push('/student/grades')}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Grades
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '80px 0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading…
          </div>
        ) : noSyllabus ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--foreground)', marginBottom: '10px' }}>
              No syllabus yet
            </h2>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto' }}>
              Your teacher hasn't published a syllabus for your current course yet. Check back soon.
            </p>
          </div>
        ) : (
          /* ── Document view ── */
          <div style={{
            background: 'var(--background)',
            border: '1px solid var(--gray-light)',
            borderRadius: '16px',
            padding: '48px 56px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Document header */}
            <div style={{ marginBottom: '40px', paddingBottom: '28px', borderBottom: '2px solid var(--plum)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Course Syllabus
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--foreground)', margin: '0 0 8px 0', lineHeight: 1.2 }}>
                {courseTitle}
              </h1>
              <div style={{ fontSize: '15px', color: 'var(--gray-mid)', marginBottom: '18px' }}>
                {semesterName}{semesterDates ? ` · ${semesterDates}` : ''}
              </div>
              {publishedAt && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: '20px',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Published {formatPublished(publishedAt)}
                </div>
              )}
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              {sections.map((sec, i) => (
                <div key={sec.id || i}>
                  {sec.heading && (
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '22px',
                      color: 'var(--foreground)',
                      margin: '0 0 12px 0',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--gray-light)',
                    }}>
                      {sec.heading}
                    </h2>
                  )}
                  {sec.body && (
                    <p style={{
                      fontSize: '15px',
                      color: 'var(--foreground)',
                      lineHeight: '1.8',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {sec.body}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '1px solid var(--gray-light)',
              fontSize: '12px',
              color: 'var(--gray-mid)',
              textAlign: 'center',
              lineHeight: '1.6',
            }}>
              Questions about this syllabus? Send Melinda a message from your{' '}
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'var(--plum)', cursor: 'pointer', fontSize: '12px', padding: 0, textDecoration: 'underline' }}>
                dashboard
              </button>.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
