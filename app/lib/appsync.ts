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

/**
 * Headers for a server-side AppSync request.
 *
 * Pass the caller's verified Cognito access token to authenticate AS THEM.
 * That is the right mode under Gen 2, whose per-model rules grant teacher work
 * to `group('teacher')` rather than to the API key — a key-authenticated call
 * would simply be denied. It is also better security: AppSync then enforces the
 * same rule the route already checked with requireTeacher/requireAuth, instead
 * of the route holding a credential that can do anything.
 *
 * Omitting the token falls back to the API key, which is what Gen 1 requires —
 * that API has no per-model rules and API_KEY as its only auth mode. Callers
 * stay on the key until cutover; do not switch them until the Gen 2 endpoint is
 * live, or every route will start failing against Gen 1.
 */
export function appsyncHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = accessToken
  } else {
    headers['x-api-key'] = getAppSyncApiKey()
  }
  return headers
}
