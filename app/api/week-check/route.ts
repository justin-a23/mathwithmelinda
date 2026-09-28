import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'
import { reviewLessonWithClaude } from '@/app/lib/weekCheckCore'

/**
 * FALLBACK host for the "Check my week" Claude review, for local dev and for
 * clients whose amplify_outputs.json predates the week-check Lambda.
 *
 * In production the schedule page calls the Lambda function URL instead
 * (outputs.custom.weekCheckUrl): Amplify Hosting kills SSR requests at a hard
 * 30 seconds, and Opus working through a chapter test takes longer. All review
 * logic lives in app/lib/weekCheckCore.ts, shared with the Lambda.
 */
export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    const anthropic = new Anthropic({ apiKey })

    const input = await req.json()
    const result = await reviewLessonWithClaude(input, anthropic)
    return NextResponse.json(result.body, { status: result.status })
  } catch (err: any) {
    console.error('Week check error:', err)
    return NextResponse.json({ error: err.message || 'Failed to review lesson' }, { status: 500 })
  }
}
