import Anthropic from '@anthropic-ai/sdk'
import type { CheckLesson } from './weekCheck'

/**
 * "Check my week", layer 2: Claude reads one lesson the way a student would
 * and works every problem to verify the answer key. Framework-free and shared
 * by two hosts that must never drift (same reasoning as gradeSuggestionCore):
 *
 *   - amplify/functions/week-check/handler.ts   the Lambda production uses
 *     (Amplify Hosting kills /api routes at a hard 30 s; a 20-question
 *     chapter test takes Opus longer than that to work through)
 *   - app/api/week-check/route.ts               local-dev fallback
 *
 * One lesson per call, so the schedule page can run the week in parallel and
 * cache each lesson's verdict by content hash.
 */

export type WeekCheckInput = { lesson: CheckLesson }

export type ClaudeFinding = {
  questionId: string | null
  kind: 'answer_key' | 'typo' | 'wording' | 'instructions' | 'other'
  message: string
  suggestedAnswer: string | null
}

export type WeekCheckResult = {
  status: 200 | 400
  body:
    | { findings: ClaudeFinding[]; summary: string; usage: { input: number; output: number } }
    | { error: string }
}

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings', 'summary'],
  properties: {
    summary: {
      type: 'string',
      description: 'One plain sentence for the teacher: either that the lesson looks good, or what kind of things to check.',
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['questionId', 'kind', 'message', 'suggestedAnswer'],
        properties: {
          questionId: { type: ['string', 'null'], description: 'The exact [id:...] of the question, or null for the lesson as a whole.' },
          kind: { type: 'string', enum: ['answer_key', 'typo', 'wording', 'instructions', 'other'] },
          message: { type: 'string', description: 'One or two plain sentences a teacher can act on.' },
          suggestedAnswer: { type: ['string', 'null'], description: 'For answer_key findings only: the answer you got, in the same notation as the key.' },
        },
      },
    },
  },
} as const

const SYSTEM_PROMPT = `You are reviewing a homeschool math lesson BEFORE the teacher sends it to her students. The teacher, Melinda, teaches Arithmetic 6, Middle School Math, Pre-Algebra and Algebra 1 (Abeka curriculum). Your job is to catch what a careful colleague would catch, and nothing more.

Read the lesson like a student would, then:

1. ANSWER KEY. Work every question that has a [correct: ...] value yourself, from scratch. Compare your result with the key. Report a finding of kind "answer_key" ONLY when you are confident the key is wrong, and put your answer in suggestedAnswer. Equivalent forms are NOT disagreements: 1/2 and 0.5 and 50%, "x = 3" and "3", "-4" and "−4", trailing zeros, a fraction the student would naturally leave unsimplified only if the instructions say so. Multiple choice keys may be a letter (A, B, C) or the choice text; both are fine. If a question depends on a diagram you cannot see, do not judge its key.

2. TYPOS AND WRONG NUMBERS. Misspellings, a number that clearly should be another (a problem that says "15 apples" and then "the 16 apples"), broken or nonsensical math notation a student would stumble on.

3. WORDING. A question a student at this level could not understand or could reasonably read two ways.

4. INSTRUCTIONS. The lesson instructions or a section header promise something the questions do not deliver, or the questions need an instruction that is missing (a list of bare numbers under no header, "solve" with no equation, "use the graph" with no graph).

Do NOT report: style preferences, LaTeX that renders fine, capitalization, the absence of an answer key on show-work questions (those are graded from photos), curriculum choices, or anything already correct. An empty findings list is a good and common result.

Write every message in plain language for the teacher. Never use em dashes. Refer to questions by their number as shown ("Question 7"), and always fill questionId with the exact [id:...] value when the finding is about one question.`

export async function reviewLessonWithClaude(input: WeekCheckInput, anthropic: Anthropic): Promise<WeekCheckResult> {
  const lesson = input?.lesson
  if (!lesson || !Array.isArray(lesson.questions)) {
    return { status: 400, body: { error: 'No lesson to review.' } }
  }
  const questions = [...lesson.questions].sort((a, b) => a.order - b.order)
  if (questions.length === 0 && !(lesson.instructions || '').trim()) {
    return { status: 200, body: { findings: [], summary: 'There is nothing to read in this lesson yet.', usage: { input: 0, output: 0 } } }
  }

  let qNum = 0
  const lines = questions.map(q => {
    if (q.questionType === 'section_header') return `\n== SECTION HEADER: ${q.questionText.trim()} ==`
    qNum++
    const parts = [`[id:${q.id}] Question ${qNum} (${q.questionType}): ${q.questionText.trim()}`]
    if (q.choices) parts.push(`   Choices: ${q.choices.split('\n').filter(Boolean).map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`).join('  |  ')}`)
    if (q.correctAnswer) parts.push(`   [correct: ${q.correctAnswer}]`)
    if (q.diagramKey || q.diagramSpec) parts.push('   (This question has a diagram you cannot see.)')
    return parts.join('\n')
  })

  const userParts = [
    // Imported titles often already start with "Lesson 12"; do not double it
    `LESSON: ${/^lesson\s/i.test(lesson.title) || lesson.lessonNumber === null || lesson.lessonNumber === undefined ? lesson.title : `Lesson ${lesson.lessonNumber}: ${lesson.title}`}`,
    `ASSIGNMENT TYPE: ${describeType(lesson.assignmentType)}`,
  ]
  if ((lesson.instructions || '').trim()) userParts.push(`INSTRUCTIONS TO STUDENTS:\n${lesson.instructions!.trim()}`)
  if ((lesson.teachingNotes || '').trim()) userParts.push(`TEACHER'S METHOD NOTES (how she wants it solved):\n${lesson.teachingNotes!.trim()}`)
  userParts.push(questions.length > 0 ? `QUESTIONS (${qNum} questions):\n${lines.join('\n')}` : 'QUESTIONS: none. This lesson is instructions only.')

  // Adaptive thinking is on by default for Opus 5 and is what working every
  // problem needs; thinking tokens count against max_tokens.
  const message = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userParts.join('\n\n') }],
    output_config: { effort: 'high', format: { type: 'json_schema', schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> } },
  })

  if (message.stop_reason === 'refusal') {
    return { status: 200, body: { findings: [], summary: 'The review could not be completed for this lesson. Try again later.', usage: usageOf(message) } }
  }
  const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
  let parsed: { findings?: ClaudeFinding[]; summary?: string }
  try {
    parsed = JSON.parse(text)
  } catch {
    return { status: 200, body: { findings: [], summary: 'The review came back in a form the app could not read. Try again.', usage: usageOf(message) } }
  }
  const validIds = new Set(questions.map(q => q.id))
  const findings = (parsed.findings || []).map(f => ({
    questionId: f.questionId && validIds.has(f.questionId) ? f.questionId : null,
    kind: f.kind || 'other',
    message: (f.message || '').replace(/—/g, ', ').trim(),
    suggestedAnswer: f.suggestedAnswer || null,
  })).filter(f => f.message)

  return {
    status: 200,
    body: {
      findings,
      summary: (parsed.summary || (findings.length === 0 ? 'Looks good.' : `${findings.length} thing${findings.length === 1 ? '' : 's'} to check.`)).replace(/—/g, ', '),
      usage: usageOf(message),
    },
  }
}

function usageOf(m: Anthropic.Message) {
  return { input: m.usage?.input_tokens ?? 0, output: m.usage?.output_tokens ?? 0 }
}

function describeType(t: string | null | undefined): string {
  switch (t || 'upload') {
    case 'questions': return 'students answer the questions on the platform (digital answers, checked against the key)'
    case 'both': return 'students answer digital questions on the platform AND upload a photo of show-work problems'
    case 'none': return 'video only, nothing to submit'
    case 'worksheet':
    case 'upload':
    default: return 'paper work: students print the questions (or do book work) and upload a photo'
  }
}
