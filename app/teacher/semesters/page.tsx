'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const LIST_COURSES = /* GraphQL */ `
  query ListCourses {
    listCourses(limit: 100) {
      items { id title }
    }
  }
`

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent testWeightPercent quizWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
      }
    }
  }
`

const CREATE_SEMESTER = /* GraphQL */ `
  mutation CreateSemester($input: CreateSemesterInput!) {
    createSemester(input: $input) {
      id name startDate endDate isActive courseId
      lessonWeightPercent testWeightPercent quizWeightPercent
      gradeA gradeB gradeC gradeD
      course { id title }
    }
  }
`

const UPDATE_SEMESTER = /* GraphQL */ `
  mutation UpdateSemester($input: UpdateSemesterInput!) {
    updateSemester(input: $input) { id }
  }
`

const DELETE_SEMESTER = /* GraphQL */ `
  mutation DeleteSemester($input: DeleteSemesterInput!) {
    deleteSemester(input: $input) { id }
  }
`

type Course = { id: string; title: string }

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

type FormState = {
  id: string | null
  name: string
  courseId: string
  startDate: string
  endDate: string
  isActive: boolean
  lessonWeight: string
  quizWeight: string
  testWeight: string
  gradeA: string
  gradeB: string
  gradeC: string
  gradeD: string
}

const DEFAULT_FORM: FormState = {
  id: null,
  name: '',
  courseId: '',
  startDate: '',
  endDate: '',
  isActive: false,
  lessonWeight: '60',
  quizWeight: '20',
  testWeight: '20',
  gradeA: '90',
  gradeB: '80',
  gradeC: '70',
  gradeD: '60',
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

export default function SemestersPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [coursesRes, semestersRes] = await Promise.all([
        client.graphql({ query: LIST_COURSES }) as any,
        client.graphql({ query: LIST_SEMESTERS }) as any,
      ])
      setCourses(coursesRes.data.listCourses.items)
      const sorted = [...semestersRes.data.listSemesters.items].sort(
        (a: Semester, b: Semester) => b.startDate.localeCompare(a.startDate)
      )
      setSemesters(sorted)
    } catch (err) {
      console.error('Error loading semesters:', err)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function openEdit(sem: Semester) {
    setForm({
      id: sem.id,
      name: sem.name,
      courseId: sem.courseId || '',
      startDate: sem.startDate,
      endDate: sem.endDate,
      isActive: sem.isActive ?? false,
      lessonWeight: String(sem.lessonWeightPercent ?? 60),
      quizWeight: String(sem.quizWeightPercent ?? 20),
      testWeight: String(sem.testWeightPercent ?? 20),
      gradeA: String(sem.gradeA ?? 90),
      gradeB: String(sem.gradeB ?? 80),
      gradeC: String(sem.gradeC ?? 70),
      gradeD: String(sem.gradeD ?? 60),
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
  }

  async function saveSemester() {
    if (!form.name || !form.courseId || !form.startDate || !form.endDate) return
    setSaving(true)
    try {
      if (form.id) {
        await (client.graphql({
          query: UPDATE_SEMESTER,
          variables: {
            input: {
              id: form.id,
              name: form.name,
              courseId: form.courseId,
              startDate: form.startDate,
              endDate: form.endDate,
              isActive: form.isActive,
              lessonWeightPercent: parseInt(form.lessonWeight) || 0,
              quizWeightPercent: parseInt(form.quizWeight) || 0,
              testWeightPercent: parseInt(form.testWeight) || 0,
              gradeA: parseInt(form.gradeA) || 0,
              gradeB: parseInt(form.gradeB) || 0,
              gradeC: parseInt(form.gradeC) || 0,
              gradeD: parseInt(form.gradeD) || 0,
            },
          },
        }) as any)
      } else {
        await (client.graphql({
          query: CREATE_SEMESTER,
          variables: {
            input: {
              name: form.name,
              courseId: form.courseId,
              startDate: form.startDate,
              endDate: form.endDate,
              isActive: form.isActive,
              lessonWeightPercent: parseInt(form.lessonWeight) || 0,
              quizWeightPercent: parseInt(form.quizWeight) || 0,
              testWeightPercent: parseInt(form.testWeight) || 0,
              gradeA: parseInt(form.gradeA) || 0,
              gradeB: parseInt(form.gradeB) || 0,
              gradeC: parseInt(form.gradeC) || 0,
              gradeD: parseInt(form.gradeD) || 0,
            },
          },
        }) as any)
      }
      cancelForm()
      await loadData()
    } catch (err) {
      console.error('Error saving semester:', err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSemester(id: string) {
    if (!confirm('Delete this term? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await (client.graphql({ query: DELETE_SEMESTER, variables: { input: { id } } }) as any)
      setSemesters(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting semester:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const weightSum = (parseInt(form.lessonWeight) || 0) + (parseInt(form.quizWeight) || 0) + (parseInt(form.testWeight) || 0)
  const weightOk = weightSum === 100

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

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Academic Year</h1>
            <p style={{ color: 'var(--gray-mid)', margin: 0 }}>Manage academic terms and grading weights.</p>
          </div>
          {!showForm && (
            <button
              onClick={openCreate}
              style={{ background: 'var(--plum)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              + New Term
            </button>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '24px', marginTop: 0 }}>
              {form.id ? 'Edit Term' : 'New Term'}
            </h2>

            {/* Row 1: Name + Course */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spring 2026"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Course</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                  style={inputStyle}>
                  <option value="">Select a course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--plum)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500 }}>Mark as active term</span>
              </label>
            </div>

            {/* Weights */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Grading Weights</label>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: weightOk ? '#dcfce7' : '#fee2e2',
                  color: weightOk ? '#16a34a' : '#dc2626',
                }}>
                  Sum: {weightSum}%{weightOk ? ' ✓' : ' — must equal 100'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Lessons %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.lessonWeight}
                    onChange={e => setForm(f => ({ ...f, lessonWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Participation %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.quizWeight}
                    onChange={e => setForm(f => ({ ...f, quizWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tests %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.testWeight}
                    onChange={e => setForm(f => ({ ...f, testWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Grade cutoffs */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Grade Cutoffs</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                {(['gradeA', 'gradeB', 'gradeC', 'gradeD'] as const).map(key => (
                  <div key={key}>
                    <label style={labelStyle}>{key.replace('grade', '')} ≥</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      onFocus={e => e.target.select()}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveSemester}
                disabled={saving || !weightOk || !form.name || !form.courseId || !form.startDate || !form.endDate}
                style={{
                  background: 'var(--plum)',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: (saving || !weightOk || !form.name || !form.courseId || !form.startDate || !form.endDate) ? 0.6 : 1,
                }}>
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Term'}
              </button>
              <button
                onClick={cancelForm}
                style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Semester list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '100px', borderRadius: 'var(--radius)', background: 'var(--gray-light)', opacity: 0.5 }} />
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--gray-mid)' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No terms yet.</p>
            <p style={{ fontSize: '14px' }}>Click "New Term" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {semesters.map(sem => (
              <div
                key={sem.id}
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: 'var(--radius)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + active badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{sem.name}</span>
                    {sem.isActive && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                        Active
                      </span>
                    )}
                  </div>

                  {/* Course name */}
                  {sem.course && (
                    <div style={{ fontSize: '13px', color: 'var(--plum)', marginBottom: '6px', fontWeight: 500 }}>
                      {sem.course.title}
                    </div>
                  )}

                  {/* Date range */}
                  {sem.startDate && sem.endDate && (
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                      {formatDateRange(sem.startDate, sem.endDate)}
                    </div>
                  )}

                  {/* Weights + cutoffs */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '3px 10px', borderRadius: '20px' }}>
                      Lessons {sem.lessonWeightPercent ?? 60}% · Participation {sem.quizWeightPercent ?? 20}% · Tests {sem.testWeightPercent ?? 20}%
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '3px 10px', borderRadius: '20px' }}>
                      A≥{sem.gradeA ?? 90} B≥{sem.gradeB ?? 80} C≥{sem.gradeC ?? 70} D≥{sem.gradeD ?? 60}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(sem)}
                    style={{ background: 'transparent', color: 'var(--plum)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--plum)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSemester(sem.id)}
                    disabled={deletingId === sem.id}
                    style={{ background: 'transparent', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', border: '1px solid #fca5a5', cursor: 'pointer', fontSize: '13px', opacity: deletingId === sem.id ? 0.6 : 1 }}>
                    {deletingId === sem.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
