// One-time EventBridge setup for the Monday-morning assignment reminder.
// Creates (idempotently):
//   1. a Connection holding the x-cron-secret header value,
//   2. an API Destination POSTing to the production route,
//   3. an IAM role EventBridge assumes to invoke the destination,
//   4. a scheduled rule: cron(0 13 ? * MON *) UTC = 8am CDT / 7am CST Monday.
//
// The endpoint targets www — the apex 302-redirects there, and API
// destinations treat a 3xx as failure. Retries are capped at 5 within 2 hours;
// the route's atomic already-sent claim makes any retry a fast no-op.
//
// Prints status only — never the secret.
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)
process.env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
if (!env.CRON_SECRET) throw new Error('CRON_SECRET missing from .env.local')

const REGION = 'us-east-1'
const NAME = 'mwm-weekly-reminder'
const ENDPOINT = 'https://www.mathwithmelinda.com/api/cron/weekly-reminder'

const {
  EventBridgeClient, DescribeConnectionCommand, CreateConnectionCommand, UpdateConnectionCommand,
  DescribeApiDestinationCommand, CreateApiDestinationCommand,
  PutRuleCommand, PutTargetsCommand,
} = await import('@aws-sdk/client-eventbridge')
const { IAMClient, GetRoleCommand, CreateRoleCommand, PutRolePolicyCommand } = await import('@aws-sdk/client-iam')

const eb = new EventBridgeClient({ region: REGION })
const iam = new IAMClient({ region: REGION })

// ── 1. Connection (carries the secret header) ──
let connectionArn
try {
  const c = await eb.send(new DescribeConnectionCommand({ Name: NAME }))
  connectionArn = c.ConnectionArn
  // Refresh the header value in case CRON_SECRET rotated.
  await eb.send(new UpdateConnectionCommand({
    Name: NAME,
    AuthorizationType: 'API_KEY',
    AuthParameters: { ApiKeyAuthParameters: { ApiKeyName: 'x-cron-secret', ApiKeyValue: env.CRON_SECRET } },
  }))
  console.log('connection: exists (secret refreshed)')
} catch {
  const c = await eb.send(new CreateConnectionCommand({
    Name: NAME,
    AuthorizationType: 'API_KEY',
    AuthParameters: { ApiKeyAuthParameters: { ApiKeyName: 'x-cron-secret', ApiKeyValue: env.CRON_SECRET } },
  }))
  connectionArn = c.ConnectionArn
  console.log('connection: created')
}

// ── 2. API destination ──
let destinationArn
try {
  const d = await eb.send(new DescribeApiDestinationCommand({ Name: NAME }))
  destinationArn = d.ApiDestinationArn
  console.log('api destination: exists')
} catch {
  const d = await eb.send(new CreateApiDestinationCommand({
    Name: NAME,
    ConnectionArn: connectionArn,
    InvocationEndpoint: ENDPOINT,
    HttpMethod: 'POST',
    InvocationRateLimitPerSecond: 1,
  }))
  destinationArn = d.ApiDestinationArn
  console.log('api destination: created →', ENDPOINT)
}

// ── 3. Invocation role ──
const ROLE = 'mwm-eventbridge-weekly-reminder'
let roleArn
try {
  const r = await iam.send(new GetRoleCommand({ RoleName: ROLE }))
  roleArn = r.Role.Arn
  console.log('iam role: exists')
} catch {
  const r = await iam.send(new CreateRoleCommand({
    RoleName: ROLE,
    AssumeRolePolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Principal: { Service: 'events.amazonaws.com' }, Action: 'sts:AssumeRole' }],
    }),
  }))
  roleArn = r.Role.Arn
  await iam.send(new PutRolePolicyCommand({
    RoleName: ROLE,
    PolicyName: 'invoke-weekly-reminder',
    PolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: 'events:InvokeApiDestination', Resource: destinationArn }],
    }),
  }))
  console.log('iam role: created')
  // IAM is eventually consistent; give the role a moment before PutTargets.
  await new Promise(r2 => setTimeout(r2, 10000))
}

// ── 4. Rule + target ──
await eb.send(new PutRuleCommand({
  Name: NAME + '-monday',
  ScheduleExpression: 'cron(0 13 ? * MON *)',
  State: 'ENABLED',
  Description: 'Monday-morning student assignment reminder (8am CDT / 7am CST)',
}))
await eb.send(new PutTargetsCommand({
  Rule: NAME + '-monday',
  Targets: [{
    Id: '1',
    Arn: destinationArn,
    RoleArn: roleArn,
    Input: '{}',
    RetryPolicy: { MaximumRetryAttempts: 5, MaximumEventAgeInSeconds: 7200 },
  }],
}))
console.log('rule: ENABLED — fires Mondays 13:00 UTC (8am CDT / 7am CST)')
