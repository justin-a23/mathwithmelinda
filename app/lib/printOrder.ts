/**
 * The ONE place that decides which questions a printed worksheet shows and in
 * what order. Three callers must agree or students get a different paper than
 * the screen shows:
 *
 *   - app/lessons/page.tsx            the student's "Print worksheet" button
 *   - app/teacher/library/[courseId]  the teacher's preview / Participation Worksheet
 *   - app/lib/weekCheck.ts            "Check my week" simulates the student print
 *
 * History: on 2026-09-28 MS Math Test 2 printed starting at problem #8 because
 * the sort treated "2.5%" as book problem #2. The fix (51c6007) had to be made
 * twice, once per page; the checker would have been a third copy. Hence this.
 */

export type PrintableQuestion = {
  id: string
  order: number
  questionText: string
  questionType: string
}

/** "12. text" is textbook problem 12. A bare decimal like "2.5%" is not. */
export function bookNumber(questionText: string): number | null {
  const m = questionText.match(/^(\d+)\.\s/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return n > 0 ? n : null
}

/**
 * Digital (on-screen) order: stored `order` ascending. Section headers stay in
 * place; question numbering on screen skips them.
 */
export function digitalOrder<Q extends PrintableQuestion>(questions: Q[]): Q[] {
  return [...questions].sort((a, b) => a.order - b.order)
}

/**
 * The subset of a lesson that goes on the STUDENT's printed worksheet.
 *   worksheet / upload (paper-only)  -> every question, headers included
 *   digital or both                  -> show_work questions only
 * Mirrors printShowWorkSheet in app/lessons/page.tsx.
 */
export function studentPrintSubset<Q extends PrintableQuestion>(questions: Q[], assignmentType: string | null | undefined): Q[] {
  const aType = assignmentType || 'upload'
  const isWorksheetType = aType === 'worksheet' || aType === 'upload'
  return isWorksheetType ? [...questions] : questions.filter(q => q.questionType === 'show_work')
}

/**
 * The subset the TEACHER's preview prints: paper lessons print everything;
 * digital lessons print show_work questions plus the header directly above
 * each. Mirrors previewWorksheet in the library editor.
 */
export function teacherPrintSubset<Q extends PrintableQuestion>(questions: Q[], assignmentType: string | null | undefined): Q[] {
  const aType = assignmentType === 'worksheet' ? 'upload' : (assignmentType || 'upload')
  if (aType === 'upload') return [...questions]
  const result: Q[] = []
  let pendingHeader: Q | null = null
  for (const q of questions) {
    if (q.questionType === 'section_header') { pendingHeader = q }
    else if (q.questionType === 'show_work') {
      if (pendingHeader) { result.push(pendingHeader); pendingHeader = null }
      result.push(q)
    }
  }
  return result
}

/**
 * Print order: by textbook problem number when the question starts with one
 * ("12. ..."), otherwise after all numbered problems in stored order. Section
 * headers stick to the question that follows them. Input must already be in
 * digital order (stored `order` ascending) so the header lookahead is right.
 */
export function sortForPrint<Q extends PrintableQuestion>(questions: Q[]): Q[] {
  const list = [...questions]
  const keys = new Map<string, number>()
  for (let i = list.length - 1; i >= 0; i--) {
    const q = list[i]
    if (q.questionType === 'section_header') {
      const nextKey = (i + 1 < list.length) ? (keys.get(list[i + 1].id) ?? list[i + 1].order) : q.order
      keys.set(q.id, nextKey - 0.5)
    } else {
      const num = bookNumber(q.questionText)
      keys.set(q.id, num !== null ? num : q.order + 10000)
    }
  }
  return list.sort((a, b) => (keys.get(a.id) ?? 0) - (keys.get(b.id) ?? 0))
}

/**
 * Display numbers shared by the screen, the student print and the teacher
 * pages: count questions in digital order, skipping section headers. Legacy
 * scan-imported lessons encode order as pageIndex*1000 + seq and keep a
 * page-relative label instead (handled by the callers).
 */
export function displayNumbers<Q extends PrintableQuestion>(questions: Q[]): Map<string, number> {
  const nums = new Map<string, number>()
  digitalOrder(questions)
    .filter(q => q.questionType !== 'section_header')
    .forEach((q, i) => nums.set(q.id, i + 1))
  return nums
}

/**
 * The label a student sees next to a printed problem: the book number when
 * the text carries one, else "#N" from the display numbering.
 */
export function printLabel<Q extends PrintableQuestion>(q: Q, nums: Map<string, number>): string {
  const m = q.questionText.match(/^(\d+\.)\s/)
  if (m) return m[1]
  if (q.order >= 1000) return `#${q.order % 1000}.`
  return `#${nums.get(q.id) ?? q.order}.`
}

/**
 * Everything the student print will show, in order, with labels. This is
 * what "Check my week" compares against the on-screen order.
 */
export function simulateStudentPrint<Q extends PrintableQuestion>(questions: Q[], assignmentType: string | null | undefined): { q: Q; label: string | null }[] {
  const ordered = digitalOrder(questions)
  const subset = studentPrintSubset(ordered, assignmentType)
  const nums = displayNumbers(questions)
  return sortForPrint(subset).map(q => ({
    q,
    label: q.questionType === 'section_header' ? null : printLabel(q, nums),
  }))
}
