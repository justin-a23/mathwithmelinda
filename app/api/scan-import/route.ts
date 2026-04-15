import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireTeacher } from '@/app/lib/auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type CropRegion = {
  x: number      // left edge as fraction 0-1
  y: number      // top edge as fraction 0-1
  width: number   // width as fraction 0-1
  height: number  // height as fraction 0-1
}

export type ExtractedQuestion = {
  type: 'show_work' | 'number' | 'multiple_choice' | 'section_header' | 'instructions'
  text: string
  answer?: string
  choices?: string
  hasImage: boolean
  pageIndex: number
  cropRegion?: CropRegion
}

export type ScanImportResult = {
  instructions?: string
  questions: ExtractedQuestion[]
}

const SYSTEM_PROMPT = `You are extracting math problems from a scanned worksheet page for a homeschool math learning platform.

The app renders math using KaTeX with \\(...\\) for inline math and \\[...\\] for display/block math.

Your job is to return a JSON object with this exact shape:
{
  "instructions": "optional string — only include if there is a top-level instruction for the whole page, like a watch-this-video note",
  "questions": [
    {
      "type": "show_work" | "number" | "multiple_choice" | "section_header" | "instructions",
      "text": "the question text, with math in \\(...\\) delimiters",
      "answer": "the correct answer if visible (often not shown)",
      "choices": "for multiple_choice only: one choice per line",
      "hasImage": true or false,
      "cropRegion": { "x": 0.0, "y": 0.0, "width": 1.0, "height": 0.2 }
    }
  ]
}

Math formatting rules (CRITICAL — the renderer only processes \\(...\\) delimiters):
- Wrap ALL math expressions in \\( and \\). Plain text outside stays as-is.
- Use \\frac{numerator}{denominator} for fractions. Example: \\(\\frac{w^2}{-5}\\) + 9 = -116
- Use ^ for exponents: w^2, x^3. Use _ for subscripts when needed.
- Use \\sqrt{...} for square roots: \\(7\\sqrt{10} + 3\\sqrt{10}\\)
- Use \\angle for angle symbol, \\pi for pi, \\leq \\geq \\neq for inequalities.
- Use \\cdot or \\times for multiplication when needed.
- Mixed text + math example: "\\(\\frac{w^2}{-5}\\) + 9 = -116" or "Find \\(\\sin \\angle A\\)."
- For pure equation lines (nothing but math), you may use \\[...\\] for centered display: "\\[\\frac{x^2}{4} - 3 = 5\\]"

Problem text rules:
- Always prefix with the problem number exactly as printed: "51. ...", "39. ..."
- Do NOT include blank answer lines (___) — just the question stem.
- Output questions in ASCENDING numerical order (e.g., 45, 47, 49, 51, 53, 55).
- The text MUST be a complete, self-contained sentence/question that makes sense on its own — even without the diagram.
- NEVER output garbled fragments like "with , , ." or numbers on separate lines. Always write a coherent sentence.

Image/diagram rules (CRITICAL — read carefully):
The question text must FULLY describe the diagram so a student can understand the problem from the text alone. The cropped diagram image will also be shown, but the text must stand on its own.

- For triangle diagrams: Write a complete description. Example:
  "59. \\(\\triangle ABC\\) with \\(AB = 35\\), \\(BC = 21\\), \\(AC = 28\\), right angle at \\(B\\). Find \\(\\sin \\angle A\\), \\(\\cos \\angle A\\), \\(\\tan \\angle A\\)."
  NOT: "59. with , , . 28 21 35 Find sin ∠A cos ∠A tan ∠A"

- For coordinate grid problems: Read EXACT coordinates from the grid.
  "55. Find the distance between \\((6, 7)\\) and \\((-6, -5)\\)."

- For problems where the question text on the page is minimal and the diagram provides the key information (common in geometry): SYNTHESIZE both into one clear question. Read every vertex label, side length, angle mark, and measurement from the diagram and incorporate them into the text.

- For right triangles: always identify which angle is the right angle (look for the small square symbol).
- For all other diagram problems: set hasImage true and include every labeled value from the diagram.
- For pure text/equation problems with no diagram: set hasImage false.

Section headers:
- If a line like "11.6 Find all three ratios for each indicated angle." appears, include it as a section_header. The problems under it inherit that context — so each problem's text should still be self-contained by repeating what's being asked (e.g., "Find sin, cos, tan of ∠A").

Diagram crop region (CRITICAL for hasImage:true questions):
When hasImage is true, you MUST also provide "cropRegion" — the bounding box of the diagram/figure on the page as fractions (0 to 1) of the page dimensions.
- "x": left edge of the diagram as fraction of page width (0 = left edge, 1 = right edge)
- "y": top edge of the diagram as fraction of page height (0 = top, 1 = bottom)
- "width": width of the diagram as fraction of page width
- "height": height of the diagram as fraction of page height
- IMPORTANT: Be VERY GENEROUS with the crop region. It is much better to include extra whitespace than to cut off ANY part of the diagram. A cropped-off diagram is completely useless.
- Add at least 15-20% padding on ALL sides beyond the outermost marks/labels.
- COORDINATE GRIDS / GRAPHS: These are typically WIDE and TALL. Make sure to include the ENTIRE grid — all axis labels, all tick marks, all plotted points, and the axis numbers on BOTH ends. Grids often span nearly the full page width. When in doubt, make the crop wider.
- TRIANGLES: Include all vertex labels (A, B, C), all side length numbers, angle marks, and the right-angle square symbol.
- If the problem number (e.g. "51.") is directly adjacent to the diagram, include it in the crop.
- The student needs to see the COMPLETE figure to solve the problem.
- Only include the diagram/figure region, NOT unrelated problems above/below.
- Omit cropRegion entirely for hasImage:false questions.

Return ONLY valid JSON. No markdown, no commentary, no code fences.`

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

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex]
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

      // Build user text: if teacher provided instructions, tell Claude to filter by them
      let userText = 'Extract all math problems from this worksheet. Return JSON only.'
      if (teacherInstructions) {
        userText = `The teacher's assignment instructions are:\n"${teacherInstructions}"\n\nIf those instructions specify particular problem numbers (e.g. "#s: 45, 47, 51" or "problems 3–8"), extract ONLY those problems and skip everything else. If no specific numbers are mentioned, extract all problems. Return JSON only.`
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
        const tagged = parsed.questions.map(q => ({ ...q, pageIndex: fileIndex }))
        allQuestions.push(...tagged)
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
