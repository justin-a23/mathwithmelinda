// One-time setup for the weekly-reminder cron's machine identity.
// Prints status only — never credentials.
import { readFileSync, appendFileSync } from 'fs'
import crypto from 'crypto'

const ENV_PATH = '/Users/justinall/mathwithmelinda/.env.local'
const env = Object.fromEntries(
  readFileSync(ENV_PATH, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)
process.env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY

const POOL = env.COGNITO_USER_POOL_ID
const CLIENT = env.COGNITO_CLIENT_ID
const EMAIL = 'system@mathwithmelinda.com'

const {
  CognitoIdentityProviderClient, DescribeUserPoolClientCommand, UpdateUserPoolClientCommand,
  AdminCreateUserCommand, AdminSetUserPasswordCommand, InitiateAuthCommand, AdminGetUserCommand,
} = await import('@aws-sdk/client-cognito-identity-provider')
const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })

// ── 1. Enable USER_PASSWORD_AUTH (preserving everything else) ──
const { UserPoolClient: cur } = await cog.send(new DescribeUserPoolClientCommand({ UserPoolId: POOL, ClientId: CLIENT }))
const wantFlows = ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_CUSTOM_AUTH', 'ALLOW_USER_PASSWORD_AUTH']
const haveFlows = cur.ExplicitAuthFlows || []
if (!haveFlows.includes('ALLOW_USER_PASSWORD_AUTH')) {
  // UpdateUserPoolClient is a full replace — carry every mutable field over.
  const carry = { ...cur }
  delete carry.ClientId; delete carry.UserPoolId; delete carry.ClientSecret
  delete carry.LastModifiedDate; delete carry.CreationDate
  const merged = [...new Set([...haveFlows, ...wantFlows])]
  await cog.send(new UpdateUserPoolClientCommand({
    UserPoolId: POOL, ClientId: CLIENT, ...carry, ExplicitAuthFlows: merged,
  }))
  console.log('auth flows updated:', merged.join(', '))
} else {
  console.log('auth flows already include USER_PASSWORD_AUTH')
}

// ── 2. Create machine user (idempotent) ──
let exists = false
try {
  await cog.send(new AdminGetUserCommand({ UserPoolId: POOL, Username: EMAIL }))
  exists = true
  console.log('machine user already exists')
} catch { /* not found — create */ }
if (!exists) {
  await cog.send(new AdminCreateUserCommand({
    UserPoolId: POOL, Username: EMAIL, MessageAction: 'SUPPRESS',
    UserAttributes: [
      { Name: 'email', Value: EMAIL },
      { Name: 'email_verified', Value: 'true' },
    ],
  }))
  console.log('machine user created (no group — student-tier read access only)')
}

// ── 3. Set permanent password + persist to .env.local ──
let password = env.CRON_COGNITO_PASSWORD
if (!password) {
  // Random, all four character classes to satisfy any pool policy.
  const base = crypto.randomBytes(24).toString('base64url')
  password = base + 'Aa1!'
  await cog.send(new AdminSetUserPasswordCommand({ UserPoolId: POOL, Username: EMAIL, Password: password, Permanent: true }))
  const secret = crypto.randomBytes(32).toString('base64url')
  appendFileSync(ENV_PATH, `\nCRON_COGNITO_EMAIL=${EMAIL}\nCRON_COGNITO_PASSWORD=${password}\nCRON_SECRET=${secret}\n`)
  console.log('password set (permanent); CRON_* vars appended to .env.local')
} else {
  console.log('CRON_COGNITO_PASSWORD already in .env.local — keeping it')
  await cog.send(new AdminSetUserPasswordCommand({ UserPoolId: POOL, Username: EMAIL, Password: password, Permanent: true }))
}

// ── 4. Prove sign-in + AppSync read work ──
const auth = await cog.send(new InitiateAuthCommand({
  ClientId: CLIENT, AuthFlow: 'USER_PASSWORD_AUTH',
  AuthParameters: { USERNAME: EMAIL, PASSWORD: password },
}))
const token = auth.AuthenticationResult?.AccessToken
if (!token) throw new Error('no access token; challenge: ' + auth.ChallengeName)
console.log('InitiateAuth OK, got access token')

const outputs = JSON.parse(readFileSync('/Users/justinall/mathwithmelinda/amplify_outputs.json', 'utf8'))
const res = await fetch(outputs.data.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: token },
  body: JSON.stringify({ query: `query { listStudentProfiles(limit: 5) { items { id status } } }` }),
})
const json = await res.json()
if (json.errors?.length) throw new Error('AppSync errors: ' + json.errors.map(e => e.message).join('; '))
console.log('AppSync read OK — sample rows returned:', json.data.listStudentProfiles.items.length)
