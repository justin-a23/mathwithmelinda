import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { presign } from '@/app/lib/presign'
import { NextRequest, NextResponse } from 'next/server'
import { s3, SUBMISSIONS_BUCKET as BUCKET } from '../../lib/s3'
import { requireAuth } from '@/app/lib/auth'
import { canReadProfileKey } from '@/app/lib/ownership'

// GET /api/profile-pic?key=profiles/... — returns a signed read URL
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    // Constrained to profiles/ — this bucket also holds submitted student work,
    // so an unchecked key here would read anyone's uploads.
    if (!(await canReadProfileKey(auth, key))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const url = await presign(s3, command, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Profile pic GET error:', err)
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}

// POST /api/profile-pic — multipart upload, saves to S3 server-side
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  let step = 'parse formData'
  try {
    const formData = await request.formData()

    step = 'get file'
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file in form data' }, { status: 400 })

    // The owner is whoever holds the token. A userId from the form body would
    // let any signed-in user overwrite someone else's avatar at profiles/{id}.jpg.
    const userId = authResult.userId

    step = 'read file buffer'
    const buffer = Buffer.from(await file.arrayBuffer())

    step = 'upload to S3'
    const key = 'profiles/' + userId + '.jpg'
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }))

    return NextResponse.json({ key })
  } catch (err: any) {
    console.error(`Profile pic POST error at step [${step}]:`, err)
    return NextResponse.json({ error: `[${step}] ${err?.message || 'Unknown error'}` }, { status: 500 })
  }
}
