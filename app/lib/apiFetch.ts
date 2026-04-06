'use client'

import { fetchAuthSession } from 'aws-amplify/auth'

/**
 * Drop-in replacement for fetch() that automatically attaches the Cognito
 * access token as an Authorization: Bearer header. Use this for all /api/ calls
 * from client components.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string | undefined
  try {
    const session = await fetchAuthSession()
    token = session.tokens?.accessToken?.toString()
  } catch {
    // Not signed in — proceed without token (server will return 401)
  }

  const headers = new Headers(options.headers as HeadersInit | undefined)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, { ...options, headers })
}
