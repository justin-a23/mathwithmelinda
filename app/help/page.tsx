'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'
import StudentNav from '../components/StudentNav'
import { useRoleGuard } from '../hooks/useRoleGuard'

const client = generateClient()

const GET_MY_COURSE = /* GraphQL */ `
  query GetMyCourse($userId: String!) {
    listStudentProfilesByUserId(userId: $userId, limit: 10) {
      items { courseId }
    }
  }
`

const LIST_TUTORIALS = /* GraphQL */ `
  query ListTutorialVideos {
    listTutorialVideos(limit: 200) {
      items { id title description videoUrl order courseId audience }
    }
  }
`

type Tutorial = {
  id: string
  title: string
  description: string | null
  videoUrl: string
  order: number | null
  courseId: string | null
  audience: string
}

export default function HelpPage() {
  const { checking } = useRoleGuard('student')
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentUser()
        const [profRes, tutRes] = await Promise.all([
          client.graphql({ query: GET_MY_COURSE, variables: { userId: currentUser.userId } }) as any,
          client.graphql({ query: LIST_TUTORIALS }) as any,
        ])
        const myCourseId = profRes.data.listStudentProfilesByUserId.items[0]?.courseId || null
        const items: Tutorial[] = tutRes.data.listTutorialVideos.items
        const mine = items
          .filter(t => t.audience === 'student' && (!t.courseId || t.courseId === myCourseId))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        setTutorials(mine)
      } catch (err) {
        console.error('Error loading tutorials:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <StudentNav />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Help</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px' }}>
          Quick videos on how to use the platform. Stuck on something these don&apos;t cover? Send Mrs. Melinda a message!
        </p>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
        ) : tutorials.length === 0 ? (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
            No tutorial videos yet — check back soon!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {tutorials.map((t, i) => (
              <div key={t.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px 12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--plum)', color: 'white', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    {t.title}
                  </div>
                  {t.description && <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '6px 0 0 34px' }}>{t.description}</p>}
                </div>
                <video controls preload="metadata" poster="/video-poster.svg" style={{ width: '100%', display: 'block', background: '#000' }} src={t.videoUrl} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
