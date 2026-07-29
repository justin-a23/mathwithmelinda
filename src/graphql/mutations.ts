/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAcademicYear = /* GraphQL */ `mutation CreateAcademicYear(
  $condition: ModelAcademicYearConditionInput
  $input: CreateAcademicYearInput!
) {
  createAcademicYear(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAcademicYearMutationVariables,
  APITypes.CreateAcademicYearMutation
>;
export const createAnnouncement = /* GraphQL */ `mutation CreateAnnouncement(
  $condition: ModelAnnouncementConditionInput
  $input: CreateAnnouncementInput!
) {
  createAnnouncement(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAnnouncementMutationVariables,
  APITypes.CreateAnnouncementMutation
>;
export const createAssignment = /* GraphQL */ `mutation CreateAssignment(
  $condition: ModelAssignmentConditionInput
  $input: CreateAssignmentInput!
) {
  createAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAssignmentMutationVariables,
  APITypes.CreateAssignmentMutation
>;
export const createAssignmentQuestion = /* GraphQL */ `mutation CreateAssignmentQuestion(
  $condition: ModelAssignmentQuestionConditionInput
  $input: CreateAssignmentQuestionInput!
) {
  createAssignmentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAssignmentQuestionMutationVariables,
  APITypes.CreateAssignmentQuestionMutation
>;
export const createCourse = /* GraphQL */ `mutation CreateCourse(
  $condition: ModelCourseConditionInput
  $input: CreateCourseInput!
) {
  createCourse(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateCourseMutationVariables,
  APITypes.CreateCourseMutation
>;
export const createEnrollment = /* GraphQL */ `mutation CreateEnrollment(
  $condition: ModelEnrollmentConditionInput
  $input: CreateEnrollmentInput!
) {
  createEnrollment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateEnrollmentMutationVariables,
  APITypes.CreateEnrollmentMutation
>;
export const createLesson = /* GraphQL */ `mutation CreateLesson(
  $condition: ModelLessonConditionInput
  $input: CreateLessonInput!
) {
  createLesson(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateLessonMutationVariables,
  APITypes.CreateLessonMutation
>;
export const createLessonTemplate = /* GraphQL */ `mutation CreateLessonTemplate(
  $condition: ModelLessonTemplateConditionInput
  $input: CreateLessonTemplateInput!
) {
  createLessonTemplate(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateLessonTemplateMutationVariables,
  APITypes.CreateLessonTemplateMutation
>;
export const createMessage = /* GraphQL */ `mutation CreateMessage(
  $condition: ModelMessageConditionInput
  $input: CreateMessageInput!
) {
  createMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateMessageMutationVariables,
  APITypes.CreateMessageMutation
>;
export const createParentInvite = /* GraphQL */ `mutation CreateParentInvite(
  $condition: ModelParentInviteConditionInput
  $input: CreateParentInviteInput!
) {
  createParentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateParentInviteMutationVariables,
  APITypes.CreateParentInviteMutation
>;
export const createParentProfile = /* GraphQL */ `mutation CreateParentProfile(
  $condition: ModelParentProfileConditionInput
  $input: CreateParentProfileInput!
) {
  createParentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateParentProfileMutationVariables,
  APITypes.CreateParentProfileMutation
>;
export const createParentStudent = /* GraphQL */ `mutation CreateParentStudent(
  $condition: ModelParentStudentConditionInput
  $input: CreateParentStudentInput!
) {
  createParentStudent(condition: $condition, input: $input) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateParentStudentMutationVariables,
  APITypes.CreateParentStudentMutation
>;
export const createParentStudentLink = /* GraphQL */ `mutation CreateParentStudentLink(
  $condition: ModelParentStudentLinkConditionInput
  $input: CreateParentStudentLinkInput!
) {
  createParentStudentLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateParentStudentLinkMutationVariables,
  APITypes.CreateParentStudentLinkMutation
>;
export const createQuarter = /* GraphQL */ `mutation CreateQuarter(
  $condition: ModelQuarterConditionInput
  $input: CreateQuarterInput!
) {
  createQuarter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateQuarterMutationVariables,
  APITypes.CreateQuarterMutation
>;
export const createReportCardRecord = /* GraphQL */ `mutation CreateReportCardRecord(
  $condition: ModelReportCardRecordConditionInput
  $input: CreateReportCardRecordInput!
) {
  createReportCardRecord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateReportCardRecordMutationVariables,
  APITypes.CreateReportCardRecordMutation
>;
export const createSemester = /* GraphQL */ `mutation CreateSemester(
  $condition: ModelSemesterConditionInput
  $input: CreateSemesterInput!
) {
  createSemester(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSemesterMutationVariables,
  APITypes.CreateSemesterMutation
>;
export const createStudentInvite = /* GraphQL */ `mutation CreateStudentInvite(
  $condition: ModelStudentInviteConditionInput
  $input: CreateStudentInviteInput!
) {
  createStudentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateStudentInviteMutationVariables,
  APITypes.CreateStudentInviteMutation
>;
export const createStudentProfile = /* GraphQL */ `mutation CreateStudentProfile(
  $condition: ModelStudentProfileConditionInput
  $input: CreateStudentProfileInput!
) {
  createStudentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateStudentProfileMutationVariables,
  APITypes.CreateStudentProfileMutation
>;
export const createSubmission = /* GraphQL */ `mutation CreateSubmission(
  $condition: ModelSubmissionConditionInput
  $input: CreateSubmissionInput!
) {
  createSubmission(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSubmissionMutationVariables,
  APITypes.CreateSubmissionMutation
>;
export const createSubmissionMessage = /* GraphQL */ `mutation CreateSubmissionMessage(
  $condition: ModelSubmissionMessageConditionInput
  $input: CreateSubmissionMessageInput!
) {
  createSubmissionMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSubmissionMessageMutationVariables,
  APITypes.CreateSubmissionMessageMutation
>;
export const createSyllabus = /* GraphQL */ `mutation CreateSyllabus(
  $condition: ModelSyllabusConditionInput
  $input: CreateSyllabusInput!
) {
  createSyllabus(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSyllabusMutationVariables,
  APITypes.CreateSyllabusMutation
>;
export const createTeacherProfile = /* GraphQL */ `mutation CreateTeacherProfile(
  $condition: ModelTeacherProfileConditionInput
  $input: CreateTeacherProfileInput!
) {
  createTeacherProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateTeacherProfileMutationVariables,
  APITypes.CreateTeacherProfileMutation
>;
export const createVideoWatch = /* GraphQL */ `mutation CreateVideoWatch(
  $condition: ModelVideoWatchConditionInput
  $input: CreateVideoWatchInput!
) {
  createVideoWatch(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateVideoWatchMutationVariables,
  APITypes.CreateVideoWatchMutation
>;
export const createWeeklyPlan = /* GraphQL */ `mutation CreateWeeklyPlan(
  $condition: ModelWeeklyPlanConditionInput
  $input: CreateWeeklyPlanInput!
) {
  createWeeklyPlan(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateWeeklyPlanMutationVariables,
  APITypes.CreateWeeklyPlanMutation
>;
export const createWeeklyPlanItem = /* GraphQL */ `mutation CreateWeeklyPlanItem(
  $condition: ModelWeeklyPlanItemConditionInput
  $input: CreateWeeklyPlanItemInput!
) {
  createWeeklyPlanItem(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateWeeklyPlanItemMutationVariables,
  APITypes.CreateWeeklyPlanItemMutation
>;
export const createZoomMeeting = /* GraphQL */ `mutation CreateZoomMeeting(
  $condition: ModelZoomMeetingConditionInput
  $input: CreateZoomMeetingInput!
) {
  createZoomMeeting(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateZoomMeetingMutationVariables,
  APITypes.CreateZoomMeetingMutation
>;
export const deleteAcademicYear = /* GraphQL */ `mutation DeleteAcademicYear(
  $condition: ModelAcademicYearConditionInput
  $input: DeleteAcademicYearInput!
) {
  deleteAcademicYear(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAcademicYearMutationVariables,
  APITypes.DeleteAcademicYearMutation
>;
export const deleteAnnouncement = /* GraphQL */ `mutation DeleteAnnouncement(
  $condition: ModelAnnouncementConditionInput
  $input: DeleteAnnouncementInput!
) {
  deleteAnnouncement(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAnnouncementMutationVariables,
  APITypes.DeleteAnnouncementMutation
>;
export const deleteAssignment = /* GraphQL */ `mutation DeleteAssignment(
  $condition: ModelAssignmentConditionInput
  $input: DeleteAssignmentInput!
) {
  deleteAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAssignmentMutationVariables,
  APITypes.DeleteAssignmentMutation
>;
export const deleteAssignmentQuestion = /* GraphQL */ `mutation DeleteAssignmentQuestion(
  $condition: ModelAssignmentQuestionConditionInput
  $input: DeleteAssignmentQuestionInput!
) {
  deleteAssignmentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAssignmentQuestionMutationVariables,
  APITypes.DeleteAssignmentQuestionMutation
>;
export const deleteCourse = /* GraphQL */ `mutation DeleteCourse(
  $condition: ModelCourseConditionInput
  $input: DeleteCourseInput!
) {
  deleteCourse(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteCourseMutationVariables,
  APITypes.DeleteCourseMutation
>;
export const deleteEnrollment = /* GraphQL */ `mutation DeleteEnrollment(
  $condition: ModelEnrollmentConditionInput
  $input: DeleteEnrollmentInput!
) {
  deleteEnrollment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteEnrollmentMutationVariables,
  APITypes.DeleteEnrollmentMutation
>;
export const deleteLesson = /* GraphQL */ `mutation DeleteLesson(
  $condition: ModelLessonConditionInput
  $input: DeleteLessonInput!
) {
  deleteLesson(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteLessonMutationVariables,
  APITypes.DeleteLessonMutation
>;
export const deleteLessonTemplate = /* GraphQL */ `mutation DeleteLessonTemplate(
  $condition: ModelLessonTemplateConditionInput
  $input: DeleteLessonTemplateInput!
) {
  deleteLessonTemplate(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteLessonTemplateMutationVariables,
  APITypes.DeleteLessonTemplateMutation
>;
export const deleteMessage = /* GraphQL */ `mutation DeleteMessage(
  $condition: ModelMessageConditionInput
  $input: DeleteMessageInput!
) {
  deleteMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteMessageMutationVariables,
  APITypes.DeleteMessageMutation
>;
export const deleteParentInvite = /* GraphQL */ `mutation DeleteParentInvite(
  $condition: ModelParentInviteConditionInput
  $input: DeleteParentInviteInput!
) {
  deleteParentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteParentInviteMutationVariables,
  APITypes.DeleteParentInviteMutation
>;
export const deleteParentProfile = /* GraphQL */ `mutation DeleteParentProfile(
  $condition: ModelParentProfileConditionInput
  $input: DeleteParentProfileInput!
) {
  deleteParentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteParentProfileMutationVariables,
  APITypes.DeleteParentProfileMutation
>;
export const deleteParentStudent = /* GraphQL */ `mutation DeleteParentStudent(
  $condition: ModelParentStudentConditionInput
  $input: DeleteParentStudentInput!
) {
  deleteParentStudent(condition: $condition, input: $input) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteParentStudentMutationVariables,
  APITypes.DeleteParentStudentMutation
>;
export const deleteParentStudentLink = /* GraphQL */ `mutation DeleteParentStudentLink(
  $condition: ModelParentStudentLinkConditionInput
  $input: DeleteParentStudentLinkInput!
) {
  deleteParentStudentLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteParentStudentLinkMutationVariables,
  APITypes.DeleteParentStudentLinkMutation
>;
export const deleteQuarter = /* GraphQL */ `mutation DeleteQuarter(
  $condition: ModelQuarterConditionInput
  $input: DeleteQuarterInput!
) {
  deleteQuarter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteQuarterMutationVariables,
  APITypes.DeleteQuarterMutation
>;
export const deleteReportCardRecord = /* GraphQL */ `mutation DeleteReportCardRecord(
  $condition: ModelReportCardRecordConditionInput
  $input: DeleteReportCardRecordInput!
) {
  deleteReportCardRecord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteReportCardRecordMutationVariables,
  APITypes.DeleteReportCardRecordMutation
>;
export const deleteSemester = /* GraphQL */ `mutation DeleteSemester(
  $condition: ModelSemesterConditionInput
  $input: DeleteSemesterInput!
) {
  deleteSemester(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSemesterMutationVariables,
  APITypes.DeleteSemesterMutation
>;
export const deleteStudentInvite = /* GraphQL */ `mutation DeleteStudentInvite(
  $condition: ModelStudentInviteConditionInput
  $input: DeleteStudentInviteInput!
) {
  deleteStudentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteStudentInviteMutationVariables,
  APITypes.DeleteStudentInviteMutation
>;
export const deleteStudentProfile = /* GraphQL */ `mutation DeleteStudentProfile(
  $condition: ModelStudentProfileConditionInput
  $input: DeleteStudentProfileInput!
) {
  deleteStudentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteStudentProfileMutationVariables,
  APITypes.DeleteStudentProfileMutation
>;
export const deleteSubmission = /* GraphQL */ `mutation DeleteSubmission(
  $condition: ModelSubmissionConditionInput
  $input: DeleteSubmissionInput!
) {
  deleteSubmission(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSubmissionMutationVariables,
  APITypes.DeleteSubmissionMutation
>;
export const deleteSubmissionMessage = /* GraphQL */ `mutation DeleteSubmissionMessage(
  $condition: ModelSubmissionMessageConditionInput
  $input: DeleteSubmissionMessageInput!
) {
  deleteSubmissionMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSubmissionMessageMutationVariables,
  APITypes.DeleteSubmissionMessageMutation
>;
export const deleteSyllabus = /* GraphQL */ `mutation DeleteSyllabus(
  $condition: ModelSyllabusConditionInput
  $input: DeleteSyllabusInput!
) {
  deleteSyllabus(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSyllabusMutationVariables,
  APITypes.DeleteSyllabusMutation
>;
export const deleteTeacherProfile = /* GraphQL */ `mutation DeleteTeacherProfile(
  $condition: ModelTeacherProfileConditionInput
  $input: DeleteTeacherProfileInput!
) {
  deleteTeacherProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteTeacherProfileMutationVariables,
  APITypes.DeleteTeacherProfileMutation
>;
export const deleteVideoWatch = /* GraphQL */ `mutation DeleteVideoWatch(
  $condition: ModelVideoWatchConditionInput
  $input: DeleteVideoWatchInput!
) {
  deleteVideoWatch(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteVideoWatchMutationVariables,
  APITypes.DeleteVideoWatchMutation
>;
export const deleteWeeklyPlan = /* GraphQL */ `mutation DeleteWeeklyPlan(
  $condition: ModelWeeklyPlanConditionInput
  $input: DeleteWeeklyPlanInput!
) {
  deleteWeeklyPlan(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteWeeklyPlanMutationVariables,
  APITypes.DeleteWeeklyPlanMutation
>;
export const deleteWeeklyPlanItem = /* GraphQL */ `mutation DeleteWeeklyPlanItem(
  $condition: ModelWeeklyPlanItemConditionInput
  $input: DeleteWeeklyPlanItemInput!
) {
  deleteWeeklyPlanItem(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteWeeklyPlanItemMutationVariables,
  APITypes.DeleteWeeklyPlanItemMutation
>;
export const deleteZoomMeeting = /* GraphQL */ `mutation DeleteZoomMeeting(
  $condition: ModelZoomMeetingConditionInput
  $input: DeleteZoomMeetingInput!
) {
  deleteZoomMeeting(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteZoomMeetingMutationVariables,
  APITypes.DeleteZoomMeetingMutation
>;
export const updateAcademicYear = /* GraphQL */ `mutation UpdateAcademicYear(
  $condition: ModelAcademicYearConditionInput
  $input: UpdateAcademicYearInput!
) {
  updateAcademicYear(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAcademicYearMutationVariables,
  APITypes.UpdateAcademicYearMutation
>;
export const updateAnnouncement = /* GraphQL */ `mutation UpdateAnnouncement(
  $condition: ModelAnnouncementConditionInput
  $input: UpdateAnnouncementInput!
) {
  updateAnnouncement(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAnnouncementMutationVariables,
  APITypes.UpdateAnnouncementMutation
>;
export const updateAssignment = /* GraphQL */ `mutation UpdateAssignment(
  $condition: ModelAssignmentConditionInput
  $input: UpdateAssignmentInput!
) {
  updateAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAssignmentMutationVariables,
  APITypes.UpdateAssignmentMutation
>;
export const updateAssignmentQuestion = /* GraphQL */ `mutation UpdateAssignmentQuestion(
  $condition: ModelAssignmentQuestionConditionInput
  $input: UpdateAssignmentQuestionInput!
) {
  updateAssignmentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAssignmentQuestionMutationVariables,
  APITypes.UpdateAssignmentQuestionMutation
>;
export const updateCourse = /* GraphQL */ `mutation UpdateCourse(
  $condition: ModelCourseConditionInput
  $input: UpdateCourseInput!
) {
  updateCourse(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateCourseMutationVariables,
  APITypes.UpdateCourseMutation
>;
export const updateEnrollment = /* GraphQL */ `mutation UpdateEnrollment(
  $condition: ModelEnrollmentConditionInput
  $input: UpdateEnrollmentInput!
) {
  updateEnrollment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateEnrollmentMutationVariables,
  APITypes.UpdateEnrollmentMutation
>;
export const updateLesson = /* GraphQL */ `mutation UpdateLesson(
  $condition: ModelLessonConditionInput
  $input: UpdateLessonInput!
) {
  updateLesson(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateLessonMutationVariables,
  APITypes.UpdateLessonMutation
>;
export const updateLessonTemplate = /* GraphQL */ `mutation UpdateLessonTemplate(
  $condition: ModelLessonTemplateConditionInput
  $input: UpdateLessonTemplateInput!
) {
  updateLessonTemplate(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateLessonTemplateMutationVariables,
  APITypes.UpdateLessonTemplateMutation
>;
export const updateMessage = /* GraphQL */ `mutation UpdateMessage(
  $condition: ModelMessageConditionInput
  $input: UpdateMessageInput!
) {
  updateMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateMessageMutationVariables,
  APITypes.UpdateMessageMutation
>;
export const updateParentInvite = /* GraphQL */ `mutation UpdateParentInvite(
  $condition: ModelParentInviteConditionInput
  $input: UpdateParentInviteInput!
) {
  updateParentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateParentInviteMutationVariables,
  APITypes.UpdateParentInviteMutation
>;
export const updateParentProfile = /* GraphQL */ `mutation UpdateParentProfile(
  $condition: ModelParentProfileConditionInput
  $input: UpdateParentProfileInput!
) {
  updateParentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateParentProfileMutationVariables,
  APITypes.UpdateParentProfileMutation
>;
export const updateParentStudent = /* GraphQL */ `mutation UpdateParentStudent(
  $condition: ModelParentStudentConditionInput
  $input: UpdateParentStudentInput!
) {
  updateParentStudent(condition: $condition, input: $input) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateParentStudentMutationVariables,
  APITypes.UpdateParentStudentMutation
>;
export const updateParentStudentLink = /* GraphQL */ `mutation UpdateParentStudentLink(
  $condition: ModelParentStudentLinkConditionInput
  $input: UpdateParentStudentLinkInput!
) {
  updateParentStudentLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateParentStudentLinkMutationVariables,
  APITypes.UpdateParentStudentLinkMutation
>;
export const updateQuarter = /* GraphQL */ `mutation UpdateQuarter(
  $condition: ModelQuarterConditionInput
  $input: UpdateQuarterInput!
) {
  updateQuarter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateQuarterMutationVariables,
  APITypes.UpdateQuarterMutation
>;
export const updateReportCardRecord = /* GraphQL */ `mutation UpdateReportCardRecord(
  $condition: ModelReportCardRecordConditionInput
  $input: UpdateReportCardRecordInput!
) {
  updateReportCardRecord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateReportCardRecordMutationVariables,
  APITypes.UpdateReportCardRecordMutation
>;
export const updateSemester = /* GraphQL */ `mutation UpdateSemester(
  $condition: ModelSemesterConditionInput
  $input: UpdateSemesterInput!
) {
  updateSemester(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSemesterMutationVariables,
  APITypes.UpdateSemesterMutation
>;
export const updateStudentInvite = /* GraphQL */ `mutation UpdateStudentInvite(
  $condition: ModelStudentInviteConditionInput
  $input: UpdateStudentInviteInput!
) {
  updateStudentInvite(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateStudentInviteMutationVariables,
  APITypes.UpdateStudentInviteMutation
>;
export const updateStudentProfile = /* GraphQL */ `mutation UpdateStudentProfile(
  $condition: ModelStudentProfileConditionInput
  $input: UpdateStudentProfileInput!
) {
  updateStudentProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateStudentProfileMutationVariables,
  APITypes.UpdateStudentProfileMutation
>;
export const updateSubmission = /* GraphQL */ `mutation UpdateSubmission(
  $condition: ModelSubmissionConditionInput
  $input: UpdateSubmissionInput!
) {
  updateSubmission(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSubmissionMutationVariables,
  APITypes.UpdateSubmissionMutation
>;
export const updateSubmissionMessage = /* GraphQL */ `mutation UpdateSubmissionMessage(
  $condition: ModelSubmissionMessageConditionInput
  $input: UpdateSubmissionMessageInput!
) {
  updateSubmissionMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSubmissionMessageMutationVariables,
  APITypes.UpdateSubmissionMessageMutation
>;
export const updateSyllabus = /* GraphQL */ `mutation UpdateSyllabus(
  $condition: ModelSyllabusConditionInput
  $input: UpdateSyllabusInput!
) {
  updateSyllabus(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSyllabusMutationVariables,
  APITypes.UpdateSyllabusMutation
>;
export const updateTeacherProfile = /* GraphQL */ `mutation UpdateTeacherProfile(
  $condition: ModelTeacherProfileConditionInput
  $input: UpdateTeacherProfileInput!
) {
  updateTeacherProfile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateTeacherProfileMutationVariables,
  APITypes.UpdateTeacherProfileMutation
>;
export const updateVideoWatch = /* GraphQL */ `mutation UpdateVideoWatch(
  $condition: ModelVideoWatchConditionInput
  $input: UpdateVideoWatchInput!
) {
  updateVideoWatch(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateVideoWatchMutationVariables,
  APITypes.UpdateVideoWatchMutation
>;
export const updateWeeklyPlan = /* GraphQL */ `mutation UpdateWeeklyPlan(
  $condition: ModelWeeklyPlanConditionInput
  $input: UpdateWeeklyPlanInput!
) {
  updateWeeklyPlan(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateWeeklyPlanMutationVariables,
  APITypes.UpdateWeeklyPlanMutation
>;
export const updateWeeklyPlanItem = /* GraphQL */ `mutation UpdateWeeklyPlanItem(
  $condition: ModelWeeklyPlanItemConditionInput
  $input: UpdateWeeklyPlanItemInput!
) {
  updateWeeklyPlanItem(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateWeeklyPlanItemMutationVariables,
  APITypes.UpdateWeeklyPlanItemMutation
>;
export const updateZoomMeeting = /* GraphQL */ `mutation UpdateZoomMeeting(
  $condition: ModelZoomMeetingConditionInput
  $input: UpdateZoomMeetingInput!
) {
  updateZoomMeeting(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateZoomMeetingMutationVariables,
  APITypes.UpdateZoomMeetingMutation
>;
