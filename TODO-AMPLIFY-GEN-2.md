# TODO: Migrate to Amplify Gen 2

**Status**: Planned for Summer 2026
**Hard deadline**: Done by Feb 2027 (90 days before AWS EOL on May 1, 2027)

## Why
- Amplify Gen 1 entered maintenance mode May 1, 2026
- Only critical bug fixes and security patches until May 1, 2027
- After EOL: no more updates of any kind
- New features and long-term support only on Gen 2

## Scope
- ~~Rewrite `schema.graphql` as TypeScript Gen 2 schema~~ — **drafted** at
  `amplify/data/resource.ts` (2026-07-28), including the `@auth` rules that
  Gen 1 never had. Not yet deployed or typechecked. See caveats below.
- Update all `client.graphql({...})` calls across the app
- Cognito setup migration (auth rules become code-first)
- Update Amplify CLI to Gen 2 in CI/build
- Test full data integrity: students, submissions, lessons, grades, messages, report cards

## Measured scope (2026-07-28, not estimated)

| Thing | Count |
|---|---|
| `client.graphql(...)` call sites | 251 across 36 files |
| Modules calling AppSync by raw fetch | 12 |
| Generated artifacts to delete | 12,348 lines (`src/API.ts`, `src/graphql/*`) |
| Models | 26 |

Heaviest files: `teacher/students` (22 calls), `teacher/page` (17),
`teacher/grades` (17), `teacher/semesters` (15), `teacher/library/[courseId]` (14).

## BLOCKER FOUND: the Gen 2 packages can't be installed alongside Gen 1

Installing `@aws-amplify/backend` pulls a nested `@smithy/types` that conflicts
with the version `@aws-sdk/s3-request-presigner` resolves to. The result is a
type error in **six** existing routes — grade-suggestion, profile-pic,
syllabus-pdf (x2), upload, view-submission — all on `getSignedUrl(s3Client, …)`.
`@aws-amplify/backend-cli` is not the cause; the base package alone does it.

This rules out the incremental path of "add Gen 2 deps, migrate file by file,
keep shipping." Options, in preference order:

1. **Cut over on a branch in one pass.** Install Gen 2 deps, port all 251 call
   sites, delete the Gen 1 client, resolve the presigner conflict once, merge.
   No half-migrated state on `main`.
2. **Pin `@smithy/types` via npm `overrides`** to force a single version. Might
   work; unverified, and pinning transitive AWS SDK types is fragile.
3. **Replace `s3-request-presigner`** in those six routes so nothing depends on
   the conflicting types.

Because of this, `amplify/` is excluded in `tsconfig.json` — the Gen 2 schema
does not typecheck in the current tree by design. Remove that exclude as step 1
of the real cutover.

## Data-shape landmines (verified against production)

- **Foreign keys.** Gen 1 generated implicit join fields; Gen 2 requires them
  declared. The names in `resource.ts` were read off the live API and must not
  be renamed — existing rows store those exact attribute names.
- **Two dead relationships.** `Semester.courseSemestersId` (0 of 2 rows) and
  `WeeklyPlan.semesterWeeklyPlansId` (0 of 6) are declared but never populated;
  the real links are `Semester.courseId` and `WeeklyPlan.courseWeeklyPlansId`.
- **`ParentStudentLink` has four FK fields** where two would do — explicit
  `parentProfileId`/`studentProfileId` plus implicit hasMany keys. There are 0
  rows in production, so pick one pair and move on.
- **`studentId` is inconsistent**: an email on `Submission`, a Cognito sub on
  `Enrollment`. This blocks row-level owner auth. Normalize before tightening
  the rules in `resource.ts`.

## Resources
- Migration guide: https://docs.amplify.aws/react/start/migrate-to-gen2/
- Feature comparison: https://docs.amplify.aws/react/start/migrate-to-gen2/#feature-comparison
- AWS Support if blocked

## When NOT to touch
- During active school year (Aug-May)
- During year-end reset
- When parents/students might need urgent access

## Best windows
- Summer 2026 (recommended — fresh tooling, fresh students in fall start on Gen 2)
- Winter break 2026-27 (fallback)
- Spring break 2027 (cutting it close)
