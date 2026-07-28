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
 * Cognito groups: teacher, student, parent.
 */

// ─── Authorization shorthands ────────────────────────────────────────────────

/** Teacher-only: administrative records students never touch. */
const teacherOnly = (allow: any) => [allow.group('teacher')]

/**
 * Course material: teacher authors it, any signed-in user may read it.
 * Reading a lesson is not sensitive; writing one is.
 */
const teacherWritesEveryoneReads = (allow: any) => [
  allow.group('teacher'),
  allow.authenticated().to(['read']),
]

/**
 * Records tied to an individual student.
 *
 * NOTE: these are group-scoped, not row-scoped. Any signed-in student can
 * currently read any other student's row. That is still a vast improvement on
 * unauthenticated public access, but it is not the end state.
 *
 * Row-level scoping (allow.ownerDefinedIn('studentId')) is blocked on a data
 * problem: `studentId` holds an EMAIL on Submission but a Cognito sub on
 * Enrollment. Owner rules compare against the Cognito identity, so they would
 * match one model and silently deny the other. Normalize studentId across
 * models first, then tighten these. Tracked in TODO-APPSYNC-AUTH.md.
 */
const studentScoped = (allow: any) => [
  allow.group('teacher'),
  allow.groups(['student', 'parent']).to(['read']),
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
      // Students can read questions but must not read the answer key. Field-level
      // rules are the correct tool; see the note at the bottom of this file.
      correctAnswer: a.string(),
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
      // Holds an EMAIL, not a Cognito sub. See studentScoped above.
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
    .authorization(allow => [
      allow.group('teacher'),
      // Students must be able to turn work in, and read it back.
      allow.group('student').to(['create', 'read', 'update']),
      allow.group('parent').to(['read']),
    ]),

  SubmissionMessage: a
    .model({
      senderId: a.string().required(),
      senderType: a.string().required(),
      message: a.string().required(),
      isRead: a.boolean(),
      submissionMessagesId: a.id(),
      submission: a.belongsTo('Submission', 'submissionMessagesId'),
    })
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('student').to(['create', 'read', 'update']),
    ]),

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
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('student').to(['create', 'read', 'update']),
      allow.group('parent').to(['read']),
    ]),

  Enrollment: a
    .model({
      // Holds a Cognito sub — unlike Submission.studentId, which holds an email.
      studentId: a.string().required(),
      planType: a.string(),
      courseEnrollmentsId: a.id(),
      course: a.belongsTo('Course', 'courseEnrollmentsId'),
      semesterEnrollmentsId: a.id(),
      semester: a.belongsTo('Semester', 'semesterEnrollmentsId'),
    })
    .authorization(studentScoped),

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
      parentLinks: a.hasMany('ParentStudentLink', 'studentProfileParentLinksId'),
    })
    .authorization(allow => [
      allow.group('teacher'),
      // Self-setup at /profile/setup requires a student to create their own row.
      allow.group('student').to(['create', 'read', 'update']),
      allow.group('parent').to(['read']),
    ]),

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
      allow.group('teacher'),
      // Students and parents see her name and photo in the nav.
      allow.authenticated().to(['read']),
    ]),

  ParentProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      studentLinks: a.hasMany('ParentStudentLink', 'parentProfileStudentLinksId'),
    })
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('parent').to(['create', 'read', 'update']),
    ]),

  ParentStudentLink: a
    .model({
      // Gen 1 declared explicit parentProfileId/studentProfileId AND generated
      // implicit hasMany keys. Only the implicit pair can back the hasMany
      // relations in Gen 2, so those are authoritative here. Verify both sets
      // agree in the data before cutting over — see the migration checklist.
      parentProfileStudentLinksId: a.id(),
      parentProfile: a.belongsTo('ParentProfile', 'parentProfileStudentLinksId'),
      studentProfileParentLinksId: a.id(),
      studentProfile: a.belongsTo('StudentProfile', 'studentProfileParentLinksId'),
    })
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('parent').to(['read']),
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
    .authorization(allow => [allow.group('teacher'), allow.guest().to(['read', 'update'])]),

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
    .authorization(allow => [allow.group('teacher'), allow.guest().to(['read', 'update'])]),

  ParentStudent: a
    .model({
      parentId: a.string().required(),
      studentEmail: a.string().required(),
      studentName: a.string().required(),
    })
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('parent').to(['read']),
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
    .authorization(allow => [
      allow.group('teacher'),
      allow.group('student').to(['create', 'read', 'update']),
    ]),

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
      startUrl: a.string(),
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
    .authorization(allow => [
      allow.group('teacher'),
      allow.groups(['student', 'parent']).to(['read']),
    ]),

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
 * 1. ROW-LEVEL SCOPING. Rules here are group-level: any signed-in student can
 *    read any other student's submissions and profile. Fixing this needs
 *    allow.ownerDefinedIn('studentId'), which needs studentId to consistently
 *    hold the Cognito identity. Today it holds an email on Submission and a sub
 *    on Enrollment. Normalize first.
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
