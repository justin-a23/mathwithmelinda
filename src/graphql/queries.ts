/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAcademicYear = /* GraphQL */ `query GetAcademicYear($id: ID!) {
  getAcademicYear(id: $id) {
    id
    year
    semesters {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAcademicYearQueryVariables,
  APITypes.GetAcademicYearQuery
>;
export const listAcademicYears = /* GraphQL */ `query ListAcademicYears(
  $filter: ModelAcademicYearFilterInput
  $limit: Int
  $nextToken: String
) {
  listAcademicYears(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      year
      createdAt
      updatedAt
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
export const getSemester = /* GraphQL */ `query GetSemester($id: ID!) {
  getSemester(id: $id) {
    id
    name
    startDate
    endDate
    isActive
    courseId
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    academicYear {
      id
      year
      createdAt
      updatedAt
      __typename
    }
    enrollments {
      nextToken
      __typename
    }
    weeklyPlans {
      nextToken
      __typename
    }
    lessonWeightPercent
    testWeightPercent
    quizWeightPercent
    gradeA
    gradeB
    gradeC
    gradeD
    semesterType
    createdAt
    updatedAt
    academicYearSemestersId
    courseSemestersId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSemesterQueryVariables,
  APITypes.GetSemesterQuery
>;
export const listSemesters = /* GraphQL */ `query ListSemesters(
  $filter: ModelSemesterFilterInput
  $limit: Int
  $nextToken: String
) {
  listSemesters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      startDate
      endDate
      isActive
      courseId
      lessonWeightPercent
      testWeightPercent
      quizWeightPercent
      gradeA
      gradeB
      gradeC
      gradeD
      semesterType
      createdAt
      updatedAt
      academicYearSemestersId
      courseSemestersId
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
export const getStudentInvite = /* GraphQL */ `query GetStudentInvite($id: ID!) {
  getStudentInvite(id: $id) {
    id
    token
    firstName
    lastName
    email
    courseId
    courseTitle
    semesterId
    planType
    parentFirstName
    parentLastName
    parentEmail
    used
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetStudentInviteQueryVariables,
  APITypes.GetStudentInviteQuery
>;
export const listStudentInvites = /* GraphQL */ `query ListStudentInvites(
  $filter: ModelStudentInviteFilterInput
  $limit: Int
  $nextToken: String
) {
  listStudentInvites(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      token
      firstName
      lastName
      email
      courseId
      courseTitle
      semesterId
      planType
      parentFirstName
      parentLastName
      parentEmail
      used
      createdAt
      updatedAt
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
export const getCourse = /* GraphQL */ `query GetCourse($id: ID!) {
  getCourse(id: $id) {
    id
    title
    description
    gradeLevel
    isArchived
    lessons {
      nextToken
      __typename
    }
    assignments {
      nextToken
      __typename
    }
    enrollments {
      nextToken
      __typename
    }
    weeklyPlans {
      nextToken
      __typename
    }
    lessonTemplates {
      nextToken
      __typename
    }
    semesters {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetCourseQueryVariables, APITypes.GetCourseQuery>;
export const listCourses = /* GraphQL */ `query ListCourses(
  $filter: ModelCourseFilterInput
  $limit: Int
  $nextToken: String
) {
  listCourses(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
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
export const getLesson = /* GraphQL */ `query GetLesson($id: ID!) {
  getLesson(id: $id) {
    id
    title
    videoUrl
    instructions
    order
    isPublished
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    weeklyPlanItems {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    courseLessonsId
    __typename
  }
}
` as GeneratedQuery<APITypes.GetLessonQueryVariables, APITypes.GetLessonQuery>;
export const listLessons = /* GraphQL */ `query ListLessons(
  $filter: ModelLessonFilterInput
  $limit: Int
  $nextToken: String
) {
  listLessons(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      videoUrl
      instructions
      order
      isPublished
      createdAt
      updatedAt
      courseLessonsId
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
export const getWeeklyPlan = /* GraphQL */ `query GetWeeklyPlan($id: ID!) {
  getWeeklyPlan(id: $id) {
    id
    weekStartDate
    assignedStudentIds
    semester {
      id
      name
      startDate
      endDate
      isActive
      courseId
      lessonWeightPercent
      testWeightPercent
      quizWeightPercent
      gradeA
      gradeB
      gradeC
      gradeD
      semesterType
      createdAt
      updatedAt
      academicYearSemestersId
      courseSemestersId
      __typename
    }
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    items {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    semesterWeeklyPlansId
    courseWeeklyPlansId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWeeklyPlanQueryVariables,
  APITypes.GetWeeklyPlanQuery
>;
export const listWeeklyPlans = /* GraphQL */ `query ListWeeklyPlans(
  $filter: ModelWeeklyPlanFilterInput
  $limit: Int
  $nextToken: String
) {
  listWeeklyPlans(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      weekStartDate
      assignedStudentIds
      createdAt
      updatedAt
      semesterWeeklyPlansId
      courseWeeklyPlansId
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
export const getWeeklyPlanItem = /* GraphQL */ `query GetWeeklyPlanItem($id: ID!) {
  getWeeklyPlanItem(id: $id) {
    id
    dayOfWeek
    dueTime
    isPublished
    lesson {
      id
      title
      videoUrl
      instructions
      order
      isPublished
      createdAt
      updatedAt
      courseLessonsId
      __typename
    }
    lessonTemplateId
    weeklyPlan {
      id
      weekStartDate
      assignedStudentIds
      createdAt
      updatedAt
      semesterWeeklyPlansId
      courseWeeklyPlansId
      __typename
    }
    assignments {
      nextToken
      __typename
    }
    zoomJoinUrl
    zoomMeetingId
    zoomStartTime
    createdAt
    updatedAt
    lessonWeeklyPlanItemsId
    weeklyPlanItemsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetWeeklyPlanItemQueryVariables,
  APITypes.GetWeeklyPlanItemQuery
>;
export const listWeeklyPlanItems = /* GraphQL */ `query ListWeeklyPlanItems(
  $filter: ModelWeeklyPlanItemFilterInput
  $limit: Int
  $nextToken: String
) {
  listWeeklyPlanItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      dayOfWeek
      dueTime
      isPublished
      lessonTemplateId
      zoomJoinUrl
      zoomMeetingId
      zoomStartTime
      createdAt
      updatedAt
      lessonWeeklyPlanItemsId
      weeklyPlanItemsId
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
export const getAssignment = /* GraphQL */ `query GetAssignment($id: ID!) {
  getAssignment(id: $id) {
    id
    title
    description
    dueDate
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    submissions {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    courseAssignmentsId
    weeklyPlanItemAssignmentsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAssignmentQueryVariables,
  APITypes.GetAssignmentQuery
>;
export const listAssignments = /* GraphQL */ `query ListAssignments(
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssignments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      dueDate
      createdAt
      updatedAt
      courseAssignmentsId
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
export const getSubmission = /* GraphQL */ `query GetSubmission($id: ID!) {
  getSubmission(id: $id) {
    id
    studentId
    content
    answers
    imageUrls
    lessonTemplateId
    grade
    submittedAt
    teacherComment
    isArchived
    archivedAt
    status
    returnReason
    returnDueDate
    assignment {
      id
      title
      description
      dueDate
      createdAt
      updatedAt
      courseAssignmentsId
      weeklyPlanItemAssignmentsId
      __typename
    }
    messages {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    assignmentSubmissionsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSubmissionQueryVariables,
  APITypes.GetSubmissionQuery
>;
export const listSubmissions = /* GraphQL */ `query ListSubmissions(
  $filter: ModelSubmissionFilterInput
  $limit: Int
  $nextToken: String
) {
  listSubmissions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      studentId
      content
      answers
      imageUrls
      lessonTemplateId
      grade
      submittedAt
      teacherComment
      isArchived
      archivedAt
      status
      returnReason
      returnDueDate
      createdAt
      updatedAt
      assignmentSubmissionsId
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
export const getSubmissionMessage = /* GraphQL */ `query GetSubmissionMessage($id: ID!) {
  getSubmissionMessage(id: $id) {
    id
    senderId
    senderType
    message
    isRead
    submission {
      id
      studentId
      content
      answers
      imageUrls
      lessonTemplateId
      grade
      submittedAt
      teacherComment
      isArchived
      archivedAt
      status
      returnReason
      returnDueDate
      createdAt
      updatedAt
      assignmentSubmissionsId
      __typename
    }
    createdAt
    updatedAt
    submissionMessagesId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSubmissionMessageQueryVariables,
  APITypes.GetSubmissionMessageQuery
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
      id
      senderId
      senderType
      message
      isRead
      createdAt
      updatedAt
      submissionMessagesId
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
export const getEnrollment = /* GraphQL */ `query GetEnrollment($id: ID!) {
  getEnrollment(id: $id) {
    id
    studentId
    planType
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    semester {
      id
      name
      startDate
      endDate
      isActive
      courseId
      lessonWeightPercent
      testWeightPercent
      quizWeightPercent
      gradeA
      gradeB
      gradeC
      gradeD
      semesterType
      createdAt
      updatedAt
      academicYearSemestersId
      courseSemestersId
      __typename
    }
    createdAt
    updatedAt
    semesterEnrollmentsId
    courseEnrollmentsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetEnrollmentQueryVariables,
  APITypes.GetEnrollmentQuery
>;
export const listEnrollments = /* GraphQL */ `query ListEnrollments(
  $filter: ModelEnrollmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listEnrollments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      studentId
      planType
      createdAt
      updatedAt
      semesterEnrollmentsId
      courseEnrollmentsId
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
export const getLessonTemplate = /* GraphQL */ `query GetLessonTemplate($id: ID!) {
  getLessonTemplate(id: $id) {
    id
    lessonNumber
    title
    instructions
    teachingNotes
    worksheetUrl
    videoUrl
    assignmentType
    lessonCategory
    course {
      id
      title
      description
      gradeLevel
      isArchived
      createdAt
      updatedAt
      __typename
    }
    questions {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    courseLessonTemplatesId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetLessonTemplateQueryVariables,
  APITypes.GetLessonTemplateQuery
>;
export const listLessonTemplates = /* GraphQL */ `query ListLessonTemplates(
  $filter: ModelLessonTemplateFilterInput
  $limit: Int
  $nextToken: String
) {
  listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      lessonNumber
      title
      instructions
      teachingNotes
      worksheetUrl
      videoUrl
      assignmentType
      lessonCategory
      createdAt
      updatedAt
      courseLessonTemplatesId
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
export const getAssignmentQuestion = /* GraphQL */ `query GetAssignmentQuestion($id: ID!) {
  getAssignmentQuestion(id: $id) {
    id
    order
    questionText
    questionType
    choices
    correctAnswer
    diagramKey
    lessonTemplate {
      id
      lessonNumber
      title
      instructions
      teachingNotes
      worksheetUrl
      videoUrl
      assignmentType
      lessonCategory
      createdAt
      updatedAt
      courseLessonTemplatesId
      __typename
    }
    createdAt
    updatedAt
    lessonTemplateQuestionsId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAssignmentQuestionQueryVariables,
  APITypes.GetAssignmentQuestionQuery
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
      id
      order
      questionText
      questionType
      choices
      correctAnswer
      diagramKey
      createdAt
      updatedAt
      lessonTemplateQuestionsId
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
export const getTeacherProfile = /* GraphQL */ `query GetTeacherProfile($id: ID!) {
  getTeacherProfile(id: $id) {
    id
    userId
    email
    displayName
    bio
    profilePictureKey
    teachingVoice
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTeacherProfileQueryVariables,
  APITypes.GetTeacherProfileQuery
>;
export const listTeacherProfiles = /* GraphQL */ `query ListTeacherProfiles(
  $filter: ModelTeacherProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listTeacherProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      email
      displayName
      bio
      profilePictureKey
      teachingVoice
      createdAt
      updatedAt
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
export const getVideoWatch = /* GraphQL */ `query GetVideoWatch($id: ID!) {
  getVideoWatch(id: $id) {
    id
    studentId
    lessonId
    weeklyPlanItemId
    watchedSeconds
    durationSeconds
    percentWatched
    completed
    lastWatchedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetVideoWatchQueryVariables,
  APITypes.GetVideoWatchQuery
>;
export const listVideoWatches = /* GraphQL */ `query ListVideoWatches(
  $filter: ModelVideoWatchFilterInput
  $limit: Int
  $nextToken: String
) {
  listVideoWatches(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      studentId
      lessonId
      weeklyPlanItemId
      watchedSeconds
      durationSeconds
      percentWatched
      completed
      lastWatchedAt
      createdAt
      updatedAt
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
export const getParentInvite = /* GraphQL */ `query GetParentInvite($id: ID!) {
  getParentInvite(id: $id) {
    id
    token
    studentEmail
    studentName
    used
    parentEmail
    parentFirstName
    parentLastName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentInviteQueryVariables,
  APITypes.GetParentInviteQuery
>;
export const listParentInvites = /* GraphQL */ `query ListParentInvites(
  $filter: ModelParentInviteFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentInvites(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      token
      studentEmail
      studentName
      used
      parentEmail
      parentFirstName
      parentLastName
      createdAt
      updatedAt
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
export const getParentStudent = /* GraphQL */ `query GetParentStudent($id: ID!) {
  getParentStudent(id: $id) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentStudentQueryVariables,
  APITypes.GetParentStudentQuery
>;
export const listParentStudents = /* GraphQL */ `query ListParentStudents(
  $filter: ModelParentStudentFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentStudents(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      parentId
      studentEmail
      studentName
      createdAt
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
export const getStudentProfile = /* GraphQL */ `query GetStudentProfile($id: ID!) {
  getStudentProfile(id: $id) {
    id
    userId
    email
    firstName
    lastName
    preferredName
    gradeLevel
    courseId
    planType
    profilePictureKey
    status
    statusReason
    parentEmail
    parentName
    parentEmail2
    parentName2
    parentLinks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetStudentProfileQueryVariables,
  APITypes.GetStudentProfileQuery
>;
export const listStudentProfiles = /* GraphQL */ `query ListStudentProfiles(
  $filter: ModelStudentProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listStudentProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      email
      firstName
      lastName
      preferredName
      gradeLevel
      courseId
      planType
      profilePictureKey
      status
      statusReason
      parentEmail
      parentName
      parentEmail2
      parentName2
      createdAt
      updatedAt
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
export const getParentProfile = /* GraphQL */ `query GetParentProfile($id: ID!) {
  getParentProfile(id: $id) {
    id
    userId
    email
    firstName
    lastName
    studentLinks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentProfileQueryVariables,
  APITypes.GetParentProfileQuery
>;
export const listParentProfiles = /* GraphQL */ `query ListParentProfiles(
  $filter: ModelParentProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listParentProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      email
      firstName
      lastName
      createdAt
      updatedAt
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
export const getParentStudentLink = /* GraphQL */ `query GetParentStudentLink($id: ID!) {
  getParentStudentLink(id: $id) {
    id
    parentProfileId
    parentProfile {
      id
      userId
      email
      firstName
      lastName
      createdAt
      updatedAt
      __typename
    }
    studentProfileId
    studentProfile {
      id
      userId
      email
      firstName
      lastName
      preferredName
      gradeLevel
      courseId
      planType
      profilePictureKey
      status
      statusReason
      parentEmail
      parentName
      parentEmail2
      parentName2
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
    studentProfileParentLinksId
    parentProfileStudentLinksId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetParentStudentLinkQueryVariables,
  APITypes.GetParentStudentLinkQuery
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
      id
      parentProfileId
      studentProfileId
      createdAt
      updatedAt
      studentProfileParentLinksId
      parentProfileStudentLinksId
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
export const getMessage = /* GraphQL */ `query GetMessage($id: ID!) {
  getMessage(id: $id) {
    id
    studentId
    studentName
    content
    sentAt
    isRead
    teacherReply
    repliedAt
    isArchivedByTeacher
    isDeletedByStudent
    isTeacherInitiated
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMessageQueryVariables,
  APITypes.GetMessageQuery
>;
export const listMessages = /* GraphQL */ `query ListMessages(
  $filter: ModelMessageFilterInput
  $limit: Int
  $nextToken: String
) {
  listMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      studentId
      studentName
      content
      sentAt
      isRead
      teacherReply
      repliedAt
      isArchivedByTeacher
      isDeletedByStudent
      isTeacherInitiated
      createdAt
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
export const getSyllabus = /* GraphQL */ `query GetSyllabus($id: ID!) {
  getSyllabus(id: $id) {
    id
    semesterId
    courseId
    pdfKey
    publishedPdfKey
    publishedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSyllabusQueryVariables,
  APITypes.GetSyllabusQuery
>;
export const listSyllabi = /* GraphQL */ `query ListSyllabi(
  $filter: ModelSyllabusFilterInput
  $limit: Int
  $nextToken: String
) {
  listSyllabi(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      semesterId
      courseId
      pdfKey
      publishedPdfKey
      publishedAt
      createdAt
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
export const getZoomMeeting = /* GraphQL */ `query GetZoomMeeting($id: ID!) {
  getZoomMeeting(id: $id) {
    id
    topic
    zoomMeetingId
    joinUrl
    startUrl
    startTime
    durationMinutes
    inviteeType
    courseId
    courseTitle
    studentIds
    parentId
    notes
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetZoomMeetingQueryVariables,
  APITypes.GetZoomMeetingQuery
>;
export const listZoomMeetings = /* GraphQL */ `query ListZoomMeetings(
  $filter: ModelZoomMeetingFilterInput
  $limit: Int
  $nextToken: String
) {
  listZoomMeetings(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      topic
      zoomMeetingId
      joinUrl
      startUrl
      startTime
      durationMinutes
      inviteeType
      courseId
      courseTitle
      studentIds
      parentId
      notes
      createdAt
      updatedAt
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
export const getAnnouncement = /* GraphQL */ `query GetAnnouncement($id: ID!) {
  getAnnouncement(id: $id) {
    id
    subject
    message
    sentAt
    recipientIds
    recipientCount
    courseId
    courseTitle
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAnnouncementQueryVariables,
  APITypes.GetAnnouncementQuery
>;
export const listAnnouncements = /* GraphQL */ `query ListAnnouncements(
  $filter: ModelAnnouncementFilterInput
  $limit: Int
  $nextToken: String
) {
  listAnnouncements(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      subject
      message
      sentAt
      recipientIds
      recipientCount
      courseId
      courseTitle
      createdAt
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
