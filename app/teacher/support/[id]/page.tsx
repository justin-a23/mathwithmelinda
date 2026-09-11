'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../../components/TeacherNav'
import { useRoleGuard } from '../../../hooks/useRoleGuard'
import { useIsAdmin } from '../../../hooks/useIsAdmin'
import { useResolvedUser } from '../../../hooks/useResolvedUser'
import { apiFetch } from '@/app/lib/apiFetch'
import { fetchAllPages } from '@/app/lib/fetchAllPages'
import {
  CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS, KNOWN_PAGES, statusLabel,
  parseScreenshotKeys, type SupportTicket, type SupportTicketNote,
  type TicketCategory, type TicketSeverity,
} from '@/app/lib/support'

const client = generateClient()

const GET_SUPPORT_TICKET = /* GraphQL */ `
  query GetSupportTicket($id: ID!) {
    getSupportTicket(id: $id) {
      id requesterId requesterName requesterEmail category severity title description
      pageUrl stepsTaken actualBehavior expectedBehavior screenshotKeys
      status resolutionSummary resolvedAt submittedAt
    }
  }
`

const LIST_TICKET_NOTES = /* GraphQL */ `
  query ListTicketNotes($ticketId: String!, $nextToken: String) {
    listSupportTicketNotes(limit: 200, filter: { ticketId: { eq: $ticketId } }, nextToken: $nextToken) {
      items { id ticketId authorId authorName body createdAtIso }
      nextToken
    }
  }
`

const UPDATE_SUPPORT_TICKET = /* GraphQL */ `
  mutation UpdateSupportTicket($input: UpdateSupportTicketInput!) {
    updateSupportTicket(input: $input) { id status resolutionSummary resolvedAt }
  }
`

const CREATE_TICKET_NOTE = /* GraphQL */ `
  mutation CreateTicketNote($input: CreateSupportTicketNoteInput!) {
    createSupportTicketNote(input: $input) { id ticketId authorId authorName body createdAtIso }
  }
`

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const fieldLabel = {
  fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px',
} as const

export default function SupportTicketDetailPage() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const params = useParams()
  const ticketId = params?.id as string
  const isAdmin = useIsAdmin()
  const { userId, loginId } = useResolvedUser()

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [notes, setNotes] = useState<SupportTicketNote[]>([])
  const [shotUrls, setShotUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [statusDraft, setStatusDraft] = useState('')
  const [summaryDraft, setSummaryDraft] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminSaved, setAdminSaved] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (checking || !ticketId) return
    let cancelled = false
    async function load() {
      try {
        const [ticketRes, noteItems] = await Promise.all([
          (client.graphql({ query: GET_SUPPORT_TICKET, variables: { id: ticketId } }) as any),
          fetchAllPages<SupportTicketNote>(client, LIST_TICKET_NOTES, 'listSupportTicketNotes', { ticketId }),
        ])
        if (cancelled) return
        const t = ticketRes?.data?.getSupportTicket
        if (!t) { setLoadError('Ticket not found.'); setLoading(false); return }
        setTicket(t)
        setStatusDraft(t.status)
        setSummaryDraft(t.resolutionSummary || '')
        setNotes(noteItems.sort((a, b) => new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime()))
        setLoading(false)

        // Presign screenshots on demand — email links point here precisely
        // because presigned URLs expire.
        for (const key of parseScreenshotKeys(t.screenshotKeys)) {
          apiFetch('/api/view-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
            .then(r => r.json())
            .then(d => { if (!cancelled && d.url) setShotUrls(prev => ({ ...prev, [key]: d.url })) })
            .catch(() => { /* leave placeholder */ })
        }
      } catch (err: any) {
        if (cancelled) return
        setLoadError(err?.errors?.[0]?.message || err?.message || 'Could not load the ticket.')
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [checking, ticketId])

  async function saveAdmin() {
    if (!ticket || savingAdmin) return
    setSavingAdmin(true)
    setActionError('')
    setAdminSaved(false)
    try {
      const becomingResolved = statusDraft === 'resolved' && ticket.status !== 'resolved'
      const input: Record<string, unknown> = {
        id: ticket.id,
        status: statusDraft,
        resolutionSummary: summaryDraft.trim() || null,
        ...(becomingResolved ? { resolvedAt: new Date().toISOString() } : {}),
      }
      const res = await (client.graphql({ query: UPDATE_SUPPORT_TICKET, variables: { input } }) as any)
      const updated = res?.data?.updateSupportTicket
      setTicket(prev => prev ? { ...prev, status: updated.status, resolutionSummary: updated.resolutionSummary, resolvedAt: updated.resolvedAt } : prev)
      setAdminSaved(true)
      setTimeout(() => setAdminSaved(false), 2500)
    } catch (err: any) {
      setActionError(err?.errors?.[0]?.message || err?.message || 'Save failed — try again.')
    } finally {
      setSavingAdmin(false)
    }
  }

  async function addNote() {
    if (!ticket || !noteDraft.trim() || savingNote) return
    setSavingNote(true)
    setActionError('')
    try {
      const input = {
        ticketId: ticket.id,
        authorId: userId,
        authorName: loginId || null,
        body: noteDraft.trim(),
        createdAtIso: new Date().toISOString(),
      }
      const res = await (client.graphql({ query: CREATE_TICKET_NOTE, variables: { input } }) as any)
      const created = res?.data?.createSupportTicketNote
      if (created) setNotes(prev => [...prev, created])
      setNoteDraft('')
    } catch (err: any) {
      setActionError(err?.errors?.[0]?.message || err?.message || 'Could not add the note.')
    } finally {
      setSavingNote(false)
    }
  }

  if (checking) return null

  const shotKeys = ticket ? parseScreenshotKeys(ticket.screenshotKeys) : []
  const pageLabel = ticket?.pageUrl
    ? (KNOWN_PAGES.find(p => p.value === ticket.pageUrl)?.label || ticket.pageUrl)
    : null

  const detailRows: [string, string][] = ticket ? [
    ...(pageLabel ? [['Page', pageLabel] as [string, string]] : []),
    ...(ticket.stepsTaken ? [['What I was doing', ticket.stepsTaken] as [string, string]] : []),
    ...(ticket.actualBehavior ? [['What happened', ticket.actualBehavior] as [string, string]] : []),
    ...(ticket.expectedBehavior ? [['What I expected', ticket.expectedBehavior] as [string, string]] : []),
  ] : []

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <button onClick={() => router.push('/teacher/support')}
          style={{ background: 'transparent', border: 'none', color: 'var(--plum)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '18px' }}>
          ← All tickets
        </button>

        {loading && <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Loading…</p>}
        {loadError && <p style={{ color: '#ef4444', fontSize: '14px' }}>{loadError}</p>}

        {ticket && (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--foreground)', margin: '0 0 8px' }}>
              {ticket.title}
            </h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 24px' }}>
              {CATEGORY_LABELS[ticket.category as TicketCategory] || ticket.category}
              {' · '}{SEVERITY_LABELS[ticket.severity as TicketSeverity] || ticket.severity}
              {' · '}filed by {ticket.requesterName || ticket.requesterEmail || 'staff'} on {fmtDateTime(ticket.submittedAt)}
              {' · '}<strong style={{ color: 'var(--foreground)' }}>{statusLabel(ticket.status)}</strong>
            </p>

            {/* Resolution summary — the thing Melinda checks back for */}
            {ticket.resolutionSummary && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={fieldLabel}>What was done</div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{ticket.resolutionSummary}</div>
                {ticket.resolvedAt && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '6px' }}>Resolved {fmtDateTime(ticket.resolvedAt)}</div>
                )}
              </div>
            )}

            {/* Ticket body */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              {detailRows.map(([k, v]) => (
                <div key={k} style={{ marginBottom: '14px' }}>
                  <div style={fieldLabel}>{k}</div>
                  <div style={{ fontSize: '14px', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{v}</div>
                </div>
              ))}
              <div>
                <div style={fieldLabel}>Description</div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
              </div>

              {shotKeys.length > 0 && (
                <div style={{ marginTop: '18px' }}>
                  <div style={fieldLabel}>Screenshots</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {shotKeys.map(key => shotUrls[key] ? (
                      <a key={key} href={shotUrls[key]} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shotUrls[key]} alt="Ticket screenshot" style={{ width: '160px', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-light)' }} />
                      </a>
                    ) : (
                      <div key={key} style={{ width: '160px', height: '110px', borderRadius: '8px', border: '1px solid var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--gray-mid)' }}>
                        Loading…
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin controls — IT only */}
            {isAdmin && (
              <div style={{ background: 'var(--background)', border: '1px solid var(--plum)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ ...fieldLabel, color: 'var(--plum)' }}>IT controls</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '10px' }}>
                  <select value={statusDraft} onChange={e => setStatusDraft(e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                    {!STATUS_LABELS[statusDraft] && <option value={statusDraft}>{statusDraft}</option>}
                  </select>
                  <button onClick={saveAdmin} disabled={savingAdmin}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    {savingAdmin ? 'Saving…' : adminSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
                <textarea value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} rows={3}
                  placeholder="Resolution summary — what was done, in words Melinda will read"
                  style={{ width: '100%', marginTop: '12px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            )}

            {/* Notes thread */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '20px' }}>
              <div style={fieldLabel}>Updates</div>
              {notes.length === 0 && (
                <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '8px 0 0' }}>No updates yet.</p>
              )}
              {notes.map(n => (
                <div key={n.id} style={{ borderTop: '1px solid var(--gray-light)', padding: '12px 0', marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--foreground)' }}>{n.authorName || 'staff'}</strong> · {fmtDateTime(n.createdAtIso)}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{n.body}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <input type="text" value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addNote() }}
                  placeholder="Add an update…"
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }} />
                <button onClick={addNote} disabled={savingNote || !noteDraft.trim()}
                  style={{ background: noteDraft.trim() ? 'var(--plum)' : 'var(--gray-light)', color: noteDraft.trim() ? 'white' : 'var(--gray-mid)', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {savingNote ? '…' : 'Post'}
                </button>
              </div>
            </div>

            {actionError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px' }}>{actionError}</p>}
          </>
        )}
      </main>
    </div>
  )
}
