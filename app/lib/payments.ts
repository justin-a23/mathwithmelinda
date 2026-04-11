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

export type PaymentSchedule = {
  scheduleId: string
  academicYear: string            // e.g. "2025-2026"
  monthlyRate: number             // cents
  depositAmount: number           // cents
  discountedRate: number          // cents (board member monthly)
  discountedDeposit: number       // cents (board member deposit)
  months: string[]                // e.g. ["Aug","Oct","Nov","Dec","Jan","Feb","Mar","Apr"]
  cancellationDeadline: string    // ISO date, e.g. "2025-09-15"
  createdAt: string
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
  status: 'active' | 'waived'    // waived = withdrawn before deadline
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
  const depositAmount = student.isDiscounted ? schedule.discountedDeposit : schedule.depositAmount
  const monthlyAmount = student.isDiscounted ? schedule.discountedRate : schedule.monthlyRate
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

export async function updatePayment(paymentId: string, updates: {
  datePaid?: string | null
  amount?: number
  notes?: string
  status?: 'active' | 'waived'
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
