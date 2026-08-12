'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { useAuthenticator } from '@aws-amplify/ui-react'

/**
 * Role-agnostic sibling of useResolvedStudent: the signed-in user's identity
 * resolved via getCurrentUser() (storage-backed, always answers) with
 * useAuthenticator's event-driven user as a live fallback.
 *
 * Teacher surfaces gated on the raw hook user hung on fresh sessions exactly
 * like the student pages did — TeacherNav's profile fetch and /teacher/profile
 * were the 2026-08-12 finds, surfaced by Melinda's restored account signing in
 * on a clean session.
 */
export function useResolvedUser(): { userId: string; loginId: string } {
  const { user } = useAuthenticator()
  const [resolved, setResolved] = useState<{ id: string; loginId: string }>({ id: '', loginId: '' })

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then(u => { if (!cancelled) setResolved({ id: u.userId || u.username || '', loginId: u.signInDetails?.loginId || '' }) })
      .catch(() => { /* unauthenticated — page guards handle redirect */ })
    return () => { cancelled = true }
  }, [])

  return {
    userId: resolved.id || user?.userId || user?.username || '',
    loginId: resolved.loginId || user?.signInDetails?.loginId || '',
  }
}
