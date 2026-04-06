'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listCourses } from '../../../src/graphql/queries'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

type Course = { id: string; title: string; gradeLevel: string | null }

export default function LessonLibraryIndex() {
  const { checking } = useRoleGuard('teacher')
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (checking) return
    client.graphql({ query: listCourses }).then((res: any) => {
      setCourses(res.data.listCourses.items)
    }).catch(console.error)
  }, [checking])

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: '0 0 6px' }}>
          Lesson Library
        </h1>
        <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: '0 0 36px' }}>
          Choose a course to view and edit its lessons.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => router.push('/teacher/library/' + course.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '20px 24px',
                background: 'var(--background)',
                border: '1px solid var(--gray-light)',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--plum)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gray-light)')}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                  {course.title}
                </div>
                {course.gradeLevel && (
                  <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>{course.gradeLevel}</div>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 3l5 5-5 5" stroke="var(--gray-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
