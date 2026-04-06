'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useRoleGuard } from '@/app/hooks/useRoleGuard'
import { listCourses } from '../../../src/graphql/queries'

const client = generateClient()

type Course = { id: string; title: string }
type LessonRow = { lessonNumber: string; title: string; instructions: string; worksheetUrl: string }

export default function ImportLessons() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<LessonRow[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  async function loadCourses() {
    try {
      const result = await client.graphql({ query: listCourses })
      setCourses(result.data.listCourses.items as Course[])
      setLoaded(true)
    } catch (err) {
      console.error(err)
    }
  }

  function parseCSV(text: string): LessonRow[] {
    const lines = text.trim().split('\n')
    const rows: LessonRow[] = []
    
    function parseLine(line: string): string[] {
      const cols: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
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
  
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const cols = parseLine(lines[i])
      if (cols.length >= 3) {
        rows.push({
          lessonNumber: cols[1]?.trim() || '',
          title: cols[2]?.trim() || '',
          instructions: cols[3]?.trim() || '',
          worksheetUrl: cols[4]?.trim() || '',
        })
      }
    }
    return rows
  }

  function handleCSVChange(text: string) {
    setCsvText(text)
    setPreview(parseCSV(text).slice(0, 5))
  }

  async function handleImport() {
    if (!selectedCourse || !csvText) {
      setError('Please select a course and paste your CSV data.')
      return
    }
    setError('')
    setImporting(true)

    try {
      const { createLessonTemplate } = await import('../../../src/graphql/mutations')
      const rows = parseCSV(csvText)
      const course = courses.find(c => c.id === selectedCourse)

      for (const row of rows) {
        await client.graphql({
          query: createLessonTemplate,
          variables: {
            input: {
              lessonNumber: parseFloat(row.lessonNumber) || 0,
              title: row.title,
              instructions: row.instructions || '',
              worksheetUrl: row.worksheetUrl || '',
              videoUrl: '',
              courseLessonTemplatesId: selectedCourse
            }
          }
        })
      }
      setDone(true)
    } catch (err) {
      console.error(err)
      setError('Import failed. Please check your CSV format and try again.')
    } finally {
      setImporting(false)
    }
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--white)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--charcoal)', marginBottom: '8px' }}>Import Lesson Library</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px' }}>Bulk import lessons from a CSV file.</p>

        {!loaded ? (
          <button onClick={loadCourses} style={{ background: 'var(--plum)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Load Courses
          </button>
        ) : done ? (
          <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--plum-dark)', marginBottom: '16px' }}>Import Complete!</div>
            <button onClick={() => router.push('/teacher')} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
              Go to Teacher Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* CSV Format Guide */}
            <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '24px', fontSize: '13px', color: 'var(--gray-dark)' }}>
              <strong>CSV Format:</strong> lessonNumber, title, instructions, worksheetUrl<br/>
              <code style={{ fontSize: '12px' }}>143, Introduction to Rational Expressions, Watch the video and complete Practice 11.5, https://docs.google.com/...</code>
            </div>

            {/* Course selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Select Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            {/* CSV paste area */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Paste CSV Data</label>
              <textarea
                value={csvText}
                onChange={e => handleCSVChange(e.target.value)}
                placeholder="lessonNumber,title,instructions,worksheetUrl&#10;143,Introduction to Rational Expressions,Watch video and complete worksheet,https://..."
                rows={10}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
              />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', marginBottom: '8px' }}>Preview (first 5 rows)</div>
                <div style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {preview.map((row, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: i < preview.length - 1 ? '1px solid var(--gray-light)' : 'none', fontSize: '13px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--plum)' }}>Lesson {row.lessonNumber}</span>
                      <span style={{ color: 'var(--charcoal)', marginLeft: '12px' }}>{row.title}</span>
                      {row.instructions && <span style={{ color: 'var(--gray-mid)', marginLeft: '12px', fontSize: '12px' }}>{row.instructions.substring(0, 60)}...</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

            <button
              onClick={handleImport}
              disabled={importing}
              style={{ background: importing ? 'var(--gray-light)' : 'var(--plum)', color: importing ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
              {importing ? 'Importing...' : 'Import Lessons'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}