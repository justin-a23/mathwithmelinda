'use client'

import { useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

/**
 * Whether the signed-in user is in the Cognito `admin` group (the IT/support
 * role — teacher-equivalent everywhere else, but some surfaces show extra
 * controls only to admins, e.g. the ticket status editor).
 *
 * UI convenience only, NOT a security boundary: the schema's group rules are
 * the real enforcement, and they deliberately grant all staff write access.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAuthSession()
      .then(session => {
        if (cancelled) return
        const groups = (session.tokens?.accessToken.payload['cognito:groups'] as string[]) ?? []
        setIsAdmin(groups.includes('admin'))
      })
      .catch(() => { /* unauthenticated — page guards handle redirect */ })
    return () => { cancelled = true }
  }, [])

  return isAdmin
}
