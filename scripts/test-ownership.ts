/**
 * Tests for the S3 object authorization rules in app/lib/ownershipRules.ts.
 *
 * These decide whether one student can reach another's uploaded work, so the
 * interesting cases are the denials: traversal, cross-student reads, and using
 * the avatar endpoint to reach the submissions sharing its bucket.
 *
 * Run: node --experimental-strip-types scripts/test-ownership.ts
 * Exits non-zero if any assertion fails.
 */

import type { AuthUser } from '../app/lib/auth.ts'
import {
  canReadSubmissionKeyGiven,
  canReadProfileKey,
  ownsSubmissionPrefix,
  isStructurallySafeKey,
} from '../app/lib/ownershipRules.ts'

let passed = 0
let failed = 0

function check(name: string, actual: boolean, expected: boolean) {
  if (actual === expected) {
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
  } else {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${name} — expected ${expected}, got ${actual}`)
  }
}

const STUDENT = 'hannah@example.com'
const SIBLING = 'meredith@example.com'
const STRANGER = 'someone.else@example.com'

const teacher: AuthUser = { userId: 'teacher-sub', groups: ['teacher'], role: 'teacher' }
const student: AuthUser = { userId: 'student-sub', groups: ['student'], role: 'student' }
const parent: AuthUser = { userId: 'parent-sub', groups: ['parent'], role: 'parent' }
const unknown: AuthUser = { userId: 'nobody-sub', groups: [], role: 'unknown' }

const own = `submissions/${STUDENT}/lesson-1/123-work.jpg`
const others = `submissions/${STRANGER}/lesson-1/123-work.jpg`
const siblingKey = `submissions/${SIBLING}/lesson-1/123-work.jpg`

console.log('\nsubmissions — role access')
check('teacher reads any submission', canReadSubmissionKeyGiven(teacher, others, []), true)
check('student reads own submission', canReadSubmissionKeyGiven(student, own, [STUDENT]), true)
check("student CANNOT read another's", canReadSubmissionKeyGiven(student, others, [STUDENT]), false)
check('student with no profile denied', canReadSubmissionKeyGiven(student, own, []), false)
check('parent reads linked child', canReadSubmissionKeyGiven(parent, own, [STUDENT, SIBLING]), true)
check('parent reads second child', canReadSubmissionKeyGiven(parent, siblingKey, [STUDENT, SIBLING]), true)
check('parent CANNOT read unlinked', canReadSubmissionKeyGiven(parent, others, [STUDENT, SIBLING]), false)
check('parent with no links denied', canReadSubmissionKeyGiven(parent, own, []), false)
check('ungrouped user denied', canReadSubmissionKeyGiven(unknown, own, [STUDENT]), false)
check('ungrouped denied even if email supplied', canReadSubmissionKeyGiven(unknown, own, [STUDENT]), false)

console.log('\nsubmissions — own avatar')
check('student reads own avatar', canReadSubmissionKeyGiven(student, 'profiles/student-sub.jpg', []), true)
check("student CANNOT read another's avatar", canReadSubmissionKeyGiven(student, 'profiles/teacher-sub.jpg', []), false)

console.log('\nstructural safety')
check('traversal denied for student', canReadSubmissionKeyGiven(student, 'submissions/../../etc/passwd', [STUDENT]), false)
check('traversal denied even for teacher', canReadSubmissionKeyGiven(teacher, 'submissions/../secrets', []), false)
check('leading slash denied for teacher', canReadSubmissionKeyGiven(teacher, '/submissions/x', []), false)
check('empty key denied', canReadSubmissionKeyGiven(teacher, '', []), false)
check('isStructurallySafeKey rejects ..', isStructurallySafeKey('a/../b'), false)
check('isStructurallySafeKey accepts normal', isStructurallySafeKey('submissions/a@b.com/1/x.jpg'), true)

console.log('\nprefix matching must be exact')
check(
  'email-prefix lookalike denied',
  canReadSubmissionKeyGiven(student, `submissions/${STUDENT}.attacker.net/x/y.jpg`, [STUDENT]),
  false
)
check('bare email without trailing slash denied', ownsSubmissionPrefix(`submissions/${STUDENT}`, STUDENT), false)
check('case-insensitive email match', ownsSubmissionPrefix(`submissions/HANNAH@EXAMPLE.COM/l/x.jpg`, STUDENT), true)
check('empty entitled email never matches', ownsSubmissionPrefix('submissions//l/x.jpg', ''), false)

console.log('\navatars')
check('teacher reads any avatar', canReadProfileKey(teacher, 'profiles/student-sub.jpg'), true)
check('student reads own avatar', canReadProfileKey(student, 'profiles/student-sub.jpg'), true)
check("student CANNOT read another's avatar", canReadProfileKey(student, 'profiles/other-sub.jpg'), false)
check('submission key rejected via avatar route', canReadProfileKey(student, own), false)
check('submission key rejected for teacher too', canReadProfileKey(teacher, own), false)
check('traversal denied', canReadProfileKey(teacher, 'profiles/../submissions/x'), false)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
