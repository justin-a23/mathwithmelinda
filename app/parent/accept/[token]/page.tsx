'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'
import MwmLogo from '../../../components/MwmLogo'

const client = generateClient()

const findInviteByToken = /* GraphQL */`
  query ListParentInvites($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 500) {
      items { id token studentEmail studentName used parentEmail parentFirstName parentLastName }
    }
  }
`

const findInvitesByParentEmail = /* GraphQL */`
  query ListParentInvitesByParentEmail($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 500) {
      items { id token studentEmail studentName used parentEmail parentFirstName parentLastName }
    }
  }
`

const updateParentInvite = /* GraphQL */`
  mutation UpdateParentInvite($input: UpdateParentInviteInput!) {
    updateParentInvite(input: $input) { id used }
  }
`

const createParentStudent = /* GraphQL */`
  mutation CreateParentStudent($input: CreateParentStudentInput!) {
    createParentStudent(input: $input) { id parentId studentEmail studentName }
  }
`

const listParentStudentLinks = /* GraphQL */`
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 1000) {
      items { id }
    }
  }
`

const findParentProfile = `
  query ListParentProfiles($filter: ModelParentProfileFilterInput) {
    listParentProfiles(filter: $filter, limit: 1000) {
      items { id }
    }
  }
`

const createParentProfileMutation = `
  mutation CreateParentProfile($input: CreateParentProfileInput!) {
    createParentProfile(input: $input) { id }
  }
`

type Invite = { id: string; token: string; studentEmail: string; studentName: string; used: boolean | null; parentEmail?: string | null; parentFirstName?: string | null; parentLastName?: string | null }
type State = 'loading' | 'not-found' | 'already-used' | 'already-linked' | 'auth-fork' | 'confirming' | 'done' | 'error' | 'staff-blocked'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  const [invite, setInvite] = useState<Invite | null>(null)
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (!token) return
    loadEverything()
  }, [token])

  async function loadEverything() {
    setState('loading')

    // Step 1: Load the invite publicly via API key (works without auth)
    let foundInvite: Invite | null = null
    try {
      const result = await (client.graphql as any)({
        query: findInviteByToken,
        variables: { filter: { token: { eq: token } } },
        authMode: 'apiKey',
      })
      const items: Invite[] = result.data.listParentInvites.items
      if (items.length === 0) { setState('not-found'); return }
      foundInvite = items[0]
      setInvite(foundInvite)
    } catch {
      // API key query failed — continue to auth check
    }

    // Step 2: Check if the user is logged in
    let userId: string | null = null
    try {
      const u = await getCurrentUser()
      userId = u.userId

      // A teacher/admin session must NEVER claim a parent invite. Accepting
      // one while signed in as staff created a ParentStudent link carrying the
      // TEACHER's sub — the Parents page then showed her as a parent, and
      // removing that row deleted her real login (2026-08-12).
      try {
        const session = await fetchAuthSession()
        const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined) || []
        if (groups.includes('teacher') || groups.includes('admin')) {
          setState('staff-blocked')
          return
        }
      } catch { /* group check best-effort; unauthenticated falls through below */ }
      try { localStorage.removeItem('mwm:parentToken') } catch { /* ignore */ }
    } catch {
      // Not signed in — show fork screen if we have invite data, else redirect to signup
      try { localStorage.setItem('mwm:parentToken', token) } catch { /* ignore */ }
      if (foundInvite) {
        // Show the sign-in/sign-up fork even for a used invite: whether it is
        // genuinely claimed or merely orphaned can only be judged once we know
        // who they are, and the signed-in path above makes that call. Dead-ending
        // here is what sent an existing parent to "create an account" for an
        // account they already had.
        setState('auth-fork')
      } else {
        // Couldn't load invite and not logged in — send to signup
        router.replace(`/signup?redirect=${encodeURIComponent(`/parent/accept/${token}`)}`)
      }
      return
    }

    // User is logged in — load invite via their auth token if public load failed
    if (!foundInvite) {
      await loadInviteAuthenticated(userId)
      return
    }

    // Invite already used — check if this user is the one who claimed it
    if (foundInvite.used) {
      const outcome = await resolveUsedInvite(userId, foundInvite)
      if (outcome === 'relink') { await performConfirmLink(userId, foundInvite); return }
      setState(outcome)
      return
    }

    // Invite is valid and not used — auto-confirm immediately
    await performConfirmLink(userId, foundInvite)
  }

  // Fallback invite load using Cognito token (if API key load failed)
  async function loadInviteAuthenticated(userId: string) {
    try {
      const result = await client.graphql({
        query: findInviteByToken,
        variables: { filter: { token: { eq: token } } }
      }) as any
      const items: Invite[] = result.data.listParentInvites.items

      if (items.length === 0) { setState('not-found'); return }
      const found = items[0]
      setInvite(found)

      if (found.used) {
        const outcome = await resolveUsedInvite(userId, found)
        if (outcome === 'relink') { await performConfirmLink(userId, found); return }
        setState(outcome)
        return
      }

      await performConfirmLink(userId, found)
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  /**
   * Decide what an already-used invite means for this signed-in user.
   *
   * 'already-linked' — they hold the link; nothing to do.
   * 'relink'         — the invite is marked used but NOBODY holds a link to
   *                    this student, so the claim was orphaned (the parent
   *                    account was deleted). Re-honor it instead of stranding
   *                    the family behind a dead token that can never be reused.
   * 'already-used'   — someone else legitimately holds the claim.
   */
  async function resolveUsedInvite(userId: string, inv: Invite): Promise<'already-linked' | 'relink' | 'already-used'> {
    try {
      const allForStudent = await client.graphql({
        query: listParentStudentLinks,
        variables: { filter: { studentEmail: { eq: inv.studentEmail } } }
      }) as any
      const links = allForStudent.data.listParentStudents.items as { parentId: string }[]
      if (links.some(l => l.parentId === userId)) return 'already-linked'
      if (links.length === 0) return 'relink'
      return 'already-used'
    } catch {
      return 'already-used'
    }
  }

  // Create the parent-student link and mark invite as used
  async function performConfirmLink(userId: string, inv: Invite) {
    setState('confirming')
    try {
      await client.graphql({
        query: createParentStudent,
        variables: { input: { parentId: userId, studentEmail: inv.studentEmail, studentName: inv.studentName } }
      })

      // Create ParentProfile if this is their first accept (needed for email lookups)
      try {
        const currentUser = await getCurrentUser()
        const email = currentUser.signInDetails?.loginId || ''
        if (email) {
          const existing = await (client.graphql as any)({
            query: findParentProfile,
            variables: { filter: { userId: { eq: userId } } },
          })
          if (existing.data.listParentProfiles.items.length === 0) {
            await (client.graphql as any)({
              query: createParentProfileMutation,
              variables: {
                input: {
                  userId,
                  email,
                  firstName: inv.parentFirstName || 'Parent',
                  lastName: inv.parentLastName || '',
                }
              }
            })
          }
        }
      } catch { /* non-fatal — profile creation failure doesn't block the accept */ }

      // Add user to the 'parent' Cognito group so login routing and the page
      // guards recognise them.
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (token) {
          const res = await fetch('/api/add-to-group', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ group: 'parent' }),
          })
          if (res.ok) {
            // Group membership is baked into the access token at issue time, so
            // the token in hand still says "no groups". Without this refresh the
            // parent gets treated as a student until they sign out and back in —
            // login would route them to /dashboard and the guard on /parent
            // would bounce them straight back off it.
            await fetchAuthSession({ forceRefresh: true })
          } else {
            console.error('add-to-group failed:', res.status, await res.text().catch(() => ''))
          }
        }
      } catch (err) {
        // Non-fatal: the link exists, so Melinda can fix group membership by
        // hand. Logged rather than swallowed so it's diagnosable.
        console.error('Could not add parent to group:', err)
      }

      await client.graphql({
        query: updateParentInvite,
        variables: { input: { id: inv.id, used: true } }
      })

      // Household auto-claim: the teacher may have queued invites for this
      // parent's OTHER children (same parent email, no email sent). Claim them
      // all now so one accepted invite links every sibling — the parent never
      // needs a second email or a second click.
      if (inv.parentEmail) {
        try {
          const siblings = await client.graphql({
            query: findInvitesByParentEmail,
            variables: { filter: { parentEmail: { eq: inv.parentEmail.toLowerCase() }, used: { ne: true } } }
          }) as any
          for (const sib of (siblings.data.listParentInvites.items as Invite[])) {
            if (sib.id === inv.id) continue
            try {
              const existingLink = await client.graphql({
                query: listParentStudentLinks,
                variables: { filter: { parentId: { eq: userId }, studentEmail: { eq: sib.studentEmail } } }
              }) as any
              if (existingLink.data.listParentStudents.items.length === 0) {
                await client.graphql({
                  query: createParentStudent,
                  variables: { input: { parentId: userId, studentEmail: sib.studentEmail, studentName: sib.studentName } }
                })
              }
              await client.graphql({
                query: updateParentInvite,
                variables: { input: { id: sib.id, used: true } }
              })
            } catch (err) {
              // One sibling failing shouldn't block the rest or the accept itself
              console.error('Sibling auto-claim failed for', sib.studentName, err)
            }
          }
        } catch (err) {
          console.error('Sibling invite lookup failed:', err)
        }
      }

      setState('done')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  const acceptRedirect = encodeURIComponent(`/parent/accept/${token}`)
  const navStyle: React.CSSProperties = { background: '#1E1E2E', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center' }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={navStyle}>
        <MwmLogo size={36} showWordmark />
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>

        {state === 'loading' && (
          <p style={{ color: 'var(--gray-mid)' }}>Verifying invite…</p>
        )}

        {state === 'confirming' && (
          <>
            <div style={{ width: '64px', height: '64px', background: 'rgba(123,79,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ fontSize: '28px' }}>👨‍👩‍👧</span>
            </div>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px' }}>Connecting your account to {invite?.studentName}…</p>
          </>
        )}

        {state === 'not-found' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Invite Not Found</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>This invite link is invalid or has already been used. Ask Melinda to send a new one.</p>
          </>
        )}

        {state === 'already-used' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Link Already Used</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>This invite has already been claimed. If you have an account, sign in to view your portal.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => router.push('/parent')} style={{ background: '#7B4FA6', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                Go to Parent Portal
              </button>
              <button onClick={() => router.push(`/signup?mode=signin&redirect=${encodeURIComponent('/parent')}`)} style={{ background: 'transparent', color: '#0369a1', padding: '12px 28px', borderRadius: '8px', border: '1px solid #93C5FD', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                Sign In Instead
              </button>
            </div>
          </>
        )}

        {state === 'already-linked' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Already Connected</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>You&apos;re already linked to <strong>{invite?.studentName}</strong>. Head to your parent portal to view their grades.</p>
            <button onClick={() => router.push('/parent')} style={{ background: '#7B4FA6', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Go to Parent Portal
            </button>
          </>
        )}

        {/* ── AUTH FORK ── shown when invite loads but user is not logged in */}
        {state === 'auth-fork' && invite && (
          <>
            <div style={{ width: '72px', height: '72px', background: 'rgba(123,79,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ fontSize: '32px' }}>👨‍👩‍👧</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>
              You&apos;re invited!
            </div>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px', lineHeight: '1.7', marginBottom: '32px' }}>
              Melinda has given you parent access for <strong style={{ color: 'var(--foreground)' }}>{invite.studentName}</strong> in Math with Melinda.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              {/* New parent */}
              <div style={{ background: 'var(--background)', border: '2px solid #7B4FA6', borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--foreground)', marginBottom: '6px' }}>
                  First time here?
                </div>
                <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '0 0 16px', lineHeight: '1.5' }}>
                  Create a free parent account to access {invite.studentName}&apos;s grades, assignments, and Melinda&apos;s feedback.
                </p>
                <button
                  onClick={() => router.push(`/signup?redirect=${acceptRedirect}`)}
                  style={{ background: '#7B4FA6', color: 'white', padding: '11px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, width: '100%' }}
                >
                  Create My Parent Account →
                </button>
              </div>

              {/* Returning parent */}
              <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Already have an account?
                </div>
                <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '0 0 16px', lineHeight: '1.5' }}>
                  Sign in to connect {invite.studentName} to your existing parent portal.
                </p>
                <button
                  onClick={() => router.push(`/signup?mode=signin&redirect=${acceptRedirect}`)}
                  style={{ background: 'transparent', color: '#0369a1', padding: '11px 24px', borderRadius: '8px', border: '2px solid #93C5FD', cursor: 'pointer', fontSize: '14px', fontWeight: 600, width: '100%' }}
                >
                  Sign In to My Account →
                </button>
              </div>
            </div>
          </>
        )}

        {state === 'done' && invite && (
          <>
            <div style={{ width: '72px', height: '72px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>You&apos;re all set!</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '32px' }}>
              You&apos;re now connected to <strong style={{ color: 'var(--foreground)' }}>{invite.studentName}</strong>. Head to your parent portal to view their grades and assignments.
            </p>
            <button onClick={() => router.push('/parent')}
              style={{ background: '#7B4FA6', color: 'white', padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, width: '100%' }}>
              Go to Parent Portal →
            </button>
          </>
        )}

        {state === 'staff-blocked' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛑</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>You&apos;re signed in as the teacher</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>
              Parent invites can&apos;t be accepted from a teacher or admin account — that would tangle the
              teacher login into the parent system. Sign out first, then open the invite link again using
              the parent&apos;s own email and password.
            </p>
            <button onClick={() => { window.location.href = '/teacher' }}
              style={{ background: '#7B4FA6', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Back to Teacher Dashboard
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Something went wrong</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>There was an error processing your invite. Please try again or contact Melinda.</p>
            <button onClick={loadEverything}
              style={{ background: '#7B4FA6', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Try Again
            </button>
          </>
        )}
      </main>
    </div>
  )
}
