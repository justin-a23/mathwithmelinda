'use client'

/**
 * Review mode: video-only replay of a COMPLETED lesson.
 *
 * Melinda's rules (2026-08-06): students may re-watch a lesson video only when
 * that lesson was assigned to them AND they've turned it in (a participation
 * credit counts — it's how a Friday in-class day completes). No questions, no
 * submitting, nothing that isn't the teaching itself: the full lesson page
 * stays reserved for open assignments and returned work.
 */

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import StudentNav from '../../components/StudentNav'
import { studentKey } from '@/app/lib/identity'
import { useRoleGuard } from '@/app/hooks/useRoleGuard'

const client = generateClient()
const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

const GET_ITEM = /* GraphQL */`
  query GetWeeklyPlanItem($id: ID!) {
    getWeeklyPlanItem(id: $id) {
      id
      dayOfWeek
      isInClass
      weeklyPlan {
        weekStartDate
        assignedStudentIds
        course { id title }
      }
      lesson { id title videoUrl order }
    }
  }
`

const GET_MY_PROFILE = /* GraphQL */`
  query GetMyProfile($userId: String!) {
    listStudentProfilesByUserId(userId: $userId, limit: 10) {
      items { id courseId }
    }
  }
`

const MY_SUBMISSIONS = /* GraphQL */`
  query MySubs($studentId: String!) {
    listSubmissionsByStudentId(studentId: $studentId, limit: 500) {
      items { id content isArchived }
    }
  }
`

type State = 'loading' | 'ready' | 'not-allowed' | 'not-found'

function ReviewInner() {
  const { checking } = useRoleGuard('student')
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemId = searchParams.get('id') || ''

  const [state, setState] = useState<State>('loading')
  const [title, setTitle] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isInClass, setIsInClass] = useState(false)

  const studentId = studentKey(user)

  useEffect(() => {
    if (!itemId || !studentId) return
    let cancelled = false

    async function load() {
      try {
        const [itemRes, profileRes, subsRes] = await Promise.all([
          client.graphql({ query: GET_ITEM, variables: { id: itemId } }) as any,
          client.graphql({ query: GET_MY_PROFILE, variables: { userId: studentId } }) as any,
          client.graphql({ query: MY_SUBMISSIONS, variables: { studentId } }) as any,
        ])
        if (cancelled) return

        const item = itemRes.data?.getWeeklyPlanItem
        if (!item?.lesson) { setState('not-found'); return }

        // Rule 1 — the lesson must belong to THIS student's course
        const profile = profileRes.data?.listStudentProfilesByUserId?.items?.[0]
        const courseId = item.weeklyPlan?.course?.id
        if (!profile?.courseId || !courseId || profile.courseId !== courseId) {
          setState('not-allowed'); return
        }

        // Rule 2 — the plan must have been assigned to them (empty/null = whole class)
        if (item.weeklyPlan?.assignedStudentIds) {
          try {
            const ids = JSON.parse(item.weeklyPlan.assignedStudentIds)
            if (Array.isArray(ids) && ids.length > 0 && !ids.includes(studentId)) {
              setState('not-allowed'); return
            }
          } catch { /* unparseable = whole class */ }
        }

        // Rule 3 — they must have turned it in (participation credit included:
        // it's a submission like any other)
        const subs = subsRes.data?.listSubmissionsByStudentId?.items ?? []
        const turnedIn = subs.some((s: any) => {
          if (s.isArchived) return false
          try { return JSON.parse(s.content || '{}').lessonId === item.lesson.id } catch { return false }
        })
        if (!turnedIn) { setState('not-allowed'); return }

        const url = item.lesson.videoUrl
          ? (item.lesson.videoUrl.startsWith('http') ? item.lesson.videoUrl : `${CLOUDFRONT_URL}/${item.lesson.videoUrl}`)
          : null
        setTitle(item.lesson.title || 'Lesson')
        setCourseTitle(item.weeklyPlan?.course?.title || '')
        setIsInClass(item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday'))
        setVideoSrc(url)
        setState('ready')
      } catch (err) {
        console.error('Review load failed:', err)
        if (!cancelled) setState('not-found')
      }
    }

    load()
    return () => { cancelled = true }
  }, [itemId, studentId])

  if (checking) return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Loading…</p>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <StudentNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {state === 'loading' && (
          <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '48px 0' }}>Loading…</p>
        )}

        {(state === 'not-found' || state === 'not-allowed') && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔒</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '10px' }}>
              {state === 'not-found' ? 'Lesson not found' : 'This video isn’t available to review'}
            </h1>
            <p style={{ color: 'var(--gray-mid)', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 24px' }}>
              You can review videos from lessons in your class after you’ve turned them in.
            </p>
            <button onClick={() => router.push('/student/submissions')}
              style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Back to Turned In Work
            </button>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--plum)', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', padding: '3px 10px', borderRadius: '12px' }}>
                ▶ Review
              </span>
              {courseTitle && <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{courseTitle}</span>}
              {isInClass && <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>🏫 In-class day</span>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '20px' }}>{title}</h1>

            {videoSrc ? (
              <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: '16/9' }}>
                <video controls playsInline style={{ width: '100%', height: '100%' }} src={videoSrc} />
              </div>
            ) : (
              <p style={{ color: 'var(--gray-mid)', textAlign: 'center', padding: '48px 0', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)' }}>
                This lesson doesn’t have a video.
              </p>
            )}

            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginTop: '16px', lineHeight: 1.6 }}>
              You’ve already completed this lesson — this is a replay of the video for review.
              Your submitted work and grade are on <a href="/student/submissions" style={{ color: 'var(--plum)' }}>Turned In Work</a>.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

export default function LessonReviewPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
      </div>
    }>
      <ReviewInner />
    </Suspense>
  )
}
