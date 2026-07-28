/**
 * One-time script: archive the old (pre-rewrite) Algebra 1 lesson templates.
 *
 * Melinda is rewriting Algebra 1 from the current Abeka edition. The new lessons are
 * numbered sequentially from 1, which collides with the old book-based templates that
 * already occupy those numbers. Rather than delete the old work, this flags it
 * isArchived so it drops out of the library, the scheduler and the importer's
 * auto-match — while staying resolvable by past submissions and transcripts.
 *
 * Old templates are identified by title: the new ones use an em-dash separator
 * ("Lesson 1 — Classification of Numbers"), the old imports use a hyphen
 * ("Lesson 4 - Evaluating Algebraic Expressions").
 *
 * REQUIRES: `amplify push` must have run first to add LessonTemplate.isArchived.
 *
 * Run with:  node scripts/archive-old-algebra1.mjs          (dry run, prints plan)
 *            node scripts/archive-old-algebra1.mjs --apply  (performs the update)
 *            node scripts/archive-old-algebra1.mjs --undo   (restores everything)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envVars = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').filter(l => l.includes('=')).reduce((acc, line) => {
    const [k, ...v] = line.split('='); acc[k.trim()] = v.join('=').trim(); return acc
  }, {})

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const API_KEY = envVars.APPSYNC_API_KEY
if (!API_KEY) {
  console.error('APPSYNC_API_KEY missing from .env.local — add it before running this script.')
  process.exit(1)
}
const ALGEBRA1_COURSE_ID = '0bc422d2-e61e-4e11-b562-34477703b002'

const APPLY = process.argv.includes('--apply')
const UNDO = process.argv.includes('--undo')

async function gql(query, variables = {}) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2))
  return json.data
}

async function fetchAllTemplates() {
  const query = /* GraphQL */`
    query List($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
      listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
        items { id lessonNumber title isArchived }
        nextToken
      }
    }
  `
  let items = []
  let nextToken = null
  do {
    const data = await gql(query, {
      filter: { courseLessonTemplatesId: { eq: ALGEBRA1_COURSE_ID } },
      limit: 200,
      nextToken,
    })
    items = items.concat(data.listLessonTemplates.items)
    nextToken = data.listLessonTemplates.nextToken
  } while (nextToken)
  return items
}

async function setArchived(id, isArchived) {
  await gql(
    /* GraphQL */`
      mutation Update($input: UpdateLessonTemplateInput!) {
        updateLessonTemplate(input: $input) { id isArchived }
      }
    `,
    { input: { id, isArchived } }
  )
}

// The new rewrite uses an em-dash; the old bulk imports use a plain hyphen.
const isNewLesson = title => title.includes('—')

async function main() {
  const all = await fetchAllTemplates()
  console.log(`Algebra 1 templates found: ${all.length}`)

  if (UNDO) {
    const archived = all.filter(t => t.isArchived)
    console.log(`Restoring ${archived.length} archived template(s)…`)
    for (const t of archived) await setArchived(t.id, false)
    console.log('Done — all Algebra 1 templates restored.')
    return
  }

  const keep = all.filter(t => isNewLesson(t.title))
  const toArchive = all.filter(t => !isNewLesson(t.title) && !t.isArchived)

  console.log(`\nKEEPING ${keep.length} (new rewrite):`)
  for (const t of keep.sort((a, b) => a.lessonNumber - b.lessonNumber)) {
    console.log(`   L${t.lessonNumber}: ${t.title}`)
  }

  console.log(`\nARCHIVING ${toArchive.length} (old book):`)
  const sorted = toArchive.sort((a, b) => a.lessonNumber - b.lessonNumber)
  for (const t of sorted.slice(0, 5)) console.log(`   L${t.lessonNumber}: ${t.title}`)
  if (sorted.length > 5) console.log(`   …and ${sorted.length - 5} more`)

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to perform the archive.')
    return
  }

  console.log('\nApplying…')
  let done = 0
  for (const t of sorted) {
    await setArchived(t.id, true)
    done++
    if (done % 25 === 0) console.log(`   ${done}/${sorted.length}`)
  }
  console.log(`Done — archived ${done} template(s). Reversible with --undo.`)
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
