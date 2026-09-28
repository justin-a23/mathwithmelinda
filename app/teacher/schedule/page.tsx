'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses, listStudentProfiles, listAssignmentQuestions } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { lessonDisplayTitle } from '@/app/lib/lessonTitle'
import { apiFetch } from '@/app/lib/apiFetch'
import { MATH_DELIMITER_SPLIT } from '../../components/MathRenderer'
import { checkLesson, checkWeek, lessonContentKey, type CheckLesson, type CheckQuestion, type CheckSlot, type Finding } from '@/app/lib/weekCheck'
import type { ClaudeFinding } from '@/app/lib/weekCheckCore'
import outputs from '../../../amplify_outputs.json'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }
type LessonTemplate = {
  id: string; lessonNumber: number; title: string; instructions: string | null
  worksheetUrl: string | null; videoUrl: string | null
  assignmentType: string | null
  teachingNotes: string | null
  questions?: { items: { id: string }[] } | null
}

/**
 * "Check my week": the Claude review runs in a Lambda behind a function URL
 * (outputs.custom.weekCheckUrl) because Amplify Hosting kills /api routes at
 * 30 s and Opus working a chapter test takes longer. The /api route is the
 * local-dev fallback. apiFetch attaches the teacher's Bearer token either way.
 */
const WEEK_CHECK_ENDPOINT: string =
  (outputs as { custom?: { weekCheckUrl?: string } }).custom?.weekCheckUrl || '/api/week-check'
const WEEK_CHECK_CACHE_PREFIX = 'mwm-week-check:v1:'

type LessonReport = {
  templateId: string
  title: string
  slotLabel: string
  checks: Finding[]
  claude: 'pending' | 'running' | 'done' | 'error'
  claudeFindings: ClaudeFinding[]
  claudeSummary: string
  claudeError: string
  fromCache: boolean
}
type WeekReport = { weekFindings: Finding[]; lessons: LessonReport[]; finished: boolean }

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Local query instead of the generated one: the mode chip under each day needs
// the question count, which the generated listLessonTemplates doesn't select.
const listLessonTemplatesForSchedule = /* GraphQL */ `
  query ListLessonTemplatesForSchedule($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id lessonNumber title instructions worksheetUrl videoUrl assignmentType teachingNotes
        questions { items { id } }
      }
      nextToken
    }
  }
`
type StudentProfile = { id: string; userId: string; email: string; firstName: string; lastName: string; courseId: string | null }

type DayPlan = {
  day: string
  lessonTemplateId: string
  lessonNumber: string
  lessonTitle: string
  instructions: string
  videoUrl: string
  dueDate: string
  dueTime: string
  isPublished: boolean
  isInClass: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function getDefaultDueDate(day: string, weekStartDate: string): string {
  if (!weekStartDate) return ''
  const start = new Date(weekStartDate + 'T00:00:00')
  const offsets: Record<string, number> = { Monday: 1, Tuesday: 1, Wednesday: 3, Thursday: 3, Friday: 4 }
  const offset = offsets[day] ?? 0
  const due = new Date(start)
  due.setDate(start.getDate() + offset)
  return due.toISOString().split('T')[0]
}

function getDefaultDueTime(_day: string): string {
  return '17:00'
}

/**
 * What students will actually be asked to do for this lesson — shown under the
 * dropdown so Melinda catches surprises during her weekly review. The main one:
 * old-course lessons that still carry leftover test questions from early
 * experiments would quietly become digital-question assignments.
 */
function LessonModeNote({ template, courseId }: { template: LessonTemplate | undefined; courseId: string }) {
  const router = useRouter()
  if (!template) return null
  const qCount = template.questions?.items?.length || 0
  if (qCount > 0) {
    return (
      <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span>📝 {qCount} digital question{qCount !== 1 ? 's' : ''} — students answer on the platform</span>
        <a
          onClick={e => { e.preventDefault(); router.push(`/teacher/library/${courseId}`) }}
          href={`/teacher/library/${courseId}`}
          style={{ color: 'var(--plum)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
          Review lesson →
        </a>
      </div>
    )
  }
  if (template.worksheetUrl) {
    return <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)' }}>🖨 Printable worksheet — photo upload</div>
  }
  return <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)' }}>📷 Book work — follow the video, photo upload</div>
}

function ScheduleWeekInner() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checking } = useRoleGuard('teacher')
  const preselectedCourseId = searchParams.get('courseId') || ''

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId)
  const [selectedCourseName, setSelectedCourseName] = useState('')
  const [lessonTemplates, setLessonTemplates] = useState<LessonTemplate[]>([])
  const [weekStartDate, setWeekStartDate] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [assignToAll, setAssignToAll] = useState(true)
  const [days, setDays] = useState<DayPlan[]>(
    DAYS.map(day => ({
      day,
      lessonTemplateId: '',
      lessonNumber: '',
      lessonTitle: '',
      instructions: '',
      videoUrl: '',
      dueDate: '',
      dueTime: getDefaultDueTime(day),
      isPublished: false,
      isInClass: day === 'Friday'
    }))
  )
  // Extra assignments beyond the Mon–Fri grid — same shape as a day row, but
  // the due date is teacher-chosen rather than derived from the week start.
  const [extras, setExtras] = useState<DayPlan[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Synchronous double-click guard. The disabled={saving} on the button is
  // not enough: two rapid clicks both read saving=false before React commits
  // the state update, and each created a full week of duplicate assignments.
  const savingRef = useRef(false)
  // "Check my week" (advisory pre-send review; never blocks saving)
  const [report, setReport] = useState<WeekReport | null>(null)
  const [checkingWeek, setCheckingWeek] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  // If no courseId in URL, load all courses so teacher can pick one
  useEffect(() => {
    if (!preselectedCourseId) {
      async function fetchCourses() {
        try {
          const result = await client.graphql({ query: listCourses })
          setCourses(result.data.listCourses.items as Course[])
        } catch (err) { console.error(err) }
      }
      fetchCourses()
    }
  }, [preselectedCourseId])

  // When course is known, fetch lessons and course name
  useEffect(() => {
    if (!selectedCourseId) return

    async function fetchLessons() {
      try {
        let allItems: LessonTemplate[] = []
        let nextToken: string | null = null
        do {
          const result: any = await client.graphql({
            query: listLessonTemplatesForSchedule,
            variables: { filter: { courseLessonTemplatesId: { eq: selectedCourseId } }, limit: 500, nextToken }
          })
          allItems = [...allItems, ...result.data.listLessonTemplates.items]
          nextToken = result.data.listLessonTemplates.nextToken
        } while (nextToken)
        allItems.sort((a, b) => a.lessonNumber - b.lessonNumber)
        setLessonTemplates(allItems)
      } catch (err) { console.error(err) }
    }

    async function fetchStudents() {
      try {
        const result = await client.graphql({
          query: listStudentProfiles,
          // Only active students are assignable. `ne: 'removed'` let archived
          // (past-year) and declined profiles through — they keep their
          // courseId, so they showed up here as if work could be assigned to
          // them. Verified 2026-08-04: every profile row has an explicit
          // status, so requiring 'active' drops no legacy rows.
          variables: { filter: { courseId: { eq: selectedCourseId }, status: { eq: 'active' } }, limit: 200 }
        }) as any
        const items = result.data.listStudentProfiles.items as StudentProfile[]
        setStudents(items)
        // Default: all selected
        setSelectedStudentIds(new Set(items.map(s => s.userId)))
        setAssignToAll(true)
      } catch (err) { console.error(err) }
    }

    fetchLessons()
    fetchStudents()

    // If preselected, find course name
    if (preselectedCourseId) {
      async function fetchCourseName() {
        try {
          const result = await client.graphql({ query: listCourses }) as any
          const found = result.data.listCourses.items.find((c: Course) => c.id === preselectedCourseId)
          if (found) setSelectedCourseName(found.title)
        } catch (err) { console.error(err) }
      }
      fetchCourseName()
    }
  }, [selectedCourseId, preselectedCourseId])

  useEffect(() => {
    if (!weekStartDate) return
    setDays(prev => prev.map(day => ({
      ...day,
      dueDate: getDefaultDueDate(day.day, weekStartDate)
    })))
  }, [weekStartDate])

  function toggleStudent(userId: string) {
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setAssignToAll(false)
  }

  function toggleAll() {
    if (assignToAll) {
      setAssignToAll(false)
      setSelectedStudentIds(new Set())
    } else {
      setAssignToAll(true)
      setSelectedStudentIds(new Set(students.map(s => s.userId)))
    }
  }

  function selectLesson(dayIndex: number, templateId: string) {
    // Choosing "Select lesson..." clears the day — needed to undo an auto-fill.
    if (!templateId) {
      const updated = [...days]
      updated[dayIndex] = {
        ...updated[dayIndex],
        lessonTemplateId: '', lessonNumber: '', lessonTitle: '',
        instructions: '', videoUrl: '', isPublished: false,
      }
      setDays(updated)
      return
    }
    const template = lessonTemplates.find(t => t.id === templateId)
    if (!template) return
    const fill = (row: DayPlan, t: LessonTemplate): DayPlan => ({
      ...row,
      lessonTemplateId: t.id,
      lessonNumber: String(t.lessonNumber),
      lessonTitle: t.title,
      instructions: t.instructions || '',
      videoUrl: t.videoUrl || '',
      // Auto-publish on selection; the checkbox stays editable for the rare
      // lesson Melinda wants staged but hidden.
      isPublished: true,
    })
    const updated = [...days]
    updated[dayIndex] = fill(updated[dayIndex], template)
    // Auto-fill the REST of the week: each still-empty later day gets the next
    // lesson in library order. Days she already chose are never overwritten.
    let next = lessonTemplates.findIndex(t => t.id === templateId) + 1
    for (let i = dayIndex + 1; i < updated.length && next < lessonTemplates.length; i++) {
      if (updated[i].lessonTemplateId) continue
      updated[i] = fill(updated[i], lessonTemplates[next])
      next++
    }
    setDays(updated)
  }

  function updateDay(index: number, field: keyof DayPlan, value: string | boolean) {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  /** Blank Mon–Fri rows + no extras — the page's initial state. */
  function emptyWeek(): DayPlan[] {
    return DAYS.map(day => ({
      day,
      lessonTemplateId: '', lessonNumber: '', lessonTitle: '',
      instructions: '', videoUrl: '',
      dueDate: '', dueTime: getDefaultDueTime(day),
      isPublished: false,
      isInClass: day === 'Friday',
    }))
  }

  function resetWeek() {
    setDays(emptyWeek())
    setExtras([])
    setSaveError('')
    setSaved(false)
    setReport(null)
  }

  /**
   * "Check my week": two layers, both advisory.
   *   1. Instant, in the browser: the checks in app/lib/weekCheck.ts (paper
   *      order vs. screen order, blank or duplicate questions, math that will
   *      not render, missing answer keys, dates, video, publish flag).
   *   2. Claude reads each lesson like a student and works every problem to
   *      verify the answer key. One call per lesson, in parallel, and the
   *      verdict is remembered in localStorage by content hash so an
   *      unchanged lesson is never sent twice.
   */
  async function checkMyWeek() {
    if (checkingWeek) return
    const rows = [...days, ...extras].map((d, i) => ({
      slotLabel: d.day === 'Additional' ? `Additional Assignment${extras.length > 1 ? ` ${i - days.length + 1}` : ''}` : d.day,
      day: d,
      template: d.lessonTemplateId ? lessonTemplates.find(t => t.id === d.lessonTemplateId) : undefined,
    }))
    setCheckingWeek(true)
    setReport(null)
    try {
      // Questions (with the answer key: the teacher may read correctAnswer)
      const questionsByTemplate = new Map<string, CheckQuestion[]>()
      await Promise.all([...new Set(rows.filter(r => r.template).map(r => r.template!.id))].map(async templateId => {
        let items: CheckQuestion[] = []
        let nextToken: string | null = null
        do {
          const result: any = await client.graphql({
            query: listAssignmentQuestions,
            variables: { filter: { lessonTemplateQuestionsId: { eq: templateId } }, limit: 200, nextToken },
          })
          items = [...items, ...result.data.listAssignmentQuestions.items]
          nextToken = result.data.listAssignmentQuestions.nextToken
        } while (nextToken)
        questionsByTemplate.set(templateId, items)
      }))

      // KaTeX errors: render every math run the way MathRenderer does, but with
      // throwOnError so a broken formula is reported instead of shown in red.
      const { default: katex } = await import('katex')
      const mathErrors = (text: string): string[] => {
        const errs: string[] = []
        for (const part of text.split(MATH_DELIMITER_SPLIT)) {
          let tex: string | null = null
          if (part.startsWith('\\[') && part.endsWith('\\]')) tex = part.slice(2, -2)
          else if (part.startsWith('\\(') && part.endsWith('\\)')) tex = part.slice(2, -2)
          else if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) tex = part.slice(2, -2)
          else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) tex = part.slice(1, -1)
          if (tex === null) continue
          try { katex.renderToString(tex, { throwOnError: true }) }
          catch (e: any) { errs.push(String(e?.message || e).replace(/^KaTeX parse error:\s*/, '')) }
        }
        return errs
      }

      const ctx = { weekStartDate, today: localToday(), mathErrors }
      const toLesson = (t: LessonTemplate): CheckLesson => ({
        id: t.id, title: t.title, lessonNumber: t.lessonNumber, instructions: t.instructions,
        assignmentType: t.assignmentType, worksheetUrl: t.worksheetUrl, videoUrl: t.videoUrl,
        teachingNotes: t.teachingNotes, questions: questionsByTemplate.get(t.id) || [],
      })
      const toSlot = (d: DayPlan): CheckSlot => ({
        day: d.day, dueDate: d.dueDate, dueTime: d.dueTime, isPublished: d.isPublished,
        isInClass: d.isInClass, instructions: d.instructions, videoUrl: d.videoUrl,
      })

      const weekFindings = checkWeek(rows.map(r => ({ slot: toSlot(r.day), lesson: r.template ? toLesson(r.template) : null })), ctx)
      const lessons: LessonReport[] = rows.filter(r => r.template).map(r => ({
        templateId: r.template!.id,
        title: lessonDisplayTitle(r.template!.lessonNumber, r.template!.title),
        slotLabel: r.slotLabel,
        checks: checkLesson(toLesson(r.template!), toSlot(r.day), ctx),
        claude: 'pending',
        claudeFindings: [], claudeSummary: '', claudeError: '', fromCache: false,
      }))

      // Worksheet file reachable? (S3 keys only; outside links are not probed)
      await Promise.all(lessons.map(async (l, i) => {
        const t = rows.filter(r => r.template)[i].template!
        const ws = t.worksheetUrl || ''
        let key: string | null = null
        if (ws.startsWith('[')) { try { key = (JSON.parse(ws) as string[])[0] || null } catch { key = null } }
        else if (ws && !ws.startsWith('http')) key = ws
        if (!key) return
        try {
          const res = await apiFetch('/api/view-submission', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
          if (!res.ok) throw new Error(String(res.status))
          const { url } = await res.json()
          const head = await fetch(url, { method: 'HEAD' })
          if (!head.ok) throw new Error(String(head.status))
        } catch {
          l.checks.push({ questionId: null, severity: 'warn', message: 'The attached worksheet file could not be opened. Students may not be able to print it.' })
        }
      }))

      setReport({ weekFindings, lessons, finished: lessons.length === 0 })
      setTimeout(() => reportRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50)
      if (lessons.length === 0) return

      // Layer 2: Claude, once per distinct lesson, cached by content hash
      const update = (templateId: string, patch: Partial<LessonReport>) =>
        setReport(prev => prev ? { ...prev, lessons: prev.lessons.map(l => l.templateId === templateId ? { ...l, ...patch } : l) } : prev)
      const distinct = [...new Set(lessons.map(l => l.templateId))]
      const queue = [...distinct]
      const worker = async () => {
        while (queue.length > 0) {
          const templateId = queue.shift()!
          const template = lessonTemplates.find(t => t.id === templateId)!
          const lesson = toLesson(template)
          const cacheKey = WEEK_CHECK_CACHE_PREFIX + await sha256Hex(lessonContentKey(lesson))
          try {
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const parsed = JSON.parse(cached)
              update(templateId, { claude: 'done', claudeFindings: parsed.findings || [], claudeSummary: parsed.summary || '', fromCache: true })
              continue
            }
          } catch { /* no cache, no problem */ }
          update(templateId, { claude: 'running' })
          try {
            const res = await apiFetch(WEEK_CHECK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson }) })
            const text = await res.text()
            let data: any = null
            try { data = JSON.parse(text) } catch { data = null }
            if (!res.ok || !data) throw new Error(data?.error || `The review did not finish (status ${res.status}).`)
            update(templateId, { claude: 'done', claudeFindings: data.findings || [], claudeSummary: data.summary || '' })
            try { localStorage.setItem(cacheKey, JSON.stringify({ findings: data.findings || [], summary: data.summary || '', at: Date.now() })) } catch { /* storage full or blocked */ }
          } catch (err: any) {
            update(templateId, { claude: 'error', claudeError: err?.message || 'The review did not finish.' })
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(3, distinct.length) }, worker))
      setReport(prev => prev ? { ...prev, finished: true } : prev)
    } catch (err: any) {
      console.error('Check my week failed:', err)
      setReport({ weekFindings: [{ questionId: null, severity: 'warn', message: `The check could not run: ${err?.errors?.[0]?.message || err?.message || 'unknown error'}` }], lessons: [], finished: true })
    } finally {
      setCheckingWeek(false)
    }
  }

  function editorLink(templateId: string, questionId: string | null): string {
    return `/teacher/library/${selectedCourseId}?lesson=${templateId}${questionId ? `&q=${questionId}` : ''}`
  }

  /**
   * Switching course must clear the day rows: the chosen lesson ids belong to
   * the OLD course's library, so the dropdowns went blank but the rows kept
   * their publish flags, videos and instructions — half a ghost schedule.
   */
  function changeCourse(courseId: string) {
    setSelectedCourseId(courseId)
    resetWeek()
  }

  function addExtra() {
    setExtras(prev => [...prev, {
      day: 'Additional',
      lessonTemplateId: '',
      lessonNumber: '',
      lessonTitle: '',
      instructions: '',
      videoUrl: '',
      dueDate: '',
      dueTime: '17:00',
      isPublished: false,
      isInClass: false,
    }])
  }

  function removeExtra(index: number) {
    setExtras(prev => prev.filter((_, i) => i !== index))
  }

  function selectExtraLesson(index: number, templateId: string) {
    const template = lessonTemplates.find(t => t.id === templateId)
    if (!template) return
    setExtras(prev => prev.map((x, i) => i !== index ? x : {
      ...x,
      lessonTemplateId: templateId,
      lessonNumber: String(template.lessonNumber),
      lessonTitle: template.title,
      instructions: template.instructions || '',
      videoUrl: template.videoUrl || '',
      isPublished: true,
    }))
  }

  function updateExtra(index: number, field: keyof DayPlan, value: string | boolean) {
    setExtras(prev => prev.map((x, i) => i !== index ? x : { ...x, [field]: value }))
  }

  async function saveSchedule() {
    if (!selectedCourseId || !weekStartDate) return
    if (savingRef.current) return
    savingRef.current = true
    // The Mon–Fri rows get default due dates from the week start, but an
    // additional assignment's whole point is a chosen date — refuse to guess.
    if (extras.some(x => x.lessonNumber && !x.dueDate)) {
      setSaveError('Each additional assignment needs a due date.')
      savingRef.current = false
      return
    }
    // Same lesson on two days is almost always a slip of the dropdown —
    // confirm before students see it twice.
    {
      const chosen = [...days, ...extras].filter(d => d.lessonTemplateId)
      const byTemplate = new Map<string, DayPlan[]>()
      for (const d of chosen) {
        byTemplate.set(d.lessonTemplateId, [...(byTemplate.get(d.lessonTemplateId) || []), d])
      }
      const dups = [...byTemplate.values()].filter(rows => rows.length > 1)
      if (dups.length > 0) {
        const lines = dups.map(rows =>
          `• ${lessonDisplayTitle(rows[0].lessonNumber, rows[0].lessonTitle)} (${rows.map(r => r.day).join(' and ')})`
        ).join('\n')
        const proceed = window.confirm(
          `You've scheduled the same lesson more than once this week:\n\n${lines}\n\n` +
          `Students would be assigned it twice. Save anyway?`
        )
        if (!proceed) {
          savingRef.current = false
          return
        }
      }
    }
    setSaving(true)
    setSaveError('')
    try {
      // A schedule for this course + week may already exist (double-click,
      // back-button resave, or a genuine second plan for a student subset).
      // Creating it silently doubles every assignment on the student side,
      // so surface it and let Melinda decide.
      try {
        const dupRes = await (client.graphql({
          query: /* GraphQL */`
            query CheckExistingWeekPlan($filter: ModelWeeklyPlanFilterInput) {
              listWeeklyPlans(filter: $filter, limit: 500) {
                items { id }
              }
            }
          `,
          variables: { filter: { courseWeeklyPlansId: { eq: selectedCourseId }, weekStartDate: { eq: weekStartDate } } }
        }) as any)
        const existing = dupRes?.data?.listWeeklyPlans?.items ?? []
        if (existing.length > 0) {
          const proceed = window.confirm(
            `A schedule for this course starting ${weekStartDate} already exists — students would see the week's work twice.\n\n` +
            `To change that week, delete the existing plan under Assigned Work first.\n\n` +
            `Create a second schedule for this week anyway?`
          )
          if (!proceed) {
            setSaving(false)
            savingRef.current = false
            return
          }
        }
      } catch { /* dup check is best-effort — never block saving on its failure */ }

      const { createWeeklyPlan, createWeeklyPlanItem, createLesson } = await import('../../../src/graphql/mutations')

      // Build assignedStudentIds — null means all students
      const assignedStudentIds = assignToAll ? null : JSON.stringify([...selectedStudentIds])

      const planResult = await client.graphql({
        query: createWeeklyPlan,
        variables: { input: {
          weekStartDate,
          courseWeeklyPlansId: selectedCourseId,
          assignedStudentIds
        } }
      }) as any
      const planId = planResult.data?.createWeeklyPlan?.id
      if (!planId) throw new Error('Failed to create weekly plan — no ID returned.')

      for (const day of [...days, ...extras]) {
        if (!day.lessonNumber) continue
        const lessonResult = await (client.graphql({
          query: createLesson,
          variables: { input: {
            title: day.lessonTitle || `Lesson ${day.lessonNumber}`,
            order: parseFloat(day.lessonNumber) || 0,
            isPublished: day.isPublished,
            courseLessonsId: selectedCourseId,
            videoUrl: day.videoUrl || '',
            instructions: day.instructions || ''
          } as any}
        }) as any)
        const lessonId = lessonResult.data?.createLesson?.id
        if (!lessonId) throw new Error(`Failed to create lesson for ${day.day}.`)
        await client.graphql({
          query: createWeeklyPlanItem,
          variables: { input: {
            dayOfWeek: day.day,
            dueTime: `${day.dueDate}T${day.dueTime}`,
            isPublished: day.isPublished,
            isInClass: day.isInClass,
            weeklyPlanItemsId: planId,
            lessonWeeklyPlanItemsId: lessonId,
            lessonTemplateId: day.lessonTemplateId || null
          }}
        })
      }
      setSaved(true)
      setTimeout(() => router.push('/teacher'), 1500)
    } catch (err: any) {
      console.error('Error saving schedule:', err)
      const msg = err?.errors?.[0]?.message || err?.message || 'Unknown error. Check the console for details.'
      setSaveError(msg)
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  const allSelected = students.length > 0 && selectedStudentIds.size === students.length

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Schedule a Week</h1>
        {selectedCourseName && (
          <p style={{ color: 'var(--plum)', fontWeight: 500, marginBottom: '4px', fontSize: '15px' }}>{selectedCourseName}</p>
        )}
        <p style={{ color: 'var(--gray-mid)', marginBottom: '40px' }}>Select a week, assign students, then pick lessons for each day. Use “Add Additional Work” for extra assignments due on dates you choose.</p>

        {/* Course selector — only shown if no courseId in URL */}
        {!preselectedCourseId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
            <select value={selectedCourseId} onChange={e => changeCourse(e.target.value)}
              style={{ width: '320px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        {/* Week date */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Week Starting (Monday)</label>
          <input
            ref={dateInputRef}
            type="date"
            value={weekStartDate}
            onChange={e => { setWeekStartDate(e.target.value); e.target.blur() }}
            style={{ width: '220px', padding: '10px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer' }}
          />
        </div>

        {/* Student assignment */}
        {selectedCourseId && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: 0 }}>Assign to Students</h2>
              <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                {assignToAll || selectedStudentIds.size === students.length
                  ? 'All students'
                  : `${selectedStudentIds.size} of ${students.length} selected`}
              </span>
            </div>
            {students.length === 0 ? (
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: 0 }}>
                No students found for this course. Students are matched by their Course ID in their profile.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* Select All toggle */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  background: allSelected ? 'var(--plum)' : 'var(--gray-light)',
                  color: allSelected ? 'white' : 'var(--gray-dark)',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  border: `1px solid ${allSelected ? 'var(--plum)' : 'var(--gray-light)'}`,
                  userSelect: 'none'
                }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ display: 'none' }}/>
                  {allSelected ? '✓ ' : ''}All Students
                </label>
                {/* Individual student chips */}
                {students.map(s => {
                  const checked = selectedStudentIds.has(s.userId)
                  return (
                    <label key={s.userId} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      background: checked ? 'var(--plum-light)' : 'white',
                      color: checked ? 'var(--plum)' : 'var(--gray-dark)',
                      padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                      border: `1px solid ${checked ? 'var(--plum-mid)' : 'var(--gray-light)'}`,
                      userSelect: 'none'
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.userId)} style={{ display: 'none' }}/>
                      {checked ? '✓ ' : ''}{s.firstName} {s.lastName}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Day rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {days.map((day, i) => (
            <div key={day.day} style={{ background: day.isInClass ? 'var(--plum-light)' : 'var(--background)', border: `1px solid ${day.isInClass ? 'var(--plum-mid)' : 'var(--gray-light)'}`, borderRadius: 'var(--radius)', padding: '20px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{day.day}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={day.isInClass} onChange={e => updateDay(i, 'isInClass', e.target.checked)}/>
                  In-class assignment
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'start' }}>
                <div>
                  <select value={day.lessonTemplateId} onChange={e => selectLesson(i, e.target.value)}
                    disabled={!selectedCourseId}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="">Select lesson...</option>
                    {lessonTemplates.map(t => <option key={t.id} value={t.id}>Lesson {t.lessonNumber} — {t.title}</option>)}
                  </select>
                  {day.lessonTemplateId && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 500, color: day.videoUrl ? '#059669' : '#B45309' }}>
                      {day.videoUrl ? '✓ Video attached' : '⚠ No video for this lesson'}
                    </div>
                  )}
                  {day.lessonTemplateId && (
                    <LessonModeNote template={lessonTemplates.find(t => t.id === day.lessonTemplateId)} courseId={selectedCourseId} />
                  )}
                  <textarea
                    value={day.instructions}
                    onChange={e => updateDay(i, 'instructions', e.target.value)}
                    rows={2}
                    placeholder="Instructions for students..."
                    style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <input type="date" value={day.dueDate} onChange={e => updateDay(i, 'dueDate', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                </div>
                <div>
                  <input type="time" value={day.dueTime} onChange={e => updateDay(i, 'dueTime', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer', paddingTop: '10px' }}>
                  <input type="checkbox" checked={day.isPublished} onChange={e => updateDay(i, 'isPublished', e.target.checked)}/>
                  Publish
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Additional assignments — beyond the Mon–Fri grid, due on chosen dates */}
        {extras.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            {extras.map((extra, i) => (
              <div key={i} style={{ background: 'var(--background)', border: '1px dashed var(--plum-mid)', borderRadius: 'var(--radius)', padding: '20px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--plum)' }}>
                    Additional Assignment{extras.length > 1 ? ` ${i + 1}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={extra.isInClass} onChange={e => updateExtra(i, 'isInClass', e.target.checked)}/>
                      In-class assignment
                    </label>
                    <button onClick={() => removeExtra(i)} title="Remove this assignment"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'start' }}>
                  <div>
                    <select value={extra.lessonTemplateId} onChange={e => selectExtraLesson(i, e.target.value)}
                      disabled={!selectedCourseId}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
                      <option value="">Select lesson...</option>
                      {lessonTemplates.map(t => <option key={t.id} value={t.id}>Lesson {t.lessonNumber} — {t.title}</option>)}
                    </select>
                    {extra.lessonTemplateId && (
                      <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 500, color: extra.videoUrl ? '#059669' : '#B45309' }}>
                        {extra.videoUrl ? '✓ Video attached' : '⚠ No video for this lesson'}
                      </div>
                    )}
                    {extra.lessonTemplateId && (
                      <LessonModeNote template={lessonTemplates.find(t => t.id === extra.lessonTemplateId)} courseId={selectedCourseId} />
                    )}
                    <textarea
                      value={extra.instructions}
                      onChange={e => updateExtra(i, 'instructions', e.target.value)}
                      rows={2}
                      placeholder="Instructions for students..."
                      style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <input type="date" value={extra.dueDate} onChange={e => updateExtra(i, 'dueDate', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${extra.lessonNumber && !extra.dueDate ? '#f59e0b' : 'var(--gray-light)'}`, borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                    {extra.lessonNumber && !extra.dueDate && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#B45309' }}>Pick a due date</div>
                    )}
                  </div>
                  <div>
                    <input type="time" value={extra.dueTime} onChange={e => updateExtra(i, 'dueTime', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}/>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-dark)', cursor: 'pointer', paddingTop: '10px' }}>
                    <input type="checkbox" checked={extra.isPublished} onChange={e => updateExtra(i, 'isPublished', e.target.checked)}/>
                    Publish
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add additional work */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={addExtra}
            style={{ background: 'transparent', color: 'var(--plum)', border: '1px dashed var(--plum-mid)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            + Add Additional Work
          </button>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={saveSchedule} disabled={saving || !selectedCourseId || !weekStartDate}
            style={{ background: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-light)' : 'var(--plum)', color: saving || !selectedCourseId || !weekStartDate ? 'var(--gray-mid)' : 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
            {saving ? 'Saving...' : 'Save Week Schedule'}
          </button>
          <button onClick={checkMyWeek} disabled={checkingWeek || saving || !selectedCourseId}
            title="Looks over every lesson for this week before you send it. Never blocks saving."
            style={{ background: 'transparent', color: checkingWeek || !selectedCourseId ? 'var(--gray-mid)' : 'var(--plum)', border: `1px solid ${checkingWeek || !selectedCourseId ? 'var(--gray-light)' : 'var(--plum-mid)'}`, borderRadius: '8px', padding: '12px 20px', cursor: checkingWeek || !selectedCourseId ? 'default' : 'pointer', fontSize: '14px', fontWeight: 500 }}>
            {checkingWeek ? 'Checking...' : 'Check my week'}
          </button>
          <button
            onClick={() => {
              const hasWork = [...days, ...extras].some(d => d.lessonTemplateId || d.instructions)
              if (!hasWork || window.confirm('Clear every day and start this week over?')) resetWeek()
            }}
            disabled={saving}
            style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Start Over
          </button>
          {saved && <span style={{ color: 'var(--plum)', fontSize: '14px' }}>✓ Saved! Redirecting...</span>}
          {saveError && <span style={{ color: '#dc2626', fontSize: '14px' }}>Error: {saveError}</span>}
        </div>

        {/* Check my week results */}
        {report && (
          <div ref={reportRef} style={{ marginTop: '32px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: 0 }}>Check my week</h2>
              <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                {report.finished
                  ? 'Done. These are suggestions only; you can still save the week as it is.'
                  : `Reading ${report.lessons.filter(l => l.claude === 'running' || l.claude === 'pending').length} lesson${report.lessons.filter(l => l.claude === 'running' || l.claude === 'pending').length === 1 ? '' : 's'} the way a student would...`}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '0 0 16px' }}>Links open the lesson editor in a new tab, so your week stays here.</p>

            {report.weekFindings.length > 0 && (
              <ul style={{ margin: '0 0 16px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.weekFindings.map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--foreground)' }}>{f.severity === 'warn' ? '⚠️ ' : 'ℹ️ '}{f.message}</li>
                ))}
              </ul>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {report.lessons.map((l, idx) => {
                const warnCount = l.checks.filter(f => f.severity === 'warn').length + l.claudeFindings.length
                const noteCount = l.checks.filter(f => f.severity === 'info').length
                const settled = l.claude === 'done' || l.claude === 'error'
                const verdict = !settled
                  ? (l.claude === 'running' ? 'Reading...' : 'Waiting...')
                  : warnCount === 0 && noteCount === 0 ? '✅ Looks good'
                  : warnCount === 0 ? `✅ Looks good, ${noteCount} note${noteCount === 1 ? '' : 's'}`
                  : `⚠️ ${warnCount} thing${warnCount === 1 ? '' : 's'} to check`
                return (
                  <div key={`${l.templateId}-${idx}`} style={{ border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '15px', color: 'var(--foreground)' }}>
                        <span style={{ fontWeight: 600 }}>{l.slotLabel}:</span> {l.title}
                        {' '}<a href={editorLink(l.templateId, null)} target="_blank" rel="noopener" style={{ fontSize: '13px', color: 'var(--plum)', textDecoration: 'underline' }}>Open lesson</a>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: !settled ? 'var(--gray-mid)' : warnCount > 0 ? '#B45309' : '#059669', whiteSpace: 'nowrap' }}>{verdict}</span>
                    </div>
                    {(l.checks.length > 0 || l.claudeFindings.length > 0 || l.claude === 'error' || (l.claude === 'done' && l.claudeSummary)) && (
                      <ul style={{ margin: '10px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {l.checks.map((f, i) => (
                          <li key={`c${i}`} style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                            {f.severity === 'warn' ? '⚠️ ' : 'ℹ️ '}{f.message}
                            {f.questionId && <>{' '}<a href={editorLink(l.templateId, f.questionId)} target="_blank" rel="noopener" style={{ color: 'var(--plum)', textDecoration: 'underline', fontSize: '13px' }}>Open question</a></>}
                          </li>
                        ))}
                        {l.claudeFindings.map((f, i) => (
                          <li key={`a${i}`} style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                            {f.kind === 'answer_key' ? '🔢 ' : '✏️ '}{f.message}
                            {f.kind === 'answer_key' && f.suggestedAnswer && <span style={{ color: 'var(--gray-dark)' }}> (Claude got: {f.suggestedAnswer})</span>}
                            {f.questionId && <>{' '}<a href={editorLink(l.templateId, f.questionId)} target="_blank" rel="noopener" style={{ color: 'var(--plum)', textDecoration: 'underline', fontSize: '13px' }}>Open question</a></>}
                          </li>
                        ))}
                        {l.claude === 'error' && (
                          <li style={{ fontSize: '14px', color: '#B45309', lineHeight: 1.5 }}>The read-through did not finish: {l.claudeError} Click Check my week again to retry.</li>
                        )}
                        {l.claude === 'done' && l.claudeSummary && (
                          <li style={{ fontSize: '13px', color: 'var(--gray-mid)', lineHeight: 1.5, listStyle: 'none', marginLeft: '-20px' }}>
                            Read-through: {l.claudeSummary}{l.fromCache ? ' (unchanged since last check)' : ''}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ScheduleWeek() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', fontFamily: 'var(--font-body)' }}>Loading...</div>}>
      <ScheduleWeekInner />
    </Suspense>
  )
}
