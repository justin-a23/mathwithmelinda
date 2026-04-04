import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const s3 = new S3Client({
  region: 'us-east-1',
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
})

async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: 'mathwithmelinda-submissions', Key: key })
  return getSignedUrl(s3, command, { expiresIn: 300 })
}

async function fetchAsBase64Pdf(key: string): Promise<string> {
  const url = await getPresignedUrl(key)
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    const anthropic = new Anthropic({ apiKey })

    const {
      imageKeys,
      questions,
      studentName,
      lessonTitle,
      teachingVoice,
      answers,      // { [questionId]: string } — student's digital answers
      teachingNotes, // Abeka/curriculum method notes from the lesson template
    } = await req.json()

    const hasFiles = imageKeys && imageKeys.length > 0
    const hasAnswers = answers && Object.keys(answers).length > 0

    if (!hasFiles && !hasAnswers) {
      return NextResponse.json({ error: 'No submission content to review — no photos or digital answers found.' }, { status: 400 })
    }

    // ── Build question list ────────────────────────────────────────────────
    const questionList = (questions as { id?: string; questionText: string; questionType: string; correctAnswer?: string | null }[])
      .filter(q => q.questionType !== 'section_header')

    // ── Digital answers summary ────────────────────────────────────────────
    let digitalSummary = ''
    {
      let qNum = 0
      const lines = questionList
        .filter(q => q.questionType !== 'show_work')
        .map(q => {
          qNum++
          const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
          const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
          const text = bookNumMatch ? bookNumMatch[2] : q.questionText
          const studentAnswer = q.id ? ((answers as Record<string, string>)[q.id] || '(no answer)') : '(no answer)'
          const correctHint = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
          return `  [id:${q.id}] ${label} ${text}\n     → Student answered: ${studentAnswer}${correctHint}`
        })
      if (lines.length > 0) {
        digitalSummary = `DIGITAL ANSWERS (compare student answers to [correct:] values if provided):\n${lines.join('\n\n')}`
      }
    }

    // ── Show-work questions list ───────────────────────────────────────────
    const showWorkQuestions = questionList.filter(q => q.questionType === 'show_work')
    const showWorkCount = showWorkQuestions.length
    let showWorkSummary = ''
    if (showWorkCount > 0) {
      if (hasFiles) {
        let swNum = 0
        const lines = showWorkQuestions.map(q => {
          swNum++
          const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
          const label = bookNumMatch ? bookNumMatch[1] : `${swNum}.`
          const text = bookNumMatch ? bookNumMatch[2] : q.questionText
          const correctHint = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
          return `  [id:${q.id}] ${label} ${text}${correctHint}`
        })
        showWorkSummary = `SHOW-WORK QUESTIONS (student wrote answers on paper — see the uploaded worksheet image${showWorkCount > 1 ? 's' : ''}):\n${lines.join('\n')}\nLook at the uploaded image carefully. Find each question and mark it correct or wrong.`
      } else {
        showWorkSummary = `SHOW-WORK QUESTIONS: This assignment had ${showWorkCount} show-work problem(s) but the student did NOT upload a photo. Mark all show-work questions as wrong (false).`
      }
    }

    // ── Voice/style instruction ────────────────────────────────────────────
    const voiceInstruction = teachingVoice?.trim()
      ? teachingVoice.trim()
      : 'Write in a warm, encouraging, direct tone. Point out the specific mistake and explain the correct approach. Keep the comment to 2–3 sentences.'

    const curriculumSection = teachingNotes?.trim()
      ? `\nCURRICULUM METHOD (Abeka — grade against this method, not other approaches):\n${teachingNotes.trim()}`
      : ''

    const systemPrompt = `You are grading a math assignment for a homeschool teacher named Melinda.

Teacher's feedback style: ${voiceInstruction}${curriculumSection}

GRADING RULES:
1. Grade on a 0–100 scale. Every non-header question has equal weight.
2. DIGITAL questions: compare the student's answer to the [correct:] value if one is given. Blank answer = wrong.
3. SHOW-WORK questions: examine the uploaded image carefully. Find the question number on the worksheet and determine if the student's work and answer are correct. Mark true or false.
4. If no [correct:] hint is given and you can't verify an answer from the image, mark it false (don't guess correct).
5. Never give 100% unless every question is clearly correct.

Return a JSON object — EXACTLY this format, no markdown, no extra text:
{
  "grade": "73",
  "comment": "2–3 sentence summary for the student covering digital and show-work performance.",
  "questionResults": [
    {"id": "EXACT_QUESTION_ID", "correct": true},
    {"id": "EXACT_QUESTION_ID", "correct": false}
  ]
}

Include every gradable question in questionResults. Use the exact id values from the question list.`

    const userParts: string[] = [
      `Student: ${studentName || 'Unknown'}`,
      `Lesson: ${lessonTitle || 'Unknown'}`,
    ]
    if (digitalSummary) userParts.push(digitalSummary)
    if (showWorkSummary) userParts.push(showWorkSummary)
    if (hasFiles) userParts.push('The uploaded image shows the student\'s handwritten show-work sheet. Use it to grade the show-work questions listed above.')

    const userPrompt = userParts.join('\n\n')

    // ── Build file blocks (images + PDFs) ─────────────────────────────────
    const fileBlocks: Anthropic.MessageParam['content'] = []
    if (hasFiles) {
      const keys = (imageKeys as string[]).slice(0, 3)
      const blocks = await Promise.all(keys.map(async (key) => {
        const isPdf = key.toLowerCase().endsWith('.pdf')
        if (isPdf) {
          const data = await fetchAsBase64Pdf(key)
          return { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
        } else {
          const url = await getPresignedUrl(key)
          return { type: 'image' as const, source: { type: 'url' as const, url } }
        }
      }))
      fileBlocks.push(...blocks)
    }

    const content: Anthropic.MessageParam['content'] = [
      ...fileBlocks,
      { type: 'text' as const, text: userPrompt },
    ]

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      grade: parsed.grade || '',
      comment: parsed.comment || '',
      questionResults: parsed.questionResults || [],
    })
  } catch (err: any) {
    console.error('Grade suggestion error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 })
  }
}
