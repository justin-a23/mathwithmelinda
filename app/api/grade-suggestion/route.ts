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

async function fetchImageAsBase64(key: string): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }> {
  const command = new GetObjectCommand({ Bucket: 'mathwithmelinda-submissions', Key: key })
  const url = await getSignedUrl(s3, command, { expiresIn: 60 })
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const ct = res.headers.get('content-type') || 'image/jpeg'
  const mediaType = ct.includes('png') ? 'image/png' : ct.includes('webp') ? 'image/webp' : ct.includes('gif') ? 'image/gif' : 'image/jpeg'
  return { data: base64, mediaType }
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

    // Fetch up to 3 images as base64 (Claude vision limit per call)
    const images = await Promise.all(
      (imageKeys as string[]).slice(0, 3).map(fetchImageAsBase64)
    )

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

    const content: Anthropic.MessageParam['content'] = [
      ...images.map(img => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
      })),
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
