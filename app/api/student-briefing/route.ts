import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { getStudentDailyEncouragement } from './encouragement'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { studentName, dayOfWeek, hourOfDay } = await req.json()

    const encouragement = getStudentDailyEncouragement()

    // If no API key, just return the verse/prayer — still valuable
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ briefing: encouragement, encouragement })
    }

    const hour = typeof hourOfDay === 'number' ? hourOfDay : new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    const context = [
      studentName ? `Student's first name: ${studentName}` : null,
      `Day of the week: ${dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' })}`,
      `Time of day: ${timeOfDay}`,
    ].filter(Boolean).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `You are a warm, encouraging assistant for a homeschool math student (grades 6-9).
Write a brief 1-sentence personal greeting appropriate for the time of day (use "Good morning", "Good afternoon", or "Good evening" accordingly).
Be friendly and upbeat — like a kind teacher greeting them.
Match the energy to the day (Monday = fresh start, Wednesday = midweek push, Friday = finish strong).
Do NOT mention assignments, grades, or anything about their workload — that info is shown separately.
Use their first name once. Keep it under 25 words. No bullet points or lists.`,
        messages: [
          {
            role: 'user',
            content: `${context}\n\nWrite a short, warm greeting.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ briefing: encouragement, encouragement })
    }

    const data = await res.json()
    const personalNote = data.content?.[0]?.text || ''
    const briefing = personalNote
      ? `${personalNote}\n\n${encouragement}`
      : encouragement

    return NextResponse.json({ briefing, encouragement })
  } catch (err: any) {
    console.error('Student briefing error:', err)
    try {
      const encouragement = getStudentDailyEncouragement()
      return NextResponse.json({ briefing: encouragement, encouragement })
    } catch {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }
}
