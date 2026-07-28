/**
 * Server-side AppSync access.
 *
 * The API key is read from the environment and has no hardcoded fallback on purpose:
 * a literal here ends up committed to a public repo. Missing config should fail loudly
 * at call time rather than silently authenticate as some stale baked-in key.
 */

export const APPSYNC_ENDPOINT =
  process.env.APPSYNC_ENDPOINT ||
  'https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql'

export function getAppSyncApiKey(): string {
  const key = process.env.APPSYNC_API_KEY
  if (!key) {
    throw new Error(
      'APPSYNC_API_KEY is not set. Add it to .env.local locally, or to the Amplify ' +
      'environment variables for deployed builds.'
    )
  }
  return key
}

/** Headers for an API-key-authenticated AppSync request. */
export function appsyncHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-api-key': getAppSyncApiKey() }
}
