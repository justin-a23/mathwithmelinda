import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { parseLessonMarkdown, ParsedQuestion } from '@/app/lib/lessonMarkdownParser'

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

const CREATE_LESSON_TEMPLATE = /* GraphQL */`
  mutation CreateLT($input: CreateLessonTemplateInput!) {
    createLessonTemplate(input: $input) {
      id lessonNumber title
    }
  }
`
const UPDATE_LESSON_TEMPLATE = /* GraphQL */`
  mutation UpdateLT($input: UpdateLessonTemplateInput!) {
    updateLessonTemplate(input: $input) {
      id lessonNumber title
    }
  }
`
const CREATE_QUESTION = /* GraphQL */`
  mutation CreateAQ($input: CreateAssignmentQuestionInput!) {
    createAssignmentQuestion(input: $input) { id }
  }
`
const DELETE_QUESTION = /* GraphQL */`
  mutation DelAQ($input: DeleteAssignmentQuestionInput!) {
    deleteAssignmentQuestion(input: $input) { id }
  }
`
const LIST_LESSON_QUESTIONS = /* GraphQL */`
  query ListQs($id: ID!) {
    getLessonTemplate(id: $id) {
      id
      questions(limit: 200) { items { id } }
    }
  }
`

async function gql(query: string, variables: any) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

/**
 * POST /api/import-lesson
 *
 * Body:
 *   {
 *     markdown: string,
 *     courseId: string,           // selected by teacher in the UI
 *     existingLessonId?: string,  // if updating a previously-imported lesson
 *     preview?: boolean           // if true, parse only — don't persist
 *   }
 *
 * Response:
 *   {
 *     parsed: ParsedLesson,       // always returned
 *     lessonId?: string,          // if persisted
 *     questionsCreated?: number
 *   }
 */
export async function POST(request: NextRequest) {
  const auth = await requireTeacher(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { markdown, courseId, existingLessonId, preview } = await request.json()
    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json({ error: 'Missing markdown content' }, { status: 400 })
    }
    if (!preview && !courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const parsed = parseLessonMarkdown(markdown)

    if (preview) {
      return NextResponse.json({ parsed })
    }

    // Refuse to publish a lesson with fatal warnings
    if (!parsed.title) {
      return NextResponse.json({ parsed, error: 'Cannot import: lesson has no title.' }, { status: 400 })
    }
    if (parsed.questions.length === 0) {
      return NextResponse.json({ parsed, error: 'Cannot import: no questions were parsed.' }, { status: 400 })
    }

    let lessonId = existingLessonId
    let questionsCreated = 0

    if (!lessonId) {
      // Create new LessonTemplate
      const input: any = {
        lessonNumber: parsed.lessonNumber ?? 0,
        title: parsed.title,
        instructions: parsed.instructions || null,
        teachingNotes: parsed.teachingNotes || null,
        assignmentType: parsed.assignmentType || 'both',
        lessonCategory: parsed.lessonCategory || 'lesson',
        courseLessonTemplatesId: courseId,
      }
      const res = await gql(CREATE_LESSON_TEMPLATE, { input })
      lessonId = res.createLessonTemplate.id as string
    } else {
      // Update the existing LessonTemplate + wipe its questions so we can recreate them
      const input: any = {
        id: lessonId,
        lessonNumber: parsed.lessonNumber ?? 0,
        title: parsed.title,
        instructions: parsed.instructions || null,
        teachingNotes: parsed.teachingNotes || null,
        assignmentType: parsed.assignmentType || 'both',
        lessonCategory: parsed.lessonCategory || 'lesson',
      }
      await gql(UPDATE_LESSON_TEMPLATE, { input })
      // Delete existing questions
      try {
        const existing = await gql(LIST_LESSON_QUESTIONS, { id: lessonId })
        const items = existing?.getLessonTemplate?.questions?.items ?? []
        await Promise.all(items.map((q: any) =>
          gql(DELETE_QUESTION, { input: { id: q.id } }).catch(() => null)
        ))
      } catch (err) {
        console.warn('Failed to clear existing questions — may result in duplicates:', err)
      }
    }

    // Create all the parsed questions
    for (const q of parsed.questions) {
      const qInput: any = {
        order: q.order,
        questionText: q.text,
        questionType: q.type,
        choices: q.choices && q.choices.length > 0 ? q.choices.join('|') : null,
        correctAnswer: q.correctAnswer || null,
        diagramSpec: q.diagramSpec || null,
        lessonTemplateQuestionsId: lessonId,
      }
      try {
        await gql(CREATE_QUESTION, { input: qInput })
        questionsCreated++
      } catch (err: any) {
        console.error(`Failed to create Q${q.order}:`, err?.message || err)
        parsed.warnings.push(`Q${q.order}: failed to save to database — ${err?.message || 'unknown error'}`)
      }
    }

    return NextResponse.json({ parsed, lessonId, questionsCreated })
  } catch (err: any) {
    console.error('Import lesson error:', err)
    return NextResponse.json({ error: err?.message || 'Import failed' }, { status: 500 })
  }
}
