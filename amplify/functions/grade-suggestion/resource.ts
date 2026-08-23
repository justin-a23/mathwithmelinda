import { defineFunction } from '@aws-amplify/backend'

/**
 * AI grade suggestion as a Lambda, because Amplify Hosting cannot host it:
 * SSR compute has a hard, non-configurable 30-second response timeout (and no
 * response streaming), while Opus with adaptive thinking takes ~50s to grade a
 * two-photo submission (measured 2026-08-23). The browser calls this function's
 * URL directly (see backend.ts) with the teacher's Cognito access token; the
 * handler verifies it — same check as requireTeacher — before doing anything.
 *
 * ANTHROPIC_API_KEY comes from the Amplify console environment variables,
 * which are present in the build shell when `ampx pipeline-deploy` synthesizes
 * this stack. If it is ever missing the function still deploys and returns a
 * clear 500, mirroring the route's behavior.
 */
export const gradeSuggestion = defineFunction({
  name: 'grade-suggestion',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV',
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || 'u1tcs496gjon44dpcqdjfr1bd',
  },
})
