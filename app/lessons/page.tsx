'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useTheme } from '../ThemeProvider'
import { generateClient } from 'aws-amplify/api'

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

const client = generateClient()

const getWeeklyPlanItemQuery = /* GraphQL */`
  query GetWeeklyPlanItem($id: ID!) {
    getWeeklyPlanItem(id: $id) {
      id
      dayOfWeek
      dueTime
      weeklyPlan {
        course {
          id
          title
        }
      }
      lesson {
        id
        title
        videoUrl
        instructions
        order
      }
    }
  }
`

type WeeklyPlanItemData = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  weeklyPlan?: {
    course?: {
      id: string
      title: string
    } | null
  } | null
  lesson?: {
    id: string
    title: string
    videoUrl: string | null
    instructions: string | null
    order: number | null
  } | null
}

type UploadedFile = {
  name: string
  key: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

function LessonPageInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [planItem, setPlanItem] = useState<WeeklyPlanItemData | null>(null)
  const [loading, setLoading] = useState(true)

  const itemId = searchParams.get('id')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!itemId) {
      setLoading(false)
      return
    }
    async function fetchItem() {
      try {
        const result = await (client.graphql({
          query: getWeeklyPlanItemQuery,
          variables: { id: itemId }
        }) as any)
        setPlanItem(result.data.getWeeklyPlanItem as WeeklyPlanItemData)
      } catch (err) {
        console.error('Error fetching lesson:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [itemId])

  async function uploadFile(file: File) {
    const fileEntry: UploadedFile = {
      name: file.name,
      key: '',
      status: 'uploading',
      progress: 0
    }
    setFiles(prev => [...prev, fileEntry])
    const index = files.length

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', user?.signInDetails?.loginId || user?.userId || 'unknown')
      formData.append('lessonId', planItem?.lesson?.id || itemId || 'unknown')

      const res = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')

      const { key } = await res.json()
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, key, status: 'done', progress: 100 } : f))
    } catch (err) {
      console.error(err)
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' } : f))
    }
  }

  async function handleSubmit() {
    if (files.length === 0 && !notes.trim()) {
      setError('Please add at least one photo or some notes before submitting.')
      return
    }
    const stillUploading = files.some(f => f.status === 'uploading')
    if (stillUploading) {
      setError('Please wait for all files to finish uploading.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const { createSubmission } = await import('../../src/graphql/mutations')

      await (client.graphql({
        query: createSubmission,
        variables: {
          input: {
            studentId: user?.signInDetails?.loginId || user?.userId || 'unknown',
            content: JSON.stringify({
              notes,
              files: files.filter(f => f.status === 'done').map(f => f.key),
              lessonId: planItem?.lesson?.id || '',
              lessonTitle: planItem?.lesson?.title || ''
            }),
            submittedAt: new Date().toISOString(),
          }
        }
      }) as any)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const lesson = planItem?.lesson
  const course = planItem?.weeklyPlan?.course
  const videoSrc = lesson?.videoUrl
    ? lesson.videoUrl.startsWith('http')
      ? lesson.videoUrl
      : `${CLOUDFRONT_URL}/${lesson.videoUrl}`
    : null

  function formatDueTime(dueTime: string | null | undefined): string {
    if (!dueTime) return '5:00 PM'
    // dueTime is stored as full ISO-like string: "2024-01-15T17:00"
    try {
      const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
      const [hours, minutes] = timePart.split(':').map(Number)
      const d = new Date()
      d.setHours(hours, minutes)
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return dueTime
    }
  }

  function formatDueDate(dueTime: string | null | undefined): string {
    if (!dueTime) return ''
    try {
      const datePart = dueTime.includes('T') ? dueTime.split('T')[0] : ''
      if (!datePart) return ''
      const d = new Date(datePart + 'T00:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    } catch {
      return ''
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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            ← Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading lesson...</p>
        ) : !itemId || !planItem ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '12px' }}>No lesson selected</p>
            <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>Please go back to the dashboard and select a lesson.</p>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '8px' }}>
              {course?.title || 'Math with Melinda'}
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '8px' }}>
              {lesson?.order ? `Lesson ${lesson.order} — ` : ''}{lesson?.title || 'Lesson'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '32px' }}>
              {planItem.dueTime
                ? `Due ${formatDueDate(planItem.dueTime)} by ${formatDueTime(planItem.dueTime)}`
                : `${planItem.dayOfWeek}`}
            </p>

            {videoSrc ? (
              <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '32px', aspectRatio: '16/9' }}>
                <video controls style={{ width: '100%', height: '100%' }} src={videoSrc}>
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', marginBottom: '32px', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--gray-mid)' }}>No video available for this lesson.</p>
              </div>
            )}

            {lesson?.instructions && (
              <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--plum)', marginBottom: '8px' }}>Instructions</h2>
                <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.7' }}>
                  {lesson.instructions}
                </p>
              </div>
            )}

            {submitted ? (
              <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--plum)', marginBottom: '8px' }}>Submitted!</div>
                <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>Your work has been submitted. Melinda will review it soon.</p>
                <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '20px' }}>Submit Your Work</h2>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add any notes for your teacher..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Photos of your work</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(uploadFile) }}
                    style={{ border: '2px dashed var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                    <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple style={{ display: 'none' }}
                      onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadFile) }}/>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
                    <div style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Click or drag photos here</div>
                    <div style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>Supports JPG, PNG, HEIC and more</div>
                  </div>

                  {files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{f.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {f.status === 'uploading' && <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>Converting...</span>}
                            {f.status === 'done' && <span style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 500 }}>✓ Ready</span>}
                            {f.status === 'error' && <span style={{ fontSize: '12px', color: 'red' }}>Failed</span>}
                            <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '16px' }}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                <button onClick={handleSubmit} disabled={submitting}
                  style={{ background: submitting ? 'var(--gray-light)' : 'var(--plum)', color: submitting ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500, width: '100%' }}>
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--gray-mid)' }}>Loading...</p></div>}>
      <LessonPageInner />
    </Suspense>
  )
}
