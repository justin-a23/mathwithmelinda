/**
 * Single source of truth for mapping Cognito groups to a role.
 *
 * This precedence was duplicated between app/login/page.tsx (where to send
 * someone after sign-in) and app/hooks/useRoleGuard.ts (whether they belong on
 * the page they opened). Two copies of an access rule drift; keep one.
 *
 * Students are identified by the ABSENCE of a group. 'parent' is the only group
 * the app ever assigns (see app/api/add-to-group/route.ts) and 'teacher' is set
 * by hand in the Cognito console, so requiring an explicit 'student' group would
 * lock out every student.
 *
 * 'admin' is the IT/support group. It resolves to the SAME role as 'teacher'
 * rather than becoming a fourth Role, and that is the whole design:
 *
 *   - Every existing guard — 17 requireTeacher() routes, every
 *     useRoleGuard('teacher') page — keeps working with no change. A fourth
 *     Role would mean auditing all of them, and any one missed is either a
 *     lockout or a hole.
 *   - The app is single-tenant (no teacherId scoping anywhere), so an admin
 *     sees exactly what Melinda sees without any data-partitioning work.
 *
 * The distinction survives where it matters: the raw group list is still on the
 * token, so `groups.includes('admin')` can gate admin-only behaviour later, and
 * the membership can be revoked without touching Melinda's account.
 *
 * No imports on purpose — scripts/test-roles.ts loads this directly.
 */

export type Role = 'teacher' | 'student' | 'parent'

export function roleFromGroups(groups: string[] | undefined | null): Role {
  const g = groups ?? []
  if (g.includes('teacher') || g.includes('admin')) return 'teacher'
  if (g.includes('parent')) return 'parent'
  return 'student'
}

/** Where a user of the given role belongs when they land somewhere they shouldn't. */
export function homeFor(role: Role): string {
  if (role === 'teacher') return '/teacher'
  if (role === 'parent') return '/parent'
  return '/dashboard'
}
