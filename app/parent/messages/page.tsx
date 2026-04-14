'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import MwmLogo from '../../components/MwmLogo'
import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../../ThemeProvider'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

const LIST_MESSAGES = /* GraphQL */ `
  query ListMessages($filter: ModelMessageFilterInput) {
    listMessages(filter: $filter, limit: 500) {
      items {
        id studentId studentName content sentAt isRead teacherReply repliedAt isTeacherInitiated
      }
    }
  }
`

const CREATE_MESSAGE = /* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      id studentId studentName content sentAt isRead teacherReply repliedAt
    }
  }
`

const LIST_PARENT_STUDENTS = /* GraphQL */ `
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 20) {
      items { id parentId studentEmail studentName }
    }
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
  isTeacherInitiated: boolean | null
}

function fmtDate(s: string): string {
  const d = new Date(s)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ParentMessagesPage() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [compose, setCompose] = useState('')
  const [sending, setSending] = useState(false)
  const [parentName, setParentName] = useState('')
  const [childNames, setChildNames] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parent's thread ID — prefixed so it's clearly distinct from student threads
  const parentThreadId = user?.userId ? `parent:${user.userId}` : ''

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!parentThreadId) return
    fetchMessages()
    fetchParentInfo()

    // Poll every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [parentThreadId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchParentInfo() {
    try {
      const result: any = await client.graphql({
        query: LIST_PARENT_STUDENTS,
        variables: { filter: { parentId: { eq: user?.userId } } },
      })
      const items = result.data.listParentStudents.items || []
      setChildNames(items.map((c: any) => c.studentName).filter(Boolean))
      // Use the parent's email login as display name until we have a profile name
      const login = user?.signInDetails?.loginId || ''
      setParentName(login.split('@')[0] || 'Parent')
    } catch {
      // non-critical
    }
  }

  async function fetchMessages() {
    try {
      const result: any = await client.graphql({
        query: LIST_MESSAGES,
        variables: { filter: { studentId: { eq: parentThreadId } } },
      })
      const items: Message[] = result.data.listMessages.items || []
      items.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      setMessages(items)
    } catch (err) {
      console.error('Error fetching parent messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!compose.trim() || sending) return
    setSending(true)
    try {
      const displayName = childNames.length > 0
        ? `${parentName} (Parent of ${childNames.join(', ')})`
        : `${parentName} (Parent)`

      const result: any = await client.graphql({
        query: CREATE_MESSAGE,
        variables: {
          input: {
            studentId: parentThreadId,
            studentName: displayName,
            content: compose.trim(),
            sentAt: new Date().toISOString(),
            isRead: false,
          },
        },
      })
      const newMsg: Message = result.data.createMessage
      setMessages(prev => [...prev, newMsg])
      setCompose('')

      // Notify teacher via email
      try {
        await apiFetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'melinda@mathwithmelinda.com',
            subject: `New message from parent: ${displayName}`,
            body: `${displayName} sent you a message:\n\n"${compose.trim()}"\n\nReply at: https://mathwithmelinda.com/teacher/messages`,
          }),
        })
      } catch { /* email notification is best-effort */ }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Nav */}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <MwmLogo size={36} showWordmark badge="Parent" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={() => router.push('/parent')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Dashboard
          </button>
          <button onClick={() => { signOut(); router.replace('/login') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: '700px', width: '100%', margin: '0 auto', padding: '32px 24px 120px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '4px' }}>
          Messages with Melinda
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '24px' }}>
          This is a private conversation between you and your child&apos;s teacher.
        </p>

        {/* Messages thread */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '40px 0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', lineHeight: '1.6' }}>
              No messages yet. Send Melinda a message below — she&apos;ll get an email notification.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                {/* Parent message (or teacher-initiated) */}
                {!msg.isTeacherInitiated && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: msg.teacherReply ? '8px' : '0' }}>
                    <div style={{ maxWidth: '80%', background: 'var(--plum)', color: 'white', borderRadius: '14px 14px 4px 14px', padding: '12px 16px' }}>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <p style={{ margin: '6px 0 0', fontSize: '11px', opacity: 0.7, textAlign: 'right' }}>{fmtDate(msg.sentAt)}</p>
                    </div>
                  </div>
                )}

                {/* Teacher-initiated message */}
                {msg.isTeacherInitiated && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '80%' }}>
                      <div style={{ width: '28px', height: '28px', background: 'var(--plum-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)' }}>M</span>
                      </div>
                      <div style={{ background: 'var(--gray-light)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--gray-mid)' }}>{fmtDate(msg.sentAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teacher reply to parent message */}
                {msg.teacherReply && !msg.isTeacherInitiated && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '80%' }}>
                      <div style={{ width: '28px', height: '28px', background: 'var(--plum-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)' }}>M</span>
                      </div>
                      <div style={{ background: 'var(--gray-light)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.teacherReply}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--gray-mid)' }}>{msg.repliedAt ? fmtDate(msg.repliedAt) : ''}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />

            {/* Waiting indicator */}
            {messages.length > 0 && !messages[messages.length - 1].teacherReply && !messages[messages.length - 1].isTeacherInitiated && (
              <div style={{ fontSize: '12px', color: 'var(--gray-mid)', textAlign: 'center', fontStyle: 'italic', padding: '4px 0' }}>
                Waiting for reply…
              </div>
            )}
          </div>
        )}
      </main>

      {/* Compose bar — fixed at bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--background)', borderTop: '1px solid var(--gray-light)', padding: '12px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={compose}
            onChange={e => setCompose(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Melinda…"
            rows={2}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--gray-light)',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              resize: 'none',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!compose.trim() || sending}
            style={{
              padding: '10px 20px',
              background: compose.trim() ? 'var(--plum)' : 'var(--gray-light)',
              color: compose.trim() ? 'white' : 'var(--gray-mid)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: compose.trim() ? 'pointer' : 'default',
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
        <div style={{ maxWidth: '700px', margin: '4px auto 0', fontSize: '11px', color: 'var(--gray-mid)', textAlign: 'right' }}>
          Ctrl+Enter to send
        </div>
      </div>
    </div>
  )
}
