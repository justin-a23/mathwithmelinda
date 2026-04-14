'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from './ThemeToggle'
import { MwmMark } from './MwmLogo'

const client = generateClient()

const LIST_MY_MESSAGES = /* GraphQL */ `
  query ListMyMessages($studentId: String!) {
    listMessages(filter: { studentId: { eq: $studentId } }, limit: 200) {
      items { id teacherReply repliedAt }
    }
  }
`

const GET_STUDENT_PROFILE = /* GraphQL */ `
  query GetStudentProfile($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 500) {
      items { firstName profilePictureKey }
    }
  }
`

type Props = {
  /** Pass the unread reply count if the parent already has messages loaded — avoids a double fetch */
  unreadCount?: number
}

export default function StudentNav({ unreadCount: propUnread }: Props = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthenticator()

  const [unread, setUnread] = useState(propUnread ?? 0)
  const [firstName, setFirstName] = useState('')
  const [profilePic, setProfilePic] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.userId && !user?.username) return
    if (propUnread === undefined) fetchUnread()
    fetchProfile()
  }, [user?.userId])

  async function fetchUnread() {
    try {
      const loginId = user?.signInDetails?.loginId || ''
      const userId = user?.userId || user?.username || ''
      const studentId = loginId || userId
      if (!studentId) return
      const result = await (client.graphql({
        query: LIST_MY_MESSAGES,
        variables: { studentId },
      }) as any)
      const msgs = result.data.listMessages.items
      const lastVisited = parseInt(
        (typeof window !== 'undefined' && localStorage.getItem('mwm:messagesLastVisited')) || '0'
      )
      const count = msgs.filter(
        (m: any) => m.teacherReply && m.repliedAt && new Date(m.repliedAt).getTime() > lastVisited
      ).length
      setUnread(count)
    } catch { /* silent — badge is non-critical */ }
  }

  async function fetchProfile() {
    try {
      const userId = user?.userId || user?.username || ''
      if (!userId) return
      const result = await (client.graphql({
        query: GET_STUDENT_PROFILE,
        variables: { userId },
      }) as any)
      const p = result.data.listStudentProfiles.items[0]
      if (!p) return
      if (p.firstName) setFirstName(p.firstName)
      // profilePictureKey is a base64 data URL for students
      if (p.profilePictureKey) setProfilePic(p.profilePictureKey)
    } catch { /* silent */ }
  }

  const initials = firstName
    ? firstName[0].toUpperCase()
    : (user?.signInDetails?.loginId?.[0] || 'S').toUpperCase()

  const isGrades = pathname === '/student/grades'
  const isMessages = pathname === '/student/messages'
  const isWork = pathname === '/student/submissions'
  const isSyllabus = pathname === '/student/syllabus'

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

  function secondaryLink(label: string, path: string, active: boolean) {
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
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)' }}
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
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
    }}>

      {/* Logo → home */}
      <button
        onClick={() => router.push('/dashboard')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px', flexShrink: 0 }}
      >
        <MwmMark size={28} />
        <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '16px', whiteSpace: 'nowrap' }}>MwM</span>
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', marginRight: '20px', flexShrink: 0 }} />

      {/* Primary nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {primaryBtn('My Grades', '/student/grades', isGrades)}
        {primaryBtn('Messages', '/student/messages', isMessages, unread)}
        {primaryBtn('Turned In', '/student/submissions', isWork)}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', margin: '0 20px', flexShrink: 0 }} />

      {/* Secondary links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {secondaryLink('Syllabus', '/student/syllabus', isSyllabus)}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <ThemeToggle />

        <button
          onClick={() => router.push('/profile')}
          title={firstName || 'My Profile'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)' }}>{initials}</span>
              </div>
            )}
          </div>
          {firstName && (
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>{firstName}</span>
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
