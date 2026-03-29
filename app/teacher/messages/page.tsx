'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../../components/ThemeToggle'

const client = generateClient()

const LIST_MESSAGES = /* GraphQL */ `
  query ListMessages($filter: ModelMessageFilterInput) {
    listMessages(filter: $filter, limit: 200) {
      items { id studentId studentName content sentAt isRead teacherReply repliedAt }
    }
  }
`

const UPDATE_MESSAGE = /* GraphQL */ `
  mutation UpdateMessage($input: UpdateMessageInput!) {
    updateMessage(input: $input) { id }
  }
`

type Message = {
  id: string
  studentId: string
  studentName: string | null
  content: string
  sentAt: string
  isRead: boolean | null
  teacherReply: string | null
  repliedAt: string | null
}

type StudentGroup = {
  studentId: string
  studentName: string
  messages: Message[]
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function TeacherMessagesPage() {
  const { user } = useAuthenticator()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    setLoading(true)
    try {
      const res = await (client.graphql({ query: LIST_MESSAGES, variables: {} }) as any)
      const items: Message[] = res.data.listMessages.items
      items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      setMessages(items)
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(msgId: string) {
    try {
      await (client.graphql({
        query: UPDATE_MESSAGE,
        variables: { input: { id: msgId, isRead: true } },
      }) as any)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m))
    } catch (err) {
      console.error('Error marking message read:', err)
    }
  }

  async function sendReply(msgId: string) {
    const reply = (replyText[msgId] || '').trim()
    if (!reply) return
    setSending(prev => ({ ...prev, [msgId]: true }))
    try {
      const repliedAt = new Date().toISOString()
      await (client.graphql({
        query: UPDATE_MESSAGE,
        variables: { input: { id: msgId, teacherReply: reply, repliedAt, isRead: true } },
      }) as any)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, teacherReply: reply, repliedAt, isRead: true } : m))
      setReplyText(prev => ({ ...prev, [msgId]: '' }))
      setExpandedMessageId(null)
    } catch (err) {
      console.error('Error sending reply:', err)
    } finally {
      setSending(prev => ({ ...prev, [msgId]: false }))
    }
  }

  function handleExpand(msg: Message) {
    const newId = expandedMessageId === msg.id ? null : msg.id
    setExpandedMessageId(newId)
    if (newId && !msg.isRead) markRead(msg.id)
  }

  // Group by student
  const groups: StudentGroup[] = []
  const seen = new Map<string, StudentGroup>()
  for (const msg of messages) {
    const name = msg.studentName || msg.studentId
    if (!seen.has(msg.studentId)) {
      const group: StudentGroup = { studentId: msg.studentId, studentName: name, messages: [] }
      seen.set(msg.studentId, group)
      groups.push(group)
    }
    seen.get(msg.studentId)!.messages.push(msg)
  }

  const totalUnread = messages.filter(m => !m.isRead).length

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .msg-card { transition: box-shadow 0.15s; }
        .msg-card:hover { box-shadow: 0 4px 16px rgba(123,79,166,0.12) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/teacher')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '18px' }}>Messages</span>
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>Teacher</span>
          {totalUnread > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
              {totalUnread} unread
            </span>
          )}
        </div>
        <ThemeToggle />
      </nav>

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '4px' }}>Student Messages</h1>
          <p style={{ color: 'var(--gray-mid)', margin: 0, fontSize: '14px' }}>Questions from students — reply inline to send a response.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '48px 0', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading messages…
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3, display: 'block', margin: '0 auto 16px' }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p style={{ fontSize: '16px', margin: 0 }}>No messages yet</p>
            <p style={{ fontSize: '13px', margin: '8px 0 0', opacity: 0.6 }}>Student questions will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {groups.map(group => {
              const unreadCount = group.messages.filter(m => !m.isRead).length
              return (
                <div key={group.studentId}>
                  {/* Student group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--plum)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                      {group.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{group.studentName}</span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                        {unreadCount} new
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', marginLeft: 'auto' }}>
                      {group.messages.length} message{group.messages.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Messages */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.messages.map(msg => {
                      const isExpanded = expandedMessageId === msg.id
                      const isUnread = !msg.isRead

                      return (
                        <div key={msg.id} className="msg-card"
                          style={{
                            background: 'var(--background)',
                            border: '1px solid var(--gray-light)',
                            borderLeft: isUnread ? '4px solid var(--plum)' : '4px solid transparent',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            boxShadow: isExpanded ? '0 4px 16px rgba(123,79,166,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}>

                          {/* Message row */}
                          <div
                            onClick={() => handleExpand(msg)}
                            style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                {isUnread && (
                                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--plum)', flexShrink: 0, display: 'inline-block' }} />
                                )}
                                <span style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: isUnread ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                                  {msg.content}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginLeft: isUnread ? '15px' : '0' }}>
                                {fmtDate(msg.sentAt)}
                                {msg.teacherReply && (
                                  <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: 500 }}>• Replied</span>
                                )}
                              </div>
                            </div>

                            {/* Chevron */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, marginTop: '2px' }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>

                          {/* Expanded: full content + reply */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--gray-light)', padding: '16px 18px' }}>
                              {/* Full message */}
                              <div style={{ background: 'rgba(123,79,166,0.04)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--plum)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Question</div>
                                <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6' }}>{msg.content}</div>
                              </div>

                              {/* Existing reply */}
                              {msg.teacherReply && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Reply</div>
                                  <div style={{ fontSize: '14px', color: '#15803d', lineHeight: '1.6' }}>{msg.teacherReply}</div>
                                  {msg.repliedAt && (
                                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', opacity: 0.7 }}>Sent {fmtDate(msg.repliedAt)}</div>
                                  )}
                                </div>
                              )}

                              {/* Reply box */}
                              <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                  {msg.teacherReply ? 'Update Reply' : 'Reply'}
                                </label>
                                <textarea
                                  value={replyText[msg.id] || ''}
                                  onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  placeholder="Type your reply…"
                                  rows={3}
                                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                  <button
                                    onClick={() => sendReply(msg.id)}
                                    disabled={sending[msg.id] || !(replyText[msg.id] || '').trim()}
                                    style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: (sending[msg.id] || !(replyText[msg.id] || '').trim()) ? 0.6 : 1 }}>
                                    {sending[msg.id] ? 'Sending…' : 'Send Reply'}
                                  </button>
                                  <button
                                    onClick={() => { setExpandedMessageId(null); setReplyText(prev => ({ ...prev, [msg.id]: '' })) }}
                                    style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
