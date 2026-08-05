'use client'

import { useEffect, useRef, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'
import { apiFetch } from '@/app/lib/apiFetch'

const client = generateClient()

const LIST_ACTIVE_STUDENTS = /* GraphQL */ `
  query ListActiveStudents {
    listStudentProfiles(limit: 500, filter: { status: { eq: "active" } }) {
      items { id userId email firstName lastName courseId gradeLevel }
    }
  }
`
const LIST_COURSES = /* GraphQL */ `
  query ListCourses {
    listCourses(limit: 50) {
      items { id title }
    }
  }
`
// Roster source of truth: who is enrolled in the schedule's academic year.
// NOTE: unfiltered lists with high limits — AppSync applies `limit` to the
// table scan BEFORE any filter, so filtered queries silently drop rows.
const LIST_YEARS = /* GraphQL */ `
  query ListAcademicYears {
    listAcademicYears(limit: 50) {
      items { id year }
    }
  }
`
const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemestersForPayments {
    listSemesters(limit: 200) {
      items { id academicYearSemestersId }
    }
  }
`
const LIST_ENROLLMENTS = /* GraphQL */ `
  query ListEnrollmentsForPayments {
    listEnrollments(limit: 1000) {
      items { studentId courseEnrollmentsId semesterEnrollmentsId }
    }
  }
`

type Schedule = {
  scheduleId: string; academicYear: string; monthlyRate: number; depositAmount: number
  discountedRate: number; discountedDeposit: number
  courseRates?: Record<string, { monthlyRate: number; depositAmount: number }>
  months: string[]; cancellationDeadline: string
}
type Payment = {
  paymentId: string; scheduleId: string; studentId: string; studentName: string; studentEmail: string
  familyName: string; courseName: string; type: 'deposit' | 'monthly'; month: string
  amount: number; datePaid: string | null; notes: string; isDiscounted: boolean; status: 'active' | 'waived' | 'excluded'
}
type Student = { id: string; userId: string; email: string; firstName: string; lastName: string; courseId: string; gradeLevel: string | null }
type Course = { id: string; title: string }
type Enrollment = { studentId: string; courseEnrollmentsId: string | null; semesterEnrollmentsId: string | null }

function centsToStr(c: number): string { return `$${(c / 100).toFixed(2)}` }
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const ALL_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
const DEFAULT_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

/** "2025-2026" → "2026-2027"; falls back to the year around today. */
function nextAcademicYear(latest: string | undefined): string {
  const m = latest?.match(/^(\d{4})-(\d{4})$/)
  if (m) return `${parseInt(m[1]) + 1}-${parseInt(m[2]) + 1}`
  const now = new Date()
  const y = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${y + 1}`
}

export default function PaymentsPage() {
  const { checking } = useRoleGuard('teacher')

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [yearIdByLabel, setYearIdByLabel] = useState<Record<string, string>>({})
  const [semesterYearId, setSemesterYearId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [syncNote, setSyncNote] = useState('')
  // One sync pass per schedule per page visit — the roster is re-checked on
  // every load, but a completed pass must not re-trigger from its own reload.
  const syncedSchedulesRef = useRef(new Set<string>())

  // New schedule modal
  const [showNewSchedule, setShowNewSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    academicYear: '', monthlyRate: '', depositAmount: '', discountedRate: '', discountedDeposit: '',
    months: DEFAULT_MONTHS,
    cancellationDeadline: '',
  })
  const [creatingSchedule, setCreatingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  // Class rates modal
  const [showRates, setShowRates] = useState(false)
  const [rateForm, setRateForm] = useState<Record<string, { monthly: string; deposit: string }>>({})
  const [savingRates, setSavingRates] = useState(false)

  // Payment edit popover
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedSchedule = schedules.find(s => s.scheduleId === selectedScheduleId) || null

  useEffect(() => {
    loadInitial()
  }, [])

  useEffect(() => {
    if (selectedScheduleId) loadPayments(selectedScheduleId)
  }, [selectedScheduleId])

  async function loadInitial() {
    // Load each independently so one failure doesn't block the others
    const safe = (p: Promise<any>): Promise<any> => p.catch(err => { console.error('Payment load error:', err); return null })

    const [schedulesRes, studentsRes, coursesRes, yearsRes, semsRes, enrollRes] = await Promise.all([
      safe(apiFetch('/api/payments').then(r => r.json())),
      safe(client.graphql({ query: LIST_ACTIVE_STUDENTS }) as any),
      safe(client.graphql({ query: LIST_COURSES }) as any),
      safe(client.graphql({ query: LIST_YEARS }) as any),
      safe(client.graphql({ query: LIST_SEMESTERS }) as any),
      safe(client.graphql({ query: LIST_ENROLLMENTS }) as any),
    ])

    const scheds: Schedule[] = schedulesRes?.schedules || []
    setSchedules(scheds)
    if (scheds.length > 0) setSelectedScheduleId(scheds[0].scheduleId)
    setStudents(studentsRes?.data?.listStudentProfiles?.items || [])
    setCourses(coursesRes?.data?.listCourses?.items || [])
    const years: { id: string; year: string }[] = yearsRes?.data?.listAcademicYears?.items || []
    setYearIdByLabel(Object.fromEntries(years.map(y => [y.year, y.id])))
    const sems: { id: string; academicYearSemestersId: string | null }[] = semsRes?.data?.listSemesters?.items || []
    setSemesterYearId(Object.fromEntries(sems.filter(s => s.academicYearSemestersId).map(s => [s.id, s.academicYearSemestersId as string])))
    setEnrollments(enrollRes?.data?.listEnrollments?.items || [])
    setLoading(false)
  }

  async function loadPayments(scheduleId: string) {
    setPaymentsLoading(true)
    try {
      const res = await apiFetch(`/api/payments/${scheduleId}`)
      const data = await res.json()
      setPayments(data.payments || [])
      if (data.schedule) {
        setSchedules(prev => prev.map(s => s.scheduleId === scheduleId ? data.schedule : s))
      }
      return data.payments || []
    } catch (err) {
      console.error('Error loading payments:', err)
      return []
    } finally {
      setPaymentsLoading(false)
    }
  }

  /** Cognito subs enrolled in the schedule's academic year, with their courseId. */
  function enrolledForSchedule(schedule: Schedule): Map<string, string | null> | null {
    const yearId = yearIdByLabel[schedule.academicYear]
    if (!yearId) return null
    const enrolled = new Map<string, string | null>()
    for (const e of enrollments) {
      if (!e.semesterEnrollmentsId) continue
      if (semesterYearId[e.semesterEnrollmentsId] !== yearId) continue
      if (!enrolled.has(e.studentId) || e.courseEnrollmentsId) {
        enrolled.set(e.studentId, e.courseEnrollmentsId ?? enrolled.get(e.studentId) ?? null)
      }
    }
    return enrolled
  }

  // ── Roster sync: enrollment is the source of truth ─────────────────────────
  // Students enrolled in the year appear automatically; students removed from
  // the year disappear (if nothing was ever paid) or stay tagged "not
  // enrolled" (money history is never deleted).
  useEffect(() => {
    if (loading || paymentsLoading || !selectedSchedule) return
    if (syncedSchedulesRef.current.has(selectedSchedule.scheduleId)) return
    syncedSchedulesRef.current.add(selectedSchedule.scheduleId)
    syncRoster(selectedSchedule)
  }, [loading, paymentsLoading, selectedScheduleId])

  async function syncRoster(schedule: Schedule) {
    const enrolled = enrolledForSchedule(schedule)
    if (!enrolled) {
      setSyncNote(`No academic year named “${schedule.academicYear}” exists yet — create it under Academic Year to auto-fill the roster.`)
      return
    }
    setSyncNote('')
    const courseMap: Record<string, string> = {}
    for (const c of courses) courseMap[c.id] = c.title

    const rowStudentIds = new Set(payments.map(p => p.studentId))
    let changed = false

    // Add: enrolled students without payment rows
    for (const [sub, courseId] of enrolled) {
      if (rowStudentIds.has(sub)) continue
      const profile = students.find(s => s.userId === sub)
      if (!profile) continue
      const courseName = courseMap[courseId || ''] || courseMap[profile.courseId] || ''
      try {
        await apiFetch(`/api/payments/${schedule.scheduleId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: sub,
            studentName: `${profile.firstName} ${profile.lastName}`,
            studentEmail: profile.email,
            familyName: profile.lastName,
            courseName,
            isDiscounted: false,
          }),
        })
        changed = true
      } catch (err) { console.error('Roster sync add failed:', err) }
    }

    // Remove: students with rows who are no longer enrolled AND have no money
    // history (nothing paid, nothing waived) — otherwise keep, tagged below.
    for (const sub of rowStudentIds) {
      if (enrolled.has(sub)) continue
      const rows = payments.filter(p => p.studentId === sub)
      const hasHistory = rows.some(p => p.datePaid || p.status === 'waived')
      if (hasHistory) continue
      try {
        await apiFetch(`/api/payments/${schedule.scheduleId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', studentId: sub }),
        })
        changed = true
      } catch (err) { console.error('Roster sync remove failed:', err) }
    }

    if (changed) await loadPayments(schedule.scheduleId)
  }

  async function handleCreateSchedule() {
    setScheduleError('')
    if (!newSchedule.academicYear) { setScheduleError('Academic year is required'); return }
    if (!newSchedule.monthlyRate || parseFloat(newSchedule.monthlyRate) <= 0) { setScheduleError('Monthly rate is required'); return }
    if (!newSchedule.depositAmount || parseFloat(newSchedule.depositAmount) < 0) { setScheduleError('Deposit amount is required'); return }
    if (!newSchedule.cancellationDeadline) { setScheduleError('Cancellation deadline is required'); return }
    if (newSchedule.months.length === 0) { setScheduleError('Select at least one payment month'); return }
    setCreatingSchedule(true)
    try {
      const res = await apiFetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: newSchedule.academicYear,
          monthlyRate: Math.round(parseFloat(newSchedule.monthlyRate) * 100),
          depositAmount: Math.round(parseFloat(newSchedule.depositAmount) * 100),
          discountedRate: newSchedule.discountedRate ? Math.round(parseFloat(newSchedule.discountedRate) * 100) : Math.round(parseFloat(newSchedule.monthlyRate) * 100),
          discountedDeposit: newSchedule.discountedDeposit ? Math.round(parseFloat(newSchedule.discountedDeposit) * 100) : Math.round(parseFloat(newSchedule.depositAmount) * 100),
          months: newSchedule.months,
          cancellationDeadline: newSchedule.cancellationDeadline,
        }),
      })
      const data = await res.json()
      if (data.schedule) {
        setSchedules(prev => [data.schedule, ...prev])
        setSelectedScheduleId(data.schedule.scheduleId)
        setShowNewSchedule(false)
        setNewSchedule({ academicYear: '', monthlyRate: '', depositAmount: '', discountedRate: '', discountedDeposit: '', months: DEFAULT_MONTHS, cancellationDeadline: '' })
      }
    } catch (err) {
      console.error('Error creating schedule:', err)
    } finally {
      setCreatingSchedule(false)
    }
  }

  function openNewSchedule() {
    setNewSchedule(s => ({ ...s, academicYear: nextAcademicYear(schedules[0]?.academicYear) }))
    setShowNewSchedule(true)
  }

  function openRates() {
    if (!selectedSchedule) return
    const form: Record<string, { monthly: string; deposit: string }> = {}
    for (const c of courses) {
      const o = selectedSchedule.courseRates?.[c.title]
      form[c.title] = {
        monthly: o ? (o.monthlyRate / 100).toFixed(2) : '',
        deposit: o ? (o.depositAmount / 100).toFixed(2) : '',
      }
    }
    setRateForm(form)
    setShowRates(true)
  }

  async function handleSaveRates() {
    if (!selectedSchedule) return
    setSavingRates(true)
    try {
      const courseRates: Record<string, { monthlyRate: number; depositAmount: number }> = {}
      for (const [title, v] of Object.entries(rateForm)) {
        const monthly = v.monthly.trim() ? Math.round(parseFloat(v.monthly) * 100) : null
        const deposit = v.deposit.trim() ? Math.round(parseFloat(v.deposit) * 100) : null
        if (monthly === null && deposit === null) continue
        courseRates[title] = {
          monthlyRate: monthly ?? selectedSchedule.monthlyRate,
          depositAmount: deposit ?? selectedSchedule.depositAmount,
        }
      }
      await apiFetch(`/api/payments/${selectedSchedule.scheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setRates', courseRates }),
      })
      setShowRates(false)
      await loadPayments(selectedSchedule.scheduleId)
    } catch (err) {
      console.error('Error saving class rates:', err)
    } finally {
      setSavingRates(false)
    }
  }

  async function patchPayment(p: Payment, body: Record<string, unknown>, local: Partial<Payment>) {
    await apiFetch(`/api/payments/${p.scheduleId}/${p.paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setPayments(prev => prev.map(x => x.paymentId === p.paymentId ? { ...x, ...local } : x))
  }

  async function handleSavePayment() {
    if (!editingPayment) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}
      if (editDate) updates.datePaid = editDate
      else updates.datePaid = null
      if (editAmount) updates.amount = Math.round(parseFloat(editAmount) * 100)
      updates.notes = editNotes
      await patchPayment(editingPayment, updates, {
        datePaid: editDate || null,
        amount: editAmount ? Math.round(parseFloat(editAmount) * 100) : editingPayment.amount,
        notes: editNotes,
      })
      setEditingPayment(null)
    } catch (err) {
      console.error('Error updating payment:', err)
    } finally {
      setSaving(false)
    }
  }

  // Explicit unpay — reads nothing from the edit fields, so it works no matter
  // what state the modal inputs are in (the old version saved a stale date).
  async function handleMarkUnpaid() {
    if (!editingPayment) return
    setSaving(true)
    try {
      await patchPayment(editingPayment, { datePaid: null }, { datePaid: null })
      setEditingPayment(null)
    } catch (err) {
      console.error('Error marking unpaid:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleExcluded() {
    if (!editingPayment) return
    const excluding = editingPayment.status !== 'excluded'
    setSaving(true)
    try {
      await patchPayment(editingPayment, { status: excluding ? 'excluded' : 'active' }, { status: excluding ? 'excluded' : 'active' })
      setEditingPayment(null)
    } catch (err) {
      console.error('Error toggling excluded:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickPay(payment: Payment) {
    const today = new Date().toISOString().split('T')[0]
    try {
      await patchPayment(payment, { datePaid: today }, { datePaid: today })
    } catch (err) {
      console.error('Error quick-paying:', err)
    }
  }

  async function handleToggleBoard(studentId: string, current: boolean) {
    if (!selectedScheduleId) return
    const verb = current ? 'Remove board-member pricing for' : 'Apply board-member pricing to'
    if (!window.confirm(`${verb} this student? Unpaid amounts will be repriced.`)) return
    try {
      await apiFetch(`/api/payments/${selectedScheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setBoard', studentId, isDiscounted: !current }),
      })
      await loadPayments(selectedScheduleId)
    } catch (err) {
      console.error('Error toggling board status:', err)
    }
  }

  async function handleWithdraw(studentId: string) {
    if (!selectedScheduleId || !window.confirm('Withdraw this student from payments? Unpaid months may be waived depending on the cancellation deadline.')) return
    try {
      await apiFetch(`/api/payments/${selectedScheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', studentId }),
      })
      await loadPayments(selectedScheduleId)
    } catch (err) {
      console.error('Error withdrawing student:', err)
    }
  }

  function exportCSV() {
    if (!selectedSchedule) return
    const columns = ['Deposit', ...sortedMonths]
    const rows: string[][] = []

    rows.push(['Class', 'Family', 'Student', 'Discounted', ...columns.flatMap(c => [c + ' $', c + ' Date', c + ' Notes'])])

    for (const group of groupedRows) {
      for (const r of group.rows) {
        const row = [group.courseName || '—', r.first?.familyName || '', r.first?.studentName || '', r.first?.isDiscounted ? 'Yes' : '']
        for (const col of columns) {
          const p = r.payments.find(x => x.month === col)
          if (!p) { row.push('', '', ''); continue }
          row.push(p.status !== 'active' ? p.status : centsToStr(p.amount))
          row.push(p.datePaid && p.type !== 'deposit' ? fmtDate(p.datePaid) : '')
          row.push(p.notes || '')
        }
        rows.push(row)
      }
    }

    const totalRow = ['', '', '', 'TOTALS']
    for (const col of columns) {
      const colPayments = payments.filter(p => p.month === col && p.datePaid && p.status === 'active')
      totalRow.push(centsToStr(colPayments.reduce((sum, p) => sum + p.amount, 0)))
      totalRow.push('')
      totalRow.push('')
    }
    rows.push(totalRow)

    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${selectedSchedule.academicYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openEditPayment(p: Payment) {
    setEditingPayment(p)
    setEditDate(p.datePaid || '')
    setEditAmount((p.amount / 100).toFixed(2))
    setEditNotes(p.notes || '')
  }

  if (checking) return null

  // ── Derived data ──
  const sortedMonths = selectedSchedule ? [...selectedSchedule.months].sort((a, b) => ALL_MONTHS.indexOf(a) - ALL_MONTHS.indexOf(b)) : []
  const columns = selectedSchedule ? ['Deposit', ...sortedMonths] : []
  const courseMap: Record<string, string> = {}
  for (const c of courses) courseMap[c.id] = c.title

  const enrolledNow = selectedSchedule ? enrolledForSchedule(selectedSchedule) : null

  const studentIds = [...new Set(payments.map(p => p.studentId))]
  const studentRows = studentIds.map(sid => {
    const sp = payments.filter(p => p.studentId === sid)
    const first = sp[0]
    let resolvedCourseName = first?.courseName || ''
    if (!resolvedCourseName) {
      const student = students.find(s => s.userId === sid)
      if (student?.courseId) resolvedCourseName = courseMap[student.courseId] || ''
    }
    const notEnrolled = enrolledNow ? !enrolledNow.has(sid) : false
    return { studentId: sid, first, payments: sp, courseName: resolvedCourseName, notEnrolled }
  })

  // Grouped by class (alpha), students alpha within each group
  const groupedRows = Object.values(
    studentRows.reduce<Record<string, { courseName: string; rows: typeof studentRows }>>((acc, row) => {
      const key = row.courseName || '~'  // unknown class sorts last
      if (!acc[key]) acc[key] = { courseName: row.courseName, rows: [] }
      acc[key].rows.push(row)
      return acc
    }, {})
  )
    .sort((a, b) => (a.courseName || '~').localeCompare(b.courseName || '~'))
    .map(g => ({
      ...g,
      rows: g.rows.sort((a, b) =>
        (a.first?.familyName || '').localeCompare(b.first?.familyName || '')
        || (a.first?.studentName || '').localeCompare(b.first?.studentName || '')),
    }))

  const totalCollected = payments.filter(p => p.datePaid && p.status === 'active').reduce((sum, p) => sum + p.amount, 0)
  const totalOwed = payments.filter(p => !p.datePaid && p.status === 'active').reduce((sum, p) => sum + p.amount, 0)

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px',
    fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--foreground)', margin: '0 0 4px' }}>Payment Tracking</h1>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>Students enrolled in the academic year appear automatically</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {schedules.length > 0 && (
              <select
                value={selectedScheduleId || ''}
                onChange={e => setSelectedScheduleId(e.target.value)}
                style={{ ...inputStyle, minWidth: '180px' }}
              >
                {schedules.map(s => (
                  <option key={s.scheduleId} value={s.scheduleId}>{s.academicYear}</option>
                ))}
              </select>
            )}
            <button
              onClick={openNewSchedule}
              style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              + New Year
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading…</p>
        ) : !selectedSchedule ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>💰</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', marginBottom: '8px' }}>No payment schedules yet</h2>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', marginBottom: '20px' }}>Create a payment schedule for your academic year to start tracking.</p>
            <button onClick={openNewSchedule} style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Create Payment Schedule
            </button>
          </div>
        ) : (
          <>
            {/* Schedule info bar */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{centsToStr(selectedSchedule.monthlyRate)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deposit</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{centsToStr(selectedSchedule.depositAmount)}</div>
              </div>
              {selectedSchedule.discountedRate !== selectedSchedule.monthlyRate && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Board Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0369a1' }}>{centsToStr(selectedSchedule.discountedRate)}</div>
                </div>
              )}
              {Object.keys(selectedSchedule.courseRates || {}).length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Rates</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--plum)' }}>
                    {Object.keys(selectedSchedule.courseRates || {}).length} override{Object.keys(selectedSchedule.courseRates || {}).length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              <div style={{ borderLeft: '1px solid var(--gray-light)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancel Deadline</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{new Date(selectedSchedule.cancellationDeadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button onClick={openRates} style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Class Rates
                </button>
                <button onClick={exportCSV} style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--gray-light)', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  Export CSV
                </button>
              </div>
            </div>

            {syncNote && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }}>
                {syncNote}
              </div>
            )}

            {/* Summary cards */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collected</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#166534' }}>{centsToStr(totalCollected)}</div>
              </div>
              <div style={{ flex: 1, background: totalOwed > 0 ? '#FEF3C7' : '#F0FDF4', border: `1px solid ${totalOwed > 0 ? '#FDE68A' : '#BBF7D0'}`, borderRadius: '8px', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: totalOwed > 0 ? '#92400E' : '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: totalOwed > 0 ? '#92400E' : '#166534' }}>{centsToStr(totalOwed)}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Students</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)' }}>{studentRows.length}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year Total</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)' }}>{centsToStr(totalCollected + totalOwed)}</div>
              </div>
            </div>

            {/* Payment grid */}
            {paymentsLoading ? (
              <p style={{ color: 'var(--gray-mid)' }}>Loading payments…</p>
            ) : studentRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)' }}>
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>
                  No students yet. Enroll students in the {selectedSchedule.academicYear} academic year (under Academic Year) and they&apos;ll appear here automatically.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-light)' }}>
                      <th style={{ ...thStyle, minWidth: '100px', position: 'sticky', left: 0, background: 'var(--gray-light)', zIndex: 2 }}>Family</th>
                      <th style={{ ...thStyle, minWidth: '140px' }}>Student</th>
                      {columns.map(col => (
                        <th key={col} style={{ ...thStyle, minWidth: '90px', textAlign: 'center' }}>{col}</th>
                      ))}
                      <th style={{ ...thStyle, minWidth: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.map(group => (
                      <FragmentGroup key={group.courseName || 'none'}>
                        {/* Class header row */}
                        <tr>
                          <td colSpan={columns.length + 3} style={{ padding: '10px 12px', background: 'var(--plum-light)', borderBottom: '1px solid var(--plum-mid)' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              {group.courseName || 'No class assigned'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--plum)', marginLeft: '10px' }}>
                              {group.rows.length} student{group.rows.length !== 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                        {group.rows.map(({ studentId, first, payments: sp, notEnrolled }) => (
                          <tr key={studentId} style={{ borderBottom: '1px solid var(--gray-light)', opacity: notEnrolled ? 0.65 : 1 }}>
                            <td style={{ ...tdStyle, fontWeight: 500, position: 'sticky', left: 0, background: 'var(--background)', zIndex: 1 }}>
                              {first?.familyName || '—'}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {first?.studentName}
                                <span
                                  onClick={() => handleToggleBoard(studentId, !!first?.isDiscounted)}
                                  title={first?.isDiscounted ? 'Board rate — click to remove' : 'Click to apply board-member pricing'}
                                  style={{
                                    background: first?.isDiscounted ? '#DBEAFE' : 'var(--gray-light)',
                                    color: first?.isDiscounted ? '#1D4ED8' : 'var(--gray-mid)',
                                    fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', cursor: 'pointer',
                                    opacity: first?.isDiscounted ? 1 : 0.6,
                                  }}>
                                  BOARD
                                </span>
                                {notEnrolled && (
                                  <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                                    NOT ENROLLED
                                  </span>
                                )}
                              </div>
                            </td>
                            {columns.map(col => {
                              const p = sp.find(x => x.month === col)
                              if (!p) return <td key={col} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-light)' }}>—</td>
                              if (p.status === 'waived') return (
                                <td key={col} style={{ ...tdStyle, textAlign: 'center' }}>
                                  <span style={{ color: 'var(--gray-mid)', fontSize: '11px', fontStyle: 'italic' }}>waived</span>
                                </td>
                              )
                              if (p.status === 'excluded') return (
                                <td key={col} style={{ ...tdStyle, textAlign: 'center', cursor: 'pointer' }}
                                  onClick={() => openEditPayment(p)}
                                  title="Excluded from this bill — click to change">
                                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '15px' }}>✕</span>
                                </td>
                              )
                              return (
                                <td key={col} style={{ ...tdStyle, textAlign: 'center', cursor: 'pointer', position: 'relative' }}
                                  onClick={() => p.datePaid ? openEditPayment(p) : handleQuickPay(p)}
                                  onContextMenu={e => { e.preventDefault(); openEditPayment(p) }}
                                  title={p.datePaid
                                    ? `Paid${p.type !== 'deposit' && p.datePaid ? ' ' + fmtDate(p.datePaid) : ''}${p.notes ? ' — ' + p.notes : ''}\nClick to edit or mark unpaid · ${centsToStr(p.amount)}`
                                    : `${centsToStr(p.amount)} — Click to mark paid · Right-click for options`}
                                >
                                  {p.datePaid ? (
                                    <div>
                                      <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                                      {p.type !== 'deposit' && (
                                        <div style={{ fontSize: '10px', color: 'var(--gray-mid)' }}>{fmtDate(p.datePaid)}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--gray-light)', fontSize: '16px' }}>○</span>
                                  )}
                                </td>
                              )
                            })}
                            <td style={tdStyle}>
                              <button onClick={() => handleWithdraw(studentId)}
                                style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer', fontSize: '11px', padding: '2px 6px' }}
                                title="Withdraw student (waives unpaid months before the deadline)">
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </FragmentGroup>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: 'var(--gray-light)', fontWeight: 700 }}>
                      <td style={tdStyle}></td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>Totals</td>
                      {columns.map(col => {
                        const colPaid = payments.filter(p => p.month === col && p.datePaid && p.status === 'active').reduce((s, p) => s + p.amount, 0)
                        return (
                          <td key={col} style={{ ...tdStyle, textAlign: 'center', color: colPaid > 0 ? '#166534' : 'var(--gray-mid)' }}>
                            {colPaid > 0 ? centsToStr(colPaid) : '—'}
                          </td>
                        )
                      })}
                      <td style={tdStyle}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── NEW SCHEDULE MODAL ── */}
        {showNewSchedule && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: '0 0 20px' }}>New Payment Schedule</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Academic Year</label>
                  <input style={{ ...inputStyle, width: '100%' }} placeholder="e.g. 2025-2026" value={newSchedule.academicYear} onChange={e => setNewSchedule(s => ({ ...s, academicYear: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Cancellation Deadline</label>
                  <input type="date" style={{ ...inputStyle, width: '100%' }} value={newSchedule.cancellationDeadline} onChange={e => setNewSchedule(s => ({ ...s, cancellationDeadline: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Monthly Rate ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder="55.00" value={newSchedule.monthlyRate} onChange={e => setNewSchedule(s => ({ ...s, monthlyRate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Deposit ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder="30.00" value={newSchedule.depositAmount} onChange={e => setNewSchedule(s => ({ ...s, depositAmount: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Board Member Monthly ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder="Same as monthly if blank" value={newSchedule.discountedRate} onChange={e => setNewSchedule(s => ({ ...s, discountedRate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Board Member Deposit ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder="Same as deposit if blank" value={newSchedule.discountedDeposit} onChange={e => setNewSchedule(s => ({ ...s, discountedDeposit: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Payment Months</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ALL_MONTHS.map(m => {
                    const active = newSchedule.months.includes(m)
                    return (
                      <button key={m} onClick={() => setNewSchedule(s => ({ ...s, months: active ? s.months.filter(x => x !== m) : [...s.months, m] }))}
                        style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                          borderColor: active ? 'var(--plum)' : 'var(--gray-light)', background: active ? 'var(--plum)' : 'var(--background)', color: active ? 'white' : 'var(--gray-mid)' }}>
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
              {scheduleError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C', marginBottom: '12px' }}>
                  {scheduleError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowNewSchedule(false); setScheduleError('') }} style={{ background: 'var(--background)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={handleCreateSchedule} disabled={creatingSchedule}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, opacity: creatingSchedule ? 0.6 : 1 }}>
                  {creatingSchedule ? 'Creating…' : 'Create Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CLASS RATES MODAL ── */}
        {showRates && selectedSchedule && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: '0 0 6px' }}>Class Rates — {selectedSchedule.academicYear}</h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 20px' }}>
                Leave blank to use the base rate ({centsToStr(selectedSchedule.monthlyRate)} monthly / {centsToStr(selectedSchedule.depositAmount)} deposit).
                Changes reprice what&apos;s still unpaid — collected amounts never change.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {courses.map(c => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500 }}>{c.title}</span>
                    <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder={`${(selectedSchedule.monthlyRate / 100).toFixed(2)}/mo`}
                      value={rateForm[c.title]?.monthly ?? ''}
                      onChange={e => setRateForm(f => ({ ...f, [c.title]: { monthly: e.target.value, deposit: f[c.title]?.deposit ?? '' } }))} />
                    <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} placeholder={`${(selectedSchedule.depositAmount / 100).toFixed(2)} dep`}
                      value={rateForm[c.title]?.deposit ?? ''}
                      onChange={e => setRateForm(f => ({ ...f, [c.title]: { monthly: f[c.title]?.monthly ?? '', deposit: e.target.value } }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRates(false)} style={{ background: 'var(--background)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={handleSaveRates} disabled={savingRates}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, opacity: savingRates ? 0.6 : 1 }}>
                  {savingRates ? 'Saving…' : 'Save Rates'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT PAYMENT MODAL ── */}
        {editingPayment && (
          <div style={overlayStyle}>
            <div style={{ ...modalStyle, maxWidth: '400px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', margin: '0 0 4px' }}>
                {editingPayment.studentName} — {editingPayment.month}
              </h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '13px', margin: '0 0 16px' }}>
                Expected: {centsToStr(editingPayment.amount)}{editingPayment.isDiscounted ? ' (board rate)' : ''}
                {editingPayment.status === 'excluded' ? ' · currently excluded from this bill' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {editingPayment.type !== 'deposit' && (
                  <div>
                    <label style={labelStyle}>Date Paid</label>
                    <input type="date" style={{ ...inputStyle, width: '100%' }} value={editDate} onChange={e => setEditDate(e.target.value)} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Amount ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input style={{ ...inputStyle, width: '100%' }} placeholder="Optional notes…" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingPayment.datePaid && (
                    <button onClick={handleMarkUnpaid} disabled={saving}
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      Mark Unpaid
                    </button>
                  )}
                  <button onClick={handleToggleExcluded} disabled={saving}
                    title={editingPayment.status === 'excluded' ? 'Put this bill back on the student' : 'Exclude this student from this one bill'}
                    style={{ background: editingPayment.status === 'excluded' ? '#F0FDF4' : '#FEF2F2', color: editingPayment.status === 'excluded' ? '#166534' : '#DC2626', border: `1px solid ${editingPayment.status === 'excluded' ? '#BBF7D0' : '#FECACA'}`, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    {editingPayment.status === 'excluded' ? 'Include Again' : '✕ Exclude'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditingPayment(null)} style={{ background: 'var(--background)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                  <button onClick={handleSavePayment} disabled={saving}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// React needs a keyed wrapper to emit a group header + rows from one map entry
function FragmentGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
  color: 'var(--gray-dark)', textTransform: 'uppercase', letterSpacing: '0.5px',
  borderBottom: '2px solid var(--gray-light)',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: '13px', color: 'var(--foreground)',
}
const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '4px',
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
}
const modalStyle: React.CSSProperties = {
  background: 'var(--background)', borderRadius: '12px', padding: '28px', maxWidth: '560px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
}
