'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../../components/TeacherNav'
import MathRenderer from '../../../components/MathRenderer'
import DiagramRenderer from '../../../components/DiagramRenderer'
import { useRoleGuard } from '../../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'
import type { ParsedLesson, ParsedQuestion } from '@/app/lib/lessonMarkdownParser'

const client = generateClient()

const LIST_COURSES = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items { id title isArchived }
    }
  }
`

const LIST_LESSON_TEMPLATES = /* GraphQL */`
  query ListTemplates($filter: ModelLessonTemplateFilterInput) {
    listLessonTemplates(filter: $filter, limit: 500) {
      items { id title lessonNumber }
    }
  }
`

type Course = { id: string; title: string; isArchived: boolean | null }
type ExistingLesson = { id: string; title: string; lessonNumber: number }

const SAMPLE = `# Lesson 1 — Classification of Numbers

**Course:** Algebra 1
**Assignment type:** both
**Lesson category:** lesson

## Video plan

### Opening (~30 sec)
- Greet students, state lesson title
- Prayer

### Concept teaching (~6 min)
- Real numbers = rational + irrational
- Natural → Whole → Integer → Rational
- Irrational = never terminates, never repeats

## Assignment

### H1 — section_header
**Part I — Classification**

### Q1 — multiple_choice_multi
**Classify 301. Select all that apply.**
- Choices: natural | whole | integer | rational | irrational
- Answer: natural | whole | integer | rational

### Q2 — short_text
**Express 5/8 as a decimal.**
- Answer: 0.625

### H2 — section_header
**Part II — Number line**

### Q3 — short_text
**Plot -3 and 2 on the number line, then compare.**
- Diagram:
  \`\`\`json
  {"type":"number-line","range":[-5,5],"points":[{"value":-3,"label":"-3"},{"value":2,"label":"2"}]}
  \`\`\`
- Answer: -3 < 2
`

export default function ImportLessonPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [markdown, setMarkdown] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [existingLessons, setExistingLessons] = useState<ExistingLesson[]>([])
  const [existingLessonId, setExistingLessonId] = useState('')  // empty = create new
  const [parsed, setParsed] = useState<ParsedLesson | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) loadExistingLessons(selectedCourseId)
    else setExistingLessons([])
  }, [selectedCourseId])

  async function loadCourses() {
    try {
      const res = await (client.graphql({ query: LIST_COURSES }) as any)
      const items = (res.data.listCourses.items as Course[]).filter(c => !c.isArchived)
      setCourses(items)
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  async function loadExistingLessons(courseId: string) {
    try {
      const res = await (client.graphql({
        query: LIST_LESSON_TEMPLATES,
        variables: { filter: { courseLessonTemplatesId: { eq: courseId } } },
      }) as any)
      const items = res.data.listLessonTemplates.items as ExistingLesson[]
      items.sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0))
      setExistingLessons(items)
    } catch (err) {
      console.error('Failed to load lessons:', err)
    }
  }

  async function doPreview() {
    if (!markdown.trim()) {
      setError('Paste your lesson markdown first.')
      return
    }
    setError('')
    setSuccess(null)
    setParsing(true)
    try {
      const res = await apiFetch('/api/import-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, courseId: selectedCourseId || 'preview', preview: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Preview failed')
        setParsed(data.parsed || null)
      } else {
        setParsed(data.parsed)
        // If the parsed title matches an existing lesson by name, default to update mode
        const existing = existingLessons.find(l =>
          l.lessonNumber === data.parsed.lessonNumber ||
          l.title.toLowerCase() === (data.parsed.title || '').toLowerCase()
        )
        if (existing) setExistingLessonId(existing.id)
      }
    } catch (err: any) {
      setError(err?.message || 'Preview failed')
    } finally {
      setParsing(false)
    }
  }

  async function doImport() {
    if (!parsed || !selectedCourseId) return
    setImporting(true)
    setError('')
    setSuccess(null)
    try {
      const res = await apiFetch('/api/import-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          courseId: selectedCourseId,
          existingLessonId: existingLessonId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setSuccess(
          existingLessonId
            ? `Updated "${data.parsed.title}" — ${data.questionsCreated} questions recreated.`
            : `Created "${data.parsed.title}" with ${data.questionsCreated} questions.`
        )
        setParsed(data.parsed)
      }
    } catch (err: any) {
      setError(err?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '6px' }}>
              Import Lesson
            </h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', maxWidth: '640px', lineHeight: 1.5 }}>
              Paste a lesson markdown file from your Claude Project — you&apos;ll see a preview of every question before
              anything is saved. Diagrams, choices, and answers are all parsed automatically.
            </p>
          </div>
          <button
            onClick={() => { setMarkdown(SAMPLE); setParsed(null); setError(''); setSuccess(null) }}
            style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Load sample
          </button>
        </div>

        {/* Course + existing lesson selector */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '1 1 240px', minWidth: '240px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}>
              <option value="">Select a course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 240px', minWidth: '240px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Target</label>
            <select
              value={existingLessonId}
              onChange={e => setExistingLessonId(e.target.value)}
              disabled={!selectedCourseId}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}>
              <option value="">Create new lesson</option>
              {existingLessons.map(l => (
                <option key={l.id} value={l.id}>Update: Lesson {l.lessonNumber} — {l.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Markdown input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Lesson markdown</label>
          <textarea
            value={markdown}
            onChange={e => { setMarkdown(e.target.value); setParsed(null); setSuccess(null) }}
            placeholder="Paste the full lesson markdown here…"
            style={{ width: '100%', minHeight: '280px', padding: '14px', border: '1px solid var(--gray-light)', borderRadius: '8px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={doPreview}
            disabled={parsing || !markdown.trim()}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: parsing ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, opacity: parsing || !markdown.trim() ? 0.5 : 1 }}>
            {parsing ? 'Parsing…' : parsed ? 'Re-parse' : 'Preview'}
          </button>
          {parsed && parsed.questions.length > 0 && (() => {
            const hasErrors = (parsed.errors?.length ?? 0) > 0
            const blocked = importing || !selectedCourseId || hasErrors
            const tip = hasErrors
              ? 'Resolve blocking errors first'
              : !selectedCourseId ? 'Select a course first' : undefined
            return (
              <button
                onClick={doImport}
                disabled={blocked}
                title={tip}
                style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: blocked ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, opacity: blocked ? 0.5 : 1 }}>
                {importing ? 'Importing…' : existingLessonId ? 'Update Lesson' : 'Create Lesson'}
              </button>
            )
          })()}
        </div>

        {/* Status messages */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
            ✓ {success}
          </div>
        )}

        {/* Preview */}
        {parsed && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px' }}>
            <div style={{ borderBottom: '1px solid var(--gray-light)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Preview — {existingLessonId ? 'will update existing lesson' : 'will create new lesson'}
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 4px' }}>
                {parsed.title || '(no title)'}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--gray-mid)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {parsed.lessonNumberLabel && <span>Lesson #{parsed.lessonNumberLabel}</span>}
                {(() => {
                  const qCount = parsed.questions.filter(q => q.type !== 'section_header').length
                  const hCount = parsed.questions.filter(q => q.type === 'section_header').length
                  return (
                    <>
                      <span>{qCount} question{qCount !== 1 ? 's' : ''}</span>
                      {hCount > 0 && <span>{hCount} section{hCount !== 1 ? 's' : ''}</span>}
                    </>
                  )
                })()}
                <span>{parsed.assignmentType}</span>
                <span>{parsed.lessonCategory}</span>
              </div>
            </div>

            {parsed.errors && parsed.errors.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {parsed.errors.length} blocking error{parsed.errors.length !== 1 ? 's' : ''}
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.6 }}>
                  {parsed.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {parsed.warnings.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {parsed.warnings.length} warning{parsed.warnings.length !== 1 ? 's' : ''}
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>
                  {parsed.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-dark)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Questions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {parsed.questions.map(q =>
                q.type === 'section_header'
                  ? <SectionHeaderCard key={q.order} q={q} />
                  : <QuestionPreviewCard key={q.order} q={q} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SectionHeaderCard({ q }: { q: ParsedQuestion }) {
  const label = q.displayLabel || (q.headerNumber ? `H${q.headerNumber}` : 'Section')
  return (
    <div style={{ padding: '14px 18px', border: '1px solid var(--plum)', borderRadius: '8px', background: 'var(--plum-light)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '13px' }}>{label}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--plum)', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Section
        </span>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 600, lineHeight: 1.5 }}>
        <MathRenderer text={q.text} />
      </div>
    </div>
  )
}

function QuestionPreviewCard({ q }: { q: ParsedQuestion }) {
  const label = q.displayLabel || (q.questionNumber ? `Q${q.questionNumber}` : `Q${q.order}`)
  return (
    <div style={{ padding: '14px 18px', border: '1px solid var(--gray-light)', borderRadius: '8px', background: 'var(--background)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '14px' }}>{label}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'var(--gray-light)', color: 'var(--gray-dark)' }}>
          {q.type}
        </span>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '8px', lineHeight: 1.5 }}>
        <MathRenderer text={q.text} />
      </div>
      {q.diagramSpec && (
        <div style={{ marginBottom: '8px' }}>
          <DiagramRenderer spec={q.diagramSpec} />
        </div>
      )}
      {q.choices && q.choices.length > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>
          <strong>Choices:</strong> {q.choices.join(' · ')}
        </div>
      )}
      {q.correctAnswer && (
        <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, display: 'inline-flex', alignItems: 'baseline', gap: '6px' }}>
          Answer: <MathRenderer text={q.correctAnswer} />
        </div>
      )}
      {!q.correctAnswer && q.type !== 'show_work' && (
        <div style={{ fontSize: '12px', color: '#b45309', fontStyle: 'italic' }}>⚠ no answer set</div>
      )}
    </div>
  )
}
