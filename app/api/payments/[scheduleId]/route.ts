import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { getSchedule, listPaymentsForSchedule, addStudentToSchedule, deleteSchedule, withdrawStudent, removeStudentPayments, applyCourseRates, setBoardStatus } from '@/app/lib/payments'

/** GET — list all payments for a schedule */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { scheduleId } = await params
    const [schedule, payments] = await Promise.all([
      getSchedule(scheduleId),
      listPaymentsForSchedule(scheduleId),
    ])
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    return NextResponse.json({ schedule, payments })
  } catch (err: any) {
    console.error('Error fetching schedule payments:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** POST — add a student to the schedule (generates all payment slots) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { scheduleId } = await params
    const body = await req.json()

    // Handle withdraw action
    if (body.action === 'withdraw') {
      const schedule = await getSchedule(scheduleId)
      if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
      const result = await withdrawStudent(scheduleId, body.studentId, schedule.cancellationDeadline)
      return NextResponse.json({ success: true, ...result })
    }

    // Roster sync removal: delete every row a student has (only safe when
    // nothing is paid — the client checks, this is the mechanism)
    if (body.action === 'remove') {
      if (!body.studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
      const removed = await removeStudentPayments(scheduleId, body.studentId)
      return NextResponse.json({ success: true, removed })
    }

    // Per-class rate overrides — persists on the schedule and reprices unpaid rows
    if (body.action === 'setRates') {
      if (!body.courseRates || typeof body.courseRates !== 'object') {
        return NextResponse.json({ error: 'courseRates required' }, { status: 400 })
      }
      await applyCourseRates(scheduleId, body.courseRates)
      return NextResponse.json({ success: true })
    }

    // Board-member toggle — flips discount flag and reprices unpaid rows
    if (body.action === 'setBoard') {
      if (!body.studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
      await setBoardStatus(scheduleId, body.studentId, !!body.isDiscounted)
      return NextResponse.json({ success: true })
    }

    // Default: add student
    const { studentId, studentName, studentEmail, familyName, courseName, isDiscounted } = body

    if (!studentId || !studentName || !studentEmail) {
      return NextResponse.json({ error: 'Missing required student fields' }, { status: 400 })
    }

    const schedule = await getSchedule(scheduleId)
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    const payments = await addStudentToSchedule(schedule, {
      studentId,
      studentName,
      studentEmail,
      familyName: familyName || '',
      courseName: courseName || '',
      isDiscounted: isDiscounted || false,
    })

    return NextResponse.json({ payments })
  } catch (err: any) {
    console.error('Error adding student to schedule:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** DELETE — remove a schedule (and optionally its payments) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { scheduleId } = await params
    await deleteSchedule(scheduleId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting schedule:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
