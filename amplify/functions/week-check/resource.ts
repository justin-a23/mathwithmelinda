import { defineFunction } from '@aws-amplify/backend'

/**
 * "Check my week" Claude review as a Lambda, for the same reason as
 * grade-suggestion: Amplify Hosting's SSR has a hard, non-configurable 30 s
 * response timeout, and Opus working through a 20-question chapter test takes
 * longer than that. The browser calls this function's URL directly (see
 * backend.ts) with the teacher's Cognito access token; the handler verifies it,
 * same check as requireTeacher, before doing anything.
 *
 * ANTHROPIC_API_KEY comes from the Amplify console environment variables,
 * present in the build shell when `ampx pipeline-deploy` synthesizes this
 * stack. If it is ever missing the function still deploys and returns a clear
 * 500.
 */
export const weekCheck = defineFunction({
  name: 'week-check',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LvIY8oPmV',
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || 'u1tcs496gjon44dpcqdjfr1bd',
  },
})
