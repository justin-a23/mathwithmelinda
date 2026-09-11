'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../../components/TeacherNav'
import { useRoleGuard } from '../../../hooks/useRoleGuard'
import { useResolvedUser } from '../../../hooks/useResolvedUser'
import { useQrUploadToken } from '../../../hooks/useQrUploadToken'
import { apiFetch } from '@/app/lib/apiFetch'
import {
  SUPPORT_INBOX, CATEGORY_LABELS, SEVERITY_LABELS, KNOWN_PAGES,
  type TicketCategory, type TicketSeverity,
} from '@/app/lib/support'

const client = generateClient()

const CREATE_SUPPORT_TICKET = /* GraphQL */ `
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) { id title category severity status submittedAt }
  }
`

const LIST_MY_TEACHER_PROFILE = /* GraphQL */ `
  query ListMyTeacherProfile($userId: String!) {
    listTeacherProfiles(limit: 10, filter: { userId: { eq: $userId } }) {
      items { id displayName }
    }
  }
`

type Shot = { key: string; url: string | null; name: string }

const CATEGORY_ORDER: TicketCategory[] = ['broken', 'improvement', 'question', 'other']
const CATEGORY_ICONS: Record<TicketCategory, string> = {
  broken: '🔧', improvement: '💡', question: '❓', other: '💬',
}
const SEVERITY_ORDER: TicketSeverity[] = ['critical', 'important', 'nice-to-have']

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--foreground)', marginBottom: '6px',
} as const

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)',
  borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)',
  background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box',
} as const

export default function NewSupportTicketPage() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const { userId, loginId } = useResolvedUser()

  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [severity, setSeverity] = useState<TicketSeverity>('important')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pageChoice, setPageChoice] = useState('')
  const [pageOther, setPageOther] = useState('')
  const [stepsTaken, setStepsTaken] = useState('')
  const [actualBehavior, setActualBehavior] = useState('')
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [shots, setShots] = useState<Shot[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [shotTab, setShotTab] = useState<'upload' | 'phone'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Phone-QR path: keys arrive from the poll as the phone uploads them.
  const qr = useQrUploadToken({
    body: { purpose: 'ticket' },
    onNewKeys: keys => keys.forEach(key => addShotFromKey(key)),
  })

  function addShotFromKey(key: string) {
    const name = key.split('/').pop() || 'photo'
    setShots(prev => prev.some(s => s.key === key) ? prev : [...prev, { key, url: null, name }])
    apiFetch('/api/view-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
      .then(r => r.json())
      .then(d => { if (d.url) setShots(prev => prev.map(s => s.key === key ? { ...s, url: d.url } : s)) })
      .catch(() => { /* thumbnail is optional */ })
  }

  const isBroken = category === 'broken'
  const isImprovement = category === 'improvement'
  const asksPage = isBroken || isImprovement
  const pageUrl = pageChoice === 'other' ? pageOther.trim() : pageChoice
  const canSubmit = !!category && title.trim().length > 0 && description.trim().length > 0 && !submitting && !uploading

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await apiFetch('/api/ticket-upload', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        // Presign a thumbnail; the key is what gets saved on the ticket.
        let url: string | null = null
        try {
          const viewRes = await apiFetch('/api/view-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: data.key }),
          })
          const viewData = await viewRes.json()
          url = viewData.url || null
        } catch { /* thumbnail is optional */ }
        setShots(prev => [...prev, { key: data.key, url, name: file.name }])
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed — try again or skip the screenshot.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function submit() {
    if (!canSubmit || !category) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // Display name for the email + ticket rows; login email as fallback.
      let requesterName = loginId
      try {
        const profRes = await (client.graphql({
          query: LIST_MY_TEACHER_PROFILE, variables: { userId },
        }) as any)
        requesterName = profRes?.data?.listTeacherProfiles?.items?.[0]?.displayName || loginId
      } catch { /* name is cosmetic */ }

      const input = {
        requesterId: userId,
        requesterName,
        requesterEmail: loginId || null,
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
        pageUrl: asksPage && pageUrl ? pageUrl : null,
        stepsTaken: isBroken && stepsTaken.trim() ? stepsTaken.trim() : null,
        actualBehavior: isBroken && actualBehavior.trim() ? actualBehavior.trim() : null,
        expectedBehavior: isBroken && expectedBehavior.trim() ? expectedBehavior.trim() : null,
        screenshotKeys: shots.length ? JSON.stringify(shots.map(s => s.key)) : null,
        status: 'new',
        submittedAt: new Date().toISOString(),
      }

      const res = await (client.graphql({ query: CREATE_SUPPORT_TICKET, variables: { input } }) as any)
      const ticket = res?.data?.createSupportTicket
      if (!ticket?.id) throw new Error('Ticket was not saved — please try again.')

      // Email is a convenience; the ticket row is the durable record. Never
      // block or fail the submission on it.
      const pageLabel = KNOWN_PAGES.find(p => p.value === pageUrl)?.label || pageUrl
      const rows: [string, string][] = [
        ['From', `${requesterName} (${loginId})`],
        ['Category', CATEGORY_LABELS[category]],
        ['Severity', SEVERITY_LABELS[severity]],
        ...(input.pageUrl ? [['Page', pageLabel] as [string, string]] : []),
        ...(input.stepsTaken ? [['What she was doing', input.stepsTaken] as [string, string]] : []),
        ...(input.actualBehavior ? [['What happened', input.actualBehavior] as [string, string]] : []),
        ...(input.expectedBehavior ? [['What she expected', input.expectedBehavior] as [string, string]] : []),
        ['Description', input.description],
        ['Screenshots', shots.length ? `${shots.length} attached — view in the ticket` : 'none'],
        ['Submitted', new Date().toLocaleString()],
      ]
      const ticketUrl = `${window.location.origin}/teacher/support/${ticket.id}`
      const html = `
        <h2 style="font-family:Georgia,serif;color:#7B4FA6;">New IT ticket: ${esc(input.title)}</h2>
        <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          ${rows.map(([k, v]) => `<tr><td style="font-weight:bold;vertical-align:top;border:1px solid #ddd;">${esc(k)}</td><td style="border:1px solid #ddd;white-space:pre-wrap;">${esc(v)}</td></tr>`).join('')}
        </table>
        <p style="font-family:sans-serif;font-size:14px;"><a href="${ticketUrl}">Open the ticket</a></p>
      `
      apiFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: SUPPORT_INBOX,
          subject: `[MwM IT] ${SEVERITY_LABELS[severity]}: ${input.title}`,
          html,
          text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${ticketUrl}`,
        }),
      }).catch(() => { /* fire-and-forget */ })

      router.push('/teacher/support?submitted=1')
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'Something went wrong — please try again.'
      setSubmitError(msg)
      setSubmitting(false)
    }
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '4px' }}>
          IT Help
        </h1>
        <p style={{ color: 'var(--gray-mid)', margin: '0 0 28px', fontSize: '14px' }}>
          Tell Justin what's going on. He gets an email right away, and you can follow the fix on the tickets page.
        </p>

        {/* Step 1 — category */}
        <label style={{ ...labelStyle, marginBottom: '10px' }}>What kind of request is this?</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '28px' }}>
          {CATEGORY_ORDER.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '16px 12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                border: category === c ? '2px solid var(--plum)' : '1px solid var(--gray-light)',
                background: category === c ? 'var(--plum-light, rgba(123,79,166,0.08))' : 'var(--background)',
                color: 'var(--foreground)', fontSize: '14px', fontWeight: category === c ? 700 : 500,
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{CATEGORY_ICONS[c]}</div>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Step 2 — everything else, revealed once a category is picked */}
        {category && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '24px' }}>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>How urgent is it?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SEVERITY_ORDER.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: 600, fontFamily: 'var(--font-body)',
                      border: severity === s ? '2px solid var(--plum)' : '1px solid var(--gray-light)',
                      background: severity === s ? 'var(--plum)' : 'var(--background)',
                      color: severity === s ? 'white' : 'var(--foreground)',
                    }}
                  >
                    {SEVERITY_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {asksPage && (
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>{isBroken ? 'Which page were you on?' : 'Which page or area?'}</label>
                <select value={pageChoice} onChange={e => setPageChoice(e.target.value)}
                  style={{ ...inputStyle, maxWidth: '320px', color: pageChoice ? 'var(--foreground)' : 'var(--gray-mid)' }}>
                  <option value="">Select a page…</option>
                  {KNOWN_PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  <option value="other">Other / not sure</option>
                </select>
                {pageChoice === 'other' && (
                  <input type="text" value={pageOther} onChange={e => setPageOther(e.target.value)}
                    placeholder="Describe where you were…" style={{ ...inputStyle, maxWidth: '320px', marginTop: '8px' }} />
                )}
              </div>
            )}

            {isBroken && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>What were you doing?</label>
                  <input type="text" value={stepsTaken} onChange={e => setStepsTaken(e.target.value)}
                    placeholder="e.g. grading Brayden's Tuesday work and clicked Return" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>What happened?</label>
                  <input type="text" value={actualBehavior} onChange={e => setActualBehavior(e.target.value)}
                    placeholder="e.g. a red error popped up and the grade didn't save" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>What did you expect to happen?</label>
                  <input type="text" value={expectedBehavior} onChange={e => setExpectedBehavior(e.target.value)}
                    placeholder="e.g. the grade saves and the row turns green" style={inputStyle} />
                </div>
              </>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>One-line summary</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={isBroken ? "e.g. Can't return graded work" : 'A short title for this request'}
                style={inputStyle} maxLength={120} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>{isBroken ? 'Anything else — in your own words' : 'Tell me about it — in your own words'}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                placeholder="Write as much or as little as you like — anything helps."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Screenshots */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Screenshots (optional)</label>
              <div style={{ display: 'flex', gap: '6px', margin: '8px 0 12px' }}>
                {([['upload', '📁 Upload files'], ['phone', '📱 Phone camera']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setShotTab(key)}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      border: shotTab === key ? '1px solid var(--plum)' : '1px solid var(--gray-light)',
                      background: shotTab === key ? 'var(--plum)' : 'transparent',
                      color: shotTab === key ? 'white' : 'var(--gray-mid)', fontFamily: 'var(--font-body)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {shotTab === 'upload' && (
                <>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 10px' }}>
                    On a Mac, press <strong>Shift + Command + 4</strong> and drag over the problem, then upload the
                    picture it saves to your Desktop.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif,.pdf,application/pdf"
                    multiple
                    onChange={e => handleFiles(e.target.files)}
                    style={{ fontSize: '13px', color: 'var(--foreground)' }}
                  />
                </>
              )}

              {shotTab === 'phone' && (
                <div>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 10px' }}>
                    Scan the code with your phone, then snap a photo of the problem screen — it lands here automatically.
                  </p>
                  {!qr.tokenState && (
                    <button onClick={qr.generate} disabled={qr.loading}
                      style={{ background: 'transparent', color: 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      {qr.loading ? 'Creating link…' : '📱 Show QR code'}
                    </button>
                  )}
                  {qr.error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0' }}>{qr.error}</p>}
                  {qr.tokenState && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr.tokenState.qrDataUrl} alt="Scan to upload from your phone"
                        style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'white' }} />
                      <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                        <div>Code expires in <strong style={{ color: 'var(--foreground)' }}>{Math.floor(qr.timeLeft / 60)}:{(qr.timeLeft % 60).toString().padStart(2, '0')}</strong></div>
                        <div style={{ marginTop: '6px' }}>Photos appear below as you take them.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploading && <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '8px 0 0' }}>Uploading…</p>}
              {uploadError && <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0' }}>{uploadError}</p>}
              {shots.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {shots.map(s => (
                    <div key={s.key} style={{ position: 'relative', width: '110px' }}>
                      {s.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.url} alt={s.name} style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-light)' }} />
                      ) : (
                        <div style={{ width: '110px', height: '80px', borderRadius: '8px', border: '1px solid var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--gray-mid)' }}>
                          {s.name.slice(0, 14)}
                        </div>
                      )}
                      <button
                        onClick={() => setShots(prev => prev.filter(p => p.key !== s.key))}
                        aria-label={`Remove ${s.name}`}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '12px', lineHeight: '22px', padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {submitError && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}>{submitError}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  background: canSubmit ? 'var(--plum)' : 'var(--gray-light)',
                  color: canSubmit ? 'white' : 'var(--gray-mid)',
                  border: 'none', borderRadius: '8px', padding: '12px 28px',
                  fontSize: '14px', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'default',
                }}
              >
                {submitting ? 'Sending…' : 'Send to Justin'}
              </button>
              <button
                onClick={() => router.push('/teacher/support')}
                style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
