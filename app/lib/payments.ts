/**
 * Payment tracking system for co-op students.
 * Uses standalone DynamoDB tables (not the AppSync schema) — no amplify push needed.
 *
 * Two tables:
 *   mwm-payment-schedules — one per academic year, defines rates + months
 *   mwm-payments — individual payment records per student per month
 *
 * Amounts are stored in CENTS to avoid floating-point issues.
 */

import crypto from 'crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

const SCHEDULES_TABLE = 'mwm-payment-schedules'
const PAYMENTS_TABLE = 'mwm-payments'

function makeDynamoClient() {
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN
  if (accessKeyId && secretAccessKey) {
    return new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    })
  }
  return new DynamoDBClient({ region: 'us-east-1' })
}

const ddb = DynamoDBDocumentClient.from(makeDynamoClient())

// ─── TYPES ──────────────────────────────────────────────────────

export type CourseRate = { monthlyRate: number; depositAmount: number }  // cents

export type PaymentSchedule = {
  scheduleId: string
  academicYear: string            // e.g. "2025-2026" — matches AcademicYear.year
  monthlyRate: number             // cents (base rate)
  depositAmount: number           // cents (base deposit)
  discountedRate: number          // cents (board member monthly)
  discountedDeposit: number       // cents (board member deposit)
  // Per-class overrides keyed by course TITLE (payment rows only carry the
  // course name, so the title is the join key throughout).
  courseRates?: Record<string, CourseRate>
  months: string[]                // e.g. ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"]
  cancellationDeadline: string    // ISO date, e.g. "2025-09-15"
  createdAt: string
}

/**
 * The rate a student owes: board members always pay the board rate;
 * otherwise the class override if one exists, else the base rate.
 */
export function ratesFor(schedule: PaymentSchedule, courseName: string, isDiscounted: boolean): CourseRate {
  if (isDiscounted) return { monthlyRate: schedule.discountedRate, depositAmount: schedule.discountedDeposit }
  const override = schedule.courseRates?.[courseName]
  return {
    monthlyRate: override?.monthlyRate ?? schedule.monthlyRate,
    depositAmount: override?.depositAmount ?? schedule.depositAmount,
  }
}

export type Payment = {
  paymentId: string
  scheduleId: string
  studentId: string
  studentName: string
  studentEmail: string
  familyName: string
  courseName: string
  type: 'deposit' | 'monthly'
  month: string                   // "deposit" or month name like "Aug"
  amount: number                  // cents (what this student owes for this slot)
  datePaid: string | null         // ISO date or null
  notes: string
  isDiscounted: boolean
  // waived = withdrawn before deadline; excluded = teacher removed this one
  // bill for this student (red ✕ in the grid). Neither counts toward totals.
  status: 'active' | 'waived' | 'excluded'
  createdAt: string
}

// ─── SCHEDULE OPERATIONS ────────────────────────────────────────

export async function createSchedule(input: Omit<PaymentSchedule, 'scheduleId' | 'createdAt'>): Promise<PaymentSchedule> {
  const schedule: PaymentSchedule = {
    ...input,
    scheduleId: crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
    createdAt: new Date().toISOString(),
  }
  await ddb.send(new PutCommand({ TableName: SCHEDULES_TABLE, Item: schedule }))
  return schedule
}

export async function getSchedule(scheduleId: string): Promise<PaymentSchedule | null> {
  const result = await ddb.send(new GetCommand({ TableName: SCHEDULES_TABLE, Key: { scheduleId } }))
  return (result.Item as PaymentSchedule) || null
}

export async function listSchedules(): Promise<PaymentSchedule[]> {
  const result = await ddb.send(new ScanCommand({ TableName: SCHEDULES_TABLE }))
  const items = (result.Items as PaymentSchedule[]) || []
  return items.sort((a, b) => b.academicYear.localeCompare(a.academicYear))
}

export async function updateSchedule(scheduleId: string, updates: Partial<Omit<PaymentSchedule, 'scheduleId' | 'createdAt'>>): Promise<void> {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return

  const setExpressions = entries.map(([k], i) => `#k${i} = :v${i}`)
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}
  entries.forEach(([k, v], i) => {
    names[`#k${i}`] = k
    values[`:v${i}`] = v
  })

  await ddb.send(new UpdateCommand({
    TableName: SCHEDULES_TABLE,
    Key: { scheduleId },
    UpdateExpression: `SET ${setExpressions.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }))
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: SCHEDULES_TABLE, Key: { scheduleId } }))
}

// ─── PAYMENT OPERATIONS ─────────────────────────────────────────

export async function listPaymentsForSchedule(scheduleId: string): Promise<Payment[]> {
  const result = await ddb.send(new QueryCommand({
    TableName: PAYMENTS_TABLE,
    IndexName: 'scheduleId-index',
    KeyConditionExpression: 'scheduleId = :sid',
    ExpressionAttributeValues: { ':sid': scheduleId },
  }))
  return (result.Items as Payment[]) || []
}

/**
 * Generate all payment slots (deposit + months) for a student in a schedule.
 */
export async function addStudentToSchedule(
  schedule: PaymentSchedule,
  student: {
    studentId: string
    studentName: string
    studentEmail: string
    familyName: string
    courseName: string
    isDiscounted: boolean
  }
): Promise<Payment[]> {
  const { monthlyRate: monthlyAmount, depositAmount } = ratesFor(schedule, student.courseName, student.isDiscounted)
  const now = new Date().toISOString()

  const payments: Payment[] = []

  // Deposit
  const deposit: Payment = {
    paymentId: crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
    scheduleId: schedule.scheduleId,
    studentId: student.studentId,
    studentName: student.studentName,
    studentEmail: student.studentEmail,
    familyName: student.familyName,
    courseName: student.courseName,
    type: 'deposit',
    month: 'Deposit',
    amount: depositAmount,
    datePaid: null,
    notes: '',
    isDiscounted: student.isDiscounted,
    status: 'active',
    createdAt: now,
  }
  payments.push(deposit)

  // Monthly payments
  for (const month of schedule.months) {
    const payment: Payment = {
      paymentId: crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
      scheduleId: schedule.scheduleId,
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
      familyName: student.familyName,
      courseName: student.courseName,
      type: 'monthly',
      month,
      amount: monthlyAmount,
      datePaid: null,
      notes: '',
      isDiscounted: student.isDiscounted,
      status: 'active',
      createdAt: now,
    }
    payments.push(payment)
  }

  // Batch write (DynamoDB limit is 25 per batch, we have ~10 items so single batch is fine)
  for (const payment of payments) {
    await ddb.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: payment }))
  }

  return payments
}

/** Delete every payment row a student has in a schedule (roster sync removal). */
export async function removeStudentPayments(scheduleId: string, studentId: string): Promise<number> {
  const payments = await listPaymentsForSchedule(scheduleId)
  const mine = payments.filter(p => p.studentId === studentId)
  for (const p of mine) {
    await deletePayment(p.paymentId)
  }
  return mine.length
}

/**
 * Persist per-class rate overrides and sweep them onto existing UNPAID active
 * rows, so a rate change is reflected in what's still owed without touching
 * money already collected (or waived/excluded rows).
 */
export async function applyCourseRates(scheduleId: string, courseRates: Record<string, CourseRate>): Promise<void> {
  await updateSchedule(scheduleId, { courseRates })
  const schedule = await getSchedule(scheduleId)
  if (!schedule) return
  const payments = await listPaymentsForSchedule(scheduleId)
  for (const p of payments) {
    if (p.datePaid || p.status !== 'active') continue
    const { monthlyRate, depositAmount } = ratesFor(schedule, p.courseName, p.isDiscounted)
    const expected = p.type === 'deposit' ? depositAmount : monthlyRate
    if (p.amount !== expected) {
      await updatePayment(p.paymentId, { amount: expected })
    }
  }
}

/** Flip a student's board-member status and reprice their unpaid rows. */
export async function setBoardStatus(scheduleId: string, studentId: string, isDiscounted: boolean): Promise<void> {
  const schedule = await getSchedule(scheduleId)
  if (!schedule) return
  const payments = await listPaymentsForSchedule(scheduleId)
  for (const p of payments) {
    if (p.studentId !== studentId) continue
    const updates: Record<string, unknown> = { isDiscounted }
    if (!p.datePaid && p.status === 'active') {
      const { monthlyRate, depositAmount } = ratesFor(schedule, p.courseName, isDiscounted)
      updates.amount = p.type === 'deposit' ? depositAmount : monthlyRate
    }
    await ddb.send(new UpdateCommand({
      TableName: PAYMENTS_TABLE,
      Key: { paymentId: p.paymentId },
      UpdateExpression: 'SET isDiscounted = :d' + ('amount' in updates ? ', amount = :a' : ''),
      ExpressionAttributeValues: { ':d': isDiscounted, ...('amount' in updates ? { ':a': updates.amount } : {}) },
    }))
  }
}

export async function updatePayment(paymentId: string, updates: {
  datePaid?: string | null
  amount?: number
  notes?: string
  status?: 'active' | 'waived' | 'excluded'
}): Promise<void> {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return

  const setExpressions = entries.map(([k], i) => `#k${i} = :v${i}`)
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}
  entries.forEach(([k, v], i) => {
    names[`#k${i}`] = k
    values[`:v${i}`] = v
  })

  await ddb.send(new UpdateCommand({
    TableName: PAYMENTS_TABLE,
    Key: { paymentId },
    UpdateExpression: `SET ${setExpressions.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }))
}

export async function deletePayment(paymentId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: PAYMENTS_TABLE, Key: { paymentId } }))
}

/**
 * Withdraw a student from a schedule. If before the cancellation deadline,
 * unpaid future months are waived. If after, all months remain owed.
 */
export async function withdrawStudent(
  scheduleId: string,
  studentId: string,
  cancellationDeadline: string
): Promise<{ waived: number; stillOwed: number }> {
  const payments = await listPaymentsForSchedule(scheduleId)
  const studentPayments = payments.filter(p => p.studentId === studentId)
  const now = new Date()
  const deadline = new Date(cancellationDeadline + 'T23:59:59')
  const isBeforeDeadline = now <= deadline

  let waived = 0
  let stillOwed = 0

  for (const p of studentPayments) {
    if (p.type === 'deposit') continue // deposits are never waived
    if (p.datePaid) continue // already paid — no change

    if (isBeforeDeadline) {
      await updatePayment(p.paymentId, { status: 'waived' })
      waived++
    } else {
      stillOwed++
    }
  }

  return { waived, stillOwed }
}
