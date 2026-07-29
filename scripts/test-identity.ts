/**
 * Tests for student identity resolution in app/lib/identity.ts.
 *
 * The unit tests below are nearly trivial — `studentKey` is one field access.
 * The value is in the SOURCE SCAN at the bottom, which is the actual regression
 * guard: the bug this file exists to prevent is not a broken helper, it is
 * someone reaching for `signInDetails.loginId` again at a call site.
 *
 * That mistake is invisible in review (the email looks like a reasonable
 * identifier), silent at runtime (queries return an empty list rather than an
 * error), and it is what broke every student view after the Gen 2 migration.
 *
 * Run: node --experimental-strip-types scripts/test-identity.ts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { studentKey } from '../app/lib/identity.ts'

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

const SUB = 'a4e87448-4041-702f-416c-65f605c9d0ed'

console.log('\nstudentKey')
eq('returns the Cognito sub', studentKey({ userId: SUB }), SUB)
eq('no user yet', studentKey(null), '')
eq('undefined user', studentKey(undefined), '')
eq('user without a sub', studentKey({}), '')

// The whole point: signInDetails must never win. Amplify populates it only from
// the tokens cached at sign-in, so it is present on a fresh login and gone
// after a refresh — the same account would write an email, then a sub.
console.log('\nstudentKey — email is never the identity')
eq(
  'signInDetails present alongside a sub',
  studentKey({ userId: SUB, signInDetails: { loginId: 'student@example.com' } } as any),
  SUB
)
eq(
  'signInDetails present with no sub is still empty, not the email',
  studentKey({ signInDetails: { loginId: 'student@example.com' } } as any),
  ''
)

// ─── Source scan ────────────────────────────────────────────────────────────
//
// Flags any line that assigns something named *studentId* / *ownerId* from
// signInDetails. Legitimate uses of loginId as an EMAIL — display strings,
// profile lookup by email address — do not match, because they are not named
// after the identity column.

const SKIP_DIRS = new Set(['node_modules', '.next', '.git'])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(full)) out.push(full)
  }
  return out
}

console.log('\nsource scan — no studentId is derived from an email')

const offenders: string[] = []
for (const file of walk('app')) {
  if (file.endsWith('app/lib/identity.ts')) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/\b(studentId|ownerId|msgStudentId)\b\s*[:=][^=]/.test(line) && /signInDetails/.test(line)) {
      offenders.push(`${file}:${i + 1}  ${line.trim()}`)
    }
  })
}

if (offenders.length === 0) {
  passed++
  console.log('  \x1b[32m✓\x1b[0m no call site derives studentId from signInDetails')
} else {
  failed++
  console.log('  \x1b[31m✗\x1b[0m studentId derived from an email — use studentKey() instead:')
  for (const o of offenders) console.log(`      ${o}`)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
