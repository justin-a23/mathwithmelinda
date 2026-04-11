import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { getStudentDailyEncouragement } from './encouragement'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { studentName, assignmentsDue, assignmentsOverdue, dayOfWeek } = await req.json()

    const encouragement = getStudentDailyEncouragement()

    // If no API key, just return the verse/prayer — still valuable
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ briefing: encouragement, encouragement })
    }

    const context = [
      studentName ? `Student's name: ${studentName}` : null,
      `Day: ${dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' })}`,
      assignmentsDue != null ? `Assignments due this week: ${assignmentsDue}` : null,
      assignmentsOverdue != null && assignmentsOverdue > 0 ? `Overdue assignments: ${assignmentsOverdue}` : null,
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
        max_tokens: 100,
        system: `You are a warm, encouraging assistant for a homeschool math student (grades 6-9).
Write a brief 1-sentence personal encouragement based on their current status.
Be friendly and upbeat — like a coach giving a quick pep talk before class.
If they have overdue work, gently encourage them to catch up without guilt.
If they're all caught up, celebrate that.
Use their first name once. Keep it under 30 words. No bullet points.`,
        messages: [
          {
            role: 'user',
            content: `Here is the student's current status:\n\n${context}\n\nWrite a short personal encouragement.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      // API failed — still return the verse/prayer
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
    // Always return something useful even on failure
    try {
      const encouragement = getStudentDailyEncouragement()
      return NextResponse.json({ briefing: encouragement, encouragement })
    } catch {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }
}
