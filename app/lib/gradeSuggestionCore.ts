import Anthropic from '@anthropic-ai/sdk'

/**
 * AI grade suggestion — the model call and everything around it.
 *
 * Lives here, framework-free, because it has TWO hosts that must never drift:
 *
 *   - app/api/grade-suggestion/route.ts — the original Next route. Amplify
 *     Hosting kills SSR requests at a hard 30 seconds, and Opus with thinking
 *     takes ~50s on a two-photo submission, so in production this host only
 *     survives small submissions. Kept as the fallback for local dev and for
 *     clients running against a stale amplify_outputs.json.
 *   - amplify/functions/grade-suggestion/handler.ts — a Lambda behind a
 *     function URL with a 5-minute timeout, called directly from the browser.
 *     This is the host production actually uses (2026-08-23, after Melinda's
 *     first real grading click on Opus 5 timed out as an empty-body response).
 *
 * The hosts own transport concerns only: auth, credentials, request/response
 * framing. Prompts, grading rules, parsing, and the Anthropic call are all in
 * here so a wording fix lands in both places by construction.
 */

export type GradeSuggestionInput = {
  imageKeys?: string[]
  questions: { id?: string; questionText: string; questionType: string; correctAnswer?: string | null }[]
  studentName?: string
  lessonTitle?: string
  teachingVoice?: string
  answers?: Record<string, string>       // student's digital answers by questionId
  teachingNotes?: string                 // Abeka/curriculum method notes from the lesson template
  lockedResults?: Record<string, boolean> // teacher's manual overrides to preserve
  recentComments?: string[]              // this student's most recent graded comments, for variety
  instructions?: string                  // the assignment instructions the student saw
}

export type GradeSuggestionDeps = {
  anthropic: Anthropic
  /** Presigned GET url for a key in the submissions bucket. */
  presignSubmission: (key: string) => Promise<string>
}

export type GradeSuggestionResult = {
  status: 200 | 400
  body:
    | { grade: string; comment: string; questionResults: { id: string; correct: boolean }[] }
    | { error: string }
}

/**
 * The comment is shown to students as plain text, never rendered. The prompt
 * forbids LaTeX, but the question data the model reads is full of it, so slips
 * happen — translate the common constructs to teacher-on-paper notation.
 */
export function stripLatex(s: string): string {
  const superscripts: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
  return s
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\sqrt\s*/g, '√')
    .replace(/\\cdot/g, '×')
    .replace(/\\times/g, '×')
    .replace(/\\left|\\right/g, '')
    .replace(/\^\{?(\d)\}?/g, (_, d) => superscripts[d] || `^${d}`)
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    // Dollar delimiters around math — drop the delimiters, keep the content
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\$/g, '')
}

export async function generateGradeSuggestion(
  input: GradeSuggestionInput,
  deps: GradeSuggestionDeps
): Promise<GradeSuggestionResult> {
  const {
    imageKeys, questions, studentName, lessonTitle, teachingVoice,
    answers, teachingNotes, lockedResults, recentComments, instructions,
  } = input

  const locked: Record<string, boolean> = lockedResults || {}

  const hasFiles = !!(imageKeys && imageKeys.length > 0)
  const hasAnswers = !!(answers && Object.keys(answers).length > 0)

  if (!hasFiles && !hasAnswers) {
    return { status: 400, body: { error: 'No submission content to review — no photos or digital answers found.' } }
  }

  // ── Build question list ────────────────────────────────────────────────
  const questionList = questions.filter(q => q.questionType !== 'section_header')

  const hasLocked = Object.keys(locked).length > 0

  // ── Locked results summary (teacher's confirmed calls) ─────────────────
  let lockedSummary = ''
  if (hasLocked) {
    let qNum = 0
    const lines = questionList.map(q => {
      if (!q.id || !(q.id in locked)) return null
      qNum++
      const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
      const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
      const text = bookNumMatch ? bookNumMatch[2] : q.questionText
      return `  [id:${q.id}] ${label} ${text} → Teacher confirmed: ${locked[q.id] ? 'CORRECT ✓' : 'WRONG ✗'}`
    }).filter(Boolean)
    if (lines.length > 0) {
      lockedSummary = `TEACHER-CONFIRMED RESULTS (do NOT change these — include them in your grade and comment):\n${lines.join('\n')}`
    }
  }

  // ── Digital answers summary (unlocked questions only) ──────────────────
  let digitalSummary = ''
  {
    let qNum = 0
    const lines = questionList
      .filter(q => q.questionType !== 'show_work')
      .map(q => {
        qNum++
        if (q.id && q.id in locked) return null  // skip locked
        const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
        const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
        const text = bookNumMatch ? bookNumMatch[2] : q.questionText
        const studentAnswer = q.id ? ((answers || {})[q.id] || '(no answer)') : '(no answer)'
        const correctHint = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
        return `  [id:${q.id}] ${label} ${text}\n     → Student answered: ${studentAnswer}${correctHint}`
      }).filter(Boolean)
    if (lines.length > 0) {
      digitalSummary = `DIGITAL ANSWERS TO GRADE (compare student answers to [correct:] values if provided):\n${lines.join('\n\n')}`
    }
  }

  // ── Show-work questions list (unlocked only) ───────────────────────────
  const showWorkQuestions = questionList.filter(q => q.questionType === 'show_work' && !(q.id && q.id in locked))
  const showWorkCount = showWorkQuestions.length
  let showWorkSummary = ''
  if (showWorkCount > 0) {
    if (hasFiles) {
      let swNum = 0
      const lines = showWorkQuestions.map(q => {
        swNum++
        const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
        const label = bookNumMatch ? bookNumMatch[1] : `${swNum}.`
        const text = bookNumMatch ? bookNumMatch[2] : q.questionText
        const correctHint = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
        return `  [id:${q.id}] ${label} ${text}${correctHint}`
      })
      const photoCount = (imageKeys as string[]).length
      showWorkSummary = `SHOW-WORK QUESTIONS TO GRADE (student wrote answers on paper — see the ${photoCount} uploaded photo${photoCount > 1 ? 's' : ''}):\n${lines.join('\n')}\nExamine all uploaded photos carefully. The student may have spread their work across multiple sheets. Find each question number and mark it correct or wrong.`
    } else {
      showWorkSummary = `SHOW-WORK QUESTIONS: This assignment had ${showWorkCount} show-work problem(s) but the student did NOT upload a photo. Mark all show-work questions as wrong (false).`
    }
  }

  // ── Voice/style instruction ────────────────────────────────────────────
  const voiceInstruction = teachingVoice?.trim()
    ? teachingVoice.trim()
    : 'Write in a warm, encouraging, direct tone. Point out the specific mistake and explain the correct approach.'

  const curriculumSection = teachingNotes?.trim()
    ? `\nCURRICULUM METHOD (Abeka — grade against this method, not other approaches):\n${teachingNotes.trim()}`
    : ''

  const lockedCount = Object.keys(locked).length
  const lockedInstruction = lockedCount > 0
    ? `\nIMPORTANT: The teacher has already reviewed and confirmed ${lockedCount} question${lockedCount > 1 ? 's' : ''} (marked TEACHER-CONFIRMED above). Do NOT include those in questionResults — they are final. DO factor them into your grade calculation and comment.`
    : ''

  // Extract the student's first name for personalized greeting
  const firstName = (studentName || '').trim().split(/\s+/)[0] || ''

  const systemPrompt = `You are writing feedback for a homeschool math student on behalf of their teacher, Melinda. You are NOT a grading robot — you are speaking AS Melinda, in her voice, with her teaching style.

TEACHER'S VOICE & STYLE:
${voiceInstruction}${curriculumSection}

═══════════════════════════════════════════════════════════════
HOW TO WRITE THE COMMENT — THIS IS THE MOST IMPORTANT PART
═══════════════════════════════════════════════════════════════

The comment is what the student reads. It must sound like a real teacher who actually taught the lesson — not generic AI praise.

STRUCTURE (in this order):
1. Greet the student by first name and praise something specific they got right. Vary how you open — a greeting is not a formula. Sometimes lead with the specific thing they did well, sometimes with the name, sometimes with an observation about their progress.
2. For each topic/problem they got WRONG, walk through the actual procedure step-by-step. Don't just state the right answer — TEACH the method. Show the work the way a teacher would explain it at the board.
3. End with brief encouragement.

WHAT MAKES GREAT FEEDBACK (these are the standards to match):

EXAMPLE OF GREAT FEEDBACK:
"Great job, Meredith! Your radical terminology and trigonometry work was solid. It looks like the simplifying of expressions was confusing.
For instance the square root of 169p² simplifies into 13p. You break 169 into (13)(13) and then write p² with fractional exponents then simplify the fraction. That's how many variables come out.
For the square root of x⁸, you write it with fractional exponents x to the 8/2 power which simplifies to x⁴.
Finally, the square root of 2 does not have two identical factors that multiply together, meaning it doesn't come out as an integer. Therefore, it's irrational."

NOTICE WHAT THIS DOES:
- Names the student
- Specific praise ("radical terminology and trigonometry work")
- For EACH wrong problem: explains the WHY and the HOW (break into factors, fractional exponents, simplify)
- Uses phrases like "for instance", "you write it with", "that's how"
- Treats the student like they can learn — gives them the process, not just the answer
- Length matches the depth needed (4–8 sentences total is typical, longer if many wrong)

EXAMPLE OF BAD FEEDBACK (DO NOT WRITE LIKE THIS):
"Great effort on this test! You showed strong understanding of vocabulary terms. Let's work together on simplifying square roots — remember that √(x⁸) = x⁴, not √(x³). Keep practicing, you'll get them down!"

WHY IT'S BAD: Doesn't name the student. Just states the right answer instead of TEACHING the method. Generic encouragement filler. Student learns nothing from "remember that X = Y."

═══════════════════════════════════════════════════════════════
MATH NOTATION IN THE COMMENT — PLAIN TEXT ONLY
═══════════════════════════════════════════════════════════════
The comment is displayed as PLAIN TEXT. It is never rendered as LaTeX or
markdown. The question data you receive is full of LaTeX ("$9^2 - (3+1)^3$",
"\\frac{3}{4}", "\\sqrt{16}") — do NOT copy that notation into the comment.
Translate it:
- NEVER use dollar signs, backslash commands, \\( \\), or markdown in the comment.
- Exponents: use unicode superscripts (9², x³, p⁸) or words ("nine squared").
- Roots: use the √ symbol (√16) or words ("the square root of 16").
- Fractions: plain slash form (3/4) or words ("three fourths").
- Multiplication: × or words — never \\cdot or *.
A student (and Melinda) reading "$9^2$" as literal text finds it confusing —
write the way a teacher writes on paper.

═══════════════════════════════════════════════════════════════
DO NOT REPEAT YOURSELF — RECENT COMMENTS TO THIS STUDENT
═══════════════════════════════════════════════════════════════
${Array.isArray(recentComments) && recentComments.length > 0 ? `This student has already received the comments below (most recent first). A student who gets twenty nearly identical notes stops reading them. Write THIS comment with a different opening, different praise phrasing, and a different closing than any of these. Same warm teacher, fresh words.

${recentComments.map((c: string, i: number) => `--- previous comment ${i + 1} ---\n${c}`).join('\n')}` : 'No prior comments available for this student — write naturally.'}

═══════════════════════════════════════════════════════════════
GRADING RULES
═══════════════════════════════════════════════════════════════
1. Grade on a 0–100 scale. Every non-header question has equal weight (including teacher-confirmed ones).
2. DIGITAL questions: if a [correct:] value is given, compare the student's answer. If no [correct:] is given, use your own math knowledge to evaluate. Blank answer = wrong.
3. SHOW-WORK questions: examine every uploaded image carefully. Find each question number on the worksheet and evaluate the student's written work. Mark true or false — do not skip any show-work question.
4. A blank digital answer or missing problem = wrong (false).
5. Never give 100% unless every question is clearly correct.${lockedInstruction}

═══════════════════════════════════════════════════════════════
GRADE ONLY WHAT WAS ASSIGNED
═══════════════════════════════════════════════════════════════
Students often photograph an ENTIRE textbook or workbook page. That page may
show many problems that were NOT assigned — the assignment instructions (and
the question list above, when present) define exactly which problems count.
- A problem visible in the photo but not assigned is NOT missing work. Do not
  mark it wrong, do not lower the grade for it, and do not mention it.
- NEVER solve, explain, or give the answer to an unassigned problem in the
  comment — unassigned problems may be a future assignment, and handing the
  student those answers ruins it. Teach only the assigned problems.
- If there is no question list, the ASSIGNMENT INSTRUCTIONS in the user message
  are the complete definition of what to grade: find exactly those problems in
  the photos and grade only them.

═══════════════════════════════════════════════════════════════
READING HANDWRITTEN WORK
═══════════════════════════════════════════════════════════════
These are children's handwritten math pages. Digits are easy to misread —
4 vs 9, 1 vs 7, 6 vs 0, 5 vs 8, 2 vs Z. Before marking any answer wrong:
1. Re-read the digit in context: does the student's own work on that problem
   (their intermediate steps, carrying, borrowing) tell you which digit they
   meant? A "9" at the end of work that computes to 4 is almost always a 4.
2. Check against the [correct:] value when one is given — if the handwriting
   could plausibly read as the correct answer AND the visible work supports
   it, give the student the benefit of the doubt and mark it correct.
3. Only mark wrong when the math itself is wrong, not when the penmanship is
   merely hard to read. If a digit is truly illegible and the work gives no
   clue, say so briefly in the comment instead of guessing against the student.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════
Return ONLY a JSON object — no markdown fences, no preamble:
{
  "grade": "73",
  "comment": "Greet ${firstName || 'the student'} by name. Praise specifics. Then teach each wrong problem step-by-step using the method. End with brief encouragement.",
  "questionResults": [
    {"id": "EXACT_QUESTION_ID", "correct": true},
    {"id": "EXACT_QUESTION_ID", "correct": false}
  ]
}

"questionResults" is REQUIRED, never optional. It MUST contain exactly one {"id","correct"} entry for EVERY question you were asked to grade — every digital question AND every show-work question — using the exact [id:...] values from the question list. Exclude only teacher-confirmed questions. On a long test this array is large; include it anyway, in full. A response without a complete questionResults array is invalid. Per-question judgments in the comment are NOT a substitute for the array — the teacher's grading screen paints each question green or red from this array and shows nothing without it. The "comment" field can be multiple paragraphs — use \\n between paragraphs for readability when many problems need explanation.`

  const userParts: string[] = [
    `Student: ${studentName || 'Unknown'}`,
    `Lesson: ${lessonTitle || 'Unknown'}`,
  ]
  if (typeof instructions === 'string' && instructions.trim()) {
    userParts.push(`ASSIGNMENT INSTRUCTIONS (what the student was told to do — grade ONLY this):\n${instructions.trim()}`)
  }
  if (lockedSummary) userParts.push(lockedSummary)
  if (digitalSummary) userParts.push(digitalSummary)
  if (showWorkSummary) userParts.push(showWorkSummary)
  if (hasFiles) {
    const photoCount = (imageKeys as string[]).length
    userParts.push(`The ${photoCount > 1 ? `${photoCount} uploaded photos show` : 'uploaded photo shows'} the student's handwritten show-work sheet${photoCount > 1 ? 's' : ''}. Use ${photoCount > 1 ? 'all of them' : 'it'} to grade the show-work questions listed above.`)
  }

  const userPrompt = userParts.join('\n\n')

  // ── Build file blocks (images + PDFs) ─────────────────────────────────
  const fileBlocks: Anthropic.MessageParam['content'] = []
  if (hasFiles) {
    const keys = (imageKeys as string[]).slice(0, 8)
    const blocks = await Promise.all(keys.map(async (key) => {
      const isPdf = key.toLowerCase().endsWith('.pdf')
      const url = await deps.presignSubmission(key)
      if (isPdf) {
        const res = await fetch(url)
        const buffer = await res.arrayBuffer()
        const data = Buffer.from(buffer).toString('base64')
        return { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
      }
      return { type: 'image' as const, source: { type: 'url' as const, url } }
    }))
    fileBlocks.push(...blocks)
  }

  const content: Anthropic.MessageParam['content'] = [
    ...fileBlocks,
    { type: 'text' as const, text: userPrompt },
  ]

  // Opus 5: adaptive thinking is on by default, which is exactly what careful
  // reading of handwritten pages needs. Thinking tokens count against
  // max_tokens, hence the headroom above the ~1-2K JSON answer.
  async function callModel(messages: Anthropic.MessageParam[]): Promise<{ parsed: any; rawText: string }> {
    const message = await deps.anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8000,
      system: systemPrompt,
      messages,
    })
    // With thinking enabled, content[0] is a thinking block — find the text block.
    const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    // Strip markdown code fences if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    // Extract JSON object even if there's preamble text (e.g. "Looking at the work... {}")
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart > 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
    }
    return { parsed: JSON.parse(cleaned), rawText: text }
  }

  let { parsed, rawText } = await callModel([{ role: 'user', content }])

  // On question-heavy submissions (chapter tests: ~17 questions, mostly
  // show-work) the model has been observed pouring everything into the comment
  // and omitting questionResults entirely — which leaves the teacher's grading
  // screen with no green/red per-question marks. One corrective retry, keeping
  // the first response's grade and comment as context, reliably recovers it.
  const expectedResults = questionList.filter(q => !(q.id && q.id in locked)).length
  if (expectedResults > 0 && !(Array.isArray(parsed.questionResults) && parsed.questionResults.length > 0)) {
    const retry = await callModel([
      { role: 'user', content },
      { role: 'assistant', content: [{ type: 'text', text: rawText }] },
      {
        role: 'user',
        content: `Your response omitted the required "questionResults" array. Respond again with ONLY the complete JSON object — keep the same "grade" and "comment", and add "questionResults" with exactly ${expectedResults} entries, one {"id": "...", "correct": true|false} per question you graded, using the exact [id:...] values from the question list.`,
      },
    ])
    if (Array.isArray(retry.parsed.questionResults) && retry.parsed.questionResults.length > 0) {
      parsed = { ...parsed, ...retry.parsed }
    }
  }

  return {
    status: 200,
    body: {
      grade: parsed.grade || '',
      comment: stripLatex(parsed.comment || ''),
      questionResults: parsed.questionResults || [],
    },
  }
}
