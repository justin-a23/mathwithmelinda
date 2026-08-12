'use client'

import { useEffect, useMemo, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'
import {
  listParentInvitesQuery, listParentProfilesQuery, listAllParentStudentsQuery,
  listStudentsForPeopleQuery, createParentInviteMutation, createParentStudentMutation,
  deleteParentStudentMutation, randomInviteToken, resolveParentIdentity, parentInviteEmail,
  type ParentInvite, type ParentProfile, type ParentStudentLink, type PersonStudent,
} from '@/app/lib/people'

const client = generateClient()

type ParentRow = {
  parentId: string
  name: string
  email: string
  links: ParentStudentLink[]
  hasAccount: boolean
}

export default function TeacherParentsPage() {
  const { checking } = useRoleGuard('teacher')

  const [profiles, setProfiles] = useState<ParentProfile[]>([])
  const [links, setLinks] = useState<ParentStudentLink[]>([])
  const [invites, setInvites] = useState<ParentInvite[]>([])
  const [students, setStudents] = useState<PersonStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Link-another-child
  const [linkingParentId, setLinkingParentId] = useState<string | null>(null)
  const [linkStudentId, setLinkStudentId] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  // Remove parent
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  // Invite a new parent
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteStudentId, setInviteStudentId] = useState('')
  const [inviteFirst, setInviteFirst] = useState('')
  const [inviteLast, setInviteLast] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [profRes, linkRes, invRes, studRes] = await Promise.all([
        client.graphql({ query: listParentProfilesQuery }) as any,
        client.graphql({ query: listAllParentStudentsQuery }) as any,
        client.graphql({ query: listParentInvitesQuery }) as any,
        client.graphql({ query: listStudentsForPeopleQuery }) as any,
      ])
      setProfiles(profRes.data.listParentProfiles.items)
      setLinks(linkRes.data.listParentStudents.items)
      setInvites(invRes.data.listParentInvites.items)
      setStudents(studRes.data.listStudentProfiles.items)
    } catch (err: any) {
      console.error('Error loading parents:', err)
      setError(err.message || 'Could not load parents.')
    } finally {
      setLoading(false)
    }
  }

  /** One row per parent — union of accounts that exist and accounts with links. */
  const parentRows: ParentRow[] = useMemo(() => {
    const ids = new Set<string>([
      ...profiles.map(p => p.userId),
      ...links.map(l => l.parentId),
    ])
    const rows = [...ids].map(parentId => {
      const { name, email } = resolveParentIdentity(parentId, profiles, links, invites)
      return {
        parentId,
        name,
        email,
        links: links.filter(l => l.parentId === parentId),
        hasAccount: profiles.some(p => p.userId === parentId),
      }
    })
    const q = search.trim().toLowerCase()
    const filtered = q
      ? rows.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.links.some(l => (l.studentName || '').toLowerCase().includes(q)))
      : rows
    return filtered.sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''))
  }, [profiles, links, invites, search])

  const activeStudents = useMemo(
    () => students.filter(s => s.status === 'active')
      .sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName)),
    [students]
  )

  /** Pending invites that have not been claimed — parents who aren't here yet. */
  const pendingInvites = useMemo(() => invites.filter(i => !i.used), [invites])

  async function linkChild(parentId: string) {
    const student = activeStudents.find(s => s.id === linkStudentId)
    if (!student) return
    const already = links.some(
      l => l.parentId === parentId && l.studentEmail.toLowerCase() === student.email.toLowerCase()
    )
    if (already) { setLinkingParentId(null); return }
    setLinkSaving(true)
    try {
      const res = await (client.graphql({
        query: createParentStudentMutation,
        variables: {
          input: {
            parentId,
            studentEmail: student.email.toLowerCase(),
            studentName: `${student.firstName} ${student.lastName}`,
          }
        }
      }) as any)
      const created = res.data.createParentStudent as ParentStudentLink
      setLinks(prev => [...prev, created])
      setLinkingParentId(null)
      setLinkStudentId('')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not link that student.')
    } finally {
      setLinkSaving(false)
    }
  }

  async function unlinkChild(link: ParentStudentLink) {
    setUnlinkingId(link.id)
    try {
      await client.graphql({ query: deleteParentStudentMutation, variables: { input: { id: link.id } } })
      setLinks(prev => prev.filter(l => l.id !== link.id))
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not unlink that student.')
    } finally {
      setUnlinkingId(null)
    }
  }

  async function removeParent(row: ParentRow) {
    setRemoving(true)
    try {
      const profile = profiles.find(p => p.userId === row.parentId) || null
      const res = await apiFetch('/api/delete-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: row.parentId,
          profileId: profile?.id || null,
          parentStudentIds: row.links.map(l => l.id),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Remove failed')
      setProfiles(prev => prev.filter(p => p.userId !== row.parentId))
      setLinks(prev => prev.filter(l => l.parentId !== row.parentId))
      setRemoveConfirmId(null)
      if (json.cognitoError) {
        setError(`Parent removed from the app, but their login could not be deleted (${json.cognitoError}).`)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not remove that parent.')
    } finally {
      setRemoving(false)
    }
  }

  async function sendInvite() {
    const student = activeStudents.find(s => s.id === inviteStudentId)
    if (!student || !inviteEmail.trim()) return
    setInviteSending(true)
    setInviteResult(null)
    try {
      const token = randomInviteToken()
      const studentName = `${student.firstName} ${student.lastName}`
      const res = await (client.graphql({
        query: createParentInviteMutation,
        variables: {
          input: {
            token,
            studentName,
            studentEmail: student.email.toLowerCase(),
            used: false,
            parentEmail: inviteEmail.trim().toLowerCase(),
            parentFirstName: inviteFirst.trim() || null,
            parentLastName: inviteLast.trim() || null,
          }
        }
      }) as any)
      setInvites(prev => [res.data.createParentInvite, ...prev])

      const link = `${window.location.origin}/parent/accept/${token}`
      const body = parentInviteEmail({ parentFirstName: inviteFirst.trim(), studentName, link })
      try {
        await apiFetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: inviteEmail.trim().toLowerCase(), ...body }),
        })
        setInviteResult(`Invite emailed to ${inviteEmail.trim()}.`)
      } catch {
        setInviteResult(`Invite created, but the email failed to send. Copy the link from the Invites page.`)
      }
      setInviteFirst(''); setInviteLast(''); setInviteEmail(''); setInviteStudentId('')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not create that invite.')
    } finally {
      setInviteSending(false)
    }
  }

  if (checking) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)',
    color: 'var(--foreground)', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Parents</h1>
            <p style={{ color: 'var(--gray-mid)', margin: 0 }}>
              Every parent account, the children they follow, and who still needs an invite.
            </p>
          </div>
          <button
            onClick={() => { setInviteOpen(true); setInviteResult(null) }}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
            + Invite a Parent
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', fontSize: '13px', color: '#b91c1c' }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Invite form */}
        {inviteOpen && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--plum-mid)', borderRadius: '12px', padding: '22px 24px', margin: '20px 0 28px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '14px' }}>Invite a Parent</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '5px' }}>Student</label>
                <select value={inviteStudentId} onChange={e => setInviteStudentId(e.target.value)} style={inputStyle}>
                  <option value="">Choose a student…</option>
                  {activeStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '5px' }}>Parent email</label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="parent@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '5px' }}>First name</label>
                <input value={inviteFirst} onChange={e => setInviteFirst(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '5px' }}>Last name</label>
                <input value={inviteLast} onChange={e => setInviteLast(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.5, marginBottom: '14px' }}>
              Already have this parent below? Use <strong>Link another child</strong> on their row instead — an invite is only for creating a brand-new account.
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={sendInvite} disabled={inviteSending || !inviteStudentId || !inviteEmail.trim()}
                style={{ background: inviteSending || !inviteStudentId || !inviteEmail.trim() ? 'var(--gray-light)' : 'var(--plum)', color: inviteSending || !inviteStudentId || !inviteEmail.trim() ? 'var(--gray-mid)' : 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', cursor: inviteSending ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {inviteSending ? 'Sending…' : 'Send Invite'}
              </button>
              <button onClick={() => { setInviteOpen(false); setInviteResult(null) }}
                style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px' }}>
                Close
              </button>
              {inviteResult && <span style={{ fontSize: '13px', color: '#15803d' }}>{inviteResult}</span>}
            </div>
          </div>
        )}

        {/* Search */}
        {!loading && parentRows.length > 0 && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parents or children…"
            style={{ ...inputStyle, maxWidth: '320px', margin: '20px 0 16px' }}
          />
        )}

        {loading ? (
          <p style={{ color: 'var(--gray-mid)', padding: '40px 0' }}>Loading parents…</p>
        ) : parentRows.length === 0 ? (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px', marginTop: '20px' }}>
            No parent accounts yet. Use <strong>Invite a Parent</strong> to send the first one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parentRows.map(row => {
              const isRemoving = removeConfirmId === row.parentId
              const isLinking = linkingParentId === row.parentId
              const linkedEmails = new Set(row.links.map(l => l.studentEmail.toLowerCase()))
              const linkable = activeStudents.filter(s => !linkedEmails.has(s.email.toLowerCase()))
              return (
                <div key={row.parentId} style={{ background: 'var(--background)', border: `1px solid ${isRemoving ? '#fca5a5' : 'var(--gray-light)'}`, borderRadius: '12px', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(3,105,161,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '17px' }}>👤</div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)' }}>
                          {row.name || <span style={{ color: 'var(--gray-mid)', fontStyle: 'italic' }}>Unknown name</span>}
                        </span>
                        {!row.hasAccount && (
                          <span title="Linked to a student, but no parent profile on record"
                            style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', border: '1px solid #fcd34d', padding: '1px 8px', borderRadius: '20px', fontWeight: 600 }}>
                            no profile
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                        {row.email || <span style={{ fontStyle: 'italic' }}>No email on record</span>}
                      </div>

                      {/* Children */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
                        {row.links.length === 0 && (
                          <span style={{ fontSize: '12px', color: '#b45309', fontStyle: 'italic' }}>No children linked</span>
                        )}
                        {row.links.map(l => (
                          <span key={l.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '3px 6px 3px 10px', borderRadius: '20px', fontWeight: 600 }}>
                            {l.studentName}
                            <button
                              onClick={() => unlinkChild(l)}
                              disabled={unlinkingId === l.id}
                              title={`Unlink ${l.studentName}`}
                              style={{ background: 'transparent', border: 'none', color: 'var(--plum)', cursor: 'pointer', padding: '0 2px', fontSize: '13px', lineHeight: 1, opacity: 0.65 }}>
                              {unlinkingId === l.id ? '…' : '×'}
                            </button>
                          </span>
                        ))}
                        {!isLinking && linkable.length > 0 && (
                          <button
                            onClick={() => { setLinkingParentId(row.parentId); setLinkStudentId('') }}
                            style={{ background: 'transparent', color: 'var(--plum)', border: '1px dashed var(--plum-mid)', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            + Link another child
                          </button>
                        )}
                      </div>

                      {isLinking && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <select value={linkStudentId} onChange={e => setLinkStudentId(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '220px' }}>
                            <option value="">Choose a student…</option>
                            {linkable.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                          </select>
                          <button onClick={() => linkChild(row.parentId)} disabled={!linkStudentId || linkSaving}
                            style={{ background: !linkStudentId || linkSaving ? 'var(--gray-light)' : 'var(--plum)', color: !linkStudentId || linkSaving ? 'var(--gray-mid)' : 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: linkSaving ? 'not-allowed' : 'pointer' }}>
                            {linkSaving ? 'Linking…' : 'Link'}
                          </button>
                          <button onClick={() => setLinkingParentId(null)}
                            style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Remove */}
                    <div style={{ flexShrink: 0 }}>
                      {!isRemoving ? (
                        <button onClick={() => setRemoveConfirmId(row.parentId)}
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Remove
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setRemoveConfirmId(null)} disabled={removing}
                            style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                          <button onClick={() => removeParent(row)} disabled={removing}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: removing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            {removing ? 'Removing…' : 'Confirm'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isRemoving && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#FEF2F2', borderRadius: '6px', fontSize: '12px', color: '#b91c1c', lineHeight: 1.5 }}>
                      Deletes their login and unlinks {row.links.length === 1 ? 'their child' : `all ${row.links.length} children`}. Student grades and submissions are not affected.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Awaiting signup */}
        {!loading && pendingInvites.length > 0 && (
          <div style={{ marginTop: '40px', borderTop: '1px solid var(--gray-light)', paddingTop: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '4px' }}>
              Awaiting Signup ({pendingInvites.length})
            </div>
            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '14px' }}>
              Invited but haven&apos;t created an account yet. Manage or resend these on the Invites page.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pendingInvites.map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 14px', flexWrap: 'wrap' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>
                    {inv.parentFirstName ? `${inv.parentFirstName}${inv.parentLastName ? ' ' + inv.parentLastName : ''}` : (inv.parentEmail || 'Parent')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                    for {inv.studentName}{inv.parentEmail ? ` · ${inv.parentEmail}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
