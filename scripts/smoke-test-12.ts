/**
 * Smoke test: simulate the user's Test 12 (Pre-Algebra Systems of Equations)
 * with 6 H sections + 20 Q questions, exactly as the new format prescribes.
 *
 *   I.   Identify a solution to a system (Q1–Q3)
 *   II.  Read solutions off pre-drawn graphs (Q4–Q6)
 *   III. Solve by graphing (Q7–Q9)
 *   IV.  Isolate y (Q10–Q12)
 *   V.   Solve by substitution (Q13–Q16)
 *   VI.  Solve by elimination (Q17–Q20)
 */

import { parseLessonMarkdown } from '../app/lib/lessonMarkdownParser.ts'

const md = `# Lesson 12 — Test: Systems of Equations
**Course:** Pre-Algebra
**Assignment type:** questions
**Lesson category:** test

## Video plan
Recap.

## Assignment

### H1 — section_header
**Part I — Identify the solution**

### Q1 — multiple_choice
**Which ordered pair is the correct solution to \\(y = x + 1\\) and \\(y = 2x - 3\\)?**
- Choices: (4, 5) | (1, 2)
- Answer: (4, 5)

### Q2 — multiple_choice
**Which ordered pair is the correct solution to \\(x + y = 8\\) and \\(x - y = 4\\)?**
- Choices: (4, 4) | (6, 2)
- Answer: (6, 2)

### Q3 — multiple_choice
**Which ordered pair is the correct solution to \\(2x - 3y = 6\\) and \\(x + 3y = -6\\)?**
- Choices: (0, -2) | (1, 2)
- Answer: (0, -2)

### H2 — section_header
**Part II — Read solutions off the graph**

### Q4 — short_text
**Use the graph for \\(y = -3x + 3\\) and \\(y = 2x - 7\\).**
- Answer: (2, -3)

### Q5 — short_text
**Use the graph for \\(y = x + 5\\) and \\(y = 6x\\).**
- Answer: (1, 6)

### Q6 — short_text
**Use the graph for \\(y = -\\frac{1}{3}x + 4\\) and \\(y = -\\frac{2}{3}x + 3\\).**
- Answer: (-3, 5)

### H3 — section_header
**Part III — Solve by graphing**

### Q7 — short_text
**Solve by graphing: \\(y = 2x + 5\\) and \\(y = -4x + 5\\).**
- Answer: (0, 5)

### Q8 — short_text
**Solve by graphing: \\(y = x + 2\\) and \\(y = \\frac{1}{3}x\\).**
- Answer: (-3, -1)

### Q9 — short_text
**Solve by graphing: \\(y = -4x + 7\\) and \\(y = \\frac{1}{2}x - 2\\).**
- Answer: (2, -1)

### H4 — section_header
**Part IV — Isolate y**

### Q10 — short_text
**Isolate y in \\(x + y = 12\\).**
- Answer: \\(y = -x + 12\\)

### Q11 — short_text
**Isolate y in \\(y - 4x = 8\\).**
- Answer: \\(y = 4x + 8\\)

### Q12 — short_text
**Isolate y in \\(y - 4x = 0\\).**
- Answer: \\(y = 4x\\)

### H5 — section_header
**Part V — Solve by substitution**

### Q13 — short_text
**Substitution: \\(y = x + 1\\) and \\(y + x = 3\\).**
- Answer: (1, 2)

### Q14 — short_text
**Substitution: \\(y = 2x - 4\\) and \\(x = 3\\).**
- Answer: (3, 2)

### Q15 — short_text
**Substitution: \\(y = 3x + 2\\) and \\(3x + y = 8\\).**
- Answer: (1, 5)

### Q16 — short_text
**Substitution: \\(y = 4x + 1\\) and \\(5x + y = 10\\).**
- Answer: (1, 5)

### H6 — section_header
**Part VI — Solve by elimination**

### Q17 — short_text
**Elimination: \\(x + y = 8\\) and \\(x - y = 4\\).**
- Answer: (6, 2)

### Q18 — short_text
**Elimination: \\(x + y = 28\\) and \\(x - y = 6\\).**
- Answer: (17, 11)

### Q19 — short_text
**Elimination: \\(x + 4y = 21\\) and \\(-x + y = 4\\).**
- Answer: (1, 5)

### Q20 — short_text
**Elimination: \\(5x + 5y = 7\\) and \\(5x - 5y = 3\\).**
- Answer: \\(\\left(1, \\frac{2}{5}\\right)\\)
`

const r = parseLessonMarkdown(md)

const headers = r.questions.filter(q => q.type === 'section_header')
const questions = r.questions.filter(q => q.type !== 'section_header')

console.log(`Title: ${r.title}`)
console.log(`Lesson: #${r.lessonNumber}`)
console.log(`Headers: ${headers.length} — ${headers.map(h => h.displayLabel).join(', ')}`)
console.log(`Questions: ${questions.length} — ${questions[0]?.displayLabel}–${questions[questions.length - 1]?.displayLabel}`)
console.log(`Errors: ${r.errors.length}`)
console.log(`Warnings: ${r.warnings.length}`)
if (r.warnings.length) r.warnings.forEach(w => console.log(`  ⚠ ${w}`))
if (r.errors.length) r.errors.forEach(e => console.log(`  ✗ ${e}`))

let ok = true
if (headers.length !== 6) { console.log(`FAIL: expected 6 headers, got ${headers.length}`); ok = false }
if (questions.length !== 20) { console.log(`FAIL: expected 20 questions, got ${questions.length}`); ok = false }
if (questions[0].displayLabel !== 'Q1') { console.log(`FAIL: first question is ${questions[0].displayLabel}, not Q1`); ok = false }
if (questions[19].displayLabel !== 'Q20') { console.log(`FAIL: last question is ${questions[19].displayLabel}, not Q20`); ok = false }
if (r.errors.length) ok = false

console.log(ok ? '\n✓ smoke test passed' : '\n✗ smoke test failed')
process.exit(ok ? 0 : 1)
