'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import MwmLogo from '../../components/MwmLogo'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

const LIST_STUDENT_PROFILES = /* GraphQL */`
  query ListStudentProfiles($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter) {
      items { id userId firstName lastName status }
    }
  }
`

const CREATE_STUDENT_PROFILE = /* GraphQL */`
  mutation CreateStudentProfile($input: CreateStudentProfileInput!) {
    createStudentProfile(input: $input) {
      id userId email firstName lastName status planType courseId
    }
  }
`

const LIST_COURSES = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items { id title gradeLevel isArchived }
    }
  }
`

const FIND_INVITE = /* GraphQL */`
  query ListStudentInvites($filter: ModelStudentInviteFilterInput) {
    listStudentInvites(filter: $filter, limit: 500) {
      items { id token firstName lastName email courseId courseTitle semesterId planType used }
    }
  }
`

const MARK_INVITE_USED = /* GraphQL */`
  mutation UpdateStudentInvite($input: UpdateStudentInviteInput!) {
    updateStudentInvite(input: $input) { id used }
  }
`

const LIST_PROFILES_BY_EMAIL = /* GraphQL */`
  query ListProfilesByEmail($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter) {
      items { id userId firstName lastName status }
    }
  }
`

const UPDATE_PROFILE_USERID = /* GraphQL */`
  mutation UpdateProfileUserId($input: UpdateStudentProfileInput!) {
    updateStudentProfile(input: $input) { id userId }
  }
`

const CREATE_ENROLLMENT = /* GraphQL */`
  mutation CreateEnrollment($input: CreateEnrollmentInput!) {
    createEnrollment(input: $input) { id studentId }
  }
`

type Course = { id: string; title: string; gradeLevel: string | null; isArchived: boolean | null }
type InviteData = {
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
}

const GRADE_LEVELS = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

type CurrentUser = { userId: string; signInDetails?: { loginId?: string } }

function ProfileSetupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [invite, setInvite] = useState<InviteData | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Extract token at mount time synchronously before any async work
  const [inviteToken] = useState<string | null>(() => {
    // Try URL param first (via searchParams), then localStorage
    const fromUrl = searchParams.get('token')
    if (fromUrl) return fromUrl
    try { return localStorage.getItem('mwm:joinToken') } catch { return null }
  })

  useEffect(() => {
    getCurrentUser()
      .then(u => {
        setCurrentUser(u as CurrentUser)
        checkExistingProfile(u as CurrentUser)
        fetchCourses()
      })
      .catch(() => router.replace('/login'))
  }, [])

  async function fetchCourses() {
    try {
      const result = await client.graphql({ query: LIST_COURSES }) as any
      const items = (result.data.listCourses.items as Course[]).filter(c => !c.isArchived)
      setCourses(items.sort((a, b) => a.title.localeCompare(b.title)))
    } catch { /* non-fatal */ }
  }

  async function checkExistingProfile(u: CurrentUser) {
    try {
      const result = await client.graphql({
        query: LIST_STUDENT_PROFILES,
        variables: { filter: { userId: { eq: u.userId } } }
      }) as any
      let items = result.data.listStudentProfiles.items

      // Fallback: if no profile found by userId, try by email (handles re-created accounts)
      if ((!items || items.length === 0) && u.signInDetails?.loginId) {
        const emailResult = await client.graphql({
          query: LIST_PROFILES_BY_EMAIL,
          variables: { filter: { email: { eq: u.signInDetails.loginId } } }
        }) as any
        items = emailResult.data.listStudentProfiles.items
        // Update the profile's userId to the current one
        if (items && items.length > 0) {
          try {
            await client.graphql({
              query: UPDATE_PROFILE_USERID,
              variables: { input: { id: items[0].id, userId: u.userId } }
            })
          } catch (e) { console.error('Failed to update profile userId:', e) }
        }
      }

      if (items && items.length > 0) {
        const profile = items[0]
        if (profile.status === 'pending') {
          setSubmitted(true)
          setChecking(false)
          return
        }
        router.replace('/dashboard')
        return
      }
    } catch (err) {
      console.error('Error checking profile:', err)
    }

    // No existing profile — look up invite token
    if (inviteToken) {
      await loadInvite(inviteToken)
    }

    setChecking(false)
  }

  async function loadInvite(token: string) {
    try {
      const res = await client.graphql({
        query: FIND_INVITE,
        variables: { filter: { token: { eq: token } } }
      }) as any
      const items: InviteData[] = res.data.listStudentInvites.items
      if (items.length > 0 && !items[0].used) {
        const inv = items[0]
        setInvite(inv)
        setFirstName(inv.firstName)
        setLastName(inv.lastName)
        if (inv.courseId) setSelectedCourseId(inv.courseId)
      }
    } catch (err) {
      console.error('Error loading invite:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    if (!currentUser) return
    setSubmitting(true)
    setError('')

    try {
      const email = currentUser.signInDetails?.loginId || currentUser.userId
      const isInvited = !!invite

      await client.graphql({
        query: CREATE_STUDENT_PROFILE,
        variables: {
          input: {
            userId: currentUser.userId,
            email,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gradeLevel: gradeLevel || null,
            courseId: selectedCourseId || null,
            planType: invite?.planType || null,
            status: isInvited ? 'active' : 'pending',
          }
        }
      }) as any

      // Mark invite as used + auto-enroll in semester
      if (invite) {
        await client.graphql({
          query: MARK_INVITE_USED,
          variables: { input: { id: invite.id, used: true } }
        }) as any

        // Auto-enroll in semester if one was set on the invite
        if (invite.semesterId) {
          try {
            await client.graphql({
              query: CREATE_ENROLLMENT,
              variables: {
                input: {
                  studentId: currentUser.userId,
                  courseEnrollmentsId: invite.courseId || null,
                  semesterEnrollmentsId: invite.semesterId,
                  planType: invite.planType,
                }
              }
            }) as any
          } catch (enrollErr) {
            console.error('Enrollment creation failed (non-fatal):', enrollErr)
          }
        }

        // Clear token from localStorage
        try { localStorage.removeItem('mwm:joinToken') } catch { /* ignore */ }
      }

      if (isInvited) {
        router.replace('/dashboard')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    )
  }

  // Waiting for teacher approval (non-invited students only)
  if (submitted) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
        <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MwmLogo size={36} showWordmark />
          <ThemeToggle />
        </nav>

        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Request sent!</h1>
          <p style={{ color: 'var(--gray-mid)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Your request to join Math with Melinda has been received.<br/>
            Melinda will review your request and set up your course. You&apos;ll be able to access your dashboard once approved.
          </p>

          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>What happens next</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Melinda reviews your request', 'She assigns your course and academic year', 'You get full access to your dashboard'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                  <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              const result = await client.graphql({
                query: LIST_STUDENT_PROFILES,
                variables: { filter: { userId: { eq: currentUser?.userId } } }
              }) as any
              const items = result.data.listStudentProfiles.items
              if (items?.[0]?.status !== 'pending') {
                router.replace('/dashboard')
              } else {
                window.location.reload()
              }
            }}
            style={{ background: 'none', border: '1px solid var(--gray-light)', borderRadius: '8px', color: 'var(--gray-mid)', fontSize: '13px', padding: '8px 20px', cursor: 'pointer' }}
          >
            Check for approval
          </button>
        </main>
      </div>
    )
  }

  const isInvited = !!invite
  const planLabel = invite?.planType === 'coop' ? 'Co-op Student'
    : invite?.planType === 'virtual' ? 'Virtual Student'
    : invite?.planType === 'self-paced' ? 'Self-Paced Student'
    : null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MwmLogo size={36} showWordmark />
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '64px 24px' }}>
        {isInvited ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px' }}>🎓</span>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', margin: 0 }}>
                Hi, {invite.firstName}!
              </h1>
            </div>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px', marginBottom: '8px' }}>
              Melinda has set up your account. Just confirm your details and you&apos;re in.
            </p>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '40px' }}>
              Signed in as <strong>{currentUser?.signInDetails?.loginId || currentUser?.userId}</strong>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
              Welcome to Math with Melinda
            </h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px', marginBottom: '8px' }}>
              Enter your name to request access. Melinda will set up your course once approved.
            </p>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '40px' }}>
              Signed in as <strong>{currentUser?.signInDetails?.loginId || currentUser?.userId}</strong>
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Name row — read-only if invited */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                First Name {!isInvited && <span style={{ color: '#c0392b' }}>*</span>}
              </label>
              {isInvited ? (
                <div style={{ padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', background: 'var(--page-bg)', color: 'var(--foreground)', opacity: 0.7 }}>
                  {firstName}
                </div>
              ) : (
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
                />
              )}
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                Last Name {!isInvited && <span style={{ color: '#c0392b' }}>*</span>}
              </label>
              {isInvited ? (
                <div style={{ padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', background: 'var(--page-bg)', color: 'var(--foreground)', opacity: 0.7 }}>
                  {lastName}
                </div>
              ) : (
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
                />
              )}
            </div>
          </div>

          {/* Course — read-only if invited with a course, otherwise show picker */}
          {isInvited && invite.courseTitle ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Course</label>
              <div style={{ padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', background: 'var(--page-bg)', color: 'var(--foreground)', opacity: 0.7 }}>
                {invite.courseTitle}
              </div>
            </div>
          ) : !isInvited && courses.length > 0 ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                Course I want to take <span style={{ color: 'var(--gray-mid)', fontWeight: 400 }}>(optional — teacher can adjust)</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: selectedCourseId ? 'var(--foreground)' : 'var(--gray-mid)', boxSizing: 'border-box' }}
              >
                <option value="">Not sure yet...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}{c.gradeLevel ? ` (${c.gradeLevel})` : ''}</option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Plan badge for invited students */}
          {isInvited && planLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', background: 'rgba(123,79,166,0.1)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {planLabel}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>— set by Melinda</span>
            </div>
          )}

          {/* Grade level — everyone fills this in */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Grade Level <span style={{ color: 'var(--gray-mid)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              value={gradeLevel}
              onChange={e => setGradeLevel(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: gradeLevel ? 'var(--foreground)' : 'var(--gray-mid)', boxSizing: 'border-box' }}
            >
              <option value="">Select grade level...</option>
              {GRADE_LEVELS.map(g => (
                <option key={g} value={g}>{g} Grade</option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: submitting ? 'var(--gray-mid)' : 'var(--plum)', color: 'white', padding: '12px 32px', borderRadius: 'var(--radius)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-body)', marginTop: '4px' }}
          >
            {submitting
              ? (isInvited ? 'Setting up your account…' : 'Sending request…')
              : (isInvited ? 'Go to My Dashboard' : 'Request Access')}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    }>
      <ProfileSetupInner />
    </Suspense>
  )
}
