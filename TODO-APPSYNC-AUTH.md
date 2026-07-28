# TODO: Put the AppSync API behind real authorization

**Status**: Open — found 2026-07-28
**Severity**: High. Unauthenticated read/write access to student PII in production.

## The problem

`amplify/backend/api/mathwithmelinda/schema.graphql` declares **26 `@model` types and
zero `@auth` directives**. The API's default authorization mode is `API_KEY`
(`aws_appsync_authenticationType: "API_KEY"` in `src/amplifyconfiguration.json`).

With no `@auth` rules, the API key is sufficient to read, create, update and delete
**every record in every model**, including:

- `StudentProfile` — student first/last name, email, grade level, parent names, parent emails
- `Submission` — photos of student work, grades, Melinda's written comments
- `Message` — teacher/student correspondence
- `ParentProfile`, `Enrollment`, `TeacherProfile`, everything else

The students are minors. This is the sensitive data in the system.

## Why rotating the key does not fix it

The key is not only a leaked secret — it is **shipped to the browser by design**.

Amplify bakes `aws_appsync_apiKey` into `amplifyconfiguration.json`, which is bundled
into the client JavaScript at build time and served from the public site. Anyone can
open devtools on mathwithmelinda.com, read the key out of the bundle, and call the API
directly. A rotated key gets bundled and published exactly the same way.

Rotation is still worth doing — it invalidates the copy sitting in this repo's git
history — but it closes the git exposure, not the hole.

The `requireTeacher()` guard on the `/api/*` routes does not help either. It protects
those routes, but the AppSync endpoint is reachable directly and doesn't consult them.

## The actual fix

1. **Add `@auth` rules to all 26 models.** Sketch:
   - `StudentProfile`, `Submission`, `Message`, `Enrollment`: owner-based read for the
     student, full access for the `teacher` group, scoped read for linked `parent`s
   - `Course`, `LessonTemplate`, `AssignmentQuestion`: read for authenticated users,
     write for `teacher` only
   - `TeacherProfile`: `teacher` group only
2. **Switch the default auth mode to Cognito user pools** (`amplify update api`).
   Keep `API_KEY` as a secondary mode only if something genuinely needs public reads —
   most likely nothing does.
3. **Audit the `/api/*` routes.** They currently authenticate to AppSync with the API
   key; they'll need to pass through the caller's Cognito token or use IAM instead.
4. **Rotate the key** once it is no longer the thing standing between the internet and
   the database.

## Sequencing

This overlaps heavily with the **Amplify Gen 2 migration** (`TODO-AMPLIFY-GEN-2.md`),
where authorization becomes code-first and gets rewritten anyway. Doing the auth work
twice would be wasted, so the sensible order is:

- Now: key moved out of source into `APPSYNC_API_KEY` (done 2026-07-28)
- Now: rotate the exposed key — closes the git-history exposure
- Gen 2 migration: define `@auth` / `allow` rules as part of the schema rewrite, and
  switch the default mode off `API_KEY` in the same pass

**Do not open fall enrollment to real families before step 3 is done.** Every student
added between now and then widens the exposure.
