/**
 * One-time script: populate LessonTemplate.videoUrl from S3 bucket contents.
 * Matches by course folder + lesson number.
 * Run with: node scripts/populate-video-urls.mjs
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env vars from .env.local
const envPath = join(__dirname, '..', '.env.local')
const envVars = readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(l => l.includes('='))
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=')
    acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const REGION = envVars.AWS_REGION || 'us-east-1'
const ACCESS_KEY = envVars.AWS_ACCESS_KEY_ID
const SECRET_KEY = envVars.AWS_SECRET_ACCESS_KEY
const BUCKET = 'mathwithmelinda-videos'
const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const API_KEY = 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

// Course folder → course title mapping
const FOLDER_TO_COURSE = {
  'algebra1': 'Algebra 1',
  'middleschoolmath': 'Middle School Math',
  'prealgebra': 'Pre-Algebra',
  'arithmetic6': 'Arithmetic 6',
}

const s3 = new S3Client({
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY }
})

async function gql(query, variables = {}) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables })
  })
  return res.json()
}

// List all S3 objects in the bucket
async function listAllS3Objects() {
  const objects = []
  let token = undefined
  do {
    const cmd = new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
    const resp = await s3.send(cmd)
    for (const obj of resp.Contents || []) {
      objects.push(obj.Key)
    }
    token = resp.NextContinuationToken
  } while (token)
  return objects
}

// Parse lesson number from S3 key like "algebra1/Algebra 1 - Lesson 143 - Title.mp4"
// Also handles "100a", "100b" style — strips the letter and returns the base number
function parseLessonNumber(key) {
  const match = key.match(/- Lesson (\d+(?:\.\d+)?)[ab]? -/i)
  return match ? parseFloat(match[1]) : null
}

// Parse the part suffix (a/b) if present
function parseLessonPart(key) {
  const match = key.match(/- Lesson \d+([ab]) -/i)
  return match ? match[1].toLowerCase() : null
}

// Parse course folder from S3 key
function parseCourseFolder(key) {
  return key.split('/')[0]
}

// Fetch all LessonTemplates with their course
async function fetchAllTemplates() {
  const templates = []
  let nextToken = null
  do {
    const result = await gql(`
      query ListTemplates($nextToken: String) {
        listLessonTemplates(limit: 500, nextToken: $nextToken) {
          items { id lessonNumber course { id title } }
          nextToken
        }
      }
    `, { nextToken })
    const page = result.data.listLessonTemplates
    templates.push(...page.items)
    nextToken = page.nextToken
  } while (nextToken)
  return templates
}

// Update a LessonTemplate's videoUrl
async function updateTemplate(id, videoUrl) {
  return gql(`
    mutation UpdateLessonTemplate($input: UpdateLessonTemplateInput!) {
      updateLessonTemplate(input: $input) { id videoUrl }
    }
  `, { input: { id, videoUrl } })
}

async function main() {
  console.log('Listing S3 objects...')
  const keys = await listAllS3Objects()
  console.log(`Found ${keys.length} files in S3`)

  // Build a map: "courseTitle|lessonNumber" → S3 key
  // For split lessons (100a, 100b), prefer the 'a' part; fall back to 'b'
  const s3Map = new Map()
  for (const key of keys) {
    if (!key.endsWith('.mp4')) continue
    const folder = parseCourseFolder(key)
    const courseTitle = FOLDER_TO_COURSE[folder]
    const lessonNum = parseLessonNumber(key)
    if (!courseTitle || lessonNum === null) continue
    const mapKey = `${courseTitle}|${lessonNum}`
    const part = parseLessonPart(key)
    // Only overwrite if not already set, or if this is the 'a' part (prefer part a)
    if (!s3Map.has(mapKey) || part === 'a') {
      s3Map.set(mapKey, key)
    }
  }
  console.log(`Parsed ${s3Map.size} video files with valid course + lesson number`)

  console.log('Fetching LessonTemplates from DB...')
  const templates = await fetchAllTemplates()
  console.log(`Found ${templates.length} LessonTemplates`)

  let updated = 0
  let notFound = 0

  for (const template of templates) {
    const courseTitle = template.course?.title
    if (!courseTitle) { notFound++; continue }

    const mapKey = `${courseTitle}|${template.lessonNumber}`
    const s3Key = s3Map.get(mapKey)

    if (!s3Key) {
      console.warn(`  ✗ No S3 match: ${courseTitle} Lesson ${template.lessonNumber}`)
      notFound++
      continue
    }

    await updateTemplate(template.id, s3Key)
    console.log(`  ✓ ${courseTitle} Lesson ${template.lessonNumber} → ${s3Key}`)
    updated++
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`)
}

main().catch(console.error)
