'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useAuthenticator } from '@aws-amplify/ui-react'

const client = generateClient()

const FIND_INVITE = /* GraphQL */`
  query ListStudentInvites($filter: ModelStudentInviteFilterInput) {
    listStudentInvites(filter: $filter, limit: 1) {
      items { id token firstName lastName email courseTitle planType used }
    }
  }
`

type Invite = {
  id: string
  token: string
  firstName: string
  lastName: string
  email: string
  courseTitle: string | null
  planType: string
  used: boolean | null
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  const { authStatus } = useAuthenticator()

  const [invite, setInvite] = useState<Invite | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'used' | 'not-found' | 'error'>('loading')

  useEffect(() => {
    if (!token) return
    loadInvite()
  }, [token])

  async function loadInvite() {
    try {
      const res = await (client.graphql({
        query: FIND_INVITE,
        variables: { filter: { token: { eq: token } } }
      }) as any)
      const items: Invite[] = res.data.listStudentInvites.items
      if (items.length === 0) { setState('not-found'); return }
      const found = items[0]
      setInvite(found)
      setState(found.used ? 'used' : 'ready')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  function handleGetStarted() {
    // Store token so profile/setup can read it after signup
    try { localStorage.setItem('mwm:joinToken', token) } catch { /* ignore */ }
    if (authStatus === 'authenticated') {
      router.push(`/profile/setup?token=${token}`)
    } else {
      router.push(`/signup?redirect=${encodeURIComponent(`/profile/setup?token=${token}`)}`)
    }
  }

  const planLabel = invite?.planType === 'coop' ? 'Co-op Student'
    : invite?.planType === 'virtual' ? 'Virtual Student'
    : invite?.planType === 'self-paced' ? 'Self-Paced'
    : 'Student'

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: '#1E1E2E', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center' }}>
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
          <p style={{ color: 'var(--gray-mid)' }}>Loading your invite…</p>
        )}

        {state === 'not-found' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Invite Not Found</h1>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>This invite link is invalid or has expired. Contact Melinda to get a new one.</p>
          </>
        )}

        {state === 'used' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Already Claimed</h1>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>This invite has already been used. If you already have an account, sign in below.</p>
            <button onClick={() => router.push('/login')} style={{ background: '#7B4FA6', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Something Went Wrong</h1>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>Try again or contact Melinda.</p>
          </>
        )}

        {state === 'ready' && invite && (
          <>
            <div style={{ width: '72px', height: '72px', background: 'rgba(123,79,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ fontSize: '32px' }}>🎓</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
              Welcome, {invite.firstName}!
            </h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              You've been invited to join Math with Melinda as a <strong style={{ color: 'var(--foreground)' }}>{planLabel}</strong>
              {invite.courseTitle ? ` in ${invite.courseTitle}` : ''}.
            </p>

            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>What you'll get access to</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--foreground)', fontSize: '14px', lineHeight: '2.2' }}>
                <li>Video lessons for your course</li>
                <li>Weekly assignments from Melinda</li>
                <li>Grades and teacher feedback</li>
                {invite.planType !== 'self-paced' && <li>Direct messaging with Melinda</li>}
                {invite.planType === 'virtual' && <li>Weekly Zoom sessions</li>}
              </ul>
            </div>

            <button
              onClick={handleGetStarted}
              style={{ background: '#7B4FA6', color: 'white', border: 'none', borderRadius: '8px', padding: '14px 36px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: '12px' }}
            >
              Create My Account
            </button>
            <p style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
              Already have an account?{' '}
              <button onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/profile/setup?token=${token}`)}`)} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}>
                Sign in instead
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
