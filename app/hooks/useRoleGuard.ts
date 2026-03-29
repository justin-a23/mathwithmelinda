'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuthSession } from 'aws-amplify/auth'

type Role = 'teacher' | 'student'

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

  useEffect(() => {
    let cancelled = false
    fetchAuthSession()
      .then(session => {
        if (cancelled) return
        const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) ?? []
        const isTeacher = groups.includes('teacher')

        if (requiredRole === 'teacher' && !isTeacher) {
          // Student trying to access teacher area → send to their dashboard
          router.replace('/dashboard')
          return
        }
        if (requiredRole === 'student' && isTeacher) {
          // Teacher trying to access student area → send to teacher dashboard
          router.replace('/teacher')
          return
        }
        setChecking(false)
      })
      .catch(() => {
        if (!cancelled) {
          // Not authenticated at all
          router.replace('/login')
        }
      })
    return () => { cancelled = true }
  }, [requiredRole, router])

  return { checking }
}
