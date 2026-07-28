import { referenceAuth } from '@aws-amplify/backend'

/**
 * Gen 2 auth — points at the EXISTING Cognito resources rather than creating new ones.
 *
 * `referenceAuth`, not `defineAuth`. Melinda's teacher account, the three
 * groups, and every student login already live in `us-east-1_LvIY8oPmV`.
 * `defineAuth` would stand up a fresh user pool and everyone would have to
 * re-register — including the teacher account that grants access to all student
 * data. Reusing the pool also keeps the `teacher` group membership that
 * app/lib/roles.ts reads.
 *
 * Values come from the Gen 1 stack:
 *   amplify/backend/amplify-meta.json  → pool, client and identity pool ids
 *   amplify/team-provider-info.json    → auth/unauth role ARNs
 *
 * NOTE: the Gen 1 stack still owns these resources. Until Gen 1 is
 * decommissioned, do not let Gen 2 try to modify them — reference only.
 */
export const auth = referenceAuth({
  userPoolId: 'us-east-1_LvIY8oPmV',
  identityPoolId: 'us-east-1:f854d048-b1ac-49ed-b195-f154e751041e',
  authRoleArn: 'arn:aws:iam::654654507255:role/amplify-mathwithmelinda-dev-fe953-authRole',
  unauthRoleArn: 'arn:aws:iam::654654507255:role/amplify-mathwithmelinda-dev-fe953-unauthRole',
  userPoolClientId: 'u1tcs496gjon44dpcqdjfr1bd',
  groups: {
    // Group role ARNs from the Gen 1 userPoolGroups resource. All three already
    // exist in the pool — note `student` exists even though nothing in the app
    // assigns it (students are identified by absence of a group; see
    // app/lib/roles.ts), so it is mapped here for completeness.
    teacher: 'arn:aws:iam::654654507255:role/us-east-1_LvIY8oPmV-teacherGroupRole',
    student: 'arn:aws:iam::654654507255:role/us-east-1_LvIY8oPmV-studentGroupRole',
    parent: 'arn:aws:iam::654654507255:role/us-east-1_LvIY8oPmV-parentGroupRole',
  },
})
