'use client'

import { useEffect, useMemo, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'
import {
  listParentInvitesQuery, listStudentInvitesQuery,
  deleteParentInviteMutation, deleteStudentInviteMutation, parentInviteEmail,
  type ParentInvite, type StudentInvite,
} from '@/app/lib/people'

const client = generateClient()

type RoleFilter = 'all' | 'student' | 'parent'
type StatusFilter = 'all' | 'pending' | 'claimed'

export default function TeacherInvitesPage() {
  const { checking } = useRoleGuard('teacher')

  const [studentInvites, setStudentInvites] = useState<StudentInvite[]>([])
  const [parentInvites, setParentInvites] = useState<ParentInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [search, setSearch] = useState('')

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [sRes, pRes] = await Promise.all([
        client.graphql({ query: listStudentInvitesQuery }) as any,
        client.graphql({ query: listParentInvitesQuery }) as any,
      ])
      const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      setStudentInvites((sRes.data.listStudentInvites.items as StudentInvite[]).sort(byNewest))
      setParentInvites((pRes.data.listParentInvites.items as ParentInvite[]).sort(byNewest))
    } catch (err: any) {
      console.error('Error loading invites:', err)
      setError(err.message || 'Could not load invites.')
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const all = [...studentInvites, ...parentInvites]
    return {
      total: all.length,
      pending: all.filter(i => !i.used).length,
      students: studentInvites.length,
      parents: parentInvites.length,
    }
  }, [studentInvites, parentInvites])

  function matchesFilters(used: boolean | null, haystack: string): boolean {
    if (statusFilter === 'pending' && used) return false
    if (statusFilter === 'claimed' && !used) return false
    const q = search.trim().toLowerCase()
    return !q || haystack.toLowerCase().includes(q)
  }

  const visibleStudents = useMemo(
    () => roleFilter === 'parent' ? [] : studentInvites.filter(
      i => matchesFilters(i.used, `${i.firstName} ${i.lastName} ${i.email} ${i.courseTitle || ''}`)
    ),
    [studentInvites, roleFilter, statusFilter, search]
  )

  const visibleParents = useMemo(
    () => roleFilter === 'student' ? [] : parentInvites.filter(
      i => matchesFilters(i.used, `${i.parentFirstName || ''} ${i.parentLastName || ''} ${i.parentEmail || ''} ${i.studentName}`)
    ),
    [parentInvites, roleFilter, statusFilter, search]
  )

  function copyLink(id: string, link: string) {
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function resendStudent(inv: StudentInvite) {
    setResendingId(inv.id)
    setNotice(null)
    const link = `${window.location.origin}/join/${inv.token}`
    try {
      await apiFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inv.email,
          subject: 'Reminder: Your Math with Melinda invite is waiting 🎓',
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#1E1E2E">Hi ${inv.firstName}!</h2>
            <p style="color:#555;font-size:15px;line-height:1.6">Just a reminder — Melinda has set up your account for Math with Melinda${inv.courseTitle ? ` in <strong>${inv.courseTitle}</strong>` : ''}. Click the link below to get started.</p>
            <a href="${link}" style="display:inline-block;background:#7B4FA6;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin:16px 0">Create My Account →</a>
            <p style="color:#aaa;font-size:13px;word-break:break-all">${link}</p>
          </div>`,
          text: `Hi ${inv.firstName}!\n\nYour invite to Math with Melinda is waiting:\n${link}`,
        }),
      })
      setNotice(`Reminder sent to ${inv.email}.`)
    } catch {
      setNotice('Could not send that reminder — copy the link and share it manually.')
    } finally {
      setResendingId(null)
    }
  }

  async function resendParent(inv: ParentInvite) {
    if (!inv.parentEmail) return
    setResendingId(inv.id)
    setNotice(null)
    const link = `${window.location.origin}/parent/accept/${inv.token}`
    try {
      const body = parentInviteEmail({
        parentFirstName: inv.parentFirstName || '',
        studentName: inv.studentName,
        link,
        isReminder: true,
      })
      await apiFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: inv.parentEmail, ...body }),
      })
      setNotice(`Reminder sent to ${inv.parentEmail}.`)
    } catch {
      setNotice('Could not send that reminder — copy the link and share it manually.')
    } finally {
      setResendingId(null)
    }
  }

  async function removeInvite(id: string, kind: 'student' | 'parent') {
    setDeletingId(id)
    try {
      if (kind === 'student') {
        await client.graphql({ query: deleteStudentInviteMutation, variables: { input: { id } } })
        setStudentInvites(prev => prev.filter(i => i.id !== id))
      } else {
        await client.graphql({ query: deleteParentInviteMutation, variables: { input: { id } } })
        setParentInvites(prev => prev.filter(i => i.id !== id))
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not delete that invite.')
    } finally {
      setDeletingId(null)
    }
  }

  if (checking) return null

  function chip(label: string, active: boolean, onClick: () => void) {
    return (
      <button key={label} onClick={onClick}
        style={{
          background: active ? 'var(--plum)' : 'var(--background)',
          color: active ? 'white' : 'var(--gray-dark)',
          border: `1px solid ${active ? 'var(--plum)' : 'var(--gray-light)'}`,
          borderRadius: '20px', padding: '6px 14px', fontSize: '13px',
          fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
        {label}
      </button>
    )
  }

  const btn: React.CSSProperties = {
    background: 'var(--page-bg)', color: 'var(--foreground)', border: '1px solid var(--gray-light)',
    borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }

  const emptyAfterFilter = !loading && visibleStudents.length === 0 && visibleParents.length === 0

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Invites</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>
          Every student and parent invite. Pending ones can be copied, resent, or deleted.
          {counts.pending > 0 && <> <strong style={{ color: '#b45309' }}>{counts.pending} still waiting to be claimed.</strong></>}
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c' }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>×</button>
          </div>
        )}
        {notice && (
          <div style={{ background: '#F0FDF4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#15803d' }}>
            {notice}
            <button onClick={() => setNotice(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#15803d', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          {chip(`All roles (${counts.total})`, roleFilter === 'all', () => setRoleFilter('all'))}
          {chip(`🎓 Students (${counts.students})`, roleFilter === 'student', () => setRoleFilter('student'))}
          {chip(`👨‍👩‍👧 Parents (${counts.parents})`, roleFilter === 'parent', () => setRoleFilter('parent'))}
          <span style={{ width: '1px', height: '22px', background: 'var(--gray-light)', margin: '0 4px' }} />
          {chip('Pending', statusFilter === 'pending', () => setStatusFilter('pending'))}
          {chip('Claimed', statusFilter === 'claimed', () => setStatusFilter('claimed'))}
          {chip('Any status', statusFilter === 'all', () => setStatusFilter('all'))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            style={{ marginLeft: 'auto', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', minWidth: '220px' }}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)', padding: '40px 0' }}>Loading invites…</p>
        ) : emptyAfterFilter ? (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
            {counts.total === 0 ? 'No invites have been sent yet.' : 'No invites match these filters.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {visibleStudents.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  🎓 Student Invites ({visibleStudents.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visibleStudents.map(inv => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inv.token}`
                    const isUsed = inv.used === true
                    const sent = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <div key={inv.id} style={{ background: 'var(--background)', border: `1px solid ${isUsed ? '#86EFAC' : 'var(--gray-light)'}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', opacity: isUsed ? 0.8 : 1, flexWrap: 'wrap' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUsed ? '#22C55E' : '#F59E0B', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{inv.firstName} {inv.lastName}</span>
                            {inv.courseTitle && <span style={{ fontSize: '11px', background: 'var(--plum-light)', color: 'var(--plum)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{inv.courseTitle}</span>}
                            <span style={{ fontSize: '11px', background: isUsed ? '#D1FAE5' : '#FEF3C7', color: isUsed ? '#065F46' : '#92400E', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              {isUsed ? '✓ Claimed' : '⏳ Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>{inv.email} · Sent {sent}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {!isUsed && (
                            <>
                              <button onClick={() => copyLink(inv.id, link)}
                                style={{ ...btn, background: copiedId === inv.id ? '#D1FAE5' : btn.background, color: copiedId === inv.id ? '#065F46' : btn.color }}>
                                {copiedId === inv.id ? '✓ Copied' : 'Copy Link'}
                              </button>
                              <button onClick={() => resendStudent(inv)} disabled={resendingId === inv.id}
                                style={{ ...btn, color: 'var(--gray-mid)', fontWeight: 500 }}>
                                {resendingId === inv.id ? 'Sending…' : 'Resend'}
                              </button>
                            </>
                          )}
                          <button onClick={() => removeInvite(inv.id, 'student')} disabled={deletingId === inv.id}
                            title="Delete this invite"
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                            {deletingId === inv.id ? '…' : '✕'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {visibleParents.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  👨‍👩‍👧 Parent Invites ({visibleParents.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visibleParents.map(inv => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/parent/accept/${inv.token}`
                    const isUsed = inv.used === true
                    const sent = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const name = inv.parentFirstName
                      ? `${inv.parentFirstName}${inv.parentLastName ? ' ' + inv.parentLastName : ''}`
                      : inv.parentEmail || 'Parent'
                    return (
                      <div key={inv.id} style={{ background: 'var(--background)', border: `1px solid ${isUsed ? '#BAE6FD' : 'var(--gray-light)'}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', opacity: isUsed ? 0.8 : 1, flexWrap: 'wrap' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUsed ? '#0369a1' : '#F59E0B', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{name}</span>
                            <span style={{ fontSize: '11px', background: 'rgba(3,105,161,0.08)', color: '#0369a1', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              for {inv.studentName}
                            </span>
                            <span style={{ fontSize: '11px', background: isUsed ? '#E0F2FE' : '#FEF3C7', color: isUsed ? '#0369a1' : '#92400E', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              {isUsed ? '✓ Claimed' : '⏳ Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                            {inv.parentEmail ? `${inv.parentEmail} · ` : ''}Sent {sent}
                            {!inv.parentEmail && !isUsed && (
                              <span style={{ color: '#b45309', marginLeft: '6px' }}>⚠ No email stored — copy the link to share it</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {!isUsed && (
                            <button onClick={() => copyLink(inv.id, link)}
                              style={{ ...btn, background: copiedId === inv.id ? '#D1FAE5' : btn.background, color: copiedId === inv.id ? '#065F46' : btn.color }}>
                              {copiedId === inv.id ? '✓ Copied' : 'Copy Link'}
                            </button>
                          )}
                          {!isUsed && inv.parentEmail && (
                            <button onClick={() => resendParent(inv)} disabled={resendingId === inv.id}
                              style={{ ...btn, color: 'var(--gray-mid)', fontWeight: 500 }}>
                              {resendingId === inv.id ? 'Sending…' : 'Resend'}
                            </button>
                          )}
                          <button onClick={() => removeInvite(inv.id, 'parent')} disabled={deletingId === inv.id}
                            title="Delete this invite"
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                            {deletingId === inv.id ? '…' : '✕'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
