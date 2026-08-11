'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { studentKey } from '@/app/lib/identity'

/**
 * The signed-in student's id (Cognito sub) plus their login email, resolved
 * deterministically via getCurrentUser() with useAuthenticator's user as a
 * live fallback.
 *
 * Gating a load on the event-driven useAuthenticator user alone leaves a page
 * stuck forever whenever the sign-in event never fires on a fresh load — the
 * incognito/hard-refresh bug fixed on the messages page in #336 and later
 * found on Turned In, StudentNav, grades, and the lesson page. Every student
 * page should gate on this hook instead.
 */
export function useResolvedStudent(): { studentId: string; loginId: string } {
  const { user } = useAuthenticator()
  const [resolved, setResolved] = useState<{ id: string; loginId: string }>({ id: '', loginId: '' })

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then(u => { if (!cancelled) setResolved({ id: studentKey(u), loginId: u.signInDetails?.loginId || '' }) })
      .catch(() => { /* unauthenticated — the page's role guard handles redirect */ })
    return () => { cancelled = true }
  }, [])

  return {
    studentId: resolved.id || studentKey(user),
    loginId: resolved.loginId || user?.signInDetails?.loginId || '',
  }
}
