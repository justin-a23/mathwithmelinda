import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'
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
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

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
      answers,        // { [questionId]: string } — student's digital answers
      teachingNotes,  // Abeka/curriculum method notes from the lesson template
      lockedResults,  // { [questionId]: boolean } — teacher's manual overrides to preserve
    } = await req.json()

    const locked: Record<string, boolean> = lockedResults || {}

    const hasFiles = imageKeys && imageKeys.length > 0
    const hasAnswers = answers && Object.keys(answers).length > 0

    if (!hasFiles && !hasAnswers) {
      return NextResponse.json({ error: 'No submission content to review — no photos or digital answers found.' }, { status: 400 })
    }

    // ── Build question list ────────────────────────────────────────────────
    const questionList = (questions as { id?: string; questionText: string; questionType: string; correctAnswer?: string | null }[])
      .filter(q => q.questionType !== 'section_header')

    const hasLocked = Object.keys(locked).length > 0

    // ── Locked results summary (teacher's confirmed calls) ─────────────────
    let lockedSummary = ''
    if (hasLocked) {
      let qNum = 0
      const lines = questionList.map(q => {
        if (!q.id || !(q.id in locked)) return null
        qNum++
        const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
        const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
        const text = bookNumMatch ? bookNumMatch[2] : q.questionText
        return `  [id:${q.id}] ${label} ${text} → Teacher confirmed: ${locked[q.id] ? 'CORRECT ✓' : 'WRONG ✗'}`
      }).filter(Boolean)
      if (lines.length > 0) {
        lockedSummary = `TEACHER-CONFIRMED RESULTS (do NOT change these — include them in your grade and comment):\n${lines.join('\n')}`
      }
    }

    // ── Digital answers summary (unlocked questions only) ──────────────────
    let digitalSummary = ''
    {
      let qNum = 0
      const lines = questionList
        .filter(q => q.questionType !== 'show_work')
        .map(q => {
          qNum++
          if (q.id && q.id in locked) return null  // skip locked
          const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
          const label = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
          const text = bookNumMatch ? bookNumMatch[2] : q.questionText
          const studentAnswer = q.id ? ((answers as Record<string, string>)[q.id] || '(no answer)') : '(no answer)'
          const correctHint = q.correctAnswer ? ` [correct: ${q.correctAnswer}]` : ''
          return `  [id:${q.id}] ${label} ${text}\n     → Student answered: ${studentAnswer}${correctHint}`
        }).filter(Boolean)
      if (lines.length > 0) {
        digitalSummary = `DIGITAL ANSWERS TO GRADE (compare student answers to [correct:] values if provided):\n${lines.join('\n\n')}`
      }
    }

    // ── Show-work questions list (unlocked only) ───────────────────────────
    const showWorkQuestions = questionList.filter(q => q.questionType === 'show_work' && !(q.id && q.id in locked))
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
        const photoCount = (imageKeys as string[]).length
        showWorkSummary = `SHOW-WORK QUESTIONS TO GRADE (student wrote answers on paper — see the ${photoCount} uploaded photo${photoCount > 1 ? 's' : ''}):\n${lines.join('\n')}\nExamine all uploaded photos carefully. The student may have spread their work across multiple sheets. Find each question number and mark it correct or wrong.`
      } else {
        showWorkSummary = `SHOW-WORK QUESTIONS: This assignment had ${showWorkCount} show-work problem(s) but the student did NOT upload a photo. Mark all show-work questions as wrong (false).`
      }
    }

    // ── Voice/style instruction ────────────────────────────────────────────
    const voiceInstruction = teachingVoice?.trim()
      ? teachingVoice.trim()
      : 'Write in a warm, encouraging, direct tone. Point out the specific mistake and explain the correct approach.'

    const curriculumSection = teachingNotes?.trim()
      ? `\nCURRICULUM METHOD (Abeka — grade against this method, not other approaches):\n${teachingNotes.trim()}`
      : ''

    const lockedCount = Object.keys(locked).length
    const lockedInstruction = lockedCount > 0
      ? `\nIMPORTANT: The teacher has already reviewed and confirmed ${lockedCount} question${lockedCount > 1 ? 's' : ''} (marked TEACHER-CONFIRMED above). Do NOT include those in questionResults — they are final. DO factor them into your grade calculation and comment.`
      : ''

    // Extract the student's first name for personalized greeting
    const firstName = (studentName || '').trim().split(/\s+/)[0] || ''

    const systemPrompt = `You are writing feedback for a homeschool math student on behalf of their teacher, Melinda. You are NOT a grading robot — you are speaking AS Melinda, in her voice, with her teaching style.

TEACHER'S VOICE & STYLE:
${voiceInstruction}${curriculumSection}

═══════════════════════════════════════════════════════════════
HOW TO WRITE THE COMMENT — THIS IS THE MOST IMPORTANT PART
═══════════════════════════════════════════════════════════════

The comment is what the student reads. It must sound like a real teacher who actually taught the lesson — not generic AI praise.

STRUCTURE (in this order):
1. Greet the student by first name and praise something specific they got right${firstName ? ` ("Great job, ${firstName}!" or "Nice work, ${firstName}!")` : ''}.
2. For each topic/problem they got WRONG, walk through the actual procedure step-by-step. Don't just state the right answer — TEACH the method. Show the work the way a teacher would explain it at the board.
3. End with brief encouragement.

WHAT MAKES GREAT FEEDBACK (these are the standards to match):

EXAMPLE OF GREAT FEEDBACK:
"Great job, Meredith! Your radical terminology and trigonometry work was solid. It looks like the simplifying of expressions was confusing.
For instance the square root of 169p² simplifies into 13p. You break 169 into (13)(13) and then write p² with fractional exponents then simplify the fraction. That's how many variables come out.
For the square root of x⁸, you write it with fractional exponents x to the 8/2 power which simplifies to x⁴.
Finally, the square root of 2 does not have two identical factors that multiply together, meaning it doesn't come out as an integer. Therefore, it's irrational."

NOTICE WHAT THIS DOES:
- Names the student
- Specific praise ("radical terminology and trigonometry work")
- For EACH wrong problem: explains the WHY and the HOW (break into factors, fractional exponents, simplify)
- Uses phrases like "for instance", "you write it with", "that's how"
- Treats the student like they can learn — gives them the process, not just the answer
- Length matches the depth needed (4–8 sentences total is typical, longer if many wrong)

EXAMPLE OF BAD FEEDBACK (DO NOT WRITE LIKE THIS):
"Great effort on this test! You showed strong understanding of vocabulary terms. Let's work together on simplifying square roots — remember that √(x⁸) = x⁴, not √(x³). Keep practicing, you'll get them down!"

WHY IT'S BAD: Doesn't name the student. Just states the right answer instead of TEACHING the method. Generic encouragement filler. Student learns nothing from "remember that X = Y."

═══════════════════════════════════════════════════════════════
GRADING RULES
═══════════════════════════════════════════════════════════════
1. Grade on a 0–100 scale. Every non-header question has equal weight (including teacher-confirmed ones).
2. DIGITAL questions: if a [correct:] value is given, compare the student's answer. If no [correct:] is given, use your own math knowledge to evaluate. Blank answer = wrong.
3. SHOW-WORK questions: examine every uploaded image carefully. Find each question number on the worksheet and evaluate the student's written work. Mark true or false — do not skip any show-work question.
4. A blank digital answer or missing problem = wrong (false).
5. Never give 100% unless every question is clearly correct.${lockedInstruction}

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════
Return ONLY a JSON object — no markdown fences, no preamble:
{
  "grade": "73",
  "comment": "Greet ${firstName || 'the student'} by name. Praise specifics. Then teach each wrong problem step-by-step using the method. End with brief encouragement.",
  "questionResults": [
    {"id": "EXACT_QUESTION_ID", "correct": true},
    {"id": "EXACT_QUESTION_ID", "correct": false}
  ]
}

Only include questions you are grading in questionResults (not teacher-confirmed ones). Use the exact id values from the question list. The "comment" field can be multiple paragraphs — use \\n between paragraphs for readability when many problems need explanation.`

    const userParts: string[] = [
      `Student: ${studentName || 'Unknown'}`,
      `Lesson: ${lessonTitle || 'Unknown'}`,
    ]
    if (lockedSummary) userParts.push(lockedSummary)
    if (digitalSummary) userParts.push(digitalSummary)
    if (showWorkSummary) userParts.push(showWorkSummary)
    if (hasFiles) {
      const photoCount = (imageKeys as string[]).length
      userParts.push(`The ${photoCount > 1 ? `${photoCount} uploaded photos show` : 'uploaded photo shows'} the student's handwritten show-work sheet${photoCount > 1 ? 's' : ''}. Use ${photoCount > 1 ? 'all of them' : 'it'} to grade the show-work questions listed above.`)
    }

    const userPrompt = userParts.join('\n\n')

    // ── Build file blocks (images + PDFs) ─────────────────────────────────
    const fileBlocks: Anthropic.MessageParam['content'] = []
    if (hasFiles) {
      const keys = (imageKeys as string[]).slice(0, 8)
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
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    // Strip markdown code fences if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    // Extract JSON object even if there's preamble text (e.g. "Looking at the work... {}")
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart > 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
    }
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
