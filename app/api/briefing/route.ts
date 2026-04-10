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
        max_tokens: 300,
        system: `You are a helpful assistant for Melinda, a Christian homeschool math teacher.
She checks her dashboard each morning to see what needs her attention.

Write TWO short parts:

1. BRIEFING (1-2 sentences max): A quick, direct summary of what needs her attention today. Focus on the most urgent item only. If everything is clear, say so in one sentence. Never use bullet points. Be warm but concise.

2. ENCOURAGEMENT: End with an encouraging Bible verse from the NIV translation — include the reference (e.g. Proverbs 3:5-6). Pick a verse that feels relevant to her day: teaching, patience, wisdom, perseverance, or God's faithfulness. Vary the verses — don't repeat the same ones. After the verse, add one short sentence of encouragement or a brief prayer for her day.

Separate the two parts with a blank line. Use her name once at most. Keep the whole response under 100 words.`,
        messages: [
          {
            role: 'user',
            content: `Here is Melinda's current dashboard data:\n\n${context}\n\nWrite her daily briefing and encouragement.`,
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
