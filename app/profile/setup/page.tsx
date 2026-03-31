'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

const listStudentProfiles = /* GraphQL */`
  query ListStudentProfiles($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter) {
      items {
        id
        userId
        firstName
        lastName
        status
      }
    }
  }
`

const createStudentProfile = /* GraphQL */`
  mutation CreateStudentProfile($input: CreateStudentProfileInput!) {
    createStudentProfile(input: $input) {
      id
      userId
      email
      firstName
      lastName
      status
    }
  }
`

const listCourses = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items { id title gradeLevel isArchived }
    }
  }
`

type Course = { id: string; title: string; gradeLevel: string | null; isArchived: boolean | null }

export default function ProfileSetupPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const GRADE_LEVELS = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

  useEffect(() => {
    if (user === null) {
      router.replace('/login')
      return
    }
    if (!user) return
    checkExistingProfile()
    fetchCourses()
  }, [user, router])

  async function fetchCourses() {
    try {
      const result = await client.graphql({ query: listCourses }) as any
      const items = (result.data.listCourses.items as Course[]).filter(c => !c.isArchived)
      setCourses(items.sort((a, b) => a.title.localeCompare(b.title)))
    } catch { /* non-fatal */ }
  }

  async function checkExistingProfile() {
    try {
      const result = await client.graphql({
        query: listStudentProfiles,
        variables: { filter: { userId: { eq: user.userId } } }
      }) as any
      const items = result.data.listStudentProfiles.items
      if (items && items.length > 0) {
        const profile = items[0]
        if (profile.status === 'pending') {
          // Already submitted, show waiting screen
          setSubmitted(true)
          setChecking(false)
          return
        }
        // Active profile — go to dashboard
        router.replace('/dashboard')
        return
      }
    } catch (err) {
      console.error('Error checking profile:', err)
    } finally {
      setChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const email = user.signInDetails?.loginId || user.userId
      await client.graphql({
        query: createStudentProfile,
        variables: {
          input: {
            userId: user.userId,
            email,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gradeLevel: gradeLevel || null,
            courseId: selectedCourseId || null,
            status: 'pending',
          }
        }
      }) as any

      setSubmitted(true)
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

  // Waiting for teacher approval
  if (submitted) {
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
          </div>
          <ThemeToggle />
        </nav>

        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          {/* Pending icon */}
          <div style={{ width: '72px', height: '72px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>
            Request sent!
          </h1>
          <p style={{ color: 'var(--gray-mid)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Your request to join Math with Melinda has been received.<br/>
            Melinda will review your request and set up your course. You&apos;ll be able to access your dashboard once approved.
          </p>

          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>What happens next</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Melinda reviews your request',
                'She assigns your course and academic year',
                'You get full access to your dashboard',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                  <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              // Check if approved yet
              const result = await client.graphql({
                query: listStudentProfiles,
                variables: { filter: { userId: { eq: user.userId } } }
              }) as any
              const items = result.data.listStudentProfiles.items
              if (items?.[0]?.status !== 'pending') {
                router.replace('/dashboard')
              } else {
                // Still pending — just a visual refresh
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
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '64px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
          Welcome to Math with Melinda
        </h1>
        <p style={{ color: 'var(--gray-mid)', fontSize: '15px', marginBottom: '8px' }}>
          Enter your name to request access. Melinda will set up your course once approved.
        </p>
        <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '40px' }}>
          Signed in as <strong>{user?.signInDetails?.loginId || user?.userId}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                First Name <span style={{ color: '#c0392b' }}>*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jane"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                Last Name <span style={{ color: '#c0392b' }}>*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Smith"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {courses.length > 0 && (
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
          )}

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

          {error && (
            <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: submitting ? 'var(--gray-mid)' : 'var(--plum)', color: 'white', padding: '12px 32px', borderRadius: 'var(--radius)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-body)', marginTop: '4px' }}
          >
            {submitting ? 'Sending request…' : 'Request Access'}
          </button>
        </form>
      </main>
    </div>
  )
}
