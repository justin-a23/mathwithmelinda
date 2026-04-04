'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import StudentNav from '../../components/StudentNav'

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

const LIST_ALL_SYLLABI = /* GraphQL */ `
  query ListAllSyllabi {
    listSyllabi(limit: 200) {
      items { semesterId pdfKey publishedPdfKey publishedAt }
    }
  }
`

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [semesterInfo, setSemesterInfo] = useState('')
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

      const courseTitle = active.course?.title ?? ''
      const dateRange = (active.startDate && active.endDate) ? formatDateRange(active.startDate, active.endDate) : ''
      setSemesterInfo([courseTitle, active.name, dateRange].filter(Boolean).join(' · '))

      // 3. Get published syllabus for this semester (fetch all, filter client-side)
      const sylRes = await (client.graphql({
        query: LIST_ALL_SYLLABI,
      }) as any)
      const allSyllabi = sylRes.data.listSyllabi.items
      const syllabi = allSyllabi.filter((s: any) => s.semesterId === active.id)
      if (!syllabi.length || !syllabi[0].publishedPdfKey) {
        setNoSyllabus(true)
        setLoading(false)
        return
      }
      const syl = syllabi[0]
      setPublishedAt(syl.publishedAt)

      const res = await fetch('/api/syllabus-pdf?action=view&key=' + encodeURIComponent(syl.publishedPdfKey))
      const { url } = await res.json()
      setPdfUrl(url)
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

      <StudentNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>
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
          /* ── PDF view ── */
          <div>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Course Syllabus
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
                  {semesterInfo}
                </h1>
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
                  whiteSpace: 'nowrap',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Published {formatPublished(publishedAt)}
                </div>
              )}
            </div>

            {/* PDF iframe */}
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                style={{ width: '100%', height: '80vh', border: 'none', borderRadius: '8px' }}
              />
            )}

            {/* Download link */}
            {pdfUrl && (
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <a
                  href={pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--plum)', fontSize: '14px', textDecoration: 'underline' }}>
                  Download PDF
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
