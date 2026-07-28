'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuthSession } from 'aws-amplify/auth'

import { type Role, roleFromGroups, homeFor } from '@/app/lib/roles'

/**
 * Redirects users who don't belong to the required role.
 *
 * Note this is a client-side convenience, not a security boundary — it stops
 * people wandering into the wrong section, but the real enforcement is the
 * per-route auth in app/lib/auth.ts and the ownership checks in
 * app/lib/ownership.ts.
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
        const actualRole = roleFromGroups(groups)

        // Previously this only asked "teacher or not", which made parents and
        // students interchangeable — a parent could open the student pages and
        // vice versa. Compare the resolved role instead.
        if (actualRole !== requiredRole) {
          router.replace(homeFor(actualRole))
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
