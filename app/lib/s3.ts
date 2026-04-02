import { S3Client } from '@aws-sdk/client-s3'

// Uses explicit credentials when env vars are set (Amplify hosting),
// otherwise falls back to Lambda IAM role / instance metadata.
// Amplify Console blocks "AWS_" prefix env vars, so we use MWM_ prefix in production.
// Local dev still works with AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from .env.local.
function makeS3Client() {
  const accessKeyId = process.env.MWM_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.MWM_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN
  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    })
  }
  // No explicit creds — rely on Lambda execution role / instance metadata
  return new S3Client({ region: 'us-east-1' })
}

export const s3 = makeS3Client()
export const SUBMISSIONS_BUCKET = 'mathwithmelinda-submissions'
export const VIDEOS_BUCKET = 'mathwithmelinda-videos'
