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

    const { imageKeys, questions, studentName, lessonTitle, teachingVoice } = await req.json()

    if (!imageKeys || imageKeys.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // Build content blocks for up to 3 files (images or PDFs)
    const keys = (imageKeys as string[]).slice(0, 3)

    const questionList = (questions as { questionText: string; questionType: string; correctAnswer?: string | null }[])
      .filter(q => q.questionType !== 'section_header')
      .map((q, i) => {
        const ans = q.correctAnswer ? ` (correct answer: ${q.correctAnswer})` : ''
        return `${i + 1}. ${q.questionText}${ans}`
      })
      .join('\n')

    const voiceInstruction = teachingVoice?.trim()
      ? `Write in this teacher's voice: ${teachingVoice.trim()}`
      : 'Write in a warm, encouraging, and direct tone. Point out specific mistakes and explain the correct approach. Keep comments to 2–3 sentences.'

    const systemPrompt = `You are helping a homeschool math teacher named Melinda grade student work and write feedback.
${voiceInstruction}
When suggesting a grade, use a 0–100 scale. Be fair but honest.
Respond ONLY with valid JSON in this exact format:
{"grade": "85", "comment": "Your feedback here."}`

    const userPrompt = `Student: ${studentName || 'Unknown'}
Lesson: ${lessonTitle || 'Unknown'}

${questionList ? `Questions on this assignment:\n${questionList}\n\n` : ''}Please review the student's submitted work in the image(s) and provide:
1. A suggested grade (0–100)
2. A comment for the student in Melinda's voice — noting what they did well and where they went wrong`

    const fileBlocks = await Promise.all(keys.map(async (key) => {
      const isPdf = key.toLowerCase().endsWith('.pdf')
      if (isPdf) {
        const data = await fetchAsBase64Pdf(key)
        return { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
      } else {
        const url = await getPresignedUrl(key)
        return { type: 'image' as const, source: { type: 'url' as const, url } }
      }
    }))

    const content: Anthropic.MessageParam['content'] = [
      ...fileBlocks,
      { type: 'text' as const, text: userPrompt },
    ]

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    const parsed = JSON.parse(text)

    return NextResponse.json({ grade: parsed.grade || '', comment: parsed.comment || '' })
  } catch (err: any) {
    console.error('Grade suggestion error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 })
  }
}
