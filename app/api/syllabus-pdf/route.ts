import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'mathwithmelinda-submissions'

function makeS3() {
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
  return new S3Client({
    region: 'us-east-1',
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  })
}

// GET ?action=upload&semesterId=xxx  → { uploadUrl, key }
// GET ?action=view&key=xxx           → { url }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    const hasKey = !!(process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)
    const hasSecret = !!(process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
    console.log('[syllabus-pdf] credentials present:', { hasKey, hasSecret, action })
    const s3 = makeS3()

    if (action === 'upload') {
      const semesterId = searchParams.get('semesterId')
      if (!semesterId) return NextResponse.json({ error: 'Missing semesterId' }, { status: 400 })
      const key = `syllabi/${semesterId}/${Date.now()}.pdf`
      const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: 'application/pdf' })
      const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 })
      return NextResponse.json({ uploadUrl, key })
    }

    if (action === 'view') {
      const key = searchParams.get('key')
      if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
      const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
      const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 })
      return NextResponse.json({ url })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('syllabus-pdf error:', err)
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}
