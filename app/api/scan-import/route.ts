import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ExtractedQuestion = {
  type: 'show_work' | 'number' | 'multiple_choice' | 'section_header' | 'instructions'
  text: string
  answer?: string
  choices?: string
  hasImage: boolean
}

export type ScanImportResult = {
  instructions?: string
  questions: ExtractedQuestion[]
}

const SYSTEM_PROMPT = `You are extracting math problems from a scanned worksheet page for a homeschool math learning platform.

Your job is to return a JSON object with this exact shape:
{
  "instructions": "optional string — only include if there is a top-level instruction for the whole page, like a watch-this-video note",
  "questions": [
    {
      "type": "show_work" | "number" | "multiple_choice" | "section_header" | "instructions",
      "text": "the question text",
      "answer": "the correct answer if visible (often not shown)",
      "choices": "for multiple_choice only: one choice per line",
      "hasImage": true or false
    }
  ]
}

Rules:
- Use "section_header" for section labels like "11.3 Solve." or "11.5 Find the missing side."  Include the full section instruction text in "text".
- Use "show_work" for problems where students must show work (equations, radical simplification, geometry, proofs, word problems, anything requiring steps).
- Use "number" only for problems where the answer is a single number with no work needed.
- Use "multiple_choice" for problems with lettered or numbered answer choices.
- Always prefix question text with the problem number exactly as printed, e.g. "39. 7√10 + 3√10" or "51. Find the missing side."
- For math symbols use Unicode: √ for square root, ² for squared, ³ for cubed, ∠ for angle, π for pi, ≠ for not-equal, ≤ ≥ for inequalities. Use fractions like (w²)/(-5) for complex fractions.
- For problems involving a triangle diagram: describe the triangle in the question text with all labeled side lengths and angles. Example: "51. Right triangle with legs 12 and 9. Find the length of the missing side (hypotenuse)." Set hasImage to true.
- For problems involving a coordinate grid: describe what points or shapes are shown. Example: "55. Find the distance between the two points plotted on the coordinate grid." Set hasImage to true.
- For trig problems with a labeled diagram: include all side lengths and angle labels in the text. Example: "59. For the triangle with sides A=35, B=21, C=28 (where C is the vertex angle): sin ∠A = ___, cos ∠A = ___, tan ∠A = ___" Set hasImage to true.
- Set hasImage to false for pure text/equation problems.
- Do not include blank answer lines (___) in the extracted text — just the question stem.
- Return ONLY valid JSON. No markdown, no commentary, no code fences.`

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const formData = await req.formData()
    const files = formData.getAll('images') as File[]
    const teacherInstructions = (formData.get('instructions') as string | null) || ''

    if (!files.length) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const allQuestions: ExtractedQuestion[] = []
    let globalInstructions: string | undefined

    for (const file of files) {
      const isPdf = file.type === 'application/pdf'
      const isImage = file.type.startsWith('image/')

      if (!isPdf && !isImage) {
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
      }
      // 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: `File too large (max 20MB): ${file.name}` }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Build content block — PDFs use 'document', images use 'image'
      let contentBlock: any
      if (isPdf) {
        contentBlock = {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        }
      } else {
        let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
        if (file.type === 'image/png') mediaType = 'image/png'
        else if (file.type === 'image/webp') mediaType = 'image/webp'
        contentBlock = {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        }
      }

      // Build user text: if teacher specified problem numbers, only extract those
      let userText = 'Extract all math problems from this worksheet. Return JSON only.'
      if (teacherInstructions) {
        // Look for patterns like "#s: 45, 47, 51" or "problems 3-8" or "#45, 47"
        const numbersMatch = teacherInstructions.match(/#s?:?\s*([\d,\s\-–and]+)/i)
        if (numbersMatch) {
          const rawNums = numbersMatch[1]
          userText = `The teacher's instructions are: "${teacherInstructions}"\n\nOnly extract the specific problems listed in those instructions (${rawNums.trim()}). Skip all other problems on the page. Return JSON only.`
        }
      }

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              contentBlock,
              {
                type: 'text',
                text: userText,
              },
            ],
          },
        ],
      })

      const raw = (message.content[0] as any).text as string

      // Strip markdown code fences if Claude included them
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

      let parsed: ScanImportResult
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('Claude returned non-JSON:', raw)
        return NextResponse.json({ error: 'Claude returned an unexpected response. Try again.' }, { status: 500 })
      }

      if (parsed.instructions && !globalInstructions) {
        globalInstructions = parsed.instructions
      }
      if (Array.isArray(parsed.questions)) {
        allQuestions.push(...parsed.questions)
      }
    }

    return NextResponse.json({
      instructions: globalInstructions,
      questions: allQuestions,
      total: allQuestions.filter(q => q.type !== 'section_header' && q.type !== 'instructions').length,
    })
  } catch (err: any) {
    console.error('scan-import error:', err)
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 })
  }
}
