// One-time backfill: run app/lib/cleanDiagram.ts over every question diagram
// image already uploaded (AssignmentQuestion.diagramKey), so book photos
// uploaded before auto-clean existed print white instead of gray.
//
// Run:
//   ./node_modules/.bin/tsx scripts/clean-diagrams.ts --preview <outDir> [--lesson <templateId>]
//       Writes before/after JPEGs to outDir. Touches nothing in S3.
//   ./node_modules/.bin/tsx scripts/clean-diagrams.ts --apply [--lesson <templateId>]
//       Copies each original to <key minus .ext>.original.<ext>, then
//       overwrites the key with the cleaned JPEG. Same key, so no DB writes.
//       Skips images that already have a .original copy (safe to re-run).
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { cleanDiagram, looksLikePhoto } from '../app/lib/cleanDiagram'

const BUCKET = 'mathwithmelinda-submissions'

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const credentials = { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
const ddb = new DynamoDBClient({ region: 'us-east-1', credentials })
const doc = DynamoDBDocumentClient.from(ddb)
const s3 = new S3Client({ region: 'us-east-1', credentials })

const args = process.argv.slice(2)
const previewDir = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null
const apply = args.includes('--apply')
const lessonFilter = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null

/** Same pipeline the editor runs in the browser, returned as JPEG; null if already clean. */
async function clean(input: Buffer): Promise<Buffer | null> {
  // .rotate() applies EXIF orientation, matching how the browser draws it.
  // Same 2400px working size as the browser, so results match.
  const { data, info } = await sharp(input).rotate()
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const img = { width: info.width, height: info.height, data: new Uint8Array(data) }
  if (!looksLikePhoto(img)) return null
  const r = cleanDiagram(img)
  return sharp(Buffer.from(r.data), { raw: { width: r.width, height: r.height, channels: 1 } })
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer()
}

async function exists(key: string) {
  try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true } catch { return false }
}

async function main() {
  if (!previewDir && !apply) { console.error('Pass --preview <dir> or --apply'); process.exit(1) }

  // The live Gen 2 table is the one with rows; the others are leftovers
  const tables: string[] = []
  let start: string | undefined
  do {
    const r = await ddb.send(new ListTablesCommand({ ExclusiveStartTableName: start }))
    tables.push(...(r.TableNames ?? [])); start = r.LastEvaluatedTableName
  } while (start)

  const keys = new Set<string>()
  for (const table of tables.filter(t => t.startsWith('AssignmentQuestion-'))) {
    let lastKey: Record<string, unknown> | undefined
    do {
      const r = await doc.send(new ScanCommand({
        TableName: table,
        FilterExpression: lessonFilter ? 'attribute_exists(diagramKey) AND lessonTemplateQuestionsId = :l' : 'attribute_exists(diagramKey)',
        ExpressionAttributeValues: lessonFilter ? { ':l': lessonFilter } : undefined,
        ProjectionExpression: 'diagramKey',
        ExclusiveStartKey: lastKey,
      }))
      for (const item of r.Items ?? []) if (item.diagramKey) keys.add(item.diagramKey as string)
      lastKey = r.LastEvaluatedKey
    } while (lastKey)
  }
  console.log(`${keys.size} diagram image(s)`)
  if (previewDir) fs.mkdirSync(previewDir, { recursive: true })

  let done = 0, skipped = 0, alreadyClean = 0
  for (const key of keys) {
    const backupKey = key.replace(/(\.[^.]+)$/, '.original$1')
    if (apply && await exists(backupKey)) { skipped++; continue }

    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const original = Buffer.from(await obj.Body!.transformToByteArray())
    const cleaned = await clean(original)
    if (!cleaned) { alreadyClean++; continue }

    if (previewDir) {
      const base = path.basename(key).replace(/\.[^.]+$/, '')
      fs.writeFileSync(path.join(previewDir, `${base}.before.jpg`), original)
      fs.writeFileSync(path.join(previewDir, `${base}.after.jpg`), cleaned)
    }
    if (apply) {
      await s3.send(new CopyObjectCommand({ Bucket: BUCKET, CopySource: `${BUCKET}/${key}`, Key: backupKey }))
      // Key keeps its extension (maybe .png) so diagramKey stays valid; the
      // ContentType header tells the browser what it actually is
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: cleaned, ContentType: 'image/jpeg' }))
    }
    done++
    console.log(`${apply ? 'cleaned' : 'previewed'} ${key}`)
  }
  console.log(`done: ${done}, skipped (cleaned on a previous run): ${skipped}, left alone (already white): ${alreadyClean}`)
}

main().catch(err => { console.error(err); process.exit(1) })
