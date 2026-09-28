import Anthropic from '@anthropic-ai/sdk'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { roleFromGroups } from '../../../app/lib/roles'
import { reviewLessonWithClaude } from '../../../app/lib/weekCheckCore'

/**
 * Function-URL host for the "Check my week" Claude review. See resource.ts
 * for why this is a Lambda and not a Next route. Transport only: auth and
 * framing here, all review logic in app/lib/weekCheckCore.ts (imported
 * relatively, the bundler resolves no Next path aliases).
 *
 * CORS, including the preflight, is handled by the function URL configuration
 * in backend.ts; this handler only ever sees the POST.
 */

// Same verification app/lib/auth.ts does for the API routes: access token,
// teacher-or-admin only. Module scope so the JWKS cache survives warm invokes.
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || 'u1tcs496gjon44dpcqdjfr1bd',
})

type FunctionUrlEvent = {
  headers?: Record<string, string | undefined>
  body?: string
  isBase64Encoded?: boolean
  requestContext?: { http?: { method?: string } }
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const handler = async (event: FunctionUrlEvent) => {
  if (event.requestContext?.http?.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  // Function URL headers arrive lowercased
  const authHeader = event.headers?.authorization
  if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'Unauthorized' })
  let groups: string[]
  try {
    const payload = await verifier.verify(authHeader.slice(7))
    groups = (payload['cognito:groups'] as string[]) || []
  } catch {
    return json(401, { error: 'Unauthorized' })
  }
  if (roleFromGroups(groups) !== 'teacher') return json(403, { error: 'Forbidden' })

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return json(500, { error: 'ANTHROPIC_API_KEY is not configured' })
    const anthropic = new Anthropic({ apiKey })

    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '')
    const input = JSON.parse(raw)

    const result = await reviewLessonWithClaude(input, anthropic)
    return json(result.status, result.body)
  } catch (err: any) {
    console.error('Week check error:', err)
    return json(500, { error: err?.message || 'Failed to review lesson' })
  }
}
