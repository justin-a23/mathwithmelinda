import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'

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
})
