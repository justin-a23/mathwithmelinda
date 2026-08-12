// EMERGENCY RESTORE: recreate melinda.all@icloud.com (teacher) after it was
// deleted during parent-flow testing. Prints status only; the temporary
// password is written to a local file, never printed or committed.
import { readFileSync, writeFileSync } from 'fs'
import crypto from 'crypto'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)
process.env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY

const EMAIL = 'melinda.all@icloud.com'
const POOL = env.COGNITO_USER_POOL_ID
const CLIENT = env.COGNITO_CLIENT_ID
const PASSWORD_FILE = new URL('../MELINDA-TEMP-PASSWORD.txt', import.meta.url)

const {
  CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand, AdminGetUserCommand, InitiateAuthCommand,
} = await import('@aws-sdk/client-cognito-identity-provider')
const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })

// 1. Recreate the account (idempotent)
let sub = null
try {
  const existing = await cog.send(new AdminGetUserCommand({ UserPoolId: POOL, Username: EMAIL }))
  sub = existing.UserAttributes.find(a => a.Name === 'sub')?.Value
  console.log('account already exists — continuing with group/profile repair')
} catch {
  const created = await cog.send(new AdminCreateUserCommand({
    UserPoolId: POOL, Username: EMAIL, MessageAction: 'SUPPRESS',
    UserAttributes: [
      { Name: 'email', Value: EMAIL },
      { Name: 'email_verified', Value: 'true' },
    ],
  }))
  sub = created.User.Attributes.find(a => a.Name === 'sub')?.Value
  console.log('account recreated')
}

// 2. Temporary password → local file only (gitignored repo root file; delete after use)
const tempPassword = 'Mwm-' + crypto.randomBytes(9).toString('base64url') + '7!'
await cog.send(new AdminSetUserPasswordCommand({ UserPoolId: POOL, Username: EMAIL, Password: tempPassword, Permanent: true }))
writeFileSync(PASSWORD_FILE, `Temporary password for ${EMAIL}\n\n${tempPassword}\n\nShe can change it later via "Forgot password" on the sign-in page.\nDELETE THIS FILE after she is signed in.\n`)
console.log('temporary password written to MELINDA-TEMP-PASSWORD.txt (repo root — do not commit; delete after use)')

// 3. Teacher group
await cog.send(new AdminAddUserToGroupCommand({ UserPoolId: POOL, Username: EMAIL, GroupName: 'teacher' }))
console.log('added to teacher group')

// 4. Re-point her TeacherProfile at the new sub (signing in AS her, so the
// staff-only write rule is satisfied by her own brand-new credentials).
const auth = await cog.send(new InitiateAuthCommand({
  ClientId: CLIENT, AuthFlow: 'USER_PASSWORD_AUTH',
  AuthParameters: { USERNAME: EMAIL, PASSWORD: tempPassword },
}))
const token = auth.AuthenticationResult?.AccessToken
if (!token) throw new Error('sign-in as restored account failed: ' + auth.ChallengeName)

const outputs = JSON.parse(readFileSync(new URL('../amplify_outputs.json', import.meta.url), 'utf8'))
const gql = async (query, variables = {}) => {
  const r = await fetch(outputs.data.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors?.length) throw new Error(j.errors.map(e => e.message).join('; '))
  return j.data
}

const profiles = await gql('query { listTeacherProfiles(limit: 100) { items { id userId displayName } } }')
const items = profiles.listTeacherProfiles.items
console.log('teacher profiles found:', items.map(p => `${p.displayName || '(no name)'} [userId ${String(p.userId).slice(0, 8)}…]`).join(', ') || '(none)')

// Hers = any profile whose userId matches no current Cognito account and isn't
// the known-stale jsa row; prefer one whose displayName mentions Melinda.
const { ListUsersCommand } = await import('@aws-sdk/client-cognito-identity-provider')
const users = await cog.send(new ListUsersCommand({ UserPoolId: POOL, Limit: 60 }))
const liveSubs = new Set(users.Users.map(u => u.Attributes.find(a => a.Name === 'sub')?.Value))
const orphans = items.filter(p => !liveSubs.has(p.userId))
const hers = orphans.find(p => (p.displayName || '').toLowerCase().includes('melinda')) || orphans[0]
if (hers) {
  await gql(
    'mutation($input: UpdateTeacherProfileInput!) { updateTeacherProfile(input: $input) { id userId } }',
    { input: { id: hers.id, userId: sub } }
  )
  console.log(`TeacherProfile "${hers.displayName || hers.id}" re-pointed to the new account`)
} else {
  console.log('no orphaned TeacherProfile found — she may need to re-set display name/picture on /teacher/profile')
}

console.log('\nDONE. Melinda signs in at mathwithmelinda.com with the password in MELINDA-TEMP-PASSWORD.txt')
