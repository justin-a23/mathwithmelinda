/**
 * Upload token system for QR-code phone uploads.
 *
 * Students generate a short-lived token from their authenticated session.
 * The token authorizes a phone (no Cognito session) to upload files
 * for a specific student + lesson combination.
 *
 * Tokens are stored in a standalone DynamoDB table (not the AppSync schema)
 * to avoid risky `amplify push` operations on the live system.
 *
 * Table: mwm-upload-tokens
 *   - tokenId (String, partition key)
 *   - studentId (String)
 *   - lessonId (String)
 *   - expiresAt (Number, epoch seconds — DynamoDB TTL)
 *   - maxUploads (Number)
 *   - uploadCount (Number)
 *   - uploadedKeys (List of Strings — S3 keys)
 *   - createdAt (String, ISO timestamp)
 */

import crypto from 'crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const TABLE_NAME = 'mwm-upload-tokens'
const TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes
const DEFAULT_MAX_UPLOADS = 10

// Reuse the same credential pattern as s3.ts
function makeDynamoClient() {
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN
  if (accessKeyId && secretAccessKey) {
    return new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    })
  }
  return new DynamoDBClient({ region: 'us-east-1' })
}

const ddb = DynamoDBDocumentClient.from(makeDynamoClient())

export type UploadToken = {
  tokenId: string
  studentId: string
  lessonId: string
  expiresAt: number
  maxUploads: number
  uploadCount: number
  uploadedKeys: string[]
  createdAt: string
}

/**
 * Create a new upload token for a student + lesson.
 * Returns the token ID (64 hex chars, 128-bit entropy).
 */
export async function createToken(studentId: string, lessonId: string): Promise<UploadToken> {
  const tokenId = crypto.randomBytes(32).toString('hex')
  const now = Math.floor(Date.now() / 1000)
  const token: UploadToken = {
    tokenId,
    studentId,
    lessonId,
    expiresAt: now + TOKEN_TTL_SECONDS,
    maxUploads: DEFAULT_MAX_UPLOADS,
    uploadCount: 0,
    uploadedKeys: [],
    createdAt: new Date().toISOString(),
  }

  await ddb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: token,
    ConditionExpression: 'attribute_not_exists(tokenId)', // paranoid uniqueness check
  }))

  return token
}

export type TokenValidation = {
  valid: boolean
  reason?: string
  studentId?: string
  lessonId?: string
  uploadCount?: number
  maxUploads?: number
  remainingUploads?: number
}

/**
 * Validate an upload token. Returns whether it's usable and why not if it isn't.
 */
export async function validateToken(tokenId: string): Promise<TokenValidation> {
  if (!tokenId || tokenId.length !== 64) {
    return { valid: false, reason: 'Invalid token format' }
  }

  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { tokenId },
  }))

  const token = result.Item as UploadToken | undefined
  if (!token) {
    return { valid: false, reason: 'Token not found' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (now >= token.expiresAt) {
    return { valid: false, reason: 'Token expired' }
  }

  if (token.uploadCount >= token.maxUploads) {
    return { valid: false, reason: 'Maximum uploads reached' }
  }

  return {
    valid: true,
    studentId: token.studentId,
    lessonId: token.lessonId,
    uploadCount: token.uploadCount,
    maxUploads: token.maxUploads,
    remainingUploads: token.maxUploads - token.uploadCount,
  }
}

/**
 * Atomically increment the upload count and record the S3 key.
 * Uses a conditional expression to prevent exceeding maxUploads even under race conditions.
 */
export async function incrementUploadCount(tokenId: string, s3Key: string): Promise<boolean> {
  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tokenId },
      UpdateExpression: 'SET uploadCount = uploadCount + :one, uploadedKeys = list_append(uploadedKeys, :key)',
      ConditionExpression: 'uploadCount < maxUploads',
      ExpressionAttributeValues: {
        ':one': 1,
        ':key': [s3Key],
      },
    }))
    return true
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return false // max uploads exceeded
    }
    throw err
  }
}

export type TokenStatus = {
  uploadCount: number
  uploadedKeys: string[]
  expired: boolean
  maxUploads: number
}

/**
 * Get the current status of a token (for polling from the computer browser).
 */
export async function getTokenStatus(tokenId: string): Promise<TokenStatus | null> {
  if (!tokenId || tokenId.length !== 64) return null

  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { tokenId },
  }))

  const token = result.Item as UploadToken | undefined
  if (!token) return null

  const now = Math.floor(Date.now() / 1000)
  return {
    uploadCount: token.uploadCount,
    uploadedKeys: token.uploadedKeys ?? [],
    expired: now >= token.expiresAt,
    maxUploads: token.maxUploads,
  }
}
