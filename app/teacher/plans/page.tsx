'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useTheme } from '../../ThemeProvider'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

type PlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  lessonTemplateId: string | null
  lesson?: { id: string; title: string } | null
}

type WeeklyPlan = {
  id: string
  weekStartDate: string
  assignedStudentIds: string | null
  course?: { id: string; title: string } | null
  items?: { items: PlanItem[] } | null
}

const LIST_STUDENT_PROFILES = /* GraphQL */ `
  query ListStudentProfiles {
    listStudentProfiles(limit: 500) {
      items { id userId firstName lastName preferredName email }
    }
  }
`

const LIST_WEEKLY_PLANS = /* GraphQL */ `
  query ListAllWeeklyPlans {
    listWeeklyPlans(limit: 500) {
      items {
        id
        weekStartDate
        assignedStudentIds
        course { id title }
        items {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            lessonTemplateId
            lesson { id title }
          }
        }
      }
    }
  }
`

const UPDATE_PLAN_ITEM = /* GraphQL */ `
  mutation UpdateWeeklyPlanItem($input: UpdateWeeklyPlanItemInput!) {
    updateWeeklyPlanItem(input: $input) { id isPublished }
  }
`

const DELETE_PLAN_ITEM = /* GraphQL */ `
  mutation DeleteWeeklyPlanItem($input: DeleteWeeklyPlanItemInput!) {
    deleteWeeklyPlanItem(input: $input) { id }
  }
`

const DELETE_PLAN = /* GraphQL */ `
  mutation DeleteWeeklyPlan($input: DeleteWeeklyPlanInput!) {
    deleteWeeklyPlan(input: $input) { id }
  }
`

const LIST_SUBMISSIONS_CONTAINING = /* GraphQL */ `
  query ListSubmissionsContaining($filter: ModelSubmissionFilterInput) {
    listSubmissions(filter: $filter, limit: 500) {
      items { id }
    }
  }
`

const DELETE_SUBMISSION = /* GraphQL */ `
  mutation DeleteSubmission($input: DeleteSubmissionInput!) {
    deleteSubmission(input: $input) { id }
  }
`

/** Delete all submissions whose content JSON references a given weeklyPlanItemId */
async function deleteSubmissionsForPlanItem(itemId: string) {
  try {
    const result = await (client.graphql({
      query: LIST_SUBMISSIONS_CONTAINING,
      variables: { filter: { content: { contains: itemId } } },
    }) as any)
    const submissions: { id: string }[] = result.data?.listSubmissions?.items ?? []
    await Promise.all(
      submissions.map(sub =>
        (client.graphql({ query: DELETE_SUBMISSION, variables: { input: { id: sub.id } } }) as any)
          .catch((e: unknown) => console.error('Error deleting submission', sub.id, e))
      )
    )
  } catch (err) {
    console.error('Error fetching submissions for plan item', itemId, err)
  }
}

const DAY_ORDER: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
}

function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return start.toLocaleDateString('en-US', opts) + ' – ' + end.toLocaleDateString('en-US', opts)
}

function formatDueTime(dueTime: string | null): string {
  if (!dueTime) return ''
  try {
    const timePart = dueTime.includes('T') ? dueTime.split('T')[1] : dueTime
    const [h, m] = timePart.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return dueTime }
}

function getStudentLabel(assignedStudentIds: string | null, studentMap: Record<string, string>): string {
  if (!assignedStudentIds) return 'All students'
  try {
    const ids: string[] = JSON.parse(assignedStudentIds)
    if (!Array.isArray(ids) || ids.length === 0) return 'All students'
    const names = ids.map(id => studentMap[id] || id)
    if (names.length <= 3) return names.join(', ')
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
  } catch { /* ignore */ }
  return 'All students'
}

export default function ManagePlansPage() {
  useTheme()
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [plans, setPlans] = useState<WeeklyPlan[]>([])
  const [studentMap, setStudentMap] = useState<Record<string, string>>({})
  const [studentEmailMap, setStudentEmailMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState('all')
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set())
  const [confirmRemoveItemId, setConfirmRemoveItemId] = useState<string | null>(null)
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<string | null>(null)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [plansResult, studentsResult] = await Promise.all([
          (client.graphql({ query: LIST_WEEKLY_PLANS }) as any),
          (client.graphql({ query: LIST_STUDENT_PROFILES }) as any),
        ])
        const items: WeeklyPlan[] = plansResult.data.listWeeklyPlans.items
        items.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
        setPlans(items)

        const map: Record<string, string> = {}
        const emailMap: Record<string, string> = {}
        for (const s of studentsResult.data.listStudentProfiles.items) {
          const name = s.preferredName || `${s.firstName} ${s.lastName}`.trim() || s.userId
          map[s.userId] = name
          if (s.email) emailMap[s.userId] = s.email
        }
        setStudentMap(map)
        setStudentEmailMap(emailMap)
      } catch (err) {
        console.error('Error loading plans:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Unique courses for filter
  const courses = Array.from(
    new Map(
      plans
        .filter(p => p.course)
        .map(p => [p.course!.id, p.course!])
    ).values()
  )

  const filteredPlans = selectedCourseId === 'all'
    ? plans
    : plans.filter(p => p.course?.id === selectedCourseId)

  function toggleExpand(planId: string) {
    setExpandedPlanIds(prev => {
      const next = new Set(prev)
      if (next.has(planId)) next.delete(planId)
      else next.add(planId)
      return next
    })
  }

  async function togglePublish(planId: string, item: PlanItem) {
    const newVal = !item.isPublished
    setTogglingItemId(item.id)
    // Optimistic update
    setPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan
      return {
        ...plan,
        items: {
          items: (plan.items?.items ?? []).map(i =>
            i.id === item.id ? { ...i, isPublished: newVal } : i
          )
        }
      }
    }))
    try {
      await (client.graphql({
        query: UPDATE_PLAN_ITEM,
        variables: { input: { id: item.id, isPublished: newVal } }
      }) as any)

      // Email assigned students when publishing a lesson — fire and forget
      if (newVal === true) {
        const plan = plans.find(p => p.items?.items.some(i => i.id === item.id))
        if (plan) {
          const lessonTitle = item.lesson?.title || 'a lesson'
          const courseTitle = plan.course?.title || ''
          const weekDate = new Date(plan.weekStartDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
          const dayLabel = item.dayOfWeek ? `Due: ${item.dayOfWeek}${item.dueTime ? ` by ${formatDueTime(item.dueTime)}` : ''}` : ''

          let studentIds: string[] = []
          if (plan.assignedStudentIds) {
            try { studentIds = JSON.parse(plan.assignedStudentIds) } catch { /* ignore */ }
          }
          const targets = studentIds.length > 0
            ? studentIds.filter(id => studentEmailMap[id])
            : Object.entries(studentEmailMap).map(([id]) => id)

          for (const userId of targets) {
            const email = studentEmailMap[userId]
            const name = studentMap[userId] || 'there'
            if (!email) continue
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                subject: `New lesson assigned: ${lessonTitle}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B4FA6;">New lesson assigned!</h2>
                    <p style="font-size: 15px; color: #333;">Hi ${name},</p>
                    <p style="font-size: 15px; color: #333;">Melinda has assigned a new lesson for the week of <strong>${weekDate}</strong>.</p>
                    <div style="background: #f5f3ff; border-left: 4px solid #7B4FA6; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                      <div style="font-size: 17px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px;">${lessonTitle}</div>
                      ${courseTitle ? `<div style="font-size: 13px; color: #777;">${courseTitle}</div>` : ''}
                      ${dayLabel ? `<div style="font-size: 14px; color: #555; margin-top: 6px;">📅 ${dayLabel}</div>` : ''}
                    </div>
                    <a href="https://mathwithmelinda.com/dashboard" style="display: inline-block; background: #7B4FA6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                      Go to Dashboard
                    </a>
                  </div>
                `,
                text: `Hi ${name},\n\nMelinda assigned a new lesson: ${lessonTitle}\nWeek of: ${weekDate}\n${dayLabel}\n\nGo to https://mathwithmelinda.com/dashboard`,
              }),
            }).catch(() => {})
          }
        }
      }
    } catch (err) {
      console.error('Error toggling publish:', err)
      // Revert on failure
      setPlans(prev => prev.map(plan => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          items: {
            items: (plan.items?.items ?? []).map(i =>
              i.id === item.id ? { ...i, isPublished: item.isPublished } : i
            )
          }
        }
      }))
    } finally {
      setTogglingItemId(null)
    }
  }

  async function removeItem(planId: string, itemId: string) {
    setConfirmRemoveItemId(null)
    try {
      // Cascade: delete any submissions referencing this plan item first
      await deleteSubmissionsForPlanItem(itemId)
      await (client.graphql({
        query: DELETE_PLAN_ITEM,
        variables: { input: { id: itemId } }
      }) as any)
      setPlans(prev => prev.map(plan => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          items: {
            items: (plan.items?.items ?? []).filter(i => i.id !== itemId)
          }
        }
      }))
    } catch (err) {
      console.error('Error deleting plan item:', err)
    }
  }

  async function deletePlan(planId: string) {
    setConfirmDeletePlanId(null)
    const plan = plans.find(p => p.id === planId)
    const planItems = plan?.items?.items ?? []
    try {
      // Cascade: delete submissions and plan items before deleting the plan
      await Promise.all(planItems.map(item => deleteSubmissionsForPlanItem(item.id)))
      await Promise.all(
        planItems.map(item =>
          (client.graphql({ query: DELETE_PLAN_ITEM, variables: { input: { id: item.id } } }) as any)
            .catch((e: unknown) => console.error('Error deleting plan item', item.id, e))
        )
      )
      await (client.graphql({
        query: DELETE_PLAN,
        variables: { input: { id: planId } }
      }) as any)
      setPlans(prev => prev.filter(p => p.id !== planId))
      setExpandedPlanIds(prev => {
        const next = new Set(prev)
        next.delete(planId)
        return next
      })
    } catch (err) {
      console.error('Error deleting plan:', err)
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid var(--gray-light)',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    minWidth: '220px',
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '4px' }}>Weekly Plans</h1>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '32px' }}>Manage assigned weekly plans — toggle visibility or remove items.</p>

        {/* Course filter */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Filter by Course</label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading plans...</p>
        ) : filteredPlans.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)' }}>No weekly plans found.</p>
        ) : (
          <div>
            {filteredPlans.map(plan => {
              const isExpanded = expandedPlanIds.has(plan.id)
              const allItems = plan.items?.items ?? []
              const sortedItems = [...allItems].sort((a, b) => {
                const ao = DAY_ORDER[a.dayOfWeek] ?? 99
                const bo = DAY_ORDER[b.dayOfWeek] ?? 99
                return ao - bo
              })
              const publishedCount = allItems.filter(i => i.isPublished).length
              const totalCount = allItems.length

              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--gray-light)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => toggleExpand(plan.id)}
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                      {/* Week range */}
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {formatWeekRange(plan.weekStartDate)}
                      </span>
                      {/* Course name */}
                      {plan.course && (
                        <span style={{ color: 'var(--plum)', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap' }}>
                          {plan.course.title}
                        </span>
                      )}
                      {/* Students */}
                      <span style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
                        {getStudentLabel(plan.assignedStudentIds, studentMap)}
                      </span>
                      {/* Published count */}
                      <span style={{ color: 'var(--gray-dark)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {publishedCount}/{totalCount} published
                      </span>
                    </div>
                    {/* Chevron */}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        flexShrink: 0,
                        marginLeft: '12px',
                        color: 'var(--gray-mid)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div>
                      {sortedItems.length === 0 ? (
                        <div style={{ padding: '14px 20px', color: 'var(--gray-mid)', fontSize: '13px', borderTop: '1px solid var(--gray-light)' }}>
                          No items in this plan.
                        </div>
                      ) : (
                        sortedItems.map((item, idx) => {
                          const isEven = idx % 2 === 0
                          const isConfirmingRemove = confirmRemoveItemId === item.id
                          const published = !!item.isPublished

                          return (
                            <div
                              key={item.id}
                              style={{
                                borderTop: '1px solid var(--gray-light)',
                                background: isEven ? 'var(--page-bg)' : 'var(--background)',
                                padding: '10px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                              }}
                            >
                              {/* Day name */}
                              <span style={{ fontWeight: 700, minWidth: '90px', fontSize: '14px', color: 'var(--foreground)', flexShrink: 0 }}>
                                {item.dayOfWeek}
                              </span>

                              {/* Lesson title */}
                              <span style={{ flex: 1, fontSize: '14px', color: 'var(--foreground)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.lesson?.title || 'Untitled'}
                              </span>

                              {/* Due time */}
                              <span style={{ fontSize: '13px', color: 'var(--gray-mid)', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>
                                {formatDueTime(item.dueTime)}
                              </span>

                              {/* Publish toggle */}
                              <button
                                onClick={() => togglePublish(plan.id, item)}
                                disabled={togglingItemId === item.id}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: togglingItemId === item.id ? 'default' : 'pointer',
                                  border: published ? '1px solid var(--plum-mid)' : '1px solid var(--gray-light)',
                                  background: published ? 'var(--plum-light)' : 'var(--gray-light)',
                                  color: published ? 'var(--plum)' : 'var(--gray-mid)',
                                  whiteSpace: 'nowrap',
                                  opacity: togglingItemId === item.id ? 0.6 : 1,
                                  flexShrink: 0,
                                }}
                              >
                                {published ? 'Published' : 'Hidden'}
                              </button>

                              {/* Remove button / confirm */}
                              {isConfirmingRemove ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  <span style={{ fontSize: '12px', color: 'var(--gray-dark)' }}>Remove + delete submissions?</span>
                                  <button
                                    onClick={() => removeItem(plan.id, item.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: '0 4px' }}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveItemId(null)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', fontSize: '12px', cursor: 'pointer', padding: '0 4px' }}
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmRemoveItemId(item.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )
                        })
                      )}

                      {/* Plan-level delete */}
                      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {confirmDeletePlanId === plan.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--gray-dark)' }}>
                              Delete entire week plan and all student submissions? This cannot be undone.
                            </span>
                            <button
                              onClick={() => deletePlan(plan.id)}
                              style={{ background: '#dc2626', border: 'none', color: 'white', padding: '5px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeletePlanId(null)}
                              style={{ background: 'transparent', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', padding: '5px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeletePlanId(plan.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--gray-mid)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          >
                            Delete this entire week...
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
