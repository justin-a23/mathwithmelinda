import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { requireTeacher } from '@/app/lib/auth'

const APPSYNC_ENDPOINT = 'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY!

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

async function appsync(query: string, variables: Record<string, unknown>) {
  const res = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

const listParentStudentsByEmail = `
  query ListParentStudents($filter: ModelParentStudentFilterInput) {
    listParentStudents(filter: $filter, limit: 10) {
      items { id parentId studentEmail }
    }
  }
`

const listParentProfilesByUserId = `
  query ListParentProfiles($filter: ModelParentProfileFilterInput) {
    listParentProfiles(filter: $filter, limit: 10) {
      items { id userId email firstName lastName }
    }
  }
`

const listUsedParentInvitesByStudent = `
  query ListParentInvites($filter: ModelParentInviteFilterInput) {
    listParentInvites(filter: $filter, limit: 10) {
      items { id studentEmail used parentEmail parentFirstName parentLastName }
    }
  }
`

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req)
  if (auth instanceof NextResponse) return auth

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
          to: email,
          subject,
          html,
          text,
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
