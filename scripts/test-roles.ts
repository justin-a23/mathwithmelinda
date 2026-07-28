/**
 * Tests for role resolution in app/lib/roles.ts.
 *
 * Shared by the login redirect and the page guard, so a mistake here either
 * strands someone on the wrong dashboard or lets them onto a section that
 * isn't theirs.
 *
 * Run: node --experimental-strip-types scripts/test-roles.ts
 */

import { roleFromGroups, homeFor } from '../app/lib/roles.ts'

let passed = 0
let failed = 0

function eq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
  } else {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${name} — expected ${expected}, got ${actual}`)
  }
}

console.log('\nroleFromGroups')
eq('teacher group', roleFromGroups(['teacher']), 'teacher')
eq('parent group', roleFromGroups(['parent']), 'parent')
eq('no group is a student', roleFromGroups([]), 'student')
eq('undefined is a student', roleFromGroups(undefined), 'student')
eq('null is a student', roleFromGroups(null), 'student')
eq('explicit student group still a student', roleFromGroups(['student']), 'student')
eq('unrecognised group is a student', roleFromGroups(['admin']), 'student')

console.log('\nroleFromGroups — precedence when multiple groups')
eq('teacher beats parent', roleFromGroups(['parent', 'teacher']), 'teacher')
eq('teacher beats parent regardless of order', roleFromGroups(['teacher', 'parent']), 'teacher')
eq('teacher beats student', roleFromGroups(['student', 'teacher']), 'teacher')
eq('parent beats student', roleFromGroups(['student', 'parent']), 'parent')

console.log('\nhomeFor')
eq('teacher home', homeFor('teacher'), '/teacher')
eq('parent home', homeFor('parent'), '/parent')
eq('student home', homeFor('student'), '/dashboard')

console.log('\nguard behaviour (actualRole !== requiredRole ⇒ redirect)')
const cases: [string[], 'teacher' | 'student' | 'parent', string | null][] = [
  [['teacher'], 'teacher', null],
  [['teacher'], 'student', '/teacher'],
  [['teacher'], 'parent', '/teacher'],
  [['parent'], 'parent', null],
  [['parent'], 'student', '/parent'],
  [['parent'], 'teacher', '/parent'],
  [[], 'student', null],
  [[], 'teacher', '/dashboard'],
  [[], 'parent', '/dashboard'],
]
for (const [groups, required, expected] of cases) {
  const actual = roleFromGroups(groups)
  const redirect = actual !== required ? homeFor(actual) : null
  eq(`[${groups.join(',') || 'none'}] on a ${required} page → ${expected ?? 'allowed'}`, redirect, expected)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
