/**
 * AppSync access for routes that have NO signed-in caller (EventBridge crons,
 * the NAS dashboard poller). They authenticate a dedicated machine user
 * (CRON_COGNITO_EMAIL) against Cognito and send that token to AppSync.
 *
 * The machine user is deliberately in NO group: group-less means student-tier,
 * which can read everything `teacherWritesEveryoneReads` / `studentWritable`
 * models expose (courses, plans, profiles, submissions, messages) and write
 * nothing. Models with `teacherOnly` rules (support tickets) are invisible to
 * it; callers must treat those reads as optional.
 *
 * Lifted out of app/api/cron/weekly-reminder/route.ts on 2026-10-01 so the
 * homepage-summary route could share it instead of growing a second copy.
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { APPSYNC_ENDPOINT } from '@/app/lib/appsync'

/** Sign in the machine user; returns an access token AppSync accepts. */
export async function machineToken(): Promise<string> {
  const email = process.env.CRON_COGNITO_EMAIL
  const password = process.env.CRON_COGNITO_PASSWORD
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!email || !password || !clientId) {
    throw new Error('CRON_COGNITO_EMAIL / CRON_COGNITO_PASSWORD / COGNITO_CLIENT_ID must be set')
  }
  const cog = new CognitoIdentityProviderClient({ region: 'us-east-1' })
  const res = await cog.send(new InitiateAuthCommand({
    ClientId: clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  }))
  const token = res.AuthenticationResult?.AccessToken
  if (!token) throw new Error('machine user sign-in returned no token (challenge: ' + res.ChallengeName + ')')
  return token
}

export type Gql = <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>

/** Same throw-on-errors contract as appsyncClient, but always token-authed. */
export function gqlClient(token: string): Gql {
  return async function gql<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ query, variables }),
    })
    const json = (await res.json()) as { data?: T; errors?: { message?: string }[] }
    if (json?.errors?.length) {
      throw new Error(json.errors.map(e => e?.message || 'unknown error').join('; '))
    }
    return json?.data as T
  }
}

/** Drain a paginated list query. Filtered scans can return empty pages with a
 *  nextToken, so the loop runs until the token is gone, not until a page is empty. */
export async function listAll<T>(
  gql: Gql,
  query: string,
  field: string,
  variables: Record<string, unknown> = {}
): Promise<T[]> {
  const out: T[] = []
  let nextToken: string | null = null
  do {
    const data: Record<string, { items?: T[]; nextToken?: string | null } | undefined> = await gql(query, { ...variables, nextToken })
    out.push(...(data[field]?.items || []))
    nextToken = data[field]?.nextToken || null
  } while (nextToken)
  return out
}
