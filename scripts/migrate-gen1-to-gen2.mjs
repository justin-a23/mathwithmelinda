/**
 * Copy every record from the Gen 1 AppSync API into the Gen 2 one.
 *
 *   node scripts/migrate-gen1-to-gen2.mjs            dry run — read, transform, report
 *   node scripts/migrate-gen1-to-gen2.mjs --apply    actually write to Gen 2
 *
 * Dry run needs only Gen 1 and is safe to run any time. --apply additionally
 * requires amplify_outputs.json, written by `npx ampx sandbox`.
 *
 * ─── What this does beyond a straight copy ──────────────────────────────────
 *
 * 1. NORMALIZES studentId TO THE COGNITO SUB.
 *    Gen 1 is inconsistent: Submission/Message hold an email, Enrollment holds
 *    a sub. That inconsistency is why Gen 2's auth rules are still group-level
 *    rather than row-level — `allow.ownerDefinedIn('studentId')` compares
 *    against the token's sub, so it would match one model and silently deny the
 *    other. Subs are also immutable where emails are not.
 *
 *    Emails are resolved through StudentProfile. Anything unresolvable is
 *    reported and NOT written — a wrong owner is worse than a missing row.
 *
 *    Knock-on: S3 keys are `submissions/{email}/...`. Those are untouched here.
 *    Either re-key the objects (trivial — there are 17) or teach
 *    app/lib/ownershipRules.ts to map sub→email for legacy keys. Decide before
 *    cutover; the script prints the affected keys.
 *
 * 2. DROPS TWO DEAD RELATIONSHIPS.
 *    Semester.courseSemestersId and WeeklyPlan.semesterWeeklyPlansId are
 *    declared in Gen 1 and populated in zero rows. The live links are
 *    Semester.courseId and WeeklyPlan.courseWeeklyPlansId.
 *
 * 3. WRITES IN DEPENDENCY ORDER so foreign keys always point at rows that
 *    already exist.
 *
 * Records keep their original `id`, so the copy is idempotent-ish and
 * relationships survive without a remapping table.
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const APPLY = process.argv.includes('--apply')

// ─── Endpoints ──────────────────────────────────────────────────────────────

const envVars = readFileSync(join(ROOT, '.env.local'), 'utf8')
  .split('\n').filter(l => l.includes('=')).reduce((a, l) => {
    const [k, ...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a
  }, {})

const GEN1 = {
  endpoint: 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: envVars.APPSYNC_API_KEY,
}
if (!GEN1.apiKey) {
  console.error('APPSYNC_API_KEY missing from .env.local')
  process.exit(1)
}

function loadGen2() {
  const p = join(ROOT, 'amplify_outputs.json')
  if (!existsSync(p)) return null
  const o = JSON.parse(readFileSync(p, 'utf8'))
  return { endpoint: o.data?.url, apiKey: o.data?.api_key }
}

async function gql(target, query, variables = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (target.apiKey) headers['x-api-key'] = target.apiKey
  const res = await fetch(target.endpoint, {
    method: 'POST', headers, body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2))
  return json.data
}

// ─── Models, in the order they must be written ──────────────────────────────

const MODELS = [
  'Course', 'AcademicYear', 'Quarter', 'Semester',
  'LessonTemplate', 'AssignmentQuestion', 'Lesson',
  'WeeklyPlan', 'WeeklyPlanItem', 'Assignment',
  'StudentProfile', 'ParentProfile', 'ParentStudentLink', 'ParentStudent',
  'Enrollment', 'Submission', 'SubmissionMessage', 'VideoWatch',
  'TeacherProfile', 'StudentInvite', 'ParentInvite',
  'Message', 'Announcement', 'ZoomMeeting', 'Syllabus', 'ReportCardRecord',
]

// Amplify's pluralizer is irregular; these were read off the live Query type.
const PLURAL = { Quarter: 'Quarters', VideoWatch: 'VideoWatches', Syllabus: 'Syllabi' }
const listName = m => `list${PLURAL[m] || m + 's'}`

/** Fields Gen 1 generates that Gen 2 either owns itself or no longer has. */
const DROP_FIELDS = new Set(['createdAt', 'updatedAt', '__typename'])
const DEAD_FIELDS = new Set(['courseSemestersId', 'semesterWeeklyPlansId'])
/**
 * Profile models that must end up with one row per userId.
 *
 * Gen 1 accumulated duplicates because profile creation was never made
 * idempotent — production has four TeacherProfile rows for Melinda's single
 * userId, so whichever loaded first won and her display name/picture could
 * appear to change. Nothing holds a foreign key to these, so collapsing them is
 * safe. The most completely filled row wins.
 */
const DEDUPE_BY_USER_ID = new Set(['TeacherProfile', 'StudentProfile', 'ParentProfile'])

/** studentId holds an email on these and must become a sub. */
const NORMALIZE_STUDENT_ID = new Set(['Submission', 'Message', 'VideoWatch', 'ReportCardRecord'])

// ─── Introspection: build selection sets from the live schema ───────────────

async function scalarFields(model) {
  const data = await gql(GEN1, `{ __type(name:"${model}"){ fields { name type { kind name ofType { kind name } } } } }`)
  const t = data.__type
  if (!t) return null
  return t.fields
    .filter(f => {
      // Keep scalars and enums; skip relationships (OBJECT/LIST), which are
      // reconstructed from the FK id columns that Gen 1 exposes as scalars.
      const k = f.type.kind === 'NON_NULL' || f.type.kind === 'LIST' ? f.type.ofType?.kind : f.type.kind
      return k === 'SCALAR' || k === 'ENUM'
    })
    .map(f => f.name)
    .filter(n => !DROP_FIELDS.has(n))
}

async function fetchAll(model, fields) {
  const q = `query L($nextToken: String) {
    ${listName(model)}(limit: 500, nextToken: $nextToken) {
      items { ${fields.join(' ')} }
      nextToken
    }
  }`
  let out = [], nextToken = null
  do {
    const d = await gql(GEN1, q, { nextToken })
    const page = d[listName(model)]
    out = out.concat(page.items)
    nextToken = page.nextToken
  } while (nextToken)
  return out
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} — Gen 1 → Gen 2\n${'─'.repeat(60)}`)

  const gen2 = loadGen2()
  if (APPLY && !gen2?.endpoint) {
    console.error('amplify_outputs.json not found — run `npx ampx sandbox` first.')
    process.exit(1)
  }
  if (!APPLY) {
    console.log(gen2?.endpoint ? `Gen 2 target detected: ${gen2.endpoint}` : 'Gen 2 target: (none yet — read-only checks)')
  }

  // Identity map for studentId normalization.
  const profiles = await fetchAll('StudentProfile', ['id', 'userId', 'email'])
  const emailToSub = new Map(profiles.filter(p => p.email).map(p => [p.email.toLowerCase(), p.userId]))
  const knownSubs = new Set(profiles.map(p => p.userId))
  console.log(`\nIdentity map: ${emailToSub.size} email→sub from ${profiles.length} student profiles\n`)

  const problems = []
  const skipped = []
  const dupeReport = []
  const orphanSubs = []
  const legacyKeys = []
  let grandTotal = 0

  for (const model of MODELS) {
    const fields = await scalarFields(model)
    if (!fields) { console.log(`${model.padEnd(22)} —  (not in schema, skipped)`); continue }

    const rows = await fetchAll(model, fields)
    grandTotal += rows.length

    let normalized = 0
    let dropped = 0

    const transformed = rows.map(row => {
      const out = {}
      for (const [k, v] of Object.entries(row)) {
        if (v === null || v === undefined) continue
        if (DEAD_FIELDS.has(k)) { dropped++; continue }
        out[k] = v
      }
      if (NORMALIZE_STUDENT_ID.has(model) && typeof out.studentId === 'string' && out.studentId.includes('@')) {
        const sub = emailToSub.get(out.studentId.toLowerCase())
        if (sub) { out.studentId = sub; normalized++ }
        else {
          // No profile behind the address — in practice these are leftovers from
          // deleted test accounts. Skipped rather than migrated: a row owned by
          // nobody is worse than no row.
          skipped.push({ model, id: row.id, identity: out.studentId })
          return null
        }
      } else if (typeof out.studentId === 'string' && !out.studentId.includes('@') && !knownSubs.has(out.studentId)) {
        // A sub with no profile behind it — the student was deleted but their
        // rows outlived them. Reported for every model, not just Enrollment.
        orphanSubs.push(`${model} ${row.id}: studentId "${out.studentId}"`)
      }
      if (model === 'Submission' && typeof row.imageUrls === 'string' && row.imageUrls.includes('@')) {
        legacyKeys.push(row.imageUrls.slice(0, 100))
      }
      return out
    }).filter(Boolean)

    let deduped = transformed
    if (DEDUPE_BY_USER_ID.has(model)) {
      const best = new Map()
      for (const r of transformed) {
        if (!r.userId) continue
        const filled = Object.values(r).filter(v => v !== null && v !== undefined && v !== '').length
        const prev = best.get(r.userId)
        if (!prev || filled > prev.filled) best.set(r.userId, { row: r, filled })
      }
      const collapsed = transformed.length - best.size
      if (collapsed > 0) dupeReport.push(`${model}: ${transformed.length} rows → ${best.size} (${collapsed} duplicate${collapsed === 1 ? '' : 's'} collapsed)`)
      deduped = [...best.values()].map(b => b.row)
    }

    const notes = []
    const skippedHere = rows.length - transformed.length
    const dupsHere = transformed.length - deduped.length
    if (dupsHere) notes.push(`${dupsHere} duplicate${dupsHere === 1 ? '' : 's'} collapsed`)
    if (normalized) notes.push(`${normalized} studentId → sub`)
    if (skippedHere) notes.push(`${skippedHere} skipped (no profile)`)
    if (dropped) notes.push(`${dropped} dead field${dropped === 1 ? '' : 's'} dropped`)
    console.log(`${model.padEnd(22)} ${String(rows.length).padStart(4)}  ${notes.join(', ')}`)

    if (APPLY && deduped.length) {
      const createName = `create${model}`
      let ok = 0
      for (const input of deduped) {
        try {
          await gql(gen2, `mutation C($input: Create${model}Input!) { ${createName}(input: $input) { id } }`, { input })
          ok++
        } catch (err) {
          problems.push(`${model} ${input.id}: write failed — ${String(err.message).slice(0, 160)}`)
        }
      }
      console.log(`${' '.repeat(22)}   wrote ${ok}/${deduped.length}`)
    }
  }

  console.log('─'.repeat(60))
  console.log(`${grandTotal} records read, ${grandTotal - skipped.length} to migrate`)

  if (skipped.length) {
    const byIdentity = new Map()
    for (const s2 of skipped) byIdentity.set(s2.identity, (byIdentity.get(s2.identity) || 0) + 1)
    console.log(`\n${skipped.length} row(s) skipped — studentId resolves to no StudentProfile:`)
    for (const [id, n] of [...byIdentity].sort((a, b) => b[1] - a[1])) {
      console.log(`   ${String(n).padStart(4)}  ${id}`)
    }
    console.log('These are almost certainly deleted test accounts. They are dropped,')
    console.log('not migrated — Gen 2 starts without them.')
  }

  if (legacyKeys.length) {
    console.log(`\n${legacyKeys.length} submission(s) reference email-namespaced S3 keys.`)
    console.log('These are NOT rewritten. Either re-key the objects or teach')
    console.log('app/lib/ownershipRules.ts to map sub→email for legacy keys.')
  }

  if (dupeReport.length) {
    console.log('\nDuplicate profiles collapsed:')
    for (const d of dupeReport) console.log('   ·', d)
  }

  if (orphanSubs.length) {
    console.log(`\n${orphanSubs.length} row(s) reference a Cognito sub with no StudentProfile.`)
    console.log('These migrate fine but are unreachable from the roster — most likely')
    console.log('leftovers from deleted students. Review before cutover:')
    for (const o of orphanSubs.slice(0, 12)) console.log('   ·', o)
    if (orphanSubs.length > 12) console.log(`   …and ${orphanSubs.length - 12} more`)
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`)
    for (const p of problems.slice(0, 30)) console.log('   !', p)
    if (problems.length > 30) console.log(`   …and ${problems.length - 30} more`)
    process.exitCode = 1
  } else {
    console.log('\nNo problems found.')
  }
}

main().catch(err => { console.error('\nFailed:', err.message); process.exit(1) })
