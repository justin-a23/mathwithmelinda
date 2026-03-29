'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../../components/ThemeToggle'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const listStudentProfilesQuery = /* GraphQL */`
  query ListStudentProfiles {
    listStudentProfiles(limit: 500) {
      items {
        id
        userId
        email
        firstName
        lastName
        gradeLevel
        courseId
        planType
        profilePictureKey
        status
      }
    }
  }
`

const listCoursesQuery = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items {
        id
        title
        isArchived
      }
    }
  }
`

const listSemestersQuery = /* GraphQL */`
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id
        name
        startDate
        endDate
        isActive
        courseId
      }
    }
  }
`

const listEnrollmentsQuery = /* GraphQL */`
  query ListEnrollments {
    listEnrollments(limit: 1000) {
      items {
        id
        studentId
        semesterEnrollmentsId
        courseEnrollmentsId
      }
    }
  }
`

const createEnrollmentMutation = /* GraphQL */`
  mutation CreateEnrollment($input: CreateEnrollmentInput!) {
    createEnrollment(input: $input) {
      id
      studentId
      semesterEnrollmentsId
      courseEnrollmentsId
    }
  }
`

const deleteEnrollmentMutation = /* GraphQL */`
  mutation DeleteEnrollment($input: DeleteEnrollmentInput!) {
    deleteEnrollment(input: $input) { id }
  }
`

const listParentInvitesQuery = /* GraphQL */`
  query ListParentInvites {
    listParentInvites(limit: 200) {
      items {
        id
        token
        studentEmail
        studentName
        used
        createdAt
      }
    }
  }
`

const createParentInvite = /* GraphQL */`
  mutation CreateParentInvite($input: CreateParentInviteInput!) {
    createParentInvite(input: $input) {
      id
      token
      studentEmail
      studentName
      used
      createdAt
    }
  }
`

const deleteParentInvite = /* GraphQL */`
  mutation DeleteParentInvite($input: DeleteParentInviteInput!) {
    deleteParentInvite(input: $input) {
      id
    }
  }
`

type Student = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  gradeLevel?: string | null
  courseId?: string | null
  planType?: string | null
  profilePictureKey?: string | null
  status?: string | null
}

type Course = { id: string; title: string; isArchived: boolean | null }

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
}

type Enrollment = {
  id: string
  studentId: string
  semesterEnrollmentsId: string | null
  courseEnrollmentsId: string | null
}

type Invite = {
  id: string
  token: string
  studentEmail: string
  studentName: string
  used: boolean | null
  createdAt: string
}

function randomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function StudentsPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [togglingEnrollment, setTogglingEnrollment] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [profilePicUrls, setProfilePicUrls] = useState<Record<string, string>>({})

  const [filterCourse, setFilterCourse] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', gradeLevel: '', courseId: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Parent invite form
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    Promise.all([fetchStudents(), fetchCourses(), fetchSemesters(), fetchEnrollments(), fetchInvites()])
      .finally(() => setLoading(false))
  }, [])

  async function fetchStudents() {
    const result = await client.graphql({ query: listStudentProfilesQuery }) as any
    const items = result.data.listStudentProfiles.items as Student[]
    setStudents(items)
    // Load profile pic URLs for students that have one
    const withPics = items.filter(s => s.profilePictureKey)
    if (withPics.length > 0) {
      const entries = await Promise.all(
        withPics.map(async s => {
          try {
            const res = await fetch('/api/profile-pic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'view', key: s.profilePictureKey })
            })
            const { url } = await res.json()
            return [s.id, url] as [string, string]
          } catch {
            return null
          }
        })
      )
      const urlMap: Record<string, string> = {}
      for (const entry of entries) {
        if (entry) urlMap[entry[0]] = entry[1]
      }
      setProfilePicUrls(urlMap)
    }
  }

  async function fetchCourses() {
    const result = await client.graphql({ query: listCoursesQuery }) as any
    setCourses((result.data.listCourses.items as Course[]).filter(c => !c.isArchived))
  }

  async function fetchSemesters() {
    const result = await client.graphql({ query: listSemestersQuery }) as any
    const items = result.data.listSemesters.items as Semester[]
    setSemesters(items.sort((a, b) => b.startDate.localeCompare(a.startDate)))
  }

  async function fetchEnrollments() {
    const result = await client.graphql({ query: listEnrollmentsQuery }) as any
    setEnrollments(result.data.listEnrollments.items as Enrollment[])
  }

  async function toggleEnrollment(student: Student, semester: Semester) {
    const key = `${student.userId}-${semester.id}`
    setTogglingEnrollment(key)
    try {
      const existing = enrollments.find(
        e => e.studentId === student.userId && e.semesterEnrollmentsId === semester.id
      )
      if (existing) {
        await (client.graphql({ query: deleteEnrollmentMutation, variables: { input: { id: existing.id } } }) as any)
        setEnrollments(prev => prev.filter(e => e.id !== existing.id))
      } else {
        const result = await (client.graphql({
          query: createEnrollmentMutation,
          variables: { input: { studentId: student.userId, courseEnrollmentsId: student.courseId, semesterEnrollmentsId: semester.id } }
        }) as any)
        setEnrollments(prev => [...prev, result.data.createEnrollment])
      }
    } catch (err) {
      console.error('Error toggling enrollment:', err)
    } finally {
      setTogglingEnrollment(null)
    }
  }

  async function fetchInvites() {
    const result = await client.graphql({ query: listParentInvitesQuery }) as any
    const items = result.data.listParentInvites.items as Invite[]
    setInvites(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  function startEdit(s: Student) {
    setEditingId(s.id)
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      gradeLevel: s.gradeLevel || '',
      courseId: s.courseId || '',
    })
  }

  async function saveEdit(id: string) {
    setSavingEdit(true)
    try {
      const { updateStudentProfile } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: updateStudentProfile,
        variables: { input: { id, ...editForm } }
      })
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s))
      setEditingId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingEdit(false)
    }
  }

  async function removeStudent(id: string) {
    setRemoving(true)
    try {
      const { updateStudentProfile } = await import('../../../src/graphql/mutations')
      await client.graphql({ query: updateStudentProfile, variables: { input: { id, status: 'removed' } } })
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'removed' } : s))
      setRemoveConfirmId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setRemoving(false)
    }
  }

  async function reinstateStudent(id: string) {
    try {
      const { updateStudentProfile } = await import('../../../src/graphql/mutations')
      await client.graphql({ query: updateStudentProfile, variables: { input: { id, status: 'active' } } })
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s))
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteStudentCompletely(s: Student) {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: s.email, profileId: s.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      setStudents(prev => prev.filter(st => st.id !== s.id))
      setDeleteConfirmId(null)
    } catch (err: any) {
      console.error(err)
      setDeleteError(err.message || 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  async function createInvite() {
    if (!studentName.trim() || !studentEmail.trim()) return
    setCreating(true)
    try {
      const token = randomToken()
      const result = await client.graphql({
        query: createParentInvite,
        variables: { input: { token, studentName: studentName.trim(), studentEmail: studentEmail.trim().toLowerCase(), used: false } }
      }) as any
      setInvites(prev => [result.data.createParentInvite, ...prev])
      setStudentName('')
      setStudentEmail('')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  async function deleteInvite(id: string) {
    await client.graphql({ query: deleteParentInvite, variables: { input: { id } } })
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  function copyLink(invite: Invite) {
    const origin = window.location.origin
    navigator.clipboard.writeText(origin + '/parent/accept/' + invite.token)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const courseMap: Record<string, string> = {}
  for (const c of courses) courseMap[c.id] = c.title

  const inviteMap: Record<string, Invite> = {}
  for (const inv of invites) inviteMap[inv.studentEmail.toLowerCase()] = inv

  const activeStudents = students.filter(s => s.status !== 'removed')
  const removedStudents = students.filter(s => s.status === 'removed')

  const filteredStudents = activeStudents
    .filter(s => {
      if (filterCourse !== 'all' && s.courseId !== filterCourse) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (s.firstName + ' ' + s.lastName).toLowerCase()
        if (!name.includes(q) && !s.email.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      const nameA = a.firstName + ' ' + a.lastName
      const nameB = b.firstName + ' ' + b.lastName
      return nameA.localeCompare(nameB)
    })

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid var(--gray-light)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    width: '100%',
    boxSizing: 'border-box',
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mathwithmelinda.com'

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', marginLeft: '8px' }}>Teacher</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={() => router.push('/teacher/profile')} title="My Profile" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            My Profile
          </button>
          <button onClick={() => router.push('/teacher')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Back
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>

        {/* ── STUDENTS ROSTER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '6px' }}>Students</h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>{activeStudents.length} enrolled across {courses.length} courses</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: '220px' }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterCourse('all')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: filterCourse === 'all' ? 'var(--plum)' : 'var(--gray-light)', color: filterCourse === 'all' ? 'white' : 'var(--gray-dark)' }}>
              All ({activeStudents.length})
            </button>
            {courses.map(c => {
              const count = activeStudents.filter(s => s.courseId === c.id).length
              return (
                <button key={c.id}
                  onClick={() => setFilterCourse(c.id)}
                  style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: filterCourse === c.id ? 'var(--plum)' : 'var(--gray-light)', color: filterCourse === c.id ? 'white' : 'var(--gray-dark)' }}>
                  {c.title} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Student list */}
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px', fontStyle: 'italic' }}>No students match your filters.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '56px' }}>
            {filteredStudents.map(s => {
              const isEditing = editingId === s.id
              const isRemoving = removeConfirmId === s.id
              const invite = inviteMap[s.email.toLowerCase()]
              const courseName = s.courseId ? (courseMap[s.courseId] || 'Unknown course') : ''
              const studentEnrollments = enrollments.filter(e => e.studentId === s.userId)
              const enrolledSemesters = semesters.filter(sem =>
                studentEnrollments.some(e => e.semesterEnrollmentsId === sem.id)
              )
              const courseSemesters = semesters.filter(sem => sem.courseId === s.courseId)

              return (
                <div key={s.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

                  {/* Main row */}
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Avatar */}
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid var(--plum-mid)' }}>
                      {profilePicUrls[s.id] ? (
                        <img src={profilePicUrls[s.id]} alt={s.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--plum)' }}>
                          {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</span>
                        {courseName && (
                          <span style={{ background: 'var(--plum-light)', color: 'var(--plum)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px' }}>{courseName}</span>
                        )}
                        {s.gradeLevel && (
                          <span style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>Grade {s.gradeLevel}</span>
                        )}
                        {enrolledSemesters.map(sem => (
                          <span key={sem.id} style={{ background: sem.isActive ? '#ede9fe' : 'var(--gray-light)', color: sem.isActive ? '#6d28d9' : 'var(--gray-dark)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px' }}>
                            {sem.name}{sem.isActive ? ' ●' : ''}
                          </span>
                        ))}
                        {invite && (
                          <span style={{ background: invite.used ? '#D1FAE5' : '#FEF3C7', color: invite.used ? '#065F46' : '#92400E', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                            {invite.used ? 'Parent linked' : 'Invite pending'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{s.email}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <a href={'mailto:' + s.email}
                        style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none', display: 'inline-block' }}
                        title="Email student">
                        ✉
                      </a>
                      <button
                        onClick={() => isEditing ? setEditingId(null) : startEdit(s)}
                        style={{ background: isEditing ? 'var(--plum-light)' : 'transparent', color: isEditing ? 'var(--plum)' : 'var(--gray-mid)', border: '1px solid ' + (isEditing ? 'var(--plum-mid)' : 'var(--gray-light)'), padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => setRemoveConfirmId(isRemoving ? null : s.id)}
                        style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {isEditing && (
                    <div style={{ borderTop: '1px solid var(--gray-light)', padding: '16px 20px', background: 'var(--gray-light)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>First Name</label>
                          <input style={inputStyle} value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Last Name</label>
                          <input style={inputStyle} value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Email</label>
                          <input style={inputStyle} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Grade Level</label>
                          <input style={inputStyle} value={editForm.gradeLevel} onChange={e => setEditForm(f => ({ ...f, gradeLevel: e.target.value }))} placeholder="e.g. 9" />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Course</label>
                          <select style={inputStyle} value={editForm.courseId} onChange={e => setEditForm(f => ({ ...f, courseId: e.target.value }))}>
                            <option value="">No course</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Semester Enrollments */}
                      {courseSemesters.length > 0 && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-light)' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Term Enrollment
                          </label>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {courseSemesters.map(sem => {
                              const enrolled = studentEnrollments.some(e => e.semesterEnrollmentsId === sem.id)
                              const toggling = togglingEnrollment === `${s.userId}-${sem.id}`
                              return (
                                <button
                                  key={sem.id}
                                  onClick={() => toggleEnrollment(s, sem)}
                                  disabled={toggling}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    cursor: toggling ? 'wait' : 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    fontFamily: 'var(--font-body)',
                                    borderColor: enrolled ? 'var(--plum)' : 'var(--gray-light)',
                                    background: enrolled ? 'var(--plum)' : 'var(--background)',
                                    color: enrolled ? 'white' : 'var(--gray-mid)',
                                    opacity: toggling ? 0.6 : 1,
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                  }}
                                >
                                  {enrolled ? '✓ ' : ''}{sem.name}
                                  {sem.isActive && <span style={{ fontSize: '9px', opacity: 0.8 }}>ACTIVE</span>}
                                </button>
                              )
                            })}
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '8px 0 0' }}>
                            Click to enroll or unenroll. Enrollments appear in the gradebook.
                          </p>
                        </div>
                      )}
                      {courseSemesters.length === 0 && s.courseId && (
                        <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '12px 0 0', fontStyle: 'italic' }}>
                          No terms exist for this course yet. Create one under Terms.
                        </p>
                      )}

                      <div style={{ marginTop: '16px' }}>
                      <button onClick={() => saveEdit(s.id)} disabled={savingEdit}
                        style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                      </div>
                    </div>
                  )}

                  {/* Remove confirm */}
                  {isRemoving && (
                    <div style={{ borderTop: '1px solid #fca5a5', padding: '12px 20px', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#b91c1c', flex: 1 }}>Remove {s.firstName} {s.lastName}? This cannot be undone.</span>
                      <button onClick={() => removeStudent(s.id)} disabled={removing}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        {removing ? 'Removing...' : 'Yes, Remove'}
                      </button>
                      <button onClick={() => setRemoveConfirmId(null)}
                        style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── REMOVED STUDENTS ── */}
        {removedStudents.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#b91c1c', marginBottom: '12px' }}>
              Removed ({removedStudents.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {removedStudents.map(s => {
                const isDeleteConfirm = deleteConfirmId === s.id
                return (
                  <div key={s.id} style={{ background: 'var(--background)', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', overflow: 'hidden', opacity: 0.85 }}>
                    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #fca5a5' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>{s.firstName.charAt(0)}{s.lastName.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</span>
                        <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{s.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => reinstateStudent(s.id)}
                          style={{ background: 'transparent', color: '#16a34a', border: '1px solid #86efac', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                          Reinstate
                        </button>
                        <button onClick={() => { setDeleteConfirmId(isDeleteConfirm ? null : s.id); setDeleteError(null) }}
                          style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                          Delete
                        </button>
                      </div>
                    </div>

                    {isDeleteConfirm && (
                      <div style={{ borderTop: '1px solid #fca5a5', padding: '12px 20px', background: '#FEF2F2' }}>
                        <p style={{ fontSize: '13px', color: '#b91c1c', margin: '0 0 10px', fontWeight: 500 }}>
                          Permanently delete {s.firstName} {s.lastName}? This removes them from Cognito completely and cannot be undone.
                        </p>
                        {deleteError && (
                          <p style={{ fontSize: '12px', color: '#b91c1c', margin: '0 0 8px' }}>{deleteError}</p>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => deleteStudentCompletely(s)} disabled={deleting}
                            style={{ background: '#b91c1c', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500 }}>
                            {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                          </button>
                          <button onClick={() => { setDeleteConfirmId(null); setDeleteError(null) }}
                            style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PARENT INVITES ── */}
        <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '6px' }}>Parent Invites</h2>
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px', marginBottom: '28px' }}>Generate a link for a parent to create their account and view their child's grades.</p>

          {/* Create invite */}
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Student Name</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Emma Johnson"
                  style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Student Email</label>
                <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="emma@example.com"
                  onKeyDown={e => { if (e.key === 'Enter') createInvite() }}
                  style={{ ...inputStyle }} />
              </div>
              <button onClick={createInvite} disabled={creating || !studentName.trim() || !studentEmail.trim()}
                style={{ background: (!studentName.trim() || !studentEmail.trim()) ? 'var(--gray-light)' : 'var(--plum)', color: (!studentName.trim() || !studentEmail.trim()) ? 'var(--gray-mid)' : 'white', padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {creating ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </div>

          {/* Invite list */}
          {invites.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No invites yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invites.map(invite => (
                <div key={invite.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)' }}>{invite.studentName}</span>
                      <span style={{ background: invite.used ? '#D1FAE5' : '#FEF3C7', color: invite.used ? '#065F46' : '#92400E', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                        {invite.used ? 'Claimed' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>{invite.studentEmail}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-mid)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {baseUrl}/parent/accept/{invite.token}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => copyLink(invite)}
                      style={{ background: copiedId === invite.id ? '#D1FAE5' : 'var(--plum-light)', color: copiedId === invite.id ? '#065F46' : 'var(--plum)', border: '1px solid ' + (copiedId === invite.id ? '#6EE7B7' : 'var(--plum-mid)'), padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                      {copiedId === invite.id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button onClick={() => deleteInvite(invite.id)}
                      style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
