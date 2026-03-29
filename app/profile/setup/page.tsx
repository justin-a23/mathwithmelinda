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
      gradeLevel
      courseId
      planType
    }
  }
`

const createEnrollmentMutation = /* GraphQL */`
  mutation CreateEnrollment($input: CreateEnrollmentInput!) {
    createEnrollment(input: $input) {
      id
      studentId
      planType
    }
  }
`

const listCourses = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items {
        id
        title
        gradeLevel
        isArchived
      }
    }
  }
`

type Course = {
  id: string
  title: string
  gradeLevel: string | null
  isArchived: boolean | null
}

const GRADE_LEVELS = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
const PLAN_TYPES = ['Video Only', 'Virtual Student', 'Co-op Student']

export default function ProfileSetupPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [planType, setPlanType] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user === null) {
      router.replace('/login')
      return
    }
    if (!user) return
    checkExistingProfile()
  }, [user, router])

  async function checkExistingProfile() {
    try {
      const result = await client.graphql({
        query: listStudentProfiles,
        variables: { filter: { userId: { eq: user.userId } } }
      }) as any
      const items = result.data.listStudentProfiles.items
      if (items && items.length > 0) {
        router.replace('/dashboard')
        return
      }
    } catch (err) {
      console.error('Error checking profile:', err)
    } finally {
      setChecking(false)
    }
    fetchCourses()
  }

  async function fetchCourses() {
    try {
      const result = await client.graphql({ query: listCourses }) as any
      const items = (result.data.listCourses.items as Course[]).filter(c => !c.isArchived)
      setCourses(items)
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !gradeLevel || !selectedCourseId || !planType) {
      setError('Please fill in all fields.')
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
            gradeLevel,
            courseId: selectedCourseId,
            planType,
          }
        }
      }) as any

      await client.graphql({
        query: createEnrollmentMutation,
        variables: {
          input: {
            studentId: email,
            planType,
            courseEnrollmentsId: selectedCourseId,
          }
        }
      }) as any

      router.replace('/dashboard')
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
        <p style={{ color: 'var(--gray-mid)', fontSize: '16px', marginBottom: '40px' }}>
          Let&apos;s set up your profile
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                First Name
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
                Last Name
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

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Grade Level
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

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: selectedCourseId ? 'var(--foreground)' : 'var(--gray-mid)', boxSizing: 'border-box' }}
            >
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}{c.gradeLevel ? ` (${c.gradeLevel})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '10px' }}>
              Plan Type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PLAN_TYPES.map(pt => (
                <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)' }}>
                  <input
                    type="radio"
                    name="planType"
                    value={pt}
                    checked={planType === pt}
                    onChange={e => setPlanType(e.target.value)}
                    style={{ accentColor: 'var(--plum)', width: '16px', height: '16px' }}
                  />
                  {pt}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: submitting ? 'var(--gray-mid)' : 'var(--plum)', color: 'white', padding: '12px 32px', borderRadius: 'var(--radius)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-body)', marginTop: '4px' }}
          >
            {submitting ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </main>
    </div>
  )
}
