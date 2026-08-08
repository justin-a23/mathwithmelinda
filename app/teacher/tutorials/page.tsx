'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

const LIST_TUTORIALS = /* GraphQL */ `
  query ListTutorialVideos {
    listTutorialVideos(limit: 200) {
      items { id title description videoUrl order courseId audience createdAt }
    }
  }
`

const CREATE_TUTORIAL = /* GraphQL */ `
  mutation CreateTutorialVideo($input: CreateTutorialVideoInput!) {
    createTutorialVideo(input: $input) { id }
  }
`

const DELETE_TUTORIAL = /* GraphQL */ `
  mutation DeleteTutorialVideo($input: DeleteTutorialVideoInput!) {
    deleteTutorialVideo(input: $input) { id }
  }
`

type Course = { id: string; title: string; isArchived?: boolean | null }
type Tutorial = {
  id: string
  title: string
  description: string | null
  videoUrl: string
  order: number | null
  courseId: string | null
  audience: string
  createdAt?: string
}

export default function ManageTutorialsPage() {
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [courses, setCourses] = useState<Course[]>([])
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // 'all' = every student, 'parent' = parents, otherwise a courseId
  const [audienceChoice, setAudienceChoice] = useState('all')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [cRes, tRes] = await Promise.all([
        client.graphql({ query: listCourses }) as any,
        client.graphql({ query: LIST_TUTORIALS }) as any,
      ])
      setCourses((cRes.data.listCourses.items as Course[]).filter(c => !c.isArchived))
      const items: Tutorial[] = tRes.data.listTutorialVideos.items
      items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      setTutorials(items)
    } catch (err) {
      console.error('Error loading tutorials:', err)
    } finally {
      setLoading(false)
    }
  }

  function audienceLabel(t: Tutorial): string {
    if (t.audience === 'parent') return '👪 Parents'
    if (!t.courseId) return '🎓 All students'
    return '🎓 ' + (courses.find(c => c.id === t.courseId)?.title || 'One class')
  }

  async function handleUpload() {
    if (!title.trim() || !file) {
      setError('A title and a video file are both required.')
      return
    }
    setError('')
    setUploading(true)
    setProgress(0)
    try {
      // tutorials/ prefix keeps these out of the course folders in the bucket
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.mp4'
      const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, '-')
      const filename = `${Date.now()} - ${safeTitle}${ext}`

      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType: file.type || 'video/mp4', course: 'tutorials' }),
      })
      const { signedUrl, key } = await res.json()
      if (!signedUrl) throw new Error('no signed url')

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('upload failed')))
        xhr.onerror = () => reject(new Error('upload failed'))
        xhr.send(file)
      })

      const isParent = audienceChoice === 'parent'
      await client.graphql({
        query: CREATE_TUTORIAL,
        variables: {
          input: {
            title: title.trim(),
            description: description.trim() || null,
            videoUrl: `https://dgmfzo1xk5r4e.cloudfront.net/${key}`,
            order: tutorials.length + 1,
            courseId: isParent || audienceChoice === 'all' ? null : audienceChoice,
            audience: isParent ? 'parent' : 'student',
          },
        },
      })

      setTitle(''); setDescription(''); setFile(null); setAudienceChoice('all')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadAll()
    } catch (err) {
      console.error(err)
      setError('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(t: Tutorial) {
    if (!confirm(`Delete "${t.title}"? Students will no longer see it under Help.`)) return
    setDeletingId(t.id)
    try {
      await client.graphql({ query: DELETE_TUTORIAL, variables: { input: { id: t.id } } })
      setTutorials(prev => prev.filter(x => x.id !== t.id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  if (checking) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Help Tutorials</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px' }}>
          How-to videos for the platform. Students see theirs under Help (filtered to their class); parents see theirs in the parent portal.
        </p>

        {/* Upload form */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '24px 28px', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>Add a Tutorial</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How to submit your work" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Who sees it</label>
              <select value={audienceChoice} onChange={e => setAudienceChoice(e.target.value)} style={inputStyle}>
                <option value="all">All students</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} students only</option>)}
                <option value="parent">Parents</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Description <span style={{ fontWeight: 400, color: 'var(--gray-mid)' }}>(optional)</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="One line about what this video covers" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Video file</label>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ fontSize: '13px', color: 'var(--foreground)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={handleUpload} disabled={uploading}
              style={{ background: uploading ? 'var(--gray-light)' : 'var(--plum)', color: uploading ? 'var(--gray-mid)' : 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
              {uploading ? `Uploading… ${progress}%` : 'Upload Tutorial'}
            </button>
            {error && <span style={{ color: '#dc2626', fontSize: '13px' }}>{error}</span>}
          </div>
        </div>

        {/* Existing tutorials */}
        <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '14px' }}>
          Current Tutorials {tutorials.length > 0 && `(${tutorials.length})`}
        </div>
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
        ) : tutorials.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No tutorials yet — upload the first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tutorials.map(t => {
              const open = openId === t.id
              return (
              <div key={t.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                  onClick={() => setOpenId(open ? null : t.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{t.description}</div>}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--plum)', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '20px', padding: '2px 12px', whiteSpace: 'nowrap' }}>
                    {audienceLabel(t)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--plum)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                    {open ? 'Close' : '▶ Watch'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(t) }} disabled={deletingId === t.id} title="Delete"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', opacity: deletingId === t.id ? 0.4 : 0.6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
                {open && (
                  <video controls autoPlay preload="metadata" style={{ width: '100%', display: 'block', background: '#000' }} src={t.videoUrl} />
                )}
              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  )
}
