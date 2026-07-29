import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { requireAuth } from '@/app/lib/auth'

const transporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SES_SMTP_USERNAME,
    pass: process.env.SES_SMTP_PASSWORD,
  },
})

/** The teacher's inbox — the only address a non-teacher may send to. */
const TEACHER_INBOX = 'melinda@mathwithmelinda.com'

/**
 * Strip CR/LF before anything reaches a mail header.
 *
 * nodemailer <=9 is vulnerable to header injection via CRLF in header values
 * (GHSA-268h-hp4c-crq3, GHSA-vvjj-xcjg-gr5g), and `subject` and `to` both come
 * from the request body. Sanitising here means the fix does not depend on the
 * library version.
 */
function headerSafe(value: unknown, max = 500): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { subject, html, text } = body

    // RECIPIENT IS NOT CALLER-CONTROLLED unless the caller is the teacher.
    //
    // This route authenticates with requireAuth, so any signed-in student or
    // parent reaches it. With a caller-supplied `to` it was an open relay: mail
    // to any address, any subject, any body, sent from Melinda's domain through
    // her authenticated SES credentials. That is a phishing vector and puts the
    // domain's sending reputation — and the SES account — at risk.
    //
    // Every legitimate non-teacher call already sends to the teacher's inbox
    // (see app/student/messages and app/parent/messages), so pinning it costs
    // nothing. Teachers still address parents freely.
    const to = auth.role === 'teacher' ? headerSafe(body.to) : TEACHER_INBOX

    // Accept `body` as an alias for `text`: app/parent/messages sends that key,
    // so parent notifications were failing this validation and silently never
    // arriving.
    const textBody = text ?? body.body

    if (!to || !subject || (!html && !textBody)) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html or text' }, { status: 400 })
    }

    const fromEmail = process.env.SES_FROM_EMAIL || 'melinda@mathwithmelinda.com'
    const messageId = `<${crypto.randomUUID()}@mathwithmelinda.com>`

    await transporter.sendMail({
      from: `"Math with Melinda" <${fromEmail}>`,
      replyTo: `"Melinda" <melinda@mathwithmelinda.com>`,
      to,
      subject: headerSafe(subject, 200),
      html,
      text: textBody,
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.SES_FROM_EMAIL}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
