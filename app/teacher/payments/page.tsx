'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
    listCourses(limit: 50, filter: { archived: { ne: true } }) {
      items { id title }
    }
  }
`

type Schedule = {
  scheduleId: string; academicYear: string; monthlyRate: number; depositAmount: number
  discountedRate: number; discountedDeposit: number; months: string[]; cancellationDeadline: string
}
type Payment = {
  paymentId: string; scheduleId: string; studentId: string; studentName: string; studentEmail: string
  familyName: string; courseName: string; type: 'deposit' | 'monthly'; month: string
  amount: number; datePaid: string | null; notes: string; isDiscounted: boolean; status: 'active' | 'waived'
}
type Student = { id: string; userId: string; email: string; firstName: string; lastName: string; courseId: string; gradeLevel: string | null }
type Course = { id: string; title: string }

function centsToStr(c: number): string { return `$${(c / 100).toFixed(2)}` }
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function PaymentsPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  // New schedule modal
  const [showNewSchedule, setShowNewSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    academicYear: '', monthlyRate: '', depositAmount: '', discountedRate: '', discountedDeposit: '',
    months: ['Aug', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    cancellationDeadline: '',
  })
  const [creatingSchedule, setCreatingSchedule] = useState(false)

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [addStudentForm, setAddStudentForm] = useState({ studentId: '', familyName: '', isDiscounted: false })
  const [addingStudent, setAddingStudent] = useState(false)

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

    const [schedulesRes, studentsRes, coursesRes] = await Promise.all([
      safe(apiFetch('/api/payments').then(r => r.json())),
      safe(client.graphql({ query: LIST_ACTIVE_STUDENTS }) as any),
      safe(client.graphql({ query: LIST_COURSES }) as any),
    ])

    const scheds: Schedule[] = schedulesRes?.schedules || []
    setSchedules(scheds)
    if (scheds.length > 0) setSelectedScheduleId(scheds[0].scheduleId)
    setStudents(studentsRes?.data?.listStudentProfiles?.items || [])
    setCourses(coursesRes?.data?.listCourses?.items || [])
    setLoading(false)
  }

  async function loadPayments(scheduleId: string) {
    setPaymentsLoading(true)
    try {
      const res = await apiFetch(`/api/payments/${scheduleId}`)
      const data = await res.json()
      setPayments(data.payments || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const [scheduleError, setScheduleError] = useState('')

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
        setNewSchedule({ academicYear: '', monthlyRate: '', depositAmount: '', discountedRate: '', discountedDeposit: '', months: ['Aug', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], cancellationDeadline: '' })
      }
    } catch (err) {
      console.error('Error creating schedule:', err)
    } finally {
      setCreatingSchedule(false)
    }
  }

  async function handleAddStudent() {
    if (!addStudentForm.studentId || !selectedScheduleId) return
    setAddingStudent(true)
    try {
      const student = students.find(s => s.userId === addStudentForm.studentId)
      if (!student) return
      const course = courses.find(c => c.id === student.courseId)

      const res = await apiFetch(`/api/payments/${selectedScheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.userId,
          studentName: `${student.firstName} ${student.lastName}`,
          studentEmail: student.email,
          familyName: addStudentForm.familyName,
          courseName: course?.title || '',
          isDiscounted: addStudentForm.isDiscounted,
        }),
      })
      const data = await res.json()
      if (data.payments) {
        setPayments(prev => [...prev, ...data.payments])
        setShowAddStudent(false)
        setAddStudentForm({ studentId: '', familyName: '', isDiscounted: false })
      }
    } catch (err) {
      console.error('Error adding student:', err)
    } finally {
      setAddingStudent(false)
    }
  }

  async function handleSavePayment() {
    if (!editingPayment) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}
      if (editDate) updates.datePaid = editDate
      else if (editDate === '') updates.datePaid = null
      if (editAmount) updates.amount = Math.round(parseFloat(editAmount) * 100)
      updates.notes = editNotes

      await apiFetch(`/api/payments/${editingPayment.scheduleId}/${editingPayment.paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      setPayments(prev => prev.map(p => p.paymentId === editingPayment.paymentId ? {
        ...p,
        datePaid: editDate || null,
        amount: editAmount ? Math.round(parseFloat(editAmount) * 100) : p.amount,
        notes: editNotes,
      } : p))
      setEditingPayment(null)
    } catch (err) {
      console.error('Error updating payment:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickPay(payment: Payment) {
    const today = new Date().toISOString().split('T')[0]
    try {
      await apiFetch(`/api/payments/${payment.scheduleId}/${payment.paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datePaid: today }),
      })
      setPayments(prev => prev.map(p => p.paymentId === payment.paymentId ? { ...p, datePaid: today } : p))
    } catch (err) {
      console.error('Error quick-paying:', err)
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
    const columns = ['Deposit', ...selectedSchedule.months]
    const studentIds = [...new Set(payments.map(p => p.studentId))]
    const rows: string[][] = []

    // Header
    rows.push(['Family', 'Student', 'Class', 'Discounted', ...columns.flatMap(c => [c + ' $', c + ' Date', c + ' Notes'])])

    for (const sid of studentIds) {
      const sp = payments.filter(p => p.studentId === sid)
      const first = sp[0]
      if (!first) continue
      const row = [first.familyName, first.studentName, first.courseName, first.isDiscounted ? 'Yes' : '']
      for (const col of columns) {
        const p = sp.find(x => x.month === col)
        row.push(p ? centsToStr(p.amount) : '')
        row.push(p?.datePaid ? fmtDate(p.datePaid) : '')
        row.push(p?.notes || '')
      }
      rows.push(row)
    }

    // Summary row
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
  const columns = selectedSchedule ? ['Deposit', ...selectedSchedule.months] : []
  const studentIds = [...new Set(payments.map(p => p.studentId))]
  const studentRows = studentIds.map(sid => {
    const sp = payments.filter(p => p.studentId === sid)
    return { studentId: sid, first: sp[0], payments: sp }
  }).sort((a, b) => (a.first?.familyName || '').localeCompare(b.first?.familyName || '') || (a.first?.studentName || '').localeCompare(b.first?.studentName || ''))

  // Already added student IDs (to filter the add dropdown)
  const addedStudentIds = new Set(studentIds)

  // Totals
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
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', margin: 0 }}>Track co-op student payments by academic year</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Schedule selector */}
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
              onClick={() => setShowNewSchedule(true)}
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
            <button onClick={() => setShowNewSchedule(true)} style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
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
              <div style={{ borderLeft: '1px solid var(--gray-light)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancel Deadline</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{new Date(selectedSchedule.cancellationDeadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowAddStudent(true)} style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  + Add Student
                </button>
                <button onClick={exportCSV} style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--gray-light)', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  Export CSV
                </button>
              </div>
            </div>

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
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>No students added yet. Click &quot;+ Add Student&quot; to start tracking payments.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-light)' }}>
                      <th style={{ ...thStyle, minWidth: '100px', position: 'sticky', left: 0, background: 'var(--gray-light)', zIndex: 2 }}>Family</th>
                      <th style={{ ...thStyle, minWidth: '120px' }}>Student</th>
                      <th style={{ ...thStyle, minWidth: '100px' }}>Class</th>
                      {columns.map(col => (
                        <th key={col} style={{ ...thStyle, minWidth: '90px', textAlign: 'center' }}>{col}</th>
                      ))}
                      <th style={{ ...thStyle, minWidth: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map(({ studentId, first, payments: sp }) => (
                      <tr key={studentId} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                        <td style={{ ...tdStyle, fontWeight: 500, position: 'sticky', left: 0, background: 'var(--background)', zIndex: 1 }}>
                          {first?.familyName || '—'}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {first?.studentName}
                            {first?.isDiscounted && (
                              <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>BOARD</span>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ background: 'var(--plum-light)', color: 'var(--plum)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '12px' }}>
                            {first?.courseName || '—'}
                          </span>
                        </td>
                        {columns.map(col => {
                          const p = sp.find(x => x.month === col)
                          if (!p) return <td key={col} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-light)' }}>—</td>
                          if (p.status === 'waived') return (
                            <td key={col} style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={{ color: 'var(--gray-mid)', fontSize: '11px', fontStyle: 'italic' }}>waived</span>
                            </td>
                          )
                          return (
                            <td key={col} style={{ ...tdStyle, textAlign: 'center', cursor: 'pointer', position: 'relative' }}
                              onClick={() => p.datePaid ? openEditPayment(p) : handleQuickPay(p)}
                              onContextMenu={e => { e.preventDefault(); openEditPayment(p) }}
                              title={p.datePaid ? `Paid ${fmtDate(p.datePaid)}${p.notes ? ' — ' + p.notes : ''}\nClick to edit · ${centsToStr(p.amount)}` : `${centsToStr(p.amount)} — Click to mark paid`}
                            >
                              {p.datePaid ? (
                                <div>
                                  <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                                  <div style={{ fontSize: '10px', color: 'var(--gray-mid)' }}>{fmtDate(p.datePaid)}</div>
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
                            title="Withdraw student">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: 'var(--gray-light)', fontWeight: 700 }}>
                      <td style={tdStyle}></td>
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
                  {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map(m => {
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

        {/* ── ADD STUDENT MODAL ── */}
        {showAddStudent && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', margin: '0 0 20px' }}>Add Student to Payment Schedule</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Student</label>
                  <select style={{ ...inputStyle, width: '100%' }} value={addStudentForm.studentId} onChange={e => setAddStudentForm(f => ({ ...f, studentId: e.target.value }))}>
                    <option value="">Select a student…</option>
                    {students.filter(s => !addedStudentIds.has(s.userId)).map(s => (
                      <option key={s.userId} value={s.userId}>{s.firstName} {s.lastName} ({courses.find(c => c.id === s.courseId)?.title || 'No course'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Family Name</label>
                  <input style={{ ...inputStyle, width: '100%' }} placeholder="e.g. Reynolds" value={addStudentForm.familyName} onChange={e => setAddStudentForm(f => ({ ...f, familyName: e.target.value }))} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--foreground)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addStudentForm.isDiscounted} onChange={e => setAddStudentForm(f => ({ ...f, isDiscounted: e.target.checked }))} />
                  Board member (discounted rate)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddStudent(false)} style={{ background: 'var(--background)', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={handleAddStudent} disabled={addingStudent || !addStudentForm.studentId}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, opacity: (addingStudent || !addStudentForm.studentId) ? 0.6 : 1 }}>
                  {addingStudent ? 'Adding…' : 'Add Student'}
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
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Date Paid</label>
                  <input type="date" style={{ ...inputStyle, width: '100%' }} value={editDate} onChange={e => setEditDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Amount ($)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, width: '100%' }} value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input style={{ ...inputStyle, width: '100%' }} placeholder="Optional notes…" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button onClick={() => { setEditDate(''); handleSavePayment() }}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  Mark Unpaid
                </button>
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
