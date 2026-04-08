'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import MathRenderer from '../components/MathRenderer'
import MathInput from '../components/MathInput'
import StudentNav from '../components/StudentNav'
import { apiFetch } from '@/app/lib/apiFetch'
import { useRoleGuard } from '@/app/hooks/useRoleGuard'

const CLOUDFRONT_URL = 'https://dgmfzo1xk5r4e.cloudfront.net'

const client = generateClient()

const getStudentNameQuery = /* GraphQL */`
  query GetStudentName($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 500) {
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
      instructions
      worksheetUrl
      questions {
        items {
          id
          order
          questionText
          questionType
          choices
          correctAnswer
          diagramKey
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
  diagramKey: string | null
}

type LessonTemplateData = {
  id: string
  title: string
  assignmentType: string | null
  lessonNumber: number | null
  instructions: string | null
  worksheetUrl: string | null
  questions: { items: AssignmentQuestion[] }
}

type UploadedFile = {
  uid: string
  name: string
  key: string
  status: 'uploading' | 'done' | 'error'
  progress: number
  previewUrl?: string   // object URL for in-browser thumbnail (standard images only)
  warning?: string      // quality warning (landscape, low-res, etc.)
}

// Extract page index from order field: order = pageIndex * 1000 + sequence
function pageIndexFromOrder(order: number): number {
  return Math.floor(order / 1000)
}

function checkImageQuality(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const previewable = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
    if (!previewable) { resolve(undefined); return }
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth, h = img.naturalHeight
      if (w < 600 || h < 600) {
        resolve('Low resolution — move your camera closer so your writing is easy to read.')
      } else if (w > h * 1.15) {
        resolve('Photo is sideways (landscape) — rotate your phone upright before taking the photo.')
      } else {
        resolve(undefined)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(undefined) }
    img.src = url
  })
}

function LessonPageInner() {
  const { checking } = useRoleGuard('student')
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [showPhotoTips, setShowPhotoTips] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [planItem, setPlanItem] = useState<WeeklyPlanItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lessonTemplate, setLessonTemplate] = useState<LessonTemplateData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [studentName, setStudentName] = useState('')

  const [scanPageUrls, setScanPageUrls] = useState<string[]>([])
  const [diagramUrls, setDiagramUrls] = useState<Record<string, string>>({})  // questionId → presigned URL

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
    if (!checking && user === null) router.replace('/login')
  }, [checking, user, router])

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
              // Fetch presigned URLs for scan pages if worksheetUrl is a JSON array of S3 keys
              if (tpl.worksheetUrl?.startsWith('[')) {
                try {
                  const keys: string[] = JSON.parse(tpl.worksheetUrl)
                  const urls = await Promise.all(keys.map(async key => {
                    const r = await apiFetch('/api/view-submission', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key }),
                    })
                    const d = await r.json()
                    return d.url as string
                  }))
                  setScanPageUrls(urls.filter(Boolean))
                } catch { /* non-critical */ }
              }
              // Fetch presigned URLs for per-question cropped diagram images
              const diagramQuestions = tpl.questions.items.filter(q => q.diagramKey)
              if (diagramQuestions.length > 0) {
                try {
                  const entries = await Promise.all(diagramQuestions.map(async q => {
                    const r = await apiFetch('/api/view-submission', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: q.diagramKey }),
                    })
                    const d = await r.json()
                    return [q.id, d.url as string] as const
                  }))
                  setDiagramUrls(Object.fromEntries(entries.filter(([, url]) => url)))
                } catch { /* non-critical */ }
              }
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
    const isPreviewable = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
    const previewUrl = isPreviewable ? URL.createObjectURL(file) : undefined
    const warning = await checkImageQuality(file)
    setFiles(prev => [...prev, { uid, name: file.name, key: '', status: 'uploading', progress: 0, previewUrl, warning }])
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', user?.signInDetails?.loginId || user?.userId || 'unknown')
      formData.append('lessonId', planItem?.lesson?.id || itemId || 'unknown')
      const res = await apiFetch('/api/submit', { method: 'POST', body: formData })
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
    const needsUpload = assignmentType === 'upload' || assignmentType === 'both' || assignmentType === 'worksheet' // worksheet is legacy
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
    const aType = lessonTemplate?.assignmentType || 'upload'
    const isWorksheetType = aType === 'worksheet' || aType === 'upload'
    // For worksheet/upload type, print ALL questions (it's a paper-only assignment)
    // For digital questions or both, only print show_work questions
    const showWorkQuestions = isWorksheetType
      ? allQuestions.filter(q => q.questionType !== 'section_header')
      : allQuestions.filter(q => q.questionType === 'show_work')
    if (showWorkQuestions.length === 0) return

    // Pre-fetch per-question diagram images as base64 data URLs for embedding in print
    const diagramDataUrls: Record<string, string> = {}
    for (const q of showWorkQuestions) {
      const url = diagramUrls[q.id]
      if (!url) continue
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        diagramDataUrls[q.id] = dataUrl
      } catch { /* skip if fetch fails */ }
    }

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

    // Sort by problem number, keeping headers attached to their following questions
    const swSortKeys = new Map<string, number>()
    for (let i = showWorkQuestions.length - 1; i >= 0; i--) {
      const q = showWorkQuestions[i]
      if (q.questionType === 'section_header') {
        const nextKey = (i + 1 < showWorkQuestions.length) ? (swSortKeys.get(showWorkQuestions[i + 1].id) ?? showWorkQuestions[i + 1].order) : q.order
        swSortKeys.set(q.id, nextKey - 0.5)
      } else {
        const num = parseInt(q.questionText.match(/^(\d+)\./)?.[1] || '0')
        swSortKeys.set(q.id, num > 0 ? num : q.order + 10000)
      }
    }
    showWorkQuestions.sort((a, b) => (swSortKeys.get(a.id) ?? 0) - (swSortKeys.get(b.id) ?? 0))

    // Build question HTML — each question shows its text, diagram (if any), and work box
    const questionsHTML = showWorkQuestions.map(q => {
      const bookNumMatch = q.questionText.match(/^(\d+\.)\s/)
      const qNumLabel = bookNumMatch ? bookNumMatch[1] : `#${q.order % 1000}.`
      const qBody = renderMath(q.questionText.replace(/^\d+\.\s*/, ''))
      const diagramSrc = diagramDataUrls[q.id]
      const diagramHTML = diagramSrc
        ? `<div class="diagram"><img src="${diagramSrc}" class="diagram-img" /></div>`
        : ''
      return `<div class="work-item">
        <div class="work-label"><span class="qnum">${qNumLabel}</span> ${qBody}</div>
        ${diagramHTML}
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
        .header{text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #333}
        .header h1{font-size:22px;margin:0 0 2px}
        .header .lessonnum{font-size:13px;color:#777;margin-bottom:2px}
        .header .course{font-size:13px;color:#555;margin-bottom:6px}
        .header .instruction{font-size:12px;color:#666;font-style:italic;margin-bottom:10px}
        .header .fields{display:flex;justify-content:space-between;margin-top:10px;gap:24px}
        .header .field{flex:1;font-size:13px;color:#333;padding-bottom:3px;border-bottom:1px solid #888}
        .diagram{margin:8px 0 12px;max-width:320px}
        .diagram-img{width:100%;border:1px solid #ccc;border-radius:4px;display:block}
        .work-item{margin-bottom:18px;page-break-inside:avoid}
        .work-label{display:flex;gap:8px;align-items:baseline;margin-bottom:6px;line-height:1.4}
        .qnum{font-weight:bold;font-size:15px;min-width:22px;flex-shrink:0}
        .work-box{border:1px solid #bbb;border-radius:4px;height:120px}
        @media print{body{padding:20px}@page{margin:.6in}}
      </style>
    </head><body onload="setTimeout(function(){window.print()},1200)">
      <div class="header">
        ${lessonNum != null ? `<div class="lessonnum">Lesson ${lessonNum}</div>` : ''}
        <h1>${title} — Show Work</h1>
        ${courseName ? `<div class="course">${courseName}</div>` : ''}
        <div class="instruction">${Object.keys(diagramDataUrls).length > 0
          ? 'Refer to the diagrams shown with each problem. Show your work in the boxes provided.'
          : 'Complete your digital answers online first, then show your work for these problems below.'}</div>
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
      <StudentNav />

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

            {(lessonTemplate?.instructions || lesson?.instructions) && (
              <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--plum)', marginBottom: '8px' }}>Instructions</h2>
                <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.7' }}>{lessonTemplate?.instructions || lesson?.instructions}</p>
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
              const isWorksheet = assignmentType === 'worksheet' || assignmentType === 'upload'
              // Show questions section if there are questions — regardless of assignmentType
              const showQuestions = questions.length > 0
              const hasShowWork = questions.some(q => q.questionType === 'show_work')
              // Show upload for upload, both, worksheet — or any lesson with show_work questions
              const showUpload = assignmentType === 'upload' || assignmentType === 'both' || assignmentType === 'worksheet' || !lessonTemplate || hasShowWork

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
                    {(hasShowWork || isWorksheet) && (
                      <button
                        type="button"
                        onClick={printShowWorkSheet}
                        style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        {isWorksheet ? 'Print Worksheet' : 'Print Show Work'}
                      </button>
                    )}
                  </div>

                  {showQuestions && (hasShowWork || isWorksheet) && (
                    <div style={{ background: 'var(--plum-light)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '14px 18px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>How to complete this assignment</div>
                      {(isWorksheet ? [
                        'Watch the video above',
                        'Click "Print Worksheet" to print — complete all problems on paper',
                        'Take a photo of your completed work and upload below',
                      ] : [
                        'Watch the video above',
                        'Answer the questions below digitally',
                        'Click "Print Show Work" to print just the problems that need work shown — complete on paper, take a photo, and upload below',
                      ]).map((step, i) => (
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
                        // Group questions by page index for inline scan page display
                        const pageGroups = new Map<number, typeof questions>()
                        for (const q of questions) {
                          const pi = pageIndexFromOrder(q.order)
                          if (!pageGroups.has(pi)) pageGroups.set(pi, [])
                          pageGroups.get(pi)!.push(q)
                        }
                        const pageIndices = [...pageGroups.keys()].sort((a, b) => a - b)
                        let globalQNum = 0

                        return pageIndices.map(pi => {
                          const pageQs = pageGroups.get(pi)!

                          return (
                            <div key={`page-${pi}`} style={{ marginBottom: '32px' }}>

                              {/* Questions for this page */}
                              {pageQs.map((q, idx) => {
                                const isHeader = q.questionType === 'section_header'
                                if (!isHeader) globalQNum++
                                const displayNum = globalQNum
                                const bookNumMatch = !isHeader && q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)

                                if (isHeader) {
                                  return (
                                    <div key={q.id} style={{ marginTop: idx === 0 ? 0 : '28px', marginBottom: '16px' }}>
                                      <div style={{
                                        fontSize: '13px', fontWeight: 700, color: 'var(--plum)',
                                        textTransform: 'uppercase', letterSpacing: '0.8px',
                                        borderBottom: '2px solid var(--plum-mid)',
                                        paddingBottom: '6px', paddingTop: '4px'
                                      }}>
                                        <MathRenderer text={q.questionText} />
                                      </div>
                                    </div>
                                  )
                                }
                                return (
                                  <div key={q.id} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--gray-light)' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '16px', minWidth: '28px', flexShrink: 0 }}>
                                        {bookNumMatch ? bookNumMatch[1] : `${displayNum}.`}
                                      </span>
                                      <div style={{ fontSize: '15px', color: 'var(--foreground)', lineHeight: '1.6', flex: 1 }}>
                                        <MathRenderer text={bookNumMatch ? bookNumMatch[2] : q.questionText} />
                                      </div>
                                    </div>
                                    {/* Cropped diagram image for this question */}
                                    {diagramUrls[q.id] && (
                                      <div style={{ marginBottom: '14px', maxWidth: '360px' }}>
                                        <img
                                          src={diagramUrls[q.id]}
                                          alt="Diagram"
                                          style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--gray-light)', display: 'block' }}
                                        />
                                      </div>
                                    )}
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
                              })}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}

                  {showUpload && (
                    <div style={{ marginBottom: '24px' }}>
                      {/* Header row with label + photo tips toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)' }}>
                          {hasShowWork ? 'Upload your show-work sheet' : 'Photos of your work'}
                        </label>
                        <button
                          onClick={() => setShowPhotoTips(t => !t)}
                          style={{ background: 'none', border: '1px solid var(--gray-light)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--plum)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {showPhotoTips ? 'Hide tips' : 'Photo tips'}
                        </button>
                      </div>

                      {/* Collapsible photo tips panel */}
                      {showPhotoTips && (
                        <div style={{ background: 'rgba(123,79,166,0.05)', border: '1px solid var(--plum-mid)', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>📷 How to take a great photo</div>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {[
                              ['📱', 'Hold your phone upright (portrait), not sideways'],
                              ['☀️', 'Use good lighting — no shadows covering your work'],
                              ['📐', 'Lay the paper flat on a table and shoot straight down'],
                              ['🔍', 'Get close enough that all writing fills the frame'],
                              ['✅', 'Check the photo before uploading — is everything readable?'],
                            ].map(([icon, tip], i) => (
                              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4 }}>
                                <span style={{ flexShrink: 0 }}>{icon}</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {hasShowWork && (
                        <p style={{ fontSize: '12px', color: 'var(--gray-mid)', margin: '0 0 8px' }}>
                          Print the show-work sheet above, complete the problems on paper, then take a photo and upload it here.
                        </p>
                      )}

                      {/* Drop zone */}
                      <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(uploadFile) }}
                        style={{ border: '2px dashed var(--plum-mid)', borderRadius: 'var(--radius)', padding: files.length > 0 ? '16px' : '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px', background: 'rgba(123,79,166,0.03)', transition: 'background 0.15s' }}>
                        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.pdf,application/pdf" multiple style={{ display: 'none' }}
                          onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadFile) }} />
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.7 }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <div style={{ color: 'var(--plum)', fontSize: '14px', fontWeight: 600 }}>
                          {files.length > 0 ? 'Add another photo' : 'Tap to take a photo or choose a file'}
                        </div>
                        <div style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '4px' }}>JPG, PNG, HEIC, PDF</div>
                      </div>

                      {/* File previews */}
                      {files.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {files.map((f, i) => (
                            <div key={i} style={{ borderRadius: '10px', border: `1px solid ${f.warning && f.status === 'done' ? '#fde68a' : 'var(--gray-light)'}`, overflow: 'hidden', background: f.warning && f.status === 'done' ? '#fffbeb' : 'var(--gray-light)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                                {/* Thumbnail */}
                                {f.previewUrl ? (
                                  <a href={f.previewUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                                    <img src={f.previewUrl} alt={f.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-light)', display: 'block' }} />
                                  </a>
                                ) : (
                                  <div style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '6px', background: 'rgba(123,79,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  </div>
                                )}
                                {/* Name + status */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                    {f.status === 'uploading' && <span style={{ color: 'var(--gray-mid)' }}>Uploading…</span>}
                                    {f.status === 'done' && !f.warning && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Ready</span>}
                                    {f.status === 'done' && f.warning && <span style={{ color: '#92400e', fontWeight: 600 }}>✓ Uploaded</span>}
                                    {f.status === 'error' && <span style={{ color: '#dc2626', fontWeight: 600 }}>Upload failed — try again</span>}
                                  </div>
                                </div>
                                {/* Remove */}
                                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '20px', lineHeight: 1, flexShrink: 0, padding: '0 4px' }}>×</button>
                              </div>
                              {/* Quality warning stripe */}
                              {f.warning && f.status === 'done' && (
                                <div style={{ padding: '8px 12px', borderTop: '1px solid #fde68a', background: '#fef3c7', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                  <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                                  <div>
                                    <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>{f.warning}</span>
                                    <span style={{ fontSize: '12px', color: '#92400e' }}> You can still submit, but a better photo helps Melinda grade accurately.</span>
                                  </div>
                                </div>
                              )}
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
