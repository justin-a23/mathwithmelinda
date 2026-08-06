import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

/**
 * Amplify Gen 2 data schema — port of amplify/backend/api/mathwithmelinda/schema.graphql
 *
 * ─── Two things to understand before editing ────────────────────────────────
 *
 * 1. FOREIGN KEY NAMES ARE LOAD-BEARING.
 *    Gen 1 generated implicit join fields (courseLessonTemplatesId, and so on).
 *    Gen 2 requires them to be declared explicitly. The names below were read
 *    off the live API by introspection and MUST NOT be "tidied up" to nicer
 *    names like `courseId` — the existing DynamoDB rows store these exact
 *    attribute names, and renaming one silently orphans every related record.
 *
 * 2. AUTHORIZATION IS NEW HERE, NOT PORTED.
 *    The Gen 1 schema opened with:
 *        input AMPLIFY { globalAuthRule: AuthRule = { allow: public } }
 *    which granted unauthenticated API-key access to all 26 models, including
 *    student names, parent emails, submitted work and grades. Nothing is
 *    carried over from that. Every model below declares explicit rules.
 *    See TODO-APPSYNC-AUTH.md for the full write-up.
 *
 * Cognito groups: teacher, admin, student, parent. 'admin' is IT/support and is
 * teacher-equivalent — see STAFF below and app/lib/roles.ts.
 */

// ─── Authorization shorthands ────────────────────────────────────────────────
//
// IMPORTANT — why students are `authenticated()` and not `group('student')`:
//
// Verified against the live pool (us-east-1_LvIY8oPmV) on 2026-07-28:
//
//     group "teacher": 1 member  (melinda.all@icloud.com)
//     group "student": 0 members
//     group "parent" : 0 members
//     Hannah and Meredith: NO GROUPS AT ALL
//
// A `student` group role exists in the Gen 1 stack, but nothing has ever put a
// user in it — the app only ever assigns `parent` (see app/api/add-to-group),
// and `teacher` was set by hand. Students are identified by the ABSENCE of a
// group, which is exactly what app/lib/roles.ts encodes.
//
// So `allow.group('student')` would match nobody and deny every real student
// access to lessons, submissions and their own profile. Student-tier access
// must therefore be expressed as `authenticated()`.
//
// The cost is precision: `authenticated()` also matches teachers and parents,
// so these rules cannot distinguish student from parent. That is acceptable
// only because there is no row-level scoping yet either (see the gaps note at
// the bottom). To tighten this, start assigning the `student` group on profile
// approval and backfill the existing users — roles.ts already handles members
// of that group correctly, so it is a compatible change.

/**
 * TEMPORARY, MIGRATION ONLY — off unless explicitly switched on.
 *
 * The Gen 2 API correctly denies the API key; that is the point of the
 * migration. But scripts/migrate-gen1-to-gen2.mjs is not a Cognito user, and
 * this version of @aws-amplify/backend exposes no IAM allow-list, so it has no
 * way to authenticate for the one-time data copy.
 *
 * Setting AMPLIFY_DATA_MIGRATION=allow-api-key at synth time adds publicApiKey
 * to every model so the copy can run — and nothing else.
 *
 * Gated on an env var rather than a hand-edit so the committed default is the
 * secure one and this cannot reach production by being forgotten. Deploy with
 * the flag, run the migration, redeploy without it, then confirm the key is
 * Unauthorized again.
 */
const MIGRATION_MODE = process.env.AMPLIFY_DATA_MIGRATION === 'allow-api-key'
const migrationAccess = (allow: any) => (MIGRATION_MODE ? [allow.publicApiKey()] : [])

/**
 * The groups that hold teacher-level access.
 *
 * 'admin' is the IT/support group — teacher-equivalent on purpose, so Justin can
 * see and fix exactly what Melinda sees. It is a separate group rather than a
 * second member of 'teacher' so it can be revoked on its own and so the token
 * still says which one you are. app/lib/roles.ts maps both onto the same Role.
 *
 * Named STAFF rather than TEACHERS because it is no longer only her.
 */
const STAFF = ['teacher', 'admin']

/** Staff-only: administrative records no student or parent should touch. */
const teacherOnly = (allow: any) => [allow.groups(STAFF)]

/**
 * Course material: teacher authors it, any signed-in user may read it.
 * Reading a lesson is not sensitive; writing one is.
 */
const teacherWritesEveryoneReads = (allow: any) => [
  allow.groups(STAFF),
  allow.authenticated().to(['read']),
  ...migrationAccess(allow),
]

/**
 * Records tied to an individual student, readable by any signed-in user.
 *
 * NOT row-scoped: one student can read another's row. That is still far better
 * than the unauthenticated public access Gen 1 had, but it is not the end state.
 *
 * Row scoping is now UNBLOCKED but not yet applied. Both halves are done:
 * the migration normalized studentId to the Cognito sub (verified against
 * production 2026-07-28 — 63 of 63 rows), and the client derives it from one
 * place, app/lib/identity.ts.
 *
 * When tightening, the rule must be:
 *
 *     allow.ownerDefinedIn('studentId').identityClaim('sub')
 *
 * NOT the bare `ownerDefinedIn('studentId')`. Its default identity is
 * `sub::username`, which matches neither the stored value nor the ACCESS token
 * the server routes forward — access tokens carry `sub` but no
 * `cognito:username` claim (app/lib/auth.ts pins tokenUse: 'access', while the
 * browser client sends an ID token). `sub` is the only claim present in both.
 *
 * Do not apply this until a real student account has exercised the converted
 * client paths; there is currently no student in the pool to test with.
 */
const studentScoped = (allow: any) => [
  allow.groups(STAFF),
  allow.authenticated().to(['read']),
  ...migrationAccess(allow),
]

/**
 * studentScoped plus create: for rows the invite-redemption flow must write
 * while the new user is authenticated but not yet in any group.
 * profile/setup creates the student's Enrollment when their invite carries a
 * semesterId — read-only rules there would strand invited students unenrolled.
 */
const studentScopedSelfEnrolling = (allow: any) => [
  allow.groups(STAFF),
  allow.authenticated().to(['read', 'create']),
  ...migrationAccess(allow),
]

/** Records a student creates and maintains for themselves. */
const studentWritable = (allow: any) => [
  allow.groups(STAFF),
  allow.authenticated().to(['create', 'read', 'update']),
  ...migrationAccess(allow),
]

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = a.schema({
  // ── Calendar ──────────────────────────────────────────────────────────────

  AcademicYear: a
    .model({
      year: a.string().required(),
      semesters: a.hasMany('Semester', 'academicYearSemestersId'),
      quarters: a.hasMany('Quarter', 'academicYearQuartersId'),
    })
    .authorization(teacherWritesEveryoneReads),

  Semester: a
    .model({
      name: a.string().required(),
      startDate: a.string().required(),
      endDate: a.string().required(),
      isActive: a.boolean(),
      // Explicit in Gen 1 via @belongsTo(fields: ["courseId"]) — this is the
      // populated one. Gen 1 ALSO generated `courseSemestersId` from the
      // Course.semesters hasMany, which is null in every row. Dropped here.
      courseId: a.id(),
      course: a.belongsTo('Course', 'courseId'),
      academicYearSemestersId: a.id(),
      academicYear: a.belongsTo('AcademicYear', 'academicYearSemestersId'),
      enrollments: a.hasMany('Enrollment', 'semesterEnrollmentsId'),
      weeklyPlans: a.hasMany('WeeklyPlan', 'semesterWeeklyPlansId'),
      lessonWeightPercent: a.integer(),
      testWeightPercent: a.integer(),
      quizWeightPercent: a.integer(),
      gradeA: a.integer(),
      gradeB: a.integer(),
      gradeC: a.integer(),
      gradeD: a.integer(),
      semesterType: a.string(),
    })
    .authorization(teacherWritesEveryoneReads),

  Quarter: a
    .model({
      name: a.string().required(),
      startDate: a.string().required(),
      endDate: a.string().required(),
      order: a.integer().required(),
      academicYearQuartersId: a.id(),
      academicYear: a.belongsTo('AcademicYear', 'academicYearQuartersId'),
    })
    .authorization(teacherWritesEveryoneReads),

  // ── Course material ───────────────────────────────────────────────────────

  Course: a
    .model({
      title: a.string().required(),
      description: a.string(),
      gradeLevel: a.string(),
      isArchived: a.boolean(),
      lessons: a.hasMany('Lesson', 'courseLessonsId'),
      assignments: a.hasMany('Assignment', 'courseAssignmentsId'),
      enrollments: a.hasMany('Enrollment', 'courseEnrollmentsId'),
      weeklyPlans: a.hasMany('WeeklyPlan', 'courseWeeklyPlansId'),
      lessonTemplates: a.hasMany('LessonTemplate', 'courseLessonTemplatesId'),
      semesters: a.hasMany('Semester', 'courseId'),
    })
    .authorization(teacherWritesEveryoneReads),

  Lesson: a
    .model({
      title: a.string().required(),
      videoUrl: a.string(),
      instructions: a.string(),
      order: a.integer(),
      isPublished: a.boolean(),
      courseLessonsId: a.id(),
      course: a.belongsTo('Course', 'courseLessonsId'),
      weeklyPlanItems: a.hasMany('WeeklyPlanItem', 'lessonWeeklyPlanItemsId'),
    })
    .authorization(teacherWritesEveryoneReads),

  LessonTemplate: a
    .model({
      lessonNumber: a.integer().required(),
      title: a.string().required(),
      instructions: a.string(),
      teachingNotes: a.string(),
      worksheetUrl: a.string(),
      videoUrl: a.string(),
      assignmentType: a.string(),
      lessonCategory: a.string(),
      isArchived: a.boolean(),
      courseLessonTemplatesId: a.id(),
      course: a.belongsTo('Course', 'courseLessonTemplatesId'),
      questions: a.hasMany('AssignmentQuestion', 'lessonTemplateQuestionsId'),
    })
    .authorization(teacherWritesEveryoneReads),

  AssignmentQuestion: a
    .model({
      order: a.integer().required(),
      questionText: a.string().required(),
      questionType: a.string().required(),
      choices: a.string(),
      // The answer key. Students must be able to read the QUESTION but not this.
      // Confirmed readable by a real student token before this rule existed —
      // listAssignmentQuestions returned "x = 2" for a live rational-equation
      // question. Field-level rules override the model's, so this narrows to
      // teacher-only while the rest of the model stays readable.
      correctAnswer: a.string().authorization(allow => [allow.groups(STAFF)]),
      diagramKey: a.string(),
      diagramSpec: a.string(),
      lessonTemplateQuestionsId: a.id(),
      lessonTemplate: a.belongsTo('LessonTemplate', 'lessonTemplateQuestionsId'),
    })
    .authorization(teacherWritesEveryoneReads),

  // ── Weekly planning ───────────────────────────────────────────────────────

  WeeklyPlan: a
    .model({
      weekStartDate: a.string().required(),
      assignedStudentIds: a.string(),
      // Declared in Gen 1 but null in every row — plans are linked to a course,
      // never to a semester. Kept so existing queries don't break; safe to drop
      // once app code stops selecting it.
      semesterWeeklyPlansId: a.id(),
      semester: a.belongsTo('Semester', 'semesterWeeklyPlansId'),
      courseWeeklyPlansId: a.id(),
      course: a.belongsTo('Course', 'courseWeeklyPlansId'),
      items: a.hasMany('WeeklyPlanItem', 'weeklyPlanItemsId'),
    })
    .authorization(teacherWritesEveryoneReads),

  WeeklyPlanItem: a
    .model({
      dayOfWeek: a.string().required(),
      dueTime: a.string(),
      isPublished: a.boolean(),
      // In-class (participation) day — typically Friday. Present students get
      // bulk credit from /teacher/participation instead of submitting; grading
      // views count this item in the Participation bucket, not Lessons.
      isInClass: a.boolean(),
      lessonWeeklyPlanItemsId: a.id(),
      lesson: a.belongsTo('Lesson', 'lessonWeeklyPlanItemsId'),
      // Plain scalar in Gen 1, not a modelled relationship. Left as-is.
      lessonTemplateId: a.id(),
      weeklyPlanItemsId: a.id(),
      weeklyPlan: a.belongsTo('WeeklyPlan', 'weeklyPlanItemsId'),
      assignments: a.hasMany('Assignment', 'weeklyPlanItemAssignmentsId'),
      zoomJoinUrl: a.string(),
      zoomMeetingId: a.string(),
      zoomStartTime: a.string(),
    })
    .authorization(teacherWritesEveryoneReads),

  Assignment: a
    .model({
      title: a.string().required(),
      description: a.string(),
      dueDate: a.string(),
      courseAssignmentsId: a.id(),
      course: a.belongsTo('Course', 'courseAssignmentsId'),
      weeklyPlanItemAssignmentsId: a.id(),
      weeklyPlanItem: a.belongsTo('WeeklyPlanItem', 'weeklyPlanItemAssignmentsId'),
      submissions: a.hasMany('Submission', 'assignmentSubmissionsId'),
    })
    .authorization(teacherWritesEveryoneReads),

  // ── Student work ──────────────────────────────────────────────────────────

  Submission: a
    .model({
      // Holds the student's Cognito sub. Gen 1 stored an email here; the
      // migration normalized it, and app/lib/identity.ts is now the only place
      // the client derives it. See studentScoped above.
      studentId: a.string().required(),
      content: a.string(),
      answers: a.string(),
      imageUrls: a.string(),
      lessonTemplateId: a.string(),
      grade: a.string(),
      submittedAt: a.string(),
      teacherComment: a.string(),
      isArchived: a.boolean(),
      archivedAt: a.string(),
      status: a.string(),
      returnReason: a.string(),
      returnDueDate: a.string(),
      assignmentSubmissionsId: a.id(),
      assignment: a.belongsTo('Assignment', 'assignmentSubmissionsId'),
      messages: a.hasMany('SubmissionMessage', 'submissionMessagesId'),
    })
    // Students must be able to turn work in and read it back; parents to see it.
    // authenticated() rather than group('student') — see the note at the top.
    .authorization(studentWritable),

  SubmissionMessage: a
    .model({
      senderId: a.string().required(),
      senderType: a.string().required(),
      message: a.string().required(),
      isRead: a.boolean(),
      submissionMessagesId: a.id(),
      submission: a.belongsTo('Submission', 'submissionMessagesId'),
    })
    .authorization(studentWritable),

  VideoWatch: a
    .model({
      studentId: a.string().required(),
      lessonId: a.string().required(),
      weeklyPlanItemId: a.string(),
      watchedSeconds: a.float(),
      durationSeconds: a.float(),
      percentWatched: a.float(),
      completed: a.boolean(),
      lastWatchedAt: a.string(),
    })
    .authorization(studentWritable),

  Enrollment: a
    .model({
      // Holds a Cognito sub, as every studentId does now.
      studentId: a.string().required(),
      planType: a.string(),
      courseEnrollmentsId: a.id(),
      course: a.belongsTo('Course', 'courseEnrollmentsId'),
      semesterEnrollmentsId: a.id(),
      semester: a.belongsTo('Semester', 'semesterEnrollmentsId'),
    })
    .authorization(studentScopedSelfEnrolling),

  // ── People ────────────────────────────────────────────────────────────────

  StudentProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      preferredName: a.string(),
      gradeLevel: a.string(),
      courseId: a.string(),
      planType: a.string(),
      profilePictureKey: a.string(),
      status: a.string(),
      statusReason: a.string(),
      parentEmail: a.string(),
      parentName: a.string(),
      parentEmail2: a.string(),
      parentName2: a.string(),
      enrolledAt: a.string(),
      archivedAt: a.string(),
      parentLinks: a.hasMany('ParentStudentLink', 'studentProfileId'),
    })
    // Self-setup at /profile/setup requires a student to create their own row
    // BEFORE any group is assigned, so this must be authenticated(), not a group.
    .authorization(studentWritable),

  TeacherProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      displayName: a.string(),
      bio: a.string(),
      profilePictureKey: a.string(),
      teachingVoice: a.string(),
    })
    .authorization(allow => [
      allow.groups(STAFF),
      // Students and parents see her name and photo in the nav.
      allow.authenticated().to(['read']),
      ...migrationAccess(allow),
    ]),

  ParentProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      studentLinks: a.hasMany('ParentStudentLink', 'parentProfileId'),
    })
    // create must be authenticated(), NOT group('parent'): the accept flow in
    // app/parent/accept/[token] creates this row BEFORE calling
    // /api/add-to-group, so the caller is not yet in the parent group. Requiring
    // the group here would deadlock every parent signup.
    .authorization(allow => [
      allow.groups(STAFF),
      allow.authenticated().to(['create', 'read', 'update']),
      ...migrationAccess(allow),
    ]),

  ParentStudentLink: a
    .model({
      // Gen 1 declared explicit FKs — @belongsTo(fields: ["parentProfileId"]) —
      // AND separately generated implicit hasMany keys
      // (parentProfileStudentLinksId etc). The EXPLICIT pair is what the model
      // actually meant, so it is what Gen 2 uses; the implicit pair was an
      // artifact. Safe to settle now: the table has zero rows.
      parentProfileId: a.id().required(),
      parentProfile: a.belongsTo('ParentProfile', 'parentProfileId'),
      studentProfileId: a.id().required(),
      studentProfile: a.belongsTo('StudentProfile', 'studentProfileId'),
    })
    .authorization(allow => [
      allow.groups(STAFF),
      allow.group('parent').to(['read']),
      ...migrationAccess(allow),
    ]),

  // ── Invites ───────────────────────────────────────────────────────────────

  StudentInvite: a
    .model({
      token: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.string().required(),
      courseId: a.string(),
      courseTitle: a.string(),
      semesterId: a.string(),
      planType: a.string().required(),
      parentFirstName: a.string(),
      parentLastName: a.string(),
      parentEmail: a.string(),
      used: a.boolean(),
    })
    // Redeemed before the user has an account, so this cannot require auth.
    // Knowledge of the token is the credential — keep tokens long and random,
    // and prefer redeeming through a server route over exposing list access.
    //
    // Three grants cover the redemption sequence, and guest() alone is NOT
    // enough: guest maps to the identity pool's unauthenticated role, and the
    // referenced pool has unauthenticated identities disabled — so that rule is
    // unreachable in production (both invite pages died Unauthorized until
    // apiKey/authenticated were added; observed 2026-08-03, Melinda's first
    // end-to-end test).
    //   - publicApiKey READ: the signed-out invite page showing "you're invited"
    //     before signup. Read-only on purpose — Gen 1 allowed public update.
    //   - authenticated read/UPDATE: the just-signed-up user (in no group yet)
    //     marking their invite used from profile/setup.
    .authorization(allow => [
      allow.groups(STAFF),
      allow.guest().to(['read', 'update']),
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read', 'update']),
      ...migrationAccess(allow),
    ]),

  ParentInvite: a
    .model({
      token: a.string().required(),
      studentEmail: a.string().required(),
      studentName: a.string().required(),
      used: a.boolean(),
      parentEmail: a.string(),
      parentFirstName: a.string(),
      parentLastName: a.string(),
    })
    // Same redemption sequence and same dead-guest problem as StudentInvite
    // above — see that model's comment for why all three grants are needed.
    .authorization(allow => [
      allow.groups(STAFF),
      allow.guest().to(['read', 'update']),
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read', 'update']),
      ...migrationAccess(allow),
    ]),

  ParentStudent: a
    .model({
      parentId: a.string().required(),
      studentEmail: a.string().required(),
      studentName: a.string().required(),
    })
    // Same ordering problem as ParentProfile — the accept flow creates this
    // link first, and /api/add-to-group then reads it back to decide whether
    // the caller has earned the parent group. Both must work pre-group.
    .authorization(allow => [
      allow.groups(STAFF),
      allow.authenticated().to(['create', 'read']),
      ...migrationAccess(allow),
    ]),

  // ── Communication ─────────────────────────────────────────────────────────

  Message: a
    .model({
      studentId: a.string().required(),
      studentName: a.string(),
      content: a.string().required(),
      sentAt: a.string().required(),
      isRead: a.boolean(),
      teacherReply: a.string(),
      repliedAt: a.string(),
      isArchivedByTeacher: a.boolean(),
      isDeletedByStudent: a.boolean(),
      isTeacherInitiated: a.boolean(),
    })
    .authorization(studentWritable),

  Announcement: a
    .model({
      subject: a.string().required(),
      message: a.string().required(),
      sentAt: a.string().required(),
      recipientIds: a.string().required(),
      recipientCount: a.integer(),
      courseId: a.string(),
      courseTitle: a.string(),
    })
    .authorization(teacherWritesEveryoneReads),

  ZoomMeeting: a
    .model({
      topic: a.string().required(),
      zoomMeetingId: a.string(),
      joinUrl: a.string().required(),
      // Host credential — whoever holds it can START the meeting as Melinda.
      // Students and parents need joinUrl; they must never see this one.
      // Confirmed readable by a student token before this rule existed.
      startUrl: a.string().authorization(allow => [allow.groups(STAFF)]),
      startTime: a.string().required(),
      durationMinutes: a.integer().required(),
      inviteeType: a.string().required(),
      courseId: a.string(),
      courseTitle: a.string(),
      studentIds: a.string(),
      parentId: a.string(),
      notes: a.string(),
    })
    // startUrl is a host credential — anyone holding it can start the meeting as
    // Melinda. Should become a field-level teacher-only rule; see bottom note.
    .authorization(studentScoped),

  // ── Reporting ─────────────────────────────────────────────────────────────

  Syllabus: a
    .model({
      semesterId: a.id().required(),
      courseId: a.id().required(),
      pdfKey: a.string(),
      publishedPdfKey: a.string(),
      publishedAt: a.string(),
    })
    .authorization(teacherWritesEveryoneReads),

  ReportCardRecord: a
    .model({
      studentId: a.string().required(),
      semesterId: a.string().required(),
      quarterId: a.string(),
      studentName: a.string().required(),
      courseName: a.string().required(),
      semesterName: a.string().required(),
      reportTitle: a.string().required(),
      finalLetter: a.string(),
      weightedAvg: a.float(),
      comment: a.string(),
      sentAt: a.string().required(),
      recipientEmails: a.string(),
      quarterBreakdown: a.string(),
    })
    .authorization(studentScoped),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    // The whole point of the migration: authenticated by default, no public key.
    defaultAuthorizationMode: 'userPool',
    // NOTE: apiKey remains configured ONLY because the invite-redemption flow
    // above uses allow.guest(). Once redemption moves behind a server route,
    // delete this block entirely.
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
})

/**
 * ─── Known gaps, deliberately left for follow-up ────────────────────────────
 *
 * 1. ROW-LEVEL SCOPING. Rules here are still group-level: any signed-in student
 *    can read any other student's submissions and profile. Both prerequisites
 *    are now met — studentId holds a Cognito sub everywhere, and the client
 *    derives it only via app/lib/identity.ts — so this is ready to apply on
 *    Submission, Message, VideoWatch and Enrollment. See the studentScoped note
 *    above for the exact rule, including why `.identityClaim('sub')` is
 *    required rather than optional.
 *
 *    NOT ReportCardRecord: its studentId holds a StudentProfile row id, not a
 *    sub, so an owner rule there would match nobody. It is teacher-written and
 *    student-read, so it needs a different mechanism entirely.
 *    Blocked only on testing with a real student account. Close before
 *    students arrive 2026-08-28.
 *
 * 2. FIELD-LEVEL RULES. Two fields leak to readers who should not see them:
 *      - AssignmentQuestion.correctAnswer (the answer key)
 *      - ZoomMeeting.startUrl (host credential)
 *    Both need per-field authorization rather than model-level.
 *
 * 3. PARENT SCOPING. Parents currently read broadly rather than only their own
 *    children's records. Depends on (1).
 *
 * 4. GUEST INVITE ACCESS. StudentInvite and ParentInvite allow guest read/update
 *    so tokens can be redeemed pre-signup. Prefer moving redemption into a
 *    server route and removing guest access altogether.
 */
