/**
 * Standalone tests for the shared print order and the "Check my week"
 * deterministic checks.
 *
 * Run:    npx tsx scripts/test-week-check.ts
 *   (tsx, not bare node: the libs import each other without extensions.)
 *
 * Exits non-zero if any assertion fails.
 */

import { bookNumber, simulateStudentPrint, sortForPrint, studentPrintSubset, teacherPrintSubset, displayNumbers } from '../app/lib/printOrder.ts'
import { checkLesson, checkWeek, unmatchedDollar, lessonContentKey, type CheckLesson, type CheckSlot } from '../app/lib/weekCheck.ts'

let passed = 0
let failed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ok   ${name}`) }
  catch (e: any) { failed++; console.log(`  FAIL ${name}\n       ${e?.message || e}`) }
}
function eq(a: unknown, b: unknown, label = '') {
  const A = JSON.stringify(a), B = JSON.stringify(b)
  if (A !== B) throw new Error(`${label ? label + ': ' : ''}expected ${B}, got ${A}`)
}
function has(findings: { message: string }[], re: RegExp) {
  if (!findings.some(f => re.test(f.message))) throw new Error(`no finding matching ${re} in:\n${findings.map(f => '         ' + f.message).join('\n')}`)
}
function hasNot(findings: { message: string }[], re: RegExp) {
  const hit = findings.find(f => re.test(f.message))
  if (hit) throw new Error(`unexpected finding "${hit.message}"`)
}

const q = (id: string, order: number, questionText: string, questionType = 'show_work', extra: Partial<CheckLesson['questions'][0]> = {}) =>
  ({ id, order, questionText, questionType, choices: null, correctAnswer: null, diagramKey: null, diagramSpec: null, ...extra })

const slotOk: CheckSlot = { day: 'Monday', dueDate: '2026-10-06', dueTime: '17:00', isPublished: true, isInClass: false, instructions: 'Do the problems.', videoUrl: 'https://cdn/video.mp4' }
const ctx = { weekStartDate: '2026-10-05', today: '2026-10-02' }

console.log('printOrder')
test('decimals are not book problem numbers (the Test 2 bug)', () => {
  eq(bookNumber('2.5% of 40'), null)
  eq(bookNumber('12. Solve for x'), 12)
  eq(bookNumber('0. nothing'), null)
})
test('Test 2 shape prints in build order', () => {
  // Header, then bare decimals and percents: none carry book numbers, so paper = screen.
  const qs = [q('h', 1, 'Write each number as a percent.', 'section_header'), q('a', 2, '0.05'), q('b', 3, '2.5%'), q('c', 4, '52.3'), q('d', 5, '4.75')]
  const printed = simulateStudentPrint(qs, 'upload')
  eq(printed.map(p => p.q.id), ['h', 'a', 'b', 'c', 'd'])
  eq(printed.map(p => p.label), [null, '#1.', '#2.', '#3.', '#4.'])
})
test('book-numbered problems sort by number, headers stick to the question after them', () => {
  const qs = [q('h1', 1, 'Part A', 'section_header'), q('a', 2, '12. twelve'), q('b', 3, '3. three'), q('h2', 4, 'Part B', 'section_header'), q('c', 5, '7. seven'), q('d', 6, 'unnumbered')]
  // h1 travels with "12." (the question after it), h2 with "7."; unnumbered goes last
  eq(sortForPrint(qs).map(x => x.id), ['b', 'h2', 'c', 'h1', 'a', 'd'])
})
test('student print subset: paper keeps everything, digital keeps show_work only', () => {
  const qs = [q('h', 1, 'Header', 'section_header'), q('a', 2, 'digital', 'number'), q('b', 3, 'work')]
  eq(studentPrintSubset(qs, 'upload').map(x => x.id), ['h', 'a', 'b'])
  eq(studentPrintSubset(qs, 'worksheet').map(x => x.id), ['h', 'a', 'b'])
  eq(studentPrintSubset(qs, 'questions').map(x => x.id), ['b'])
  eq(studentPrintSubset(qs, 'both').map(x => x.id), ['b'])
  eq(studentPrintSubset(qs, null).map(x => x.id), ['h', 'a', 'b'])
})
test('teacher print subset keeps the header above a show_work question', () => {
  const qs = [q('h', 1, 'Header', 'section_header'), q('a', 2, 'digital', 'number'), q('b', 3, 'work')]
  eq(teacherPrintSubset(qs, 'questions').map(x => x.id), ['h', 'b'])
  eq(teacherPrintSubset(qs, 'worksheet').map(x => x.id), ['h', 'a', 'b'])
})
test('display numbers skip section headers', () => {
  const qs = [q('h', 1, 'H', 'section_header'), q('a', 2, 'A'), q('h2', 3, 'H2', 'section_header'), q('b', 4, 'B')]
  eq([...displayNumbers(qs).entries()], [['a', 1], ['b', 2]])
})

console.log('weekCheck: lesson')
const good: CheckLesson = { id: 'L1', title: 'Lesson 5', lessonNumber: 5, instructions: 'Do all.', assignmentType: 'upload', worksheetUrl: null, videoUrl: 'v', teachingNotes: null,
  questions: [q('h', 1, 'Add.', 'section_header'), q('a', 2, '1. $2+2$'), q('b', 3, '2. $3+3$')] }
test('a clean paper lesson has no findings', () => {
  eq(checkLesson(good, slotOk, ctx), [])
})
test('paper order differing from screen order is flagged at the first difference', () => {
  const lesson = { ...good, questions: [q('a', 1, '8. eight'), q('b', 2, '1. one'), q('c', 3, '9. nine')] }
  const f = checkLesson(lesson, slotOk, ctx)
  has(f, /different order than the screen/)
  has(f, /problem 1\. comes 1st; on screen it is 2nd/)
  eq(f.find(x => /different order/.test(x.message))!.questionId, 'b')
})
test('digital lessons are not order-checked (nothing prints but show_work)', () => {
  const lesson = { ...good, assignmentType: 'questions', questions: [q('a', 1, '8. eight', 'number', { correctAnswer: '8' }), q('b', 2, '1. one', 'number', { correctAnswer: '1' })] }
  hasNot(checkLesson(lesson, slotOk, ctx), /different order/)
})
test('blank question, blank header, duplicate, empty header', () => {
  const lesson = { ...good, questions: [q('h', 1, 'Add.', 'section_header'), q('h2', 2, 'Subtract.', 'section_header'), q('a', 3, 'same  thing'), q('b', 4, 'Same thing'), q('c', 5, '   '), q('h3', 6, '', 'section_header'), q('h4', 7, 'Tail', 'section_header')] }
  const f = checkLesson(lesson, slotOk, ctx)
  has(f, /header "Add\." has no questions under it/)
  has(f, /Question 2 is the same as Question 1/)
  has(f, /Question 3 is blank/)
  has(f, /section header has no text/)
  has(f, /header "Tail" has no questions under it/)
})
test('unmatched $ is flagged, escaped and $$ are not', () => {
  eq(unmatchedDollar('costs \\$5'), false)
  eq(unmatchedDollar('$$x^2$$'), false)
  eq(unmatchedDollar('$x^2'), true)
  eq(unmatchedDollar('$x$ and $y$'), false)
  const lesson = { ...good, questions: [q('a', 1, 'Solve $x^2 = 4')] }
  has(checkLesson(lesson, slotOk, ctx), /Question 1 has an unmatched \$/)
})
test('math renderer errors are reported through the callback', () => {
  const lesson = { ...good, questions: [q('a', 1, 'bad $\\frac{1}$')] }
  const f = checkLesson(lesson, slotOk, { ...ctx, mathErrors: t => t.includes('\\frac{1}$') ? ['Expected group after \\frac'] : [] })
  has(f, /math that will not display: Expected group/)
})
test('answer key required only for digital answers', () => {
  const digital = { ...good, assignmentType: 'questions', questions: [q('a', 1, 'What is 2+2?', 'number'), q('b', 2, 'Pick', 'multiple_choice', { choices: 'only one', correctAnswer: 'A' }), q('c', 3, 'Show work', 'show_work')] }
  const f = checkLesson(digital, slotOk, ctx)
  has(f, /Question 1 has no answer in the answer key/)
  has(f, /Question 2 is multiple choice but has fewer than two choices/)
  hasNot(f, /Question 3/)
  const paper = { ...good, questions: [q('a', 1, 'What is 2+2?', 'number')] }
  hasNot(checkLesson(paper, slotOk, ctx), /answer key/)
})
test('nothing for the student to do', () => {
  const lesson = { ...good, questions: [], instructions: '', worksheetUrl: null }
  has(checkLesson(lesson, { ...slotOk, instructions: '' }, ctx), /nothing to do/)
  hasNot(checkLesson({ ...lesson, assignmentType: 'none' }, { ...slotOk, instructions: '' }, ctx), /nothing to do/)
  has(checkLesson({ ...lesson, assignmentType: 'worksheet' }, slotOk, ctx), /no worksheet file is attached/)
})
test('video missing, dates, publish', () => {
  const lesson = { ...good, videoUrl: null }
  const f = checkLesson(lesson, { ...slotOk, videoUrl: '', dueDate: '2026-10-04', isPublished: false, dueTime: '' }, ctx)
  has(f, /No video is attached/)
  has(f, /is a Sunday/)
  has(f, /before the week starts/)
  has(f, /No due time/)
  has(f, /Publish is not checked/)
  has(checkLesson(good, { ...slotOk, dueDate: '2026-09-30' }, ctx), /already in the past/)
  has(checkLesson(good, { ...slotOk, dueDate: '' }, ctx), /no due date/)
  eq(checkLesson(good, { ...slotOk, videoUrl: '' }, ctx), [], 'lesson video covers a blank slot video')
})

console.log('weekCheck: week')
test('empty week, duplicates, gaps, non-Monday start', () => {
  eq(checkWeek([], ctx).map(f => f.message), ['No lessons are chosen for this week.'])
  const rows = [
    { slot: { ...slotOk, day: 'Monday' }, lesson: good },
    { slot: { ...slotOk, day: 'Tuesday' }, lesson: null },
    { slot: { ...slotOk, day: 'Wednesday' }, lesson: good },
  ]
  const f = checkWeek(rows, { ...ctx, weekStartDate: '2026-10-06' })
  has(f, /scheduled more than once \(Monday and Wednesday\)/)
  has(f, /Tuesday has no lesson but the days around it do/)
  has(f, /is a Tuesday, not a Monday/)
  eq(checkWeek([{ slot: slotOk, lesson: good }], ctx), [])
})
test('content key changes when the answer key changes and ignores question ids order', () => {
  const a = lessonContentKey(good)
  const b = lessonContentKey({ ...good, questions: good.questions.map(x => x.id === 'a' ? { ...x, correctAnswer: '4' } : x) })
  if (a === b) throw new Error('key did not change')
  eq(lessonContentKey({ ...good, questions: [...good.questions].reverse() }), a, 'order-insensitive input')
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
