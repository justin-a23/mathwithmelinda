'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

export default function LessonPage() {
  const { user } = useAuthenticator()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh' }}>
      
      {/* Nav */}
      <nav style={{ background: 'var(--charcoal)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ← Back to Dashboard
        </button>
      </nav>

      {/* Video Player */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '8px' }}>
          Algebra 1
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '24px' }}>
          Lesson 143 — Introduction to Rational Expressions
        </h1>

        {/* Video */}
        <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '32px', aspectRatio: '16/9' }}>
          <video
            controls
            style={{ width: '100%', height: '100%' }}
            src={`${CLOUDFRONT_URL}/algebra1/Algebra 1 - Lesson 143 - Introduction to Rational Expressions.mp4`}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Lesson info */}
        <div style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--charcoal)', marginBottom: '8px' }}>
            About this lesson
          </h2>
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px', lineHeight: '1.7' }}>
            Watch the video above and complete the assigned worksheet. Submit your work before the due date.
          </p>
        </div>
      </main>
    </div>
  )
}