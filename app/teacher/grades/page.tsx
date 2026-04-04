'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import { useTheme } from '../../ThemeProvider'
import MathRenderer from '../../components/MathRenderer'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

function SubmissionFile({ url, alt, inline }: { url: string; alt: string; inline?: boolean }) {
  const [failed, setFailed] = useState(false)
  const lc = url.toLowerCase()
  const isPdf = lc.includes('.pdf') || lc.includes('application%2Fpdf') || lc.includes('content-type=application')

  if (isPdf) {
    return inline ? (
      <div style={{ width: '100%', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-light)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', padding: '6px 12px', background: 'var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📄 {alt}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--plum)', textDecoration: 'none', fontSize: '11px', fontWeight: 600 }}>Open ↗</a>
        </div>
        <iframe src={url} style={{ width: '100%', height: '600px', border: 'none', display: 'block' }} title={alt} />
      </div>
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '6px', padding: '12px', borderRadius: '6px', border: '1px solid var(--plum-mid)',
        background: 'var(--plum-light)', textDecoration: 'none', color: 'var(--plum)',
        fontSize: '12px', fontWeight: 600, textAlign: 'center', minHeight: '90px', width: '100%'
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        PDF — Open to view
      </a>
    )
  }

  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '6px', padding: '12px', borderRadius: '6px', border: '1px solid var(--gray-light)',
        background: 'var(--gray-light)', textDecoration: 'none', color: 'var(--plum)',
        fontSize: '12px', fontWeight: 500, textAlign: 'center', minHeight: '90px', width: '100%'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        Open file ↗
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
      <img src={url} alt={alt} style={{ width: '100%', minHeight: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-light)', cursor: 'pointer', display: 'block' }} onError={() => setFailed(true)} />
    </a>
  )
}

const client = generateClient()

const listSubmissionsWithDetails = /* GraphQL */`
  query ListSubmissionsWithDetails {
    listSubmissions(limit: 100) {
      items {
        id
        studentId
        content
        grade
        teacherComment
        submittedAt
        isArchived
        archivedAt
        status
        returnReason
        assignment {
          id
          title
          dueDate
          course {
            id
            title
          }
        }
      }
    }
  }
`

const listStudentProfilesQuery = /* GraphQL */`
  query ListStudentProfiles {
    listStudentProfiles(limit: 500) {
      items {
        id
        userId
        email
        firstName
        lastName
      }
    }
  }
`

const getLessonTemplateQuestions = /* GraphQL */`
  query GetLessonTemplate($id: ID!) {
    getLessonTemplate(id: $id) {
      teachingNotes
      questions {
        items {
          id
          order
          questionText
          questionType
          correctAnswer
        }
      }
    }
  }
`

const listVideoWatchesQuery = /* GraphQL */`
  query ListVideoWatches {
    listVideoWatches(limit: 2000) {
      items {
        id
        studentId
        lessonId
        weeklyPlanItemId
        watchedSeconds
        durationSeconds
        percentWatched
        completed
        lastWatchedAt
      }
    }
  }
`

type VideoWatchRecord = {
  id: string
  studentId: string
  lessonId: string
  weeklyPlanItemId?: string | null
  watchedSeconds: number
  durationSeconds?: number | null
  percentWatched: number
  completed: boolean
  lastWatchedAt: string
}

function formatWatchTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

type Submission = {
  id: string
  studentId: string
  content: string | null
  grade: string | null
  teacherComment: string | null
  submittedAt: string | null
  isArchived?: boolean | null
  archivedAt?: string | null
  status?: string | null
  returnReason?: string | null
  assignment?: {
    id: string
    title: string
    dueDate: string | null
    course?: { id: string; title: string } | null
  } | null
}

type Question = { id: string; order: number; questionText: string; questionType: string; correctAnswer?: string | null }

function getSubmissionCourseId(s: Submission): string {
  if (s.assignment?.course?.id) return s.assignment.course.id
  try { return JSON.parse(s.content || '{}').courseId || '' }
  catch { return '' }
}

function getSubmissionCourseTitle(s: Submission): string {
  if (s.assignment?.course?.title) return s.assignment.course.title
  try { return JSON.parse(s.content || '{}').courseTitle || '' }
  catch { return '' }
}

function getSubmissionLabel(s: Submission): string {
  const courseTitle = getSubmissionCourseTitle(s)
  try { const c = JSON.parse(s.content || '{}'); return courseTitle || c.lessonTitle || 'No lesson info' }
  catch { return courseTitle || 'No lesson info' }
}

function getSubmissionTitle(s: Submission): string {
  if (s.assignment?.title) return s.assignment.title
  try { return JSON.parse(s.content || '{}').lessonTitle || 'Submission' }
  catch (e) { return 'Submission' }
}

function getSubmissionLessonId(s: Submission): string {
  try { return JSON.parse(s.content || '{}').lessonId || '' }
  catch { return '' }
}

function getSubmissionDueDateTime(s: Submission): Date | null {
  try { const c = JSON.parse(s.content || '{}'); return c.dueDateTime ? new Date(c.dueDateTime) : null }
  catch { return null }
}

function isSubmissionLate(s: Submission): boolean {
  if (!s.submittedAt) return false
  const due = getSubmissionDueDateTime(s)
  if (!due) return false
  return new Date(s.submittedAt) > due
}

function formatSubmittedAt(iso: string | null): string {
  if (!iso) return 'Unknown date'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function WatchBadge({ watch }: { watch: VideoWatchRecord | undefined | null }) {
  if (!watch) return (
    <span title="No video watch data" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--gray-mid)', fontSize: '11px', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
      </svg>
    </span>
  )
  const pct = Math.round(watch.percentWatched)
  const color = pct >= 90 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
  const bg = pct >= 90 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2'
  return (
    <span title={`Watched ${pct}% of video · Last watched ${new Date(watch.lastWatchedAt).toLocaleDateString()}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: bg, color, borderRadius: '20px', padding: '2px 7px', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <ellipse cx="12" cy="12" rx="11" ry="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>
      </svg>
      {pct}%
    </span>
  )
}

function NotesSection({ content }: { content: string | null }) {
  if (!content) return null
  let notes = ''
  try {
    const parsed = JSON.parse(content)
    notes = parsed.notes || ''
  } catch (e) {
    return null
  }
  if (!notes) return null
  return (
    <div style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Student notes</div>
      <p style={{ fontSize: '14px', color: 'var(--foreground)' }}>{notes}</p>
    </div>
  )
}

function QuestionScorecardSection({ questions, content, worksheetImageUrls, questionResults, onToggle }: {
  questions: Question[]
  content: string | null
  worksheetImageUrls: string[]   // The ONE uploaded show-work sheet (all show-work questions on it)
  questionResults: Record<string, boolean | null>
  onToggle: (id: string, correct: boolean | null) => void
}) {
  if (questions.length === 0) return null
  let answers: Record<string, string> = {}
  try {
    const parsed = JSON.parse(content || '{}')
    answers = parsed.answers || {}
  } catch { answers = {} }

  const gradable = questions.filter(q => q.questionType !== 'section_header')
  const evaluated = gradable.filter(q => questionResults[q.id] !== undefined && questionResults[q.id] !== null)
  const correct = gradable.filter(q => questionResults[q.id] === true).length
  const wrong = gradable.filter(q => questionResults[q.id] === false).length
  const pending = gradable.filter(q => questionResults[q.id] === undefined || questionResults[q.id] === null).length
  const hasShowWork = gradable.some(q => q.questionType === 'show_work')

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>Questions</div>
        {evaluated.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ color: '#16a34a' }}>✓ {correct}</span>
            <span style={{ color: '#dc2626' }}>✗ {wrong}</span>
            {pending > 0 && <span style={{ color: 'var(--gray-mid)' }}>· {pending} pending</span>}
          </div>
        )}
      </div>

      {/* Uploaded worksheet — shown once when there are show-work questions */}
      {hasShowWork && worksheetImageUrls.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            📷 Uploaded worksheet
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {worksheetImageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={`Worksheet ${i + 1}`} style={{ height: '140px', width: 'auto', borderRadius: '6px', border: '1px solid var(--gray-light)', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} />
              </a>
            ))}
          </div>
        </div>
      )}
      {hasShowWork && worksheetImageUrls.length === 0 && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#dc2626' }}>
          ⚠ No worksheet photo uploaded — show-work questions marked as not completed.
        </div>
      )}

      {(() => {
        let qNum = 0
        return questions.map((q, idx) => {
          const isHeader = q.questionType === 'section_header'
          if (!isHeader) qNum++
          const displayNum = qNum

          if (isHeader) {
            return (
              <div key={q.id} style={{ marginTop: idx === 0 ? 0 : '16px', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--plum-mid)', paddingBottom: '4px' }}>
                <MathRenderer text={q.questionText} />
              </div>
            )
          }

          const answer = answers[q.id]
          const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
          const qLabel = bookNumMatch ? bookNumMatch[1] : `${displayNum}.`
          const qBody = bookNumMatch ? bookNumMatch[2] : q.questionText
          const result = questionResults[q.id]  // true | false | null | undefined
          const isShowWork = q.questionType === 'show_work'

          const toggleBtnBase: React.CSSProperties = {
            border: '1px solid', borderRadius: '6px', padding: '5px 14px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            fontFamily: 'var(--font-body)', lineHeight: 1,
          }

          return (
            <div key={q.id} style={{
              marginBottom: '10px', padding: '12px 14px',
              background: result === true ? '#f0fdf4' : result === false ? '#fef2f2' : 'var(--background)',
              border: `1px solid ${result === true ? '#bbf7d0' : result === false ? '#fecaca' : 'var(--gray-light)'}`,
              borderRadius: '8px', transition: 'background 0.15s, border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {/* Number */}
                <span style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '14px', minWidth: '24px', paddingTop: '1px', flexShrink: 0 }}>{qLabel}</span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '8px', lineHeight: 1.5 }}>
                    <MathRenderer text={qBody} />
                  </div>

                  {isShowWork ? (
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', fontStyle: 'italic' }}>
                      {worksheetImageUrls.length > 0 ? 'See worksheet photo above' : 'No worksheet uploaded'}
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--gray-mid)', marginRight: '4px' }}>Student:</span>
                        <span style={{ fontWeight: 600, color: answer ? 'var(--foreground)' : 'var(--gray-mid)', fontStyle: answer ? 'normal' : 'italic' }}>
                          {answer ? <MathRenderer text={answer} /> : 'no answer'}
                        </span>
                      </div>
                      {q.correctAnswer && (
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--gray-mid)', marginRight: '4px' }}>Correct:</span>
                          <span style={{ fontWeight: 600, color: '#15803d' }}><MathRenderer text={q.correctAnswer} /></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ✓/✗ toggle */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingTop: '1px' }}>
                  <button
                    onClick={() => onToggle(q.id, result === true ? null : true)}
                    title="Mark correct"
                    style={{ ...toggleBtnBase, borderColor: '#16a34a', background: result === true ? '#16a34a' : 'transparent', color: result === true ? 'white' : '#16a34a' }}>
                    ✓
                  </button>
                  <button
                    onClick={() => onToggle(q.id, result === false ? null : false)}
                    title="Mark wrong"
                    style={{ ...toggleBtnBase, borderColor: '#dc2626', background: result === false ? '#dc2626' : 'transparent', color: result === false ? 'white' : '#dc2626' }}>
                    ✗
                  </button>
                </div>
              </div>
            </div>
          )
        })
      })()}
    </div>
  )
}

function GradingPageInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingSubmissionId = searchParams.get('submissionId')
  const autoSelectedRef = useRef(false)
  const { checking } = useRoleGuard('teacher')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [returning, setReturning] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnDueDate, setReturnDueDate] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returned, setReturned] = useState(false)
  const [clearingGrade, setClearingGrade] = useState(false)
  const [gradeCleared, setGradeCleared] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [studentNameMap, setStudentNameMap] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<Question[]>([])
  const [showWorkImageUrls, setShowWorkImageUrls] = useState<Record<string, string[]>>({})
  const { theme } = useTheme()

  const [filterCourse, setFilterCourse] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ungraded' | 'graded'>('ungraded')
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [videoWatchMap, setVideoWatchMap] = useState<Record<string, VideoWatchRecord>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiError, setAiError] = useState('')
  const [teachingVoice, setTeachingVoice] = useState('')
  const [lessonTeachingNotes, setLessonTeachingNotes] = useState('')
  const [questionResults, setQuestionResults] = useState<Record<string, boolean | null>>({})
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({})
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    fetchSubmissions()
    fetchStudentProfiles()
    fetchVideoWatches()
    fetchTeachingVoice()
  }, [])

  // Auto-select submission from URL param (grade dispute deep-link)
  useEffect(() => {
    if (!pendingSubmissionId || autoSelectedRef.current || submissions.length === 0) return
    const target = submissions.find(s => s.id === pendingSubmissionId)
    if (target) {
      autoSelectedRef.current = true
      // Clear the URL param without a navigation so the page doesn't re-trigger
      window.history.replaceState(null, '', '/teacher/grades')
      // Switch filter to show graded+ungraded so the submission is visible
      setFilterStatus('all')
      openSubmission(target)
    }
  }, [submissions, pendingSubmissionId])

  // Auto-refresh submissions every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      silentRefresh()
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  async function silentRefresh() {
    try {
      const result = await client.graphql({ query: listSubmissionsWithDetails }) as any
      const items = result.data.listSubmissions.items as Submission[]
      setSubmissions(items)
      setLastRefreshed(new Date())
    } catch { /* silent */ }
  }

  async function handleManualRefresh() {
    setRefreshing(true)
    try {
      const result = await client.graphql({ query: listSubmissionsWithDetails }) as any
      const items = result.data.listSubmissions.items as Submission[]
      setSubmissions(items)
      setLastRefreshed(new Date())
    } catch (err) { console.error(err) }
    finally { setRefreshing(false) }
  }

  async function fetchStudentProfiles() {
    try {
      const result = await client.graphql({ query: listStudentProfilesQuery }) as any
      const items = result.data.listStudentProfiles.items as { id: string; userId: string; email: string; firstName: string; lastName: string }[]
      const map: Record<string, string> = {}
      for (const p of items) {
        const name = `${p.firstName} ${p.lastName}`
        if (p.email) map[p.email] = name
        if (p.userId) map[p.userId] = name
      }
      setStudentNameMap(map)
    } catch (err) {
      console.error('Error fetching student profiles:', err)
    }
  }

  async function fetchVideoWatches() {
    try {
      const result = await client.graphql({ query: listVideoWatchesQuery }) as any
      const items = result.data.listVideoWatches.items as VideoWatchRecord[]
      const map: Record<string, VideoWatchRecord> = {}
      for (const w of items) {
        const key = `${w.studentId}_${w.lessonId}`
        if (!map[key] || w.lastWatchedAt > map[key].lastWatchedAt) {
          map[key] = w
        }
      }
      setVideoWatchMap(map)
    } catch (err) {
      console.error('Error fetching video watches:', err)
    }
  }

  async function fetchSubmissions() {
    try {
      const result = await client.graphql({ query: listSubmissionsWithDetails }) as any
      const items = result.data.listSubmissions.items as Submission[]
      setSubmissions(items)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTeachingVoice() {
    try {
      const userId = user?.userId || user?.username || ''
      const result = await (client.graphql({
        query: `query GetTeacherProfile($userId: String!) { listTeacherProfiles(filter: { userId: { eq: $userId } }, limit: 1) { items { teachingVoice } } }`,
        variables: { userId }
      }) as any)
      const items = result.data?.listTeacherProfiles?.items || []
      if (items.length > 0) setTeachingVoice(items[0].teachingVoice || '')
    } catch { /* silent */ }
  }

  function computeGradeFromResults(qs: Question[], results: Record<string, boolean | null>): string {
    const gradable = qs.filter(q => q.questionType !== 'section_header')
    if (gradable.length === 0) return ''
    const correct = gradable.filter(q => results[q.id] === true).length
    return String(Math.round((correct / gradable.length) * 100))
  }

  function onToggleQuestion(id: string, correct: boolean | null) {
    setQuestionResults(prev => {
      const next = { ...prev, [id]: correct }
      const computed = computeGradeFromResults(questions, next)
      if (computed) setGrade(computed)
      return next
    })
    // Track that Melinda manually set this question so re-grade preserves it
    if (correct !== null) {
      setManualOverrides(prev => ({ ...prev, [id]: correct }))
    } else {
      setManualOverrides(prev => { const n = { ...prev }; delete n[id]; return n })
    }
  }

  async function suggestWithAI() {
    if (!selectedSubmission) return
    const parsed = (() => { try { return JSON.parse(selectedSubmission.content || '{}') } catch { return {} } })()
    const hasFiles = parsed.files && parsed.files.length > 0
    const hasAnswers = parsed.answers && Object.keys(parsed.answers).length > 0
    if (!hasFiles && !hasAnswers) {
      setAiError('No submission content found — student has not answered any questions or uploaded a photo.')
      return
    }
    setAiSuggesting(true)
    setAiError('')
    try {
      const studentName = studentNameMap[selectedSubmission.studentId] || selectedSubmission.studentId
      const lessonTitle = getSubmissionTitle(selectedSubmission)
      const digitalAnswers: Record<string, string> = parsed.answers || {}
      const isRegrade = Object.keys(questionResults).length > 0
      const res = await fetch('/api/grade-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKeys: parsed.files || [],
          questions: questions.map(q => ({ id: q.id, questionText: q.questionText, questionType: q.questionType, correctAnswer: q.correctAnswer ?? null })),
          answers: digitalAnswers,
          studentName,
          lessonTitle,
          teachingVoice,
          teachingNotes: lessonTeachingNotes,
          // On re-grade, pass Melinda's manual overrides so AI respects them
          lockedResults: isRegrade ? manualOverrides : {},
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI suggestion failed')
      if (data.comment) setComment(data.comment)
      // Apply per-question results from AI, preserving any manual overrides
      if (data.questionResults && Array.isArray(data.questionResults)) {
        const aiResults: Record<string, boolean | null> = {}
        for (const r of data.questionResults as { id: string; correct: boolean | null }[]) {
          aiResults[r.id] = r.correct
        }
        // Merge: AI fills in everything, manual overrides take final priority
        const merged: Record<string, boolean | null> = { ...aiResults, ...manualOverrides }
        setQuestionResults(merged)
        const computed = computeGradeFromResults(questions, merged)
        setGrade(computed || data.grade || '')
      } else if (data.grade) {
        setGrade(data.grade)
      }
    } catch (err: any) {
      setAiError(err.message || 'AI suggestion failed. Please try again.')
    } finally {
      setAiSuggesting(false)
    }
  }

  async function fetchPresignedUrl(key: string): Promise<string> {
    const res = await fetch('/api/view-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    })
    const { url } = await res.json()
    return url
  }

  async function openSubmission(submission: Submission) {
    setSelectedSubmission(submission)
    setGrade(submission.grade || '')
    setComment(submission.teacherComment || '')
    setSaved(false)
    setReturnReason('')
    setReturnDueDate('')
    setShowReturnForm(false)
    setReturned(false)
    setGradeCleared(false)
    setImageUrls([])
    setQuestions([])
    setShowWorkImageUrls({})
    setLessonTeachingNotes('')
    setAiError('')
    setQuestionResults({})
    setManualOverrides({})

    if (!submission.content) return
    try {
      const parsed = JSON.parse(submission.content)

      if (parsed.files && parsed.files.length > 0) {
        const urls = await Promise.all(parsed.files.map(fetchPresignedUrl))
        setImageUrls(urls)
      }

      if (parsed.lessonTemplateId) {
        try {
          const result = await (client.graphql({
            query: getLessonTemplateQuestions,
            variables: { id: parsed.lessonTemplateId }
          }) as any)
          const tmpl = result.data.getLessonTemplate
          const items: Question[] = tmpl?.questions?.items || []
          setQuestions(items.sort((a, b) => a.order - b.order))
          setLessonTeachingNotes(tmpl?.teachingNotes || '')
        } catch { /* no questions */ }
      }

      if (parsed.showWorkFiles) {
        const entries = Object.entries(parsed.showWorkFiles) as [string, string[]][]
        const resolved = await Promise.all(
          entries.map(async ([qId, keys]) => {
            const urls = await Promise.all(keys.map(fetchPresignedUrl))
            return [qId, urls] as [string, string[]]
          })
        )
        setShowWorkImageUrls(Object.fromEntries(resolved))
      }
    } catch { /* content not parseable */ }
  }

  async function saveGrade() {
    if (!selectedSubmission) return
    setSaving(true)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')

      // Pack per-question results into content so student can see their breakdown
      let updatedContent = selectedSubmission.content || '{}'
      if (Object.keys(questionResults).length > 0 && questions.length > 0) {
        const parsed = (() => { try { return JSON.parse(selectedSubmission.content || '{}') } catch { return {} } })()
        const studentAnswers: Record<string, string> = parsed.answers || {}
        const gradedQuestions = questions
          .filter(q => q.questionType !== 'section_header' && questionResults[q.id] !== undefined && questionResults[q.id] !== null)
          .map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            correct: questionResults[q.id] as boolean,
            studentAnswer: studentAnswers[q.id] || null,
            correctAnswer: q.correctAnswer || null,
          }))
        updatedContent = JSON.stringify({ ...parsed, gradedQuestions })
      }

      await client.graphql({
        query: updateSubmission,
        variables: { input: { id: selectedSubmission.id, grade, teacherComment: comment, content: updatedContent } }
      })
      setSaved(true)
      setTimeout(() => {
        setSelectedSubmission(null)
        setSaved(false)
      }, 1500)
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, grade, teacherComment: comment, content: updatedContent } : s))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function returnToStudent() {
    if (!selectedSubmission || !returnReason.trim()) return
    setReturning(true)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      const input = {
        id: selectedSubmission.id,
        status: 'returned',
        returnReason: returnReason.trim(),
        grade: null,
        ...(returnDueDate ? { returnDueDate } : {}),
      } as any
      await (client.graphql({ query: updateSubmission, variables: { input } }) as any)
      const update = { status: 'returned', returnReason: returnReason.trim(), returnDueDate: returnDueDate || null, grade: null }
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, ...update } : s))
      setSelectedSubmission(prev => prev ? { ...prev, ...update } : prev)
      setReturned(true)
      setShowReturnForm(false)
    } catch (err) { console.error(err) }
    finally { setReturning(false) }
  }

  async function clearGrade() {
    if (!selectedSubmission) return
    setClearingGrade(true)
    setGradeCleared(false)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      await (client.graphql({
        query: updateSubmission,
        variables: { input: { id: selectedSubmission.id, grade: null, teacherComment: null } }
      }) as any)
      setGrade('')
      setComment('')
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, grade: null, teacherComment: null } : s))
      setSelectedSubmission(prev => prev ? { ...prev, grade: null, teacherComment: null } : prev)
      setGradeCleared(true)
    } catch (err) { console.error(err) }
    finally { setClearingGrade(false) }
  }

  async function pullBackReturn() {
    if (!selectedSubmission) return
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      await (client.graphql({
        query: updateSubmission,
        variables: { input: { id: selectedSubmission.id, status: null, returnReason: null, returnDueDate: null } as any }
      }) as any)
      const update = { status: null, returnReason: null, returnDueDate: null }
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, ...update } : s))
      setSelectedSubmission(prev => prev ? { ...prev, ...update } : prev)
      setReturned(false)
      setShowReturnForm(false)
    } catch (err) { console.error(err) }
  }

  async function archiveSubmission(id: string) {
    setArchiving(true)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: updateSubmission,
        variables: { input: { id, isArchived: true, archivedAt: new Date().toISOString() } }
      })
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, isArchived: true, archivedAt: new Date().toISOString() } : s))
      if (selectedSubmission?.id === id) setSelectedSubmission(null)
    } catch (err) { console.error(err) }
    finally { setArchiving(false) }
  }

  async function unarchiveSubmission(id: string) {
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      await client.graphql({
        query: updateSubmission,
        variables: { input: { id, isArchived: false, archivedAt: null } }
      })
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, isArchived: false, archivedAt: null } : s))
    } catch (err) { console.error(err) }
  }

  async function bulkArchiveCourse() {
    const toArchive = submissions.filter(s =>
      !s.isArchived &&
      (filterCourse === 'all' || getSubmissionCourseId(s) === filterCourse)
    )
    setArchiving(true)
    setBulkConfirm(false)
    try {
      const { updateSubmission } = await import('../../../src/graphql/mutations')
      const now = new Date().toISOString()
      await Promise.all(toArchive.map(s =>
        client.graphql({ query: updateSubmission, variables: { input: { id: s.id, isArchived: true, archivedAt: now } } })
      ))
      setSubmissions(prev => prev.map(s =>
        toArchive.find(t => t.id === s.id) ? { ...s, isArchived: true, archivedAt: now } : s
      ))
      setSelectedSubmission(null)
    } catch (err) { console.error(err) }
    finally { setArchiving(false) }
  }

  async function deleteSubmissionRecord(id: string) {
    setDeleting(true)
    try {
      const { deleteSubmission } = await import('../../../src/graphql/mutations')
      await client.graphql({ query: deleteSubmission, variables: { input: { id } } })
      setSubmissions(prev => prev.filter(s => s.id !== id))
      if (selectedSubmission?.id === id) setSelectedSubmission(null)
      setDeleteConfirmId(null)
    } catch (err) { console.error(err) }
    finally { setDeleting(false) }
  }

  async function bulkDeleteArchived() {
    const toDelete = submissions.filter(s => s.isArchived && (filterCourse === 'all' || getSubmissionCourseId(s) === filterCourse))
    setDeleting(true)
    setBulkConfirm(false)
    try {
      const { deleteSubmission } = await import('../../../src/graphql/mutations')
      await Promise.all(toDelete.map(s => client.graphql({ query: deleteSubmission, variables: { input: { id: s.id } } })))
      setSubmissions(prev => prev.filter(s => !toDelete.find(t => t.id === s.id)))
      if (selectedSubmission && toDelete.find(t => t.id === selectedSubmission.id)) setSelectedSubmission(null)
    } catch (err) { console.error(err) }
    finally { setDeleting(false) }
  }

  function toggleStudent(studentId: string) {
    setExpandedStudents(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const courses: { id: string; title: string }[] = []
  const seenCourseIds = new Set<string>()
  for (const s of submissions) {
    const cId = getSubmissionCourseId(s)
    const cTitle = getSubmissionCourseTitle(s)
    if (cId && cTitle && !seenCourseIds.has(cId)) {
      seenCourseIds.add(cId)
      courses.push({ id: cId, title: cTitle })
    }
  }

  const filteredSubmissions = submissions
    .filter(s => {
      if (!!s.isArchived !== showArchived) return false
      if (filterCourse !== 'all' && getSubmissionCourseId(s) !== filterCourse) return false
      if (!showArchived) {
        if (filterStatus === 'ungraded' && !!s.grade) return false
        if (filterStatus === 'graded' && !s.grade) return false
      }
      if (searchQuery.trim()) {
        const name = (studentNameMap[s.studentId] || s.studentId).toLowerCase()
        if (!name.includes(searchQuery.trim().toLowerCase())) return false
      }
      return true
    })
    .sort((a, b) => {
      const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
      const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
      return tb - ta
    })

  // Group by student for the student-grouped view
  type StudentGroup = { studentId: string; name: string; submissions: Submission[]; ungradedCount: number }
  const studentGroups: StudentGroup[] = []
  const seenStudents = new Set<string>()
  for (const s of filteredSubmissions) {
    if (!seenStudents.has(s.studentId)) {
      seenStudents.add(s.studentId)
      const group = filteredSubmissions.filter(x => x.studentId === s.studentId)
      studentGroups.push({
        studentId: s.studentId,
        name: studentNameMap[s.studentId] || s.studentId,
        submissions: group,
        ungradedCount: group.filter(x => !x.grade).length,
      })
    }
  }
  // Students with ungraded float to top
  studentGroups.sort((a, b) => {
    if (a.ungradedCount > 0 && b.ungradedCount === 0) return -1
    if (a.ungradedCount === 0 && b.ungradedCount > 0) return 1
    return 0
  })

  const ungradedCount = submissions.filter(s => !s.grade && !s.isArchived).length
  const archivedCount = submissions.filter(s => s.isArchived).length
  const bulkArchiveCount = submissions.filter(s =>
    !s.isArchived && (filterCourse === 'all' || getSubmissionCourseId(s) === filterCourse)
  ).length
  const archivedCourseCount = submissions.filter(s => s.isArchived && (filterCourse === 'all' || getSubmissionCourseId(s) === filterCourse)).length

  const pillBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
  }
  const pillActive: React.CSSProperties = { ...pillBase, background: 'var(--plum)', color: 'white' }
  const pillInactive: React.CSSProperties = { ...pillBase, background: 'var(--gray-light)', color: 'var(--gray-dark)' }

  const bulkArchiveCourseName = filterCourse !== 'all' ? (courses.find(c => c.id === filterCourse)?.title || '') : ''
  const bulkArchiveLabel = bulkArchiveCourseName
    ? 'Archive all ' + bulkArchiveCourseName + ' submissions (' + bulkArchiveCount + ')'
    : 'Archive all submissions (' + bulkArchiveCount + ')'

  if (checking) return null
  if (!mounted) return <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }} />

  return (
    <div suppressHydrationWarning style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', gap: '32px' }}>

        <div style={{ width: '340px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: 0 }}>Grade Work</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                  Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
                <button onClick={handleManualRefresh} disabled={refreshing}
                  title="Check for new submissions"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--plum)', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, opacity: refreshing ? 0.5 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }}>
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  {refreshing ? 'Checking…' : 'Refresh'}
                </button>
              </div>
            </div>
            <button onClick={() => { setShowArchived(!showArchived); setSelectedSubmission(null) }}
              style={{ background: showArchived ? 'var(--plum)' : 'var(--gray-light)', color: showArchived ? 'white' : 'var(--gray-dark)', border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
              {showArchived ? '← Active' : `Archive${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
            </button>
          </div>

          {/* Search */}
          <input
            placeholder="Search student..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              marginBottom: '10px',
              boxSizing: 'border-box',
            }}
          />

          {/* Course filter */}
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              marginBottom: '14px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button style={filterStatus === 'all' ? pillActive : pillInactive} onClick={() => setFilterStatus('all')}>
              All
            </button>
            <button style={filterStatus === 'ungraded' ? pillActive : pillInactive} onClick={() => setFilterStatus('ungraded')}>
              Needs Grading
              {ungradedCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: filterStatus === 'ungraded' ? 'rgba(255,255,255,0.25)' : 'var(--plum)',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {ungradedCount}
                </span>
              )}
            </button>
            <button style={filterStatus === 'graded' ? pillActive : pillInactive} onClick={() => setFilterStatus('graded')}>
              Graded
            </button>
          </div>

          {/* Bulk operations */}
          {!showArchived && bulkArchiveCount > 0 && (
            <div style={{ marginBottom: '14px' }}>
              {bulkConfirm ? (
                <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
                  <p style={{ margin: '0 0 8px', color: '#92400E', fontWeight: 500 }}>
                    Archive {bulkArchiveCount} submission{bulkArchiveCount !== 1 ? 's' : ''}? This can be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={bulkArchiveCourse} disabled={archiving}
                      style={{ background: '#92400E', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                      {archiving ? 'Archiving...' : 'Yes, archive all'}
                    </button>
                    <button onClick={() => setBulkConfirm(false)}
                      style={{ background: 'transparent', color: '#92400E', border: '1px solid #F59E0B', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setBulkConfirm(true)}
                  style={{ width: '100%', background: 'transparent', color: 'var(--gray-mid)', border: '1px dashed var(--gray-light)', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  {bulkArchiveLabel}
                </button>
              )}
            </div>
          )}
          {showArchived && archivedCourseCount > 0 && (
            <div style={{ marginBottom: '14px' }}>
              {bulkConfirm ? (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
                  <p style={{ margin: '0 0 8px', color: '#991B1B', fontWeight: 500 }}>
                    Permanently delete {archivedCourseCount} archived submission{archivedCourseCount !== 1 ? 's' : ''}? This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={bulkDeleteArchived} disabled={deleting}
                      style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                      {deleting ? 'Deleting...' : 'Yes, delete all'}
                    </button>
                    <button onClick={() => setBulkConfirm(false)}
                      style={{ background: 'transparent', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setBulkConfirm(true)}
                  style={{ width: '100%', background: 'transparent', color: '#dc2626', border: '1px dashed #FCA5A5', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  Delete all {archivedCourseCount} archived permanently
                </button>
              )}
            </div>
          )}

          {/* Submission list — grouped by student */}
          {loading ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Loading submissions...</p>
          ) : studentGroups.length === 0 ? (
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', fontStyle: 'italic' }}>No submissions match your filters.</p>
          ) : (
            studentGroups.map(group => {
              const isExpanded = expandedStudents.has(group.studentId)
              return (
                <div key={group.studentId} style={{ marginBottom: '6px' }}>
                  {/* Student header */}
                  <div
                    onClick={() => toggleStudent(group.studentId)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: isExpanded ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--plum-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--background)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {group.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                        {group.submissions.length} submission{group.submissions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {group.ungradedCount > 0 && (
                        <span style={{ background: '#f97316', color: 'white', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px' }}>
                          {group.ungradedCount} ungraded
                        </span>
                      )}
                      <span style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>
                  {/* Expanded submissions */}
                  {isExpanded && (
                    <div style={{ border: '1px solid var(--gray-light)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', overflow: 'hidden' }}>
                      {group.submissions.map((s, idx) => (
                        <div
                          key={s.id}
                          style={{
                            background: selectedSubmission?.id === s.id ? 'var(--plum-light)' : 'var(--background)',
                            borderTop: idx > 0 ? '1px solid var(--gray-light)' : 'none',
                            padding: '10px 14px',
                            cursor: 'pointer',
                          }}
                          onClick={() => openSubmission(s)}
                          onMouseEnter={e => { if (selectedSubmission?.id !== s.id) e.currentTarget.style.background = 'var(--page-bg)' }}
                          onMouseLeave={e => { if (selectedSubmission?.id !== s.id) e.currentTarget.style.background = 'var(--background)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                              {getSubmissionTitle(s)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <WatchBadge watch={videoWatchMap[`${s.studentId}_${getSubmissionLessonId(s)}`]} />
                              {s.status === 'returned' ? (
                                <span style={{ background: '#f59e0b', color: 'white', fontSize: '11px', padding: '1px 7px', borderRadius: '20px' }}>
                                  Returned
                                </span>
                              ) : s.grade ? (
                                <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', padding: '1px 7px', borderRadius: '20px' }}>
                                  {s.grade}
                                </span>
                              ) : (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', display: 'inline-block', flexShrink: 0, marginTop: '2px' }} />
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--gray-mid)' }}>
                              {formatSubmittedAt(s.submittedAt)}
                              {isSubmissionLate(s) && (
                                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.3px' }}>LATE</span>
                              )}
                            </div>
                            {/* Archive / Delete controls */}
                            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {s.isArchived ? (
                                /* Archived view: Restore + Delete */
                                deleteConfirmId === s.id ? (
                                  <>
                                    <span style={{ fontSize: '11px', color: '#dc2626', marginRight: '2px' }}>Delete?</span>
                                    <button onClick={() => deleteSubmissionRecord(s.id)} disabled={deleting}
                                      style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}>
                                      {deleting ? '…' : 'Yes'}
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(null)}
                                      style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}>
                                      No
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => unarchiveSubmission(s.id)}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', fontSize: '11px', padding: '2px 4px' }}>
                                      Restore
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(s.id)}
                                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', padding: '2px 4px', opacity: 0.7 }}
                                      title="Delete permanently">
                                      Delete
                                    </button>
                                  </>
                                )
                              ) : (
                                /* Active view: Archive only */
                                <button onClick={() => archiveSubmission(s.id)} disabled={archiving}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', fontSize: '11px', padding: '2px 4px' }}>
                                  Archive
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {selectedSubmission ? (
          <div style={{ flex: 1 }}>
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '32px' }}>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '4px' }}>
                {getSubmissionTitle(selectedSubmission)}
              </h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{studentNameMap[selectedSubmission.studentId] || selectedSubmission.studentId}</span>
                <span>·</span>
                <span>Submitted {formatSubmittedAt(selectedSubmission.submittedAt)}</span>
                {isSubmissionLate(selectedSubmission) && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.3px' }}>LATE</span>
                )}
                {getSubmissionDueDateTime(selectedSubmission) && (
                  <span style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
                    · Due {new Date(getSubmissionDueDateTime(selectedSubmission)!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={suggestWithAI}
                  disabled={aiSuggesting}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: aiSuggesting ? 'var(--gray-light)' : 'var(--plum-light)', color: aiSuggesting ? 'var(--gray-mid)' : 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '8px 16px', borderRadius: '8px', cursor: aiSuggesting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                  {aiSuggesting ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Grading…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      {Object.keys(questionResults).length > 0 ? 'Re-grade with AI' : 'Grade with AI'}
                    </>
                  )}
                </button>
                {aiError && <span style={{ fontSize: '12px', color: '#b91c1c' }}>{aiError}</span>}
              </div>

              <QuestionScorecardSection
                questions={questions}
                content={selectedSubmission.content}
                worksheetImageUrls={imageUrls}
                questionResults={questionResults}
                onToggle={onToggleQuestion}
              />

              {/* Show uploaded files for older submissions that have no questions (backwards compat) */}
              {questions.length === 0 && imageUrls.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray-mid)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Submitted files ({imageUrls.length})</div>
                  {imageUrls.map((url, i) => {
                    const lc = url.toLowerCase()
                    const isPdf = lc.includes('.pdf') || lc.includes('application%2Fpdf')
                    return isPdf
                      ? <SubmissionFile key={i} url={url} alt={`Submission ${i + 1}`} inline />
                      : <div key={i} style={{ marginBottom: '12px' }}><SubmissionFile url={url} alt={`Submission ${i + 1}`} /></div>
                  })}
                </div>
              )}

              <NotesSection content={selectedSubmission.content} />

              {/* ── Video Watch Panel ── */}
              {(() => {
                const lessonId = getSubmissionLessonId(selectedSubmission)
                if (!lessonId) return null
                const watch = videoWatchMap[`${selectedSubmission.studentId}_${lessonId}`]
                const pct = watch ? Math.round(watch.percentWatched) : 0
                const barColor = pct >= 90 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                return (
                  <div style={{ background: 'var(--page-bg)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: watch ? '12px' : '0' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-mid)" strokeWidth="2">
                        <ellipse cx="12" cy="12" rx="11" ry="8"/><circle cx="12" cy="12" r="3" fill="var(--gray-mid)"/>
                      </svg>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Video Watch
                      </span>
                      {watch && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gray-mid)' }}>
                          Last watched {new Date(watch.lastWatchedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {watch ? (
                      <>
                        <div style={{ height: '6px', background: 'var(--gray-light)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: barColor }}>{pct}% watched</span>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--gray-mid)' }}>
                            <span>{formatWatchTime(watch.watchedSeconds)} watched</span>
                            {watch.durationSeconds ? <span>of {formatWatchTime(watch.durationSeconds)}</span> : null}
                            {watch.completed && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Completed</span>}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--gray-mid)', fontStyle: 'italic', margin: 0 }}>
                        No video watch data — student has not played this lesson's video.
                      </p>
                    )}
                  </div>
                )
              })()}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={suggestWithAI}
                  disabled={aiSuggesting}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: aiSuggesting ? 'var(--gray-light)' : 'var(--plum-light)', color: aiSuggesting ? 'var(--gray-mid)' : 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '8px 16px', borderRadius: '8px', cursor: aiSuggesting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                  {aiSuggesting ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Grading…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Re-grade with AI
                    </>
                  )}
                </button>
                {aiError && <span style={{ fontSize: '12px', color: '#b91c1c' }}>{aiError}</span>}
                {!aiError && !aiSuggesting && (grade || comment) && (
                  <span style={{ fontSize: '12px', color: 'var(--gray-mid)', fontStyle: 'italic' }}>Edit the suggestion below before saving</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>
                    Grade
                    {(() => {
                      const gradable = questions.filter(q => q.questionType !== 'section_header')
                      const correct = gradable.filter(q => questionResults[q.id] === true).length
                      const marked = gradable.filter(q => questionResults[q.id] !== undefined && questionResults[q.id] !== null).length
                      if (marked === 0) return null
                      return <span style={{ fontWeight: 400, color: 'var(--gray-mid)', marginLeft: '6px' }}>({correct}/{gradable.length})</span>
                    })()}
                  </label>
                  <input type="text" value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. 95"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }} />
                  <button
                    onClick={async () => {
                      setGrade('100')
                      if (!selectedSubmission) return
                      setSaving(true)
                      try {
                        const { updateSubmission } = await import('../../../src/graphql/mutations')
                        await (client.graphql({
                          query: updateSubmission,
                          variables: { input: { id: selectedSubmission.id, grade: '100', teacherComment: comment } }
                        }) as any)
                        setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, grade: '100', teacherComment: comment } : s))
                        setSelectedSubmission(prev => prev ? { ...prev, grade: '100' } : prev)
                        setSaved(true)
                        setTimeout(() => {
                          setSelectedSubmission(null)
                          setSaved(false)
                        }, 1500)
                      } catch (err) { console.error(err) }
                      finally { setSaving(false) }
                    }}
                    disabled={saving}
                    style={{ marginTop: '6px', background: 'none', border: 'none', color: '#15803d', padding: '0', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', opacity: saving ? 0.5 : 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Quick-grade 100
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Comments for student</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Great work! On problem 3, remember to..." rows={12}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', lineHeight: '1.5' }} />
                </div>
              </div>

              {selectedSubmission.status === 'returned' ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', color: '#92400e', flex: 1 }}>
                    ↩ This submission was sent back to the student for revision.
                  </span>
                  <button onClick={pullBackReturn}
                    style={{ background: 'white', border: '1px solid #f59e0b', color: '#d97706', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    ✕ Pull Back
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={saveGrade} disabled={saving}
                    style={{ background: saving ? 'var(--gray-light)' : 'var(--plum)', color: saving ? 'var(--gray-mid)' : 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    {saving ? 'Saving...' : 'Save Grade'}
                  </button>
                  {selectedSubmission.grade && (
                    <button onClick={clearGrade} disabled={clearingGrade}
                      style={{ background: 'transparent', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                      {clearingGrade ? 'Clearing...' : 'Clear Grade'}
                    </button>
                  )}
                  <button
                    onClick={() => { setShowReturnForm(v => !v); setReturned(false) }}
                    style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#d97706', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    ↩ Return to Student
                  </button>
                  {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>✓ Grade saved!</span>}
                  {gradeCleared && <span style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Grade cleared</span>}
                  {returned && <span style={{ color: '#d97706', fontSize: '14px' }}>↩ Sent back to student</span>}
                </div>
              )}

              {showReturnForm && (
                <div style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedSubmission.grade && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span>
                      <span>This submission has a grade of <strong>{selectedSubmission.grade}</strong>. Sending it back will remove the grade.</span>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: '6px' }}>
                      Reason for returning <span style={{ color: '#d97706' }}>*</span> (student will see this)
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      placeholder="e.g. Please redo problems 3 and 4 — show your work for each step."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'white', color: '#1a1a1a', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: '6px' }}>
                      New due date <span style={{ color: '#a16207', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={returnDueDate}
                      onChange={e => setReturnDueDate(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'white', color: '#1a1a1a', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={returnToStudent}
                      disabled={returning || !returnReason.trim()}
                      style={{ background: returning || !returnReason.trim() ? '#e5e7eb' : '#f59e0b', color: returning || !returnReason.trim() ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: returning || !returnReason.trim() ? 'not-allowed' : 'pointer' }}>
                      {returning ? 'Sending...' : 'Send Back'}
                    </button>
                    <button onClick={() => { setShowReturnForm(false); setReturnReason(''); setReturnDueDate('') }}
                      style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#92400e', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Select a submission from the left to grade it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GradingPage() {
  return (
    <Suspense fallback={null}>
      <GradingPageInner />
    </Suspense>
  )
}
