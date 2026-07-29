/**
 * Who a student *is*, as far as the database is concerned.
 *
 * ─── Read this before changing anything here ────────────────────────────────
 *
 * Submission, Message, VideoWatch and Enrollment store the Cognito **sub** in
 * `studentId`. Verified against production on 2026-07-28: 63 of 63 rows hold a
 * sub, none hold an email.
 *
 * ReportCardRecord is the EXCEPTION. Its `studentId` holds the StudentProfile
 * row id, not a sub — see app/teacher/report-card/page.tsx, which reads the
 * same value back as `listStudentProfiles(filter: { id: { eq: studentId } })`,
 * and app/api/delete-student/route.ts, which deletes by profile id. It is
 * written only by the teacher, never by a student, so nothing here applies to
 * it. Do not "fix" it to match the others without also migrating the rows, and
 * do not give it an owner rule keyed on studentId — no student's sub will ever
 * match.
 *
 * That was not always true. Gen 1 stored an email on Submission and a sub on
 * Enrollment, and scripts/migrate-gen1-to-gen2.mjs normalized everything to the
 * sub during the Gen 2 copy — deliberately, because row-level owner auth
 * (`allow.ownerDefinedIn('studentId')`) can only compare against a claim in the
 * JWT, and there is no claim that holds the email reliably.
 *
 * The old client code reached for `user.signInDetails?.loginId` — the email —
 * and fell back to `userId`. Two things are wrong with that:
 *
 *   1. It no longer matches the data, so every query filtered on it returns
 *      nothing.
 *   2. `signInDetails` is populated from the tokens cached at sign-in, so it is
 *      present on a fresh login and ABSENT after a page refresh. The same user
 *      would silently write an email one moment and a sub the next, which is
 *      how the two conventions got mixed in the first place.
 *
 * So identity is resolved here, in one place, and nowhere else.
 */

/**
 * The minimum shape this needs. Both `getCurrentUser()` and the `user` from
 * `useAuthenticator()` satisfy it, so call sites can pass either without a cast.
 */
export interface HasUserId {
  userId?: string
}

/**
 * The signed-in user's `studentId` as stored in DynamoDB, or `''` if there is
 * no user yet.
 *
 * This is `userId` and nothing else. Amplify builds that field as
 * `idToken.payload.sub` (see @aws-amplify/auth, getCurrentUser), so it is the
 * Cognito sub — the same value AppSync will compare against when the owner
 * rules land, and the same value `app/lib/auth.ts` verifies server-side.
 *
 * Returning `''` rather than throwing matches how the call sites already
 * behave: they guard with `if (!studentId) return` while auth is still loading.
 * A falsy value must never be used as a filter — an empty `studentId` would
 * match rows that have none.
 */
export function studentKey(user: HasUserId | null | undefined): string {
  return user?.userId ?? ''
}
