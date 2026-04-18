/**
 * Parses a lesson markdown file (produced by Melinda's Claude Project)
 * into a normalized structure the import API can consume.
 *
 * Expected shape (loose — only the "Assignment" section is strictly parsed):
 *
 *   # Lesson N — Title
 *
 *   **Book section covered:** ...
 *   **Est. video length:** ...
 *   **Course:** Algebra 1            (optional frontmatter-style hint)
 *   **Assignment type:** both        (optional — defaults to 'both')
 *   **Lesson category:** lesson      (optional — defaults to 'lesson')
 *
 *   ## Video plan
 *   ...free-form content, stored as `instructions`...
 *
 *   ## Assignment
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
 *   ### Q3 — short_text [with diagram]
 *   **Plot the numbers on the number line.**
 *   - Diagram:
 *     ```json
 *     {"type":"number-line","range":[-5,5],"points":[{"value":-3},{"value":2}]}
 *     ```
 *   - Answer: -3 < 2
 *
 * Question types recognized (must match what the lesson editor uses):
 *   number, short_text, multiple_choice, multiple_choice_multi, show_work
 */

export type ParsedQuestion = {
  order: number
  type: 'number' | 'short_text' | 'multiple_choice' | 'multiple_choice_multi' | 'show_work' | 'section_header'
  text: string
  choices?: string[]
  correctAnswer?: string
  diagramSpec?: string
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
  questions: ParsedQuestion[]
  warnings: string[]          // non-fatal issues to show the teacher
}

const KNOWN_TYPES = new Set(['number', 'short_text', 'multiple_choice', 'multiple_choice_multi', 'show_work', 'section_header'])

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
  const lines = raw.split(/\r?\n/)

  // ── Parse the header block ─────────────────────────────────────────────
  let title = ''
  let lessonNumberLabel = ''
  let lessonNumber: number | null = null
  let courseHint: string | null = null
  let assignmentType = 'both'
  let lessonCategory = 'lesson'
  let inAssignment = false
  let inTeachingNotes = false
  let instructionsLines: string[] = []
  let teachingNotesLines: string[] = []
  const questionBlocks: string[][] = []
  let currentBlock: string[] | null = null

  // Match "# Lesson N — Title" or "# Lesson N - Title"
  for (const ln of lines) {
    const titleMatch = ln.match(/^#\s+(?:Lesson\s+([\w.]+)\s*[—–-]\s*)?(.+)$/i)
    if (titleMatch && !title) {
      lessonNumberLabel = (titleMatch[1] || '').trim()
      title = titleMatch[2].trim()
      if (lessonNumberLabel) {
        // Pull the first integer we can find, "1.5a" → 1, "Lesson 14" → 14
        const numMatch = lessonNumberLabel.match(/^(\d+)/)
        if (numMatch) lessonNumber = parseInt(numMatch[1], 10)
      }
      continue
    }
  }

  // ── Walk line-by-line to split into sections ──────────────────────────
  let section: 'header' | 'instructions' | 'assignment' | 'teaching-notes' = 'header'
  for (const ln of lines) {
    // Check for inline metadata at the top
    if (section === 'header') {
      const course = extractLabel(ln, 'Course')
      if (course) { courseHint = course; continue }
      const at = extractLabel(ln, 'Assignment type')
      if (at) { assignmentType = at.toLowerCase(); continue }
      const lc = extractLabel(ln, 'Lesson category')
      if (lc) { lessonCategory = lc.toLowerCase(); continue }
    }

    // Section transitions (exact ## headings)
    if (/^##\s+(Video plan|Teaching notes|Instructions)/i.test(ln)) {
      section = 'instructions'
      instructionsLines.push(ln)
      continue
    }
    if (/^##\s+Assignment\b/i.test(ln)) {
      section = 'assignment'
      continue
    }
    if (/^##\s+(Answer key|Content mapping|Copyright trail|Teaching notes for Melinda)/i.test(ln)) {
      section = 'teaching-notes'
      teachingNotesLines.push(ln)
      continue
    }

    if (section === 'instructions') {
      instructionsLines.push(ln)
    } else if (section === 'assignment') {
      // "### Q1 — multiple_choice" or "### Q1 multiple_choice"
      const qHeader = ln.match(/^###\s+Q?(\d+)\s*[—–-]?\s*(\w+)/i)
      if (qHeader) {
        currentBlock = [ln]
        questionBlocks.push(currentBlock)
      } else if (currentBlock) {
        currentBlock.push(ln)
      }
    } else if (section === 'teaching-notes') {
      teachingNotesLines.push(ln)
    }
  }

  // ── Parse each question block ─────────────────────────────────────────
  const questions: ParsedQuestion[] = []
  for (const block of questionBlocks) {
    const header = block[0]
    const hm = header.match(/^###\s+Q?(\d+)\s*[—–-]?\s*(\w+)/i)
    if (!hm) continue
    const order = parseInt(hm[1], 10)
    const typeRaw = hm[2].toLowerCase()
    const type = KNOWN_TYPES.has(typeRaw) ? typeRaw as ParsedQuestion['type'] : 'short_text'
    if (!KNOWN_TYPES.has(typeRaw)) {
      warnings.push(`Q${order}: unknown type "${typeRaw}" — defaulted to short_text.`)
    }

    // Question text: first bolded line OR first non-bullet/non-heading line
    let text = ''
    const bodyLines = block.slice(1)
    for (const ln of bodyLines) {
      const boldMatch = ln.match(/^\*\*(.+)\*\*\s*$/)
      if (boldMatch) { text = boldMatch[1]; break }
      // Or first line that's not a bullet, not blank, not a fenced code
      if (ln.trim() && !/^[-*]\s/.test(ln) && !/^```/.test(ln)) {
        text = ln.trim()
        break
      }
    }

    // Choices: "- Choices: a | b | c"
    const choicesLine = bodyLines.find(ln => /^\s*[-*]\s+Choices:/i.test(ln))
    const choicesRaw = choicesLine ? extractField(choicesLine, 'Choices') : null
    const choices = choicesRaw ? choicesRaw.split(/\s*\|\s*/).map(c => c.trim()).filter(Boolean) : undefined

    // Answer
    const answerLine = bodyLines.find(ln => /^\s*[-*]\s+Answer:/i.test(ln))
    const correctAnswer = answerLine ? extractField(answerLine, 'Answer') || undefined : undefined

    // Diagram spec: either inline "- Diagram: {json}" or a fenced ```json block after "- Diagram:"
    let diagramSpec: string | undefined
    const diagramInlineLine = bodyLines.find(ln => /^\s*[-*]\s+Diagram:\s*\{/.test(ln))
    if (diagramInlineLine) {
      const m = diagramInlineLine.match(/Diagram:\s*(\{.+\})\s*$/)
      if (m) diagramSpec = m[1]
    }
    if (!diagramSpec) {
      // Look for Diagram: label followed by a fenced json block
      for (let i = 0; i < bodyLines.length; i++) {
        if (/^\s*[-*]\s+Diagram:\s*$/i.test(bodyLines[i])) {
          // Find the opening fence
          let j = i + 1
          while (j < bodyLines.length && !/^\s*```(?:json)?\s*$/.test(bodyLines[j])) j++
          if (j < bodyLines.length) {
            // Collect until closing fence
            const specLines: string[] = []
            j++
            while (j < bodyLines.length && !/^\s*```\s*$/.test(bodyLines[j])) {
              specLines.push(bodyLines[j])
              j++
            }
            diagramSpec = specLines.join('\n').trim()
            break
          }
        }
      }
    }
    // Validate JSON if present
    if (diagramSpec) {
      try {
        const parsed = JSON.parse(diagramSpec)
        if (!parsed.type) warnings.push(`Q${order}: diagram spec is missing "type".`)
      } catch {
        warnings.push(`Q${order}: diagram spec is not valid JSON — will not render.`)
        diagramSpec = undefined
      }
    }

    // Validation warnings
    if (!text) warnings.push(`Q${order}: no question text found.`)
    if ((type === 'multiple_choice' || type === 'multiple_choice_multi') && !choices) {
      warnings.push(`Q${order}: multiple-choice question has no "Choices:" line.`)
    }
    if (type !== 'show_work' && type !== 'section_header' && !correctAnswer) {
      warnings.push(`Q${order}: no "Answer:" provided — auto-grading will be limited.`)
    }

    questions.push({ order, type, text, choices, correctAnswer, diagramSpec })
  }

  // Sort by order
  questions.sort((a, b) => a.order - b.order)

  if (questions.length === 0) {
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
  }
}
