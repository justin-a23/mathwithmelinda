import { signOut } from 'aws-amplify/auth'

/**
 * The only sign-out the app should use.
 *
 * The old pattern — useAuthenticator's signOut() fired without awaiting,
 * followed by an SPA route swap to /login — showed the login screen while the
 * token clearing was still in flight (or had silently failed). The session
 * survived in localStorage, and the next invite link opened as the previous
 * person. Awaiting the real signOut and then doing a FULL page load guarantees
 * both: tokens gone, and no in-memory auth state carried across.
 */
export async function hardSignOut(redirect: string = '/login') {
  try { await signOut() } catch { /* still navigate — a half-cleared session must not strand the user */ }
  window.location.href = redirect
}
