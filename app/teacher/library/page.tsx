'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }

export default function LessonLibraryIndex() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  // Add Course lived on the teacher dashboard's "Your Courses" section; when
  // that section was removed this page became the only home for it.
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', gradeLevel: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (checking) return
    fetchCourses()
  }, [checking])

  function fetchCourses() {
    client.graphql({ query: listCourses }).then((res: any) => {
      const items = res.data.listCourses.items as Course[]
      items.sort((a, b) => {
        const ga = parseInt(a.gradeLevel || '99')
        const gb = parseInt(b.gradeLevel || '99')
        return ga - gb
      })
      setCourses(items)
    }).catch(console.error)
  }

  async function addCourse() {
    if (!newCourse.title) return
    setSaving(true)
    try {
      const { createCourse } = await import('../../../src/graphql/mutations')
      await client.graphql({ query: createCourse, variables: { input: newCourse } })
      setNewCourse({ title: '', description: '', gradeLevel: '' })
      setShowAddCourse(false)
      fetchCourses()
    } catch (err) {
      console.error('Error creating course:', err)
    } finally {
      setSaving(false)
    }
  }

  if (checking) return null

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: '0 0 6px' }}>
              Lesson Library
            </h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: '0 0 36px' }}>
              Choose a course to view and edit its lessons.
            </p>
          </div>
          {!showAddCourse && (
            <button
              onClick={() => setShowAddCourse(true)}
              style={{ background: 'var(--background)', color: 'var(--gray-dark)', border: '1px dashed var(--gray-light)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Course
            </button>
          )}
        </div>

        {showAddCourse && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '20px' }}>New Course</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course Title</label>
                <input type="text" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. Algebra 2" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input type="text" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Short description" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Grade Level</label>
                <input type="text" value={newCourse.gradeLevel} onChange={e => setNewCourse({ ...newCourse, gradeLevel: e.target.value })} placeholder="e.g. 10" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={addCourse} disabled={saving}
                style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                {saving ? 'Saving...' : 'Save Course'}
              </button>
              <button onClick={() => setShowAddCourse(false)}
                style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => router.push('/teacher/library/' + course.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '20px 24px',
                background: 'var(--background)',
                border: '1px solid var(--gray-light)',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--plum)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gray-light)')}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                  {course.title}
                </div>
                {course.gradeLevel && (
                  <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>Grade {course.gradeLevel}</div>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 3l5 5-5 5" stroke="var(--gray-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
