'use client'

import { signIn, signOut, fetchAuthSession, resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import MwmLogo from '../components/MwmLogo'
import { generateClient } from 'aws-amplify/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { roleFromGroups, homeFor } from '@/app/lib/roles'

const client = generateClient()

const listStudentProfilesQuery = /* GraphQL */`
  query ListStudentProfiles($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter) {
      items { id userId status }
    }
  }
`

async function getRedirectAfterLogin(redirect: string | null): Promise<string> {
  if (redirect) return redirect
  try {
    const session = await fetchAuthSession()
    const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) ?? []
    const role = roleFromGroups(groups)
    if (role !== 'student') return homeFor(role)
    // Student — check if profile exists
    try {
      const userId = session.tokens?.accessToken?.payload?.sub as string
      const result = await client.graphql({
        query: listStudentProfilesQuery,
        variables: { filter: { userId: { eq: userId } } }
      }) as any
      const items = result.data.listStudentProfiles.items
      return (items && items.length > 0) ? '/dashboard' : '/profile/setup'
    } catch {
      return '/dashboard'
    }
  } catch {
    return '/dashboard'
  }
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Forgot-password: 'request' emails a 6-digit code, 'confirm' takes
  // code + new password. Launch day surfaced that no reset existed at all.
  const [view, setView] = useState<'signin' | 'reset-request' | 'reset-confirm'>('signin')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState('')

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Enter your email first.'); return }
    setSubmitting(true)
    try {
      await resetPassword({ username: email.trim().toLowerCase() })
      setNotice(`We emailed a 6-digit code to ${email.trim().toLowerCase()}. Enter it below with your new password.`)
      setView('reset-confirm')
    } catch (err: any) {
      if (err.name === 'UserNotFoundException') setError('No account found with this email.')
      else if (err.name === 'LimitExceededException') setError('Too many attempts — wait a few minutes and try again.')
      else setError(err.message || 'Could not start the reset. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!resetCode.trim() || !newPassword) { setError('Enter the code from your email and a new password.'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)
    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: resetCode.trim(),
        newPassword,
      })
      setPassword('')
      setResetCode('')
      setNewPassword('')
      setNotice('Password updated! Sign in with your new password below.')
      setView('signin')
    } catch (err: any) {
      if (err.name === 'CodeMismatchException') setError('That code doesn’t match — check the email and try again.')
      else if (err.name === 'ExpiredCodeException') setError('That code expired. Go back and request a new one.')
      else setError(err.message || 'Could not reset the password. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setSubmitting(true)
    try {
      // Clear any stale session before signing in — prevents
      // "There is already a signed in user" from Amplify
      try { await signOut() } catch { /* no session — that's fine */ }
      await signIn({ username: email.trim().toLowerCase(), password })
      const dest = await getRedirectAfterLogin(redirect)
      router.replace(dest)
    } catch (err: any) {
      if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password. Please try again.')
      } else if (err.name === 'UserNotFoundException') {
        setError('No account found with this email.')
      } else if (err.name === 'UserNotConfirmedException') {
        // Send them to signup to complete verification
        router.replace(`/signup?mode=verify&email=${encodeURIComponent(email.trim().toLowerCase())}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`)
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid var(--gray-light)',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: '#1E1E2E', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <MwmLogo size={36} showWordmark />
      </nav>

      <main style={{ maxWidth: '440px', margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(123,79,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: '26px' }}>👋</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--foreground)', margin: '0 0 8px' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>
            Sign in to your Math with Melinda account.
          </p>
        </div>

        {notice && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#15803D', marginBottom: '16px' }}>
            {notice}
          </div>
        )}

        {view !== 'signin' && (
          <form onSubmit={view === 'reset-request' ? handleResetRequest : handleResetConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={view === 'reset-confirm'}
                style={{ ...inputStyle, ...(view === 'reset-confirm' ? { background: 'var(--gray-light)', color: 'var(--gray-dark)' } : {}) }}
              />
            </div>

            {view === 'reset-confirm' && (
              <>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                    6-digit code from your email
                  </label>
                  <input
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ background: submitting ? 'var(--gray-mid)' : '#7B4FA6', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)', marginTop: '4px' }}
            >
              {submitting ? 'Working…' : view === 'reset-request' ? 'Email Me a Reset Code' : 'Set New Password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
              {view === 'reset-confirm' && (
                <>
                  <button type="button" onClick={() => { setView('reset-request'); setError(''); setNotice('') }} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)' }}>
                    Resend code
                  </button>
                  {' · '}
                </>
              )}
              <button type="button" onClick={() => { setView('signin'); setError(''); setNotice('') }} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)' }}>
                Back to sign in
              </button>
            </p>
          </form>
        )}

        {view === 'signin' && (
        <form onSubmit={handleSignin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '12px', fontWeight: 600, padding: 0 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: submitting ? 'var(--gray-mid)' : '#7B4FA6', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)', marginTop: '4px' }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
            <button type="button" onClick={() => { setView('reset-request'); setError(''); setNotice('') }} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)' }}>
              Forgot password?
            </button>
            {' · '}
            New student or parent?{' '}
            <button type="button" onClick={() => router.push('/signup')} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)' }}>
              Create an account
            </button>
          </p>
        </form>
        )}
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
