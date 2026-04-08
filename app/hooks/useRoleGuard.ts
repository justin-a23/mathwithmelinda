'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'

type Role = 'teacher' | 'student' | 'parent'

const client = generateClient()

const LIST_STUDENT_PROFILES = /* GraphQL */`
  query ListStudentProfiles($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter, limit: 1) {
      items { id status }
    }
  }
`

/**
 * Redirects users who don't belong to the required role.
 * Teachers (in 'teacher' Cognito group) → required role 'teacher'
 * Students (no group) → required role 'student'
 *
 * For students, also checks that a profile exists in DynamoDB.
 * If no profile → redirects to /profile/setup.
 *
 * Returns { checking: true } while auth is being verified.
 * Once resolved, either redirects away or returns { checking: false }.
 */
export function useRoleGuard(requiredRole: Role): { checking: boolean } {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    let cancelled = false

    async function checkAuth(attempt: number) {
      try {
        const session = await fetchAuthSession()
        if (cancelled) return
        if (!session.tokens?.accessToken) {
          // Amplify may not have restored session yet — retry once after a brief delay
          if (attempt < 2) {
            setTimeout(() => checkAuth(attempt + 1), 600)
            return
          }
          router.replace('/login')
          return
        }
        const groups = (session.tokens.accessToken.payload['cognito:groups'] as string[]) ?? []
        const isTeacher = groups.includes('teacher')

        if (requiredRole === 'teacher' && !isTeacher) {
          router.replace('/dashboard')
          return
        }
        if (requiredRole === 'student' && isTeacher) {
          router.replace('/teacher')
          return
        }

        // For students, verify a profile exists before allowing access
        if (requiredRole === 'student') {
          try {
            const currentUser = await getCurrentUser()
            const userId = currentUser.userId
            const loginId = currentUser.signInDetails?.loginId || ''

            // Check by userId first
            const result = await client.graphql({
              query: LIST_STUDENT_PROFILES,
              variables: { filter: { userId: { eq: userId } } }
            }) as any
            let items = result.data.listStudentProfiles.items

            // Fallback: check by email
            if ((!items || items.length === 0) && loginId) {
              const emailResult = await client.graphql({
                query: LIST_STUDENT_PROFILES,
                variables: { filter: { email: { eq: loginId } } }
              }) as any
              items = emailResult.data.listStudentProfiles.items
            }

            if (!items || items.length === 0) {
              // No profile at all — send to setup
              if (!cancelled) router.replace('/profile/setup')
              return
            }
          } catch (err) {
            console.error('Profile check failed:', err)
            // Don't block on profile check failure — let the page handle it
          }
        }

        if (!cancelled) setChecking(false)
      } catch {
        if (cancelled) return
        if (attempt < 2) {
          setTimeout(() => checkAuth(attempt + 1), 600)
          return
        }
        router.replace('/login')
      }
    }

    checkAuth(0)
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { checking }
}
