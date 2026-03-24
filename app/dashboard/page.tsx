'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  const courses = [
    { title: 'Arithmetic 6', lessons: 12, due: 3 },
    { title: 'Middle School Math', lessons: 15, due: 0 },
    { title: 'Pre-Algebra', lessons: 18, due: 1 },
    { title: 'Algebra 1', lessons: 24, due: 0 },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--white)', minHeight: '100vh' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{user?.signInDetails?.loginId}</span>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--charcoal)', marginBottom: '8px' }}>
          Welcome back!
        </h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Pick up where you left off.</p>

        <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>
          Your Courses
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {courses.map((course) => (
            <div key={course.title} style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,79,166,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ width: '40px', height: '40px', background: 'var(--plum-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <rect x="17" y="6" width="6" height="28" rx="3" fill="var(--plum)"/>
                  <rect x="6" y="17" width="28" height="6" rx="3" fill="var(--plum)"/>
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--charcoal)', marginBottom: '8px' }}>{course.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>{course.lessons} lessons</div>
              {course.due > 0 && (
                <span style={{ background: 'var(--accent)', color: 'var(--charcoal)', fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px' }}>
                  {course.due} due
                </span>
              )}
              <div style={{ marginTop: '16px', color: 'var(--plum)', fontSize: '13px', fontWeight: 500 }}>Continue →</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}