'use client'

import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SignupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/profile/setup'

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    try {
      await signUp({
        username: email.trim().toLowerCase(),
        password,
        options: { userAttributes: { email: email.trim().toLowerCase() } },
      })
      setStep('verify')
    } catch (err: any) {
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Sign in instead.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!code.trim()) { setError('Please enter the verification code.'); return }
    setSubmitting(true)
    try {
      await confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode: code.trim() })
      // Auto sign-in after confirmation
      await signIn({ username: email.trim().toLowerCase(), password })
      router.replace(redirect)
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.')
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

      <main style={{ maxWidth: '440px', margin: '0 auto', padding: '72px 24px' }}>

        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(123,79,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: '26px' }}>🎓</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--foreground)', margin: '0 0 8px' }}>
                Create your account
              </h1>
              <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>
                Use the same email address your invite was sent to.
              </p>
            </div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
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

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C' }}>
                  {error}
                  {error.includes('already exists') && (
                    <span> <button type="button" onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 700, fontSize: '13px', padding: 0 }}>Sign in →</button></span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ background: submitting ? 'var(--gray-mid)' : '#7B4FA6', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)', marginTop: '4px' }}
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
                Already have an account?{' '}
                <button type="button" onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0 }}>
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ width: '56px', height: '56px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: '26px' }}>✉️</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--foreground)', margin: '0 0 8px' }}>
                Check your email
              </h1>
              <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                We sent a 6-digit verification code to<br/>
                <strong style={{ color: 'var(--foreground)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  style={{ ...inputStyle, fontSize: '24px', letterSpacing: '6px', textAlign: 'center' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || code.length < 6}
                style={{ background: (submitting || code.length < 6) ? 'var(--gray-mid)' : '#7B4FA6', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', cursor: (submitting || code.length < 6) ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                {submitting ? 'Verifying…' : 'Verify & Continue'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-mid)', margin: 0 }}>
                Didn&apos;t get it? Check your spam folder or{' '}
                <button type="button" onClick={() => { setStep('form'); setError(''); setCode('') }} style={{ background: 'none', border: 'none', color: '#7B4FA6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0 }}>
                  try again
                </button>
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </div>
    }>
      <SignupInner />
    </Suspense>
  )
}
