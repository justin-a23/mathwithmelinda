import Anthropic from '@anthropic-ai/sdk'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { presign } from '../../../app/lib/presign'
import { roleFromGroups } from '../../../app/lib/roles'
import { generateGradeSuggestion } from '../../../app/lib/gradeSuggestionCore'

/**
 * Function-URL host for AI grade suggestions — see resource.ts for why this is
 * a Lambda and not a Next route. Transport only: auth + framing here, all
 * grading logic in app/lib/gradeSuggestionCore.ts (imported relatively — the
 * bundler resolves no Next path aliases).
 *
 * CORS is handled by the function URL configuration in backend.ts, including
 * the preflight; this handler only ever sees the POST.
 */

// S3: the execution role carries s3:GetObject on the submissions bucket
// (granted in backend.ts) — no long-lived keys involved. Presigned URLs signed
// with the role's session credentials stay valid past the session because the
// expiry here (5 min) is far shorter than the credential lifetime.
const s3 = new S3Client({ region: 'us-east-1' })
function presignSubmission(key: string): Promise<string> {
  return presign(s3, new GetObjectCommand({ Bucket: 'mathwithmelinda-submissions', Key: key }), { expiresIn: 300 })
}

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

    const result = await generateGradeSuggestion(input, { anthropic, presignSubmission })
    return json(result.status, result.body)
  } catch (err: any) {
    console.error('Grade suggestion error:', err)
    return json(500, { error: err?.message || 'Failed to generate suggestion' })
  }
}
