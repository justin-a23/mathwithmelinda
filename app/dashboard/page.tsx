'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../ThemeProvider'
const listWeeklyPlansWithItems = /* GraphQL */`
  query ListWeeklyPlansWithItems {
    listWeeklyPlans {
      items {
        id
        weekStartDate
        course {
          id
          title
        }
        items {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            lesson {
              id
              title
              videoUrl
              order
            }
          }
        }
      }
    }
  }
`

const client = generateClient()

type WeeklyPlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  lesson?: {
    id: string
    title: string
    videoUrl: string | null
    order: number | null
  } | null
}

type WeeklyPlan = {
  id: string
  weekStartDate: string
  course?: {
    id: string
    title: string
  } | null
  items?: {
    items: WeeklyPlanItem[]
  } | null
}

export default function Dashboard() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    fetchWeeklyPlans()
  }, [])

  async function fetchWeeklyPlans() {
    try {
      const result = await client.graphql({
        query: listWeeklyPlansWithItems,
        variables: {}
      }) as any
      const plans = result.data.listWeeklyPlans.items as WeeklyPlan[]
      const sorted = plans.sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())
      setWeeklyPlans(sorted.slice(0, 2))
    } catch (err) {
      console.error('Error fetching weekly plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                 Sign out
               </button>
            </div>
        </div>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
          Welcome back!
        </h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Today is {today}. Here are your lessons.</p>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading your lessons...</p>
        ) : weeklyPlans.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)' }}>No lessons scheduled yet. Check back soon!</p>
        ) : (
          weeklyPlans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>
                Week of {new Date(plan.weekStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plan.items?.items
                  .filter(item => item.isPublished)
                  .sort((a, b) => {
                    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek)
                  })
                  .map((item) => (
                    <div key={item.id}
                      onClick={() => router.push('/lessons')}
                      style={{ background: item.dayOfWeek === today ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${item.dayOfWeek === today ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,79,166,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--plum)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.dayOfWeek}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>
                          {item.lesson?.title || 'Lesson'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '8px' }}>Due by {item.dueTime ? new Date(`2000-01-01T${item.dueTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '5:00 PM'}</div>
                        <span style={{ background: 'var(--plum)', color: 'white', fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>Watch →</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}