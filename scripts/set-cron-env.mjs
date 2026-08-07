// Adds the weekly-reminder cron's env vars to the Amplify app (app-level, so
// every branch build gets them). Merges with the existing map — UpdateApp
// replaces the whole environmentVariables object, so a partial map would wipe
// the SES/Zoom/AppSync vars. Prints variable NAMES only.
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)
process.env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY

for (const k of ['CRON_SECRET', 'CRON_COGNITO_EMAIL', 'CRON_COGNITO_PASSWORD']) {
  if (!env[k]) throw new Error(k + ' missing from .env.local')
}

const { AmplifyClient, GetAppCommand, UpdateAppCommand } = await import('@aws-sdk/client-amplify')
const amp = new AmplifyClient({ region: 'us-east-1' })
const APP_ID = 'dg6hiwssnna5c'

const { app } = await amp.send(new GetAppCommand({ appId: APP_ID }))
const merged = {
  ...app.environmentVariables,
  CRON_SECRET: env.CRON_SECRET,
  CRON_COGNITO_EMAIL: env.CRON_COGNITO_EMAIL,
  CRON_COGNITO_PASSWORD: env.CRON_COGNITO_PASSWORD,
}
await amp.send(new UpdateAppCommand({ appId: APP_ID, environmentVariables: merged }))

const { app: after } = await amp.send(new GetAppCommand({ appId: APP_ID }))
console.log('app env var names now:', Object.keys(after.environmentVariables).sort().join(', '))
