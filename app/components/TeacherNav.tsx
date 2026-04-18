'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from './ThemeToggle'
import { MwmMark } from './MwmLogo'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

const NAV_COUNTS_QUERY = /* GraphQL */`
  query NavCounts {
    listSubmissions(limit: 1000, filter: { isArchived: { ne: true } }) {
      items { id grade status }
    }
    listMessages(limit: 200, filter: { isRead: { eq: false } }) {
      items { id }
    }
    listStudentProfiles(limit: 200, filter: { status: { eq: "pending" } }) {
      items { id }
    }
  }
`

const GET_TEACHER_PROFILE = /* GraphQL */`
  query GetTeacherProfile($userId: String!) {
    listTeacherProfiles(filter: { userId: { eq: $userId } }, limit: 500) {
      items { displayName profilePictureKey }
    }
  }
`

type Props = {
  /** Optional — parent can pass counts to avoid a second fetch on pages that already have them */
  ungradedCount?: number
  unreadCount?: number
}

export default function TeacherNav({ ungradedCount: propUngraded, unreadCount: propUnread }: Props = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthenticator()

  const [ungraded, setUngraded] = useState(propUngraded ?? 0)
  const [unread, setUnread] = useState(propUnread ?? 0)
  const [pendingStudents, setPendingStudents] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [picUrl, setPicUrl] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (propUngraded === undefined || propUnread === undefined) {
      fetchCounts()
    }
  }, [])

  // Re-fetch profile whenever user identity becomes available (avoids race where
  // the auth user wasn't ready on first render and picUrl stays empty)
  useEffect(() => {
    if (user?.userId || user?.username) fetchProfile()
  }, [user?.userId, user?.username])

  // After signOut(), `user` becomes null — redirect to login. signOut() itself
  // is not truly async, so we can't await it; this effect handles the redirect.
  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  async function fetchCounts() {
    try {
      const result = await (client.graphql({ query: NAV_COUNTS_QUERY }) as any)
      const subs = result.data.listSubmissions.items
      const msgs = result.data.listMessages.items
      setUngraded(subs.filter((s: any) => !s.grade && s.status !== 'returned').length)
      setUnread(msgs.length)
      setPendingStudents(result.data.listStudentProfiles.items.length)
    } catch { /* silent — nav badges are non-critical */ }
  }

  async function fetchProfile() {
    try {
      const userId = user?.userId || user?.username || ''
      if (!userId) return
      const result = await (client.graphql({ query: GET_TEACHER_PROFILE, variables: { userId } }) as any)
      const p = result.data.listTeacherProfiles.items[0]
      if (!p) return
      if (p.displayName) setDisplayName(p.displayName)
      if (p.profilePictureKey) {
        if (p.profilePictureKey.startsWith('data:')) {
          setPicUrl(p.profilePictureKey)
        } else {
          const res = await apiFetch('/api/profile-pic?key=' + encodeURIComponent(p.profilePictureKey))
          if (!res.ok) {
            console.warn('Profile pic fetch failed:', res.status, await res.text().catch(() => ''))
            return
          }
          const data = await res.json()
          if (data?.url) setPicUrl(data.url)
        }
      }
    } catch (err) {
      console.warn('fetchProfile error:', err)
    }
  }

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'M'

  // Determine active section
  const isGrades = pathname === '/teacher/grades'
  const isSchedule = pathname === '/teacher/schedule'
  const isMessages = pathname === '/teacher/messages'
  const isStudents = pathname === '/teacher/students'
  const isLessons = pathname.startsWith('/teacher/library')
  // "More" items
  const isGradebook = pathname === '/teacher/gradebook'
  const isTerms = pathname === '/teacher/semesters'
  const isPlans = pathname === '/teacher/plans'
  const isSyllabi = pathname === '/teacher/syllabus'
  const isZoom = pathname === '/teacher/zoom'
  const isReportCard = pathname.startsWith('/teacher/report-card')
  const isPayments = pathname === '/teacher/payments'
  const isProfile = pathname === '/teacher/profile'

  const moreIsActive = isGradebook || isTerms || isPlans || isSyllabi || isZoom || isReportCard || isPayments

  // Label for "More" button when a sub-item is active
  const moreActiveLabel = isGradebook ? 'Gradebook' : isReportCard ? 'Report Card' : isPlans ? 'Assigned Work' : isTerms ? 'Academic Year' : isSyllabi ? 'Syllabi' : isZoom ? 'Meetings' : isPayments ? 'Payments' : null

  function primaryBtn(label: string, path: string, active: boolean, badge?: number) {
    return (
      <button
        key={path}
        onClick={() => router.push(path)}
        style={{
          position: 'relative',
          background: active ? 'white' : 'rgba(255,255,255,0.12)',
          color: active ? 'var(--plum)' : 'rgba(255,255,255,0.92)',
          border: 'none',
          padding: '7px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: active ? 700 : 500,
          fontFamily: 'var(--font-body)',
          transition: 'background 0.15s, color 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
      >
        {label}
        {badge && badge > 0 ? (
          <span style={{
            background: active ? 'var(--plum)' : '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '20px',
            lineHeight: 1.4,
          }}>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </button>
    )
  }

  function dropdownItem(label: string, path: string, active: boolean) {
    return (
      <button
        key={path}
        onClick={() => { setMoreOpen(false); router.push(path) }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: active ? 'var(--plum)' : 'transparent',
          color: active ? 'white' : 'var(--foreground)',
          border: 'none',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          fontFamily: 'var(--font-body)',
          borderRadius: '6px',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--plum-light)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        {label}
      </button>
    )
  }

  return (
    <nav style={{
      background: 'var(--nav-bg)',
      height: '60px',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
    }}>

      {/* Logo — compact */}
      <button
        onClick={() => router.push('/teacher')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px', flexShrink: 0 }}
      >
        <MwmMark size={38} />
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', marginRight: '20px', flexShrink: 0 }} />

      {/* Primary actions — daily use items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {primaryBtn('Grade Work', '/teacher/grades', isGrades, ungraded)}
        {primaryBtn('Schedule', '/teacher/schedule', isSchedule)}
        {primaryBtn('Messages', '/teacher/messages', isMessages, unread)}
        {primaryBtn('Lessons', '/teacher/library', isLessons)}
        {primaryBtn('Students', '/teacher/students', isStudents, pendingStudents)}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', margin: '0 16px', flexShrink: 0 }} />

      {/* More dropdown */}
      <div ref={moreRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          style={{
            background: moreIsActive ? 'white' : moreOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            color: moreIsActive ? 'var(--plum)' : 'rgba(255,255,255,0.85)',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: moreIsActive ? 700 : 500,
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!moreIsActive && !moreOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
          onMouseLeave={e => { if (!moreIsActive && !moreOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        >
          {moreActiveLabel || 'More'}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {moreOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--background)',
            border: '1px solid var(--gray-light)',
            borderRadius: '12px',
            padding: '6px',
            minWidth: '200px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 200,
          }}>
            {dropdownItem('Assigned Work', '/teacher/plans', isPlans)}
            {dropdownItem('Gradebook', '/teacher/gradebook', isGradebook)}
            <div style={{ height: '1px', background: 'var(--gray-light)', margin: '4px 8px' }} />
            {dropdownItem('Meetings', '/teacher/zoom', isZoom)}
            {dropdownItem('Academic Year', '/teacher/semesters', isTerms)}
            {dropdownItem('Syllabi', '/teacher/syllabus', isSyllabi)}
            <div style={{ height: '1px', background: 'var(--gray-light)', margin: '4px 8px' }} />
            {dropdownItem('Payments', '/teacher/payments', isPayments)}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: profile + theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <ThemeToggle />

        <button
          onClick={() => router.push('/teacher/profile')}
          title={displayName || 'My Profile'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
            {picUrl ? (
              <img src={picUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)' }}>{initials}</span>
              </div>
            )}
          </div>
          {displayName && (
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>
              {displayName.split(' ')[0]}
            </span>
          )}
        </button>

        <button
          onClick={() => signOut()}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
