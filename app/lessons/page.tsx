'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useTheme } from '../ThemeProvider'
import { generateClient } from 'aws-amplify/api'
import MathRenderer from '../components/MathRenderer'
import MathInput from '../components/MathInput'

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

const client = generateClient()

const getStudentNameQuery = /* GraphQL */`
  query GetStudentName($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items { firstName lastName preferredName }
    }
  }
`

const getWeeklyPlanItemQuery = /* GraphQL */`
  query GetWeeklyPlanItem($id: ID!) {
    getWeeklyPlanItem(id: $id) {
      id
      dayOfWeek
      dueTime
      lessonTemplateId
      weeklyPlan {
        weekStartDate
        course {
          id
          title
        }
      }
      lesson {
        id
        title
        videoUrl
        instructions
        order
      }
    }
  }
`

const getLessonTemplateQuery = /* GraphQL */`
  query GetLessonTemplate($id: ID!) {
    getLessonTemplate(id: $id) {
      id
      title
      assignmentType
      lessonNumber
      questions {
        items {
          id
          order
          questionText
          questionType
          choices
          correctAnswer
        }
      }
    }
  }
`

const createVideoWatchMutation = /* GraphQL */`
  mutation CreateVideoWatch($input: CreateVideoWatchInput!) {
    createVideoWatch(input: $input) { id }
  }
`
const updateVideoWatchMutation = /* GraphQL */`
  mutation UpdateVideoWatch($input: UpdateVideoWatchInput!) {
    updateVideoWatch(input: $input) { id }
  }
`
const findVideoWatchQuery = /* GraphQL */`
  query ListVideoWatches($filter: ModelVideoWatchFilterInput) {
    listVideoWatches(filter: $filter, limit: 1) {
      items { id watchedSeconds percentWatched completed }
    }
  }
`

const findSubmissionsQuery = /* GraphQL */`
  query FindSubmissions($studentId: String!) {
    listSubmissions(filter: { studentId: { eq: $studentId } }, limit: 100) {
      items { id content status returnReason answers }
    }
  }
`

type WeeklyPlanItemData = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  lessonTemplateId: string | null
  weeklyPlan?: {
    weekStartDate?: string | null
    course?: {
      id: string
      title: string
    } | null
  } | null
  lesson?: {
    id: string
    title: string
    videoUrl: string | null
    instructions: string | null
    order: number | null
  } | null
}

type AssignmentQuestion = {
  id: string
  order: number
  questionText: string
  questionType: string
  choices: string | null
  correctAnswer: string | null
}

type LessonTemplateData = {
  id: string
  title: string
  assignmentType: string | null
  lessonNumber: number | null
  questions: { items: AssignmentQuestion[] }
}

type UploadedFile = {
  uid: string
  name: string
  key: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

function LessonPageInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [planItem, setPlanItem] = useState<WeeklyPlanItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lessonTemplate, setLessonTemplate] = useState<LessonTemplateData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [studentName, setStudentName] = useState('')

  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)
  const [isReturned, setIsReturned] = useState(false)
  const [returnedReason, setReturnedReason] = useState('')
  const [submitWarnings, setSubmitWarnings] = useState<string[]>([])
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  // Video tracking refs — no state, no UI, invisible to student
  const videoRef = useRef<HTMLVideoElement>(null)
  const watchIdRef = useRef<string | null>(null)
  const watchedSecondsRef = useRef<number>(0)
  // Floor prevents percentage going backwards when a returned assignment is resubmitted —
  // initialised from the existing VideoWatch record so we never report less than was already saved
  const floorWatchedRef = useRef<number>(0)
  // Guard: don't create a new VideoWatch record until we've confirmed no existing one.
  // Without this, the interval fires immediately on mount (lastSaveTimeRef starts at 0)
  // and creates a duplicate 0%-watched record before the existing record query returns.
  const watchQueryDoneRef = useRef<boolean>(false)
  const lastSaveTimeRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)
  const lastCurrentTimeRef = useRef<number>(0)
  const lastPosSaveRef = useRef<number>(Date.now())
  // Stable refs so the interval can always read the latest planItem/user without closure issues
  const planItemRef = useRef(planItem)
  const userRef = useRef(user)

  // Resume state
  const [resumePosition, setResumePosition] = useState<number | null>(null)
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  const itemId = searchParams.get('id')

  // Derived early so useEffects below can reference it without TS "used before declaration" error
  const lesson = planItem?.lesson
  const course = planItem?.weeklyPlan?.course
  const videoSrc = lesson?.videoUrl
    ? lesson.videoUrl.startsWith('http') ? lesson.videoUrl : `${CLOUDFRONT_URL}/${lesson.videoUrl}`
    : null

  // Keep stable refs in sync so the interval can always read current values
  planItemRef.current = planItem
  userRef.current = user

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!itemId) {
      setLoading(false)
      return
    }
    async function fetchItem() {
      try {
        const result = await (client.graphql({
          query: getWeeklyPlanItemQuery,
          variables: { id: itemId }
        }) as any)
        const item = result.data.getWeeklyPlanItem as WeeklyPlanItemData
        setPlanItem(item)
        if (item.lessonTemplateId) {
          try {
            const tplResult = await (client.graphql({
              query: getLessonTemplateQuery,
              variables: { id: item.lessonTemplateId }
            }) as any)
            const tpl = tplResult.data.getLessonTemplate as LessonTemplateData
            if (tpl) {
              tpl.questions.items.sort((a, b) => a.order - b.order)
              setLessonTemplate(tpl)
            }
          } catch (err) {
            console.error('Error fetching lesson template:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching lesson:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [itemId])

  // Fetch student name separately — needs user to be ready
  useEffect(() => {
    const userId = user?.userId || user?.username || ''
    if (!userId) return
    async function fetchName() {
      try {
        const res = await (client.graphql({ query: getStudentNameQuery, variables: { userId } }) as any)
        const p = res.data.listStudentProfiles.items?.[0]
        if (p) setStudentName((p.preferredName || p.firstName) + ' ' + p.lastName)
      } catch { /* non-critical */ }
    }
    fetchName()
  }, [user?.userId, user?.username])

  // Check for existing / returned submission when lesson loads
  useEffect(() => {
    const studentId = user?.signInDetails?.loginId || user?.userId || user?.username || ''
    const lessonId = planItem?.lesson?.id
    if (!studentId || !lessonId) return

    async function checkExistingSubmission() {
      try {
        const res = await (client.graphql({
          query: findSubmissionsQuery,
          variables: { studentId }
        }) as any)
        const items = res.data.listSubmissions.items as any[]
        const existing = items.find(s => {
          try {
            const c = JSON.parse(s.content || '{}')
            return c.lessonId === lessonId
          } catch { return false }
        })
        if (!existing) return
        setExistingSubmissionId(existing.id)
        if (existing.status === 'returned') {
          setIsReturned(true)
          setReturnedReason(existing.returnReason || '')
          setSubmitted(false)
          try {
            const c = JSON.parse(existing.content || '{}')
            if (c.answers) setAnswers(c.answers)
            if (c.notes) setNotes(c.notes)
            if (c.files?.length) {
              setFiles(c.files.map((key: string) => ({
                uid: `restored-${key}`,
                name: key.split('/').pop() || key,
                key,
                status: 'done' as const,
                progress: 100
              })))
            }
          } catch { /* skip */ }
        } else {
          setSubmitted(true)
        }
      } catch { /* non-critical */ }
    }
    checkExistingSubmission()
  }, [planItem?.lesson?.id, user?.userId, user?.username])

  // ── Video watch tracking ──────────────────────────────────────────────────

  // Position key uses itemId from URL — always available, no async dependency
  const videoPosKey = itemId ? `vpos_${itemId}` : null

  function saveVideoPosition(time: number) {
    if (!videoPosKey || time < 5) return
    try { localStorage.setItem(videoPosKey, String(Math.floor(time))) } catch { /* ignore */ }
  }

  function clearVideoPosition() {
    if (!videoPosKey) return
    try { localStorage.removeItem(videoPosKey) } catch { /* ignore */ }
  }

  // Check for a saved resume position immediately on mount (itemId is in URL, no loading needed)
  useEffect(() => {
    if (!videoPosKey) return
    try {
      const saved = localStorage.getItem(videoPosKey)
      if (saved) {
        const pos = parseFloat(saved)
        if (pos > 10) {
          setResumePosition(pos)
          setShowResumeBanner(true)
        }
      }
    } catch { /* ignore */ }
  }, [videoPosKey])

  // Interval-based save every 3 seconds — reads videoRef directly, bypasses event listener timing issues
  useEffect(() => {
    if (!videoPosKey) return
    const id = setInterval(() => {
      const video = videoRef.current
      if (!video) return
      const pos = video.currentTime

      // 1. Save position to localStorage (resume feature)
      if (pos > 5) {
        try { localStorage.setItem(videoPosKey, String(Math.floor(pos))) } catch { /* ignore */ }
      }

      // 2. Track watched seconds (delta, only while playing)
      if (!video.paused && !video.ended) {
        const prev = lastCurrentTimeRef.current
        const delta = pos - prev
        if (delta > 0 && delta < 6) watchedSecondsRef.current += delta
        lastCurrentTimeRef.current = pos
      }

      // 3. Save watch progress to AppSync every ~10s of real time
      const now = Date.now()
      if (now - lastSaveTimeRef.current < 10_000) return
      const p = planItemRef.current
      const u = userRef.current
      const studentId = u?.signInDetails?.loginId || u?.userId || u?.username || ''
      const lessonId = p?.lesson?.id
      if (!studentId || !lessonId) return
      lastSaveTimeRef.current = now
      const duration = isFinite(video.duration) ? video.duration : 0
      const watched = Math.max(watchedSecondsRef.current, floorWatchedRef.current)
      // Ratchet floor up so it never decreases within this session either
      if (watched > floorWatchedRef.current) floorWatchedRef.current = watched
      const percent = duration > 0 ? Math.min(100, (watched / duration) * 100) : 0
      const payload = {
        studentId,
        lessonId,
        weeklyPlanItemId: itemId ?? undefined,
        watchedSeconds: Math.round(watched * 10) / 10,
        durationSeconds: duration > 0 ? Math.round(duration * 10) / 10 : undefined,
        percentWatched: Math.round(percent * 10) / 10,
        completed: percent >= 90,
        lastWatchedAt: new Date().toISOString(),
      }
      if (watchIdRef.current) {
        ;(client.graphql({ query: updateVideoWatchMutation, variables: { input: { id: watchIdRef.current, ...payload } } }) as any)
          .catch((e: unknown) => console.error('[VideoWatch] update failed:', e))
      } else if (watchQueryDoneRef.current) {
        // Only create if we've confirmed no existing record exists (avoids 0% duplicate on resume)
        ;(client.graphql({ query: createVideoWatchMutation, variables: { input: payload } }) as any)
          .then((res: any) => { watchIdRef.current = res.data?.createVideoWatch?.id ?? null })
          .catch((e: unknown) => console.error('[VideoWatch] create failed:', e))
      }
    }, 3000)
    return () => clearInterval(id)
  }, [videoPosKey, itemId])

  // Save position on unmount as a final catch-all
  useEffect(() => {
    return () => {
      const pos = lastCurrentTimeRef.current
      if (videoPosKey && pos > 5) {
        try { localStorage.setItem(videoPosKey, String(Math.floor(pos))) } catch { /* ignore */ }
      }
    }
  }, [videoPosKey])

  // Load any existing watch record on mount (resume support)
  useEffect(() => {
    const studentId = user?.signInDetails?.loginId || user?.userId || user?.username || ''
    const lessonId = planItem?.lesson?.id
    if (!studentId || !lessonId) return
    ;(client.graphql({
      query: findVideoWatchQuery,
      variables: { filter: { studentId: { eq: studentId }, lessonId: { eq: lessonId } } }
    }) as any).then((res: any) => {
      const existing = res.data?.listVideoWatches?.items?.[0]
      if (existing) {
        watchIdRef.current = existing.id
        const savedSeconds = existing.watchedSeconds ?? 0
        watchedSecondsRef.current = savedSeconds
        floorWatchedRef.current = savedSeconds
      }
      // Mark query done — interval may now create new records if no existing one was found
      watchQueryDoneRef.current = true
    }).catch(() => {
      // Still mark done on error so watch tracking isn't blocked indefinitely
      watchQueryDoneRef.current = true
    })
  }, [user?.userId, user?.username, planItem?.lesson?.id])

  function saveWatchProgress(video: HTMLVideoElement, force = false) {
    const now = Date.now()
    if (!force && now - lastSaveTimeRef.current < 10_000) return
    lastSaveTimeRef.current = now
    const studentId = user?.signInDetails?.loginId || user?.userId || user?.username || ''
    const lessonId = planItem?.lesson?.id
    if (!studentId || !lessonId) return
    const duration = isFinite(video.duration) ? video.duration : 0
    const watched = Math.max(watchedSecondsRef.current, floorWatchedRef.current)
    if (watched > floorWatchedRef.current) floorWatchedRef.current = watched
    const percent = duration > 0 ? Math.min(100, (watched / duration) * 100) : 0
    const payload = {
      studentId,
      lessonId,
      weeklyPlanItemId: itemId ?? undefined,
      watchedSeconds: Math.round(watched * 10) / 10,
      durationSeconds: duration > 0 ? Math.round(duration * 10) / 10 : undefined,
      percentWatched: Math.round(percent * 10) / 10,
      completed: percent >= 90,
      lastWatchedAt: new Date().toISOString(),
    }
    if (watchIdRef.current) {
      ;(client.graphql({ query: updateVideoWatchMutation, variables: { input: { id: watchIdRef.current, ...payload } } }) as any)
        .catch((e: unknown) => console.error('[VideoWatch] update failed:', e))
    } else if (watchQueryDoneRef.current) {
      ;(client.graphql({ query: createVideoWatchMutation, variables: { input: payload } }) as any)
        .then((res: any) => { watchIdRef.current = res.data?.createVideoWatch?.id ?? null })
        .catch((e: unknown) => console.error('[VideoWatch] create failed:', e))
    }
  }

  // Attach/detach video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return
    function onPlay() {
      isPlayingRef.current = true
      lastCurrentTimeRef.current = video!.currentTime
    }
    function onPause() {
      isPlayingRef.current = false
      lastCurrentTimeRef.current = video!.currentTime
      saveWatchProgress(video!, true)
      saveVideoPosition(video!.currentTime)
    }
    function onEnded() {
      isPlayingRef.current = false
      const remaining = video!.duration - lastCurrentTimeRef.current
      if (remaining > 0 && remaining < 10) watchedSecondsRef.current += remaining
      saveWatchProgress(video!, true)
      clearVideoPosition()   // finished — no need to resume
    }
    function onTimeUpdate() {
      if (!isPlayingRef.current) return
      const current = video!.currentTime
      const delta = current - lastCurrentTimeRef.current
      if (delta > 0 && delta < 5) watchedSecondsRef.current += delta
      lastCurrentTimeRef.current = current
      saveWatchProgress(video!)
      // Save position to localStorage every 15 seconds
      const now = Date.now()
      if (now - lastPosSaveRef.current > 15_000) {
        lastPosSaveRef.current = now
        saveVideoPosition(current)
      }
    }
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [videoSrc, planItem?.lesson?.id, user?.userId, user?.username])

  // ─────────────────────────────────────────────────────────────────────────

  async function uploadFile(file: File) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setFiles(prev => [...prev, { uid, name: file.name, key: '', status: 'uploading', progress: 0 }])
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', user?.signInDetails?.loginId || user?.userId || 'unknown')
      formData.append('lessonId', planItem?.lesson?.id || itemId || 'unknown')
      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { key } = await res.json()
      setFiles(prev => prev.map(f => f.uid === uid ? { ...f, key, status: 'done', progress: 100 } : f))
    } catch (err) {
      console.error(err)
      setFiles(prev => prev.map(f => f.uid === uid ? { ...f, status: 'error' } : f))
    }
  }


  function handleSubmit() {
    const assignmentType = lessonTemplate?.assignmentType || 'upload'
    const needsUpload = assignmentType === 'upload' || assignmentType === 'both'
    const needsAnswers = assignmentType === 'questions' || assignmentType === 'both'
    const stillUploading = files.some(f => f.status === 'uploading')

    if (stillUploading) {
      setError('Please wait for all files to finish uploading.')
      return
    }
    setError('')

    // Build warnings (soft — never block)
    const allQuestions = (lessonTemplate?.questions?.items ?? []).filter(q => q.questionType !== 'section_header')
    const hasShowWorkQs = allQuestions.some(q => q.questionType === 'show_work')
    const digitalQs = allQuestions.filter(q => q.questionType !== 'show_work')
    const answeredCount = digitalQs.filter(q => answers[q.id] && answers[q.id].trim() !== '').length
    const doneFiles = files.filter(f => f.status === 'done')

    const warnings: string[] = []

    // No upload when show_work or upload-required
    if ((hasShowWorkQs || needsUpload) && doneFiles.length === 0) {
      warnings.push("📎 You haven't uploaded your show-work worksheet yet.")
    }

    // Answered none of the digital questions
    if (needsAnswers && digitalQs.length > 0 && answeredCount === 0) {
      warnings.push("✏️ You haven't answered any of the digital questions.")
    } else if (needsAnswers && digitalQs.length > 0 && answeredCount < digitalQs.length) {
      // Answered some but not all
      warnings.push(`✏️ You've answered ${answeredCount} of ${digitalQs.length} questions — ${digitalQs.length - answeredCount} still blank.`)
    }

    if (warnings.length > 0) {
      setSubmitWarnings(warnings)
      setShowSubmitConfirm(true)
      return
    }

    doSubmit()
  }

  async function doSubmit() {
    setShowSubmitConfirm(false)
    setError('')
    setSubmitting(true)
    try {
      // Compute due datetime so teacher can flag late submissions.
      // dueTime is stored as "YYYY-MM-DDTHH:mm" — use the embedded date directly
      // (same logic as getDueStatus in dashboard) to avoid dayOfWeek mismatch bugs.
      let dueDateTime: string | null = null
      if (planItem?.dueTime) {
        try {
          const raw = planItem.dueTime
          let dt: Date
          if (raw.includes('T') && raw.length > 10) {
            // Full date+time already present — parse as local time
            dt = new Date(raw)
          } else {
            // Time-only fallback: derive date from weekStartDate + dayOfWeek
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            const offset = planItem.dayOfWeek ? days.indexOf(planItem.dayOfWeek) : -1
            const base = new Date((planItem.weeklyPlan?.weekStartDate || '') + 'T00:00:00')
            if (offset >= 0) base.setDate(base.getDate() + offset)
            const y = base.getFullYear()
            const mo = String(base.getMonth() + 1).padStart(2, '0')
            const d = String(base.getDate()).padStart(2, '0')
            dt = new Date(`${y}-${mo}-${d}T${raw}`)
          }
          if (!isNaN(dt.getTime())) dueDateTime = dt.toISOString()
        } catch { /* skip */ }
      }
      const contentObject = {
        notes,
        files: files.filter(f => f.status === 'done').map(f => f.key),
        lessonId: planItem?.lesson?.id || '',
        lessonTitle: planItem?.lesson?.title || '',
        courseId: planItem?.weeklyPlan?.course?.id || '',
        courseTitle: planItem?.weeklyPlan?.course?.title || '',
        weeklyPlanItemId: itemId || '',
        dueDateTime,
        lessonTemplateId: lessonTemplate?.id || null,
        answers,
      }
      if (existingSubmissionId) {
        const { updateSubmission } = await import('../../src/graphql/mutations')
        await (client.graphql({
          query: updateSubmission,
          variables: {
            input: {
              id: existingSubmissionId,
              content: JSON.stringify(contentObject),
              status: 'submitted',
              returnReason: null,
              submittedAt: new Date().toISOString(),
            } as any
          }
        }) as any)
        setSubmitted(true)
        setIsReturned(false)
      } else {
        const { createSubmission } = await import('../../src/graphql/mutations')
        await (client.graphql({
          query: createSubmission,
          variables: {
            input: {
              studentId: user?.signInDetails?.loginId || user?.userId || 'unknown',
              content: JSON.stringify(contentObject),
              submittedAt: new Date().toISOString(),
            }
          }
        }) as any)
        setSubmitted(true)
      }
    } catch (err) {
      console.error(err)
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function printShowWorkSheet() {
    const allQuestions = lessonTemplate?.questions?.items ?? []
    if (allQuestions.length === 0) return
    const showWorkQuestions = allQuestions.filter(q => q.questionType === 'show_work')
    if (showWorkQuestions.length === 0) return

    const { default: katex } = await import('katex')

    function renderMath(text: string): string {
      const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g)
      return parts.map(part => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false })
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: false, throwOnError: false })
        }
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }).join('')
    }

    const title = lessonTemplate?.title || planItem?.lesson?.title || 'Assignment'
    const lessonNum = lessonTemplate?.lessonNumber ?? null
    const courseName = planItem?.weeklyPlan?.course?.title || ''
    const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Sort all questions, assign sequential numbers (skipping headers),
    // then only render the show_work ones — preserving the original question numbers
    // so students can cross-reference with their digital answers.
    const sorted = [...allQuestions].sort((a, b) => a.order - b.order)
    let qCounter = 0
    const numberedItems = sorted.map(q => {
      if (q.questionType === 'section_header') return { ...q, qNum: 0 }
      qCounter++
      return { ...q, qNum: qCounter }
    })

    // Determine which section headers immediately precede at least one show_work question
    const sectionsWithShowWork = new Set<string>()
    for (let i = 0; i < numberedItems.length; i++) {
      if (numberedItems[i].questionType === 'section_header') {
        for (let j = i + 1; j < numberedItems.length; j++) {
          if (numberedItems[j].questionType === 'section_header') break
          if (numberedItems[j].questionType === 'show_work') {
            sectionsWithShowWork.add(numberedItems[i].id)
            break
          }
        }
      }
    }

    const questionsHTML = numberedItems
      .filter(q => q.questionType === 'section_header' ? sectionsWithShowWork.has(q.id) : q.questionType === 'show_work')
      .map(q => {
        if (q.questionType === 'section_header') {
          return `<div class="section-header">${renderMath(q.questionText)}</div>`
        }
        const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
        const qNumLabel = bookNumMatch ? bookNumMatch[1] : `${q.qNum}.`
        const qBody = bookNumMatch ? renderMath(bookNumMatch[2]) : renderMath(q.questionText)
        return `<div class="question">
          <div class="question-text">
            <span class="qnum">${qNumLabel}</span>
            <span>${qBody}</span>
          </div>
          <div class="work-box"></div>
        </div>`
      }).join('')

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Show Work — ${title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        *{box-sizing:border-box}
        body{font-family:'Times New Roman',serif;max-width:720px;margin:0 auto;padding:40px;color:#111;font-size:15px}
        .header{text-align:center;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #333}
        .header h1{font-size:22px;margin:0 0 2px}
        .header .lessonnum{font-size:13px;color:#777;margin-bottom:2px}
        .header .course{font-size:13px;color:#555;margin-bottom:6px}
        .header .instruction{font-size:12px;color:#666;font-style:italic;margin-bottom:10px}
        .header .fields{display:flex;justify-content:space-between;margin-top:10px;gap:24px}
        .header .field{flex:1;font-size:13px;color:#333;padding-bottom:3px;border-bottom:1px solid #888}
        .question{margin-bottom:14px;page-break-inside:avoid}
        .question-text{display:flex;gap:10px;margin-bottom:6px;line-height:1.4}
        .qnum{font-weight:bold;min-width:22px;flex-shrink:0}
        .work-box{border:1px solid #bbb;border-radius:4px;height:110px;margin-left:22px}
        .section-header{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#5b2d8e;border-bottom:2px solid #d8b4fe;padding-bottom:5px;margin:24px 0 14px;page-break-after:avoid}
        @media print{body{padding:20px}@page{margin:.75in}}
      </style>
    </head><body onload="setTimeout(function(){window.print()},1200)">
      <div class="header">
        ${lessonNum != null ? `<div class="lessonnum">Lesson ${lessonNum}</div>` : ''}
        <h1>${title} — Show Work</h1>
        ${courseName ? `<div class="course">${courseName}</div>` : ''}
        <div class="instruction">Complete your digital answers online first, then show your work for these problems below.</div>
        <div class="fields">
          <div class="field">Name: ${studentName || '___________________________'}</div>
          <div class="field">Date: ${printDate}</div>
        </div>
      </div>
      ${questionsHTML}
    </body></html>`

    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(html)
    pw.document.close()
  }

  function formatTimestamp(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function handleResume() {
    const video = videoRef.current
    if (!video || resumePosition === null) return
    video.currentTime = resumePosition
    setShowResumeBanner(false)
    video.play().catch(() => {})
  }

  function handleStartOver() {
    clearVideoPosition()
    setResumePosition(null)
    setShowResumeBanner(false)
    watchedSecondsRef.current = 0
    lastCurrentTimeRef.current = 0
  }

  function formatDueTime(dueTime: string | null | undefined): string {
    if (!dueTime) return '5:00 PM'
    try {
      const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
      const [hours, minutes] = timePart.split(':').map(Number)
      const d = new Date()
      d.setHours(hours, minutes)
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch { return dueTime }
  }

  function formatDueDate(dueTime: string | null | undefined): string {
    if (!dueTime) return ''
    try {
      const datePart = dueTime.includes('T') ? dueTime.split('T')[0] : ''
      if (!datePart) return ''
      const d = new Date(datePart + 'T00:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    } catch { return '' }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            ← Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading lesson...</p>
        ) : !itemId || !planItem ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--foreground)', marginBottom: '12px' }}>No lesson selected</p>
            <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>Please go back to the dashboard and select a lesson.</p>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--plum)', marginBottom: '8px' }}>
              {course?.title || 'Math with Melinda'}
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', marginBottom: '8px' }}>
              {lesson?.order ? `Lesson ${lesson.order} — ` : ''}{lesson?.title || 'Lesson'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '32px' }}>
              {planItem.dueTime
                ? `Due ${formatDueDate(planItem.dueTime)} by ${formatDueTime(planItem.dueTime)}`
                : planItem.dayOfWeek}
            </p>

            {videoSrc && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ background: '#000', borderRadius: showResumeBanner ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)', overflow: 'hidden', aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    onContextMenu={e => e.preventDefault()}
                    style={{ width: '100%', height: '100%' }}
                    src={videoSrc}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {showResumeBanner && resumePosition !== null && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--plum)', borderRadius: '0 0 var(--radius) var(--radius)',
                    padding: '10px 16px', gap: '12px',
                  }}>
                    <span style={{ color: 'white', fontSize: '14px' }}>
                      👋 Welcome back! You left off at <strong>{formatTimestamp(resumePosition)}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={handleResume}
                        style={{ background: 'white', color: 'var(--plum)', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        ▶ Resume
                      </button>
                      <button
                        onClick={handleStartOver}
                        style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}>
                        Start over
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lesson?.instructions && (
              <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--plum)', marginBottom: '8px' }}>Instructions</h2>
                <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.7' }}>{lesson.instructions}</p>
              </div>
            )}

            {submitted ? (
              <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--plum)', marginBottom: '8px' }}>Submitted!</div>
                <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>Your work has been submitted. Melinda will review it soon.</p>
                <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--plum)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Back to Dashboard
                </button>
              </div>
            ) : (() => {
              const assignmentType = lessonTemplate?.assignmentType || 'upload'
              const questions = lessonTemplate?.questions?.items || []
              const showQuestions = (assignmentType === 'questions' || assignmentType === 'both') && questions.length > 0
              const hasShowWork = questions.some(q => q.questionType === 'show_work')
              const showUpload = assignmentType === 'upload' || assignmentType === 'both' || !lessonTemplate || hasShowWork

              return (
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px' }}>
                  {isReturned && (
                    <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: returnedReason ? '8px' : '0' }}>
                        <span style={{ fontSize: '18px' }}>↩</span>
                        <span style={{ fontWeight: 600, color: '#92400e', fontSize: '15px' }}>Your submission was returned for revision</span>
                      </div>
                      {returnedReason && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
                          <strong>Melinda&apos;s note:</strong> {returnedReason}
                        </p>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: 0 }}>
                      {showQuestions ? 'Assignment' : 'Submit Your Work'}
                    </h2>
                    {hasShowWork && (
                      <button
                        type="button"
                        onClick={printShowWorkSheet}
                        style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print Show Work Sheet
                      </button>
                    )}
                  </div>

                  {showQuestions && hasShowWork && (
                    <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '14px 18px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>How to complete this assignment</div>
                      {[
                        'Watch the video above',
                        'Answer the questions below digitally',
                        'Click "Print Show Work Sheet" to print just the problems that need work shown — complete on paper, take a photo, and upload below',
                      ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                          <span style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.5 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showQuestions && (
                    <div style={{ marginBottom: '28px' }}>
                      {(() => {
                        let qNum = 0
                        return questions.map((q, idx) => {
                          const isHeader = q.questionType === 'section_header'
                          if (!isHeader) qNum++
                          const displayNum = qNum
                          const bookNumMatch = !isHeader && q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
                          const hasBookNum = !!bookNumMatch
                          if (isHeader) {
                            return (
                              <div key={q.id} style={{ marginTop: idx === 0 ? 0 : '28px', marginBottom: '16px' }}>
                                <div style={{
                                  fontSize: '13px', fontWeight: 700, color: 'var(--plum)',
                                  textTransform: 'uppercase', letterSpacing: '0.8px',
                                  borderBottom: '2px solid var(--plum-mid)',
                                  paddingBottom: '6px', paddingTop: '4px'
                                }}>
                                  {q.questionText}
                                </div>
                              </div>
                            )
                          }
                          return (
                          <div key={q.id} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: idx < questions.length - 1 ? '1px solid var(--gray-light)' : 'none' }}>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '16px', minWidth: '28px', flexShrink: 0 }}>
                              {bookNumMatch ? bookNumMatch[1] : `${displayNum}.`}
                            </span>
                            <div style={{ fontSize: '15px', color: 'var(--foreground)', lineHeight: '1.6', flex: 1 }}>
                              <MathRenderer text={bookNumMatch ? bookNumMatch[2] : q.questionText} />
                            </div>
                          </div>
                          {q.questionType === 'number' && (
                            <MathInput
                              value={answers[q.id] || ''}
                              onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                              placeholder="Your answer…"
                            />
                          )}
                          {q.questionType === 'short_text' && (
                            <MathInput
                              value={answers[q.id] || ''}
                              onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                              multiline
                              placeholder="Your answer…"
                            />
                          )}
                          {q.questionType === 'multiple_choice' && q.choices && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {q.choices.split('\n').filter(Boolean).map((choice, ci) => (
                                <label key={ci} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)' }}>
                                  <input type="radio" name={`q-${q.id}`} value={choice} checked={answers[q.id] === choice} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice }))} />
                                  <MathRenderer text={choice} />
                                </label>
                              ))}
                            </div>
                          )}
                          {q.questionType === 'multiple_choice_multi' && q.choices && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginBottom: '4px' }}>Select all that apply</div>
                              {q.choices.split('\n').filter(Boolean).map((choice, ci) => {
                                const selected: string[] = answers[q.id] ? answers[q.id].split('||') : []
                                const isChecked = selected.includes(choice)
                                return (
                                  <label key={ci} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)' }}>
                                    <input
                                      type="checkbox"
                                      value={choice}
                                      checked={isChecked}
                                      onChange={() => {
                                        const next = isChecked ? selected.filter(s => s !== choice) : [...selected, choice]
                                        setAnswers(prev => ({ ...prev, [q.id]: next.join('||') }))
                                      }}
                                    />
                                    <MathRenderer text={choice} />
                                  </label>
                                )
                              })}
                            </div>
                          )}
                          {q.questionType === 'show_work' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '6px', padding: '5px 10px', marginTop: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                              <span style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 500 }}>Show work on printed sheet</span>
                            </div>
                          )}
                        </div>
                          )
                        })
                      })()}
                    </div>
                  )}

                  {showUpload && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>
                        {hasShowWork ? 'Upload your show-work sheet' : 'Photos of your work'}
                      </label>
                      {hasShowWork && (
                        <p style={{ fontSize: '12px', color: 'var(--gray-mid)', margin: '0 0 8px' }}>
                          Print the show-work sheet above, complete the problems on paper, then take a photo and upload it here.
                        </p>
                      )}
                      <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(uploadFile) }}
                        style={{ border: '2px dashed var(--gray-light)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.pdf,application/pdf" multiple style={{ display: 'none' }}
                          onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadFile) }} />
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
                        <div style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Click or drag files here</div>
                        <div style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>Supports JPG, PNG, HEIC, PDF</div>
                      </div>
                      {files.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {files.map((f, i) => (
                            <div key={i} style={{ background: 'var(--gray-light)', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{f.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {f.status === 'uploading' && <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>Converting...</span>}
                                {f.status === 'done' && <span style={{ fontSize: '12px', color: 'var(--plum)', fontWeight: 500 }}>✓ Ready</span>}
                                {f.status === 'error' && <span style={{ fontSize: '12px', color: 'red' }}>Failed</span>}
                                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '16px' }}>×</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Notes for Melinda (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any questions or notes for your teacher..." rows={2}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }} />
                  </div>

                  {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                  {/* Pre-submit confirmation — shows when warnings exist */}
                  {showSubmitConfirm && (
                    <div style={{ marginBottom: '16px', background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#92400e', marginBottom: '12px' }}>
                        Wait — just checking! 👀
                      </div>
                      <ul style={{ margin: '0 0 16px', padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {submitWarnings.map((w, i) => (
                          <li key={i} style={{ fontSize: '14px', color: '#78350f', background: '#fef3c7', borderRadius: '8px', padding: '10px 14px', lineHeight: 1.5 }}>
                            {w}
                          </li>
                        ))}
                      </ul>
                      <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 16px', fontStyle: 'italic' }}>
                        Are you sure you want to submit? You can go back and fix this first.
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setShowSubmitConfirm(false)}
                          style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '2px solid var(--plum)', background: 'white', color: 'var(--plum)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          ← Go Back and Fix It
                        </button>
                        <button
                          onClick={() => doSubmit()}
                          style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: '#9ca3af', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          Submit Anyway
                        </button>
                      </div>
                    </div>
                  )}

                  {!showSubmitConfirm && (
                    <button onClick={handleSubmit} disabled={submitting}
                      style={{ background: submitting ? 'var(--gray-light)' : 'var(--plum)', color: submitting ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500, width: '100%' }}>
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  )}
                </div>
              )
            })()}
          </>
        )}
      </main>
    </div>
  )
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--gray-mid)' }}>Loading...</p></div>}>
      <LessonPageInner />
    </Suspense>
  )
}
