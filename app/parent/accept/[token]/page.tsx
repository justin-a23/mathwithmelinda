'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

const findInviteByToken = /* GraphQL */`
  query ListParentInvites($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 1) {
      items { id token studentEmail studentName used }
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
    listParentStudents(filter: $filter, limit: 5) {
      items { id }
    }
  }
`

type Invite = { id: string; token: string; studentEmail: string; studentName: string; used: boolean | null }
type State = 'loading' | 'not-found' | 'already-used' | 'already-linked' | 'auth-fork' | 'ready' | 'confirming' | 'done' | 'error'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  const [invite, setInvite] = useState<Invite | null>(null)
  const [state, setState] = useState<State>('loading')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    loadEverything()
  }, [token])

  async function loadEverything() {
    setState('loading')

    // Step 1: Load the invite publicly (API key auth — works without login)
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
      // API key query failed — fall back to auth-required flow
    }

    // Step 2: Check if the user is logged in
    try {
      const u = await getCurrentUser()
      setCurrentUserId(u.userId)
      try { localStorage.removeItem('mwm:parentToken') } catch { /* ignore */ }

      if (!foundInvite) {
        // Couldn't load invite publicly — try with user auth now
        await loadInviteAuthenticated(u.userId)
        return
      }

      // Invite loaded — check if already used
      if (foundInvite.used) {
        const linkResult = await client.graphql({
          query: listParentStudentLinks,
          variables: { filter: { parentId: { eq: u.userId }, studentEmail: { eq: foundInvite.studentEmail } } }
        }) as any
        const links = linkResult.data.listParentStudents.items
        setState(links.length > 0 ? 'already-linked' : 'already-used')
        return
      }

      setState('ready')
    } catch {
      // Not signed in
      try { localStorage.setItem('mwm:parentToken', token) } catch { /* ignore */ }

      if (foundInvite) {
        // Show the fork screen — we have the student name to display
        setState('auth-fork')
      } else {
        // Couldn't load invite and not logged in — send to signup
        router.replace(`/signup?redirect=${encodeURIComponent(`/parent/accept/${token}`)}`)
      }
    }
  }

  // Fallback: load invite using authenticated user's token (if public load failed)
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
        const linkResult = await client.graphql({
          query: listParentStudentLinks,
          variables: { filter: { parentId: { eq: userId }, studentEmail: { eq: found.studentEmail } } }
        }) as any
        const links = linkResult.data.listParentStudents.items
        setState(links.length > 0 ? 'already-linked' : 'already-used')
        return
      }

      setState('ready')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  async function confirmLink() {
    if (!invite || !currentUserId) return
    setState('confirming')
    try {
      await client.graphql({
        query: createParentStudent,
        variables: { input: { parentId: currentUserId, studentEmail: invite.studentEmail, studentName: invite.studentName } }
      })
      await client.graphql({
        query: updateParentInvite,
        variables: { input: { id: invite.id, used: true } }
      })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: '#7B4FA6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>

        {state === 'loading' && (
          <p style={{ color: 'var(--gray-mid)' }}>Verifying invite…</p>
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
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>This invite has already been claimed. If this is a mistake, contact Melinda.</p>
            <button onClick={() => router.push('/parent')} style={{ background: '#7B4FA6', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Go to Parent Portal
            </button>
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

            {/* Fork cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px', textAlign: 'left' }}>
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

        {state === 'ready' && invite && (
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
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#7B4FA6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Your parent portal includes</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--foreground)', fontSize: '14px', lineHeight: '2.2' }}>
                <li>All submitted assignments</li>
                <li>Grades and teacher comments</li>
                <li>Photos of submitted work</li>
                <li>Progress and performance overview</li>
              </ul>
            </div>
            <button onClick={confirmLink}
              style={{ background: '#7B4FA6', color: 'white', padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, width: '100%' }}>
              Connect to {invite.studentName}&apos;s Account
            </button>
          </>
        )}

        {state === 'confirming' && (
          <p style={{ color: 'var(--gray-mid)' }}>Connecting your account…</p>
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
              You&apos;re now connected to <strong style={{ color: 'var(--foreground)' }}>{invite.studentName}</strong>. Head to your parent portal to view their grades.
            </p>
            <button onClick={() => router.push('/parent')}
              style={{ background: '#7B4FA6', color: 'white', padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, width: '100%' }}>
              Go to Parent Portal
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
