'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from '../ThemeProvider'

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

type UploadedFile = {
  name: string
  key: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

export default function LessonPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

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
      formData.append('studentId', user?.userId || 'unknown')
      formData.append('lessonId', 'lesson-143')

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
      const { generateClient } = await import('aws-amplify/api')
      const { createSubmission } = await import('../../src/graphql/mutations')
      const client = generateClient()

      await client.graphql({
        query: createSubmission,
        variables: {
          input: {
            studentId: user?.userId || 'unknown',
            content: JSON.stringify({
              notes,
              files: files.filter(f => f.status === 'done').map(f => f.key)
            }),
            submittedAt: new Date().toISOString(),
          }
        }
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
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
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '8px' }}>
          Algebra 1
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '8px' }}>
          Lesson 143 — Introduction to Rational Expressions
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '32px' }}>Due Tuesday by 5:00 PM</p>

        <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '32px', aspectRatio: '16/9' }}>
          <video controls style={{ width: '100%', height: '100%' }}
            src={`${CLOUDFRONT_URL}/algebra1/Algebra 1 - Lesson 143 - Introduction to Rational Expressions.mp4`}>
            Your browser does not support the video tag.
          </video>
        </div>

        <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--plum)', marginBottom: '8px' }}>Instructions</h2>
          <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.7' }}>
            Watch the video and complete Practice 11.5 (pgs 530-531) #s: 1, 3, 5, 7, 9, 11. Then take a picture of the pages with the completed problems, attach them to this lesson and submit.
          </p>
        </div>

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
      </main>
    </div>
  )
}