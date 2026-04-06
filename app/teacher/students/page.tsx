'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
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
        statusReason
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
        parentEmail
        parentFirstName
        parentLastName
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
      parentEmail
      parentFirstName
      parentLastName
      createdAt
    }
  }
`

const createStudentInvite = /* GraphQL */`
  mutation CreateStudentInvite($input: CreateStudentInviteInput!) {
    createStudentInvite(input: $input) {
      id token firstName lastName email courseId courseTitle planType parentEmail used
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

const listStudentInvitesQuery = /* GraphQL */`
  query ListStudentInvites {
    listStudentInvites(limit: 500) {
      items {
        id token firstName lastName email courseId courseTitle semesterId planType used createdAt
      }
    }
  }
`

const deleteStudentInvite = /* GraphQL */`
  mutation DeleteStudentInvite($input: DeleteStudentInviteInput!) {
    deleteStudentInvite(input: $input) { id }
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
  statusReason?: string | null
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
  parentEmail: string | null
  parentFirstName: string | null
  parentLastName: string | null
  createdAt: string
}

type StudentInviteRecord = {
  id: string
  token: string
  firstName: string
  lastName: string
  email: string
  courseId: string | null
  courseTitle: string | null
  semesterId: string | null
  planType: string
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

  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [yearEndConfirm, setYearEndConfirm] = useState(false)
  const [yearEndRunning, setYearEndRunning] = useState(false)
  const [yearEndProgress, setYearEndProgress] = useState({ done: 0, total: 0 })

  // Pending approval modal
  const [approveStudent, setApproveStudent] = useState<Student | null>(null)
  // Decline modal
  const [declineStudent, setDeclineStudent] = useState<Student | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [approveCourseId, setApproveCourseId] = useState('')
  const [approvePlanType, setApprovePlanType] = useState('')
  const [approveGradeLevel, setApproveGradeLevel] = useState('')
  const [approveSemesterId, setApproveSemesterId] = useState('')
  const [approving, setApproving] = useState(false)

  // Student invites (sent, pending/used)
  const [studentInvites, setStudentInvites] = useState<StudentInviteRecord[]>([])
  const [copiedStudentInviteId, setCopiedStudentInviteId] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)

  // Per-student parent invite modal
  const [inviteParentStudent, setInviteParentStudent] = useState<Student | null>(null)
  const [inviteParentFirstName, setInviteParentFirstName] = useState('')
  const [inviteParentLastName, setInviteParentLastName] = useState('')
  const [inviteParentEmail, setInviteParentEmail] = useState('')
  const [inviteParentCreating, setInviteParentCreating] = useState(false)
  const [inviteParentCopied, setInviteParentCopied] = useState<string | null>(null)

  // Parent invite list actions
  const [copiedParentInviteId, setCopiedParentInviteId] = useState<string | null>(null)
  const [deletingParentInviteId, setDeletingParentInviteId] = useState<string | null>(null)
  const [resendingParentInviteId, setResendingParentInviteId] = useState<string | null>(null)

  // Add Co-op Student form
  const [showCoopForm, setShowCoopForm] = useState(false)
  const [coopFirstName, setCoopFirstName] = useState('')
  const [coopLastName, setCoopLastName] = useState('')
  const [coopEmail, setCoopEmail] = useState('')
  const [coopCourseId, setCoopCourseId] = useState('')
  const [coopParentFirstName, setCoopParentFirstName] = useState('')
  const [coopParentLastName, setCoopParentLastName] = useState('')
  const [coopParentEmail, setCoopParentEmail] = useState('')
  const [coopSemesterId, setCoopSemesterId] = useState('')
  const [coopCreating, setCoopCreating] = useState(false)
  const [coopResult, setCoopResult] = useState<{ studentLink: string; parentLink: string; studentName: string; studentEmail: string; parentEmail: string; emailSentToStudent: boolean; emailSentToParent: boolean } | null>(null)
  const [copiedCoopLink, setCopiedCoopLink] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    Promise.all([fetchStudents(), fetchCourses(), fetchSemesters(), fetchEnrollments(), fetchInvites(), fetchStudentInvites()])
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
            const key = s.profilePictureKey!
            // Base64 data URLs stored directly — use as-is
            if (key.startsWith('data:')) return [s.id, key] as [string, string]
            // Legacy S3 key — fetch presigned URL
            const res = await fetch('/api/profile-pic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'view', key })
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

  async function fetchStudentInvites() {
    const result = await client.graphql({ query: listStudentInvitesQuery }) as any
    const items = result.data.listStudentInvites.items as StudentInviteRecord[]
    setStudentInvites(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  async function deleteStudentInviteRecord(id: string) {
    setDeletingInviteId(id)
    try {
      await client.graphql({ query: deleteStudentInvite, variables: { input: { id } } }) as any
      setStudentInvites(prev => prev.filter(i => i.id !== id))
    } catch (err) { console.error(err) }
    finally { setDeletingInviteId(null) }
  }

  async function resendStudentInviteEmail(inv: StudentInviteRecord) {
    setResendingInviteId(inv.id)
    const link = `${window.location.origin}/join/${inv.token}`
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inv.email,
          subject: `Reminder: Your Math with Melinda invite is waiting 🎓`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#1E1E2E">Hi ${inv.firstName}!</h2>
            <p style="color:#555;font-size:15px;line-height:1.6">Just a reminder — Melinda has set up your account for Math with Melinda${inv.courseTitle ? ` in <strong>${inv.courseTitle}</strong>` : ''}. Click the link below to get started.</p>
            <a href="${link}" style="display:inline-block;background:#7B4FA6;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin:16px 0">Create My Account →</a>
            <p style="color:#aaa;font-size:13px;word-break:break-all">${link}</p>
          </div>`,
          text: `Hi ${inv.firstName}!\n\nYour invite to Math with Melinda is waiting:\n${link}`,
        }),
      })
    } catch { /* non-fatal */ }
    finally { setResendingInviteId(null) }
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

  async function approveStudentFn() {
    if (!approveStudent || !approveCourseId || !approvePlanType) return
    setApproving(true)
    try {
      const { updateStudentProfile } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: updateStudentProfile,
        variables: {
          input: {
            id: approveStudent.id,
            status: 'active',
            courseId: approveCourseId,
            planType: approvePlanType,
            gradeLevel: approveGradeLevel || approveStudent.gradeLevel || null,
          }
        }
      })
      // Create enrollment (with optional semester)
      const enrollResult = await (client.graphql({
        query: createEnrollmentMutation,
        variables: {
          input: {
            studentId: approveStudent.userId,
            planType: approvePlanType,
            courseEnrollmentsId: approveCourseId,
            ...(approveSemesterId ? { semesterEnrollmentsId: approveSemesterId } : {}),
          }
        }
      }) as any)
      // Update local enrollment state so the semester badge appears immediately
      if (enrollResult.data?.createEnrollment) {
        setEnrollments(prev => [...prev, enrollResult.data.createEnrollment])
      }
      setStudents(prev => prev.map(s => s.id === approveStudent.id
        ? { ...s, status: 'active', courseId: approveCourseId, planType: approvePlanType, gradeLevel: approveGradeLevel || s.gradeLevel }
        : s
      ))
      setApproveStudent(null)
      setApproveCourseId('')
      setApprovePlanType('')
      setApproveGradeLevel('')
      setApproveSemesterId('')
      window.location.reload()
    } catch (err) {
      console.error('Error approving student:', err)
    } finally {
      setApproving(false)
    }
  }

  const updateProfileWithReasonMutation = /* GraphQL */`
    mutation UpdateStudentProfileStatus($input: UpdateStudentProfileInput!) {
      updateStudentProfile(input: $input) { id status statusReason }
    }
  `

  async function declineStudentFn() {
    if (!declineStudent) return
    setDeclining(true)
    try {
      await (client.graphql({
        query: updateProfileWithReasonMutation,
        variables: {
          input: {
            id: declineStudent.id,
            status: 'declined',
            statusReason: declineReason.trim() || null,
          }
        }
      }) as any)
      setStudents(prev => prev.map(s => s.id === declineStudent.id
        ? { ...s, status: 'declined' }
        : s
      ))
      setDeclineStudent(null)
      setDeclineReason('')
      window.location.reload()
    } catch (err) {
      console.error('Error declining student:', err)
    } finally {
      setDeclining(false)
    }
  }

  async function deleteStudentCompletely(s: Student) {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: s.userId, profileId: s.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      setStudents(prev => prev.filter(st => st.id !== s.id))
      setDeleteConfirmId(null)
      if (json.cognitoError) {
        // Profile deleted but Cognito removal failed — show persistent warning
        setDeleteError(`Profile removed from app. Note: Cognito account deletion failed (${json.cognitoError}) — you may need to remove them manually in the AWS console.`)
      }
    } catch (err: any) {
      console.error(err)
      setDeleteError(err.message || 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  async function archiveStudent(s: Student) {
    setArchivingId(s.id)
    setArchiveError(null)
    try {
      const res = await fetch('/api/archive-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: s.userId, profileId: s.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Archive failed')
      // Update local state: profile stays in list but as archived
      setStudents(prev => prev.map(st => st.id === s.id ? { ...st, status: 'archived' } : st))
      setArchiveConfirmId(null)
    } catch (err: any) {
      console.error(err)
      setArchiveError(err.message || 'Something went wrong')
    } finally {
      setArchivingId(null)
    }
  }

  async function archiveAllStudents() {
    const toArchive = activeStudents.filter(s => s.status === 'active')
    setYearEndRunning(true)
    setYearEndProgress({ done: 0, total: toArchive.length })
    let done = 0
    for (const s of toArchive) {
      try {
        await fetch('/api/archive-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: s.userId, profileId: s.id }),
        })
        setStudents(prev => prev.map(st => st.id === s.id ? { ...st, status: 'archived' } : st))
      } catch (err) {
        console.error('Failed to archive', s.firstName, s.lastName, err)
      }
      done++
      setYearEndProgress({ done, total: toArchive.length })
    }
    setYearEndRunning(false)
    setYearEndConfirm(false)
  }

  async function createParentInviteForStudent() {
    if (!inviteParentStudent || !inviteParentEmail.trim()) return
    const studentParentInvites = invites.filter(i => i.studentEmail.toLowerCase() === inviteParentStudent.email.toLowerCase())
    if (studentParentInvites.length >= 2) return
    setInviteParentCreating(true)
    try {
      const token = randomToken()
      const fullName = `${inviteParentStudent.firstName} ${inviteParentStudent.lastName}`
      const result = await client.graphql({
        query: createParentInvite,
        variables: {
          input: {
            token,
            studentName: fullName,
            studentEmail: inviteParentStudent.email.toLowerCase(),
            used: false,
            parentEmail: inviteParentEmail.trim().toLowerCase() || null,
            parentFirstName: inviteParentFirstName.trim() || null,
            parentLastName: inviteParentLastName.trim() || null,
          }
        }
      }) as any
      setInvites(prev => [result.data.createParentInvite, ...prev])
      const parentLink = `${window.location.origin}/parent/accept/${token}`
      const parentFirstName = inviteParentFirstName.trim() || 'there'
      // Check if this parent email already has other invites (returning parent)
      const isReturningParent = invites.some(i =>
        i.parentEmail?.toLowerCase() === inviteParentEmail.trim().toLowerCase() &&
        i.studentEmail.toLowerCase() !== inviteParentStudent.email.toLowerCase()
      )
      const emailSubject = isReturningParent
        ? `${fullName} has also been enrolled in Math with Melinda`
        : `${fullName} has been enrolled in Math with Melinda`
      const emailBody = isReturningParent
        ? `<p style="color:#555;font-size:15px;line-height:1.6"><strong>${fullName}</strong> has also been enrolled in Math with Melinda. Click below to connect them to your existing parent account — <strong>sign in</strong> (don't create a new account) to add ${fullName} to your portal.</p>`
        : `<p style="color:#555;font-size:15px;line-height:1.6"><strong>${fullName}</strong> is enrolled in Math with Melinda. Create your parent account to track their grades, assignments, and feedback from Melinda.</p>`
      const emailText = isReturningParent
        ? `Hi ${parentFirstName}!\n\n${fullName} has also been enrolled in Math with Melinda.\n\nSign in to your existing account to connect them:\n${parentLink}`
        : `Hi ${parentFirstName}!\n\n${fullName} is enrolled in Math with Melinda. Set up your parent account:\n${parentLink}`
      // Fire invite email
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inviteParentEmail.trim().toLowerCase(),
          subject: emailSubject,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="background:#1E1E2E;padding:16px 24px;border-radius:8px;margin-bottom:28px">
              <span style="color:white;font-size:18px;font-weight:600">Math with Melinda</span>
            </div>
            <h2 style="color:#1E1E2E">Hi ${parentFirstName}!</h2>
            ${emailBody}
            <a href="${parentLink}" style="display:inline-block;background:#0369a1;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin:16px 0">${isReturningParent ? 'Sign In & Connect →' : 'Set Up My Parent Account →'}</a>
            <p style="color:#aaa;font-size:13px;word-break:break-all">${parentLink}</p>
          </div>`,
          text: emailText,
        }),
      }).catch(() => {})
      setInviteParentFirstName('')
      setInviteParentLastName('')
      setInviteParentEmail('')
    } catch (err) {
      console.error(err)
    } finally {
      setInviteParentCreating(false)
    }
  }

  async function deleteInvite(id: string) {
    setDeletingParentInviteId(id)
    try {
      await client.graphql({ query: deleteParentInvite, variables: { input: { id } } })
      setInvites(prev => prev.filter(i => i.id !== id))
    } catch (err) { console.error(err) }
    finally { setDeletingParentInviteId(null) }
  }

  async function resendParentInviteEmail(inv: Invite) {
    if (!inv.parentEmail) return
    setResendingParentInviteId(inv.id)
    const link = `${window.location.origin}/parent/accept/${inv.token}`
    const parentFirstName = inv.parentFirstName || 'there'
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inv.parentEmail,
          subject: `Reminder: Your Math with Melinda parent invite is waiting`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="background:#1E1E2E;padding:16px 24px;border-radius:8px;margin-bottom:28px">
              <span style="color:white;font-size:18px;font-weight:600">Math with Melinda</span>
            </div>
            <h2 style="color:#1E1E2E">Hi ${parentFirstName}!</h2>
            <p style="color:#555;font-size:15px;line-height:1.6">Just a reminder — <strong>${inv.studentName}</strong> is enrolled in Math with Melinda. Set up your parent account to track their grades, assignments, and feedback.</p>
            <a href="${link}" style="display:inline-block;background:#0369a1;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin:16px 0">Set Up My Parent Account →</a>
            <p style="color:#aaa;font-size:13px;word-break:break-all">${link}</p>
          </div>`,
          text: `Hi ${parentFirstName}!\n\nReminder: ${inv.studentName} is enrolled in Math with Melinda. Set up your parent account:\n${link}`,
        }),
      })
    } catch { /* non-fatal */ }
    finally { setResendingParentInviteId(null) }
  }

  async function createCoopStudent() {
    if (!coopFirstName.trim() || !coopLastName.trim() || !coopEmail.trim()) return
    setCoopCreating(true)
    try {
      const studentToken = randomToken()
      const course = courses.find(c => c.id === coopCourseId)

      // Create student invite
      await (client.graphql({
        query: createStudentInvite,
        variables: {
          input: {
            token: studentToken,
            firstName: coopFirstName.trim(),
            lastName: coopLastName.trim(),
            email: coopEmail.trim().toLowerCase(),
            courseId: coopCourseId || null,
            courseTitle: course?.title || null,
            semesterId: coopSemesterId || null,
            planType: 'coop',
            parentFirstName: coopParentFirstName.trim() || null,
            parentLastName: coopParentLastName.trim() || null,
            parentEmail: coopParentEmail.trim().toLowerCase() || null,
            used: false,
          }
        }
      }) as any)

      // Create parent invite if parent email provided
      let parentLink = ''
      if (coopParentEmail.trim()) {
        const parentToken = randomToken()
        const studentFullName = `${coopFirstName.trim()} ${coopLastName.trim()}`
        await (client.graphql({
          query: createParentInvite,
          variables: {
            input: {
              token: parentToken,
              studentName: studentFullName,
              studentEmail: coopEmail.trim().toLowerCase(),
              used: false,
              parentEmail: coopParentEmail.trim().toLowerCase() || null,
              parentFirstName: coopParentFirstName.trim() || null,
              parentLastName: coopParentLastName.trim() || null,
            }
          }
        }) as any)
        parentLink = `${window.location.origin}/parent/accept/${parentToken}`
      }

      const studentLink = `${window.location.origin}/join/${studentToken}`
      const studentFullName = `${coopFirstName.trim()} ${coopLastName.trim()}`
      const courseTitle = course?.title || ''

      // Fire student email
      let emailSentToStudent = false
      try {
        const studentEmailRes = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: coopEmail.trim().toLowerCase(),
            subject: `You've been invited to Math with Melinda! 🎓`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
                <div style="background:#1E1E2E;padding:16px 24px;border-radius:8px;margin-bottom:28px;display:flex;align-items:center;gap:12px">
                  <div style="width:32px;height:32px;background:#7B4FA6;border-radius:6px;display:inline-flex;align-items:center;justify-content:center">
                    <span style="color:white;font-size:16px;font-weight:700">+</span>
                  </div>
                  <span style="color:white;font-size:18px;font-weight:600">Math with Melinda</span>
                </div>
                <h1 style="font-size:24px;color:#1E1E2E;margin:0 0 8px">Hi ${coopFirstName.trim()}! 👋</h1>
                <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
                  Melinda has enrolled you as a <strong>Co-op Student</strong>${courseTitle ? ` in <strong>${courseTitle}</strong>` : ''}.
                  Your personal account link is ready — click below to get started.
                </p>
                <a href="${studentLink}" style="display:inline-block;background:#7B4FA6;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin-bottom:24px">
                  Create My Account →
                </a>
                <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px">Or copy this link into your browser:</p>
                <p style="color:#7B4FA6;font-size:13px;word-break:break-all;margin:0 0 28px">${studentLink}</p>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                  <p style="font-size:12px;font-weight:700;color:#7B4FA6;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px">What you'll have access to</p>
                  <ul style="margin:0;padding-left:18px;color:#444;font-size:14px;line-height:2">
                    <li>Video lessons for your course</li>
                    <li>Weekly assignments from Melinda</li>
                    <li>Grades and teacher feedback</li>
                    <li>Direct messaging with Melinda</li>
                  </ul>
                </div>
                <p style="color:#aaa;font-size:12px;margin:0">Questions? Reply to this email or message Melinda directly through the platform.</p>
              </div>`,
            text: `Hi ${coopFirstName.trim()}!\n\nMelinda has enrolled you as a Co-op Student${courseTitle ? ` in ${courseTitle}` : ''}.\n\nClick this link to create your account:\n${studentLink}\n\nSee you in class!`,
          }),
        })
        emailSentToStudent = studentEmailRes.ok
        if (!studentEmailRes.ok) console.error('Student email failed:', await studentEmailRes.text())
      } catch { /* non-fatal */ }

      // Fire parent email
      let emailSentToParent = false
      if (coopParentEmail.trim() && parentLink) {
        try {
          const parentFirstName = coopParentFirstName.trim() || 'there'
          // Check if this parent already has an invite for another student (returning parent)
          const isReturningParent = invites.some(i =>
            i.parentEmail?.toLowerCase() === coopParentEmail.trim().toLowerCase()
          )
          const parentSubject = isReturningParent
            ? `${studentFullName} has also been enrolled in Math with Melinda`
            : `${studentFullName} has been enrolled in Math with Melinda`
          const parentBodyCopy = isReturningParent
            ? `<strong>${studentFullName}</strong> has also been enrolled in Math with Melinda as a Co-op Student${courseTitle ? ` in <strong>${courseTitle}</strong>` : ''}. <strong>Sign in to your existing account</strong> to connect them — don't create a new account.`
            : `<strong>${studentFullName}</strong> has been enrolled in Math with Melinda as a Co-op Student${courseTitle ? ` in <strong>${courseTitle}</strong>` : ''}. Set up your parent account to track their grades, assignments, and teacher feedback.`
          const parentButtonText = isReturningParent ? 'Sign In & Connect →' : 'Set Up My Parent Account →'
          const parentEmailRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: coopParentEmail.trim().toLowerCase(),
              subject: parentSubject,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
                  <div style="background:#1E1E2E;padding:16px 24px;border-radius:8px;margin-bottom:28px">
                    <span style="color:white;font-size:18px;font-weight:600">Math with Melinda</span>
                  </div>
                  <h1 style="font-size:24px;color:#1E1E2E;margin:0 0 8px">Hi ${parentFirstName}!</h1>
                  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">${parentBodyCopy}</p>
                  <a href="${parentLink}" style="display:inline-block;background:#0369a1;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin-bottom:24px">
                    ${parentButtonText}
                  </a>
                  <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px">Or copy this link into your browser:</p>
                  <p style="color:#0369a1;font-size:13px;word-break:break-all;margin:0 0 28px">${parentLink}</p>
                  ${!isReturningParent ? `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                    <p style="font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px">Your parent portal includes</p>
                    <ul style="margin:0;padding-left:18px;color:#444;font-size:14px;line-height:2">
                      <li>View grades and teacher feedback</li>
                      <li>See submitted assignments</li>
                      <li>Track progress and performance</li>
                    </ul>
                  </div>` : ''}
                  <p style="color:#aaa;font-size:12px;margin:0">Questions? Contact Melinda at melinda@mathwithmelinda.com</p>
                </div>`,
              text: isReturningParent
                ? `Hi ${parentFirstName}!\n\n${studentFullName} has also been enrolled in Math with Melinda${courseTitle ? ` in ${courseTitle}` : ''}.\n\nSign in to your existing account to connect them:\n${parentLink}`
                : `Hi ${parentFirstName}!\n\n${studentFullName} has been enrolled in Math with Melinda${courseTitle ? ` in ${courseTitle}` : ''}.\n\nSet up your parent account here:\n${parentLink}`,
            }),
          })
          emailSentToParent = parentEmailRes.ok
          if (!parentEmailRes.ok) console.error('Parent email failed:', await parentEmailRes.text())
        } catch { /* non-fatal */ }
      }

      setCoopResult({
        studentLink,
        parentLink,
        studentName: studentFullName,
        studentEmail: coopEmail.trim().toLowerCase(),
        parentEmail: coopParentEmail.trim().toLowerCase(),
        emailSentToStudent,
        emailSentToParent,
      })

      // Refresh invite lists so new records appear immediately
      fetchStudentInvites()
      fetchInvites()

      // Reset form fields
      setCoopFirstName('')
      setCoopLastName('')
      setCoopEmail('')
      setCoopCourseId('')
      setCoopSemesterId('')
      setCoopParentFirstName('')
      setCoopParentLastName('')
      setCoopParentEmail('')
    } catch (err) {
      console.error('Error creating co-op student:', err)
    } finally {
      setCoopCreating(false)
    }
  }

  function copyCoopLink(link: string, key: string) {
    navigator.clipboard.writeText(link)
    setCopiedCoopLink(key)
    setTimeout(() => setCopiedCoopLink(null), 2000)
  }

  const courseMap: Record<string, string> = {}
  for (const c of courses) courseMap[c.id] = c.title

  // Map studentEmail -> all parent invites for that student
  const parentInviteMap: Record<string, Invite[]> = {}
  for (const inv of invites) {
    const key = inv.studentEmail.toLowerCase()
    if (!parentInviteMap[key]) parentInviteMap[key] = []
    parentInviteMap[key].push(inv)
  }

  const pendingStudents = students.filter(s => s.status === 'pending')
  const activeStudents = students.filter(s => s.status !== 'removed' && s.status !== 'pending' && s.status !== 'declined' && s.status !== 'archived')
  const removedStudents = students.filter(s => s.status === 'removed')
  const declinedStudents = students.filter(s => s.status === 'declined')
  const archivedStudents = students.filter(s => s.status === 'archived')

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
      <TeacherNav />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>

        {/* ── DELETE ERROR BANNER ── */}
        {deleteError && !deleteConfirmId && (
          <div style={{ background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: '13px', color: '#b91c1c', flex: 1 }}>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* ── ARCHIVE ERROR BANNER ── */}
        {archiveError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: '13px', color: '#b91c1c', flex: 1 }}>{archiveError}</span>
            <button onClick={() => setArchiveError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* ── YEAR-END ARCHIVE MODAL ── */}
        {yearEndConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M21 8v13H3V8"/><path d="M23 3H1v5h22V3z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '10px' }}>End of Year — Archive All Students</h2>
              <p style={{ fontSize: '14px', color: 'var(--gray-mid)', lineHeight: 1.6, marginBottom: '16px' }}>
                This will archive all <strong>{activeStudents.filter(s => s.status === 'active').length} active students</strong>:
              </p>
              <ul style={{ fontSize: '13px', color: 'var(--gray-mid)', lineHeight: 1.8, paddingLeft: '20px', marginBottom: '20px' }}>
                <li>Their <strong>Cognito login is deleted</strong> — they cannot sign in next year</li>
                <li>All <strong>grades, submissions, and comments are preserved</strong> for your records</li>
                <li>Student names remain visible in the gradebook and grade history</li>
                <li>To re-enroll next year, they create a <strong>fresh account</strong> and you approve them again</li>
              </ul>
              {yearEndRunning && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
                    Archiving… {yearEndProgress.done} / {yearEndProgress.total}
                  </div>
                  <div style={{ height: '6px', background: 'var(--gray-light)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--plum)', borderRadius: '3px', width: `${yearEndProgress.total > 0 ? (yearEndProgress.done / yearEndProgress.total) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setYearEndConfirm(false)}
                  disabled={yearEndRunning}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'transparent', color: 'var(--gray-mid)', fontSize: '14px', cursor: yearEndRunning ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  Cancel
                </button>
                <button
                  onClick={archiveAllStudents}
                  disabled={yearEndRunning}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: yearEndRunning ? '#92400E' : '#D97706', color: 'white', fontSize: '14px', fontWeight: 600, cursor: yearEndRunning ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {yearEndRunning ? `Archiving ${yearEndProgress.done}/${yearEndProgress.total}…` : 'Archive All Students'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING APPROVAL ── */}
        {pendingStudents.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>
                {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} waiting for approval
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingStudents.map(s => (
                <div key={s.id} style={{ background: 'white', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>{s.firstName.charAt(0)}{s.lastName.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                      {s.email}
                      {s.gradeLevel ? ` · Grade ${s.gradeLevel}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setApproveStudent(s)
                      setApproveCourseId(s.courseId || '')
                      setApprovePlanType(s.planType || '')
                      setApproveGradeLevel(s.gradeLevel || '')
                      // Pre-select the active semester for the student's requested course
                      const activeSem = semesters.find(sem => sem.isActive && sem.courseId === s.courseId)
                      setApproveSemesterId(activeSem?.id || '')
                    }}
                    style={{ background: '#D97706', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setDeclineStudent(s); setDeclineReason('') }}
                    style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                  >
                    Decline
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APPROVAL MODAL ── */}
        {approveStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={e => { if (e.target === e.currentTarget) { setApproveStudent(null); setApproveSemesterId('') } }}>
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '6px' }}>Approve Student</h2>
              <p style={{ fontSize: '14px', color: 'var(--gray-mid)', marginBottom: '24px' }}>
                Set up <strong>{approveStudent.firstName} {approveStudent.lastName}</strong>&apos;s course and plan before granting access.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Course <span style={{ color: '#c0392b' }}>*</span></label>
                  <select value={approveCourseId} onChange={e => setApproveCourseId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}>
                    <option value="">Select a course…</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '8px' }}>Plan Type <span style={{ color: '#c0392b' }}>*</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Video Only', 'Virtual Student', 'Co-op Student'].map(pt => (
                      <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)' }}>
                        <input type="radio" name="approvePlanType" value={pt} checked={approvePlanType === pt} onChange={e => setApprovePlanType(e.target.value)}
                          style={{ accentColor: 'var(--plum)', width: '16px', height: '16px' }} />
                        {pt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Grade Level</label>
                  <select value={approveGradeLevel} onChange={e => setApproveGradeLevel(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}>
                    <option value="">Select grade…</option>
                    {['5th','6th','7th','8th','9th','10th','11th','12th'].map(g => <option key={g} value={g}>{g} Grade</option>)}
                  </select>
                </div>
                {(() => {
                  const courseSems = semesters.filter(sem => sem.courseId === approveCourseId)
                  if (courseSems.length === 0) return null
                  return (
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                        Academic Year <span style={{ color: 'var(--gray-mid)', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <select value={approveSemesterId} onChange={e => setApproveSemesterId(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}>
                        <option value="">No academic year</option>
                        {courseSems.map(sem => (
                          <option key={sem.id} value={sem.id}>
                            {sem.name}{sem.isActive ? ' (active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })()}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                <button onClick={() => { setApproveStudent(null); setApproveSemesterId('') }}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'transparent', color: 'var(--gray-mid)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Cancel
                </button>
                <button
                  onClick={approveStudentFn}
                  disabled={approving || !approveCourseId || !approvePlanType}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: approveCourseId && approvePlanType ? 'var(--plum)' : 'var(--gray-light)', color: approveCourseId && approvePlanType ? 'white' : 'var(--gray-mid)', fontSize: '14px', fontWeight: 600, cursor: approveCourseId && approvePlanType ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}>
                  {approving ? 'Approving…' : 'Approve & Grant Access'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DECLINE MODAL ── */}
        {declineStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={e => { if (e.target === e.currentTarget) { setDeclineStudent(null); setDeclineReason('') } }}>
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '6px' }}>Decline Request</h2>
              <p style={{ fontSize: '14px', color: 'var(--gray-mid)', marginBottom: '20px' }}>
                Decline <strong>{declineStudent.firstName} {declineStudent.lastName}</strong>&apos;s request to join. You can optionally provide a reason they&apos;ll see when they check for approval.
              </p>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                  Reason <span style={{ color: 'var(--gray-mid)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="e.g. We're full for this semester, please try again next term…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => { setDeclineStudent(null); setDeclineReason('') }}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'transparent', color: 'var(--gray-mid)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Cancel
                </button>
                <button
                  onClick={declineStudentFn}
                  disabled={declining}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 600, cursor: declining ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: declining ? 0.7 : 1 }}>
                  {declining ? 'Declining…' : 'Decline Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ROSTER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '6px' }}>Students</h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>{activeStudents.length} enrolled across {courses.length} courses</p>
          </div>
          {activeStudents.filter(s => s.status === 'active').length > 0 && (
            <button
              onClick={() => setYearEndConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '8px', border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v13H3V8"/><path d="M23 3H1v5h22V3z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              End of Year…
            </button>
          )}
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
              const studentParentInvites = parentInviteMap[s.email.toLowerCase()] || []
              const parentCount = studentParentInvites.length
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
                        {studentParentInvites.length > 0 && (
                          <span style={{ background: studentParentInvites.some(i => i.used) ? '#D1FAE5' : '#FEF3C7', color: studentParentInvites.some(i => i.used) ? '#065F46' : '#92400E', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                            {studentParentInvites.filter(i => i.used).length > 0 ? `${studentParentInvites.filter(i => i.used).length} parent linked` : 'Parent invite pending'}
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
                      {parentCount >= 2 ? (
                        <span style={{ fontSize: '11px', color: '#065F46', background: '#D1FAE5', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                          👨‍👩‍👧 2/2 Parents
                        </span>
                      ) : (
                        <button
                          onClick={() => { setInviteParentStudent(s); setInviteParentFirstName(''); setInviteParentLastName(''); setInviteParentEmail('') }}
                          style={{ background: 'transparent', color: '#0369a1', border: '1px solid #93C5FD', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {parentCount === 1 ? '+ 2nd Parent' : '+ Parent'}
                        </button>
                      )}
                      <button
                        onClick={() => isEditing ? setEditingId(null) : startEdit(s)}
                        style={{ background: isEditing ? 'var(--plum-light)' : 'transparent', color: isEditing ? 'var(--plum)' : 'var(--gray-mid)', border: '1px solid ' + (isEditing ? 'var(--plum-mid)' : 'var(--gray-light)'), padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => setArchiveConfirmId(archiveConfirmId === s.id ? null : s.id)}
                        style={{ background: archiveConfirmId === s.id ? '#FEF3C7' : 'transparent', color: '#92400E', border: '1px solid #FDE68A', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Archive
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
                          No terms exist for this course yet. Create one under Academic Year.
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

                  {/* Archive confirm */}
                  {archiveConfirmId === s.id && (
                    <div style={{ borderTop: '1px solid #FDE68A', padding: '12px 20px', background: '#FFFBEB', display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '13px', color: '#92400E', fontWeight: 500, marginBottom: '4px' }}>
                          Archive {s.firstName} {s.lastName} for the year?
                        </div>
                        <div style={{ fontSize: '12px', color: '#92400E', opacity: 0.8 }}>
                          Their login is removed — all grades and history are preserved. They re-enroll fresh next year.
                        </div>
                      </div>
                      <button onClick={() => archiveStudent(s)} disabled={archivingId === s.id}
                        style={{ background: '#D97706', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: archivingId === s.id ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {archivingId === s.id ? 'Archiving…' : 'Yes, Archive'}
                      </button>
                      <button onClick={() => setArchiveConfirmId(null)}
                        style={{ background: 'transparent', color: '#92400E', border: '1px solid #FDE68A', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Remove confirm */}
                  {isRemoving && (
                    <div style={{ borderTop: '1px solid #fca5a5', padding: '16px 20px', background: '#FEF2F2' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#b91c1c', marginBottom: '6px' }}>
                        Permanently remove {s.firstName} {s.lastName}?
                      </div>
                      <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 6px', lineHeight: 1.5 }}>
                        This deletes their account, all grades, submissions, and messages — everything. <strong>It cannot be undone.</strong>
                      </p>
                      <p style={{ fontSize: '12px', color: '#991b1b', margin: '0 0 14px', lineHeight: 1.5, fontStyle: 'italic' }}>
                        Only do this if the student has left the class and you no longer need any of their records. If you just want to hide them, use <strong>Archive</strong> instead.
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setRemoveConfirmId(null)}
                          style={{ flex: 1, background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          Cancel — Keep Student
                        </button>
                        <button onClick={() => removeStudent(s.id)} disabled={removing}
                          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: removing ? 0.7 : 1 }}>
                          {removing ? 'Removing...' : 'Yes, Delete Everything'}
                        </button>
                      </div>
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

        {/* ── DECLINED REQUESTS ── */}
        {declinedStudents.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '12px' }}>
              Declined Requests ({declinedStudents.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {declinedStudents.map(s => (
                <div key={s.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{s.email}</div>
                    {s.statusReason && (
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)', fontStyle: 'italic', marginTop: '2px' }}>
                        Reason: {s.statusReason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setDeleteConfirmId(s.id) }}
                    style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
                    Delete
                  </button>
                  {deleteConfirmId === s.id && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                      <div style={{ background: 'var(--background)', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%' }}>
                        <p style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '20px' }}>
                          Permanently delete <strong>{s.firstName} {s.lastName}</strong> and remove their Cognito account?
                        </p>
                        {deleteError && <p style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '12px' }}>{deleteError}</p>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => { setDeleteConfirmId(null); setDeleteError(null) }}
                            style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'transparent', color: 'var(--gray-mid)', fontSize: '13px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                          <button onClick={() => deleteStudentCompletely(s)} disabled={deleting}
                            style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                            {deleting ? 'Deleting…' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARCHIVED STUDENTS ── */}
        {archivedStudents.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <button
              onClick={() => setShowArchived(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', fontFamily: 'var(--font-body)' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>
                Archived — Past Students ({archivedStudents.length})
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showArchived && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {archivedStudents
                  .slice()
                  .sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName))
                  .map(s => {
                    const courseName = s.courseId ? (courseMap[s.courseId] || '') : ''
                    return (
                      <div key={s.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.75 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-mid)' }}>{s.firstName.charAt(0)}{s.lastName.charAt(0)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</span>
                            {courseName && (
                              <span style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{courseName}</span>
                            )}
                            <span style={{ background: 'var(--gray-light)', color: 'var(--gray-mid)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px' }}>Archived</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{s.email}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--gray-mid)', whiteSpace: 'nowrap' }}>History preserved</span>
                      </div>
                    )
                  })}
                <p style={{ fontSize: '12px', color: 'var(--gray-mid)', fontStyle: 'italic', marginTop: '4px' }}>
                  These students&apos; grades and submissions remain accessible in your gradebook and grade history. Their login has been removed — to re-enroll next year, they sign up fresh.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── ADD CO-OP STUDENT ── */}
        <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '48px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '6px' }}>Add Co-op Student</h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>Enter the student and parent info from the co-op roster. Generates invite links for both.</p>
            </div>
            {!showCoopForm && !coopResult && (
              <button
                onClick={() => setShowCoopForm(true)}
                style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                + Add Student
              </button>
            )}
          </div>

          {showCoopForm && !coopResult && (
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px', maxWidth: '640px' }}>

              {/* Student info */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Student Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>First Name <span style={{ color: '#c0392b' }}>*</span></label>
                  <input value={coopFirstName} onChange={e => setCoopFirstName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Last Name <span style={{ color: '#c0392b' }}>*</span></label>
                  <input value={coopLastName} onChange={e => setCoopLastName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Email Address <span style={{ color: '#c0392b' }}>*</span></label>
                  <input type="email" value={coopEmail} onChange={e => setCoopEmail(e.target.value)} placeholder="student@example.com" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Enrollment */}
              <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Enrollment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Course</label>
                    <select value={coopCourseId} onChange={e => { setCoopCourseId(e.target.value); setCoopSemesterId('') }} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}>
                      <option value="">Select course…</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Semester {!coopCourseId && <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--gray-mid)' }}>(pick course first)</span>}
                    </label>
                    <select
                      value={coopSemesterId}
                      onChange={e => setCoopSemesterId(e.target.value)}
                      disabled={!coopCourseId}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: coopSemesterId ? 'var(--foreground)' : 'var(--gray-mid)', boxSizing: 'border-box', opacity: !coopCourseId ? 0.5 : 1 }}
                    >
                      <option value="">Select semester…</option>
                      {semesters
                        .filter(s => s.courseId === coopCourseId)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.isActive ? ' ✓ Active' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                {coopCourseId && semesters.filter(s => s.courseId === coopCourseId).length === 0 && (
                  <p style={{ fontSize: '12px', color: '#b45309', marginTop: '8px', margin: '8px 0 0' }}>
                    ⚠️ No semesters found for this course — <a href="/teacher/semesters" style={{ color: 'var(--plum)' }}>create one first</a>
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Parent Info <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — generates parent invite link)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Parent First Name</label>
                    <input value={coopParentFirstName} onChange={e => setCoopParentFirstName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Parent Last Name</label>
                    <input value={coopParentLastName} onChange={e => setCoopParentLastName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Parent Email</label>
                    <input type="email" value={coopParentEmail} onChange={e => setCoopParentEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                    {/* Duplicate parent email warning */}
                    {(() => {
                      const emailLower = coopParentEmail.trim().toLowerCase()
                      if (!emailLower) return null
                      const existingInvites = invites.filter(i => i.parentEmail?.toLowerCase() === emailLower)
                      if (existingInvites.length === 0) return null
                      const names = [...new Set(existingInvites.map(i => i.studentName))].join(', ')
                      return (
                        <div style={{ marginTop: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#92400E', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ flexShrink: 0 }}>ℹ️</span>
                          <span>
                            <strong>{emailLower}</strong> already has a parent invite for <strong>{names}</strong>.
                            When they accept this new invite, they should <strong>sign in</strong> — not create a new account.
                            The invite email will include sign-in instructions.
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={createCoopStudent}
                  disabled={coopCreating || !coopFirstName.trim() || !coopLastName.trim() || !coopEmail.trim()}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (coopCreating || !coopFirstName.trim() || !coopLastName.trim() || !coopEmail.trim()) ? 0.6 : 1 }}
                >
                  {coopCreating ? 'Generating…' : 'Generate Invite Links'}
                </button>
                <button onClick={() => { setShowCoopForm(false); setCoopResult(null) }} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {coopResult && (
            <div style={{ background: 'var(--background)', border: '1px solid #86EFAC', borderRadius: 'var(--radius)', padding: '28px', maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{coopResult.studentName} is set up!</div>
              </div>

              {/* Email confirmation banners */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', paddingLeft: '42px' }}>
                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: coopResult.emailSentToStudent ? '#065F46' : '#b91c1c' }}>
                  <span>{coopResult.emailSentToStudent ? '✉️' : '⚠️'}</span>
                  {coopResult.emailSentToStudent
                    ? <span>Invite email sent to <strong>{coopResult.studentEmail}</strong></span>
                    : <span>Email failed for <strong>{coopResult.studentEmail}</strong> — copy link above to send manually</span>}
                </div>
                {coopResult.parentEmail && (
                  <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: coopResult.emailSentToParent ? '#1e40af' : '#b91c1c' }}>
                    <span>{coopResult.emailSentToParent ? '✉️' : '⚠️'}</span>
                    {coopResult.emailSentToParent
                      ? <span>Parent email sent to <strong>{coopResult.parentEmail}</strong></span>
                      : <span>Email failed for <strong>{coopResult.parentEmail}</strong> — copy link above to send manually</span>}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--page-bg)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🎓 Student Invite Link</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', wordBreak: 'break-all', marginBottom: '10px' }}>{coopResult.studentLink}</div>
                  <button onClick={() => copyCoopLink(coopResult.studentLink, 'student')} style={{ background: copiedCoopLink === 'student' ? '#D1FAE5' : 'var(--plum)', color: copiedCoopLink === 'student' ? '#065F46' : 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {copiedCoopLink === 'student' ? '✓ Copied!' : 'Copy Student Link'}
                  </button>
                </div>

                {coopResult.parentLink && (
                  <div style={{ background: 'var(--page-bg)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>👨‍👩‍👧 Parent Invite Link</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)', wordBreak: 'break-all', marginBottom: '10px' }}>{coopResult.parentLink}</div>
                    <button onClick={() => copyCoopLink(coopResult.parentLink, 'parent')} style={{ background: copiedCoopLink === 'parent' ? '#D1FAE5' : '#0369a1', color: copiedCoopLink === 'parent' ? '#065F46' : 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      {copiedCoopLink === 'parent' ? '✓ Copied!' : 'Copy Parent Link'}
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => { setCoopResult(null); setShowCoopForm(true) }} style={{ background: 'transparent', color: 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                + Add Another Student
              </button>
            </div>
          )}
        </div>

        {/* ── SENT INVITES (Students + Parents) ── */}
        {(studentInvites.length > 0 || invites.length > 0) && (
          <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '40px', marginBottom: '0' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', marginBottom: '4px' }}>Sent Invites</h3>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '20px' }}>
              All student and parent invites. Pending invites can be copied, resent, or deleted. Claimed ones can be cleared.
            </p>

            {/* Student invites */}
            {studentInvites.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  🎓 Student Invites ({studentInvites.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {studentInvites.map(inv => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inv.token}`
                    const isUsed = inv.used === true
                    const sentDate = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <div key={inv.id} style={{ background: 'var(--background)', border: `1px solid ${isUsed ? '#86EFAC' : 'var(--gray-light)'}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', opacity: isUsed ? 0.75 : 1 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUsed ? '#22C55E' : '#F59E0B', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{inv.firstName} {inv.lastName}</span>
                            {inv.courseTitle && <span style={{ fontSize: '11px', background: 'rgba(123,79,166,0.1)', color: 'var(--plum)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{inv.courseTitle}</span>}
                            <span style={{ fontSize: '11px', background: isUsed ? '#D1FAE5' : '#FEF3C7', color: isUsed ? '#065F46' : '#92400E', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              {isUsed ? '✓ Claimed' : '⏳ Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{inv.email} · Sent {sentDate}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {!isUsed && (
                            <>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(link)
                                  setCopiedStudentInviteId(inv.id)
                                  setTimeout(() => setCopiedStudentInviteId(null), 2000)
                                }}
                                style={{ background: copiedStudentInviteId === inv.id ? '#D1FAE5' : 'var(--page-bg)', color: copiedStudentInviteId === inv.id ? '#065F46' : 'var(--foreground)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                {copiedStudentInviteId === inv.id ? '✓ Copied' : 'Copy Link'}
                              </button>
                              <button
                                onClick={() => resendStudentInviteEmail(inv)}
                                disabled={resendingInviteId === inv.id}
                                style={{ background: 'var(--page-bg)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                {resendingInviteId === inv.id ? 'Sending…' : 'Resend'}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteStudentInviteRecord(inv.id)}
                            disabled={deletingInviteId === inv.id}
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            {deletingInviteId === inv.id ? '…' : '✕'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Parent invites */}
            {invites.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  👨‍👩‍👧 Parent Invites ({invites.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {invites.map(inv => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/parent/accept/${inv.token}`
                    const isUsed = inv.used === true
                    const sentDate = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const displayName = inv.parentFirstName
                      ? `${inv.parentFirstName}${inv.parentLastName ? ' ' + inv.parentLastName : ''}`
                      : inv.parentEmail || 'Parent'
                    const canResend = !isUsed && !!inv.parentEmail
                    return (
                      <div key={inv.id} style={{ background: 'var(--background)', border: `1px solid ${isUsed ? '#BAE6FD' : 'var(--gray-light)'}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', opacity: isUsed ? 0.75 : 1 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUsed ? '#0369a1' : '#F59E0B', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{displayName}</span>
                            <span style={{ fontSize: '11px', background: 'rgba(3,105,161,0.08)', color: '#0369a1', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              for {inv.studentName}
                            </span>
                            <span style={{ fontSize: '11px', background: isUsed ? '#E0F2FE' : '#FEF3C7', color: isUsed ? '#0369a1' : '#92400E', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              {isUsed ? '✓ Claimed' : '⏳ Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                            {inv.parentEmail ? `${inv.parentEmail} · ` : ''}{`Sent ${sentDate}`}
                            {!inv.parentEmail && !isUsed && (
                              <span style={{ color: '#b45309', marginLeft: '6px' }}>⚠ No email stored — use Copy Link to share manually</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {!isUsed && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link)
                                setCopiedParentInviteId(inv.id)
                                setTimeout(() => setCopiedParentInviteId(null), 2000)
                              }}
                              style={{ background: copiedParentInviteId === inv.id ? '#D1FAE5' : 'var(--page-bg)', color: copiedParentInviteId === inv.id ? '#065F46' : 'var(--foreground)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {copiedParentInviteId === inv.id ? '✓ Copied' : 'Copy Link'}
                            </button>
                          )}
                          {canResend && (
                            <button
                              onClick={() => resendParentInviteEmail(inv)}
                              disabled={resendingParentInviteId === inv.id}
                              style={{ background: 'var(--page-bg)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {resendingParentInviteId === inv.id ? 'Sending…' : 'Resend'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteInvite(inv.id)}
                            disabled={deletingParentInviteId === inv.id}
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            {deletingParentInviteId === inv.id ? '…' : '✕'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── INVITE PARENT MODAL ── */}
      {inviteParentStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--background)', borderRadius: '14px', padding: '32px', maxWidth: '480px', width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '4px' }}>
                Invite Parent — {inviteParentStudent.firstName} {inviteParentStudent.lastName}
              </div>
              {(() => {
                const existing = parentInviteMap[inviteParentStudent.email.toLowerCase()] || []
                const remaining = 2 - existing.length
                return <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{remaining} parent slot{remaining !== 1 ? 's' : ''} remaining</div>
              })()}
            </div>

            {/* Existing parent invites for this student */}
            {(parentInviteMap[inviteParentStudent.email.toLowerCase()] || []).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {(parentInviteMap[inviteParentStudent.email.toLowerCase()] || []).map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--page-bg)', borderRadius: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: inv.used ? '#22C55E' : '#F59E0B', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500 }}>
                        {inv.parentFirstName ? `${inv.parentFirstName}${inv.parentLastName ? ' ' + inv.parentLastName : ''}` : 'Parent'}
                        {' · '}
                        <span style={{ color: inv.used ? '#16a34a' : '#D97706', fontWeight: 600 }}>{inv.used ? '✓ Claimed' : '⏳ Pending'}</span>
                      </div>
                      {inv.parentEmail && (
                        <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>{inv.parentEmail}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/parent/accept/${inv.token}`
                        navigator.clipboard.writeText(link)
                        setInviteParentCopied(inv.id)
                        setTimeout(() => setInviteParentCopied(null), 2000)
                      }}
                      style={{ fontSize: '11px', background: inviteParentCopied === inv.id ? '#D1FAE5' : 'var(--page-bg)', color: inviteParentCopied === inv.id ? '#065F46' : 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer' }}>
                      {inviteParentCopied === inv.id ? '✓ Copied' : 'Copy'}
                    </button>
                    <button onClick={() => deleteInvite(inv.id)} style={{ fontSize: '11px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '3px 6px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* New parent invite form — only if under limit */}
            {(parentInviteMap[inviteParentStudent.email.toLowerCase()] || []).length < 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>First Name</label>
                    <input value={inviteParentFirstName} onChange={e => setInviteParentFirstName(e.target.value)} placeholder="Jane"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Last Name</label>
                    <input value={inviteParentLastName} onChange={e => setInviteParentLastName(e.target.value)} placeholder="Smith"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Parent Email <span style={{ color: '#c0392b' }}>*</span></label>
                  <input type="email" value={inviteParentEmail} onChange={e => setInviteParentEmail(e.target.value)} placeholder="parent@example.com"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }} />
                  {/* Duplicate parent email warning */}
                  {(() => {
                    const emailLower = inviteParentEmail.trim().toLowerCase()
                    if (!emailLower || !inviteParentStudent) return null
                    // Check invites for OTHER students (same email, different student)
                    const otherInvites = invites.filter(i =>
                      i.parentEmail?.toLowerCase() === emailLower &&
                      i.studentEmail.toLowerCase() !== inviteParentStudent.email.toLowerCase()
                    )
                    if (otherInvites.length === 0) return null
                    const names = [...new Set(otherInvites.map(i => i.studentName))].join(', ')
                    return (
                      <div style={{ marginTop: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#92400E', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ flexShrink: 0 }}>ℹ️</span>
                        <span>
                          This parent already has an account for <strong>{names}</strong>.
                          When they accept, they should <strong>sign in</strong> — not create a new account.
                          The accept page will show both options clearly.
                        </span>
                      </div>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={createParentInviteForStudent}
                    disabled={inviteParentCreating || !inviteParentEmail.trim()}
                    style={{ flex: 1, background: (!inviteParentEmail.trim() || inviteParentCreating) ? 'var(--gray-light)' : '#0369a1', color: (!inviteParentEmail.trim() || inviteParentCreating) ? 'var(--gray-mid)' : 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    {inviteParentCreating ? 'Sending…' : 'Send Invite Email'}
                  </button>
                  <button onClick={() => setInviteParentStudent(null)} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </>
            )}

            {(parentInviteMap[inviteParentStudent.email.toLowerCase()] || []).length >= 2 && (
              <button onClick={() => setInviteParentStudent(null)} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
