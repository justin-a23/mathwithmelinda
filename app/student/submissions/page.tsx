'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRoleGuard } from '@/app/hooks/useRoleGuard'
import { generateClient } from 'aws-amplify/api'
import StudentNav from '../../components/StudentNav'
import MathRenderer from '../../components/MathRenderer'
import { apiFetch } from '@/app/lib/apiFetch'

const listStudentSubmissions = /* GraphQL */`
  query ListStudentSubmissions($studentId: String!) {
    listSubmissions(filter: { studentId: { eq: $studentId } }, limit: 500) {
      items {
        id
        content
        status
        returnReason
        returnDueDate
        grade
        teacherComment
        submittedAt
      }
    }
  }
`

const getLessonTemplateQuestions = /* GraphQL */`
  query GetLessonTemplateQuestions($id: ID!) {
    getLessonTemplate(id: $id) {
      questions {
        items { id order questionText questionType }
      }
    }
  }
`

type StudentSubmission = {
  id: string
  content: string | null
  status: string | null
  returnReason: string | null
  returnDueDate: string | null
  grade: string | null
  teacherComment: string | null
  submittedAt: string | null
}

type Question = { id: string; order: number; questionText: string; questionType: string }

function SubmissionImage({ url, alt, style }: { url: string; alt: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application%2Fpdf')

  if (isPdf) {
    return (
      <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-light)', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', padding: '6px 12px', background: 'var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📄 {alt}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--plum)', textDecoration: 'none', fontSize: '11px', fontWeight: 600 }}>Open ↗</a>
        </div>
        <iframe src={url} style={{ width: '100%', height: '500px', border: 'none', display: 'block' }} title={alt} />
      </div>
    )
  }

  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '6px', padding: '12px', borderRadius: '6px', border: '1px solid var(--gray-light)',
        background: 'var(--gray-light)', textDecoration: 'none', color: 'var(--plum)',
        fontSize: '12px', fontWeight: 500, textAlign: 'center', ...style, minHeight: style?.height || '90px'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        Open file ↗
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
      <img src={url} alt={alt} style={style} onError={() => setFailed(true)} />
    </a>
  )
}

const client = generateClient()

export default function StudentSubmissions() {
  const { checking } = useRoleGuard('student')
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({})
  const [questionMap, setQuestionMap] = useState<Record<string, Question[]>>({})
  const [fetchedIds, setFetchedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const studentId = user?.signInDetails?.loginId || user?.userId
    if (!studentId) return

    async function loadSubmissions() {
      try {
        const result = await (client.graphql({
          query: listStudentSubmissions,
          variables: { studentId }
        }) as any)
        const items: StudentSubmission[] = result.data.listSubmissions.items
        items.sort((a, b) => {
          const da = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
          const db = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
          return db - da
        })
        setSubmissions(items)
      } catch (err) {
        console.error('Error loading submissions:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [user?.userId])

  async function handleExpand(sub: StudentSubmission) {
    const id = sub.id
    const isExpanding = expandedId !== id
    setExpandedId(isExpanding ? id : null)

    if (!isExpanding || fetchedIds.has(id)) return

    setFetchedIds(prev => new Set([...prev, id]))

    let parsed: Record<string, any> = {}
    try { parsed = JSON.parse(sub.content || '{}') } catch { /* skip */ }

    // Fetch file presigned URLs
    const files: string[] = parsed.files || []
    if (files.length > 0) {
      try {
        const urls = await Promise.all(
          files.map(async (key: string) => {
            const res = await apiFetch('/api/view-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key })
            })
            const data = await res.json()
            return data.url as string
          })
        )
        setFileUrls(prev => ({ ...prev, [id]: urls }))
      } catch (err) {
        console.error('Error fetching file URLs:', err)
      }
    }

    // Fetch template questions
    const templateId: string | undefined = parsed.lessonTemplateId
    if (templateId && !questionMap[templateId]) {
      try {
        const result = await (client.graphql({
          query: getLessonTemplateQuestions,
          variables: { id: templateId }
        }) as any)
        const qs: Question[] = result.data.getLessonTemplate?.questions?.items || []
        qs.sort((a, b) => a.order - b.order)
        setQuestionMap(prev => ({ ...prev, [templateId]: qs }))
      } catch (err) {
        console.error('Error fetching template questions:', err)
      }
    }
  }

  function formatSubmittedAt(submittedAt: string | null): string {
    if (!submittedAt) return ''
    return new Date(submittedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (checking) return null
  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <StudentNav />

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
          My Submissions
        </h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px' }}>
          All your previously submitted assignments.
        </p>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading your submissions...</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)' }}>
            No submissions yet — your turned-in assignments will appear here.
          </p>
        ) : (
          submissions.map(sub => {
            let parsed: Record<string, any> = {}
            try { parsed = JSON.parse(sub.content || '{}') } catch { /* skip */ }

            const lessonTitle: string = parsed.lessonTitle || 'Assignment'
            const courseTitle: string = parsed.courseTitle || ''
            const isExpanded = expandedId === sub.id

            const templateId: string | undefined = parsed.lessonTemplateId
            const questions: Question[] = (templateId && questionMap[templateId]) || []
            const answers: Record<string, string> = parsed.answers || {}
            const notes: string | undefined = parsed.notes
            const files: string[] = parsed.files || []
            const weeklyPlanItemId: string | undefined = parsed.weeklyPlanItemId

            const urls = fileUrls[sub.id] || []

            // Status badge
            let badge: React.ReactNode
            if (sub.status === 'returned') {
              badge = (
                <span style={{ background: '#FEF3C7', color: '#92400e', fontSize: '12px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px', border: '1px solid #f59e0b' }}>
                  Needs Revision
                </span>
              )
            } else if (sub.grade) {
              badge = (
                <span style={{ background: 'var(--plum-light)', color: 'var(--plum)', fontSize: '12px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px', border: '1px solid var(--plum-mid)' }}>
                  Graded: {sub.grade}
                </span>
              )
            } else {
              badge = (
                <span style={{ background: 'var(--gray-light)', color: 'var(--gray-mid)', fontSize: '12px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px' }}>
                  Pending Review
                </span>
              )
            }

            return (
              <div
                key={sub.id}
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Card header */}
                <div
                  onClick={() => handleExpand(sub)}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', marginBottom: '4px' }}>
                      {lessonTitle}
                      {courseTitle ? <span style={{ color: 'var(--gray-mid)', fontWeight: 400, fontSize: '14px' }}> &middot; {courseTitle}</span> : null}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                      {sub.submittedAt ? formatSubmittedAt(sub.submittedAt) : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                    {badge}
                    <span style={{ color: 'var(--gray-mid)', fontSize: '16px' }}>
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--gray-light)' }}>

                    {/* Grade section */}
                    {sub.grade && (
                      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--plum-light)', borderRadius: 'var(--radius)', border: '1px solid var(--plum-mid)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Grade</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--plum)', marginBottom: sub.teacherComment ? '10px' : '0' }}>
                          {sub.grade}
                        </div>
                        {sub.teacherComment && (
                          <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            <span style={{ fontWeight: 600 }}>Teacher Comment: </span>{sub.teacherComment}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Returned section */}
                    {sub.status === 'returned' && (
                      <div style={{ marginTop: '16px', padding: '16px', background: '#fffbeb', borderRadius: 'var(--radius)', border: '1px solid #f59e0b' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                          Needs Revision
                        </div>
                        {sub.returnReason && (
                          <div style={{ fontSize: '14px', color: '#78350f', marginBottom: sub.returnDueDate ? '8px' : '0', lineHeight: '1.5' }}>
                            <span style={{ fontWeight: 600 }}>Melinda&apos;s note: </span>{sub.returnReason}
                          </div>
                        )}
                        {sub.returnDueDate && (
                          <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 500 }}>
                            New due date: {new Date(sub.returnDueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes section */}
                    {notes && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Notes
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: '1.6', padding: '12px 14px', background: 'var(--page-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-light)' }}>
                          {notes}
                        </div>
                      </div>
                    )}

                    {/* Answers section */}
                    {questions.filter(q => q.questionType !== 'section_header' && q.questionType !== 'show_work').length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Answers
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(() => {
                            let qNum = 0
                            return questions.map((q) => {
                              const isHeader = q.questionType === 'section_header'
                              const isShowWork = q.questionType === 'show_work'
                              if (!isHeader) qNum++
                              if (isHeader || isShowWork) return null
                              const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
                              const qLabel = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
                              const qBody = bookNumMatch ? bookNumMatch[2] : q.questionText
                              return (
                                <div key={q.id} style={{ padding: '12px 14px', background: 'var(--page-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-light)' }}>
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-mid)', marginBottom: '6px' }}>
                                    <span style={{ flexShrink: 0 }}>{qLabel}</span>
                                    <MathRenderer text={qBody} />
                                  </div>
                                  <div style={{ fontSize: '14px', color: 'var(--foreground)' }}>
                                    {answers[q.id]
                                      ? <MathRenderer text={answers[q.id]} />
                                      : <span style={{ color: 'var(--gray-mid)' }}>No answer provided</span>
                                    }
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Submitted photos section */}
                    {files.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Submitted photos
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {files.map((key, i) => {
                            const url = urls[i]
                            if (!url) {
                              return (
                                <div key={i} style={{ width: '120px', height: '120px', background: 'var(--gray-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>Loading...</span>
                                </div>
                              )
                            }
                            return (
                              <SubmissionImage
                                key={i}
                                url={url}
                                alt={`Submission photo ${i + 1}`}
                                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Revise & Resubmit button */}
                    {sub.status === 'returned' && weeklyPlanItemId && (
                      <div style={{ marginTop: '16px' }}>
                        <button
                          onClick={() => router.push(`/lessons?id=${weeklyPlanItemId}`)}
                          style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Revise &amp; Resubmit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
