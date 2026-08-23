import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { presign } from '@/app/lib/presign'
import { generateGradeSuggestion } from '@/app/lib/gradeSuggestionCore'

/**
 * FALLBACK host for AI grade suggestions — kept for local dev and for clients
 * whose amplify_outputs.json predates the grade-suggestion Lambda.
 *
 * In production the grades page calls the Lambda function URL instead
 * (outputs.custom.gradeSuggestionUrl): Amplify Hosting kills SSR requests at a
 * hard 30 seconds, and Opus with thinking takes ~50s on a multi-photo
 * submission, so this route times out (empty-body response, "Unexpected end of
 * JSON input" in the client) on anything but small submissions. All grading
 * logic lives in app/lib/gradeSuggestionCore.ts, shared with the Lambda.
 */

const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const s3 = new S3Client({
  region: 'us-east-1',
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
})

function presignSubmission(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: 'mathwithmelinda-submissions', Key: key })
  return presign(s3, command, { expiresIn: 300 })
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    const anthropic = new Anthropic({ apiKey })

    const input = await req.json()
    const result = await generateGradeSuggestion(input, { anthropic, presignSubmission })
    return NextResponse.json(result.body, { status: result.status })
  } catch (err: any) {
    console.error('Grade suggestion error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 })
  }
}
