'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../../components/TeacherNav'
import { useRoleGuard } from '../../../hooks/useRoleGuard'

const client = generateClient()

const listArchivedStudentsQuery = /* GraphQL */`
  query ListArchivedStudents {
    listStudentProfiles(limit: 500) {
      items { id userId email firstName lastName courseId status archivedAt gradeLevel }
    }
  }
`

const listCoursesQuery = /* GraphQL */`
  query ListCoursesForPast {
    listCourses(limit: 100) { items { id title } }
  }
`

type PastStudent = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  courseId: string | null
  status: string | null
  archivedAt: string | null
  gradeLevel: string | null
}

/**
 * Academic year label from a timestamp — Aug–Dec belongs to the year starting
 * that summer, Jan–Jul to the year starting the previous summer.
 */
function academicYearLabel(ts: string | null | undefined): string {
  if (!ts) return 'Unknown year'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return 'Unknown year'
  const y = d.getFullYear()
  const startYear = d.getMonth() >= 7 ? y : y - 1
  return `${startYear}-${startYear + 1}`
}

function formatArchivedDate(ts: string | null | undefined): string {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PastStudentsPage() {
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [students, setStudents] = useState<PastStudent[]>([])
  const [courseMap, setCourseMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          client.graphql({ query: listArchivedStudentsQuery }) as any,
          client.graphql({ query: listCoursesQuery }) as any,
        ])
        const all = sRes.data.listStudentProfiles.items as PastStudent[]
        setStudents(all.filter(s => s.status === 'archived'))
        const map: Record<string, string> = {}
        for (const c of cRes.data.listCourses.items) map[c.id] = c.title
        setCourseMap(map)
      } catch (err) {
        console.error('Error loading past students:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const byYear = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? students.filter(s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q))
      : students
    const groups = new Map<string, PastStudent[]>()
    for (const s of filtered) {
      const yr = academicYearLabel(s.archivedAt)
      if (!groups.has(yr)) groups.set(yr, [])
      groups.get(yr)!.push(s)
    }
    return [...groups.entries()]
      .sort((a, b) => b[0].localeCompare(a[0])) // newest year first
      .map(([year, list]) => ({
        year,
        list: list.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName)),
      }))
  }, [students, search])

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>

        <button onClick={() => router.push('/teacher/students')}
          style={{ background: 'none', border: 'none', color: 'var(--plum)', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '14px', fontFamily: 'var(--font-body)' }}>
          ← Back to Students
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Past Students</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '24px' }}>
          Students archived at the end of a school year. All grades, submissions, and report cards are preserved —
          use <strong>View Transcript</strong> for a full history, or <strong>Re-enroll</strong> to bring someone back for a new year.
        </p>

        {!loading && students.length > 0 && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search past students…"
            style={{ padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', minWidth: '280px', marginBottom: '24px' }}
          />
        )}

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
        ) : byYear.length === 0 ? (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
            {students.length === 0 ? 'No past students yet.' : 'No past students match that search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {byYear.map(({ year, list }) => (
              <div key={year}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {year} ({list.length} student{list.length !== 1 ? 's' : ''})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map(s => {
                    const courseName = s.courseId ? (courseMap[s.courseId] || '') : ''
                    const archived = formatArchivedDate(s.archivedAt)
                    return (
                      <div key={s.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-mid)' }}>
                            {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</span>
                            {courseName && (
                              <span style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{courseName}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                            {s.email}{archived ? ` · archived ${archived}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            // Hand off to the Students page, which owns the enrollment
                            // modal (course, plan, semester, payments) rather than
                            // keeping a second copy of it here.
                            onClick={() => router.push(`/teacher/students?reenroll=${s.id}`)}
                            style={{ background: 'transparent', color: '#16a34a', border: '1px solid #86efac', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Re-enroll
                          </button>
                          <button
                            onClick={() => router.push(`/teacher/transcripts/${s.id}`)}
                            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            View Transcript →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
