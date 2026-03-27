'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../../ThemeProvider'

const client = generateClient()

const listSubmissionsWithDetails = /* GraphQL */`
  query ListSubmissionsWithDetails {
    listSubmissions(limit: 100) {
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

const listStudentProfilesQuery = /* GraphQL */`
  query ListStudentProfiles {
    listStudentProfiles(limit: 500) {
      items {
        id
        userId
        email
        firstName
        lastName
      }
    }
  }
`

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
    course?: {
      id: string
      title: string
    } | null
  } | null
}

export default function GradingPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [studentNameMap, setStudentNameMap] = useState<Record<string, string>>({})
  const { theme } = useTheme()

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    fetchSubmissions()
    fetchStudentProfiles()
  }, [])

  async function fetchStudentProfiles() {
    try {
      const result = await client.graphql({ query: listStudentProfilesQuery }) as any
      const items = result.data.listStudentProfiles.items as { id: string; userId: string; email: string; firstName: string; lastName: string }[]
      const map: Record<string, string> = {}
      for (const p of items) {
        const name = `${p.firstName} ${p.lastName}`
        if (p.email) map[p.email] = name
        if (p.userId) map[p.userId] = name
      }
      setStudentNameMap(map)
    } catch (err) {
      console.error('Error fetching student profiles:', err)
    }
  }

  async function fetchSubmissions() {
    try {
      const result = await client.graphql({ query: listSubmissionsWithDetails }) as any
      setSubmissions(result.data.listSubmissions.items as Submission[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function openSubmission(submission: Submission) {
    setSelectedSubmission(submission)
    setGrade(submission.grade || '')
    setComment(submission.teacherComment || '')
    setSaved(false)

    if (submission.content) {
      try {
        const parsed = JSON.parse(submission.content)
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
        } else {
          setImageUrls([])
        }
      } catch {
        setImageUrls([])
      }
    }
  }

  async function saveGrade() {
    if (!selectedSubmission) return
    setSaving(true)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: updateSubmission,
        variables: {
          input: {
            id: selectedSubmission.id,
            grade,
            teacherComment: comment
          }
        }
      })
      setSaved(true)
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, grade, teacherComment: comment } : s))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const ungraded = submissions.filter(s => !s.grade)
  const graded = submissions.filter(s => s.grade)

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

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', gap: '32px' }}>
        
        {/* Left panel - submission list */}
        <div style={{ width: '340px', flexShrink: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '24px' }}>Grade Work</h1>

          {loading ? (
            <p style={{ color: 'var(--gray-mid)' }}>Loading submissions...</p>
          ) : (
            <>
              {ungraded.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '12px' }}>
                    Needs grading ({ungraded.length})
                  </div>
                  {ungraded.map(s => (
                    <div key={s.id}
                      onClick={() => openSubmission(s)}
                      style={{ background: selectedSubmission?.id === s.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === s.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,166,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '4px' }}>
                        {studentNameMap[s.studentId] ? (
                          <><strong>{studentNameMap[s.studentId]}</strong> ({s.studentId})</>
                        ) : s.studentId}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>
                        {(() => { try { const c = JSON.parse(s.content || '{}'); return s.assignment?.course?.title || c.lessonTitle || 'No lesson info' } catch { return s.assignment?.course?.title || 'No lesson info' } })()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                        Submitted {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {graded.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '12px' }}>
                    Graded ({graded.length})
                  </div>
                  {graded.map(s => (
                    <div key={s.id}
                      onClick={() => openSubmission(s)}
                      style={{ background: selectedSubmission?.id === s.id ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${selectedSubmission?.id === s.id ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer', opacity: 0.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
                          {studentNameMap[s.studentId] ? (
                            <strong>{studentNameMap[s.studentId]}</strong>
                          ) : s.studentId}
                        </div>
                        <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{s.grade}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                        {(() => { try { const c = JSON.parse(s.content || '{}'); return s.assignment?.course?.title || c.lessonTitle || 'No lesson info' } catch { return s.assignment?.course?.title || 'No lesson info' } })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submissions.length === 0 && (
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No submissions yet.</p>
              )}
            </>
          )}
        </div>

        {/* Right panel - grading area */}
        {selectedSubmission ? (
          <div style={{ flex: 1 }}>
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '32px' }}>
              
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '4px' }}>
                {selectedSubmission.assignment?.title || 'Submission'}
              </h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '24px' }}>
                {selectedSubmission.assignment?.course?.title} · Submitted {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleDateString() : ''}
              </p>

              {/* Student notes */}
              {selectedSubmission.content && (() => {
                try {
                  const parsed = JSON.parse(selectedSubmission.content)
                  return parsed.notes ? (
                    <div style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Student notes</div>
                      <p style={{ fontSize: '14px', color: 'var(--foreground)' }}>{parsed.notes}</p>
                    </div>
                  ) : null
                } catch { return null }
              })()}

              {/* Submitted photos */}
              {imageUrls.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Submitted photos ({imageUrls.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))', gap: '12px' }}>
                    {imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Submission ${i + 1}`} 
                          style={{ width: '100%', minHeight: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-light)', cursor: 'pointer' }}
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {imageUrls.length === 0 && (
                <div style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No photos submitted — loading...</p>
                </div>
              )}

              {/* Grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Grade</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="e.g. 95"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Comments for student</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Great work! On problem 3, remember to..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={saveGrade} disabled={saving}
                  style={{ background: saving ? 'var(--gray-light)' : 'var(--plum)', color: saving ? 'var(--gray-mid)' : 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  {saving ? 'Saving...' : 'Save Grade'}
                </button>
                {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>✓ Grade saved!</span>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Select a submission from the left to grade it.</p>
          </div>
        )}
      </div>
    </div>
  )
}