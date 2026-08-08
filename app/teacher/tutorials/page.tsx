'use client'

import { useEffect, useRef, useState } from 'react'
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

/** One uploaded video = possibly several audience rows; group them for display. */
type TutorialGroup = {
  videoUrl: string
  title: string
  description: string | null
  order: number | null
  rows: Tutorial[]
}

export default function ManageTutorialsPage() {
  const { checking } = useRoleGuard('teacher')

  const [courses, setCourses] = useState<Course[]>([])
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [forParents, setForParents] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [openUrl, setOpenUrl] = useState<string | null>(null)

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

  const allCoursesSelected = courses.length > 0 && courses.every(c => selectedCourseIds.has(c.id))

  function toggleCourse(id: string) {
    setSelectedCourseIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllCourses() {
    setSelectedCourseIds(allCoursesSelected ? new Set() : new Set(courses.map(c => c.id)))
  }

  function chipFor(t: Tutorial): string {
    if (t.audience === 'parent') return '👪 Parents'
    if (!t.courseId) return '🎓 All students'
    return '🎓 ' + (courses.find(c => c.id === t.courseId)?.title || 'One class')
  }

  const groups: TutorialGroup[] = (() => {
    const byUrl = new Map<string, TutorialGroup>()
    for (const t of tutorials) {
      const g = byUrl.get(t.videoUrl)
      if (g) g.rows.push(t)
      else byUrl.set(t.videoUrl, { videoUrl: t.videoUrl, title: t.title, description: t.description, order: t.order, rows: [t] })
    }
    return [...byUrl.values()].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  })()

  async function handleUpload() {
    const wantsStudents = selectedCourseIds.size > 0
    if (!title.trim() || !file) {
      setError('A title and a video file are both required.')
      return
    }
    if (!wantsStudents && !forParents) {
      setError('Pick at least one audience — a class, All students, or Parents.')
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

      // One row per audience, sharing the uploaded file. Every course checked
      // collapses to a single courseId-null row so future courses are included.
      const videoUrl = `https://dgmfzo1xk5r4e.cloudfront.net/${key}`
      const base = {
        title: title.trim(),
        description: description.trim() || null,
        videoUrl,
        order: groups.length + 1,
      }
      const inputs: any[] = []
      if (wantsStudents) {
        if (allCoursesSelected) inputs.push({ ...base, courseId: null, audience: 'student' })
        else for (const cid of selectedCourseIds) inputs.push({ ...base, courseId: cid, audience: 'student' })
      }
      if (forParents) inputs.push({ ...base, courseId: null, audience: 'parent' })
      for (const input of inputs) {
        await client.graphql({ query: CREATE_TUTORIAL, variables: { input } })
      }

      setTitle(''); setDescription(''); setFile(null)
      setSelectedCourseIds(new Set()); setForParents(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadAll()
    } catch (err) {
      console.error(err)
      setError('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteGroup(g: TutorialGroup) {
    if (!confirm(`Delete "${g.title}" for ${g.rows.map(chipFor).join(', ').replace(/🎓 |👪 /g, '')}? It disappears from Help everywhere it's shown.`)) return
    setDeletingKey(g.videoUrl)
    try {
      for (const row of g.rows) {
        await client.graphql({ query: DELETE_TUTORIAL, variables: { input: { id: row.id } } })
      }
      setTutorials(prev => prev.filter(x => x.videoUrl !== g.videoUrl))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingKey(null)
    }
  }

  if (checking) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)',
    boxSizing: 'border-box',
  }

  function audienceCheckbox(label: string, checked: boolean, onToggle: () => void, emphasized = false) {
    return (
      <label key={label} style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer',
        fontSize: '13px', fontWeight: checked ? 700 : 500,
        color: checked ? 'var(--plum)' : 'var(--gray-dark)',
        background: checked ? 'var(--plum-light)' : 'var(--background)',
        border: `1px solid ${checked ? 'var(--plum-mid)' : 'var(--gray-light)'}`,
        borderRadius: '20px', padding: '7px 14px',
        ...(emphasized ? { borderStyle: 'dashed' } : {}),
      }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ display: 'none' }} />
        <span style={{ fontSize: '13px' }}>{checked ? '☑' : '☐'}</span>
        {label}
      </label>
    )
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
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How to submit your work" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Description <span style={{ fontWeight: 400, color: 'var(--gray-mid)' }}>(optional)</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="One line about what this video covers" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '8px' }}>
              Who sees it <span style={{ fontWeight: 400, color: 'var(--gray-mid)' }}>(check every audience that should)</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {audienceCheckbox('All students', allCoursesSelected, toggleAllCourses, true)}
              {courses.map(c => audienceCheckbox(c.title, selectedCourseIds.has(c.id), () => toggleCourse(c.id)))}
              <span style={{ width: '1px', height: '22px', background: 'var(--gray-light)' }} />
              {audienceCheckbox('Parents', forParents, () => setForParents(p => !p))}
            </div>
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
          Current Tutorials {groups.length > 0 && `(${groups.length})`}
        </div>
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
        ) : groups.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No tutorials yet — upload the first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groups.map(g => {
              const open = openUrl === g.videoUrl
              return (
              <div key={g.videoUrl} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setOpenUrl(open ? null : g.videoUrl)}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{g.title}</div>
                    {g.description && <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{g.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {g.rows.map(r => (
                      <span key={r.id} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--plum)', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '20px', padding: '2px 12px', whiteSpace: 'nowrap' }}>
                        {chipFor(r)}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--plum)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                    {open ? 'Close' : '▶ Watch'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleDeleteGroup(g) }} disabled={deletingKey === g.videoUrl} title="Delete everywhere"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', opacity: deletingKey === g.videoUrl ? 0.4 : 0.6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
                {open && (
                  <video controls autoPlay preload="metadata" style={{ width: '100%', display: 'block', background: '#000' }} src={g.videoUrl} />
                )}
              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  )
}
