import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { APPSYNC_ENDPOINT } from '@/app/lib/appsync'
import { s3, SUBMISSIONS_BUCKET } from '@/app/lib/s3'

/**
 * Monday-morning assignment reminder, fired by an EventBridge cron.
 *
 * There is no signed-in caller here, so this route cannot use requireAuth /
 * appsyncClient like the rest of the API. Instead it authenticates a dedicated
 * machine user (CRON_COGNITO_EMAIL) against Cognito and sends that token to
 * AppSync directly. The machine user is deliberately in NO group: group-less
 * means student-tier, and student-tier can read exactly what this route needs
 * (profiles, weekly plans, submissions) and write nothing. If the studentScoped
 * rules ever tighten to row-level ownership, this route's reads break loudly —
 * revisit the machine user's access then.
 *
 * Modes:
 *   dryRun     — compute everything, send nothing, return the full preview
 *   redirectTo — send real emails, but ALL to this one address (testing)
 *   weekOf     — YYYY-MM-DD override of the target week's Monday
 *   force      — ignore the already-sent marker
 *
 * Idempotency: a real send CLAIMS cron-markers/weekly-reminder-<monday>.json in
 * the submissions bucket with a conditional put BEFORE the send loop. That
 * ordering is load-bearing: EventBridge API destinations time out after 5
 * seconds and retry, and this route takes longer than that — a post-loop marker
 * would let a retry arrive mid-send and email everyone twice. The atomic claim
 * makes the retry a fast no-op instead. The cost is the reverse failure mode
 * (a crash mid-loop skips the remaining students for that week), which for a
 * reminder email is the better side of the trade. force re-runs regardless.
 */

const CRON_USER_TIMEOUT_MS = 10_000

function secretOk(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  const got = req.headers.get('x-cron-secret')
  if (!expected || !got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Sign in the machine user; returns an access token AppSync accepts. */
async function machineToken(): Promise<string> {
  const email = process.env.CRON_COGNITO_EMAIL
  const password = process.env.CRON_COGNITO_PASSWORD
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!email || !password || !clientId) {
    throw new Error('CRON_COGNITO_EMAIL / CRON_COGNITO_PASSWORD / COGNITO_CLIENT_ID must be set')
  }
  const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })
  const res = await cog.send(new InitiateAuthCommand({
    ClientId: clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  }))
  const token = res.AuthenticationResult?.AccessToken
  if (!token) throw new Error('machine user sign-in returned no token (challenge: ' + res.ChallengeName + ')')
  return token
}

/** Same throw-on-errors contract as appsyncClient, but always token-authed. */
function gqlClient(token: string) {
  return async function gql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ query, variables }),
    })
    const json: any = await res.json()
    if (json?.errors?.length) {
      throw new Error(json.errors.map((e: any) => e?.message || 'unknown error').join('; '))
    }
    return json?.data as T
  }
}

const listActiveStudents = /* GraphQL */ `
  query ListActiveStudents($nextToken: String) {
    listStudentProfiles(filter: { status: { eq: "active" } }, limit: 200, nextToken: $nextToken) {
      items { userId email firstName preferredName courseId }
      nextToken
    }
  }
`

const listPlansForWeek = /* GraphQL */ `
  query ListPlansForWeek($week: String!, $nextToken: String) {
    listWeeklyPlans(filter: { weekStartDate: { eq: $week } }, limit: 200, nextToken: $nextToken) {
      items {
        id
        weekStartDate
        assignedStudentIds
        course { id title }
        items {
          items { id dayOfWeek dueTime isPublished isInClass lesson { id title } }
        }
      }
      nextToken
    }
  }
`

const listStudentSubmissions = /* GraphQL */ `
  query ListStudentSubmissions($studentId: String!) {
    listSubmissionsByStudentId(studentId: $studentId, limit: 1000) {
      items { content }
    }
  }
`

/** Drain a paginated list query. Filtered scans can return empty pages with a
 *  nextToken, so the loop runs until the token is gone, not until a page is empty. */
async function listAll<T>(
  gql: ReturnType<typeof gqlClient>,
  query: string,
  field: string,
  variables: Record<string, unknown> = {}
): Promise<T[]> {
  const out: T[] = []
  let nextToken: string | null = null
  do {
    const data: any = await gql(query, { ...variables, nextToken })
    out.push(...(data[field]?.items || []))
    nextToken = data[field]?.nextToken || null
  } while (nextToken)
  return out
}

// ── Week math (America/Chicago) ──────────────────────────────────────────────

function chicagoTodayYmd(): { ymd: string; weekdayMon1: number } {
  const now = new Date()
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(now)
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short' }).format(now)
  const weekdayMon1 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd) + 1
  return { ymd, weekdayMon1 }
}

function mondayOfCurrentWeek(): string {
  const { ymd, weekdayMon1 } = chicagoTodayYmd()
  const d = new Date(ymd + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - (weekdayMon1 - 1))
  return d.toISOString().slice(0, 10)
}

// ── Item labeling — mirrors the student dashboard exactly ────────────────────

type PlanItem = {
  id: string
  dayOfWeek: string
  dueTime: string | null
  isPublished: boolean | null
  isInClass: boolean | null
  lesson: { id: string; title: string } | null
}

/** Legacy Fridays (null isInClass) default to in-class, same as the dashboard. */
function isInClassItem(item: { isInClass?: boolean | null; dayOfWeek: string }): boolean {
  return item.isInClass === true || (item.isInClass == null && item.dayOfWeek === 'Friday')
}

/** The due DAY comes from dueTime's embedded date when present — dayOfWeek is
 *  the day the lesson belongs to, and Monday's lesson is typically due Tuesday. */
function dueLabel(item: PlanItem): string {
  if (isInClassItem(item)) return '🏫 In-class participation'
  let time = '5:00 PM'
  let day = item.dayOfWeek
  if (item.dueTime) {
    const t = item.dueTime.includes('T') ? item.dueTime.split('T')[1] : item.dueTime
    const parsed = new Date('2000-01-01T' + t)
    if (!isNaN(parsed.getTime())) {
      time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    if (item.dueTime.includes('T') && item.dueTime.length > 10) {
      const dd = new Date(item.dueTime.split('T')[0] + 'T00:00:00')
      if (!isNaN(dd.getTime())) {
        day = dd.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' })
      }
    }
  }
  return `Due ${day} at ${time}`
}

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function sortItems(items: PlanItem[]): PlanItem[] {
  return [...items].sort((a, b) => {
    const ai = WEEKDAY_ORDER.indexOf(a.dayOfWeek)
    const bi = WEEKDAY_ORDER.indexOf(b.dayOfWeek)
    return (ai < 0 ? WEEKDAY_ORDER.length : ai) - (bi < 0 ? WEEKDAY_ORDER.length : bi)
  })
}

// ── Email rendering ──────────────────────────────────────────────────────────

function renderEmail(name: string, weekHuman: string, rows: { day: string; title: string; due: string }[]) {
  const count = rows.length
  const plural = count === 1 ? 'assignment' : 'assignments'
  const listHtml = rows.map(r => `
    <tr>
      <td style="padding:12px 12px 12px 16px;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#7B4FA6;white-space:nowrap;">${escapeHtml(r.day)}</td>
      <td style="padding:12px 12px;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333;">${escapeHtml(r.title)}</td>
      <td style="padding:12px 16px 12px 12px;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#666;white-space:nowrap;">${escapeHtml(r.due)}</td>
    </tr>`).join('')

  const html = `
  <div style="background:#FAFAFA;padding:24px 0;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:#7B4FA6;padding:20px 28px;">
        <span style="font-family:Georgia,serif;font-size:20px;color:#ffffff;">Math with Melinda</span>
      </div>
      <div style="padding:28px;">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333;margin:0 0 8px;">Hi ${escapeHtml(name)},</p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333;margin:0 0 20px;">
          You have <strong>${count} ${plural}</strong> for the week of <strong>${escapeHtml(weekHuman)}</strong>:
        </p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:6px;">${listHtml}</table>
        <p style="margin:24px 0 0;">
          <a href="https://www.mathwithmelinda.com/dashboard"
             style="display:inline-block;background:#7B4FA6;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:6px;">
            Open My Dashboard
          </a>
        </p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#999;margin:28px 0 0;">
          Questions? Just reply to this email to reach Melinda.
        </p>
      </div>
    </div>
  </div>`

  const text = [
    `Hi ${name},`,
    ``,
    `You have ${count} ${plural} for the week of ${weekHuman}:`,
    ``,
    ...rows.map(r => `  • ${r.day}: ${r.title} — ${r.due}`),
    ``,
    `Open your dashboard: https://www.mathwithmelinda.com/dashboard`,
    ``,
    `Questions? Just reply to this email to reach Melinda.`,
  ].join('\n')

  return { html, text }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!secretOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* empty body is fine */ }
  const params = new URL(req.url).searchParams
  const dryRun = body.dryRun === true || params.get('dryRun') === '1'
  const force = body.force === true || params.get('force') === '1'
  const redirectTo: string | null = body.redirectTo || params.get('redirectTo') || null
  const weekOverride: string | null = body.weekOf || params.get('weekOf') || null

  if (weekOverride && !/^\d{4}-\d{2}-\d{2}$/.test(weekOverride)) {
    return NextResponse.json({ error: 'weekOf must be YYYY-MM-DD' }, { status: 400 })
  }
  const week = weekOverride || mondayOfCurrentWeek()
  const weekHuman = new Date(week + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  // Claim this week before sending anything. Only a real send claims — dry
  // runs and redirected test sends never block the real one.
  const markerKey = `cron-markers/weekly-reminder-${week}.json`
  if (!dryRun && !redirectTo && !force) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: SUBMISSIONS_BUCKET,
        Key: markerKey,
        ContentType: 'application/json',
        Body: JSON.stringify({ weekOf: week, claimedAt: new Date().toISOString() }),
        IfNoneMatch: '*',
      }))
    } catch (err: any) {
      if (err.$metadata?.httpStatusCode === 412 || err.name === 'PreconditionFailed') {
        return NextResponse.json({ alreadySent: true, weekOf: week })
      }
      throw err
    }
  }

  try {
    const token = await machineToken()
    const gql = gqlClient(token)

    const [students, plans] = await Promise.all([
      listAll<any>(gql, listActiveStudents, 'listStudentProfiles'),
      listAll<any>(gql, listPlansForWeek, 'listWeeklyPlans', { week }),
    ])

    const results: any[] = []
    const errors: any[] = []
    let sent = 0

    // Lazily built transporter so a dry run never needs SMTP config.
    let transporter: nodemailer.Transporter | null = null

    for (const s of students) {
      if (!s.email || !s.courseId) continue

      const myPlans = plans.filter((p: any) => {
        if (p.course?.id !== s.courseId) return false
        // Null/empty assignedStudentIds means the whole class, same as the dashboard.
        if (!p.assignedStudentIds) return true
        try {
          const ids: string[] = JSON.parse(p.assignedStudentIds)
          return ids.length === 0 || ids.includes(s.userId) || ids.includes(s.email)
        } catch { return true }
      })

      let items: PlanItem[] = myPlans.flatMap((p: any) => (p.items?.items || []) as PlanItem[])
        .filter(i => i.isPublished)
      if (items.length === 0) {
        results.push({ email: s.email, sent: false, reason: 'no assignments this week' })
        continue
      }

      // Weekend visibility means a student can finish Monday's lesson on
      // Saturday — don't remind them about work they already submitted.
      try {
        const subs = await gql(listStudentSubmissions, { studentId: s.userId })
        const submitted = new Set<string>()
        for (const sub of subs.listSubmissionsByStudentId?.items || []) {
          try {
            const c = JSON.parse(sub.content || '{}')
            if (c.lessonId) submitted.add(c.lessonId)
          } catch { /* skip */ }
        }
        items = items.filter(i => !(i.lesson?.id && submitted.has(i.lesson.id)))
      } catch (err: any) {
        // A submissions hiccup shouldn't kill the reminder — worst case the
        // email lists something already turned in.
        errors.push({ email: s.email, stage: 'submissions', message: err.message })
      }
      if (items.length === 0) {
        results.push({ email: s.email, sent: false, reason: 'all submitted already' })
        continue
      }

      const rows = sortItems(items).map(i => ({
        day: i.dayOfWeek,
        title: i.lesson?.title || 'Assignment',
        due: dueLabel(i),
      }))
      const name = s.preferredName || s.firstName || 'there'

      if (dryRun) {
        results.push({ email: s.email, sent: false, dryRun: true, name, assignments: rows })
        continue
      }

      transporter ??= nodemailer.createTransport({
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SES_SMTP_USERNAME, pass: process.env.SES_SMTP_PASSWORD },
      })
      const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@mathwithmelinda.com'
      const { html, text } = renderEmail(name, weekHuman, rows)

      try {
        await transporter.sendMail({
          from: `"Math with Melinda" <${fromEmail}>`,
          replyTo: `"Melinda" <melinda@mathwithmelinda.com>`,
          to: redirectTo || s.email,
          subject: `Your assignments for the week of ${weekHuman}`,
          html,
          text,
          messageId: `<${crypto.randomUUID()}@mathwithmelinda.com>`,
          headers: {
            'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        sent++
        results.push({ email: s.email, sent: true, redirectedTo: redirectTo || undefined, count: rows.length })
      } catch (err: any) {
        errors.push({ email: s.email, stage: 'send', message: err.message })
      }
    }

    // Overwrite the claim with final stats (also [re]writes it on force runs).
    if (!dryRun && !redirectTo) {
      await s3.send(new PutObjectCommand({
        Bucket: SUBMISSIONS_BUCKET,
        Key: markerKey,
        ContentType: 'application/json',
        Body: JSON.stringify({ weekOf: week, sentAt: new Date().toISOString(), sent, errors: errors.length }),
      }))
    }

    return NextResponse.json({
      weekOf: week,
      dryRun,
      redirectTo: redirectTo || undefined,
      activeStudents: students.length,
      plansThisWeek: plans.length,
      sent,
      results,
      errors,
    })
  } catch (err: any) {
    console.error('weekly-reminder error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
