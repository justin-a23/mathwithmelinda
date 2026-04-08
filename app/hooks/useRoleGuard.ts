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
    let attempts = 0

    async function checkAuth() {
      try {
        const session = await fetchAuthSession()
        if (cancelled) return
        if (!session.tokens?.accessToken) {
          // On first attempt, Amplify may not have restored session yet — retry once
          if (attempts < 2) {
            attempts++
            setTimeout(checkAuth, 500)
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
        setChecking(false)
      } catch {
        if (cancelled) return
        // On first attempt, retry — Amplify session may still be initializing
        if (attempts < 2) {
          attempts++
          setTimeout(checkAuth, 500)
          return
        }
        router.replace('/login')
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [requiredRole, router])

  return { checking }
}
