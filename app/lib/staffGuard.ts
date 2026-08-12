import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'

/**
 * Server-side tripwire: is this Cognito user staff (teacher/admin)?
 *
 * The delete-student and delete-parent routes call AdminDeleteUser on whatever
 * id the client hands them. On 2026-08-12 that deleted MELINDA'S TEACHER
 * ACCOUNT: a parent invite accepted while signed in as the teacher had created
 * a ParentStudent link carrying her sub, the Parents page rendered it as a
 * parent row, and Remove did exactly what it says. Every route that deletes a
 * Cognito user must refuse staff accounts — role mixups on the client are one
 * click away, and this is the difference between "weird row" and "teacher
 * locked out of production".
 *
 * Fails CLOSED: if groups can't be read, the caller must not delete.
 */
export async function isStaffCognitoUser(
  cognito: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string,
): Promise<boolean> {
  const res = await cognito.send(new AdminListGroupsForUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  }))
  const groups = (res.Groups || []).map(g => g.GroupName)
  return groups.includes('teacher') || groups.includes('admin')
}
