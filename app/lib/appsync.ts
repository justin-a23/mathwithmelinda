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
 * Which credential server routes present to AppSync.
 *
 * Gen 1 has API_KEY as its ONLY auth mode, so a JWT is rejected outright.
 * Gen 2 is the reverse: its per-model rules grant teacher work to
 * `group('teacher')` and deny the key — verified against the deployed sandbox,
 * where the key returns Unauthorized for reads and writes alike.
 *
 * The switch is therefore environmental, not per-call: every route passes the
 * caller's token unconditionally, and this decides whether to use it. Set
 * APPSYNC_AUTH_MODE=userPool at cutover, in the same change that repoints
 * APPSYNC_ENDPOINT. Flipping one without the other breaks every route, which is
 * exactly why they are read together here rather than scattered across callers.
 */
const USE_USER_POOL_AUTH = process.env.APPSYNC_AUTH_MODE === 'userPool'

/**
 * Headers for a server-side AppSync request.
 *
 * Authenticating as the caller is also better security than the shared key:
 * AppSync then enforces the same rule the route already checked with
 * requireTeacher/requireAuth, instead of the route wielding a credential that
 * can do anything regardless of who asked.
 */
export function appsyncHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (USE_USER_POOL_AUTH) {
    if (!accessToken) {
      throw new Error(
        'APPSYNC_AUTH_MODE=userPool but no access token was passed to appsyncHeaders(). ' +
        'The calling route must forward auth.token — the API key is not accepted by Gen 2.'
      )
    }
    headers.Authorization = accessToken
  } else {
    headers['x-api-key'] = getAppSyncApiKey()
  }
  return headers
}

/**
 * Build a GraphQL caller bound to one request's credentials.
 *
 * Routes do `const gql = appsyncClient(auth.token)` once at the top of the
 * handler and then call `gql(query, variables)` exactly as before. That matters:
 * the alternative — adding a token parameter to each route's local helper —
 * forces the token through every intermediate function too, which for
 * delete-student alone is a dozen call sites of pure churn and a dozen chances
 * to pass the wrong thing.
 *
 * Binding at construction also makes it impossible for one request's handler to
 * accidentally use another's credentials.
 */
export function appsyncClient(accessToken?: string) {
  const headers = appsyncHeaders(accessToken)
  return async function gql<T = any>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const res = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })
    return res.json() as Promise<T>
  }
}
