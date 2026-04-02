'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../../ThemeProvider'

const client = generateClient()

const LIST_PARENT_STUDENTS = /* GraphQL */ `
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 20) {
      items { id parentId studentEmail studentName }
    }
  }
`

const GET_STUDENT_PROFILE_BY_EMAIL = /* GraphQL */ `
  query GetStudentProfileByEmail($email: String!) {
    listStudentProfiles(filter: { email: { eq: $email } }, limit: 1) {
      items { id courseId }
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

type Child = { id: string; parentId: string; studentEmail: string; studentName: string }
type Section = { id: string; heading: string; body: string }

type SyllabusData = {
  courseTitle: string
  semesterName: string
  semesterDates: string
  publishedAt: string | null
  sections: Section[]
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

export default function ParentSyllabusPage() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingSyllabus, setLoadingSyllabus] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildEmail, setSelectedChildEmail] = useState<string | null>(null)
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null)
  const [noSyllabus, setNoSyllabus] = useState(false)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!user) return
    fetchChildren()
  }, [user])

  useEffect(() => {
    if (!selectedChildEmail) return
    loadSyllabusForChild(selectedChildEmail)
  }, [selectedChildEmail])

  async function fetchChildren() {
    try {
      const result = await (client.graphql({
        query: LIST_PARENT_STUDENTS,
        variables: { filter: { parentId: { eq: user?.userId } } },
      }) as any)
      const items: Child[] = result.data.listParentStudents.items
      setChildren(items)
      if (items.length === 1) setSelectedChildEmail(items[0].studentEmail)
    } catch (err) {
      console.error('Error fetching children:', err)
    } finally {
      setLoadingChildren(false)
    }
  }

  async function loadSyllabusForChild(email: string) {
    setLoadingSyllabus(true)
    setNoSyllabus(false)
    setSyllabusData(null)
    try {
      // 1. Get student's courseId via their profile
      const profileRes = await (client.graphql({
        query: GET_STUDENT_PROFILE_BY_EMAIL,
        variables: { email },
      }) as any)
      const profiles = profileRes.data.listStudentProfiles.items
      if (!profiles.length || !profiles[0].courseId) { setNoSyllabus(true); return }
      const courseId = profiles[0].courseId

      // 2. Find active or most recent semester for that course
      const semRes = await (client.graphql({
        query: LIST_SEMESTERS,
      }) as any)
      const allSems = semRes.data.listSemesters.items
      const sems = allSems.filter((s: any) => s.courseId === courseId)
      const sorted = [...sems].sort((a: any, b: any) => b.startDate.localeCompare(a.startDate))
      const active = sorted.find((s: any) => s.isActive) || sorted[0]
      if (!active) { setNoSyllabus(true); return }

      // 3. Get published syllabus for this semester
      const sylRes = await (client.graphql({
        query: LIST_SYLLABUS_FOR_SEMESTER,
        variables: { semesterId: active.id },
      }) as any)
      const syllabi = sylRes.data.listSyllabi.items
      if (!syllabi.length || !syllabi[0].publishedSections) { setNoSyllabus(true); return }

      const syl = syllabi[0]
      let parsedSections: Section[] = []
      try { parsedSections = JSON.parse(syl.publishedSections) } catch {}

      setSyllabusData({
        courseTitle: active.course?.title ?? '',
        semesterName: active.name,
        semesterDates: (active.startDate && active.endDate) ? formatDateRange(active.startDate, active.endDate) : '',
        publishedAt: syl.publishedAt,
        sections: parsedSections,
      })
    } catch (err) {
      console.error('Error loading syllabus for child:', err)
      setNoSyllabus(true)
    } finally {
      setLoadingSyllabus(false)
    }
  }

  const selectedChild = children.find(c => c.studentEmail === selectedChildEmail)

  if (loadingChildren) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Nav */}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white" />
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>
            Parent
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleTheme}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button
            onClick={() => router.push('/parent')}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => { signOut(); }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Child selector */}
        {children.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--foreground)', marginBottom: '12px' }}>
              No students linked
            </div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>
              Ask Melinda to send you a parent invite link to link your child's account.
            </p>
          </div>
        ) : (
          <>
            {children.length > 1 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '10px' }}>
                  Select Student
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildEmail(child.studentEmail)}
                      style={{
                        background: selectedChildEmail === child.studentEmail ? 'var(--plum)' : 'var(--background)',
                        color: selectedChildEmail === child.studentEmail ? 'white' : 'var(--foreground)',
                        border: `1px solid ${selectedChildEmail === child.studentEmail ? 'var(--plum)' : 'var(--gray-light)'}`,
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}>
                      {child.studentName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Syllabus content */}
            {!selectedChildEmail ? (
              <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '48px 0' }}>
                Select a student above to view their syllabus.
              </p>
            ) : loadingSyllabus ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '80px 0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Loading syllabus…
              </div>
            ) : noSyllabus ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>📋</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '10px' }}>
                  No syllabus yet
                </h2>
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto' }}>
                  {selectedChild?.studentName
                    ? `${selectedChild.studentName}'s teacher hasn't published a syllabus yet.`
                    : "The teacher hasn't published a syllabus yet."} Check back soon.
                </p>
              </div>
            ) : syllabusData ? (
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
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--foreground)', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                    {syllabusData.courseTitle}
                  </h1>
                  {selectedChild && (
                    <div style={{ fontSize: '13px', color: 'var(--plum)', fontWeight: 500, marginBottom: '6px' }}>
                      {selectedChild.studentName}
                    </div>
                  )}
                  <div style={{ fontSize: '15px', color: 'var(--gray-mid)', marginBottom: '18px' }}>
                    {syllabusData.semesterName}
                    {syllabusData.semesterDates ? ` · ${syllabusData.semesterDates}` : ''}
                  </div>
                  {syllabusData.publishedAt && (
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
                      Published {formatPublished(syllabusData.publishedAt)}
                    </div>
                  )}
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                  {syllabusData.sections.map((sec, i) => (
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
                  Questions about this syllabus? Contact Melinda directly.
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
