'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useTheme } from '../../ThemeProvider'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

// ─── Types ───────────────────────────────────────────────────────────────────

type ZoomMeeting = {
  id: string
  topic: string
  zoomMeetingId: string | null
  joinUrl: string
  startUrl: string | null
  startTime: string
  durationMinutes: number
  inviteeType: string
  courseId: string | null
  courseTitle: string | null
  studentIds: string | null
  parentId: string | null
  notes: string | null
}

type StudentProfile = {
  id: string
  userId: string
  firstName: string
  lastName: string
  preferredName: string | null
  email: string | null
}

type Course = {
  id: string
  title: string
}

type ParentProfile = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const LIST_ZOOM_MEETINGS = /* GraphQL */`
  query ListZoomMeetings {
    listZoomMeetings(limit: 200) {
      items {
        id topic zoomMeetingId joinUrl startUrl startTime durationMinutes
        inviteeType courseId courseTitle studentIds parentId notes
      }
    }
  }
`

const CREATE_ZOOM_MEETING = /* GraphQL */`
  mutation CreateZoomMeeting($input: CreateZoomMeetingInput!) {
    createZoomMeeting(input: $input) {
      id topic zoomMeetingId joinUrl startUrl startTime durationMinutes
      inviteeType courseId courseTitle studentIds parentId notes
    }
  }
`

const DELETE_ZOOM_MEETING = /* GraphQL */`
  mutation DeleteZoomMeeting($input: DeleteZoomMeetingInput!) {
    deleteZoomMeeting(input: $input) { id }
  }
`

const LIST_STUDENTS = /* GraphQL */`
  query ListStudents {
    listStudentProfiles(limit: 500, filter: { status: { eq: "active" } }) {
      items { id userId firstName lastName preferredName email }
    }
  }
`

const LIST_COURSES = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 50) {
      items { id title isArchived }
    }
  }
`

const LIST_PARENTS = /* GraphQL */`
  query ListParents {
    listParentProfiles(limit: 200) {
      items { id userId firstName lastName email }
    }
  }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMeetingTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })
  } catch { return iso }
}

function isUpcoming(startTime: string): boolean {
  return new Date(startTime) > new Date()
}

function getMeetingStatus(startTime: string, durationMinutes: number, now: Date): 'upcoming' | 'live' | 'past' {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  if (now < start) return 'upcoming'
  if (now < end) return 'live'
  return 'past'
}

function getCountdownLabel(startTime: string, now: Date): string | null {
  const start = new Date(startTime)
  const minUntil = Math.round((start.getTime() - now.getTime()) / 60000)
  if (minUntil <= 0 || minUntil > 120) return null
  if (minUntil < 60) return `In ${minUntil} min`
  return `In ${Math.round(minUntil / 60)} hr`
}

function buildInviteeSummary(meeting: ZoomMeeting, studentMap: Record<string, string>): string {
  if (meeting.inviteeType === 'course') return meeting.courseTitle || 'Entire course'
  if (meeting.inviteeType === 'students') {
    try {
      const ids: string[] = JSON.parse(meeting.studentIds || '[]')
      const names = ids.map(id => studentMap[id] || id)
      if (names.length === 0) return 'No students'
      if (names.length <= 3) return names.join(', ')
      return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
    } catch { return 'Students' }
  }
  if (meeting.inviteeType === 'parent') return 'Parent meeting'
  if (meeting.inviteeType === 'parent-student') return 'Parent + student'
  return meeting.inviteeType
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ZoomMeetingsPage() {
  useTheme()
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [meetings, setMeetings] = useState<ZoomMeeting[]>([])
  const [now, setNow] = useState(new Date())

  // Tick every 60s so countdown badges stay accurate
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [parents, setParents] = useState<ParentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

  // Form state
  const [topic, setTopic] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('15:00')
  const [duration, setDuration] = useState(60)
  const [inviteeType, setInviteeType] = useState<'course' | 'students' | 'parent' | 'parent-student'>('students')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [meetingsRes, studentsRes, coursesRes, parentsRes] = await Promise.all([
          client.graphql({ query: LIST_ZOOM_MEETINGS }) as any,
          client.graphql({ query: LIST_STUDENTS }) as any,
          client.graphql({ query: LIST_COURSES }) as any,
          client.graphql({ query: LIST_PARENTS }) as any,
        ])
        const m: ZoomMeeting[] = meetingsRes.data.listZoomMeetings.items
        m.sort((a, b) => a.startTime.localeCompare(b.startTime))
        setMeetings(m)
        setStudents(studentsRes.data.listStudentProfiles.items)
        setCourses(coursesRes.data.listCourses.items.filter((c: any) => !c.isArchived))
        setParents(parentsRes.data.listParentProfiles.items)
      } catch (err) {
        console.error('Error loading zoom meetings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Default date to next weekday
  useEffect(() => {
    if (!showForm) return
    const d = new Date()
    if (d.getDay() === 0) d.setDate(d.getDate() + 1)
    else if (d.getDay() === 6) d.setDate(d.getDate() + 2)
    setDate(d.toISOString().slice(0, 10))
  }, [showForm])

  const studentMap: Record<string, string> = {}
  for (const s of students) {
    studentMap[s.userId] = s.preferredName || `${s.firstName} ${s.lastName}`
  }

  async function handleCreate() {
    if (!topic.trim() || !date || !time) return
    setCreating(true)
    setCreateError('')
    try {
      const startTime = `${date}T${time}:00`
      const course = courses.find(c => c.id === selectedCourseId)

      // Create Zoom meeting via API
      const res = await apiFetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), startTime, durationMinutes: duration }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create Zoom meeting')

      // Build invitee data
      let studentIds: string | null = null
      if (inviteeType === 'students') {
        studentIds = JSON.stringify(selectedStudentIds)
      } else if (inviteeType === 'course') {
        // store all active students in the course... handled via courseId
      }

      // Save to DynamoDB
      const result = await (client.graphql({
        query: CREATE_ZOOM_MEETING,
        variables: {
          input: {
            topic: topic.trim(),
            zoomMeetingId: String(data.meetingId),
            joinUrl: data.joinUrl,
            startUrl: data.startUrl,
            startTime,
            durationMinutes: duration,
            inviteeType,
            courseId: inviteeType === 'course' ? selectedCourseId : null,
            courseTitle: inviteeType === 'course' ? (course?.title || null) : null,
            studentIds: inviteeType === 'students' ? studentIds : null,
            parentId: (inviteeType === 'parent' || inviteeType === 'parent-student') ? selectedParentId : null,
            notes: notes.trim() || null,
          },
        },
      }) as any)

      const newMeeting: ZoomMeeting = result.data.createZoomMeeting
      setMeetings(prev => [...prev, newMeeting].sort((a, b) => a.startTime.localeCompare(b.startTime)))

      // Send invite emails — fire and forget
      const formattedTime = formatMeetingTime(startTime)
      const durationLabel = duration < 60 ? `${duration} min` : duration === 60 ? '1 hour' : `${duration / 60} hours`
      const emailBody = (name: string) => ({
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7B4FA6;">You've been invited to a Zoom meeting</h2>
            <p style="font-size: 15px; color: #333;">Hi ${name},</p>
            <p style="font-size: 15px; color: #333;">Melinda has scheduled a Zoom meeting for you:</p>
            <div style="background: #f5f3ff; border-left: 4px solid #7B4FA6; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
              <div style="font-size: 17px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px;">${topic.trim()}</div>
              <div style="font-size: 14px; color: #555; margin-bottom: 4px;">📅 ${formattedTime}</div>
              <div style="font-size: 14px; color: #555;">⏱ ${durationLabel}</div>
              ${notes.trim() ? `<div style="font-size: 13px; color: #777; margin-top: 8px; font-style: italic;">${notes.trim()}</div>` : ''}
            </div>
            <a href="${data.joinUrl}" style="display: inline-block; background: #0b5cff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Join Zoom Meeting
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">Or copy this link: ${data.joinUrl}</p>
          </div>
        `,
        text: `Hi ${name},\n\nMelinda has scheduled a Zoom meeting: ${topic.trim()}\n\nTime: ${formattedTime}\nDuration: ${durationLabel}\n\nJoin: ${data.joinUrl}`,
      })

      const emailPromises: Promise<any>[] = []

      if (inviteeType === 'students') {
        const invitedStudents = students.filter(s => selectedStudentIds.includes(s.userId) && s.email)
        for (const s of invitedStudents) {
          const name = s.preferredName || s.firstName
          const body = emailBody(name)
          emailPromises.push(apiFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: s.email, subject: `Zoom meeting scheduled: ${topic.trim()}`, ...body }),
          }))
        }
      } else if (inviteeType === 'course') {
        // Email all students (course-wide email not tied to enrollment here — send to all active students)
        for (const s of students.filter(s => s.email)) {
          const name = s.preferredName || s.firstName
          const body = emailBody(name)
          emailPromises.push(apiFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: s.email, subject: `Zoom meeting scheduled: ${topic.trim()}`, ...body }),
          }))
        }
      } else if (inviteeType === 'parent' || inviteeType === 'parent-student') {
        const parent = parents.find(p => p.userId === selectedParentId)
        if (parent?.email) {
          const name = parent.firstName
          const body = emailBody(name)
          emailPromises.push(apiFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: parent.email, subject: `Zoom meeting scheduled: ${topic.trim()}`, ...body }),
          }))
        }
        if (inviteeType === 'parent-student') {
          const invitedStudents = students.filter(s => selectedStudentIds.includes(s.userId) && s.email)
          for (const s of invitedStudents) {
            const name = s.preferredName || s.firstName
            const body = emailBody(name)
            emailPromises.push(apiFetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: s.email, subject: `Zoom meeting scheduled: ${topic.trim()}`, ...body }),
            }))
          }
        }
      }

      Promise.all(emailPromises).catch(() => {}) // silently ignore email errors

      // Reset form
      setShowForm(false)
      setTopic('')
      setNotes('')
      setSelectedStudentIds([])
      setSelectedParentId('')
      setSelectedCourseId('')
    } catch (err: any) {
      setCreateError(err.message || 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(null)
    try {
      await (client.graphql({ query: DELETE_ZOOM_MEETING, variables: { input: { id } } }) as any)
      setMeetings(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Error deleting meeting:', err)
    }
  }

  function copyLink(meeting: ZoomMeeting) {
    navigator.clipboard.writeText(meeting.joinUrl)
    setCopiedId(meeting.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleStudent(userId: string) {
    setSelectedStudentIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const upcomingMeetings = meetings.filter(m => getMeetingStatus(m.startTime, m.durationMinutes, now) !== 'past')
  const pastMeetings = meetings.filter(m => getMeetingStatus(m.startTime, m.durationMinutes, now) === 'past')
    .slice().reverse() // most recent first

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--gray-light)',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--gray-dark)',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>
              Zoom Meetings
            </h1>
            <p style={{ color: 'var(--gray-mid)', margin: 0 }}>
              Schedule one-on-one, group, or parent calls.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              + Schedule Meeting
            </button>
          )}
        </div>

        {/* ── CREATE FORM ── */}
        {showForm && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '24px' }}>
              New Meeting
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Topic */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Review session with Emma, Parent check-in"
                  style={inputStyle}
                />
              </div>

              {/* Date */}
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>

              {/* Time */}
              <div>
                <label style={labelStyle}>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
              </div>

              {/* Duration */}
              <div>
                <label style={labelStyle}>Duration</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Who */}
              <div>
                <label style={labelStyle}>Who's invited</label>
                <select
                  value={inviteeType}
                  onChange={e => {
                    setInviteeType(e.target.value as typeof inviteeType)
                    setSelectedStudentIds([])
                    setSelectedCourseId('')
                    setSelectedParentId('')
                  }}
                  style={inputStyle}
                >
                  <option value="students">Specific student(s)</option>
                  <option value="course">All students in a course</option>
                  <option value="parent">Parent only</option>
                  <option value="parent-student">Parent + student</option>
                </select>
              </div>
            </div>

            {/* Invitee selector */}
            {inviteeType === 'course' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Course</label>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={inputStyle}>
                  <option value="">Select a course…</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}

            {inviteeType === 'students' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Students</label>
                <div style={{
                  border: '1px solid var(--gray-light)',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: 'var(--background)',
                }}>
                  {students.length === 0 ? (
                    <div style={{ padding: '12px 16px', color: 'var(--gray-mid)', fontSize: '13px' }}>No active students</div>
                  ) : (
                    students.map(s => {
                      const name = s.preferredName || `${s.firstName} ${s.lastName}`
                      const checked = selectedStudentIds.includes(s.userId)
                      return (
                        <label
                          key={s.userId}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-light)',
                            background: checked ? 'var(--plum-light)' : 'transparent',
                            fontSize: '14px', color: 'var(--foreground)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(s.userId)}
                            style={{ accentColor: 'var(--plum)', width: '15px', height: '15px', flexShrink: 0 }}
                          />
                          {name}
                        </label>
                      )
                    })
                  )}
                </div>
                {selectedStudentIds.length > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--plum)', marginTop: '6px', fontWeight: 500 }}>
                    {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            )}

            {(inviteeType === 'parent' || inviteeType === 'parent-student') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Parent</label>
                <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)} style={inputStyle}>
                  <option value="">Select a parent…</option>
                  {parents.map(p => (
                    <option key={p.userId} value={p.userId}>{p.firstName} {p.lastName} ({p.email})</option>
                  ))}
                </select>
                {inviteeType === 'parent-student' && selectedParentId && (() => {
                  // Find linked students for this parent
                  const linked = students.filter(s => {
                    // Best effort — show all students for now, teacher knows which belong
                    return true
                  })
                  return (
                    <div style={{ marginTop: '12px' }}>
                      <label style={labelStyle}>Student(s) also joining</label>
                      <div style={{ border: '1px solid var(--gray-light)', borderRadius: '6px', background: 'var(--background)', maxHeight: '160px', overflowY: 'auto' }}>
                        {linked.map(s => {
                          const name = s.preferredName || `${s.firstName} ${s.lastName}`
                          const checked = selectedStudentIds.includes(s.userId)
                          return (
                            <label key={s.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid var(--gray-light)', background: checked ? 'var(--plum-light)' : 'transparent', fontSize: '14px', color: 'var(--foreground)' }}>
                              <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.userId)} style={{ accentColor: 'var(--plum)', width: '15px', height: '15px', flexShrink: 0 }} />
                              {name}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — for your reference)</span></label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Review lesson 42, discuss quiz grade"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {createError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#991B1B', marginBottom: '16px' }}>
                {createError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreate}
                disabled={creating || !topic.trim() || !date || !time}
                style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: creating ? 'default' : 'pointer', opacity: (creating || !topic.trim() || !date || !time) ? 0.6 : 1 }}
              >
                {creating ? 'Creating…' : 'Create Meeting'}
              </button>
              <button
                onClick={() => { setShowForm(false); setCreateError(''); setTopic(''); setNotes('') }}
                style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── UPCOMING MEETINGS ── */}
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading meetings…</p>
        ) : (
          <>
            {upcomingMeetings.length === 0 && !showForm ? (
              <div style={{ background: 'var(--background)', border: '1px dashed var(--gray-light)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                <p style={{ color: 'var(--gray-mid)', fontSize: '15px', margin: '0 0 20px' }}>No upcoming meetings scheduled.</p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Schedule a Meeting
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingMeetings.map(meeting => {
                  const status = getMeetingStatus(meeting.startTime, meeting.durationMinutes, now)
                  const isLive = status === 'live'
                  const countdown = getCountdownLabel(meeting.startTime, now)
                  const inviteeSummary = buildInviteeSummary(meeting, studentMap)
                  const isConfirming = confirmDeleteId === meeting.id

                  return (
                    <div
                      key={meeting.id}
                      style={{
                        background: 'var(--background)',
                        border: `1px solid ${isLive ? '#86EFAC' : 'var(--gray-light)'}`,
                        borderRadius: 'var(--radius)',
                        padding: '20px 24px',
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Left: time block */}
                      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '64px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: isLive ? '#16a34a' : 'var(--plum)', marginBottom: '4px' }}>
                          {isLive ? 'LIVE' : new Date(meeting.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                          {new Date(meeting.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '4px' }}>
                          {new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--gray-light)', flexShrink: 0 }} />

                      {/* Center: details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', marginBottom: '6px' }}>
                          {meeting.topic}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {/* Invitees */}
                          <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                            👥 {inviteeSummary}
                          </span>
                          {/* Duration */}
                          <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                            · {meeting.durationMinutes < 60
                              ? `${meeting.durationMinutes} min`
                              : meeting.durationMinutes === 60 ? '1 hr'
                              : `${meeting.durationMinutes / 60} hr`}
                          </span>
                          {/* Countdown badge */}
                          {isLive && (
                            <span style={{ fontSize: '12px', fontWeight: 700, background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC', borderRadius: '20px', padding: '2px 10px' }}>
                              🔴 Live now
                            </span>
                          )}
                          {!isLive && countdown && (
                            <span style={{ fontSize: '12px', fontWeight: 700, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: '20px', padding: '2px 10px' }}>
                              ⏰ {countdown}
                            </span>
                          )}
                        </div>
                        {meeting.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '6px', fontStyle: 'italic' }}>
                            {meeting.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, alignItems: 'flex-end' }}>
                        {/* Start / Join */}
                        {meeting.startUrl ? (
                          <a
                            href={meeting.startUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isLive ? '#16a34a' : '#0b5cff', color: 'white', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                          >
                            🎥 {isLive ? 'Join Now' : 'Start'}
                          </a>
                        ) : (
                          <a
                            href={meeting.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isLive ? '#16a34a' : '#0b5cff', color: 'white', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                          >
                            🎥 {isLive ? 'Join Now' : 'Start'}
                          </a>
                        )}

                        {/* Copy link */}
                        <button
                          onClick={() => copyLink(meeting)}
                          style={{ background: 'transparent', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: copiedId === meeting.id ? '#16a34a' : 'var(--gray-mid)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: copiedId === meeting.id ? 700 : 400 }}
                        >
                          {copiedId === meeting.id ? '✓ Copied!' : 'Copy invite link'}
                        </button>

                        {/* Delete */}
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--gray-dark)' }}>Delete?</span>
                            <button onClick={() => handleDelete(meeting.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>Yes</button>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', fontSize: '12px', cursor: 'pointer' }}>No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(meeting.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--gray-light)', fontSize: '11px', cursor: 'pointer', padding: 0, textAlign: 'right' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── PAST MEETINGS ── */}
            {pastMeetings.length > 0 && (
              <div style={{ marginTop: '36px' }}>
                <button
                  onClick={() => setShowPast(p => !p)}
                  style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showPast ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {showPast ? 'Hide' : 'Show'} past meetings ({pastMeetings.length})
                </button>

                {showPast && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pastMeetings.map(meeting => {
                      const inviteeSummary = buildInviteeSummary(meeting, studentMap)
                      return (
                        <div key={meeting.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.65 }}>
                          <div style={{ minWidth: '100px', flexShrink: 0 }}>
                            <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500 }}>
                              {new Date(meeting.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                              {new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>{meeting.topic}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>👥 {inviteeSummary}</div>
                          </div>
                          <button
                            onClick={() => copyLink(meeting)}
                            style={{ background: 'transparent', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: 'var(--gray-mid)', cursor: 'pointer' }}
                          >
                            {copiedId === meeting.id ? '✓ Copied' : 'Copy link'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
