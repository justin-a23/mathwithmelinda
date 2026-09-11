'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { fetchAllPages } from '@/app/lib/fetchAllPages'
import {
  CATEGORY_LABELS, SEVERITY_LABELS, OPEN_STATUSES, statusLabel,
  parseScreenshotKeys, type SupportTicket, type TicketCategory, type TicketSeverity,
} from '@/app/lib/support'

const client = generateClient()

const LIST_SUPPORT_TICKETS = /* GraphQL */ `
  query ListSupportTickets($nextToken: String) {
    listSupportTickets(limit: 200, nextToken: $nextToken) {
      items {
        id requesterId requesterName requesterEmail category severity title description
        pageUrl stepsTaken actualBehavior expectedBehavior screenshotKeys
        status resolutionSummary resolvedAt submittedAt
      }
      nextToken
    }
  }
`

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  important: 'var(--accent, #F2C94C)',
  'nice-to-have': '#9CA3AF',
}

function statusChipColors(status: string): { bg: string; fg: string } {
  switch (status) {
    case 'new': return { bg: 'rgba(123,79,166,0.12)', fg: 'var(--plum)' }
    case 'in_progress': return { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' }
    case 'waiting_on_reporter': return { bg: 'rgba(217,119,6,0.14)', fg: '#D97706' }
    case 'resolved': return { bg: 'rgba(16,185,129,0.14)', fg: '#10B981' }
    case 'closed': return { bg: 'rgba(156,163,175,0.18)', fg: '#6B7280' }
    default: return { bg: 'rgba(156,163,175,0.18)', fg: '#6B7280' }
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Tab = 'open' | 'resolved' | 'all'

function SupportListInner() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const searchParams = useSearchParams()
  const justSubmitted = searchParams.get('submitted') === '1'

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<Tab>('open')

  useEffect(() => {
    if (checking) return
    let cancelled = false
    fetchAllPages<SupportTicket>(client, LIST_SUPPORT_TICKETS, 'listSupportTickets')
      .then(items => { if (!cancelled) { setTickets(items); setLoading(false) } })
      .catch(err => {
        if (cancelled) return
        setLoadError(err?.errors?.[0]?.message || err?.message || 'Could not load tickets.')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [checking])

  const visible = tickets
    .filter(t => {
      if (tab === 'open') return OPEN_STATUSES.includes(t.status)
      if (tab === 'resolved') return !OPEN_STATUSES.includes(t.status)
      return true
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const openCount = tickets.filter(t => OPEN_STATUSES.includes(t.status)).length

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '4px' }}>IT Help</h1>
            <p style={{ color: 'var(--gray-mid)', margin: 0, fontSize: '14px' }}>
              {openCount === 0 ? 'No open tickets.' : `${openCount} open ticket${openCount === 1 ? '' : 's'}.`}
            </p>
          </div>
          <button
            onClick={() => router.push('/teacher/support/new')}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            + New Ticket
          </button>
        </div>

        {justSubmitted && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: 'var(--foreground)' }}>
            ✅ Your ticket is in — Justin has been emailed. You can watch its status here.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
          {(['open', 'resolved', 'all'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                border: tab === t ? '1px solid var(--plum)' : '1px solid var(--gray-light)',
                background: tab === t ? 'var(--plum)' : 'transparent',
                color: tab === t ? 'white' : 'var(--gray-mid)', fontFamily: 'var(--font-body)',
              }}>
              {t === 'open' ? 'Open' : t === 'resolved' ? 'Resolved' : 'All'}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Loading tickets…</p>}
        {loadError && <p style={{ color: '#ef4444', fontSize: '14px' }}>{loadError}</p>}

        {!loading && !loadError && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray-mid)', fontSize: '14px' }}>
            {tab === 'open' ? 'Nothing open — all clear! 🎉' : 'No tickets here yet.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(t => {
            const chip = statusChipColors(t.status)
            const shotCount = parseScreenshotKeys(t.screenshotKeys).length
            return (
              <div
                key={t.id}
                onClick={() => router.push(`/teacher/support/${t.id}`)}
                style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <span title={SEVERITY_LABELS[t.severity as TicketSeverity] || t.severity}
                  style={{ width: '10px', height: '10px', borderRadius: '50%', background: SEVERITY_COLORS[t.severity] || '#9CA3AF', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '3px' }}>
                    {CATEGORY_LABELS[t.category as TicketCategory] || t.category} · {fmtDate(t.submittedAt)}
                    {shotCount > 0 && <> · 📎 {shotCount}</>}
                    {t.status === 'resolved' && t.resolutionSummary && (
                      <> · {t.resolutionSummary.slice(0, 60)}{t.resolutionSummary.length > 60 ? '…' : ''}</>
                    )}
                  </div>
                </div>
                <span style={{ background: chip.bg, color: chip.fg, fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', flexShrink: 0 }}>
                  {statusLabel(t.status)}
                </span>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default function SupportListPage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <SupportListInner />
    </Suspense>
  )
}
