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

    // ── Build digital answers summary ──────────────────────────────────────
    const questionList = (questions as { id?: string; questionText: string; questionType: string; correctAnswer?: string | null }[])
      .filter(q => q.questionType !== 'section_header')

    let digitalSummary = ''
    if (hasAnswers && questionList.length > 0) {
      let qNum = 0
      const lines = questionList
        .filter(q => q.questionType !== 'show_work')
        .map(q => {
          qNum++
          const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
          const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
          const text = bookNumMatch ? bookNumMatch[2] : q.questionText
          const studentAnswer = q.id ? (answers[q.id] || '(no answer)') : '(no answer)'
          const correct = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
          return `  ${label} ${text}\n     → Student answered: ${studentAnswer}${correct}`
        })
      if (lines.length > 0) {
        digitalSummary = `DIGITAL ANSWERS (entered online):\n${lines.join('\n\n')}`
      }
    }

    const showWorkCount = questionList.filter(q => q.questionType === 'show_work').length
    const showWorkNote = hasFiles
      ? `SHOW WORK (${showWorkCount} problem${showWorkCount !== 1 ? 's' : ''} — see uploaded image${(imageKeys as string[]).length > 1 ? 's' : ''} above)`
      : ''

    // ── Build voice/style instruction ─────────────────────────────────────
    const voiceInstruction = teachingVoice?.trim()
      ? teachingVoice.trim()
      : 'Write in a warm, encouraging, direct tone. Point out the specific mistake and explain the correct approach. Keep the comment to 2 sentences maximum.'

    const curriculumSection = teachingNotes?.trim()
      ? `\nCURRICULUM METHOD (Abeka — grade against this, not other approaches):\n${teachingNotes.trim()}`
      : ''

    const showWorkQuestionCount = (questions as { questionType: string }[]).filter(q => q.questionType === 'show_work').length
    const expectedUploadCount = showWorkQuestionCount > 0 ? showWorkQuestionCount : 0
    const actualUploadCount = hasFiles ? (imageKeys as string[]).length : 0
    const missingUploadNote = expectedUploadCount > 0 && actualUploadCount === 0
      ? `\nWARNING: This assignment has ${expectedUploadCount} show-work problem(s) that require a photo upload. NO photo was uploaded. Treat all show-work questions as unanswered (0 credit).`
      : ''

    const systemPrompt = `You are helping a homeschool math teacher named Melinda grade student work.

Teacher's style instructions: ${voiceInstruction}${curriculumSection}

GRADING RULES — follow these exactly:
1. Grade on a 0–100 scale. Each non-header question carries equal weight.
2. A blank or missing answer = wrong. Set correct: false for that question.
3. If a correct answer is provided in [correct: ...], compare it to the student's answer. Even minor arithmetic errors = wrong.
4. For show_work questions: set correct: null (teacher reviews the uploaded image manually). Unless NO photo was uploaded — then set correct: false.
5. Do NOT assume answers are correct when you cannot verify them.
6. If curriculum method notes are provided, evaluate whether the student used the correct method.
7. Never give 100% unless every single digital answer is verified correct.${missingUploadNote}

Evaluate each question individually and return a JSON object in EXACTLY this format — no other text, no markdown:
{
  "grade": "73",
  "comment": "Feedback for student (2-3 sentences max).",
  "questionResults": [
    {"id": "QUESTION_ID_HERE", "correct": true},
    {"id": "QUESTION_ID_HERE", "correct": false},
    {"id": "QUESTION_ID_HERE", "correct": null}
  ]
}

Use true = correct, false = wrong, null = needs manual review (show_work or uncertain).
Only include gradable questions (not section headers). The grade should match the ratio of correct answers.`

    const userParts: string[] = [
      `Student: ${studentName || 'Unknown'}`,
      `Lesson: ${lessonTitle || 'Unknown'}`,
    ]
    if (digitalSummary) userParts.push(digitalSummary)
    if (showWorkNote) userParts.push(showWorkNote)
    if (hasFiles) userParts.push('Review the uploaded image(s) for the show-work problems.')
    userParts.push('Evaluate each question individually. Return the JSON with grade, comment, and questionResults array as described.')
    userParts.push(`Question IDs for reference:\n${questionList.map(q => `  id: ${q.id} (type: ${q.questionType})`).join('\n')}`)

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
