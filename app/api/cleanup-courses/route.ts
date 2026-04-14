import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || 'da2-qgdyi5epjjarbjhwhqq7mrdbsy'

async function appsync(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

/**
 * GET — list all courses with their enrollment/plan counts so you can see which are duplicates
 * DELETE — remove specific course IDs passed in the body
 */
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    // Get all courses
    const coursesRes = await appsync(`
      query {
        listCourses(limit: 50) {
          items {
            id title createdAt
            enrollments { items { id } }
            weeklyPlans { items { id } }
            lessons { items { id } }
            semesters { items { id } }
          }
        }
      }
    `)
    const courses = coursesRes.data?.listCourses?.items || []

    // Identify duplicates: same title, pick the one with fewer linked records as the duplicate
    const byTitle: Record<string, any[]> = {}
    for (const c of courses) {
      if (!byTitle[c.title]) byTitle[c.title] = []
      byTitle[c.title].push({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        enrollments: c.enrollments?.items?.length || 0,
        weeklyPlans: c.weeklyPlans?.items?.length || 0,
        lessons: c.lessons?.items?.length || 0,
        semesters: c.semesters?.items?.length || 0,
      })
    }

    const duplicates: any[] = []
    const originals: any[] = []
    for (const [title, items] of Object.entries(byTitle)) {
      if (items.length > 1) {
        // Sort by total linked records descending — the one with more data is the original
        items.sort((a, b) => {
          const aTotal = a.enrollments + a.weeklyPlans + a.lessons + a.semesters
          const bTotal = b.enrollments + b.weeklyPlans + b.lessons + b.semesters
          return bTotal - aTotal
        })
        originals.push(items[0])
        duplicates.push(...items.slice(1))
      } else {
        originals.push(items[0])
      }
    }

    return NextResponse.json({ courses: byTitle, duplicates, originals })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { courseIds } = await req.json()
    if (!courseIds?.length) return NextResponse.json({ error: 'No courseIds provided' }, { status: 400 })

    const deleted: string[] = []
    for (const id of courseIds) {
      await appsync(`
        mutation DeleteCourse($input: DeleteCourseInput!) {
          deleteCourse(input: $input) { id }
        }
      `, { input: { id } })
      deleted.push(id)
    }

    return NextResponse.json({ success: true, deleted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
