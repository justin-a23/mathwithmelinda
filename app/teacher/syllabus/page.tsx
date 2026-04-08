'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '../../lib/apiFetch'

const client = generateClient()

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        course { id title }
      }
    }
  }
`

const LIST_ALL_SYLLABI = /* GraphQL */ `
  query ListAllSyllabi {
    listSyllabi(limit: 100) {
      items { id semesterId courseId pdfKey publishedPdfKey publishedAt }
    }
  }
`

const CREATE_SYLLABUS = /* GraphQL */ `
  mutation CreateSyllabus($input: CreateSyllabusInput!) {
    createSyllabus(input: $input) { id semesterId courseId pdfKey publishedPdfKey publishedAt }
  }
`

const UPDATE_SYLLABUS = /* GraphQL */ `
  mutation UpdateSyllabus($input: UpdateSyllabusInput!) {
    updateSyllabus(input: $input) { id pdfKey publishedPdfKey publishedAt }
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

type Syllabus = {
  id: string
  semesterId: string
  courseId: string
  pdfKey: string | null
  publishedPdfKey: string | null
  publishedAt: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatPublished(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function TeacherSyllabusPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [view, setView] = useState<'list' | 'edit'>('list')
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [syllabiMap, setSyllabiMap] = useState<Record<string, Syllabus>>({})
  const [loading, setLoading] = useState(true)

  // Edit state
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
  const [currentSyllabus, setCurrentSyllabus] = useState<Syllabus | null>(null)
  const [pdfKey, setPdfKey] = useState<string | null>(null)
  const [publishedPdfKey, setPublishedPdfKey] = useState<string | null>(null)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle')
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [semRes, sylRes] = await Promise.all([
        client.graphql({ query: LIST_SEMESTERS }) as any,
        client.graphql({ query: LIST_ALL_SYLLABI }) as any,
      ])
      const sems: Semester[] = semRes.data.listSemesters.items
      setSemesters(sems.sort((a, b) => b.startDate.localeCompare(a.startDate)))

      const map: Record<string, Syllabus> = {}
      for (const syl of sylRes.data.listSyllabi.items) {
        map[syl.semesterId] = syl
      }
      setSyllabiMap(map)
    } catch (err) {
      console.error('Error loading syllabi:', err)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(semId: string) {
    const syl = syllabiMap[semId] ?? null
    setSelectedSemesterId(semId)
    setCurrentSyllabus(syl)
    setPdfKey(syl?.pdfKey ?? null)
    setPublishedPdfKey(syl?.publishedPdfKey ?? null)
    setPublishedAt(syl?.publishedAt ?? null)
    setUploadStatus('idle')
    setUploadError('')
    setViewerUrl(null)
    setPublishMsg('')
    setView('edit')

    // Load viewer URL if PDF exists
    if (syl?.pdfKey) {
      loadViewerUrl(syl.pdfKey)
    }
  }

  function backToList() {
    setView('list')
    setSelectedSemesterId(null)
    setCurrentSyllabus(null)
    setPdfKey(null)
    setPublishedPdfKey(null)
    setPublishedAt(null)
    setUploadStatus('idle')
    setUploadError('')
    setViewerUrl(null)
    setPublishMsg('')
  }

  async function loadViewerUrl(key: string) {
    setViewerLoading(true)
    try {
      const res = await apiFetch(`/api/syllabus-pdf?action=view&key=${encodeURIComponent(key)}`)
      const data = await res.json()
      setViewerUrl(data.url ?? null)
    } catch {
      setViewerUrl(null)
    } finally {
      setViewerLoading(false)
    }
  }

  async function handleFileSelect(file: File) {
    if (!file || file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file.')
      return
    }
    if (!selectedSemesterId) return

    setUploadStatus('uploading')
    setUploadError('')
    setViewerUrl(null)

    try {
      // 1. Get presigned upload URL
      const res = await apiFetch(`/api/syllabus-pdf?action=upload&semesterId=${encodeURIComponent(selectedSemesterId)}`)
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to get upload URL')
      const { uploadUrl, key } = resData

      // 2. PUT the file directly to S3
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      })
      if (!putRes.ok) throw new Error(`S3 upload failed (${putRes.status})`)

      // 3. Save key to GraphQL
      const sem = semesters.find(s => s.id === selectedSemesterId)
      let updatedSyl: Syllabus

      if (currentSyllabus) {
        const updateRes = await (client.graphql({
          query: UPDATE_SYLLABUS,
          variables: { input: { id: currentSyllabus.id, pdfKey: key } },
        }) as any)
        updatedSyl = { ...currentSyllabus, ...updateRes.data.updateSyllabus }
      } else {
        const createRes = await (client.graphql({
          query: CREATE_SYLLABUS,
          variables: {
            input: {
              semesterId: selectedSemesterId,
              courseId: sem?.courseId ?? '',
              pdfKey: key,
              publishedPdfKey: null,
              publishedAt: null,
            },
          },
        }) as any)
        updatedSyl = createRes.data.createSyllabus
        setCurrentSyllabus(updatedSyl)
      }

      setPdfKey(key)
      setSyllabiMap(prev => ({ ...prev, [selectedSemesterId]: updatedSyl }))
      setUploadStatus('complete')

      // Load the viewer
      await loadViewerUrl(key)
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err?.message ?? 'Upload failed. Please try again.')
      setUploadStatus('error')
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handlePublish() {
    if (!selectedSemesterId || !pdfKey) return
    if (!window.confirm('Publish this PDF? Students will be able to view it immediately. You can upload a new version and republish at any time.')) return

    setPublishing(true)
    setPublishMsg('')
    try {
      const now = new Date().toISOString()
      const sem = semesters.find(s => s.id === selectedSemesterId)
      let updatedSyl: Syllabus

      if (currentSyllabus) {
        const updateRes = await (client.graphql({
          query: UPDATE_SYLLABUS,
          variables: { input: { id: currentSyllabus.id, publishedPdfKey: pdfKey, publishedAt: now } },
        }) as any)
        updatedSyl = { ...currentSyllabus, ...updateRes.data.updateSyllabus }
      } else {
        const createRes = await (client.graphql({
          query: CREATE_SYLLABUS,
          variables: {
            input: {
              semesterId: selectedSemesterId,
              courseId: sem?.courseId ?? '',
              pdfKey,
              publishedPdfKey: pdfKey,
              publishedAt: now,
            },
          },
        }) as any)
        updatedSyl = createRes.data.createSyllabus
        setCurrentSyllabus(updatedSyl)
      }

      setPublishedPdfKey(pdfKey)
      setPublishedAt(now)
      setSyllabiMap(prev => ({ ...prev, [selectedSemesterId]: updatedSyl }))
      setPublishMsg('Published!')
      setTimeout(() => setPublishMsg(''), 4000)
    } catch (err) {
      console.error('Publish error:', err)
      setPublishMsg('Error publishing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!currentSyllabus) return
    if (!window.confirm('Unpublish this syllabus? Students will no longer be able to view it.')) return
    setPublishing(true)
    try {
      const updateRes = await (client.graphql({
        query: UPDATE_SYLLABUS,
        variables: { input: { id: currentSyllabus.id, pdfKey: null, publishedPdfKey: null, publishedAt: null } },
      }) as any)
      const updatedSyl = { ...currentSyllabus, ...updateRes.data.updateSyllabus }
      setPdfKey(null)
      setPublishedPdfKey(null)
      setPublishedAt(null)
      setViewerUrl(null)
      setUploadStatus('idle')
      setCurrentSyllabus(updatedSyl)
      setSyllabiMap(prev => ({ ...prev, [currentSyllabus.semesterId]: updatedSyl }))
    } catch (err) {
      console.error('Unpublish error:', err)
      alert('Error unpublishing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const editingSemester = semesters.find(s => s.id === selectedSemesterId)
  const hasPendingUpdate = !!(pdfKey && publishedPdfKey && pdfKey !== publishedPdfKey)

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {view === 'list' ? (
          // ── LIST VIEW ──
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
                Syllabi
              </h1>
              <p style={{ color: 'var(--gray-mid)', margin: 0 }}>
                Upload a PDF syllabus for each academic term. Published syllabi are visible to students and parents.
              </p>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: '100px', borderRadius: 'var(--radius)', background: 'var(--gray-light)', opacity: 0.4 }} />
                ))}
              </div>
            ) : semesters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--gray-mid)' }}>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No academic terms yet.</p>
                <p style={{ fontSize: '14px' }}>
                  Set up terms in{' '}
                  <button
                    onClick={() => router.push('/teacher/semesters')}
                    style={{ background: 'none', border: 'none', color: 'var(--plum)', cursor: 'pointer', fontSize: '14px', padding: 0, textDecoration: 'underline' }}>
                    Academic Year
                  </button>{' '}
                  first.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {semesters.map(sem => {
                  const syl = syllabiMap[sem.id]
                  let statusBadge: React.ReactNode

                  if (syl?.publishedAt) {
                    statusBadge = (
                      <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Published {formatPublished(syl.publishedAt)}
                      </span>
                    )
                  } else if (syl?.pdfKey) {
                    statusBadge = (
                      <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                        PDF uploaded — not published
                      </span>
                    )
                  } else {
                    statusBadge = (
                      <span style={{ background: 'var(--gray-light)', color: 'var(--gray-mid)', fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '20px' }}>
                        No PDF uploaded
                      </span>
                    )
                  }

                  return (
                    <div
                      key={sem.id}
                      style={{
                        background: 'var(--background)',
                        border: '1px solid var(--gray-light)',
                        borderRadius: 'var(--radius)',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          {sem.course && (
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--foreground)' }}>
                              {sem.course.title}
                            </span>
                          )}
                          {sem.isActive && (
                            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                              Active
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '14px', color: 'var(--plum)', fontWeight: 500, marginBottom: '6px' }}>
                          {sem.name}
                          {sem.startDate && sem.endDate && (
                            <span style={{ color: 'var(--gray-mid)', fontWeight: 400 }}>
                              {' '}· {formatDate(sem.startDate)} – {formatDate(sem.endDate)}
                            </span>
                          )}
                        </div>

                        <div>{statusBadge}</div>
                      </div>

                      <button
                        onClick={() => openEdit(sem.id)}
                        style={{
                          background: 'transparent',
                          color: 'var(--plum)',
                          padding: '8px 18px',
                          borderRadius: '6px',
                          border: '1px solid var(--plum)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}>
                        Manage
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // ── EDIT VIEW ──
          <>
            {/* Back */}
            <button
              onClick={backToList}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--plum)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '24px',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              All Semesters
            </button>

            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
              {editingSemester?.course && (
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                  {editingSemester.course.title}
                </h1>
              )}
              <div style={{ fontSize: '15px', color: 'var(--gray-mid)' }}>
                {editingSemester?.name}
                {editingSemester?.startDate && editingSemester?.endDate
                  ? ` · ${formatDate(editingSemester.startDate)} – ${formatDate(editingSemester.endDate)}`
                  : ''}
              </div>
            </div>

            {/* ── UPLOAD SECTION ── */}
            <section style={{
              background: 'var(--background)',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius)',
              padding: '28px 28px 24px',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: '0 0 20px 0' }}>
                PDF Syllabus
              </h2>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--plum)' : 'var(--gray-light)'}`,
                  borderRadius: '10px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: uploadStatus === 'uploading' ? 'default' : 'pointer',
                  background: dragOver ? 'rgba(123,79,166,0.04)' : 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                  marginBottom: '16px',
                }}>
                {/* Cloud upload icon */}
                <svg
                  width="44" height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={dragOver ? 'var(--plum)' : 'var(--gray-mid)'}
                  strokeWidth="1.5"
                  style={{ display: 'block', margin: '0 auto 14px' }}>
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>

                {uploadStatus === 'uploading' ? (
                  <>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                      Uploading…
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>Please wait</p>
                  </>
                ) : uploadStatus === 'complete' ? (
                  <>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#16a34a', margin: '0 0 4px 0' }}>
                      Upload complete
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
                      Click or drag to replace the PDF
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                      Click to select PDF or drag and drop
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
                      PDF files only · Max 10 MB recommended
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onFileInputChange}
                style={{ display: 'none' }}
              />

              {uploadError && (
                <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px 0' }}>{uploadError}</p>
              )}

              {/* Current PDF preview */}
              {pdfKey && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Current PDF
                  </div>
                  {viewerLoading ? (
                    <div style={{
                      height: '100px',
                      borderRadius: '8px',
                      background: 'var(--gray-light)',
                      opacity: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: 'var(--gray-mid)',
                    }}>
                      Loading preview…
                    </div>
                  ) : viewerUrl ? (
                    <iframe
                      src={viewerUrl}
                      title="Syllabus PDF"
                      style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid var(--gray-light)',
                        borderRadius: '8px',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      height: '80px',
                      borderRadius: '8px',
                      border: '1px solid var(--gray-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: 'var(--gray-mid)',
                    }}>
                      Preview unavailable
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── PUBLISH SECTION ── */}
            {pdfKey && (
              <section style={{
                background: 'var(--background)',
                border: '1px solid var(--gray-light)',
                borderRadius: 'var(--radius)',
                padding: '28px',
              }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: '0 0 16px 0' }}>
                  Visibility
                </h2>

                {hasPendingUpdate && (
                  <div style={{
                    background: '#fef9c3',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    color: '#854d0e',
                    fontWeight: 500,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    You've uploaded a new PDF — click Republish to make it visible to students.
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {publishedAt ? (
                    <>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '6px 14px',
                        borderRadius: '20px',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Published {formatPublished(publishedAt)}
                      </span>

                      {hasPendingUpdate && (
                        <button
                          onClick={handlePublish}
                          disabled={publishing}
                          style={{
                            background: 'var(--plum)',
                            color: 'white',
                            padding: '10px 22px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: publishing ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            opacity: publishing ? 0.6 : 1,
                          }}>
                          {publishing ? 'Publishing…' : 'Republish with Current PDF'}
                        </button>
                      )}
                      <button
                        onClick={handleUnpublish}
                        disabled={publishing}
                        style={{
                          background: 'transparent',
                          color: '#dc2626',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: '1px solid #dc2626',
                          cursor: publishing ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          opacity: publishing ? 0.5 : 1,
                        }}>
                        Unpublish
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      style={{
                        background: 'var(--plum)',
                        color: 'white',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: publishing ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        opacity: publishing ? 0.6 : 1,
                      }}>
                      {publishing ? 'Publishing…' : 'Publish to Students'}
                    </button>
                  )}

                  {publishMsg && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: publishMsg.startsWith('Error') ? '#dc2626' : '#16a34a',
                    }}>
                      {publishMsg === 'Published!' ? 'Published!' : publishMsg}
                    </span>
                  )}
                </div>

                {!publishedAt && (
                  <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '14px 0 0 0' }}>
                    The PDF is uploaded but not yet visible to students. Publish when you're ready.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
