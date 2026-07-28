import type { AuthUser } from '@/app/lib/auth'
import { appsyncClient } from '@/app/lib/appsync'
import { canReadSubmissionKeyGiven, canReadProfileKey } from '@/app/lib/ownershipRules'

/**
 * Ownership checks for S3 objects in the submissions bucket.
 *
 * Being signed in is not the same as being entitled to a given object. Routes
 * that hand out presigned URLs take a caller-supplied key, so without a check
 * here any authenticated student can read any other student's uploaded work.
 *
 * This module resolves *who the caller is entitled to*; the decisions
 * themselves are pure functions in ownershipRules.ts, tested by
 * scripts/test-ownership.ts.
 *
 * Note an asymmetry that shapes the code below: submission keys are namespaced
 * by EMAIL while profile keys use the Cognito SUB. That mirrors the
 * inconsistency in the database (Submission.studentId holds an email,
 * Enrollment.studentId a sub), and is why resolving a caller's email needs a
 * profile lookup rather than a token claim — the access token carries the sub,
 * not the email.
 */

export { canReadProfileKey }

/** Per-request client; `token` is the caller's verified access token. */
function makeGql(token: string) {
  const call = appsyncClient(token)
  return async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
    try {
      const json: any = await call(query, variables)
      if (json.errors) {
        console.error('ownership lookup failed:', JSON.stringify(json.errors))
        return null
      }
      return json.data as T
    } catch (err) {
      console.error('ownership lookup threw:', err)
      return null
    }
  }
}

/** The signed-in student's own email, or null if they have no profile. */
export async function resolveStudentEmail(token: string, userId: string): Promise<string | null> {
  const data = await makeGql(token)<{ listStudentProfiles: { items: { email: string }[] } }>(
    /* GraphQL */`
      query StudentEmail($userId: String!) {
        listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
          items { email }
        }
      }
    `,
    { userId }
  )
  return data?.listStudentProfiles.items[0]?.email ?? null
}

/** Emails of every student a parent is linked to. Empty if none. */
export async function resolveLinkedStudentEmails(token: string, parentId: string): Promise<string[]> {
  const data = await makeGql(token)<{ listParentStudents: { items: { studentEmail: string }[] } }>(
    /* GraphQL */`
      query LinkedStudents($parentId: String!) {
        listParentStudents(filter: { parentId: { eq: $parentId } }, limit: 50) {
          items { studentEmail }
        }
      }
    `,
    { parentId }
  )
  return (data?.listParentStudents.items ?? []).map(i => i.studentEmail).filter(Boolean)
}

/**
 * Whether `auth` may read `key` from the submissions bucket.
 *
 * Teachers short-circuit before any lookup. Students resolve to their own
 * email; parents to the emails of the students they're linked to.
 */
export async function canReadSubmissionKey(auth: AuthUser, key: string): Promise<boolean> {
  // Cheap structural and teacher checks first — no lookup needed for either.
  if (auth.role === 'teacher' || !key || key.includes('..') || key.startsWith('/')) {
    return canReadSubmissionKeyGiven(auth, key, [])
  }

  let entitled: string[] = []
  if (auth.role === 'student') {
    const email = await resolveStudentEmail(auth.token, auth.userId)
    entitled = email ? [email] : []
  } else if (auth.role === 'parent') {
    entitled = await resolveLinkedStudentEmails(auth.token, auth.userId)
  }

  return canReadSubmissionKeyGiven(auth, key, entitled)
}
