'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

const findInviteByToken = /* GraphQL */`
  query ListParentInvites($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 1) {
      items {
        id
        token
        studentEmail
        studentName
        used
      }
    }
  }
`

const updateParentInvite = /* GraphQL */`
  mutation UpdateParentInvite($input: UpdateParentInviteInput!) {
    updateParentInvite(input: $input) {
      id
      used
    }
  }
`

const createParentStudent = /* GraphQL */`
  mutation CreateParentStudent($input: CreateParentStudentInput!) {
    createParentStudent(input: $input) {
      id
      parentId
      studentEmail
      studentName
    }
  }
`

const listParentStudentLinks = /* GraphQL */`
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 5) {
      items {
        id
      }
    }
  }
`

type Invite = {
  id: string
  token: string
  studentEmail: string
  studentName: string
  used: boolean | null
}

type State = 'loading' | 'not-found' | 'already-used' | 'already-linked' | 'ready' | 'confirming' | 'done' | 'error'

export default function AcceptInvitePage() {
  const { user, authStatus } = useAuthenticator()
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  const [invite, setInvite] = useState<Invite | null>(null)
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace(`/login?redirect=/parent/accept/${token}`)
    }
  }, [authStatus, router, token])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !token) return
    loadInvite()
  }, [authStatus, token])

  async function loadInvite() {
    setState('loading')
    try {
      const result = await client.graphql({
        query: findInviteByToken,
        variables: { filter: { token: { eq: token } } }
      }) as any
      const items = (result.data as { listParentInvites: { items: Invite[] } }).listParentInvites.items

      if (items.length === 0) {
        setState('not-found')
        return
      }

      const found = items[0]
      setInvite(found)

      if (found.used) {
        // Check if this parent is already linked to this student
        const linkResult = await client.graphql({
          query: listParentStudentLinks,
          variables: { filter: { parentId: { eq: user?.userId }, studentEmail: { eq: found.studentEmail } } }
        }) as any
        const links = (linkResult.data as { listParentStudents: { items: { id: string }[] } }).listParentStudents.items
        setState(links.length > 0 ? 'already-linked' : 'already-used')
        return
      }

      setState('ready')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  async function confirmLink() {
    if (!invite || !user) return
    setState('confirming')
    try {
      // Create the parent-student link
      await client.graphql({
        query: createParentStudent,
        variables: {
          input: {
            parentId: user.userId,
            studentEmail: invite.studentEmail,
            studentName: invite.studentName
          }
        }
      })
      // Mark invite as used
      await client.graphql({
        query: updateParentInvite,
        variables: { input: { id: invite.id, used: true } }
      })
      setState('done')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>

        {state === 'loading' && (
          <p style={{ color: 'var(--gray-mid)' }}>Verifying invite...</p>
        )}

        {state === 'not-found' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>Invite Not Found</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6' }}>This invite link is invalid or has expired. Ask Melinda to send a new one.</p>
          </>
        )}

        {state === 'already-used' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>Link Already Used</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>This invite has already been claimed by another account. If this is a mistake, contact Melinda.</p>
            <button onClick={() => router.push('/parent')} style={{ background: 'var(--plum)', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Go to Parent Portal
            </button>
          </>
        )}

        {state === 'already-linked' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>Already Connected</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>You're already linked to <strong>{invite?.studentName}</strong>. Head to your parent portal to view their grades.</p>
            <button onClick={() => router.push('/parent')} style={{ background: 'var(--plum)', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Go to Parent Portal
            </button>
          </>
        )}

        {state === 'ready' && invite && (
          <>
            <div style={{ width: '64px', height: '64px', background: 'var(--plum-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>Parent Invite</div>
            <p style={{ color: 'var(--gray-mid)', fontSize: '15px', lineHeight: '1.7', marginBottom: '32px' }}>
              You've been invited to view grades and submitted work for <strong style={{ color: 'var(--foreground)' }}>{invite.studentName}</strong> in Math with Melinda.
            </p>
            <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--plum)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>You'll be able to see</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--foreground)', fontSize: '14px', lineHeight: '2' }}>
                <li>All submitted assignments</li>
                <li>Grades and teacher comments</li>
                <li>Photos of submitted work</li>
              </ul>
            </div>
            <button onClick={confirmLink}
              style={{ background: 'var(--plum)', color: 'white', padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500, width: '100%' }}>
              Connect to {invite.studentName}'s Account
            </button>
          </>
        )}

        {state === 'confirming' && (
          <p style={{ color: 'var(--gray-mid)' }}>Connecting your account...</p>
        )}

        {state === 'done' && invite && (
          <>
            <div style={{ width: '64px', height: '64px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '12px' }}>You're all set!</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '32px' }}>
              You're now connected to <strong style={{ color: 'var(--foreground)' }}>{invite.studentName}</strong>. Head to your parent portal to view their grades.
            </p>
            <button onClick={() => router.push('/parent')}
              style={{ background: 'var(--plum)', color: 'white', padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500, width: '100%' }}>
              Go to Parent Portal
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '16px' }}>Something went wrong</div>
            <p style={{ color: 'var(--gray-mid)', lineHeight: '1.6', marginBottom: '24px' }}>There was an error processing your invite. Please try again or contact Melinda.</p>
            <button onClick={loadInvite} style={{ background: 'var(--plum)', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Try Again
            </button>
          </>
        )}
      </main>
    </div>
  )
}
