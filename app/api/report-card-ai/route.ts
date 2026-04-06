import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    const anthropic = new Anthropic({ apiKey })

    const {
      mode,           // 'generate' | 'polish'
      draft,          // only for polish mode
      studentName,
      courseName,
      semesterName,
      finalLetter,
      weightedAvg,
      lessonAvg,
      quizAvg,
      testAvg,
      lessonWeight,
      quizWeight,
      testWeight,
      completedCount,
      totalCount,
      teachingVoice,
      assignments,    // AssignmentResult[] — for generate mode
    } = await req.json()

    const defaultVoice = 'Write warmly and encouragingly, like a caring math teacher who genuinely knows this student. Be specific, direct, and positive. Keep it personal — not generic.'
    const voice = teachingVoice?.trim() || defaultVoice

    let systemPrompt: string
    let userPrompt: string

    if (mode === 'polish') {
      if (!draft?.trim()) {
        return NextResponse.json({ error: 'No draft provided to polish' }, { status: 400 })
      }

      systemPrompt = `You are helping Melinda, a homeschool math teacher, polish her report card comments.
Your job: take her draft and improve it — fix grammar, smooth the flow, make it sound warm and professional.
Keep her meaning and voice EXACTLY intact. Don't add new information she didn't mention. Don't make it longer than she wrote.
Return only the polished text with no explanation or preamble.`

      userPrompt = `Melinda's draft:\n\n${draft.trim()}`

    } else {
      // generate mode — build a rich context from grade data
      const gradeContext: string[] = [
        `Student: ${studentName}`,
        `Course: ${courseName} — ${semesterName}`,
        `Overall grade: ${finalLetter} (${weightedAvg !== null ? weightedAvg.toFixed(1) + '%' : 'no final average yet'})`,
        `Assignments completed: ${completedCount} out of ${totalCount}`,
      ]

      if (lessonAvg !== null) gradeContext.push(`Lesson average: ${lessonAvg.toFixed(1)}% (weight: ${lessonWeight}%)`)
      if (quizAvg !== null)  gradeContext.push(`Participation/quiz average: ${quizAvg.toFixed(1)}% (weight: ${quizWeight}%)`)
      if (testAvg !== null)  gradeContext.push(`Test average: ${testAvg.toFixed(1)}% (weight: ${testWeight}%)`)

      // Find notable assignments — top 2 and bottom 2 with actual scores
      if (assignments?.length > 0) {
        const graded = assignments
          .filter((a: any) => a.score && a.score !== 'Pending' && !isNaN(parseFloat(a.score)))
          .sort((a: any, b: any) => parseFloat(b.score) - parseFloat(a.score))

        if (graded.length > 0) {
          const top = graded.slice(0, 2).map((a: any) => `${a.title} (${a.score}%)`).join(', ')
          gradeContext.push(`Strongest work: ${top}`)
        }
        if (graded.length > 2) {
          const bottom = graded.slice(-2).map((a: any) => `${a.title} (${a.score}%)`).join(', ')
          gradeContext.push(`Lowest scores: ${bottom}`)
        }
      }

      systemPrompt = `You are writing a quarterly report card comment for Melinda, a homeschool math teacher.

Teacher's voice: ${voice}

Write a 2–4 sentence personal comment from Melinda directly to the student (and their parents who will also read this).
Rules:
- Use "you" to address the student directly
- Be specific — mention their grade, a strength, and if grades allow, one area to keep working on
- Do NOT start with "I"
- Do NOT use phrases like "Overall," "In conclusion," or generic openers
- Sound like a real teacher who knows this student, not a form letter
- Return only the comment text — no labels, no preamble`

      userPrompt = gradeContext.join('\n')
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const comment = ((message.content[0] as any).text || '').trim()
    return NextResponse.json({ comment })

  } catch (err: any) {
    console.error('report-card-ai error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate comment' }, { status: 500 })
  }
}
