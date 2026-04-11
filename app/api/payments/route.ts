import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { listSchedules, createSchedule } from '@/app/lib/payments'

/** GET — list all payment schedules */
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const schedules = await listSchedules()
    return NextResponse.json({ schedules })
  } catch (err: any) {
    console.error('Error listing schedules:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** POST — create a new payment schedule */
export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { academicYear, monthlyRate, depositAmount, discountedRate, discountedDeposit, months, cancellationDeadline } = body

    if (!academicYear || !monthlyRate || !depositAmount || !months?.length || !cancellationDeadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const schedule = await createSchedule({
      academicYear,
      monthlyRate: Math.round(monthlyRate),
      depositAmount: Math.round(depositAmount),
      discountedRate: Math.round(discountedRate || monthlyRate),
      discountedDeposit: Math.round(discountedDeposit || depositAmount),
      months,
      cancellationDeadline,
    })

    return NextResponse.json({ schedule })
  } catch (err: any) {
    console.error('Error creating schedule:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
