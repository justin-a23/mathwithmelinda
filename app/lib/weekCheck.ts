import { digitalOrder, simulateStudentPrint, studentPrintSubset, displayNumbers } from './printOrder'

/**
 * "Check my week", layer 1: the instant, free, deterministic checks that run
 * in the browser before Melinda sends a week to students. Advisory only, it
 * never blocks saving. Framework-free so it can be unit-tested with node.
 *
 * Origin: 2026-09-28, MS Math Test 2 printed starting at problem #8. Every
 * check here is a class of mistake that has bitten (or would have) a real
 * student, phrased in plain language for the teacher. No em dashes in any
 * message: Melinda reads these.
 */

export type CheckQuestion = {
  id: string
  order: number
  questionText: string
  questionType: string
  choices?: string | null
  correctAnswer?: string | null
  diagramKey?: string | null
  diagramSpec?: string | null
}

export type CheckLesson = {
  id: string
  title: string
  lessonNumber: number | null
  instructions?: string | null
  assignmentType?: string | null
  worksheetUrl?: string | null
  videoUrl?: string | null
  teachingNotes?: string | null
  questions: CheckQuestion[]
}

/** One row of the Schedule Week grid (a weekday or an additional assignment). */
export type CheckSlot = {
  day: string
  dueDate: string
  dueTime: string
  isPublished: boolean
  isInClass: boolean
  instructions: string
  videoUrl: string
}

export type Finding = {
  /** Which question the note is about, when it is about one. */
  questionId: string | null
  /** warn = a student would likely be affected. info = worth a glance. */
  severity: 'warn' | 'info'
  message: string
}

export type CheckContext = {
  /** The Monday the week starts, YYYY-MM-DD. */
  weekStartDate: string
  /** Today, YYYY-MM-DD, in the teacher's local time. */
  today: string
  /**
   * Optional: render every math run in a text and return the errors KaTeX
   * raised. Supplied by the page (KaTeX is a browser dependency); tests omit it.
   */
  mathErrors?: (text: string) => string[]
}

const DIGITAL_TYPES = new Set(['number', 'short_text', 'multiple_choice', 'multiple_choice_multi'])

export function isPaperLesson(assignmentType: string | null | undefined): boolean {
  const t = assignmentType || 'upload'
  return t === 'upload' || t === 'worksheet' || t === 'both'
}

export function takesDigitalAnswers(assignmentType: string | null | undefined): boolean {
  return assignmentType === 'questions' || assignmentType === 'both'
}

function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Count of `$` that are neither escaped (`\$`) nor part of a `$$` pair. */
export function unmatchedDollar(text: string): boolean {
  const stripped = text.replace(/\\\$/g, '').replace(/\$\$/g, '')
  const singles = (stripped.match(/\$/g) || []).length
  return singles % 2 === 1
}

function weekdayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Checks for one scheduled lesson. `slot` is the schedule row (due date,
 * publish flag, the instructions and video as edited on the schedule page);
 * `lesson` is the library template with its questions and answer key.
 */
export function checkLesson(lesson: CheckLesson, slot: CheckSlot, ctx: CheckContext): Finding[] {
  const out: Finding[] = []
  const warn = (questionId: string | null, message: string) => out.push({ questionId, severity: 'warn', message })
  const info = (questionId: string | null, message: string) => out.push({ questionId, severity: 'info', message })

  const questions = digitalOrder(lesson.questions)
  const nums = displayNumbers(questions)
  const label = (q: CheckQuestion) => `Question ${nums.get(q.id) ?? '?'}`
  const aType = lesson.assignmentType || 'upload'

  // ── Question content ──────────────────────────────────────────────────
  const seen = new Map<string, CheckQuestion>()
  questions.forEach((q, i) => {
    const text = (q.questionText || '').trim()
    const isHeader = q.questionType === 'section_header'

    if (!text) {
      if (isHeader) warn(q.id, 'A section header has no text.')
      else warn(q.id, `${label(q)} is blank.`)
      return
    }

    if (isHeader) {
      const next = questions[i + 1]
      if (!next || next.questionType === 'section_header') {
        warn(q.id, `The section header "${text}" has no questions under it.`)
      }
    } else {
      const key = normalizeText(text)
      const dup = seen.get(key)
      if (dup) warn(q.id, `${label(q)} is the same as ${label(dup)}.`)
      else seen.set(key, q)
    }

    // Math that will not display
    const textsToCheck = [text, ...(q.choices ? q.choices.split('\n') : [])]
    for (const t of textsToCheck) {
      if (unmatchedDollar(t)) {
        warn(q.id, `${isHeader ? `The section header "${text}"` : label(q)} has an unmatched $ sign, so its math may show as raw code.`)
        break
      }
    }
    if (ctx.mathErrors) {
      for (const t of textsToCheck) {
        const errs = ctx.mathErrors(t)
        if (errs.length > 0) {
          warn(q.id, `${isHeader ? `The section header "${text}"` : label(q)} has math that will not display: ${errs[0]}`)
          break
        }
      }
    }

    // Answer key, only where the platform grades the answer
    if (!isHeader && takesDigitalAnswers(aType) && DIGITAL_TYPES.has(q.questionType)) {
      const answer = (q.correctAnswer || '').trim()
      if (!answer) warn(q.id, `${label(q)} has no answer in the answer key, so it cannot be checked automatically.`)
      if ((q.questionType === 'multiple_choice' || q.questionType === 'multiple_choice_multi')) {
        const choices = (q.choices || '').split('\n').map(c => c.trim()).filter(Boolean)
        if (choices.length < 2) warn(q.id, `${label(q)} is multiple choice but has fewer than two choices.`)
      }
    }
  })

  // ── Paper vs. screen order (the Test 2 class of bug) ──────────────────
  if (isPaperLesson(aType) && questions.length > 0) {
    const printed = simulateStudentPrint(questions, aType).filter(p => p.q.questionType !== 'section_header')
    const onScreen = studentPrintSubset(questions, aType).filter(q => q.questionType !== 'section_header')
    const firstDiff = printed.findIndex((p, i) => onScreen[i]?.id !== p.q.id)
    if (firstDiff >= 0) {
      const p = printed[firstDiff]
      const screenPos = onScreen.findIndex(q => q.id === p.q.id) + 1
      warn(p.q.id, `The printed worksheet lists the problems in a different order than the screen. On paper, problem ${p.label} comes ${ordinal(firstDiff + 1)}; on screen it is ${ordinal(screenPos)}. Check the problem numbers at the start of each question.`)
    }
  }

  // ── Nothing for the student to do ─────────────────────────────────────
  const hasQuestions = questions.some(q => q.questionType !== 'section_header')
  const instructions = (slot.instructions || lesson.instructions || '').trim()
  if (!hasQuestions && !lesson.worksheetUrl && !instructions && aType !== 'none') {
    warn(null, 'Students will see nothing to do: no questions, no worksheet and no instructions.')
  }
  if (aType === 'worksheet' && !hasQuestions && !lesson.worksheetUrl) {
    warn(null, 'This is a worksheet lesson but no worksheet file is attached and there are no questions to print.')
  }

  // ── Video ─────────────────────────────────────────────────────────────
  if (!(slot.videoUrl || lesson.videoUrl)) {
    warn(null, 'No video is attached to this lesson.')
  }

  // ── Dates and visibility ──────────────────────────────────────────────
  if (!slot.dueDate) {
    warn(null, 'This assignment has no due date.')
  } else {
    const dayName = weekdayName(slot.dueDate)
    if (dayName === 'Saturday' || dayName === 'Sunday') warn(null, `The due date (${shortDate(slot.dueDate)}) is a ${dayName}.`)
    if (slot.dueDate < ctx.today) warn(null, `The due date (${shortDate(slot.dueDate)}) is already in the past.`)
    else if (ctx.weekStartDate && slot.dueDate < ctx.weekStartDate) warn(null, `The due date (${shortDate(slot.dueDate)}) is before the week starts.`)
    if (!slot.dueTime) info(null, 'No due time is set.')
  }
  if (!slot.isPublished) info(null, 'Publish is not checked, so students will not see this lesson.')

  return out
}

export type WeekRow = { slot: CheckSlot; lesson: CheckLesson | null }

/** Checks that only make sense across the whole week. */
export function checkWeek(rows: WeekRow[], ctx: CheckContext): Finding[] {
  const out: Finding[] = []
  const chosen = rows.filter(r => r.lesson)
  if (chosen.length === 0) {
    out.push({ questionId: null, severity: 'warn', message: 'No lessons are chosen for this week.' })
    return out
  }

  const byLesson = new Map<string, WeekRow[]>()
  for (const r of chosen) byLesson.set(r.lesson!.id, [...(byLesson.get(r.lesson!.id) || []), r])
  for (const group of byLesson.values()) {
    if (group.length > 1) {
      out.push({ questionId: null, severity: 'warn', message: `"${group[0].lesson!.title}" is scheduled more than once (${group.map(g => g.slot.day).join(' and ')}). Students would get it twice.` })
    }
  }

  // A gap between two filled weekdays is usually a slipped dropdown
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const filled = weekdays.map(d => rows.some(r => r.slot.day === d && r.lesson))
  const first = filled.indexOf(true)
  const last = filled.lastIndexOf(true)
  for (let i = first + 1; i < last; i++) {
    if (!filled[i]) out.push({ questionId: null, severity: 'info', message: `${weekdays[i]} has no lesson but the days around it do.` })
  }

  if (ctx.weekStartDate && weekdayName(ctx.weekStartDate) !== 'Monday') {
    out.push({ questionId: null, severity: 'warn', message: `The week start (${shortDate(ctx.weekStartDate)}) is a ${weekdayName(ctx.weekStartDate)}, not a Monday.` })
  }
  return out
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Stable hash input for the Claude-review cache: everything the review reads.
 * Callers hash the string (SHA-256) and remember the result per lesson so an
 * unchanged lesson is never sent twice.
 */
export function lessonContentKey(lesson: CheckLesson): string {
  const qs = digitalOrder(lesson.questions).map(q => [q.questionText, q.questionType, q.choices || '', q.correctAnswer || '', q.diagramKey ? 'd' : '', q.diagramSpec ? 's' : ''])
  return JSON.stringify([lesson.id, lesson.title, lesson.instructions || '', lesson.assignmentType || '', lesson.teachingNotes || '', qs])
}
