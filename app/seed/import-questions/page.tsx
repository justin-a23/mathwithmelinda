'use client'

import { useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses, listLessonTemplates } from '../../../src/graphql/queries'
import { createAssignmentQuestion } from '../../../src/graphql/mutations'

const client = generateClient()

type Course = { id: string; title: string }
type Lesson = { id: string; lessonNumber: number; title: string }
type QuestionRow = { type: string; text: string; choices: string; answer: string }

function parseCSV(text: string): QuestionRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  function parseLine(line: string): string[] {
    const cols: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cols.push(current.trim())
    return cols
  }

  const rows: QuestionRow[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = parseLine(lines[i])
    const type = (cols[0] || '').trim().toLowerCase()
    if (!type) continue
    rows.push({
      type,
      text: (cols[1] || '').trim(),
      choices: (cols[2] || '').trim().replace(/\\n/g, '\n'),
      answer: (cols[3] || '').trim(),
    })
  }
  return rows
}

export default function ImportQuestionsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [csvText, setCsvText] = useState('')
  const [parsed, setParsed] = useState<QuestionRow[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [clearFirst, setClearFirst] = useState(false)

  async function loadCourses() {
    try {
      const res = await client.graphql({ query: listCourses })
      setCourses(res.data.listCourses.items as Course[])
      setLoaded(true)
    } catch (err) {
      console.error(err)
    }
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
    } catch (err) {
      console.error(err)
    }
  }

  function handleCSVChange(text: string) {
    setCsvText(text)
    setParsed(parseCSV(text))
    setDone(false)
    setError('')
  }

  async function handleImport() {
    if (!selectedLesson || !csvText.trim()) {
      setError('Select a lesson and paste CSV data.')
      return
    }
    const rows = parseCSV(csvText)
    if (!rows.length) { setError('No valid rows found.'); return }

    setImporting(true)
    setError('')
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

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const validTypes = ['number', 'multiple_choice', 'show_work', 'section_header']
        const questionType = validTypes.includes(row.type) ? row.type : 'show_work'
        await client.graphql({
          query: createAssignmentQuestion,
          variables: {
            input: {
              questionText: row.text,
              questionType,
              choices: questionType === 'multiple_choice' && row.choices ? row.choices : null,
              correctAnswer: row.answer || null,
              order: i + 1,
              lessonTemplateAssignmentQuestionsId: selectedLesson,
            },
          },
        })
      }
      setDone(true)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const selectedLessonObj = lessons.find(l => l.id === selectedLesson)

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>
          Import Questions
        </h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px', fontSize: '14px' }}>
          Bulk-load questions into a lesson from CSV. Admin tool — no auth required.
        </p>

        {/* Format guide */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px', fontSize: '13px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--foreground)' }}>CSV Format</div>
          <code style={{ display: 'block', color: 'var(--plum)', fontSize: '12px', lineHeight: '1.8' }}>
            type,text,choices,answer<br />
            section_header,Practice 2.2 — Solve,,<br />
            show_work,-2x - 3 = 7,,<br />
            show_work,3b + 5 = 10,,<br />
            number,What is 5 + 3?,,8<br />
            multiple_choice,Which is prime?,"2\n3\n4\n6",2
          </code>
          <div style={{ marginTop: '10px', color: 'var(--gray-mid)', fontSize: '12px' }}>
            Types: <strong>show_work</strong> · <strong>number</strong> · <strong>multiple_choice</strong> · <strong>section_header</strong>
            &nbsp;· choices and answer columns are optional for show_work/section_header rows
          </div>
        </div>

        {!loaded ? (
          <button onClick={loadCourses} style={{ background: 'var(--plum)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Load Courses
          </button>
        ) : done ? (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#16a34a', marginBottom: '8px' }}>
              Imported {parsed.length} questions
            </div>
            <div style={{ color: '#166534', fontSize: '14px', marginBottom: '20px' }}>
              Into: {selectedLessonObj ? `Lesson ${selectedLessonObj.lessonNumber} — ${selectedLessonObj.title}` : ''}
            </div>
            <button
              onClick={() => { setDone(false); setCsvText(''); setParsed([]); setSelectedLesson('') }}
              style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              Import Another Lesson
            </button>
          </div>
        ) : (
          <>
            {/* Course selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course</label>
              <select
                value={selectedCourse}
                onChange={e => loadLessons(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', background: 'var(--background)', color: 'var(--foreground)' }}>
                <option value="">Choose a course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            {/* Lesson selector */}
            {lessons.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lesson</label>
                <select
                  value={selectedLesson}
                  onChange={e => setSelectedLesson(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', background: 'var(--background)', color: 'var(--foreground)' }}>
                  <option value="">Choose a lesson…</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>Lesson {l.lessonNumber} — {l.title}</option>)}
                </select>
              </div>
            )}

            {/* CSV input */}
            {selectedLesson && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paste CSV</label>
                  <textarea
                    value={csvText}
                    onChange={e => handleCSVChange(e.target.value)}
                    placeholder={'type,text,choices,answer\nsection_header,Practice 2.2 — Solve,,\nshow_work,-2x - 3 = 7,,'}
                    rows={12}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Preview */}
                {parsed.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Preview — {parsed.length} questions
                    </div>
                    <div style={{ border: '1px solid var(--gray-light)', borderRadius: '8px', overflow: 'hidden' }}>
                      {parsed.slice(0, 8).map((row, i) => (
                        <div key={i} style={{
                          padding: '10px 14px',
                          borderBottom: i < Math.min(parsed.length, 8) - 1 ? '1px solid var(--gray-light)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '13px',
                          background: row.type === 'section_header' ? 'rgba(123,79,166,0.06)' : 'var(--background)',
                        }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: row.type === 'section_header' ? 'var(--plum)' : row.type === 'show_work' ? '#e0f2fe' : '#fef9c3',
                            color: row.type === 'section_header' ? 'white' : row.type === 'show_work' ? '#0369a1' : '#854d0e',
                            flexShrink: 0,
                            textTransform: 'uppercase',
                          }}>
                            {row.type === 'section_header' ? 'header' : row.type === 'show_work' ? 'work' : row.type}
                          </span>
                          <span style={{ color: 'var(--foreground)', flex: 1 }}>{row.text}</span>
                          {row.answer && <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>ans: {row.answer}</span>}
                        </div>
                      ))}
                      {parsed.length > 8 && (
                        <div style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--gray-mid)', borderTop: '1px solid var(--gray-light)', background: 'var(--background)' }}>
                          …and {parsed.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clear option */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--foreground)', marginBottom: '20px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={clearFirst} onChange={e => setClearFirst(e.target.checked)} />
                  Delete existing questions in this lesson before importing
                </label>

                {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

                <button
                  onClick={handleImport}
                  disabled={importing || !parsed.length}
                  style={{
                    background: importing || !parsed.length ? 'var(--gray-light)' : 'var(--plum)',
                    color: importing || !parsed.length ? 'var(--gray-mid)' : 'white',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: importing || !parsed.length ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}>
                  {importing ? 'Importing…' : `Import ${parsed.length} Questions`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
