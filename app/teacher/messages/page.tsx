'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

const LIST_MESSAGES = /* GraphQL */ `
  query ListMessages {
    listMessages(limit: 500) {
      items { id studentId studentName content sentAt isRead teacherReply repliedAt isArchivedByTeacher }
    }
  }
`

const LIST_STUDENTS = /* GraphQL */ `
  query ListStudents {
    listStudentProfiles(limit: 500, filter: { status: { eq: "active" } }) {
      items { id userId firstName lastName preferredName email }
    }
  }
`

const LIST_ENROLLMENTS = /* GraphQL */ `
  query ListEnrollments {
    listEnrollments(limit: 1000) {
      items { id studentId course { id title } }
    }
  }
`

const LIST_ANNOUNCEMENTS = /* GraphQL */ `
  query ListAnnouncements {
    listAnnouncements(limit: 200) {
      items { id subject message sentAt recipientCount courseTitle recipientIds }
    }
  }
`

const CREATE_ANNOUNCEMENT = /* GraphQL */ `
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) { id subject message sentAt recipientCount courseTitle recipientIds }
  }
`

const DELETE_ANNOUNCEMENT = /* GraphQL */ `
  mutation DeleteAnnouncement($input: DeleteAnnouncementInput!) {
    deleteAnnouncement(input: $input) { id }
  }
`

const CREATE_MESSAGE = /* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) { id studentId studentName content sentAt isRead isTeacherInitiated }
  }
`

const UPDATE_MESSAGE = /* GraphQL */ `
  mutation UpdateMessage($input: UpdateMessageInput!) {
    updateMessage(input: $input) { id }
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
  isArchivedByTeacher: boolean | null
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

function groupByStudent(messages: Message[]): StudentGroup[] {
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
  return groups
}

export default function TeacherMessagesPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'archived' | 'announcements'>('active')
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [archiving, setArchiving] = useState<Record<string, boolean>>({})

  // Compose new message state
  const [showCompose, setShowCompose] = useState(false)
  const [composeStudentId, setComposeStudentId] = useState('')
  const [composeText, setComposeText] = useState('')
  const [composing, setComposing] = useState(false)

  // Announcement state
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementSubject, setAnnouncementSubject] = useState('')
  const [announcementSending, setAnnouncementSending] = useState(false)
  const [announcementSent, setAnnouncementSent] = useState(false)
  const [students, setStudents] = useState<{ userId: string; name: string; email: string }[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [studentCourseMap, setStudentCourseMap] = useState<Record<string, string>>({}) // userId → courseId
  const [announcements, setAnnouncements] = useState<{ id: string; subject: string; message: string; sentAt: string; recipientCount: number | null; courseTitle: string | null; recipientIds: string }[]>([])

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadMessages()
    loadStudents()
    loadAnnouncements()
  }, [])

  async function loadStudents() {
    try {
      const [studentsRes, enrollmentsRes] = await Promise.all([
        client.graphql({ query: LIST_STUDENTS }) as any,
        client.graphql({ query: LIST_ENROLLMENTS }) as any,
      ])
      const items = studentsRes.data.listStudentProfiles.items
      const list = items
        .filter((s: any) => s.email)
        .map((s: any) => ({
          userId: s.userId,
          name: s.preferredName || `${s.firstName} ${s.lastName}`.trim(),
          email: s.email,
        }))
      setStudents(list)
      setSelectedStudentIds(new Set(list.map((s: any) => s.userId)))

      // Build studentId → courseId map from enrollments
      const enrollments: any[] = enrollmentsRes.data.listEnrollments.items
      const courseMap: Record<string, string> = {}
      const courseSet = new Map<string, string>() // courseId → title
      for (const e of enrollments) {
        if (e.studentId && e.course?.id) {
          courseMap[e.studentId] = e.course.id
          courseSet.set(e.course.id, e.course.title)
        }
      }
      setStudentCourseMap(courseMap)
      setCourses(Array.from(courseSet.entries()).map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title)))
    } catch (err) {
      console.error('Error loading students:', err)
    }
  }

  async function loadAnnouncements() {
    try {
      const res = await (client.graphql({ query: LIST_ANNOUNCEMENTS }) as any)
      const items = res.data.listAnnouncements.items
      items.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      setAnnouncements(items)
    } catch (err) {
      console.error('Error loading announcements:', err)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!window.confirm('Delete this announcement record?')) return
    try {
      await (client.graphql({ query: DELETE_ANNOUNCEMENT, variables: { input: { id } } }) as any)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting announcement:', err)
    }
  }

  async function sendAnnouncement() {
    if (!announcementText.trim() || !announcementSubject.trim() || selectedStudentIds.size === 0) return
    setAnnouncementSending(true)
    try {
      const targets = students.filter(s => selectedStudentIds.has(s.userId))
      await Promise.all(targets.map(s =>
        apiFetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: s.email,
            subject: announcementSubject.trim(),
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7B4FA6; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0;">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Announcement from Melinda</div>
                  <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">${announcementSubject.trim()}</div>
                </div>
                <div style="background: #f9f9f9; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
                  <p style="font-size: 15px; color: #333; line-height: 1.7; white-space: pre-wrap; margin: 0;">${announcementText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 16px;">This is a class announcement — replies are not monitored. To contact Melinda, use the <a href="https://mathwithmelinda.com/student/messages" style="color: #7B4FA6;">Messages</a> page.</p>
              </div>
            `,
            text: `Announcement from Melinda: ${announcementSubject.trim()}\n\n${announcementText.trim()}\n\n---\nThis is a class announcement. To reply, visit https://mathwithmelinda.com/student/messages`,
          }),
        }).catch(() => {})
      ))
      // Save to DB for history
      const selectedCourse = courses.find(c => c.id === courseFilter)
      const newRecord: any = await (client.graphql({
        query: CREATE_ANNOUNCEMENT,
        variables: {
          input: {
            subject: announcementSubject.trim(),
            message: announcementText.trim(),
            sentAt: new Date().toISOString(),
            recipientIds: JSON.stringify(Array.from(selectedStudentIds)),
            recipientCount: targets.length,
            courseId: courseFilter !== 'all' ? courseFilter : null,
            courseTitle: selectedCourse?.title || null,
          }
        }
      }) as any)
      setAnnouncements(prev => [newRecord.data.createAnnouncement, ...prev])

      setAnnouncementSent(true)
      setAnnouncementText('')
      setAnnouncementSubject('')
      setTimeout(() => {
        setAnnouncementSent(false)
        setShowAnnouncement(false)
      }, 2500)
    } catch (err) {
      console.error('Error sending announcement:', err)
    } finally {
      setAnnouncementSending(false)
    }
  }

  async function loadMessages() {
    setLoading(true)
    try {
      const res = await (client.graphql({ query: LIST_MESSAGES }) as any)
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
      await (client.graphql({ query: UPDATE_MESSAGE, variables: { input: { id: msgId, isRead: true } } }) as any)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m))
    } catch (err) {
      console.error('Error marking message read:', err)
    }
  }

  async function sendNewMessage() {
    if (!composeStudentId || !composeText.trim()) return
    setComposing(true)
    try {
      const student = students.find(s => s.userId === composeStudentId)
      if (!student) return
      const sentAt = new Date().toISOString()
      const result = await (client.graphql({
        query: CREATE_MESSAGE,
        variables: {
          input: {
            studentId: student.userId,
            studentName: `${student.name}`,
            content: composeText.trim(),
            sentAt,
            isRead: true,
            isTeacherInitiated: true,
          }
        }
      }) as any)
      const newMsg = result.data.createMessage
      setMessages(prev => [newMsg, ...prev])
      setComposeText('')
      setComposeStudentId('')
      setShowCompose(false)

      // Email the student
      apiFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.email,
          subject: 'New message from Melinda',
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#7B4FA6">Hi ${student.name},</h2>
            <p style="font-size:15px;color:#333">You have a new message from Melinda:</p>
            <div style="background:#f5f3ff;border-left:4px solid #7B4FA6;border-radius:8px;padding:16px;margin:16px 0;font-size:15px;line-height:1.6;color:#4C1D95">
              ${composeText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
            </div>
            <a href="https://mathwithmelinda.com/student/messages" style="display:inline-block;background:#7B4FA6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
              Reply in Messages
            </a>
          </div>`,
          text: `Hi ${student.name},\n\nNew message from Melinda:\n\n${composeText.trim()}\n\nReply at https://mathwithmelinda.com/student/messages`,
        }),
      }).catch(() => {})
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setComposing(false)
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

      // Email the student — fire and forget
      const msg = messages.find(m => m.id === msgId)
      if (msg?.studentId) {
        const studentEmail = msg.studentId // studentId is loginId (email) for password-auth users
        const studentName = msg.studentName || 'there'
        apiFetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: studentEmail,
            subject: 'Melinda replied to your message',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7B4FA6;">Hi ${studentName},</h2>
                <p style="font-size: 15px; color: #333;">Melinda replied to your message:</p>
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #15803d;">
                  ${reply.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
                </div>
                <a href="https://mathwithmelinda.com/student/messages" style="display: inline-block; background: #7B4FA6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  View in Messages
                </a>
              </div>
            `,
            text: `Hi ${studentName},\n\nMelinda replied to your message:\n\n"${reply}"\n\nView it at https://mathwithmelinda.com/student/messages`,
          }),
        }).catch(() => {}) // silently ignore — reply was still sent
      }
    } catch (err) {
      console.error('Error sending reply:', err)
    } finally {
      setSending(prev => ({ ...prev, [msgId]: false }))
    }
  }

  async function setConversationArchived(studentId: string, archived: boolean) {
    setArchiving(prev => ({ ...prev, [studentId]: true }))
    try {
      const studentMsgs = messages.filter(m => m.studentId === studentId)
      await Promise.all(studentMsgs.map(m =>
        client.graphql({
          query: UPDATE_MESSAGE,
          variables: { input: { id: m.id, isArchivedByTeacher: archived } },
        })
      ))
      setMessages(prev => prev.map(m =>
        m.studentId === studentId ? { ...m, isArchivedByTeacher: archived } : m
      ))
    } catch (err) {
      console.error('Error archiving conversation:', err)
    } finally {
      setArchiving(prev => ({ ...prev, [studentId]: false }))
    }
  }

  async function deleteConversation(studentId: string) {
    if (!window.confirm('Permanently delete all messages from this student? This cannot be undone.')) return
    const toDelete = messages.filter(m => m.studentId === studentId)
    try {
      await Promise.all(toDelete.map(m =>
        client.graphql({ query: DELETE_MESSAGE, variables: { input: { id: m.id } } })
      ))
      setMessages(prev => prev.filter(m => m.studentId !== studentId))
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  function handleExpand(msg: Message) {
    const newId = expandedMessageId === msg.id ? null : msg.id
    setExpandedMessageId(newId)
    if (newId && !msg.isRead) markRead(msg.id)
  }

  const activeMessages = messages.filter(m => !m.isArchivedByTeacher)
  const archivedMessages = messages.filter(m => m.isArchivedByTeacher)
  const activeGroups = groupByStudent(activeMessages)
  const archivedGroups = groupByStudent(archivedMessages)
  const currentGroups = tab === 'active' ? activeGroups : archivedGroups
  const totalUnread = activeMessages.filter(m => !m.isRead).length

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .msg-card { transition: box-shadow 0.15s; }
        .msg-card:hover { box-shadow: 0 4px 16px rgba(123,79,166,0.12) !important; }
      `}</style>

      <TeacherNav />

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '4px' }}>Student Messages</h1>
              <p style={{ color: 'var(--gray-mid)', margin: 0, fontSize: '14px' }}>Questions from students — reply inline to send a response.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {totalUnread > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                  {totalUnread} unread
                </span>
              )}
              <button
                onClick={() => { setShowCompose(a => !a); setShowAnnouncement(false) }}
                style={{ background: showCompose ? 'var(--plum)' : 'transparent', color: showCompose ? 'white' : 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ✏️ New Message
              </button>
              <button
                onClick={() => { setShowAnnouncement(a => !a); setShowCompose(false); setAnnouncementSent(false) }}
                style={{ background: showAnnouncement ? 'var(--plum)' : 'transparent', color: showAnnouncement ? 'white' : 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📢 Announce
              </button>
            </div>
          </div>
        </div>

        {/* Compose new message panel */}
        {showCompose && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--plum)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: '0 0 4px' }}>New Message</h2>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 20px' }}>Start a new conversation with a student. They'll receive an email notification and can reply in their messages.</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>To</label>
              <select
                value={composeStudentId}
                onChange={e => setComposeStudentId(e.target.value)}
                style={{ width: '100%', maxWidth: '360px', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: composeStudentId ? 'var(--foreground)' : 'var(--gray-mid)' }}
              >
                <option value="">Select a student…</option>
                {students.map(s => (
                  <option key={s.userId} value={s.userId}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Message</label>
              <textarea
                value={composeText}
                onChange={e => setComposeText(e.target.value)}
                placeholder="Write your message…"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={sendNewMessage}
                disabled={composing || !composeStudentId || !composeText.trim()}
                style={{ background: (composing || !composeStudentId || !composeText.trim()) ? 'var(--gray-light)' : 'var(--plum)', color: (composing || !composeStudentId || !composeText.trim()) ? 'var(--gray-mid)' : 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {composing ? 'Sending…' : 'Send Message'}
              </button>
              <button onClick={() => { setShowCompose(false); setComposeText(''); setComposeStudentId('') }}
                style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Announcement panel */}
        {showAnnouncement && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--plum)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: '0 0 4px' }}>Send Announcement</h2>
            <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 20px' }}>Email-only blast — students cannot reply to this. For two-way conversation, use the message threads below.</p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Subject</label>
              <input
                type="text"
                value={announcementSubject}
                onChange={e => setAnnouncementSubject(e.target.value)}
                placeholder="e.g. Reminder: assignments due Tuesday by 5pm"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Message</label>
              <textarea
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="Type your announcement here…"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recipients ({selectedStudentIds.size} selected)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Course filter */}
                  {courses.length > 0 && (
                    <select
                      value={courseFilter}
                      onChange={e => {
                        const val = e.target.value
                        setCourseFilter(val)
                        if (val === 'all') {
                          setSelectedStudentIds(new Set(students.map(s => s.userId)))
                        } else {
                          const inCourse = new Set(
                            students.filter(s => studentCourseMap[s.userId] === val).map(s => s.userId)
                          )
                          setSelectedStudentIds(inCourse)
                        }
                      }}
                      style={{ padding: '4px 8px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '12px', background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer' }}
                    >
                      <option value="all">All courses</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setSelectedStudentIds(
                      selectedStudentIds.size === students.length
                        ? new Set()
                        : new Set(students.map(s => s.userId))
                    )}
                    style={{ background: 'none', border: 'none', color: 'var(--plum)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
                  >
                    {selectedStudentIds.size === students.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>
              <div style={{ border: '1px solid var(--gray-light)', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', background: 'var(--background)' }}>
                {students.map(s => {
                  const studentCourseName = courses.find(c => c.id === studentCourseMap[s.userId])?.title
                  return (
                    <label key={s.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid var(--gray-light)', background: selectedStudentIds.has(s.userId) ? 'rgba(123,79,166,0.06)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(s.userId)}
                        onChange={() => {
                          const next = new Set(selectedStudentIds)
                          next.has(s.userId) ? next.delete(s.userId) : next.add(s.userId)
                          setSelectedStudentIds(next)
                        }}
                        style={{ accentColor: 'var(--plum)', width: '15px', height: '15px', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>{s.name}</span>
                      {studentCourseName && (
                        <span style={{ fontSize: '11px', color: 'var(--plum)', background: 'rgba(123,79,166,0.08)', borderRadius: '10px', padding: '1px 7px', flexShrink: 0 }}>{studentCourseName}</span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--gray-mid)', marginLeft: 'auto' }}>{s.email}</span>
                    </label>
                  )
                })}
                {students.length === 0 && (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--gray-mid)', textAlign: 'center' }}>No active students with email addresses</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={sendAnnouncement}
                disabled={announcementSending || !announcementText.trim() || !announcementSubject.trim() || selectedStudentIds.size === 0}
                style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (announcementSending || !announcementText.trim() || !announcementSubject.trim() || selectedStudentIds.size === 0) ? 0.6 : 1 }}
              >
                {announcementSending ? 'Sending…' : `Send to ${selectedStudentIds.size} student${selectedStudentIds.size !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => setShowAnnouncement(false)}
                style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              {announcementSent && (
                <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: 600 }}>✓ Announcement sent!</span>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--gray-light)', paddingBottom: '0' }}>
          {(['active', 'archived', 'announcements'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--plum)' : '2px solid transparent',
                color: tab === t ? 'var(--plum)' : 'var(--gray-mid)',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tab === t ? 600 : 400,
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {t === 'active' ? 'Active' : t === 'archived' ? 'Archived' : '📢 Sent'}
              <span style={{
                marginLeft: '6px',
                background: tab === t ? 'var(--plum-light)' : 'var(--gray-light)',
                color: tab === t ? 'var(--plum)' : 'var(--gray-mid)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '1px 7px',
                borderRadius: '20px',
              }}>
                {t === 'active' ? activeGroups.length : t === 'archived' ? archivedGroups.length : announcements.length}
              </span>
            </button>
          ))}
        </div>

        {/* Announcements history tab */}
        {tab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📢</div>
                <p style={{ fontSize: '16px', margin: 0 }}>No announcements sent yet</p>
              </div>
            ) : announcements.map(a => {
              const d = new Date(a.sentAt)
              const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              return (
                <div key={a.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--foreground)', marginBottom: '4px' }}>{a.subject}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{dateStr} at {timeStr}</span>
                        <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>·</span>
                        <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                          {a.courseTitle ? `${a.courseTitle} · ` : ''}{a.recipientCount ?? '?'} student{a.recipientCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--gray-light)', fontSize: '12px', cursor: 'pointer', flexShrink: 0, padding: '2px 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                    >
                      Delete
                    </button>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'var(--page-bg)', borderRadius: '8px', padding: '12px 14px' }}>
                    {a.message}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab !== 'announcements' && loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gray-mid)', padding: '48px 0', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading messages…
          </div>
        ) : currentGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3, display: 'block', margin: '0 auto 16px' }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p style={{ fontSize: '16px', margin: 0 }}>
              {tab === 'active' ? 'No active messages' : 'No archived conversations'}
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0', opacity: 0.6 }}>
              {tab === 'active' ? 'Student questions will appear here.' : 'Archive a conversation to move it here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {currentGroups.map(group => {
              const unreadCount = group.messages.filter(m => !m.isRead).length
              const isArchiving = archiving[group.studentId]

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

                    {/* Archive / Unarchive button */}
                    <button
                      onClick={() => setConversationArchived(group.studentId, tab === 'active')}
                      disabled={isArchiving}
                      title={tab === 'active' ? 'Archive this conversation' : 'Restore to active'}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--gray-light)',
                        color: 'var(--gray-mid)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isArchiving ? 0.5 : 1,
                      }}
                    >
                      {tab === 'active' ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                          Archive
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                          Restore
                        </>
                      )}
                    </button>
                    {tab === 'archived' && (
                      <button
                        onClick={() => deleteConversation(group.studentId)}
                        style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                      >
                        Delete
                      </button>
                    )}
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
                                {msg.content.startsWith('[ref:sub=') && (
                                  <span style={{ flexShrink: 0, fontSize: '11px', background: '#fef3c7', color: '#92400e', borderRadius: '10px', padding: '1px 6px', fontWeight: 700 }}>📋</span>
                                )}
                                <span style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: isUnread ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                                  {msg.content.replace(/^\[ref:sub=[^\]]+\]\n?/, '')}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginLeft: isUnread ? '15px' : '0' }}>
                                {fmtDate(msg.sentAt)}
                                {msg.teacherReply && (
                                  <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: 500 }}>• Replied</span>
                                )}
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, marginTop: '2px' }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>

                          {/* Expanded: full content + reply */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--gray-light)', padding: '16px 18px' }}>
                              <div style={{ background: 'rgba(123,79,166,0.04)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--plum)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Question</div>
                                {(() => {
                                  const refMatch = msg.content.match(/^\[ref:sub=([^\]]+)\]\n?/)
                                  const submissionId = refMatch ? refMatch[1] : null
                                  const displayContent = submissionId ? msg.content.replace(/^\[ref:sub=[^\]]+\]\n?/, '') : msg.content
                                  return (
                                    <>
                                      {submissionId && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                                            📋 Grade question
                                          </span>
                                          <a
                                            href={`/teacher/grades?submissionId=${submissionId}`}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--plum)', color: 'white', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                            Review Grade →
                                          </a>
                                        </div>
                                      )}
                                      <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{displayContent}</div>
                                    </>
                                  )
                                })()}
                              </div>

                              {msg.teacherReply && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Reply</div>
                                  <div style={{ fontSize: '14px', color: '#15803d', lineHeight: '1.6' }}>{msg.teacherReply}</div>
                                  {msg.repliedAt && (
                                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', opacity: 0.7 }}>Sent {fmtDate(msg.repliedAt)}</div>
                                  )}
                                </div>
                              )}

                              {tab === 'active' && (
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
                              )}
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
