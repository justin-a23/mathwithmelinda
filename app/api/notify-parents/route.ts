import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { requireTeacher } from '@/app/lib/auth'
import { appsyncClient } from '@/app/lib/appsync'

function makeTransporter() {
  return nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SES_SMTP_USERNAME,
      pass: process.env.SES_SMTP_PASSWORD,
    },
  })
}

/**
 * Throw-on-error and the `data` unwrap now live in appsyncClient itself, so this
 * is a plain alias kept for the call sites below.
 */
function makeAppsync(token: string) {
  return appsyncClient(token)
}

const listParentStudentsByEmail = `
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 1000) {
      items { id parentId studentEmail }
    }
  }
`

const listParentProfilesByUserId = `
  query ListParentProfiles($filter: ModelParentProfileFilterInput) {
    listParentProfiles(filter: $filter, limit: 1000) {
      items { id userId email firstName lastName }
    }
  }
`

const listUsedParentInvitesByStudent = `
  query ListParentInvites($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 1000) {
      items { id studentEmail used parentEmail parentFirstName parentLastName }
    }
  }
`

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth
  const appsync = makeAppsync(auth.token)

  try {
    const { studentEmail, subject, html, text } = await req.json()
    if (!studentEmail || !subject) {
      return NextResponse.json({ error: 'Missing studentEmail or subject' }, { status: 400 })
    }

    // 1. Find all ParentStudent records for this student
    const psData = await appsync(listParentStudentsByEmail, {
      filter: { studentEmail: { eq: studentEmail.toLowerCase() } }
    })
    const parentStudents: { id: string; parentId: string; studentEmail: string }[] = psData.listParentStudents.items

    if (parentStudents.length === 0) {
      return NextResponse.json({ success: true, sent: 0, note: 'No parents linked' })
    }

    const parentIds = [...new Set(parentStudents.map((p: any) => p.parentId))]

    // 2. Look up ParentProfile for each parentId to get email
    const profileData = await appsync(listParentProfilesByUserId, {
      filter: { or: parentIds.map((id: string) => ({ userId: { eq: id } })) }
    })
    const profiles: { userId: string; email: string; firstName: string }[] = profileData.listParentProfiles.items

    // 3. Fallback: for any parentId without a profile, look up via ParentInvite by studentEmail
    const profiledIds = new Set(profiles.map((p: any) => p.userId))
    const unprofiledIds = parentIds.filter(id => !profiledIds.has(id))

    const parentEmails: Array<{ email: string; firstName: string }> = profiles.map(p => ({ email: p.email, firstName: p.firstName }))

    if (unprofiledIds.length > 0) {
      // Get used invites for this student — they'll have parentEmail stored
      const inviteData = await appsync(listUsedParentInvitesByStudent, {
        filter: { studentEmail: { eq: studentEmail.toLowerCase() }, used: { eq: true } }
      })
      const invites: { parentEmail: string | null; parentFirstName: string | null }[] = inviteData.listParentInvites.items
      for (const inv of invites) {
        if (inv.parentEmail && !parentEmails.find(p => p.email === inv.parentEmail)) {
          parentEmails.push({ email: inv.parentEmail, firstName: inv.parentFirstName || 'Parent' })
        }
      }
    }

    if (parentEmails.length === 0) {
      return NextResponse.json({ success: true, sent: 0, note: 'No parent emails found' })
    }

    // 4. Send emails
    const transporter = makeTransporter()
    const fromEmail = process.env.SES_FROM_EMAIL || 'melinda@mathwithmelinda.com'
    let sent = 0
    for (const { email } of parentEmails) {
      try {
        await transporter.sendMail({
          from: `"Math with Melinda" <${fromEmail}>`,
          replyTo: `"Melinda" <melinda@mathwithmelinda.com>`,
          to: email,
          subject,
          html,
          text,
          messageId: `<${crypto.randomUUID()}@mathwithmelinda.com>`,
          headers: {
            'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        sent++
      } catch (err) {
        console.error('Failed to email parent', email, err)
      }
    }

    return NextResponse.json({ success: true, sent })
  } catch (err: any) {
    console.error('notify-parents error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
