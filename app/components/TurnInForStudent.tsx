'use client'

import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { apiFetch } from '@/app/lib/apiFetch'
import { fetchAllPages } from '@/app/lib/fetchAllPages'
import { useQrUploadToken } from '@/app/hooks/useQrUploadToken'

/**
 * Teacher turns work in on a student's behalf: the student sat a test in
 * person on paper, Melinda photographs it, and it has to land on the student's
 * real assignment (Tests bucket, graded normally) rather than as class
 * participation. Before this the only teacher-created submission was Give
 * Credit, which stamps a 100 and is blocked on tests (ticket a41173eb).
 *
 * The submission is shaped like one from the student's lesson page
 * (lessonId, weeklyPlanItemId, files[]; dueDateTime is null, see turnIn), so dashboards,
 * the gradebook, the report card and the parent portal all treat it as the
 * student's own. Photos go through /api/submit's teacher path into the
 * STUDENT's S3 namespace, so the existing ownership rules let the student and
 * their parents view them. Photos can come from the computer or, like the
 * student's own page, from Melinda's phone via a QR upload link scoped to the
 * same student + lesson.
 *
 * Follow-ups from the independent review of the first version (2026-09-28):
 * in-class days are labelled (a non-test lesson on an in-class day grades into
 * Participation, which is the gradebook's rule, so she should see it before
 * picking), archived submissions count as already turned in, the pickers lock
 * while photos upload, and no due date is stored so a paper test uploaded
 * after its due date never shows as late.
 */

const client = generateClient()

const listActiveStudentsQuery = /* GraphQL */`
  query ListActiveStudentsForTurnIn($nextToken: String) {
    listStudentProfiles(filter: { status: { eq: "active" } }, limit: 1000, nextToken: $nextToken) {
      nextToken
      items { id userId email firstName lastName courseId }
    }
  }
`

const listPlansForCourseQuery = /* GraphQL */`
  query ListPlansForTurnIn($courseId: ID!, $nextToken: String) {
    listWeeklyPlans(filter: { courseWeeklyPlansId: { eq: $courseId } }, limit: 1000, nextToken: $nextToken) {
      nextToken
      items {
        id
        weekStartDate
        assignedStudentIds
        course { id title }
        items(limit: 100) {
          items {
            id
            dayOfWeek
            dueTime
            isPublished
            isInClass
            lessonTemplateId
            lesson { id title order }
          }
        }
      }
    }
  }
`

const listStudentSubmissionsQuery = /* GraphQL */`
  query ListSubmissionsForTurnIn($studentId: String!, $nextToken: String) {
    listSubmissionsByStudentId(studentId: $studentId, limit: 1000, nextToken: $nextToken) {
      nextToken
      items { id content isArchived }
    }
  }
`

type Student = { id: string; userId: string; email: string; firstName: string; lastName: string; courseId: string | null }
type PlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  isInClass: boolean | null
  lessonTemplateId: string | null
  lesson: { id: string; title: string; order: number | null } | null
}
type Plan = {
  id: string
  weekStartDate: string
  assignedStudentIds: string | null
  course: { id: string; title: string } | null
  items?: { items: PlanItem[] } | null
}
type Option = {
  itemId: string
  lessonId: string
  lessonTitle: string
  lessonTemplateId: string | null
  courseId: string
  courseTitle: string
  dayOfWeek: string
  dueDateTime: string | null
  dayDate: string // YYYY-MM-DD of the assigned day, for sorting + "today"
  inClass: boolean
}
type Uploaded = { name: string; key: string }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayDateOf(weekStartDate: string, dayOfWeek: string): string {
  const base = new Date(weekStartDate + 'T00:00:00')
  const offset = DAYS.indexOf(dayOfWeek)
  if (offset >= 0) base.setDate(base.getDate() + offset)
  return isNaN(base.getTime()) ? weekStartDate : ymd(base)
}

/** Same derivation as the student lesson page; stored for reference only (see turnIn). */
function dueDateTimeOf(item: PlanItem, weekStartDate: string): string | null {
  const raw = item.dueTime
  if (!raw) return null
  let dt: Date
  if (raw.includes('T') && raw.length > 10) dt = new Date(raw)
  else dt = new Date(`${dayDateOf(weekStartDate, item.dayOfWeek)}T${raw}`)
  return isNaN(dt.getTime()) ? null : dt.toISOString()
}

function isAssignedTo(plan: Plan, s: Student): boolean {
  if (!plan.assignedStudentIds) return true
  try {
    const ids = JSON.parse(plan.assignedStudentIds)
    if (!Array.isArray(ids) || ids.length === 0) return true
    return ids.includes(s.userId) || ids.includes(s.email)
  } catch { return true }
}

/** Same rule as the gradebook: an unset flag on a Friday means in-class. */
function isInClassItem(item: PlanItem): boolean {
  return item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday')
}

function optionLabel(o: Option): string {
  const d = new Date(o.dayDate + 'T00:00:00')
  const when = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${when}: ${o.lessonTitle}${o.inClass ? ' (in-class day)' : ''}`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60), s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TurnInForStudent({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (submissionId: string) => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [itemId, setItemId] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [files, setFiles] = useState<Uploaded[]>([])
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showQr, setShowQr] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const student = students.find(s => s.userId === studentId) || null
  const option = options.find(o => o.itemId === itemId) || null

  // Phone upload: same token flow as the student page and Grade Work's graded
  // pages, scoped to this student + lesson so the files land in the student's
  // own folder. A code is tied to the STUDENT and the assignment it was made
  // for: every student in a course shares the same plan item ids, so after a
  // student switch the old code's photos would otherwise be listed under the
  // new student while living in the first student's folder (independent
  // review, 2026-09-28). Keys are also required to sit in the current
  // student's folder for the current lesson, whatever token they came from.
  const qrScopeRef = useRef<string>('')
  const qr = useQrUploadToken({
    body: { lessonId: option?.lessonId || '', forStudentEmail: student?.email || '' },
    onNewKeys: keys => {
      if (!student || !option || qrScopeRef.current !== `${student.userId}|${option.itemId}`) return
      const prefix = `submissions/${student.email}/${option.lessonId}/`
      const mine = keys.filter(k => k.startsWith(prefix))
      if (mine.length === 0) return
      setFiles(prev => [...prev, ...mine.filter(k => !prev.some(f => f.key === k)).map(k => ({ name: k.split('/').pop() || 'phone photo', key: k }))])
    },
  })
  function startPhoneUpload() {
    if (!student || !option) return
    qrScopeRef.current = `${student.userId}|${option.itemId}`
    setShowQr(true)
    qr.generate()
  }

  useEffect(() => {
    fetchAllPages<Student>(client, listActiveStudentsQuery, 'listStudentProfiles')
      .then(items => {
        items.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
        setStudents(items.filter(s => s.userId))
      })
      .catch(err => { console.error(err); setError('Could not load students. Close and try again.') })
  }, [])

  // Picking a student lists their published assignments that have no
  // submission yet, newest first, defaulting to today's.
  useEffect(() => {
    setOptions([]); setItemId(''); setFiles([]); setError(''); setShowQr(false); qrScopeRef.current = ''
    if (!student) return
    if (!student.courseId) { setError('This student has no course assigned.'); return }
    let cancelled = false
    setLoadingOptions(true)
    ;(async () => {
      try {
        const [plans, subs] = await Promise.all([
          fetchAllPages<Plan>(client, listPlansForCourseQuery, 'listWeeklyPlans', { courseId: student.courseId }),
          fetchAllPages<{ id: string; content: string | null; isArchived: boolean | null }>(
            client, listStudentSubmissionsQuery, 'listSubmissionsByStudentId', { studentId: student.userId }),
        ])
        if (cancelled) return
        // Archived submissions count too: after an end-of-term archive the
        // lesson is still turned in, and offering it again invited a duplicate.
        const done = new Set<string>()
        for (const sub of subs) {
          try {
            const c = JSON.parse(sub.content || '{}')
            if (c.weeklyPlanItemId) done.add(c.weeklyPlanItemId)
            if (c.lessonId) done.add(c.lessonId)
          } catch { /* unreadable content never blocks */ }
        }
        const opts: Option[] = []
        for (const plan of plans) {
          if (!isAssignedTo(plan, student)) continue
          for (const item of plan.items?.items || []) {
            if (!item.lesson || item.isPublished === false) continue
            if (done.has(item.id) || done.has(item.lesson.id)) continue
            opts.push({
              itemId: item.id,
              lessonId: item.lesson.id,
              lessonTitle: item.lesson.title,
              lessonTemplateId: item.lessonTemplateId,
              courseId: plan.course?.id || student.courseId || '',
              courseTitle: plan.course?.title || '',
              dayOfWeek: item.dayOfWeek,
              dueDateTime: dueDateTimeOf(item, plan.weekStartDate),
              dayDate: dayDateOf(plan.weekStartDate, item.dayOfWeek),
              inClass: isInClassItem(item),
            })
          }
        }
        opts.sort((a, b) => b.dayDate.localeCompare(a.dayDate))
        setOptions(opts)
        const today = ymd(new Date())
        const pick = opts.find(o => o.dayDate === today) || opts.find(o => o.dayDate <= today) || opts[opts.length - 1]
        setItemId(pick?.itemId || '')
      } catch (err) {
        console.error('Error loading assignments:', err)
        if (!cancelled) setError('Could not load this student\'s assignments. Try again.')
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => { cancelled = true }
  }, [studentId, students.length])

  async function uploadFiles(fileList: FileList) {
    if (!student || !option) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('studentId', student.email)
        fd.append('lessonId', option.lessonId)
        const res = await apiFetch('/api/submit', { method: 'POST', body: fd })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Upload failed (${res.status})`)
        }
        const data = await res.json()
        setFiles(prev => [...prev, { name: file.name, key: data.key }])
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function turnIn() {
    if (!student || !option || files.length === 0 || saving) return
    setSaving(true)
    setError('')
    try {
      const content = JSON.stringify({
        notes: notes.trim() || 'Turned in by teacher.',
        files: files.map(f => f.key),
        lessonId: option.lessonId,
        lessonTitle: option.lessonTitle,
        courseId: option.courseId,
        courseTitle: option.courseTitle,
        weeklyPlanItemId: option.itemId,
        // No due date on a teacher turn-in: the student did the work with
        // Melinda in person, so uploading it after the assignment's due date
        // must not show as late anywhere (Grade Work, parent portal, the
        // student's history). The assignment's due date is kept for reference.
        dueDateTime: null,
        assignedDueDateTime: option.dueDateTime,
        lessonTemplateId: option.lessonTemplateId,
        answers: {},
        submittedByTeacher: true,
      })
      const { createSubmission } = await import('../../src/graphql/mutations')
      const res = await (client.graphql({
        query: createSubmission,
        variables: { input: {
          studentId: student.userId,
          content,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          lessonTemplateId: option.lessonTemplateId,
        } },
      }) as any)
      const id = res.data?.createSubmission?.id
      if (!id) throw new Error('The submission did not save.')
      onCreated(id)
    } catch (err: any) {
      console.error('Error turning in for student:', err)
      setError(err?.errors?.[0]?.message || err?.message || 'Could not turn this in. Try again.')
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', marginBottom: '6px' }
  const fieldStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--background)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 6px' }}>Turn in for a student</h2>
        <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '0 0 20px', lineHeight: 1.5 }}>
          For paper work done with you in person. Upload the photos and it lands on the student&apos;s assignment as if they turned it in, ready to grade.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Student</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} disabled={uploading || saving} style={fieldStyle}>
            <option value="">Choose a student…</option>
            {students.map(s => <option key={s.userId} value={s.userId}>{s.lastName}, {s.firstName}</option>)}
          </select>
        </div>

        {student && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Assignment</label>
            {loadingOptions ? (
              <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>Loading assignments…</div>
            ) : options.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>Nothing left to turn in: every assigned lesson already has a submission.</div>
            ) : (
              <select value={itemId} onChange={e => { setItemId(e.target.value); setFiles([]); setShowQr(false); qrScopeRef.current = '' }} disabled={uploading || saving} style={fieldStyle}>
                {options.map(o => <option key={o.itemId} value={o.itemId}>{optionLabel(o)}</option>)}
              </select>
            )}
            {option?.inClass && (
              <div style={{ fontSize: '12px', color: '#B45309', marginTop: '6px', lineHeight: 1.5 }}>
                This is an in-class day. A regular lesson turned in here counts toward Participation. A test still counts as a test.
              </div>
            )}
          </div>
        )}

        {option && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Photos of the work</label>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.heic,.heif" multiple
                onChange={e => { if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files) }}
                style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer' }}>
                  {uploading ? 'Uploading…' : files.length > 0 ? '+ Add more photos' : '📷 Choose photos'}
                </button>
                <button onClick={startPhoneUpload} disabled={uploading || qr.loading}
                  style={{ background: showQr ? 'var(--plum)' : 'var(--plum-light)', color: showQr ? 'white' : 'var(--plum)', border: '1px solid var(--plum-mid)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {qr.loading ? 'Making a code…' : '📱 Use my phone'}
                </button>
              </div>
              {showQr && qr.error && <div style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px' }}>{qr.error}</div>}
              {showQr && qr.tokenState && (
                <div style={{ textAlign: 'center', marginTop: '12px', padding: '12px', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
                  <img src={qr.tokenState.qrDataUrl} alt="Scan this QR code with your phone camera" style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }} />
                  <div style={{ fontSize: '13px', color: 'var(--gray-dark)', marginTop: '8px', fontWeight: 600 }}>Scan with your phone camera, then take the photos</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '2px' }}>Photos show up in the list below as they arrive. Code expires in {formatTime(qr.timeLeft)}.</div>
                  <button onClick={startPhoneUpload} style={{ marginTop: '8px', background: 'transparent', color: 'var(--plum)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Make a new code</button>
                </div>
              )}
              {showQr && !qr.tokenState && !qr.loading && !qr.error && (
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '8px' }}>The code expired. Tap Use my phone for a new one.</div>
              )}
              {files.length > 0 && (
                <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', fontSize: '13px', color: 'var(--foreground)' }}>
                  {files.map((f, i) => (
                    <li key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Note (optional, the student and parents can see it)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Taken in person" style={fieldStyle} />
            </div>
          </>
        )}

        {error && <div style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} disabled={saving}
            style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={turnIn} disabled={!option || files.length === 0 || uploading || saving}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!option || files.length === 0 || uploading || saving) ? 0.5 : 1 }}>
            {saving ? 'Turning in…' : 'Turn in and grade'}
          </button>
        </div>
      </div>
    </div>
  )
}
