'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import StudentNav from '../../components/StudentNav'

const client = generateClient()

const LIST_MESSAGES = /* GraphQL */ `
  query ListMessages($filter: ModelMessageFilterInput) {
    listMessages(filter: $filter, limit: 500) {
      items {
        id studentId studentName content sentAt isRead teacherReply repliedAt
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

const DELETE_MESSAGE = /* GraphQL */ `
  mutation DeleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input) { id }
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

function fmtDate(s: string): string {
  const d = new Date(s)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function StudentMessagesPage() {
  const { user, signOut, authStatus } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Grade question context from URL params
  const isGradeQuestion = searchParams.get('gradeQuestion') === '1'
  const gradeQuestionSubmissionId = searchParams.get('submissionId') || ''
  const gradeQuestionLesson = searchParams.get('lessonTitle') || ''

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [compose, setCompose] = useState('')
  const [sending, setSending] = useState(false)
  const [profileName, setProfileName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const studentId = user?.signInDetails?.loginId || user?.userId || ''

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (!studentId) return
    fetchMessages()
    // Mark this visit so dashboard badge resets
    localStorage.setItem('mwm:messagesLastVisited', Date.now().toString())
  }, [studentId])

  // Pre-fill compose when arriving from a grade question link
  useEffect(() => {
    if (isGradeQuestion && gradeQuestionSubmissionId) {
      setCompose(`[ref:sub=${gradeQuestionSubmissionId}]\nQuestion about my grade on: ${gradeQuestionLesson}\n\n`)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isGradeQuestion, gradeQuestionSubmissionId])

  // Scroll to bottom when messages load/change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    setLoading(true)
    try {
      const result: any = await client.graphql({
        query: LIST_MESSAGES,
        variables: { filter: { studentId: { eq: studentId } } }
      })
      const items: Message[] = result.data.listMessages.items
      items.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      setMessages(items)
      // Also pull name from profile if available
      const name = items.find(m => m.studentName)?.studentName || ''
      if (name) setProfileName(name)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    const content = compose.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const result: any = await client.graphql({
        query: CREATE_MESSAGE,
        variables: {
          input: {
            studentId,
            studentName: profileName || null,
            content,
            sentAt: new Date().toISOString(),
            isRead: false,
          }
        }
      })
      const newMsg: Message = result.data.createMessage
      setMessages(prev => [...prev, newMsg])
      setCompose('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(id: string) {
    const msg = messages.find(m => m.id === id)
    const hasReply = !!msg?.teacherReply
    const prompt = hasReply
      ? 'Delete this message and Melinda\'s reply? This cannot be undone.'
      : 'Delete this message? This cannot be undone.'
    if (!window.confirm(prompt)) return
    try {
      await client.graphql({ query: DELETE_MESSAGE, variables: { input: { id } } })
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }

  async function clearAllMessages() {
    if (!window.confirm(`Delete all ${messages.length} message${messages.length !== 1 ? 's' : ''} and any replies? This cannot be undone.`)) return
    try {
      await Promise.all(messages.map(m =>
        client.graphql({ query: DELETE_MESSAGE, variables: { input: { id: m.id } } })
      ))
      setMessages([])
    } catch (err) {
      console.error('Error clearing messages:', err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <StudentNav />

      {/* Page body */}
      <main style={{ flex: 1, maxWidth: '680px', width: '100%', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: 0 }}>
            Messages with Melinda
          </h1>
          {messages.length > 0 && (
            <button
              onClick={clearAllMessages}
              style={{ background: 'none', border: '1px solid var(--gray-light)', borderRadius: '6px', color: 'var(--gray-mid)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0, marginTop: '4px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e05252'; (e.currentTarget as HTMLButtonElement).style.color = '#e05252' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-light)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-mid)' }}
            >
              Clear all
            </button>
          )}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: isGradeQuestion ? '12px' : '28px' }}>
          Ask questions about your lessons. Melinda will reply here.
        </p>

        {isGradeQuestion && gradeQuestionLesson && (
          <div style={{ background: 'rgba(123,79,166,0.07)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span style={{ fontSize: '13px', color: 'var(--plum)', fontWeight: 600 }}>
              Asking about: <span style={{ fontWeight: 700 }}>{gradeQuestionLesson}</span>
            </span>
            <button onClick={() => router.replace('/student/messages')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--gray-mid)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}>✕</button>
          </div>
        )}

        {/* Conversation thread */}
        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--gray-mid)' }}>
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--gray-mid)', gap: '12px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <div style={{ fontSize: '14px' }}>No messages yet — send your first one below!</div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '500px' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                  {/* Student's message — right side */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      {/* Strip hidden [ref:sub=...] metadata line before displaying */}
                      {/^\[ref:sub=[^\]]+\]\n/.test(msg.content) && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', paddingRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          Grade question
                        </div>
                      )}
                      <div style={{
                        background: 'var(--plum)', color: 'white',
                        borderRadius: '18px 18px 4px 18px',
                        padding: '10px 14px', fontSize: '14px', lineHeight: '1.55',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content.replace(/^\[ref:sub=[^\]]+\]\n/, '')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>{fmtDate(msg.sentAt)}</span>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          title="Delete this message and any reply"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--gray-mid)', fontSize: '11px', lineHeight: 1, borderRadius: '3px' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#e05252')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-mid)')}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Teacher reply — left side */}
                  {msg.teacherReply && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
                      {/* Melinda avatar */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>M</span>
                      </div>
                      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', paddingLeft: '4px' }}>Melinda</div>
                        <div style={{
                          background: 'var(--page-bg)', border: '1px solid var(--gray-light)',
                          color: 'var(--foreground)',
                          borderRadius: '4px 18px 18px 18px',
                          padding: '10px 14px', fontSize: '14px', lineHeight: '1.55'
                        }}>
                          {msg.teacherReply}
                        </div>
                        {msg.repliedAt && (
                          <span style={{ fontSize: '11px', color: 'var(--gray-mid)', paddingLeft: '4px' }}>{fmtDate(msg.repliedAt)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* "Waiting for reply" indicator */}
                  {!msg.teacherReply && (
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--gray-mid)', fontStyle: 'italic', paddingRight: '4px' }}>
                      Waiting for reply…
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Compose area */}
          <div style={{ borderTop: '1px solid var(--gray-light)', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={compose}
              onChange={e => setCompose(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Ctrl+Enter to send)"
              rows={3}
              style={{
                flex: 1, padding: '10px 12px', border: '1px solid var(--gray-light)',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-body)',
                background: 'var(--background)', color: 'var(--foreground)',
                resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !compose.trim()}
              style={{
                background: compose.trim() ? 'var(--plum)' : 'var(--gray-light)',
                color: compose.trim() ? 'white' : 'var(--gray-mid)',
                border: 'none', borderRadius: '10px', padding: '10px 20px',
                cursor: compose.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
                flexShrink: 0, alignSelf: 'flex-end', height: '44px'
              }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>

        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--gray-mid)', textAlign: 'center' }}>
          Melinda typically replies within one business day.
        </p>
      </main>
    </div>
  )
}
