'use client'

import { useState, useRef, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { apiFetch } from '@/app/lib/apiFetch'
import { listCourses, listLessonTemplates } from '../../../src/graphql/queries'
import { createAssignmentQuestion, updateLessonTemplate } from '../../../src/graphql/mutations'

const client = generateClient()

type Course = { id: string; title: string }
type Lesson = { id: string; lessonNumber: number; title: string }

type ExtractedQuestion = {
  type: 'show_work' | 'number' | 'multiple_choice' | 'section_header' | 'instructions'
  text: string
  answer?: string
  choices?: string
  hasImage: boolean
}

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  instructions: { bg: '#dcfce7', color: '#166534', label: 'instructions' },
  section_header: { bg: '#7b4fa6', color: 'white', label: 'header' },
  show_work: { bg: '#e0f2fe', color: '#0369a1', label: 'work' },
  number: { bg: '#fef9c3', color: '#854d0e', label: 'number' },
  multiple_choice: { bg: '#fce7f3', color: '#9d174d', label: 'mc' },
}

export default function ScanImportPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [extracting, setExtracting] = useState(false)
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([])
  const [extractedInstructions, setExtractedInstructions] = useState('')
  const [extractError, setExtractError] = useState('')

  const [clearFirst, setClearFirst] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [importError, setImportError] = useState('')

  // ── Load courses ──────────────────────────────────────────────────────────
  async function loadCourses() {
    try {
      const res = await client.graphql({ query: listCourses })
      setCourses(res.data.listCourses.items as Course[])
      setLoaded(true)
    } catch (err) { console.error(err) }
  }

  async function loadLessons(courseId: string) {
    setSelectedCourse(courseId)
    setSelectedLesson('')
    setLessons([])
    if (!courseId) return
    try {
      let all: Lesson[] = []
      let nextToken: string | null = null
      do {
        const res: any = await client.graphql({
          query: listLessonTemplates,
          variables: { filter: { courseLessonTemplatesId: { eq: courseId } }, limit: 200, nextToken },
        })
        all = [...all, ...res.data.listLessonTemplates.items]
        nextToken = res.data.listLessonTemplates.nextToken
      } while (nextToken)
      all.sort((a, b) => a.lessonNumber - b.lessonNumber)
      setLessons(all)
    } catch (err) { console.error(err) }
  }

  // ── File handling ─────────────────────────────────────────────────────────
  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
    if (!arr.length) return
    setFiles(prev => [...prev, ...arr])
    setQuestions([])
    setExtractError('')
    setImportDone(false)

    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
    setQuestions([])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  // ── Extract questions via Claude ──────────────────────────────────────────
  async function handleExtract() {
    if (!files.length) return
    setExtracting(true)
    setExtractError('')
    setQuestions([])
    setExtractedInstructions('')

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f))

      const res = await apiFetch('/api/scan-import', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setExtractError(json.error || 'Extraction failed')
        return
      }

      setQuestions(json.questions || [])
      if (json.instructions) setExtractedInstructions(json.instructions)
    } catch {
      setExtractError('Could not reach the server. Check your connection.')
    } finally {
      setExtracting(false)
    }
  }

  // ── Import into lesson ────────────────────────────────────────────────────
  async function handleImport() {
    if (!selectedLesson || !questions.length) return
    setImporting(true)
    setImportError('')

    try {
      if (clearFirst) {
        const { listAssignmentQuestions } = await import('../../../src/graphql/queries')
        const { deleteAssignmentQuestion } = await import('../../../src/graphql/mutations')
        let existing: any[] = []
        let tok: string | null = null
        do {
          const res: any = await client.graphql({
            query: listAssignmentQuestions,
            variables: { filter: { lessonTemplateQuestionsId: { eq: selectedLesson } }, limit: 200, nextToken: tok },
          })
          existing = [...existing, ...res.data.listAssignmentQuestions.items]
          tok = res.data.listAssignmentQuestions.nextToken
        } while (tok)
        for (const q of existing) {
          await client.graphql({ query: deleteAssignmentQuestion, variables: { input: { id: q.id } } })
        }
      }

      // Update instructions if extracted
      if (extractedInstructions) {
        await client.graphql({
          query: updateLessonTemplate,
          variables: { input: { id: selectedLesson, instructions: extractedInstructions } },
        })
      }

      let order = 0
      for (const q of questions) {
        if (q.type === 'instructions') continue // handled above
        const validTypes = ['number', 'multiple_choice', 'show_work', 'section_header']
        const questionType = validTypes.includes(q.type) ? q.type : 'show_work'
        order++
        await client.graphql({
          query: createAssignmentQuestion,
          variables: {
            input: {
              questionText: q.text,
              questionType,
              choices: questionType === 'multiple_choice' && q.choices ? q.choices : null,
              correctAnswer: q.answer || null,
              order,
              lessonTemplateQuestionsId: selectedLesson,
            },
          },
        })
      }
      setImportDone(true)
    } catch (err: any) {
      console.error(err)
      setImportError(err?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const questionCount = questions.filter(q => q.type !== 'section_header' && q.type !== 'instructions').length
  const imageCount = questions.filter(q => q.hasImage).length
  const selectedLessonObj = lessons.find(l => l.id === selectedLesson)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b4fa6" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: 0 }}>
              Scan Import
            </h1>
          </div>
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0, paddingLeft: '52px' }}>
            Upload worksheet scans → Claude extracts every question automatically → import to a lesson.
          </p>
        </div>

        {importDone ? (
          // ── Success state ──
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#16a34a', marginBottom: '8px' }}>
              {questionCount} questions imported
            </div>
            <div style={{ color: '#166534', fontSize: '14px', marginBottom: '24px' }}>
              Into: {selectedLessonObj ? `Lesson ${selectedLessonObj.lessonNumber} — ${selectedLessonObj.title}` : ''}
            </div>
            <button
              onClick={() => { setFiles([]); setPreviews([]); setQuestions([]); setImportDone(false); setSelectedLesson(''); setExtractedInstructions('') }}
              style={{ background: '#7b4fa6', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Import Another Lesson
            </button>
          </div>
        ) : (
          <>
            {/* ── Step 1: Upload images ── */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Step 1 — Upload Worksheet Scans
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#7b4fa6' : 'var(--gray-light)'}`,
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(123,79,166,0.04)' : 'var(--background)',
                  transition: 'all 0.15s',
                  marginBottom: files.length ? '16px' : 0,
                }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => e.target.files && addFiles(e.target.files)}
                />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="1.5" style={{ marginBottom: '10px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                  Drop worksheet scans here
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                  or click to select — JPG, PNG, HEIC · multiple pages OK
                </div>
              </div>

              {/* Image thumbnails */}
              {files.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '120px' }}>
                      <img
                        src={src}
                        alt={`Page ${i + 1}`}
                        style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-light)', display: 'block' }}
                      />
                      <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                        p.{i + 1}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeFile(i) }}
                        style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        ×
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginTop: '4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {files[i].name}
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: '120px', height: '160px', border: '2px dashed var(--gray-light)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '12px', gap: '6px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add page
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 2: Extract ── */}
            {files.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Step 2 — Extract Questions with Claude
                </div>

                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: extracting ? 'var(--gray-light)' : '#7b4fa6',
                    color: extracting ? 'var(--gray-mid)' : 'white',
                    border: 'none', borderRadius: '8px', padding: '12px 24px',
                    fontSize: '14px', fontWeight: 700, cursor: extracting ? 'not-allowed' : 'pointer',
                  }}>
                  {extracting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Extracting {files.length} page{files.length > 1 ? 's' : ''}… this takes ~10–20 sec
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                      Extract Questions with Claude AI
                    </>
                  )}
                </button>

                {extractError && (
                  <div style={{ marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>
                    {extractError}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Review extracted questions ── */}
            {questions.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Step 3 — Review Extracted Questions
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>
                  {questionCount} question{questionCount !== 1 ? 's' : ''}
                  {imageCount > 0 && ` · ${imageCount} include diagram descriptions`}
                  {extractedInstructions && ' · instructions extracted'}
                </div>

                {extractedInstructions && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', fontSize: '13px', color: '#166534' }}>
                    <span style={{ fontWeight: 700 }}>Instructions: </span>{extractedInstructions}
                  </div>
                )}

                <div style={{ border: '1px solid var(--gray-light)', borderRadius: '10px', overflow: 'hidden' }}>
                  {questions.map((q, i) => {
                    const badge = TYPE_BADGE[q.type] ?? { bg: 'var(--gray-light)', color: 'var(--foreground)', label: q.type }
                    const isHeader = q.type === 'section_header'
                    return (
                      <div key={i} style={{
                        padding: '11px 16px',
                        borderBottom: i < questions.length - 1 ? '1px solid var(--gray-light)' : 'none',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: isHeader ? 'rgba(123,79,166,0.05)' : 'var(--background)',
                      }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                          background: badge.bg, color: badge.color,
                          flexShrink: 0, textTransform: 'uppercase', marginTop: '2px',
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ color: 'var(--foreground)', flex: 1, lineHeight: '1.5', fontSize: '13px', fontWeight: isHeader ? 600 : 400 }}>
                          {q.text}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {q.hasImage && (
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                              diagram
                            </span>
                          )}
                          {q.answer && (
                            <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                              ans: {q.answer}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Step 4: Select lesson and import ── */}
            {questions.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b4fa6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Step 4 — Import to Lesson
                </div>

                {!loaded ? (
                  <button onClick={loadCourses} style={{ background: '#7b4fa6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '16px' }}>
                    Load Courses
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course</label>
                      <select value={selectedCourse} onChange={e => loadLessons(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', background: 'var(--background)', color: 'var(--foreground)' }}>
                        <option value="">Choose a course…</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    {lessons.length > 0 && (
                      <div style={{ flex: 2, minWidth: '260px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lesson</label>
                        <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', background: 'var(--background)', color: 'var(--foreground)' }}>
                          <option value="">Choose a lesson…</option>
                          {lessons.map(l => <option key={l.id} value={l.id}>Lesson {l.lessonNumber} — {l.title}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--foreground)', marginBottom: '20px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={clearFirst} onChange={e => setClearFirst(e.target.checked)} />
                  Delete existing questions in this lesson before importing
                </label>

                {importError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>
                    {importError}
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={importing || !selectedLesson}
                  style={{
                    background: importing || !selectedLesson ? 'var(--gray-light)' : '#7b4fa6',
                    color: importing || !selectedLesson ? 'var(--gray-mid)' : 'white',
                    padding: '12px 32px', borderRadius: '8px', border: 'none',
                    cursor: importing || !selectedLesson ? 'not-allowed' : 'pointer',
                    fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                  {importing ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Importing…
                    </>
                  ) : `Import ${questionCount} Questions into Lesson`}
                </button>
              </div>
            )}
          </>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
