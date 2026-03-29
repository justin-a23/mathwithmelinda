'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

type Course = {
  id: string
  title: string
}

export default function UploadVideo() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCourseFolder, setSelectedCourseFolder] = useState('')
  const [lessonNumber, setLessonNumber] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const COURSE_FOLDERS: Record<string, string> = {
    'Arithmetic 6': 'arithmetic6',
    'Middle School Math': 'middleschoolmath',
    'Pre-Algebra': 'prealgebra',
    'Algebra 1': 'algebra1',
  }

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    async function fetchCourses() {
      try {
        const result = await client.graphql({ query: listCourses })
        setCourses(result.data.listCourses.items as Course[])
      } catch (err) {
        console.error(err)
      }
    }
    fetchCourses()
  }, [])

  function handleCourseChange(courseTitle: string) {
    setSelectedCourse(courseTitle)
    setSelectedCourseFolder(COURSE_FOLDERS[courseTitle] || courseTitle.toLowerCase().replace(/\s+/g, ''))
  }

  async function handleUpload() {
    if (!file || !selectedCourse || !lessonNumber || !lessonTitle) {
      setError('Please fill in all fields and select a file.')
      return
    }
    setError('')
    setUploading(true)
    setProgress(0)

    try {
      const filename = `${selectedCourse} - Lesson ${lessonNumber} - ${lessonTitle}.mp4`

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          contentType: 'video/mp4',
          course: selectedCourseFolder
        })
      })

      const { signedUrl, key } = await res.json()

      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', 'video/mp4')

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const { createLesson } = await import('../../../src/graphql/mutations')
          await client.graphql({
            query: createLesson,
            variables: {
              input: {
                title: `Lesson ${lessonNumber} - ${lessonTitle}`,
                order: parseInt(lessonNumber),
                videoUrl: `https://dgmfzo1xk5r4e.cloudfront.net/${key}`,
                isPublished: false,
                courseLessonsId: courses.find(c => c.title === selectedCourse)?.id || ''
              }
            }
          })
          setDone(true)
          setUploading(false)
        } else {
          setError('Upload failed. Please try again.')
          setUploading(false)
        }
      }

      xhr.onerror = () => {
        setError('Upload failed. Please try again.')
        setUploading(false)
      }

      xhr.send(file)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={() => router.push('/teacher/profile')} title="My Profile" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            My Profile
          </button>
          <button onClick={() => router.push('/teacher')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            ← Back
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Upload New Video</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Upload a lesson video directly to the platform.</p>

        {done ? (
          <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--plum-dark)', marginBottom: '8px' }}>Upload Complete!</div>
            <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>The lesson has been saved and is ready to publish.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setDone(false); setFile(null); setLessonNumber(''); setLessonTitle(''); setProgress(0) }} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                Upload Another
              </button>
              <button onClick={() => router.push('/teacher')} style={{ background: 'transparent', color: 'var(--plum)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--plum-mid)', cursor: 'pointer' }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '32px' }}>
            
            {/* Course */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
              <select
                value={selectedCourse}
                onChange={e => handleCourseChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </select>
            </div>

            {/* Lesson number + title */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Lesson Number</label>
                <input
                  type="text"
                  value={lessonNumber}
                  onChange={e => setLessonNumber(e.target.value)}
                  placeholder="e.g. 144"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Lesson Title</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  placeholder="e.g. Solving Rational Equations"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                />
              </div>
            </div>

            {/* File drop zone */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Video File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                style={{ border: `2px dashed ${file ? 'var(--plum)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center', cursor: 'pointer', background: file ? 'var(--plum-light)' : 'var(--white)' }}>
                <input ref={fileInputRef} type="file" accept="video/mp4" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}/>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--plum-dark)', marginBottom: '4px' }}>{file.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>+</div>
                    <div style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Click or drag and drop your MP4 file here</div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '8px' }}>Uploading... {progress}%</div>
                <div style={{ background: 'var(--gray-light)', borderRadius: '4px', height: '8px' }}>
                  <div style={{ background: 'var(--plum)', height: '8px', borderRadius: '4px', width: `${progress}%`, transition: 'width 0.3s' }}/>
                </div>
              </div>
            )}

            {error && <p style={{ color: 'var(--color-text-danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{ background: uploading ? 'var(--gray-light)' : 'var(--plum)', color: uploading ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: uploading ? 'default' : 'pointer', fontSize: '15px', fontWeight: 500, width: '100%' }}>
              {uploading ? `Uploading ${progress}%...` : 'Upload Video'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}