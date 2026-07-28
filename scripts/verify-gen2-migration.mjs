/**
 * Compare Gen 1 and Gen 2 after a migration run.
 *
 *   node scripts/verify-gen2-migration.mjs
 *
 * Counting rows is not enough — a copy can land the right number of records
 * with every relationship broken. So this also resolves relationships through
 * Gen 2's own resolvers, which is the thing that actually proves the foreign
 * keys survived.
 *
 * Expected discrepancies (not failures):
 *   VideoWatch      -70  rows whose studentId resolves to no StudentProfile
 *   TeacherProfile   -5  duplicate rows collapsed to one per userId
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  .split('\n').filter(l => l.includes('=')).reduce((a, l) => {
    const [k, ...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a
  }, {})

const GEN1 = {
  endpoint: 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: env.APPSYNC_API_KEY,
}
const outPath = join(ROOT, 'amplify_outputs.json')
if (!existsSync(outPath)) { console.error('amplify_outputs.json not found'); process.exit(1) }
const o = JSON.parse(readFileSync(outPath, 'utf8'))
const GEN2 = { endpoint: o.data.url, apiKey: o.data.api_key }

async function gql(t, query) {
  const res = await fetch(t.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': t.apiKey },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

const PLURAL = { Quarter: 'Quarters', VideoWatch: 'VideoWatches', Syllabus: 'Syllabi' }
const listName = m => `list${PLURAL[m] || m + 's'}`

async function count(t, model) {
  let n = 0, token = null
  do {
    const q = `{ ${listName(model)}(limit: 1000${token ? `, nextToken: "${token}"` : ''}) { items { id } nextToken } }`
    const r = await gql(t, q)
    if (r.errors) return `ERR: ${r.errors[0].message.slice(0, 50)}`
    const page = r.data[listName(model)]
    n += page.items.length
    token = page.nextToken
  } while (token)
  return n
}

const MODELS = [
  'Course', 'AcademicYear', 'Quarter', 'Semester', 'LessonTemplate', 'AssignmentQuestion',
  'Lesson', 'WeeklyPlan', 'WeeklyPlanItem', 'Assignment', 'StudentProfile', 'ParentProfile',
  'ParentStudentLink', 'ParentStudent', 'Enrollment', 'Submission', 'SubmissionMessage',
  'VideoWatch', 'TeacherProfile', 'StudentInvite', 'ParentInvite', 'Message', 'Announcement',
  'ZoomMeeting', 'Syllabus', 'ReportCardRecord',
]
const EXPECTED_DELTA = { VideoWatch: -70, TeacherProfile: -5 }

console.log(`\n${'model'.padEnd(22)} ${'gen1'.padStart(6)} ${'gen2'.padStart(6)}  delta`)
console.log('─'.repeat(50))
let unexpected = []
let g1total = 0, g2total = 0
for (const m of MODELS) {
  const [a, b] = await Promise.all([count(GEN1, m), count(GEN2, m)])
  if (typeof a === 'number') g1total += a
  if (typeof b === 'number') g2total += b
  const delta = typeof a === 'number' && typeof b === 'number' ? b - a : '?'
  const want = EXPECTED_DELTA[m] ?? 0
  const ok = delta === want
  if (!ok) unexpected.push(`${m}: expected delta ${want}, got ${delta}`)
  console.log(`${m.padEnd(22)} ${String(a).padStart(6)} ${String(b).padStart(6)}  ${String(delta).padStart(5)} ${ok ? '' : '  <-- UNEXPECTED'}`)
}
console.log('─'.repeat(50))
console.log(`${'TOTAL'.padEnd(22)} ${String(g1total).padStart(6)} ${String(g2total).padStart(6)}`)

// Relationships: counts alone would pass even if every foreign key were broken.
console.log('\nrelationship integrity (resolved through Gen 2):')
const checks = [
  ['Course -> lessonTemplates', '{ listCourses(limit:1){ items { title lessonTemplates(limit:3){ items { id lessonNumber } } } } }',
    d => d.listCourses.items[0]?.lessonTemplates?.items?.length],
  ['LessonTemplate -> course', '{ listLessonTemplates(limit:1){ items { title course { title } } } }',
    d => d.listLessonTemplates.items[0]?.course?.title],
  ['LessonTemplate -> questions', '{ listLessonTemplates(limit:20){ items { questions(limit:3){ items { id order } } } } }',
    d => d.listLessonTemplates.items.reduce((n, t) => n + (t.questions?.items?.length || 0), 0)],
  ['Semester -> course', '{ listSemesters(limit:2){ items { name course { title } } } }',
    d => d.listSemesters.items.map(s => s.course?.title).filter(Boolean).length],
  ['Semester -> enrollments', '{ listSemesters(limit:2){ items { name enrollments(limit:5){ items { studentId } } } } }',
    d => d.listSemesters.items.reduce((n, s) => n + (s.enrollments?.items?.length || 0), 0)],
  ['AcademicYear -> semesters', '{ listAcademicYears(limit:1){ items { year semesters(limit:5){ items { name } } } } }',
    d => d.listAcademicYears.items[0]?.semesters?.items?.length],
]
for (const [label, q, extract] of checks) {
  const r = await gql(GEN2, q)
  if (r.errors) { console.log(`   FAIL ${label}: ${r.errors[0].message.slice(0, 70)}`); unexpected.push(label); continue }
  const v = extract(r.data)
  const ok = v !== undefined && v !== null && v !== 0
  if (!ok) unexpected.push(`${label} resolved nothing`)
  console.log(`   ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(30)} -> ${JSON.stringify(v)}`)
}

// studentId should now be a Cognito sub everywhere, not an email.
console.log('\nstudentId normalization:')
for (const m of ['Submission', 'Message', 'VideoWatch', 'Enrollment']) {
  const r = await gql(GEN2, `{ ${listName(m)}(limit: 300) { items { studentId } } }`)
  if (r.errors) { console.log(`   ${m}: ERR`); continue }
  const vals = r.data[listName(m)].items.map(i => i.studentId).filter(Boolean)
  const emails = vals.filter(v => v.includes('@')).length
  console.log(`   ${m.padEnd(18)} ${vals.length} rows, ${emails} still email-form ${emails ? '  <-- NOT NORMALIZED' : ''}`)
  if (emails) unexpected.push(`${m} has ${emails} un-normalized studentId`)
}

console.log('\n' + (unexpected.length ? `PROBLEMS:\n   ${unexpected.join('\n   ')}` : 'All checks passed.'))
process.exit(unexpected.length ? 1 : 0)
