/**
 * Parses a lesson markdown file (produced by Melinda's Claude Project)
 * into a normalized structure the import API can consume.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Header vs Question identifiers
 * ─────────────────────────────────────────────────────────────────────────
 *  - `### H1 — section_header`, `### H2 — section_header`, ...
 *      visual section dividers. Numbering is independent and starts at 1.
 *      Headers do NOT count toward the question total.
 *
 *  - `### Q1 — <type>`, `### Q2 — <type>`, ...   (type ≠ section_header)
 *      actual questions. Numbering is independent and starts at 1.
 *
 * Legacy form `### Q\d+ — section_header` is accepted with a deprecation
 * warning so previously-authored lessons keep importing — it gets reassigned
 * to the next available H-number.
 *
 * Example:
 *
 *   # Lesson N — Title
 *
 *   **Course:** Algebra 1
 *   **Assignment type:** both
 *   **Lesson category:** lesson
 *
 *   ## Video plan
 *   ...free-form, stored as `instructions`...
 *
 *   ## Assignment
 *
 *   ### H1 — section_header
 *   **Part I — Multiple choice**
 *
 *   ### Q1 — multiple_choice_multi
 *   **Classify 301.**
 *   - Choices: natural | whole | integer | rational | irrational
 *   - Answer: natural | whole | integer | rational
 *
 *   ### Q2 — short_text
 *   **Express 5/8 as a decimal.**
 *   - Answer: 0.625
 *
 *   ### H2 — section_header
 *   **Part II — Free response**
 *
 *   ### Q3 — short_text
 *   **Plot the numbers on the number line.**
 *   - Diagram:
 *     ```json
 *     {"type":"number-line","range":[-5,5],"points":[{"value":-3},{"value":2}]}
 *     ```
 *   - Answer: -3 < 2
 *
 * Question types recognized (must match what the lesson editor uses):
 *   number, short_text, multiple_choice, multiple_choice_multi, show_work,
 *   section_header
 */

export type ParsedQuestion = {
  /** 1-based source position — stable order for DB persistence. */
  order: number
  type: 'number' | 'short_text' | 'multiple_choice' | 'multiple_choice_multi' | 'show_work' | 'section_header'
  text: string
  choices?: string[]
  correctAnswer?: string
  diagramSpec?: string
  /** Author-facing label, e.g. "Q1" or "H1". Used by the preview UI. */
  displayLabel?: string
  /** For questions only: 1-based number among questions (skips headers). */
  questionNumber?: number
  /** For headers only: 1-based number among headers (skips questions). */
  headerNumber?: number
}

export type ParsedLesson = {
  title: string
  lessonNumber: number | null
  lessonNumberLabel: string   // what the user typed (e.g. "1.5a")
  instructions: string        // full video plan + teaching notes section
  teachingNotes: string       // just the "Teaching notes for Melinda" section if present
  courseHint: string | null   // user-provided course title if any
  assignmentType: string      // 'both' | 'upload' | 'questions'
  lessonCategory: string      // 'lesson' | 'quiz' | 'test'
  questions: ParsedQuestion[] // questions + headers, interleaved in source order
  warnings: string[]          // non-fatal issues to show the teacher
  errors: string[]            // fatal — the import API must refuse to publish
}

const QUESTION_TYPES = new Set([
  'number',
  'short_text',
  'multiple_choice',
  'multiple_choice_multi',
  'show_work',
])
const ALL_TYPES = new Set([...QUESTION_TYPES, 'section_header'])

// ─────────────────────────────────────────────────────────────────────────────

/** Extract the value after a **label:** pattern from a line, if present. */
function extractLabel(line: string, label: string): string | null {
  const re = new RegExp(`\\*\\*${label}:?\\*\\*\\s*(.+)$`, 'i')
  const m = line.match(re)
  return m ? m[1].trim() : null
}

/** Parse a bulleted field like "- Choices: a | b | c" — returns value after "Field:" */
function extractField(line: string, field: string): string | null {
  const re = new RegExp(`^\\s*[-*]\\s+${field}:\\s*(.+)$`, 'i')
  const m = line.match(re)
  return m ? m[1].trim() : null
}

// ─────────────────────────────────────────────────────────────────────────────

export function parseLessonMarkdown(raw: string): ParsedLesson {
  const warnings: string[] = []
  const errors: string[] = []
  const lines = raw.split(/\r?\n/)

  // ── Parse the title line ──────────────────────────────────────────────
  let title = ''
  let lessonNumberLabel = ''
  let lessonNumber: number | null = null
  let courseHint: string | null = null
  let assignmentType = 'both'
  let lessonCategory = 'lesson'
  let instructionsLines: string[] = []
  let teachingNotesLines: string[] = []
  type Block = { header: string; body: string[] }
  const blocks: Block[] = []
  let currentBlock: Block | null = null

  for (const ln of lines) {
    const titleMatch = ln.match(/^#\s+(?:Lesson\s+([\w.]+)\s*[—–-]\s*)?(.+)$/i)
    if (titleMatch && !title) {
      lessonNumberLabel = (titleMatch[1] || '').trim()
      title = titleMatch[2].trim()
      if (lessonNumberLabel) {
        const numMatch = lessonNumberLabel.match(/^(\d+)/)
        if (numMatch) lessonNumber = parseInt(numMatch[1], 10)
      }
      continue
    }
  }

  // ── Walk line-by-line to split into sections ──────────────────────────
  let section: 'header' | 'instructions' | 'assignment' | 'teaching-notes' = 'header'
  for (const ln of lines) {
    if (section === 'header') {
      const course = extractLabel(ln, 'Course')
      if (course) { courseHint = course; continue }
      const at = extractLabel(ln, 'Assignment type')
      if (at) { assignmentType = at.toLowerCase(); continue }
      const lc = extractLabel(ln, 'Lesson category')
      if (lc) { lessonCategory = lc.toLowerCase(); continue }
    }

    if (/^##\s+(Video plan|Teaching notes|Instructions)/i.test(ln)) {
      section = 'instructions'
      instructionsLines.push(ln)
      continue
    }
    if (/^##\s+Assignment\b/i.test(ln)) {
      section = 'assignment'
      currentBlock = null
      continue
    }
    if (/^##\s+(Answer key|Content mapping|Copyright trail|Teaching notes for Melinda)/i.test(ln)) {
      section = 'teaching-notes'
      currentBlock = null
      teachingNotesLines.push(ln)
      continue
    }

    if (section === 'instructions') {
      instructionsLines.push(ln)
    } else if (section === 'assignment') {
      // "### H1 — section_header" or "### Q1 — multiple_choice"
      const qHeader = ln.match(/^###\s+([HQ])(\d+)\s*[—–\-:]?\s*(\w+)/i)
      if (qHeader) {
        currentBlock = { header: ln, body: [] }
        blocks.push(currentBlock)
      } else if (currentBlock) {
        currentBlock.body.push(ln)
      }
    } else if (section === 'teaching-notes') {
      teachingNotesLines.push(ln)
    }
  }

  // ── Parse each block ─────────────────────────────────────────
  const questions: ParsedQuestion[] = []
  const seenQ = new Set<number>()
  const seenH = new Set<number>()
  let questionCounter = 0
  let headerCounter = 0
  let sourceOrder = 0

  for (const block of blocks) {
    sourceOrder++
    const hm = block.header.match(/^###\s+([HQ])(\d+)\s*[—–\-:]?\s*(\w+)/i)
    if (!hm) continue
    const prefix = hm[1].toUpperCase()
    const declaredNum = parseInt(hm[2], 10)
    const typeRaw = hm[3].toLowerCase()

    // Validate prefix/type combinations
    let kind: 'header' | 'question'
    let type: ParsedQuestion['type']

    if (prefix === 'H') {
      kind = 'header'
      type = 'section_header'
      if (typeRaw !== 'section_header') {
        warnings.push(`H${declaredNum}: H-prefix is reserved for section_header, but type was "${typeRaw}". Treating as section_header.`)
      }
    } else {
      // Q prefix
      if (typeRaw === 'section_header') {
        // Legacy form — accept with deprecation warning, reassign to H-numbering
        kind = 'header'
        type = 'section_header'
        warnings.push(`Q${declaredNum}: section_header should now use the H-prefix (e.g. "### H${headerCounter + 1} — section_header"). Accepted for backward compatibility.`)
      } else if (QUESTION_TYPES.has(typeRaw)) {
        kind = 'question'
        type = typeRaw as ParsedQuestion['type']
      } else {
        kind = 'question'
        type = 'short_text'
        warnings.push(`Q${declaredNum}: unknown type "${typeRaw}" — defaulted to short_text.`)
      }
    }

    // Numbering checks (per stream, not strict on the legacy reassign case)
    if (kind === 'header') {
      headerCounter++
      if (prefix === 'H') {
        if (seenH.has(declaredNum)) {
          errors.push(`Duplicate identifier H${declaredNum} — section header numbers must be unique.`)
        } else {
          seenH.add(declaredNum)
          if (declaredNum !== headerCounter) {
            warnings.push(`H${declaredNum} is out of sequence — expected H${headerCounter}.`)
          }
        }
      }
    } else {
      questionCounter++
      if (seenQ.has(declaredNum)) {
        errors.push(`Duplicate identifier Q${declaredNum} — question numbers must be unique.`)
      } else {
        seenQ.add(declaredNum)
        if (declaredNum !== questionCounter) {
          warnings.push(`Q${declaredNum} is out of sequence — expected Q${questionCounter}.`)
        }
      }
    }

    // ── Pull body fields ────────────────────────────────────────────
    let text = ''
    for (const ln of block.body) {
      const boldMatch = ln.match(/^\*\*(.+)\*\*\s*$/)
      if (boldMatch) { text = boldMatch[1]; break }
      if (ln.trim() && !/^[-*]\s/.test(ln) && !/^```/.test(ln)) {
        text = ln.trim()
        break
      }
    }

    const choicesLine = block.body.find(ln => /^\s*[-*]\s+Choices:/i.test(ln))
    const choicesRaw = choicesLine ? extractField(choicesLine, 'Choices') : null
    const choices = choicesRaw ? choicesRaw.split(/\s*\|\s*/).map(c => c.trim()).filter(Boolean) : undefined

    const answerLine = block.body.find(ln => /^\s*[-*]\s+Answer:/i.test(ln))
    const correctAnswer = answerLine ? extractField(answerLine, 'Answer') || undefined : undefined

    let diagramSpec: string | undefined
    const diagramInlineLine = block.body.find(ln => /^\s*[-*]\s+Diagram:\s*\{/.test(ln))
    if (diagramInlineLine) {
      const m = diagramInlineLine.match(/Diagram:\s*(\{.+\})\s*$/)
      if (m) diagramSpec = m[1]
    }
    if (!diagramSpec) {
      for (let i = 0; i < block.body.length; i++) {
        if (/^\s*[-*]\s+Diagram:\s*$/i.test(block.body[i])) {
          let j = i + 1
          while (j < block.body.length && !/^\s*```(?:json)?\s*$/.test(block.body[j])) j++
          if (j < block.body.length) {
            const specLines: string[] = []
            j++
            while (j < block.body.length && !/^\s*```\s*$/.test(block.body[j])) {
              specLines.push(block.body[j])
              j++
            }
            diagramSpec = specLines.join('\n').trim()
            break
          }
        }
      }
    }
    if (diagramSpec) {
      try {
        const parsed = JSON.parse(diagramSpec)
        if (!parsed.type) warnings.push(`${kind === 'header' ? 'H' : 'Q'}${declaredNum}: diagram spec is missing "type".`)
      } catch {
        warnings.push(`${kind === 'header' ? 'H' : 'Q'}${declaredNum}: diagram spec is not valid JSON — will not render.`)
        diagramSpec = undefined
      }
    }

    // ── Per-kind validation ─────────────────────────────────────────
    const idLabel = kind === 'header' ? `H${headerCounter}` : `Q${questionCounter}`
    if (!text) warnings.push(`${idLabel}: no ${kind === 'header' ? 'header' : 'question'} text found.`)
    if (kind === 'question') {
      if ((type === 'multiple_choice' || type === 'multiple_choice_multi') && !choices) {
        warnings.push(`${idLabel}: multiple-choice question has no "Choices:" line.`)
      }
      if (type !== 'show_work' && !correctAnswer) {
        warnings.push(`${idLabel}: no "Answer:" provided — auto-grading will be limited.`)
      }
    }

    questions.push({
      order: sourceOrder,
      type,
      text,
      choices,
      correctAnswer,
      diagramSpec,
      displayLabel: idLabel,
      questionNumber: kind === 'question' ? questionCounter : undefined,
      headerNumber: kind === 'header' ? headerCounter : undefined,
    })
  }

  // Sort by source order — this is the canonical render order
  questions.sort((a, b) => a.order - b.order)

  if (questions.filter(q => q.type !== 'section_header').length === 0) {
    warnings.push('No questions found — make sure there is an "## Assignment" section with "### Q1 — type" subheadings.')
  }
  if (!title) warnings.push('No lesson title found. Expected "# Lesson N — Title" as the first heading.')

  return {
    title,
    lessonNumber,
    lessonNumberLabel,
    instructions: instructionsLines.join('\n').trim(),
    teachingNotes: teachingNotesLines.join('\n').trim(),
    courseHint,
    assignmentType,
    lessonCategory,
    questions,
    warnings,
    errors,
  }
}
