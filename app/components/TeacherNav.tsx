'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from './ThemeToggle'
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

  useEffect(() => {
    // Only fetch counts if not provided by parent
    if (propUngraded === undefined || propUnread === undefined) {
      fetchCounts()
    }
    fetchProfile()
  }, [])

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
          const { url } = await res.json()
          setPicUrl(url)
        }
      }
    } catch { /* silent */ }
  }

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'M'

  // Determine active section
  const isGrades = pathname === '/teacher/grades'
  const isSchedule = pathname === '/teacher/schedule'
  const isMessages = pathname === '/teacher/messages'
  const isLessons = pathname.startsWith('/teacher/library')
  const isGradebook = pathname === '/teacher/gradebook'
  const isStudents = pathname === '/teacher/students'
  const isTerms = pathname === '/teacher/semesters'
  const isPlans = pathname === '/teacher/plans'
  const isSyllabi = pathname === '/teacher/syllabus'
  const isZoom = pathname === '/teacher/zoom'

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

  function secondaryLink(label: string, path: string, active: boolean, badge?: number) {
    return (
      <button
        key={path}
        onClick={() => router.push(path)}
        style={{
          background: 'none',
          border: 'none',
          color: active ? 'white' : 'rgba(255,255,255,0.55)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          fontFamily: 'var(--font-body)',
          padding: '4px 2px',
          textDecoration: active ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)' }}
      >
        {label}
        {badge && badge > 0 ? (
          <span style={{
            background: '#f59e0b',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '20px',
            lineHeight: 1.4,
          }}>
            {badge}
          </span>
        ) : null}
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
        <div style={{ width: '28px', height: '28px', background: 'var(--plum)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
            <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
            <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '16px', whiteSpace: 'nowrap' }}>MwM</span>
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', marginRight: '20px', flexShrink: 0 }} />

      {/* Primary actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {primaryBtn('Grade Work', '/teacher/grades', isGrades, ungraded)}
        {primaryBtn('Schedule', '/teacher/schedule', isSchedule)}
        {primaryBtn('Messages', '/teacher/messages', isMessages, unread)}
        {primaryBtn('Manage Lessons', '/teacher/library', isLessons)}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', margin: '0 20px', flexShrink: 0 }} />

      {/* Secondary links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {secondaryLink('Assigned Work', '/teacher/plans', isPlans)}
        {secondaryLink('Gradebook', '/teacher/gradebook', isGradebook)}
        {secondaryLink('Students', '/teacher/students', isStudents, pendingStudents)}
        {secondaryLink('Meetings', '/teacher/zoom', isZoom)}
        {secondaryLink('Academic Year', '/teacher/semesters', isTerms)}
        {secondaryLink('Syllabi', '/teacher/syllabus', isSyllabi)}
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
          onClick={() => { signOut(); router.replace('/login') }}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
