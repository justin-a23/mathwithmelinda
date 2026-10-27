/**
 * Answer "can this student still see and turn in lesson X?" from the live data.
 *
 * Finds the student by name, then replays the student dashboard's visibility
 * rules (app/dashboard/page.tsx) against every scheduled lesson in their
 * course, so the verdict here is the verdict the student actually gets:
 *
 *   - no past cutoff: unsubmitted work stays visible all term
 *   - term floor: weeks that ended before the earliest ACTIVE term's start are
 *     hidden (current calendar week exempt)
 *   - enrollment floor: weeks that ended before the student's enrolledAt are hidden
 *   - future limit: 7 days ahead, 14 from Friday 8am CDT through the weekend
 *   - assignedStudentIds: a plan limited to other students is hidden
 *   - unpublished items are hidden
 *
 * Reads as the machine user (student-tier, read-only) from .env.local, like the
 * cron and NAS routes do, so no teacher password is needed. Run from the repo:
 *
 *   node scripts/student-missing-work.mjs "Abi Armstrong"
 *   node scripts/student-missing-work.mjs "Abi Armstrong" --lesson 23.1 --lesson 23.2
 *
 * Without --lesson it lists every unsubmitted scheduled lesson for the student.
 * Needs CRON_COGNITO_EMAIL / CRON_COGNITO_PASSWORD in .env.local and either
 * COGNITO_CLIENT_ID there or amplify_outputs.json next to package.json.
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const wantedLessons = []
const nameParts = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lesson') wantedLessons.push(args[++i])
  else nameParts.push(args[i])
}
const studentName = nameParts.join(' ').trim()
if (!studentName) {
  console.error('usage: node scripts/student-missing-work.mjs "First Last" [--lesson 23.1 ...]')
  process.exit(1)
}

// ── config: .env.local + amplify_outputs.json ───────────────────────────────
const env = {}
const envPath = join(ROOT, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
let outputs = null
const outPath = join(ROOT, 'amplify_outputs.json')
if (existsSync(outPath)) outputs = JSON.parse(readFileSync(outPath, 'utf8'))

const endpoint = env.APPSYNC_ENDPOINT || outputs?.data?.url
const clientId = env.COGNITO_CLIENT_ID || outputs?.auth?.user_pool_client_id
const email = env.CRON_COGNITO_EMAIL
const password = env.CRON_COGNITO_PASSWORD
for (const [k, v] of [['AppSync endpoint', endpoint], ['Cognito client id', clientId], ['CRON_COGNITO_EMAIL', email], ['CRON_COGNITO_PASSWORD', password]]) {
  if (!v) { console.error(`✗ missing ${k} (check .env.local / amplify_outputs.json)`); process.exit(1) }
}

// ── auth + gql (same shape as app/lib/machineAuth.ts) ───────────────────────
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider')
const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })
const auth = await cog.send(new InitiateAuthCommand({
  ClientId: clientId, AuthFlow: 'USER_PASSWORD_AUTH',
  AuthParameters: { USERNAME: email, PASSWORD: password },
}))
const token = auth.AuthenticationResult?.AccessToken
if (!token) { console.error('✗ machine user sign-in returned no token (challenge: ' + auth.ChallengeName + ')'); process.exit(1) }

async function gql(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join('; '))
  return json.data
}
async function listAll(query, field, variables = {}) {
  const out = []; let nextToken = null
  do {
    const data = await gql(query, { ...variables, nextToken })
    out.push(...(data[field]?.items || [])); nextToken = data[field]?.nextToken || null
  } while (nextToken)
  return out
}

// ── 1. student ──────────────────────────────────────────────────────────────
const profiles = await listAll(`query($nextToken: String) { listStudentProfiles(limit: 500, nextToken: $nextToken) {
  items { id userId email firstName lastName preferredName courseId status enrolledAt archivedAt } nextToken } }`, 'listStudentProfiles')
const norm = s => (s || '').toLowerCase().replace(/[^a-z]/g, '')
const want = norm(studentName)
const matches = profiles.filter(p =>
  norm(p.firstName + p.lastName) === want || norm((p.preferredName || '') + p.lastName) === want
  || norm(p.firstName + p.lastName).includes(want) || norm((p.preferredName || '') + p.lastName).includes(want))
if (matches.length === 0) {
  console.error(`✗ no student profile matches "${studentName}". Last names on file: ${[...new Set(profiles.map(p => p.lastName))].sort().join(', ')}`)
  process.exit(1)
}
if (matches.length > 1) console.log(`(${matches.length} profiles match; using the first active one)\n`)
const student = matches.find(p => p.status === 'active') || matches[0]

const courses = await listAll(`query($nextToken: String) { listCourses(limit: 500, nextToken: $nextToken) { items { id title } nextToken } }`, 'listCourses')
const course = courses.find(c => c.id === student.courseId)

console.log(`Student   ${student.firstName} ${student.lastName}${student.preferredName ? ` (goes by ${student.preferredName})` : ''}  <${student.email}>`)
console.log(`Status    ${student.status || '(none)'}${student.archivedAt ? `  archived ${student.archivedAt}` : ''}`)
console.log(`Course    ${course ? course.title : `(none — courseId ${student.courseId || 'unset'})`}`)
console.log(`Enrolled  ${student.enrolledAt || '(no enrolledAt — no enrollment floor applies)'}`)

// ── 2. terms ────────────────────────────────────────────────────────────────
const semesters = (await listAll(`query($nextToken: String) { listSemesters(limit: 500, nextToken: $nextToken) {
  items { id name startDate endDate isActive courseId } nextToken } }`, 'listSemesters'))
  .filter(s => s.courseId === student.courseId)
  .sort((a, b) => a.startDate.localeCompare(b.startDate))
console.log(`\nTerms for this course:`)
for (const s of semesters) console.log(`  ${s.isActive ? '● ACTIVE  ' : '○ inactive'}  ${s.name}  ${s.startDate} → ${s.endDate}`)
const activeStarts = semesters.filter(s => s.isActive).map(s => new Date(s.startDate + 'T00:00:00').getTime()).filter(t => !isNaN(t))
const semesterFloorMs = activeStarts.length ? Math.min(...activeStarts) : null
console.log(semesterFloorMs === null
  ? `  → no active term: no term floor, the dashboard shows every past week`
  : `  → term floor: weeks that ended before ${new Date(semesterFloorMs).toISOString().slice(0, 10)} are hidden from the dashboard`)

// ── 3. submissions ──────────────────────────────────────────────────────────
const subs = await listAll(`query($studentId: String!, $nextToken: String) { listSubmissionsByStudentId(studentId: $studentId, limit: 500, nextToken: $nextToken) {
  items { id content status grade submittedAt isArchived } nextToken } }`, 'listSubmissionsByStudentId', { studentId: student.userId })
const subByLesson = new Map()
for (const s of subs) {
  try { const c = JSON.parse(s.content || '{}'); if (c.lessonId) subByLesson.set(c.lessonId, s) } catch { /* skip */ }
}

// ── 4. plans → dashboard rules ──────────────────────────────────────────────
const plans = (await listAll(`query($nextToken: String) { listWeeklyPlans(limit: 500, nextToken: $nextToken) { items {
  id weekStartDate assignedStudentIds course { id title }
  items { items { id dayOfWeek dueTime isPublished isInClass lesson { id title order } } } } nextToken } }`, 'listWeeklyPlans'))
  .filter(p => p.course?.id === student.courseId)
  .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))

const now = new Date()
const dayOfWeek = now.getDay(), hourUTC = now.getUTCHours()
const showNextWeek = (dayOfWeek === 5 && hourUTC >= 13) || dayOfWeek === 0 || dayOfWeek === 6
const futureLimit = new Date(now.getTime() + (showNextWeek ? 14 : 7) * 86400000)
const enrolledAtMs = student.enrolledAt ? new Date(student.enrolledAt).getTime() : null

function planVerdict(p) {
  const d = new Date(p.weekStartDate + 'T00:00:00')
  const weekEnd = new Date(d); weekEnd.setDate(d.getDate() + 7)
  if (d > futureLimit) return 'HIDDEN: week is beyond the dashboard look-ahead'
  const isCurrentWeek = now >= d && now < weekEnd
  if (semesterFloorMs !== null && !isCurrentWeek && weekEnd.getTime() < semesterFloorMs) return 'HIDDEN: week ended before the active term started (term floor)'
  if (enrolledAtMs !== null && weekEnd.getTime() < enrolledAtMs) return 'HIDDEN: week ended before the student enrolled'
  if (p.assignedStudentIds) {
    try {
      const ids = JSON.parse(p.assignedStudentIds)
      if (ids.length && !ids.includes(student.userId) && !ids.includes(student.email)) return 'HIDDEN: plan is assigned to other students only'
    } catch { /* treat as everyone */ }
  }
  return null
}

const lessonKey = o => (o === null || o === undefined ? '' : String(o))
const rows = []
for (const p of plans) {
  const pv = planVerdict(p)
  for (const it of (p.items?.items || [])) {
    const num = lessonKey(it.lesson?.order)
    if (wantedLessons.length && !wantedLessons.some(w => String(parseFloat(w)) === String(parseFloat(num)))) continue
    const sub = it.lesson?.id ? subByLesson.get(it.lesson.id) : null
    if (!wantedLessons.length && sub) continue   // default view: unsubmitted only
    let verdict
    if (sub) verdict = `TURNED IN ${sub.submittedAt?.slice(0, 10) || ''}${sub.grade ? `, grade ${sub.grade}` : ', not graded yet'}${sub.status === 'returned' ? ' (returned for revision)' : ''}`
    else if (!it.isPublished) verdict = 'HIDDEN: item not published'
    else if (pv) verdict = pv
    else verdict = 'VISIBLE on dashboard — student can open it and turn it in'
    rows.push({ week: p.weekStartDate, day: it.dayOfWeek, num, title: it.lesson?.title || '(no lesson)', due: it.dueTime || '', verdict })
  }
}

console.log(`\n${wantedLessons.length ? `Lessons ${wantedLessons.join(', ')}` : 'Unsubmitted scheduled lessons'} for ${student.firstName}:`)
if (!rows.length) console.log(wantedLessons.length ? '  (not scheduled for this student\'s course)' : '  (none — everything scheduled has been turned in)')
for (const r of rows) {
  console.log(`  week of ${r.week}  ${r.day.padEnd(9)} L${r.num.padEnd(5)} ${r.title}`)
  console.log(`      due ${r.due || '—'}   ${r.verdict}`)
}
