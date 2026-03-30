import { S3Client } from '@aws-sdk/client-s3'

// Uses explicit credentials when env vars are set (Amplify hosting),
// otherwise falls back to Lambda IAM role / instance metadata.
function makeS3Client() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    return new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        ...(AWS_SESSION_TOKEN ? { sessionToken: AWS_SESSION_TOKEN } : {}),
      },
    })
  }
  // No explicit creds — rely on Lambda execution role / instance metadata
  return new S3Client({ region: 'us-east-1' })
}

export const s3 = makeS3Client()
export const SUBMISSIONS_BUCKET = 'mathwithmelinda-submissions'
export const VIDEOS_BUCKET = 'mathwithmelinda-videos'
