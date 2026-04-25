/**
 * Standalone test script for the lesson markdown parser.
 *
 * Run:    node --experimental-strip-types scripts/test-lesson-parser.ts
 *   (Node 22.18+ doesn't need the flag — type-stripping is on by default.)
 *
 * Exits non-zero if any assertion fails.
 */

import { parseLessonMarkdown } from '../app/lib/lessonMarkdownParser.ts'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  [32m✓[0m ${name}`)
  } catch (err: any) {
    failed++
    console.log(`  [31m✗[0m ${name}`)
    console.log(`      ${err?.message || err}`)
  }
}

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) throw new Error(`${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

const HEADER = `# Lesson 1 — Test
**Course:** Algebra 1
**Assignment type:** questions
**Lesson category:** lesson

## Assignment
`

console.log('\nlessonMarkdownParser tests')
console.log('─'.repeat(48))

// ── 1. H/Q interleaved ──────────────────────────────────────────────
test('H1, Q1, Q2, H2, Q3 → 3 questions + 2 headers', () => {
  const md = HEADER + `
### H1 — section_header
**Part I**

### Q1 — short_text
**One**
- Answer: 1

### Q2 — short_text
**Two**
- Answer: 2

### H2 — section_header
**Part II**

### Q3 — short_text
**Three**
- Answer: 3
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no errors')
  const qs = r.questions.filter(q => q.type !== 'section_header')
  const hs = r.questions.filter(q => q.type === 'section_header')
  assertEq(qs.length, 3, 'question count')
  assertEq(hs.length, 2, 'header count')
  assertEq(qs[0].displayLabel, 'Q1', 'first Q labeled Q1')
  assertEq(qs[1].displayLabel, 'Q2', 'second Q labeled Q2')
  assertEq(qs[2].displayLabel, 'Q3', 'third Q labeled Q3')
  assertEq(hs[0].displayLabel, 'H1', 'first H labeled H1')
  assertEq(hs[1].displayLabel, 'H2', 'second H labeled H2')
  // Source order preserved
  assertEq(r.questions[0].displayLabel, 'H1', 'source order: H1 first')
  assertEq(r.questions[3].displayLabel, 'H2', 'source order: H2 fourth')
})

// ── 2. No headers, all questions ────────────────────────────────────
test('All Q, no H — parses normally', () => {
  const md = HEADER + `
### Q1 — short_text
**One**
- Answer: 1

### Q2 — short_text
**Two**
- Answer: 2
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no errors')
  assertEq(r.questions.length, 2, 'question count')
  assertEq(r.questions.every(q => q.type !== 'section_header'), true, 'no section headers')
})

// ── 3. Legacy Q1 — section_header → warn, accept ────────────────────
test('Legacy "Q1 — section_header" warns and remaps to H1', () => {
  const md = HEADER + `
### Q1 — section_header
**Part I**

### Q1 — short_text
**One**
- Answer: 1
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no fatal errors (legacy is a warning)')
  const headers = r.questions.filter(q => q.type === 'section_header')
  const questions = r.questions.filter(q => q.type !== 'section_header')
  assertEq(headers.length, 1, '1 header from legacy')
  assertEq(questions.length, 1, '1 question')
  assertEq(headers[0].displayLabel, 'H1', 'legacy header relabeled H1')
  assert(r.warnings.some(w => /backward compatibility|H-prefix/i.test(w)), 'deprecation warning emitted')
})

// ── 4. Two consecutive headers ──────────────────────────────────────
test('H1 then H2 with no Q between still parses', () => {
  const md = HEADER + `
### H1 — section_header
**Part I**

### H2 — section_header
**Part II**

### Q1 — short_text
**One**
- Answer: 1
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no errors')
  assertEq(r.questions.filter(q => q.type === 'section_header').length, 2, '2 headers')
})

// ── 5. Numbering gap → warn but parse ───────────────────────────────
test('Q1 then Q3 emits warning but parses', () => {
  const md = HEADER + `
### Q1 — short_text
**One**
- Answer: 1

### Q3 — short_text
**Three**
- Answer: 3
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no errors')
  assertEq(r.questions.length, 2, 'parsed both')
  assert(r.warnings.some(w => /out of sequence/i.test(w)), 'gap warning emitted')
})

// ── 6. Duplicates → error ───────────────────────────────────────────
test('Duplicate Q1 produces an error', () => {
  const md = HEADER + `
### Q1 — short_text
**One**
- Answer: 1

### Q1 — short_text
**One again**
- Answer: 1
`
  const r = parseLessonMarkdown(md)
  assert(r.errors.length > 0, 'has errors')
  assert(r.errors.some(e => /Duplicate.*Q1/i.test(e)), 'duplicate Q1 error')
})

test('Duplicate H1 produces an error', () => {
  const md = HEADER + `
### H1 — section_header
**Part I**

### H1 — section_header
**Also Part I**

### Q1 — short_text
**One**
- Answer: 1
`
  const r = parseLessonMarkdown(md)
  assert(r.errors.length > 0, 'has errors')
  assert(r.errors.some(e => /Duplicate.*H1/i.test(e)), 'duplicate H1 error')
})

// ── 7. Source order preserved (not sorted by H/Q num) ───────────────
test('Source order is canonical render order', () => {
  const md = HEADER + `
### Q1 — short_text
**One**
- Answer: 1

### H1 — section_header
**Mid section**

### Q2 — short_text
**Two**
- Answer: 2
`
  const r = parseLessonMarkdown(md)
  assertEq(r.questions[0].displayLabel, 'Q1', 'first item is Q1')
  assertEq(r.questions[1].displayLabel, 'H1', 'second item is H1 (mid)')
  assertEq(r.questions[2].displayLabel, 'Q2', 'third item is Q2')
})

// ── 8. Diagram spec parse ───────────────────────────────────────────
test('Diagram fenced JSON survives parsing', () => {
  const md = HEADER + `
### Q1 — short_text
**Use the graph.**
- Diagram:
  \`\`\`json
  {"type": "coord-plane", "xRange": [-6, 10], "yRange": [-8, 6], "lines": [{"slope": -3, "intercept": 3, "label": "y = -3x + 3"}]}
  \`\`\`
- Answer: (2, -3)
`
  const r = parseLessonMarkdown(md)
  assertEq(r.errors.length, 0, 'no errors')
  const q = r.questions[0]
  assert(q.diagramSpec, 'diagram spec parsed')
  const spec = JSON.parse(q.diagramSpec!)
  assertEq(spec.type, 'coord-plane', 'spec type')
  assertEq(spec.lines[0].slope, -3, 'slope preserved')
})

console.log('─'.repeat(48))
console.log(`${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
