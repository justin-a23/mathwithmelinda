/**
 * Fix lesson titles AND video URLs by syncing from S3 video filenames.
 *
 * Handles two cases:
 *   1. Single-lesson: "arithmetic6/Arithmetic 6 - Lesson 36 - Dividing Fractions.mp4"
 *   2. Multi-lesson:  "arithmetic6/Arithmetic 6 - Lesson 40 & 41 - Adding, Subtracting, & Multiplying Decimals.mp4"
 *      → Both lesson 40 AND lesson 41 templates get the same videoUrl and title.
 *
 * Run with: node scripts/fix-lesson-titles.mjs
 * Add --dry-run to preview changes without writing
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dirname, '..', '.env.local')
const envVars = readFileSync(envPath, 'utf8')
  .split('\n').filter(l => l.includes('=')).reduce((acc, line) => {
    const [k, ...v] = line.split('='); acc[k.trim()] = v.join('=').trim(); return acc
  }, {})

const REGION = envVars.AWS_REGION || 'us-east-1'
const ACCESS_KEY = envVars.AWS_ACCESS_KEY_ID
const SECRET_KEY = envVars.AWS_SECRET_ACCESS_KEY
const BUCKET = 'mathwithmelinda-videos'
const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const API_KEY = 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

const FOLDER_TO_COURSE = {
  'algebra1': 'Algebra 1',
  'middleschoolmath': 'Middle School Math',
  'prealgebra': 'Pre-Algebra',
  'arithmetic6': 'Arithmetic 6',
}

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be written\n')

const s3 = new S3Client({ region: REGION, credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY } })

async function gql(query, variables = {}) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables })
  })
  return res.json()
}

async function listAllS3Objects() {
  const objects = []
  let token
  do {
    const resp = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }))
    objects.push(...(resp.Contents || []).map(o => o.Key))
    token = resp.NextContinuationToken
  } while (token)
  return objects
}

/**
 * Parse a video S3 key into { courseTitle, lessonNumbers[], title }
 *
 * Examples:
 *   "arithmetic6/Arithmetic 6 - Lesson 36 - Dividing Fractions.mp4"
 *     → { course: 'Arithmetic 6', lessonNumbers: [36], title: 'Lesson 36 - Dividing Fractions' }
 *
 *   "arithmetic6/Arithmetic 6 - Lesson 40 & 41 - Adding, Subtracting, & Multiplying Decimals.mp4"
 *     → { course: 'Arithmetic 6', lessonNumbers: [40, 41], title: 'Lesson 40 & 41 - Adding, Subtracting, & Multiplying Decimals' }
 */
function parseVideoKey(key) {
  const folder = key.split('/')[0]
  const courseTitle = FOLDER_TO_COURSE[folder]
  if (!courseTitle) return null

  const filename = key.split('/').pop().replace(/\.mp4$/i, '')

  // Find "- Lesson" prefix position to extract the lesson portion
  const lessonIdx = filename.search(/- Lesson /i)
  if (lessonIdx === -1) return null
  const lessonPart = filename.slice(lessonIdx + 2).trim() // e.g. "Lesson 40 & 41 - Adding..."

  // Parse lesson numbers — handles: "Lesson 36", "Lesson 40 & 41", "Lesson 100a"
  const multiMatch = lessonPart.match(/^Lesson (\d+) & (\d+)/i)
  const singleMatch = lessonPart.match(/^Lesson (\d+(?:\.\d+)?)[ab]?/i)

  let lessonNumbers
  if (multiMatch) {
    lessonNumbers = [parseFloat(multiMatch[1]), parseFloat(multiMatch[2])]
  } else if (singleMatch) {
    lessonNumbers = [parseFloat(singleMatch[1])]
  } else {
    return null
  }

  return { courseTitle, lessonNumbers, title: lessonPart, s3Key: key }
}

async function fetchAllTemplates() {
  const templates = []
  let nextToken = null
  do {
    const result = await gql(`
      query ListTemplates($nextToken: String) {
        listLessonTemplates(limit: 500, nextToken: $nextToken) {
          items { id title lessonNumber videoUrl course { title } }
          nextToken
        }
      }
    `, { nextToken })
    const page = result.data?.listLessonTemplates
    if (!page) break
    templates.push(...page.items)
    nextToken = page.nextToken
  } while (nextToken)
  return templates
}

async function updateTemplate(id, title, videoUrl) {
  const input = videoUrl !== undefined ? { id, title, videoUrl } : { id, title }
  return gql(`
    mutation UpdateLessonTemplate($input: UpdateLessonTemplateInput!) {
      updateLessonTemplate(input: $input) { id title videoUrl }
    }
  `, { input })
}

async function main() {
  console.log('Listing S3 video files...')
  const keys = await listAllS3Objects()
  const mp4Keys = keys.filter(k => k.endsWith('.mp4'))
  console.log(`Found ${mp4Keys.length} MP4 files\n`)

  // Build lookup: "CourseTitle|lessonNumber" → { title, s3Key }
  const videoMap = new Map()
  for (const key of mp4Keys) {
    const parsed = parseVideoKey(key)
    if (!parsed) continue
    for (const num of parsed.lessonNumbers) {
      const mapKey = `${parsed.courseTitle}|${num}`
      videoMap.set(mapKey, { title: parsed.title, s3Key: key })
    }
  }
  console.log(`Parsed ${videoMap.size} course+lesson entries from S3\n`)

  console.log('Fetching LessonTemplates from DB...')
  const templates = await fetchAllTemplates()
  console.log(`Found ${templates.length} LessonTemplates\n`)

  let updated = 0
  let alreadyCorrect = 0
  let noMatch = 0

  for (const t of templates) {
    const courseTitle = t.course?.title
    if (!courseTitle) { noMatch++; continue }

    const mapKey = `${courseTitle}|${t.lessonNumber}`
    const video = videoMap.get(mapKey)

    if (!video) {
      console.warn(`  ⚠️  No S3 match: ${courseTitle} Lesson ${t.lessonNumber} (current title: "${t.title}")`)
      noMatch++
      continue
    }

    const titleChanged = t.title !== video.title
    const videoChanged = t.videoUrl !== video.s3Key

    if (!titleChanged && !videoChanged) {
      alreadyCorrect++
      continue
    }

    const changes = []
    if (titleChanged) changes.push(`title: "${t.title}" → "${video.title}"`)
    if (videoChanged) changes.push(`videoUrl: ${t.videoUrl ? 'updated' : 'ADDED'}`)

    console.log(`  ${DRY_RUN ? '[would update]' : '✓'} ${courseTitle} Lesson ${t.lessonNumber}: ${changes.join(' | ')}`)

    if (!DRY_RUN) {
      await updateTemplate(t.id, video.title, videoChanged ? video.s3Key : undefined)
    }
    updated++
  }

  console.log(`\n── Results ──`)
  console.log(`  Already correct : ${alreadyCorrect}`)
  console.log(`  ${DRY_RUN ? 'Would update' : 'Updated'}    : ${updated}`)
  console.log(`  No S3 match     : ${noMatch}`)
}

main().catch(console.error)
