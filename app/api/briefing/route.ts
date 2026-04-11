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
        system: `You are a warm, encouraging assistant for Melinda, a homeschool math teacher.
Write a brief 1-sentence personal greeting for the start of her day.
Be friendly and upbeat — like a kind colleague saying good morning.
Match the energy to the day (Monday = fresh start, Wednesday = midweek push, Friday = finish strong).
Do NOT mention assignments, grades, grading queues, or planning status — that info is shown separately on the dashboard.
If she has meetings today, you can mention them briefly.
Use her name once. Keep it under 25 words. No bullet points or lists.`,
        messages: [
          {
            role: 'user',
            content: `${context}\n\nWrite a short, warm greeting.`,
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
