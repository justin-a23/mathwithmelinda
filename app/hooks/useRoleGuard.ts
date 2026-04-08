'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuthSession } from 'aws-amplify/auth'

type Role = 'teacher' | 'student' | 'parent'

/**
 * Redirects users who don't belong to the required role.
 * Teachers (in 'teacher' Cognito group) → required role 'teacher'
 * Students (no group) → required role 'student'
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
