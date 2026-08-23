import { defineBackend } from '@aws-amplify/backend'
import { Duration } from 'aws-cdk-lib'
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { auth } from './auth/resource.ts'
import { data } from './data/resource.ts'
import { gradeSuggestion } from './functions/grade-suggestion/resource.ts'

/**
 * Amplify Gen 2 backend entry point.
 *
 * Scope is deliberately narrow: auth (referenced, not created) and data. The
 * two S3 buckets — mathwithmelinda-videos and mathwithmelinda-submissions —
 * are NOT declared with `defineStorage`. They already exist outside Amplify,
 * hold every uploaded submission and all 581 course videos, and are reached
 * through server routes using an IAM user rather than Amplify Storage. Bringing
 * them under Gen 2 would mean handing bucket lifecycle to CloudFormation, which
 * is a needless risk during a migration. They stay as they are.
 *
 * Gen 1 remains live and authoritative until cutover. This stack is additive:
 * it creates a NEW AppSync API and NEW DynamoDB tables, and touches nothing the
 * running app depends on.
 */
export const backend = defineBackend({
  auth,
  data,
  gradeSuggestion,
})

/**
 * The grade-suggestion Lambda is called DIRECTLY from the browser via a
 * function URL, not through a Next /api route: Amplify Hosting SSR has a hard
 * 30-second response timeout and no streaming, and the Opus grading call runs
 * ~50s+ on multi-photo submissions. A function URL has no such gateway — the
 * Lambda's own 300s timeout is the only clock.
 *
 * AuthType NONE is deliberate: IAM auth would require the browser to SigV4-sign
 * requests, which the Cognito identity-pool setup here doesn't do. The handler
 * enforces auth itself by verifying the caller's Cognito access token — the
 * exact check requireTeacher does for the /api routes.
 */
const gradeSuggestionUrl = backend.gradeSuggestion.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: [
      'https://www.mathwithmelinda.com',
      'https://mathwithmelinda.com',
      'http://localhost:3000',
    ],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['authorization', 'content-type'],
    maxAge: Duration.hours(1),
  },
})

// Presigning submission photos needs read on the bucket; the bucket predates
// Amplify and stays outside CloudFormation (see the note above), so this is a
// role grant, not a defineStorage reference.
backend.gradeSuggestion.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ['s3:GetObject'],
  resources: ['arn:aws:s3:::mathwithmelinda-submissions/*'],
}))

// Surface the URL to the client through amplify_outputs.json — the grades page
// reads outputs.custom.gradeSuggestionUrl and falls back to the (30s-capped)
// /api/grade-suggestion route when absent.
backend.addOutput({
  custom: {
    gradeSuggestionUrl: gradeSuggestionUrl.url,
  },
})
