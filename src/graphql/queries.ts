/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAcademicYear = /* GraphQL */ `query GetAcademicYear($id: ID!) {
  getAcademicYear(id: $id) {
    createdAt
    id
    quarters {
      nextToken
      __typename
    }
    semesters {
      nextToken
      __typename
    }
    updatedAt
    year
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAcademicYearQueryVariables,
  APITypes.GetAcademicYearQuery
>;
export const getAnnouncement = /* GraphQL */ `query GetAnnouncement($id: ID!) {
  getAnnouncement(id: $id) {
    courseId
    courseTitle
    createdAt
    id
    message
    recipientCount
    recipientIds
    sentAt
    subject
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAnnouncementQueryVariables,
  APITypes.GetAnnouncementQuery
>;
export const getAssignment = /* GraphQL */ `query GetAssignment($id: ID!) {
  getAssignment(id: $id) {
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseAssignmentsId
    createdAt
    description
    dueDate
    id
    submissions {
      nextToken
      __typename
    }
    title
    updatedAt
    weeklyPlanItem {
      createdAt
      dayOfWeek
      dueTime
      id
      isPublished
      lessonTemplateId
      lessonWeeklyPlanItemsId
      updatedAt
      weeklyPlanItemsId
      zoomJoinUrl
      zoomMeetingId
      zoomStartTime
      __typename
    }
    weeklyPlanItemAssignmentsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAssignmentQueryVariables,
  APITypes.GetAssignmentQuery
>;
export const getAssignmentQuestion = /* GraphQL */ `query GetAssignmentQuestion($id: ID!) {
  getAssignmentQuestion(id: $id) {
    choices
    correctAnswer
    createdAt
    diagramKey
    diagramSpec
    id
    lessonTemplate {
      assignmentType
      courseLessonTemplatesId
      createdAt
      id
      instructions
      isArchived
      lessonCategory
      lessonNumber
      teachingNotes
      title
      updatedAt
      videoUrl
      worksheetUrl
      __typename
    }
    lessonTemplateQuestionsId
    order
    questionText
    questionType
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAssignmentQuestionQueryVariables,
  APITypes.GetAssignmentQuestionQuery
>;
export const getCourse = /* GraphQL */ `query GetCourse($id: ID!) {
  getCourse(id: $id) {
    assignments {
      nextToken
      __typename
    }
    createdAt
    description
    enrollments {
      nextToken
      __typename
    }
    gradeLevel
    id
    isArchived
    lessonTemplates {
      nextToken
      __typename
    }
    lessons {
      nextToken
      __typename
    }
    semesters {
      nextToken
      __typename
    }
    title
    updatedAt
    weeklyPlans {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.GetCourseQueryVariables, APITypes.GetCourseQuery>;
export const getEnrollment = /* GraphQL */ `query GetEnrollment($id: ID!) {
  getEnrollment(id: $id) {
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseEnrollmentsId
    createdAt
    id
    planType
    semester {
      academicYearSemestersId
      courseId
      createdAt
      endDate
      gradeA
      gradeB
      gradeC
      gradeD
      id
      isActive
      lessonWeightPercent
      name
      quizWeightPercent
      semesterType
      startDate
      testWeightPercent
      updatedAt
      __typename
    }
    semesterEnrollmentsId
    studentId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetEnrollmentQueryVariables,
  APITypes.GetEnrollmentQuery
>;
export const getLesson = /* GraphQL */ `query GetLesson($id: ID!) {
  getLesson(id: $id) {
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseLessonsId
    createdAt
    id
    instructions
    isPublished
    order
    title
    updatedAt
    videoUrl
    weeklyPlanItems {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.GetLessonQueryVariables, APITypes.GetLessonQuery>;
export const getLessonTemplate = /* GraphQL */ `query GetLessonTemplate($id: ID!) {
  getLessonTemplate(id: $id) {
    assignmentType
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseLessonTemplatesId
    createdAt
    id
    instructions
    isArchived
    lessonCategory
    lessonNumber
    questions {
      nextToken
      __typename
    }
    teachingNotes
    title
    updatedAt
    videoUrl
    worksheetUrl
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetLessonTemplateQueryVariables,
  APITypes.GetLessonTemplateQuery
>;
export const getMessage = /* GraphQL */ `query GetMessage($id: ID!) {
  getMessage(id: $id) {
    content
    createdAt
    id
    isArchivedByTeacher
    isDeletedByStudent
    isRead
    isTeacherInitiated
    repliedAt
    sentAt
    studentId
    studentName
    teacherReply
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMessageQueryVariables,
  APITypes.GetMessageQuery
>;
export const getParentInvite = /* GraphQL */ `query GetParentInvite($id: ID!) {
  getParentInvite(id: $id) {
    createdAt
    id
    parentEmail
    parentFirstName
    parentLastName
    studentEmail
    studentName
    token
    updatedAt
    used
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentInviteQueryVariables,
  APITypes.GetParentInviteQuery
>;
export const getParentProfile = /* GraphQL */ `query GetParentProfile($id: ID!) {
  getParentProfile(id: $id) {
    createdAt
    email
    firstName
    id
    lastName
    studentLinks {
      nextToken
      __typename
    }
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentProfileQueryVariables,
  APITypes.GetParentProfileQuery
>;
export const getParentStudent = /* GraphQL */ `query GetParentStudent($id: ID!) {
  getParentStudent(id: $id) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentStudentQueryVariables,
  APITypes.GetParentStudentQuery
>;
export const getParentStudentLink = /* GraphQL */ `query GetParentStudentLink($id: ID!) {
  getParentStudentLink(id: $id) {
    createdAt
    id
    parentProfile {
      createdAt
      email
      firstName
      id
      lastName
      updatedAt
      userId
      __typename
    }
    parentProfileId
    studentProfile {
      archivedAt
      courseId
      createdAt
      email
      enrolledAt
      firstName
      gradeLevel
      id
      lastName
      parentEmail
      parentEmail2
      parentName
      parentName2
      planType
      preferredName
      profilePictureKey
      status
      statusReason
      updatedAt
      userId
      __typename
    }
    studentProfileId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentStudentLinkQueryVariables,
  APITypes.GetParentStudentLinkQuery
>;
export const getQuarter = /* GraphQL */ `query GetQuarter($id: ID!) {
  getQuarter(id: $id) {
    academicYear {
      createdAt
      id
      updatedAt
      year
      __typename
    }
    academicYearQuartersId
    createdAt
    endDate
    id
    name
    order
    startDate
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetQuarterQueryVariables,
  APITypes.GetQuarterQuery
>;
export const getReportCardRecord = /* GraphQL */ `query GetReportCardRecord($id: ID!) {
  getReportCardRecord(id: $id) {
    comment
    courseName
    createdAt
    finalLetter
    id
    quarterBreakdown
    quarterId
    recipientEmails
    reportTitle
    semesterId
    semesterName
    sentAt
    studentId
    studentName
    updatedAt
    weightedAvg
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetReportCardRecordQueryVariables,
  APITypes.GetReportCardRecordQuery
>;
export const getSemester = /* GraphQL */ `query GetSemester($id: ID!) {
  getSemester(id: $id) {
    academicYear {
      createdAt
      id
      updatedAt
      year
      __typename
    }
    academicYearSemestersId
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseId
    createdAt
    endDate
    enrollments {
      nextToken
      __typename
    }
    gradeA
    gradeB
    gradeC
    gradeD
    id
    isActive
    lessonWeightPercent
    name
    quizWeightPercent
    semesterType
    startDate
    testWeightPercent
    updatedAt
    weeklyPlans {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSemesterQueryVariables,
  APITypes.GetSemesterQuery
>;
export const getStudentInvite = /* GraphQL */ `query GetStudentInvite($id: ID!) {
  getStudentInvite(id: $id) {
    courseId
    courseTitle
    createdAt
    email
    firstName
    id
    lastName
    parentEmail
    parentFirstName
    parentLastName
    planType
    semesterId
    token
    updatedAt
    used
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetStudentInviteQueryVariables,
  APITypes.GetStudentInviteQuery
>;
export const getStudentProfile = /* GraphQL */ `query GetStudentProfile($id: ID!) {
  getStudentProfile(id: $id) {
    archivedAt
    courseId
    createdAt
    email
    enrolledAt
    firstName
    gradeLevel
    id
    lastName
    parentEmail
    parentEmail2
    parentLinks {
      nextToken
      __typename
    }
    parentName
    parentName2
    planType
    preferredName
    profilePictureKey
    status
    statusReason
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetStudentProfileQueryVariables,
  APITypes.GetStudentProfileQuery
>;
export const getSubmission = /* GraphQL */ `query GetSubmission($id: ID!) {
  getSubmission(id: $id) {
    answers
    archivedAt
    assignment {
      courseAssignmentsId
      createdAt
      description
      dueDate
      id
      title
      updatedAt
      weeklyPlanItemAssignmentsId
      __typename
    }
    assignmentSubmissionsId
    content
    createdAt
    grade
    id
    imageUrls
    isArchived
    lessonTemplateId
    messages {
      nextToken
      __typename
    }
    returnDueDate
    returnReason
    status
    studentId
    submittedAt
    teacherComment
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSubmissionQueryVariables,
  APITypes.GetSubmissionQuery
>;
export const getSubmissionMessage = /* GraphQL */ `query GetSubmissionMessage($id: ID!) {
  getSubmissionMessage(id: $id) {
    createdAt
    id
    isRead
    message
    senderId
    senderType
    submission {
      answers
      archivedAt
      assignmentSubmissionsId
      content
      createdAt
      grade
      id
      imageUrls
      isArchived
      lessonTemplateId
      returnDueDate
      returnReason
      status
      studentId
      submittedAt
      teacherComment
      updatedAt
      __typename
    }
    submissionMessagesId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSubmissionMessageQueryVariables,
  APITypes.GetSubmissionMessageQuery
>;
export const getSyllabus = /* GraphQL */ `query GetSyllabus($id: ID!) {
  getSyllabus(id: $id) {
    courseId
    createdAt
    id
    pdfKey
    publishedAt
    publishedPdfKey
    semesterId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSyllabusQueryVariables,
  APITypes.GetSyllabusQuery
>;
export const getTeacherProfile = /* GraphQL */ `query GetTeacherProfile($id: ID!) {
  getTeacherProfile(id: $id) {
    bio
    createdAt
    displayName
    email
    id
    profilePictureKey
    teachingVoice
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTeacherProfileQueryVariables,
  APITypes.GetTeacherProfileQuery
>;
export const getVideoWatch = /* GraphQL */ `query GetVideoWatch($id: ID!) {
  getVideoWatch(id: $id) {
    completed
    createdAt
    durationSeconds
    id
    lastWatchedAt
    lessonId
    percentWatched
    studentId
    updatedAt
    watchedSeconds
    weeklyPlanItemId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetVideoWatchQueryVariables,
  APITypes.GetVideoWatchQuery
>;
export const getWeeklyPlan = /* GraphQL */ `query GetWeeklyPlan($id: ID!) {
  getWeeklyPlan(id: $id) {
    assignedStudentIds
    course {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    courseWeeklyPlansId
    createdAt
    id
    items {
      nextToken
      __typename
    }
    semester {
      academicYearSemestersId
      courseId
      createdAt
      endDate
      gradeA
      gradeB
      gradeC
      gradeD
      id
      isActive
      lessonWeightPercent
      name
      quizWeightPercent
      semesterType
      startDate
      testWeightPercent
      updatedAt
      __typename
    }
    semesterWeeklyPlansId
    updatedAt
    weekStartDate
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWeeklyPlanQueryVariables,
  APITypes.GetWeeklyPlanQuery
>;
export const getWeeklyPlanItem = /* GraphQL */ `query GetWeeklyPlanItem($id: ID!) {
  getWeeklyPlanItem(id: $id) {
    assignments {
      nextToken
      __typename
    }
    createdAt
    dayOfWeek
    dueTime
    id
    isPublished
    lesson {
      courseLessonsId
      createdAt
      id
      instructions
      isPublished
      order
      title
      updatedAt
      videoUrl
      __typename
    }
    lessonTemplateId
    lessonWeeklyPlanItemsId
    updatedAt
    weeklyPlan {
      assignedStudentIds
      courseWeeklyPlansId
      createdAt
      id
      semesterWeeklyPlansId
      updatedAt
      weekStartDate
      __typename
    }
    weeklyPlanItemsId
    zoomJoinUrl
    zoomMeetingId
    zoomStartTime
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWeeklyPlanItemQueryVariables,
  APITypes.GetWeeklyPlanItemQuery
>;
export const getZoomMeeting = /* GraphQL */ `query GetZoomMeeting($id: ID!) {
  getZoomMeeting(id: $id) {
    courseId
    courseTitle
    createdAt
    durationMinutes
    id
    inviteeType
    joinUrl
    notes
    parentId
    startTime
    startUrl
    studentIds
    topic
    updatedAt
    zoomMeetingId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetZoomMeetingQueryVariables,
  APITypes.GetZoomMeetingQuery
>;
export const listAcademicYears = /* GraphQL */ `query ListAcademicYears(
  $filter: ModelAcademicYearFilterInput
  $limit: Int
  $nextToken: String
) {
  listAcademicYears(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      updatedAt
      year
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAcademicYearsQueryVariables,
  APITypes.ListAcademicYearsQuery
>;
export const listAnnouncements = /* GraphQL */ `query ListAnnouncements(
  $filter: ModelAnnouncementFilterInput
  $limit: Int
  $nextToken: String
) {
  listAnnouncements(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseId
      courseTitle
      createdAt
      id
      message
      recipientCount
      recipientIds
      sentAt
      subject
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAnnouncementsQueryVariables,
  APITypes.ListAnnouncementsQuery
>;
export const listAssignmentQuestions = /* GraphQL */ `query ListAssignmentQuestions(
  $filter: ModelAssignmentQuestionFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssignmentQuestions(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      choices
      correctAnswer
      createdAt
      diagramKey
      diagramSpec
      id
      lessonTemplateQuestionsId
      order
      questionText
      questionType
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssignmentQuestionsQueryVariables,
  APITypes.ListAssignmentQuestionsQuery
>;
export const listAssignments = /* GraphQL */ `query ListAssignments(
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssignments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseAssignmentsId
      createdAt
      description
      dueDate
      id
      title
      updatedAt
      weeklyPlanItemAssignmentsId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssignmentsQueryVariables,
  APITypes.ListAssignmentsQuery
>;
export const listCourses = /* GraphQL */ `query ListCourses(
  $filter: ModelCourseFilterInput
  $limit: Int
  $nextToken: String
) {
  listCourses(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      description
      gradeLevel
      id
      isArchived
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCoursesQueryVariables,
  APITypes.ListCoursesQuery
>;
export const listEnrollments = /* GraphQL */ `query ListEnrollments(
  $filter: ModelEnrollmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listEnrollments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseEnrollmentsId
      createdAt
      id
      planType
      semesterEnrollmentsId
      studentId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListEnrollmentsQueryVariables,
  APITypes.ListEnrollmentsQuery
>;
export const listLessonTemplates = /* GraphQL */ `query ListLessonTemplates(
  $filter: ModelLessonTemplateFilterInput
  $limit: Int
  $nextToken: String
) {
  listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      assignmentType
      courseLessonTemplatesId
      createdAt
      id
      instructions
      isArchived
      lessonCategory
      lessonNumber
      teachingNotes
      title
      updatedAt
      videoUrl
      worksheetUrl
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLessonTemplatesQueryVariables,
  APITypes.ListLessonTemplatesQuery
>;
export const listLessons = /* GraphQL */ `query ListLessons(
  $filter: ModelLessonFilterInput
  $limit: Int
  $nextToken: String
) {
  listLessons(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseLessonsId
      createdAt
      id
      instructions
      isPublished
      order
      title
      updatedAt
      videoUrl
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLessonsQueryVariables,
  APITypes.ListLessonsQuery
>;
export const listMessages = /* GraphQL */ `query ListMessages(
  $filter: ModelMessageFilterInput
  $limit: Int
  $nextToken: String
) {
  listMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      content
      createdAt
      id
      isArchivedByTeacher
      isDeletedByStudent
      isRead
      isTeacherInitiated
      repliedAt
      sentAt
      studentId
      studentName
      teacherReply
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMessagesQueryVariables,
  APITypes.ListMessagesQuery
>;
export const listParentInvites = /* GraphQL */ `query ListParentInvites(
  $filter: ModelParentInviteFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentInvites(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      parentEmail
      parentFirstName
      parentLastName
      studentEmail
      studentName
      token
      updatedAt
      used
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListParentInvitesQueryVariables,
  APITypes.ListParentInvitesQuery
>;
export const listParentProfiles = /* GraphQL */ `query ListParentProfiles(
  $filter: ModelParentProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      email
      firstName
      id
      lastName
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListParentProfilesQueryVariables,
  APITypes.ListParentProfilesQuery
>;
export const listParentStudentLinks = /* GraphQL */ `query ListParentStudentLinks(
  $filter: ModelParentStudentLinkFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentStudentLinks(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      parentProfileId
      studentProfileId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListParentStudentLinksQueryVariables,
  APITypes.ListParentStudentLinksQuery
>;
export const listParentStudents = /* GraphQL */ `query ListParentStudents(
  $filter: ModelParentStudentFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentStudents(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      parentId
      studentEmail
      studentName
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListParentStudentsQueryVariables,
  APITypes.ListParentStudentsQuery
>;
export const listQuarters = /* GraphQL */ `query ListQuarters(
  $filter: ModelQuarterFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuarters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      academicYearQuartersId
      createdAt
      endDate
      id
      name
      order
      startDate
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuartersQueryVariables,
  APITypes.ListQuartersQuery
>;
export const listReportCardRecords = /* GraphQL */ `query ListReportCardRecords(
  $filter: ModelReportCardRecordFilterInput
  $limit: Int
  $nextToken: String
) {
  listReportCardRecords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      comment
      courseName
      createdAt
      finalLetter
      id
      quarterBreakdown
      quarterId
      recipientEmails
      reportTitle
      semesterId
      semesterName
      sentAt
      studentId
      studentName
      updatedAt
      weightedAvg
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListReportCardRecordsQueryVariables,
  APITypes.ListReportCardRecordsQuery
>;
export const listSemesters = /* GraphQL */ `query ListSemesters(
  $filter: ModelSemesterFilterInput
  $limit: Int
  $nextToken: String
) {
  listSemesters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      academicYearSemestersId
      courseId
      createdAt
      endDate
      gradeA
      gradeB
      gradeC
      gradeD
      id
      isActive
      lessonWeightPercent
      name
      quizWeightPercent
      semesterType
      startDate
      testWeightPercent
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSemestersQueryVariables,
  APITypes.ListSemestersQuery
>;
export const listStudentInvites = /* GraphQL */ `query ListStudentInvites(
  $filter: ModelStudentInviteFilterInput
  $limit: Int
  $nextToken: String
) {
  listStudentInvites(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseId
      courseTitle
      createdAt
      email
      firstName
      id
      lastName
      parentEmail
      parentFirstName
      parentLastName
      planType
      semesterId
      token
      updatedAt
      used
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListStudentInvitesQueryVariables,
  APITypes.ListStudentInvitesQuery
>;
export const listStudentProfiles = /* GraphQL */ `query ListStudentProfiles(
  $filter: ModelStudentProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listStudentProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      archivedAt
      courseId
      createdAt
      email
      enrolledAt
      firstName
      gradeLevel
      id
      lastName
      parentEmail
      parentEmail2
      parentName
      parentName2
      planType
      preferredName
      profilePictureKey
      status
      statusReason
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListStudentProfilesQueryVariables,
  APITypes.ListStudentProfilesQuery
>;
export const listSubmissionMessages = /* GraphQL */ `query ListSubmissionMessages(
  $filter: ModelSubmissionMessageFilterInput
  $limit: Int
  $nextToken: String
) {
  listSubmissionMessages(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      isRead
      message
      senderId
      senderType
      submissionMessagesId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSubmissionMessagesQueryVariables,
  APITypes.ListSubmissionMessagesQuery
>;
export const listSubmissions = /* GraphQL */ `query ListSubmissions(
  $filter: ModelSubmissionFilterInput
  $limit: Int
  $nextToken: String
) {
  listSubmissions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      answers
      archivedAt
      assignmentSubmissionsId
      content
      createdAt
      grade
      id
      imageUrls
      isArchived
      lessonTemplateId
      returnDueDate
      returnReason
      status
      studentId
      submittedAt
      teacherComment
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSubmissionsQueryVariables,
  APITypes.ListSubmissionsQuery
>;
export const listSyllabi = /* GraphQL */ `query ListSyllabi(
  $filter: ModelSyllabusFilterInput
  $limit: Int
  $nextToken: String
) {
  listSyllabi(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseId
      createdAt
      id
      pdfKey
      publishedAt
      publishedPdfKey
      semesterId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSyllabiQueryVariables,
  APITypes.ListSyllabiQuery
>;
export const listTeacherProfiles = /* GraphQL */ `query ListTeacherProfiles(
  $filter: ModelTeacherProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listTeacherProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      bio
      createdAt
      displayName
      email
      id
      profilePictureKey
      teachingVoice
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTeacherProfilesQueryVariables,
  APITypes.ListTeacherProfilesQuery
>;
export const listVideoWatches = /* GraphQL */ `query ListVideoWatches(
  $filter: ModelVideoWatchFilterInput
  $limit: Int
  $nextToken: String
) {
  listVideoWatches(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      completed
      createdAt
      durationSeconds
      id
      lastWatchedAt
      lessonId
      percentWatched
      studentId
      updatedAt
      watchedSeconds
      weeklyPlanItemId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListVideoWatchesQueryVariables,
  APITypes.ListVideoWatchesQuery
>;
export const listWeeklyPlanItems = /* GraphQL */ `query ListWeeklyPlanItems(
  $filter: ModelWeeklyPlanItemFilterInput
  $limit: Int
  $nextToken: String
) {
  listWeeklyPlanItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      dayOfWeek
      dueTime
      id
      isPublished
      lessonTemplateId
      lessonWeeklyPlanItemsId
      updatedAt
      weeklyPlanItemsId
      zoomJoinUrl
      zoomMeetingId
      zoomStartTime
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWeeklyPlanItemsQueryVariables,
  APITypes.ListWeeklyPlanItemsQuery
>;
export const listWeeklyPlans = /* GraphQL */ `query ListWeeklyPlans(
  $filter: ModelWeeklyPlanFilterInput
  $limit: Int
  $nextToken: String
) {
  listWeeklyPlans(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      assignedStudentIds
      courseWeeklyPlansId
      createdAt
      id
      semesterWeeklyPlansId
      updatedAt
      weekStartDate
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWeeklyPlansQueryVariables,
  APITypes.ListWeeklyPlansQuery
>;
export const listZoomMeetings = /* GraphQL */ `query ListZoomMeetings(
  $filter: ModelZoomMeetingFilterInput
  $limit: Int
  $nextToken: String
) {
  listZoomMeetings(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      courseId
      courseTitle
      createdAt
      durationMinutes
      id
      inviteeType
      joinUrl
      notes
      parentId
      startTime
      startUrl
      studentIds
      topic
      updatedAt
      zoomMeetingId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListZoomMeetingsQueryVariables,
  APITypes.ListZoomMeetingsQuery
>;
