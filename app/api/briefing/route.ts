import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    const { context } = await req.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a helpful assistant for Melinda, a homeschool math teacher.
She checks her dashboard each morning to see what needs her attention.
Write a brief, warm, natural 2-3 sentence daily briefing based on the data provided.
Be direct and friendly — like a smart assistant giving her a quick heads-up.
Focus on what's most urgent or time-sensitive first.
Never use bullet points or lists. Write in flowing sentences.
Don't mention things that are all clear unless everything is fine, in which case say so briefly.
Use her name occasionally but not every sentence.
Today's date and time is provided — factor in urgency accordingly.`,
        messages: [
          {
            role: 'user',
            content: `Here is Melinda's current dashboard data:\n\n${context}\n\nWrite her daily briefing.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await res.json()
    const briefing = data.content?.[0]?.text || ''
    return NextResponse.json({ briefing })
  } catch (err: any) {
    console.error('Briefing error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
