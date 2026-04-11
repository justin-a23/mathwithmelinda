import { NextRequest, NextResponse } from 'next/server'
import { requireTeacher } from '@/app/lib/auth'
import { updatePayment } from '@/app/lib/payments'

/** PATCH — update a payment (mark paid, change amount, add notes) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; paymentId: string }> }
) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { paymentId } = await params
    const body = await req.json()

    const updates: {
      datePaid?: string | null
      amount?: number
      notes?: string
      status?: 'active' | 'waived'
    } = {}

    if ('datePaid' in body) updates.datePaid = body.datePaid
    if ('amount' in body) updates.amount = Math.round(body.amount)
    if ('notes' in body) updates.notes = body.notes
    if ('status' in body) updates.status = body.status

    await updatePayment(paymentId, updates)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating payment:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
