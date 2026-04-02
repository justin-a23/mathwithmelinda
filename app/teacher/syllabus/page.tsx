'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent quizWeightPercent testWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
      }
    }
  }
`

const LIST_ALL_SYLLABI = /* GraphQL */ `
  query ListAllSyllabi {
    listSyllabi(limit: 100) {
      items {
        id semesterId courseId
        sections publishedSections publishedAt
      }
    }
  }
`

const CREATE_SYLLABUS = /* GraphQL */ `
  mutation CreateSyllabus($input: CreateSyllabusInput!) {
    createSyllabus(input: $input) {
      id semesterId courseId sections publishedSections publishedAt
    }
  }
`

const UPDATE_SYLLABUS = /* GraphQL */ `
  mutation UpdateSyllabus($input: UpdateSyllabusInput!) {
    updateSyllabus(input: $input) {
      id sections publishedSections publishedAt
    }
  }
`

type Section = { id: string; heading: string; body: string }

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
  lessonWeightPercent: number | null
  quizWeightPercent: number | null
  testWeightPercent: number | null
  gradeA: number | null
  gradeB: number | null
  gradeC: number | null
  gradeD: number | null
  course: { id: string; title: string } | null
}

type Syllabus = {
  id: string
  semesterId: string
  courseId: string
  sections: string | null
  publishedSections: string | null
  publishedAt: string | null
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function parseSections(json: string | null | undefined): Section[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--gray-light)',
  borderRadius: '6px',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--gray-dark)',
  display: 'block',
  marginBottom: '6px',
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
  const [editingSemId, setEditingSemId] = useState<string | null>(null)
  const [currentSyllabusId, setCurrentSyllabusId] = useState<string | null>(null)
  const [draftSections, setDraftSections] = useState<Section[]>([])
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

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
    const syl = syllabiMap[semId]
    setEditingSemId(semId)
    setCurrentSyllabusId(syl?.id ?? null)
    setDraftSections(parseSections(syl?.sections))
    setPublishedAt(syl?.publishedAt ?? null)
    setSavedMsg('')
    setView('edit')
  }

  function backToList() {
    setView('list')
    setEditingSemId(null)
    setCurrentSyllabusId(null)
    setDraftSections([])
    setPublishedAt(null)
  }

  function loadTemplate() {
    const sem = semesters.find(s => s.id === editingSemId)
    const gradingBody = sem
      ? `Grades are calculated as follows:\n• Lessons: ${sem.lessonWeightPercent ?? 60}%\n• Participation: ${sem.quizWeightPercent ?? 20}%\n• Tests: ${sem.testWeightPercent ?? 20}%\n\nGrade cutoffs:\n• A: ${sem.gradeA ?? 90}% and above\n• B: ${sem.gradeB ?? 80}% and above\n• C: ${sem.gradeC ?? 70}% and above\n• D: ${sem.gradeD ?? 60}% and above\n• F: Below ${sem.gradeD ?? 60}%`
      : ''
    setDraftSections([
      { id: uid(), heading: 'Course Overview', body: '' },
      { id: uid(), heading: 'Learning Objectives', body: '' },
      { id: uid(), heading: 'Required Materials', body: '' },
      { id: uid(), heading: 'Grading Policy', body: gradingBody },
      { id: uid(), heading: 'Class Policies', body: '' },
    ])
  }

  function addSection() {
    setDraftSections(prev => [...prev, { id: uid(), heading: '', body: '' }])
  }

  function updateSection(id: string, field: 'heading' | 'body', value: string) {
    setDraftSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function deleteSection(id: string) {
    setDraftSections(prev => prev.filter(s => s.id !== id))
  }

  function moveSection(id: string, dir: 'up' | 'down') {
    setDraftSections(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const arr = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr
    })
  }

  async function saveDraft() {
    if (!editingSemId) return
    setSaving(true)
    setSavedMsg('')
    try {
      const sectionsJson = JSON.stringify(draftSections)
      const sem = semesters.find(s => s.id === editingSemId)

      if (currentSyllabusId) {
        await (client.graphql({
          query: UPDATE_SYLLABUS,
          variables: { input: { id: currentSyllabusId, sections: sectionsJson } },
        }) as any)
      } else {
        const res = await (client.graphql({
          query: CREATE_SYLLABUS,
          variables: {
            input: {
              semesterId: editingSemId,
              courseId: sem?.courseId ?? '',
              sections: sectionsJson,
              publishedSections: null,
              publishedAt: null,
            },
          },
        }) as any)
        const created: Syllabus = res.data.createSyllabus
        setCurrentSyllabusId(created.id)
        setSyllabiMap(prev => ({ ...prev, [editingSemId]: created }))
      }

      setSyllabiMap(prev => ({
        ...prev,
        [editingSemId]: {
          ...(prev[editingSemId] ?? { id: currentSyllabusId ?? '', semesterId: editingSemId, courseId: sem?.courseId ?? '', publishedSections: null, publishedAt: null }),
          sections: sectionsJson,
        },
      }))
      setSavedMsg('Draft saved')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err) {
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  async function publishSyllabus() {
    if (!editingSemId) return
    if (!window.confirm('Publish this syllabus? Students and parents will see this version immediately. You can keep editing and re-publish at any time.')) return
    setPublishing(true)
    setSavedMsg('')
    try {
      const sectionsJson = JSON.stringify(draftSections)
      const now = new Date().toISOString()
      const sem = semesters.find(s => s.id === editingSemId)

      if (currentSyllabusId) {
        await (client.graphql({
          query: UPDATE_SYLLABUS,
          variables: {
            input: {
              id: currentSyllabusId,
              sections: sectionsJson,
              publishedSections: sectionsJson,
              publishedAt: now,
            },
          },
        }) as any)
      } else {
        const res = await (client.graphql({
          query: CREATE_SYLLABUS,
          variables: {
            input: {
              semesterId: editingSemId,
              courseId: sem?.courseId ?? '',
              sections: sectionsJson,
              publishedSections: sectionsJson,
              publishedAt: now,
            },
          },
        }) as any)
        const created: Syllabus = res.data.createSyllabus
        setCurrentSyllabusId(created.id)
        setSyllabiMap(prev => ({ ...prev, [editingSemId]: created }))
      }

      setPublishedAt(now)
      setSyllabiMap(prev => ({
        ...prev,
        [editingSemId]: {
          ...(prev[editingSemId] ?? { id: currentSyllabusId ?? '', semesterId: editingSemId, courseId: sem?.courseId ?? '' }),
          sections: sectionsJson,
          publishedSections: sectionsJson,
          publishedAt: now,
        },
      }))
      setSavedMsg('Published!')
      setTimeout(() => setSavedMsg(''), 4000)
    } catch (err) {
      console.error('Error publishing syllabus:', err)
    } finally {
      setPublishing(false)
    }
  }

  const editingSemester = semesters.find(s => s.id === editingSemId)

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {view === 'list' ? (
          <>
            {/* Page header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Syllabi</h1>
              <p style={{ color: 'var(--gray-mid)', margin: 0 }}>
                Create and manage a course syllabus for each academic term. Published syllabi are visible to students and parents.
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
                  const status = syl?.publishedAt ? 'published' : syl?.sections ? 'draft' : 'none'
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
                        {/* Name + status badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>
                            {sem.name}
                          </span>
                          {sem.isActive && (
                            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                              Active
                            </span>
                          )}
                          {status === 'published' && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                              ✓ Published
                            </span>
                          )}
                          {status === 'draft' && (
                            <span style={{ background: '#fef9c3', color: '#a16207', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                              Draft
                            </span>
                          )}
                          {status === 'none' && (
                            <span style={{ background: 'var(--gray-light)', color: 'var(--gray-mid)', fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '20px' }}>
                              No syllabus
                            </span>
                          )}
                        </div>

                        {/* Course */}
                        {sem.course && (
                          <div style={{ fontSize: '13px', color: 'var(--plum)', fontWeight: 500, marginBottom: '4px' }}>
                            {sem.course.title}
                          </div>
                        )}

                        {/* Dates */}
                        {sem.startDate && sem.endDate && (
                          <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                            {formatDate(sem.startDate)} – {formatDate(sem.endDate)}
                          </div>
                        )}

                        {/* Published date */}
                        {status === 'published' && syl?.publishedAt && (
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '4px' }}>
                            Last published {formatPublished(syl.publishedAt)}
                          </div>
                        )}
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
                        {status === 'none' ? '+ Create Syllabus' : 'Edit Syllabus'}
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
              Back to Syllabi
            </button>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                  {editingSemester?.course?.title}
                </h1>
                <div style={{ fontSize: '15px', color: 'var(--gray-mid)', marginBottom: '12px' }}>
                  {editingSemester?.name}
                  {editingSemester?.startDate && editingSemester?.endDate
                    ? ` · ${formatDate(editingSemester.startDate)} – ${formatDate(editingSemester.endDate)}`
                    : ''}
                </div>

                {/* Publish status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {publishedAt ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '5px 12px',
                      borderRadius: '20px',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Published {formatPublished(publishedAt)}
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#fef9c3',
                      color: '#a16207',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '5px 12px',
                      borderRadius: '20px',
                    }}>
                      Draft — not visible to students yet
                    </span>
                  )}
                  {savedMsg && (
                    <span style={{ fontSize: '13px', color: savedMsg === 'Published!' ? '#16a34a' : 'var(--gray-mid)', fontWeight: 500 }}>
                      {savedMsg === 'Published!' ? '🎉 Published!' : `✓ ${savedMsg}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Top action buttons */}
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'flex-start' }}>
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    color: 'var(--plum)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--plum)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    opacity: saving ? 0.6 : 1,
                  }}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={publishSyllabus}
                  disabled={publishing || draftSections.length === 0}
                  style={{
                    background: 'var(--plum)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: (publishing || draftSections.length === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: (publishing || draftSections.length === 0) ? 0.6 : 1,
                  }}>
                  {publishing ? 'Publishing…' : publishedAt ? 'Re-publish' : 'Publish'}
                </button>
              </div>
            </div>

            {/* ── SECTIONS ── */}
            {draftSections.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '56px 24px',
                background: 'var(--background)',
                border: '1px dashed var(--gray-light)',
                borderRadius: 'var(--radius)',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                <p style={{ fontSize: '16px', color: 'var(--foreground)', fontWeight: 500, margin: '0 0 6px 0' }}>
                  No sections yet
                </p>
                <p style={{ fontSize: '14px', color: 'var(--gray-mid)', margin: '0 0 28px 0' }}>
                  Start from a ready-made template or add a blank section.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={loadTemplate}
                    style={{
                      background: 'var(--plum)',
                      color: 'white',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}>
                    Use Template
                  </button>
                  <button
                    onClick={addSection}
                    style={{
                      background: 'transparent',
                      color: 'var(--plum)',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      border: '1px solid var(--plum)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}>
                    + Blank Section
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  {draftSections.map((sec, i) => (
                    <div
                      key={sec.id}
                      style={{
                        background: 'var(--background)',
                        border: '1px solid var(--gray-light)',
                        borderRadius: 'var(--radius)',
                        padding: '20px 24px',
                      }}>
                      {/* Section toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        {/* Up / Down arrows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                          <button
                            onClick={() => moveSection(sec.id, 'up')}
                            disabled={i === 0}
                            title="Move up"
                            style={{
                              background: 'none',
                              border: '1px solid var(--gray-light)',
                              borderRadius: '4px',
                              width: '26px',
                              height: '22px',
                              cursor: i === 0 ? 'default' : 'pointer',
                              opacity: i === 0 ? 0.25 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSection(sec.id, 'down')}
                            disabled={i === draftSections.length - 1}
                            title="Move down"
                            style={{
                              background: 'none',
                              border: '1px solid var(--gray-light)',
                              borderRadius: '4px',
                              width: '26px',
                              height: '22px',
                              cursor: i === draftSections.length - 1 ? 'default' : 'pointer',
                              opacity: i === draftSections.length - 1 ? 0.25 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>

                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Section {i + 1}
                        </span>

                        <div style={{ flex: 1 }} />

                        <button
                          onClick={() => deleteSection(sec.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}>
                          Remove
                        </button>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>Heading</label>
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={e => updateSection(sec.id, 'heading', e.target.value)}
                          placeholder="e.g. Course Overview"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Content</label>
                        <textarea
                          value={sec.body}
                          onChange={e => updateSection(sec.id, 'body', e.target.value)}
                          placeholder="Write the content for this section…"
                          rows={6}
                          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add section */}
                <div style={{ marginBottom: '40px' }}>
                  <button
                    onClick={addSection}
                    style={{
                      background: 'transparent',
                      color: 'var(--plum)',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: '1px dashed var(--plum)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: 0.75,
                    }}>
                    + Add Section
                  </button>
                </div>

                {/* Bottom action bar */}
                <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={saveDraft}
                    disabled={saving}
                    style={{
                      background: 'transparent',
                      color: 'var(--plum)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid var(--plum)',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: saving ? 0.6 : 1,
                    }}>
                    {saving ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    onClick={publishSyllabus}
                    disabled={publishing}
                    style={{
                      background: 'var(--plum)',
                      color: 'white',
                      padding: '10px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: publishing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      opacity: publishing ? 0.6 : 1,
                    }}>
                    {publishing ? 'Publishing…' : publishedAt ? 'Re-publish to Students' : 'Publish to Students'}
                  </button>
                  {savedMsg && (
                    <span style={{ fontSize: '13px', color: savedMsg === 'Published!' ? '#16a34a' : 'var(--gray-mid)', fontWeight: 500 }}>
                      {savedMsg === 'Published!' ? '🎉 Published!' : `✓ ${savedMsg}`}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
