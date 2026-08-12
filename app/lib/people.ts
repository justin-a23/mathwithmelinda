/**
 * Shared people-management data layer for the teacher's Students, Parents, and
 * Invites pages.
 *
 * These three pages were one 2,900-line component. The queries and row types
 * below are the pieces more than one of them needs; keeping them here is what
 * lets each page stay about a single job.
 */

// ── Queries ──────────────────────────────────────────────────────────────────

export const listParentInvitesQuery = /* GraphQL */`
  query ListParentInvites {
    listParentInvites(limit: 500) {
      items {
        id token studentEmail studentName used
        parentEmail parentFirstName parentLastName createdAt
      }
    }
  }
`

export const listStudentInvitesQuery = /* GraphQL */`
  query ListStudentInvites {
    listStudentInvites(limit: 500) {
      items {
        id token firstName lastName email courseId courseTitle semesterId planType used createdAt
      }
    }
  }
`

export const listParentProfilesQuery = /* GraphQL */`
  query ListParentProfiles {
    listParentProfiles(limit: 500) {
      items { id userId email firstName lastName }
    }
  }
`

export const listAllParentStudentsQuery = /* GraphQL */`
  query ListAllParentStudents {
    listParentStudents(limit: 1000) {
      items { id parentId studentEmail studentName }
    }
  }
`

export const listStudentsForPeopleQuery = /* GraphQL */`
  query ListStudentsForPeople {
    listStudentProfiles(limit: 500) {
      items { id userId email firstName lastName courseId status }
    }
  }
`

export const listCoursesForPeopleQuery = /* GraphQL */`
  query ListCoursesForPeople {
    listCourses(limit: 100) {
      items { id title isArchived }
    }
  }
`

export const createParentInviteMutation = /* GraphQL */`
  mutation CreateParentInvite($input: CreateParentInviteInput!) {
    createParentInvite(input: $input) {
      id token studentEmail studentName used
      parentEmail parentFirstName parentLastName createdAt
    }
  }
`

export const deleteParentInviteMutation = /* GraphQL */`
  mutation DeleteParentInvite($input: DeleteParentInviteInput!) {
    deleteParentInvite(input: $input) { id }
  }
`

export const deleteStudentInviteMutation = /* GraphQL */`
  mutation DeleteStudentInvite($input: DeleteStudentInviteInput!) {
    deleteStudentInvite(input: $input) { id }
  }
`

export const deleteParentStudentMutation = /* GraphQL */`
  mutation DeleteParentStudent($input: DeleteParentStudentInput!) {
    deleteParentStudent(input: $input) { id }
  }
`

/**
 * Link an EXISTING parent account to another student directly.
 *
 * An invite only exists to get a parent through signup; once they have an
 * account, the portal reads their children straight off these link rows. So a
 * second child needs a link, not a second invite — which is also why sending
 * one to an already-registered parent stranded them at a "create an account"
 * screen for an account they already had.
 */
export const createParentStudentMutation = /* GraphQL */`
  mutation CreateParentStudent($input: CreateParentStudentInput!) {
    createParentStudent(input: $input) { id parentId studentEmail studentName }
  }
`

// ── Types ────────────────────────────────────────────────────────────────────

export type ParentInvite = {
  id: string
  token: string
  studentEmail: string
  studentName: string
  used: boolean | null
  parentEmail: string | null
  parentFirstName: string | null
  parentLastName: string | null
  createdAt: string
}

export type StudentInvite = {
  id: string
  token: string
  firstName: string
  lastName: string
  email: string
  courseId: string | null
  courseTitle: string | null
  semesterId: string | null
  planType: string
  used: boolean | null
  createdAt: string
}

export type ParentProfile = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
}

export type ParentStudentLink = {
  id: string
  parentId: string
  studentEmail: string
  studentName: string
}

export type PersonStudent = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  courseId: string | null
  status: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Cryptographically secure invite token (~122 bits) — an unguessable bearer. */
export function randomInviteToken(): string {
  return crypto.randomUUID()
}

/**
 * A parent's display name/email, falling back to the invite records when they
 * accepted without a profile row ever being written (older invite flow).
 */
export function resolveParentIdentity(
  parentId: string,
  profiles: ParentProfile[],
  links: ParentStudentLink[],
  invites: ParentInvite[],
): { name: string; email: string } {
  const profile = profiles.find(p => p.userId === parentId)
  let name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''
  let email = profile?.email || ''
  if (name && email) return { name, email }

  const linked = links.filter(l => l.parentId === parentId)
  for (const link of linked) {
    const inv = invites.find(
      i => i.used && i.studentEmail.toLowerCase() === (link.studentEmail || '').toLowerCase()
    )
    if (!inv) continue
    if (!name && inv.parentFirstName) {
      name = `${inv.parentFirstName}${inv.parentLastName ? ' ' + inv.parentLastName : ''}`
    }
    if (!email && inv.parentEmail) email = inv.parentEmail
    if (name && email) break
  }
  return { name, email }
}

/** Parent-invite email body, shared by the initial send and the resend. */
export function parentInviteEmail(opts: {
  parentFirstName: string
  studentName: string
  link: string
  isReminder?: boolean
}): { subject: string; html: string; text: string } {
  const { parentFirstName, studentName, link, isReminder } = opts
  const greeting = parentFirstName || 'there'
  const lead = isReminder
    ? `Just a reminder — <strong>${studentName}</strong> is enrolled in Math with Melinda. Set up your parent account to track their grades, assignments, and feedback.`
    : `<strong>${studentName}</strong> is enrolled in Math with Melinda. Set up your parent account to follow their grades, assignments, and feedback.`
  return {
    subject: isReminder
      ? 'Reminder: Your Math with Melinda parent invite is waiting'
      : `You're invited to follow ${studentName}'s progress in Math with Melinda`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="background:#1E1E2E;padding:16px 24px;border-radius:8px;margin-bottom:28px">
        <span style="color:white;font-size:18px;font-weight:600">Math with Melinda</span>
      </div>
      <h2 style="color:#1E1E2E">Hi ${greeting}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.6">${lead}</p>
      <a href="${link}" style="display:inline-block;background:#0369a1;color:white;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;margin:16px 0">Set Up My Parent Account →</a>
      <p style="color:#aaa;font-size:13px;word-break:break-all">${link}</p>
    </div>`,
    text: `Hi ${greeting}!\n\n${isReminder ? 'Reminder: ' : ''}${studentName} is enrolled in Math with Melinda. Set up your parent account:\n${link}`,
  }
}
