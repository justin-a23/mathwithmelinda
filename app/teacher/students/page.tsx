'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

const listParentInvites = /* GraphQL */`
  query ListParentInvites {
    listParentInvites(limit: 200) {
      items {
        id
        token
        studentEmail
        studentName
        used
        createdAt
      }
    }
  }
`

const createParentInvite = /* GraphQL */`
  mutation CreateParentInvite($input: CreateParentInviteInput!) {
    createParentInvite(input: $input) {
      id
      token
      studentEmail
      studentName
      used
      createdAt
    }
  }
`

const deleteParentInvite = /* GraphQL */`
  mutation DeleteParentInvite($input: DeleteParentInviteInput!) {
    deleteParentInvite(input: $input) {
      id
    }
  }
`

type Invite = {
  id: string
  token: string
  studentEmail: string
  studentName: string
  used: boolean | null
  createdAt: string
}

function randomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function StudentsPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    fetchInvites()
  }, [])

  async function fetchInvites() {
    try {
      const result = await client.graphql({ query: listParentInvites })
      const items = (result.data as { listParentInvites: { items: Invite[] } }).listParentInvites.items
      setInvites(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createInvite() {
    if (!studentName.trim() || !studentEmail.trim()) return
    setCreating(true)
    try {
      const token = randomToken()
      const result = await client.graphql({
        query: createParentInvite,
        variables: { input: { token, studentName: studentName.trim(), studentEmail: studentEmail.trim().toLowerCase(), used: false } }
      })
      const newInvite = (result.data as { createParentInvite: Invite }).createParentInvite
      setInvites(prev => [newInvite, ...prev])
      setStudentName('')
      setStudentEmail('')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  async function removeInvite(id: string) {
    try {
      await client.graphql({ query: deleteParentInvite, variables: { input: { id } } })
      setInvites(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  function copyLink(invite: Invite) {
    const origin = window.location.origin
    navigator.clipboard.writeText(`${origin}/parent/accept/${invite.token}`)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mathwithmelinda.com'

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
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', marginLeft: '8px' }}>Teacher</span>
        </div>
        <button onClick={() => router.push('/teacher')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ← Back
        </button>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Students & Parent Invites</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Generate a link for each student's parent. They'll use it to create their parent account and view grades.</p>

        {/* Create invite form */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '20px' }}>Create Parent Invite</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="e.g. Emma Johnson"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Student's Login Email</label>
              <input
                type="email"
                value={studentEmail}
                onChange={e => setStudentEmail(e.target.value)}
                placeholder="emma@example.com"
                onKeyDown={e => e.key === 'Enter' && createInvite()}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button onClick={createInvite} disabled={creating || !studentName.trim() || !studentEmail.trim()}
            style={{ background: (!studentName.trim() || !studentEmail.trim()) ? 'var(--gray-light)' : 'var(--plum)', color: (!studentName.trim() || !studentEmail.trim()) ? 'var(--gray-mid)' : 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            {creating ? 'Generating...' : 'Generate Invite Link'}
          </button>
        </div>

        {/* Invite list */}
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '16px' }}>
          Invite Links ({invites.length})
        </div>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
        ) : invites.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No invites yet. Create one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {invites.map(invite => (
              <div key={invite.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500, fontSize: '15px', color: 'var(--foreground)' }}>{invite.studentName}</span>
                    {invite.used && (
                      <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>Claimed</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '6px' }}>{invite.studentEmail}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-mid)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {baseUrl}/parent/accept/{invite.token}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => copyLink(invite)}
                    style={{ background: copiedId === invite.id ? '#D1FAE5' : 'var(--plum-light)', color: copiedId === invite.id ? '#065F46' : 'var(--plum)', border: `1px solid ${copiedId === invite.id ? '#6EE7B7' : 'var(--plum-mid)'}`, padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    {copiedId === invite.id ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={() => removeInvite(invite.id)}
                    style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
