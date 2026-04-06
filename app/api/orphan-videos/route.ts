import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { requireTeacher } from '@/app/lib/auth'

const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const BUCKET = 'mathwithmelinda-videos'
const APPSYNC = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

const COURSE_FOLDER: Record<string, string> = {
  'Algebra 1': 'algebra1',
  'Middle School Math': 'middleschoolmath',
  'Pre-Algebra': 'prealgebra',
  'Arithmetic 6': 'arithmetic6',
}

const s3 = new S3Client({
  region: 'us-east-1',
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
})

async function gql(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(APPSYNC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

// Parse a human-readable label from an S3 key
// "algebra1/Algebra 1 - Lesson 14 - Some Title.mp4" → "Lesson 14 - Some Title"
function parseLabel(key: string): string {
  const filename = key.split('/').pop()?.replace(/\.mp4$/i, '') ?? key
  // Strip the "Course - " prefix (e.g. "Algebra 1 - ")
  const stripped = filename.replace(/^[^-]+ - /, '')
  return stripped
}

export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const courseTitle = req.nextUrl.searchParams.get('courseTitle') || ''
    const folder = COURSE_FOLDER[courseTitle]
    if (!folder) {
      return NextResponse.json({ error: `Unknown course: ${courseTitle}` }, { status: 400 })
    }

    // List all S3 keys for this course
    const s3Keys: string[] = []
    let token: string | undefined
    do {
      const cmd = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${folder}/`, ContinuationToken: token })
      const resp = await s3.send(cmd)
      for (const obj of resp.Contents ?? []) {
        if (obj.Key?.endsWith('.mp4')) s3Keys.push(obj.Key)
      }
      token = resp.NextContinuationToken
    } while (token)

    // Fetch all videoUrls currently in use across ALL lesson templates
    const usedKeys = new Set<string>()
    let nextToken: string | null = null
    do {
      const result = await gql(
        `query L($t: String) { listLessonTemplates(limit: 500, nextToken: $t) { items { videoUrl } nextToken } }`,
        { t: nextToken }
      )
      const page = result.data?.listLessonTemplates
      for (const t of page?.items ?? []) {
        if (t.videoUrl) usedKeys.add(t.videoUrl)
      }
      nextToken = page?.nextToken ?? null
    } while (nextToken)

    // Return orphans: in S3 but not attached to any lesson
    const orphans = s3Keys
      .filter(k => !usedKeys.has(k))
      .map(key => ({ key, label: parseLabel(key) }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))

    return NextResponse.json({ orphans })
  } catch (err: unknown) {
    console.error('orphan-videos error:', err)
    return NextResponse.json({ error: 'Failed to fetch orphan videos' }, { status: 500 })
  }
}
