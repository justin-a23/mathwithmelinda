import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { getDailyEncouragement } from './encouragement'

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
        max_tokens: 150,
        system: `You are a helpful assistant for Melinda, a homeschool math teacher.
She checks her dashboard each morning to see what needs her attention.
Write a brief 1-2 sentence daily briefing based on the data provided.
Be direct and friendly — like a smart assistant giving her a quick heads-up.
Focus on the most urgent or time-sensitive item first.
Never use bullet points or lists. Write in flowing sentences.
If everything is clear, say so in one short sentence.
Use her name once at most. Keep it under 40 words.`,
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
    const status = data.content?.[0]?.text || ''
    const encouragement = getDailyEncouragement()
    const briefing = status ? `${status}\n\n${encouragement}` : encouragement
    return NextResponse.json({ briefing })
  } catch (err: any) {
    console.error('Briefing error:', err)
    // Even if the AI call fails, still return the encouragement
    try {
      const encouragement = getDailyEncouragement()
      return NextResponse.json({ briefing: encouragement })
    } catch {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }
}
