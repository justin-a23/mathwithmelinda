import { NextRequest, NextResponse } from 'next/server'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { requireAuth } from '@/app/lib/auth'

// Same credential fallback as app/lib/s3.ts: explicit creds when set
// (Amplify hosting, using the MWM_ prefix since Amplify blocks AWS_-prefixed
// env vars), otherwise the Lambda execution role.
function makeSnsClient() {
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN
  if (accessKeyId && secretAccessKey) {
    return new SNSClient({
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) },
    })
  }
  return new SNSClient({ region: 'us-east-1' })
}

const sns = makeSnsClient()

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

/**
 * Texts the teacher's phone when a student or parent sends a message.
 *
 * Deliberately a no-op until TEACHER_SMS_NUMBER is set, so this is safe to
 * wire into the send-message flows and deploy before that number exists —
 * callers already treat this as fire-and-forget, same as /api/send-email.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const to = process.env.TEACHER_SMS_NUMBER
  if (!to) {
    return NextResponse.json({ success: false, skipped: true })
  }

  try {
    const body = await req.json()
    const from = clean(body.from, 60)
    const preview = clean(body.preview, 140)
    if (!from || !preview) {
      return NextResponse.json({ error: 'Missing required fields: from, preview' }, { status: 400 })
    }

    await sns.send(new PublishCommand({
      PhoneNumber: to,
      Message: `MWM: new message from ${from}: ${preview}`,
    }))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('SMS notify error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
