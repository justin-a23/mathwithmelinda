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

## Measured scope — REVISED DOWN after compatibility audit

The original "~200 touchpoints to rewrite" was wrong, and so was my own
restatement of it as 251. Both counted call sites without asking whether they
actually need to change. They mostly do not.

| Thing | Count | Needs rewriting? |
|---|---|---|
| `client.graphql(...)` call sites | 250 | **No** — see below |
| Files with inline GraphQL | 23 | No |
| Files importing generated ops | 7 | No — regenerate `src/graphql/*` |
| Generated artifacts | 12,348 lines | Regenerated, not edited |
| Server routes using the API key | 8 + ownership.ts | **Yes** — must forward JWT |
| Models | 26 | — |

Audited mechanically on 2026-07-28 against `amplify/data/resource.ts`:

- **47 distinct GraphQL operations** are used across the app. Gen 2 provides
  every one of them (same `listX`/`getX`/`createX`/`updateX`/`deleteX` names).
- **Zero field names** referenced by inline queries are missing from the Gen 2
  schema.
- **Zero hand-written references** to the fields the port dropped or renamed
  (`courseSemestersId`, `semesterWeeklyPlansId`, and the two ParentStudentLink
  keys). Every occurrence is in generated `src/graphql/*`, which is replaced.

Because the port deliberately preserved Gen 1's field and FK names, the raw
GraphQL surface is compatible. So Phase 3 is not a 251-site rewrite. It is:

1. Regenerate `src/graphql/*` with `ampx generate graphql-client-code`
2. Swap `amplifyconfiguration.json` → `amplify_outputs.json` in the Amplify init
3. Forward the caller's JWT in the 8 server routes (the real work — see below)
4. Fix fallout from the auth-mode change, which is where surprises will live

Estimate drops from ~1 week to ~2 days, with the caveat that step 4 is
unknowable until a sandbox exists to test against.

## Phase 1 — dependency blocker: RESOLVED (2026-07-28)

`@aws-amplify/backend` and `@aws-amplify/backend-cli` are now installed and the
tree builds clean. What it took:

The symptom was six routes failing to typecheck on `getSignedUrl(s3, …)` once
the Gen 2 packages were present. The cause was NOT a version conflict — it's
that installing them changes npm's hoisting, so `@aws-sdk/client-s3` and
`@aws-sdk/s3-request-presigner` end up resolving *different copies* of the
`@smithy/*` type declarations. TypeScript then refuses to unify them:

    types have separate declarations of a private property 'handlers'

That is a nominal mismatch, not a structural one. The runtime object is the
same `S3Client` the presigner expects.

**npm `overrides` was tried and abandoned.** Deduping the `@smithy/*` family
took 38 override entries, still left nine packages duplicated, and did not fix
the error. It also has to be redone on every dependency bump. Do not revisit it.

**The fix** is `app/lib/presign.ts` — a single wrapper around `getSignedUrl`
holding one documented cast, used by all six routes. No version pinning, no
overrides. The cast disappears on its own once the app stops depending on the
Gen 1 AWS SDK surface.

Verified: `tsc` clean with `amplify/` back INSIDE the typecheck (the exclude is
gone), `next build` succeeds, 73 tests pass, `npx ampx --version` → 1.8.3.

**The ported schema in `amplify/data/resource.ts` now typechecks against the
real Gen 2 types** — all 26 models and their auth rules. It was written blind
before the packages could be installed, so this is the first real validation.

## Phase 2 — backend definition written; deploy blocked on AWS setup

`amplify/backend.ts` and `amplify/auth/resource.ts` are written and the whole
definition typechecks. Scope is auth + data only.

Auth uses `referenceAuth`, NOT `defineAuth`: Melinda's teacher account, the
three groups and every student login already live in `us-east-1_LvIY8oPmV`.
`defineAuth` would create a fresh pool and force everyone to re-register.

The two S3 buckets are deliberately NOT declared with `defineStorage`. They
predate Amplify, hold every submission and all 581 videos, and are reached via
server routes using an IAM user. Handing their lifecycle to CloudFormation
during a migration is needless risk.

### Two blockers, both AWS-side, neither is code

1. **The account has never been CDK-bootstrapped.** Verified in the console:
   no `CDKToolkit` stack exists in us-east-1. Gen 2 is CDK underneath and
   cannot deploy without it. One-time, needs admin.

2. **`amplify-dev` lacks the permissions.** `ampx sandbox` fails on
   `ssm:GetParameter` for `/cdk-bootstrap/hnb659fds/version`. Same root cause
   as the AppSync 403 hit earlier — that user is scoped to S3 + Amplify +
   Cognito. It cannot bootstrap or deploy CDK stacks.

Fix either by running the bootstrap and sandbox under admin credentials, or by
granting `amplify-dev` a deploy policy. Bootstrap first — the sandbox will not
work until it exists:

    npx ampx sandbox --once --identifier gen2test

The sandbox creates a NEW AppSync API and NEW DynamoDB tables. It touches
nothing the running Gen 1 app uses, so it is safe to stand up alongside
production.

## Phase 3 — auth-model findings (do these before cutover)

Three problems found by checking the live Cognito pool against the ported
rules. All three would have broken cutover; none were visible from the code.

### 1. The `student` and `parent` groups are EMPTY — fixed in resource.ts

Verified 2026-07-28 against `us-east-1_LvIY8oPmV`:

    teacher: 1 member (melinda.all@icloud.com)
    student: 0 members
    parent:  0 members
    Hannah and Meredith: no groups at all

A `student` group role exists in the Gen 1 stack but nothing ever put a user in
it — the app only assigns `parent`, and `teacher` was set by hand. Students are
identified by the ABSENCE of a group (app/lib/roles.ts).

The first draft of the schema used `allow.group('student')`, which matches
nobody. Every real student would have been denied lessons, submissions and their
own profile. Now expressed as `authenticated()`.

To tighten later: assign the `student` group at profile approval and backfill.
roles.ts already handles members of that group, so it is a compatible change.

### 2. Parent signup would deadlock — fixed in resource.ts

`app/parent/accept/[token]` creates ParentStudent and ParentProfile BEFORE it
calls `/api/add-to-group`. With `allow.group('parent')` on create, the caller is
not yet in the group, so the row can never be created and the group is never
granted. Both models now allow `authenticated()` create.

### 3. Every server route authenticates to AppSync with the API key — NOT FIXED

Eight routes plus app/lib/ownership.ts call AppSync via `appsyncHeaders()`,
which sends `x-api-key`. They perform teacher-level work: deleteStudentProfile,
deleteSubmission, deleteParentProfile, createLessonTemplate, listEnrollments and
more.

Gen 2 grants those operations to `allow.group('teacher')`, not `publicApiKey`.
**As written, all eight routes fail at cutover.**

The fix is the one worth having anyway: forward the caller's verified Cognito
JWT to AppSync instead of the API key. Every one of these routes already runs
`requireTeacher()` or `requireAuth()`, so the token is in hand. Passing it
through means AppSync enforces the same rules the route does — defence in depth
— and takes the API key out of the server path entirely.

Deliberately not implemented yet: the Gen 1 API is API_KEY-only, so the token
path cannot be exercised until Gen 2 is deployed. Writing it blind would be
worse than writing it against a real endpoint. Shape:

    app/lib/appsync.ts  →  appsyncHeaders(token?: string)
                           token ? { Authorization: token } : { 'x-api-key': … }

Then thread `auth.token` through each route. Roughly a day, and it should be the
first thing done once the sandbox exists.

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
