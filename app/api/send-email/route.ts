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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html or text' }, { status: 400 })
    }

    const fromEmail = process.env.SES_FROM_EMAIL || 'melinda@mathwithmelinda.com'
    const messageId = `<${crypto.randomUUID()}@mathwithmelinda.com>`

    await transporter.sendMail({
      from: `"Math with Melinda" <${fromEmail}>`,
      replyTo: `"Melinda" <melinda@mathwithmelinda.com>`,
      to,
      subject,
      html,
      text,
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
