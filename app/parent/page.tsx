'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../ThemeProvider'

const client = generateClient()

const listParentStudents = /* GraphQL */`
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 20) {
      items {
        id
        parentId
        studentEmail
        studentName
      }
    }
  }
`

const listSubmissionsByStudent = /* GraphQL */`
  query ListSubmissions($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 200) {
      items {
        id
        studentId
        content
        grade
        teacherComment
        submittedAt
        assignment {
          id
          title
          dueDate
          course {
            id
            title
          }
        }
      }
    }
  }
`

type Child = {
  id: string
  parentId: string
  studentEmail: string
  studentName: string
}

type Submission = {
  id: string
  studentId: string
  content: string | null
  grade: string | null
  teacherComment: string | null
  submittedAt: string | null
  assignment?: {
    id: string
    title: string
    dueDate: string | null
    course?: { id: string; title: string } | null
  } | null
}

export default function ParentDashboard() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!user) return
    fetchChildren()
  }, [user])

  useEffect(() => {
    if (!selectedChild) return
    fetchSubmissions(selectedChild.studentEmail)
  }, [selectedChild])

  async function fetchChildren() {
    try {
      const result = await client.graphql({
        query: listParentStudents,
        variables: { filter: { parentId: { eq: user?.userId } } }
      }) as any
      const items = (result.data as { listParentStudents: { items: Child[] } }).listParentStudents.items
      setChildren(items)
      if (items.length === 1) setSelectedChild(items[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingChildren(false)
    }
  }

  async function fetchSubmissions(studentEmail: string) {
    setLoadingSubmissions(true)
    setSelectedSubmission(null)
    setImageUrls([])
    try {
      const result = await client.graphql({
        query: listSubmissionsByStudent,
        variables: { filter: { studentId: { eq: studentEmail } } }
      }) as any
      const items = (result.data as { listSubmissions: { items: Submission[] } }).listSubmissions.items
      const sorted = items.sort((a, b) => {
        if (!a.submittedAt) return 1
        if (!b.submittedAt) return -1
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      })
      setSubmissions(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  async function openSubmission(sub: Submission) {
    setSelectedSubmission(sub)
    setImageUrls([])
    if (!sub.content) return
    try {
      const parsed = JSON.parse(sub.content)
      if (parsed.files && parsed.files.length > 0) {
        const urls = await Promise.all(
          parsed.files.map(async (key: string) => {
            const res = await fetch('/api/view-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key })
            })
            const { url } = await res.json()
            return url
          })
        )
        setImageUrls(urls)
      }
    } catch {}
  }

  const graded = submissions.filter(s => s.grade)
  const pending = submissions.filter(s => !s.grade)

  if (loadingChildren) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    )
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
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', marginLeft: '8px' }}>Parent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      {children.length === 0 ? (
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>No students linked yet</div>
          <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>
            Ask Melinda to send you a parent invite link. Once you click it and confirm, your child's grades and submissions will appear here.
          </p>
        </main>
      ) : (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>

          {/* Child selector (only shown if multiple children) */}
          {children.length > 1 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '12px' }}>Select Student</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {children.map(child => (
                  <button key={child.id} onClick={() => setSelectedChild(child)}
                    style={{ background: selectedChild?.id === child.id ? 'var(--plum)' : 'var(--background)', color: selectedChild?.id === child.id ? 'white' : 'var(--foreground)', border: `1px solid ${selectedChild?.id === child.id ? 'var(--plum)' : 'var(--gray-light)'}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    {child.studentName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedChild && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>{selectedChild.studentName}</h1>
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>{selectedChild.studentEmail}</p>
              </div>

              {/* Summary bar */}
              {!loadingSubmissions && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--plum)' }}>{submissions.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 500 }}>Total Submitted</div>
                  </div>
                  <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)' }}>{graded.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Graded</div>
                  </div>
                  <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)' }}>{pending.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Awaiting Grade</div>
                  </div>
                  {graded.length > 0 && (() => {
                    const numGrades = graded.map(s => parseFloat(s.grade || '0')).filter(n => !isNaN(n))
                    if (numGrades.length === 0) return null
                    const avg = numGrades.reduce((a, b) => a + b, 0) / numGrades.length
                    return (
                      <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', minWidth: '120px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)' }}>{avg.toFixed(1)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontWeight: 500 }}>Avg Grade</div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: '32px' }}>
                {/* Submission list */}
                <div style={{ width: '320px', flexShrink: 0 }}>
                  {loadingSubmissions ? (
                    <p style={{ color: 'var(--gray-mid)' }}>Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No submissions yet.</p>
                  ) : (
                    <>
                      {pending.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                            Awaiting Grade ({pending.length})
                          </div>
                          {pending.map(sub => (
                            <div key={sub.id} onClick={() => openSubmission(sub)}
                              style={{ background: selectedSubmission?.id === sub.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === sub.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,166,0.12)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '3px' }}>
                                {sub.assignment?.course?.title || 'Unknown course'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '3px' }}>
                                {sub.assignment?.title || 'Unknown lesson'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {graded.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '10px' }}>
                            Graded ({graded.length})
                          </div>
                          {graded.map(sub => (
                            <div key={sub.id} onClick={() => openSubmission(sub)}
                              style={{ background: selectedSubmission?.id === sub.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === sub.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,166,0.12)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
                                  {sub.assignment?.course?.title || 'Unknown course'}
                                </div>
                                <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{sub.grade}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '3px' }}>
                                {sub.assignment?.title || 'Unknown lesson'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Detail panel */}
                {selectedSubmission ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '4px' }}>
                        {selectedSubmission.assignment?.title || 'Submission'}
                      </h2>
                      <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '24px' }}>
                        {selectedSubmission.assignment?.course?.title}
                        {selectedSubmission.submittedAt ? ` · Submitted ${new Date(selectedSubmission.submittedAt).toLocaleDateString()}` : ''}
                      </p>

                      {/* Grade */}
                      {selectedSubmission.grade && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Grade</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--plum)' }}>{selectedSubmission.grade}</div>
                          </div>
                          {selectedSubmission.teacherComment && (
                            <div style={{ flex: 1, borderLeft: '1px solid var(--plum-mid)', paddingLeft: '16px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Melinda's Comment</div>
                              <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6' }}>{selectedSubmission.teacherComment}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!selectedSubmission.grade && (
                        <div style={{ background: 'var(--gray-light)', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--gray-mid)' }}>
                          Not graded yet — check back soon.
                        </div>
                      )}

                      {/* Student notes */}
                      {selectedSubmission.content && (() => {
                        try {
                          const parsed = JSON.parse(selectedSubmission.content)
                          return parsed.notes ? (
                            <div style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Student notes</div>
                              <p style={{ fontSize: '14px', color: 'var(--foreground)' }}>{parsed.notes}</p>
                            </div>
                          ) : null
                        } catch { return null }
                      })()}

                      {/* Photos */}
                      {imageUrls.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Submitted Work ({imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))', gap: '10px' }}>
                            {imageUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Work ${i + 1}`}
                                  style={{ width: '100%', minHeight: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-light)', cursor: 'pointer' }}
                                  onError={e => (e.currentTarget.style.display = 'none')}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Select a submission to view details.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  )
}
