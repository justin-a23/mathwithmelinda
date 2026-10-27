/**
 * Show how each scheduled week maps onto the academic-year quarters, per
 * course, read straight from the live data. Read-only.
 *
 * For every course with an active term it prints the term and its quarters,
 * then every scheduled week with the lesson numbers it carries and the
 * quarter that owns it under the report-card rule (a week belongs to the
 * quarter that contains its Monday). Weeks that fall in NO quarter, or before
 * the term start, are flagged — those are the lessons a quarter filter or a
 * report card silently leaves out.
 *
 *   node scripts/quarter-boundaries.mjs             # every course
 *   node scripts/quarter-boundaries.mjs "Pre-Alg"   # courses whose title matches
 *
 * Same credentials as student-missing-work.mjs: the machine user from
 * .env.local plus amplify_outputs.json (or COGNITO_CLIENT_ID / APPSYNC_ENDPOINT).
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const courseFilter = (process.argv[2] || '').toLowerCase()

const env = {}
const envPath = join(ROOT, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const outPath = join(ROOT, 'amplify_outputs.json')
const outputs = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : null
const endpoint = env.APPSYNC_ENDPOINT || outputs?.data?.url
const clientId = env.COGNITO_CLIENT_ID || outputs?.auth?.user_pool_client_id
const email = env.CRON_COGNITO_EMAIL
const password = env.CRON_COGNITO_PASSWORD
for (const [k, v] of [['AppSync endpoint', endpoint], ['Cognito client id', clientId], ['CRON_COGNITO_EMAIL', email], ['CRON_COGNITO_PASSWORD', password]]) {
  if (!v) { console.error(`✗ missing ${k} (check .env.local / amplify_outputs.json)`); process.exit(1) }
}

const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider')
const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })
const auth = await cog.send(new InitiateAuthCommand({
  ClientId: clientId, AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: email, PASSWORD: password },
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

const courses = await listAll(`query($nextToken: String) { listCourses(limit: 500, nextToken: $nextToken) { items { id title } nextToken } }`, 'listCourses')
const semesters = await listAll(`query($nextToken: String) { listSemesters(limit: 500, nextToken: $nextToken) { items {
  id name startDate endDate isActive courseId academicYear { id year quarters { items { id name startDate endDate order } } } } nextToken } }`, 'listSemesters')
const plans = await listAll(`query($nextToken: String) { listWeeklyPlans(limit: 500, nextToken: $nextToken) { items {
  id weekStartDate courseWeeklyPlansId assignedStudentIds items { items { isPublished lesson { order title } } } } nextToken } }`, 'listWeeklyPlans')

const fmtNums = nums => {
  const n = [...new Set(nums.filter(x => x !== null && x !== undefined))].sort((a, b) => a - b)
  if (!n.length) return '(no lessons)'
  return n.length <= 2 ? n.join(', ') : `${n[0]}–${n[n.length - 1]}${n.length !== Math.round(n[n.length - 1] - n[0]) + 1 ? ` (${n.length} lessons)` : ''}`
}

for (const course of courses.filter(c => !courseFilter || c.title.toLowerCase().includes(courseFilter))) {
  const sems = semesters.filter(s => s.courseId === course.id && s.isActive)
  if (!sems.length) continue
  for (const sem of sems) {
    const quarters = [...(sem.academicYear?.quarters?.items || [])].sort((a, b) => a.order - b.order)
    console.log(`\n═══ ${course.title} — ${sem.name}  ${sem.startDate} → ${sem.endDate}${sem.academicYear ? `  (year ${sem.academicYear.year})` : ''}`)
    if (!quarters.length) console.log('  (no quarters defined on this academic year)')
    for (const q of quarters) console.log(`  ${q.name.padEnd(10)} ${q.startDate} → ${q.endDate}`)
    for (let i = 1; i < quarters.length; i++) {
      const gap = (new Date(quarters[i].startDate) - new Date(quarters[i - 1].endDate)) / 86400000
      if (gap < 1) console.log(`  ⚠ ${quarters[i - 1].name} ends ${quarters[i - 1].endDate} but ${quarters[i].name} starts ${quarters[i].startDate} — quarter dates overlap`)
    }

    const weeks = plans.filter(p => p.courseWeeklyPlansId === course.id).sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
    console.log(`\n  ${'week of'.padEnd(12)} ${'lessons'.padEnd(22)} owner (report-card rule: quarter containing the Monday)`)
    for (const w of weeks) {
      const nums = (w.items?.items || []).filter(i => i.isPublished !== false).map(i => i.lesson?.order)
      const owner = quarters.find(q => w.weekStartDate >= q.startDate && w.weekStartDate <= q.endDate)
      let note
      if (w.weekStartDate < sem.startDate) note = '⚠ before the term start — excluded from report cards entirely'
      else if (w.weekStartDate > sem.endDate) note = '⚠ after the term end'
      else if (!owner) note = '⚠ in NO quarter — counted in the term total but in no quarter breakdown or quarter filter'
      else note = owner.name
      const limited = w.assignedStudentIds && w.assignedStudentIds !== '[]' ? '  (assigned to specific students)' : ''
      console.log(`  ${w.weekStartDate.padEnd(12)} ${fmtNums(nums).padEnd(22)} ${note}${limited}`)
    }
  }
}
console.log()
