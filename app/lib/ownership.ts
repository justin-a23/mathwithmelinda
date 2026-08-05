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
    // A failed lookup must return null, not throw: callers treat null as "cannot
    // establish ownership" and deny access, so swallowing here fails closed.
    // appsyncClient raises AppSync-level errors, which this catch covers too.
    try {
      return (await call(query, variables)) as T
    } catch (err) {
      console.error('ownership lookup failed:', err)
      return null
    }
  }
}

/** The signed-in student's own email, or null if they have no profile. */
export async function resolveStudentEmail(token: string, userId: string): Promise<string | null> {
  // NOTE on limits: AppSync list resolvers apply `limit` to the underlying
  // table scan BEFORE the filter runs. `limit: 1` here scanned one arbitrary
  // row, filtered it against this userId, and returned empty for nearly every
  // student — which cascaded into /api/submit 403s ("no student profile") and
  // blank /api/view-submission previews. Keep limits comfortably above the
  // table's row count.
  const data = await makeGql(token)<{ listStudentProfiles: { items: { email: string }[] } }>(
    /* GraphQL */`
      query StudentEmail($userId: String!) {
        listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1000) {
          items { email }
        }
      }
    `,
    { userId }
  )
  return data?.listStudentProfiles?.items?.[0]?.email ?? null
}

/** Emails of every student a parent is linked to. Empty if none. */
export async function resolveLinkedStudentEmails(token: string, parentId: string): Promise<string[]> {
  const data = await makeGql(token)<{ listParentStudents: { items: { studentEmail: string }[] } }>(
    /* GraphQL */`
      query LinkedStudents($parentId: String!) {
        listParentStudents(filter: { parentId: { eq: $parentId } }, limit: 1000) {
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
    // Both identifiers: /api/submit namespaces keys by email, while QR/phone
    // uploads historically namespaced by the Cognito sub. Entitling both lets
    // a student read all of their own work regardless of which path wrote it.
    entitled = email ? [email, auth.userId] : [auth.userId]
  } else if (auth.role === 'parent') {
    const emails = await resolveLinkedStudentEmails(auth.token, auth.userId)
    entitled = [...emails]
    // Children's subs too: QR/phone uploads made before tokens minted with the
    // email namespaced their S3 keys by the Cognito sub, and a parent viewing
    // that work would otherwise 403 on keys their own child wrote.
    if (emails.length > 0) {
      const data = await makeGql(auth.token)<{ listStudentProfiles: { items: { userId: string }[] } }>(
        /* GraphQL */`
          query ChildSubs($filter: ModelStudentProfileFilterInput) {
            listStudentProfiles(filter: $filter, limit: 1000) {
              items { userId }
            }
          }
        `,
        { filter: { or: emails.map(e => ({ email: { eq: e } })) } }
      )
      for (const p of data?.listStudentProfiles?.items ?? []) {
        if (p.userId) entitled.push(p.userId)
      }
    }
  }

  return canReadSubmissionKeyGiven(auth, key, entitled)
}
