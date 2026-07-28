import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { S3Client } from '@aws-sdk/client-s3'

/**
 * Presign an S3 command.
 *
 * Wraps `getSignedUrl` in one place so the cast below is written once and
 * explained, rather than repeated across six routes.
 *
 * Why the cast is needed: once the Gen 2 backend packages are installed,
 * npm's hoisting changes and `@aws-sdk/client-s3` and
 * `@aws-sdk/s3-request-presigner` end up resolving *different copies* of the
 * `@smithy/*` type declarations. TypeScript then reports
 *
 *   Argument of type 'S3Client' is not assignable to parameter of type
 *   'Client<...>' — types have separate declarations of a private property
 *   'handlers'.
 *
 * That is a nominal mismatch, not a structural one: both copies declare the
 * same shape, and the object passed at runtime is the same S3Client the
 * presigner expects. The private-field check just refuses to unify two
 * identical declarations from different files.
 *
 * npm `overrides` is not a fix. Deduping the whole `@smithy/*` family takes ~38
 * entries, still leaves nine packages duplicated, and has to be redone whenever
 * a dependency bumps — it was tried and abandoned.
 *
 * This cast disappears on its own once the app no longer depends on the Gen 1
 * AWS SDK surface, or once the two packages resolve a single smithy copy again.
 */
/**
 * The command type hits the same duplicate-declaration problem as the client,
 * so both cross the boundary loosely. Callers still pass a real S3Client and a
 * real command object — the parameter types here are what's checked at the
 * call site, and only the hand-off to getSignedUrl is widened.
 */
type S3Command = { input: object }

export function presign(
  client: S3Client,
  command: S3Command,
  options?: { expiresIn?: number }
): Promise<string> {
  type Args = Parameters<typeof getSignedUrl>
  return getSignedUrl(client as unknown as Args[0], command as unknown as Args[1], options as Args[2])
}
