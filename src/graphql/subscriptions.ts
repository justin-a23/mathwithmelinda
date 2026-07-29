/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAcademicYear = /* GraphQL */ `subscription OnCreateAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onCreateAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAcademicYearSubscriptionVariables,
  APITypes.OnCreateAcademicYearSubscription
>;
export const onCreateAnnouncement = /* GraphQL */ `subscription OnCreateAnnouncement(
  $filter: ModelSubscriptionAnnouncementFilterInput
) {
  onCreateAnnouncement(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAnnouncementSubscriptionVariables,
  APITypes.OnCreateAnnouncementSubscription
>;
export const onCreateAssignment = /* GraphQL */ `subscription OnCreateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onCreateAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentSubscriptionVariables,
  APITypes.OnCreateAssignmentSubscription
>;
export const onCreateAssignmentQuestion = /* GraphQL */ `subscription OnCreateAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onCreateAssignmentQuestion(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentQuestionSubscriptionVariables,
  APITypes.OnCreateAssignmentQuestionSubscription
>;
export const onCreateCourse = /* GraphQL */ `subscription OnCreateCourse($filter: ModelSubscriptionCourseFilterInput) {
  onCreateCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateCourseSubscriptionVariables,
  APITypes.OnCreateCourseSubscription
>;
export const onCreateEnrollment = /* GraphQL */ `subscription OnCreateEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onCreateEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateEnrollmentSubscriptionVariables,
  APITypes.OnCreateEnrollmentSubscription
>;
export const onCreateLesson = /* GraphQL */ `subscription OnCreateLesson($filter: ModelSubscriptionLessonFilterInput) {
  onCreateLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateLessonSubscriptionVariables,
  APITypes.OnCreateLessonSubscription
>;
export const onCreateLessonTemplate = /* GraphQL */ `subscription OnCreateLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onCreateLessonTemplate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateLessonTemplateSubscriptionVariables,
  APITypes.OnCreateLessonTemplateSubscription
>;
export const onCreateMessage = /* GraphQL */ `subscription OnCreateMessage($filter: ModelSubscriptionMessageFilterInput) {
  onCreateMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMessageSubscriptionVariables,
  APITypes.OnCreateMessageSubscription
>;
export const onCreateParentInvite = /* GraphQL */ `subscription OnCreateParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onCreateParentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateParentInviteSubscriptionVariables,
  APITypes.OnCreateParentInviteSubscription
>;
export const onCreateParentProfile = /* GraphQL */ `subscription OnCreateParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onCreateParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateParentProfileSubscriptionVariables,
  APITypes.OnCreateParentProfileSubscription
>;
export const onCreateParentStudent = /* GraphQL */ `subscription OnCreateParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onCreateParentStudent(filter: $filter) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateParentStudentSubscriptionVariables,
  APITypes.OnCreateParentStudentSubscription
>;
export const onCreateParentStudentLink = /* GraphQL */ `subscription OnCreateParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onCreateParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateParentStudentLinkSubscriptionVariables,
  APITypes.OnCreateParentStudentLinkSubscription
>;
export const onCreateQuarter = /* GraphQL */ `subscription OnCreateQuarter($filter: ModelSubscriptionQuarterFilterInput) {
  onCreateQuarter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateQuarterSubscriptionVariables,
  APITypes.OnCreateQuarterSubscription
>;
export const onCreateReportCardRecord = /* GraphQL */ `subscription OnCreateReportCardRecord(
  $filter: ModelSubscriptionReportCardRecordFilterInput
) {
  onCreateReportCardRecord(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateReportCardRecordSubscriptionVariables,
  APITypes.OnCreateReportCardRecordSubscription
>;
export const onCreateSemester = /* GraphQL */ `subscription OnCreateSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onCreateSemester(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSemesterSubscriptionVariables,
  APITypes.OnCreateSemesterSubscription
>;
export const onCreateStudentInvite = /* GraphQL */ `subscription OnCreateStudentInvite(
  $filter: ModelSubscriptionStudentInviteFilterInput
) {
  onCreateStudentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateStudentInviteSubscriptionVariables,
  APITypes.OnCreateStudentInviteSubscription
>;
export const onCreateStudentProfile = /* GraphQL */ `subscription OnCreateStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onCreateStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateStudentProfileSubscriptionVariables,
  APITypes.OnCreateStudentProfileSubscription
>;
export const onCreateSubmission = /* GraphQL */ `subscription OnCreateSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onCreateSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSubmissionSubscriptionVariables,
  APITypes.OnCreateSubmissionSubscription
>;
export const onCreateSubmissionMessage = /* GraphQL */ `subscription OnCreateSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onCreateSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSubmissionMessageSubscriptionVariables,
  APITypes.OnCreateSubmissionMessageSubscription
>;
export const onCreateSyllabus = /* GraphQL */ `subscription OnCreateSyllabus($filter: ModelSubscriptionSyllabusFilterInput) {
  onCreateSyllabus(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSyllabusSubscriptionVariables,
  APITypes.OnCreateSyllabusSubscription
>;
export const onCreateTeacherProfile = /* GraphQL */ `subscription OnCreateTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onCreateTeacherProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTeacherProfileSubscriptionVariables,
  APITypes.OnCreateTeacherProfileSubscription
>;
export const onCreateVideoWatch = /* GraphQL */ `subscription OnCreateVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onCreateVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateVideoWatchSubscriptionVariables,
  APITypes.OnCreateVideoWatchSubscription
>;
export const onCreateWeeklyPlan = /* GraphQL */ `subscription OnCreateWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onCreateWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateWeeklyPlanSubscriptionVariables,
  APITypes.OnCreateWeeklyPlanSubscription
>;
export const onCreateWeeklyPlanItem = /* GraphQL */ `subscription OnCreateWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onCreateWeeklyPlanItem(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateWeeklyPlanItemSubscriptionVariables,
  APITypes.OnCreateWeeklyPlanItemSubscription
>;
export const onCreateZoomMeeting = /* GraphQL */ `subscription OnCreateZoomMeeting(
  $filter: ModelSubscriptionZoomMeetingFilterInput
) {
  onCreateZoomMeeting(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateZoomMeetingSubscriptionVariables,
  APITypes.OnCreateZoomMeetingSubscription
>;
export const onDeleteAcademicYear = /* GraphQL */ `subscription OnDeleteAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onDeleteAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAcademicYearSubscriptionVariables,
  APITypes.OnDeleteAcademicYearSubscription
>;
export const onDeleteAnnouncement = /* GraphQL */ `subscription OnDeleteAnnouncement(
  $filter: ModelSubscriptionAnnouncementFilterInput
) {
  onDeleteAnnouncement(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAnnouncementSubscriptionVariables,
  APITypes.OnDeleteAnnouncementSubscription
>;
export const onDeleteAssignment = /* GraphQL */ `subscription OnDeleteAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onDeleteAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentSubscriptionVariables,
  APITypes.OnDeleteAssignmentSubscription
>;
export const onDeleteAssignmentQuestion = /* GraphQL */ `subscription OnDeleteAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onDeleteAssignmentQuestion(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentQuestionSubscriptionVariables,
  APITypes.OnDeleteAssignmentQuestionSubscription
>;
export const onDeleteCourse = /* GraphQL */ `subscription OnDeleteCourse($filter: ModelSubscriptionCourseFilterInput) {
  onDeleteCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteCourseSubscriptionVariables,
  APITypes.OnDeleteCourseSubscription
>;
export const onDeleteEnrollment = /* GraphQL */ `subscription OnDeleteEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onDeleteEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteEnrollmentSubscriptionVariables,
  APITypes.OnDeleteEnrollmentSubscription
>;
export const onDeleteLesson = /* GraphQL */ `subscription OnDeleteLesson($filter: ModelSubscriptionLessonFilterInput) {
  onDeleteLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteLessonSubscriptionVariables,
  APITypes.OnDeleteLessonSubscription
>;
export const onDeleteLessonTemplate = /* GraphQL */ `subscription OnDeleteLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onDeleteLessonTemplate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteLessonTemplateSubscriptionVariables,
  APITypes.OnDeleteLessonTemplateSubscription
>;
export const onDeleteMessage = /* GraphQL */ `subscription OnDeleteMessage($filter: ModelSubscriptionMessageFilterInput) {
  onDeleteMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMessageSubscriptionVariables,
  APITypes.OnDeleteMessageSubscription
>;
export const onDeleteParentInvite = /* GraphQL */ `subscription OnDeleteParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onDeleteParentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteParentInviteSubscriptionVariables,
  APITypes.OnDeleteParentInviteSubscription
>;
export const onDeleteParentProfile = /* GraphQL */ `subscription OnDeleteParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onDeleteParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteParentProfileSubscriptionVariables,
  APITypes.OnDeleteParentProfileSubscription
>;
export const onDeleteParentStudent = /* GraphQL */ `subscription OnDeleteParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onDeleteParentStudent(filter: $filter) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteParentStudentSubscriptionVariables,
  APITypes.OnDeleteParentStudentSubscription
>;
export const onDeleteParentStudentLink = /* GraphQL */ `subscription OnDeleteParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onDeleteParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteParentStudentLinkSubscriptionVariables,
  APITypes.OnDeleteParentStudentLinkSubscription
>;
export const onDeleteQuarter = /* GraphQL */ `subscription OnDeleteQuarter($filter: ModelSubscriptionQuarterFilterInput) {
  onDeleteQuarter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuarterSubscriptionVariables,
  APITypes.OnDeleteQuarterSubscription
>;
export const onDeleteReportCardRecord = /* GraphQL */ `subscription OnDeleteReportCardRecord(
  $filter: ModelSubscriptionReportCardRecordFilterInput
) {
  onDeleteReportCardRecord(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteReportCardRecordSubscriptionVariables,
  APITypes.OnDeleteReportCardRecordSubscription
>;
export const onDeleteSemester = /* GraphQL */ `subscription OnDeleteSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onDeleteSemester(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSemesterSubscriptionVariables,
  APITypes.OnDeleteSemesterSubscription
>;
export const onDeleteStudentInvite = /* GraphQL */ `subscription OnDeleteStudentInvite(
  $filter: ModelSubscriptionStudentInviteFilterInput
) {
  onDeleteStudentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteStudentInviteSubscriptionVariables,
  APITypes.OnDeleteStudentInviteSubscription
>;
export const onDeleteStudentProfile = /* GraphQL */ `subscription OnDeleteStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onDeleteStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteStudentProfileSubscriptionVariables,
  APITypes.OnDeleteStudentProfileSubscription
>;
export const onDeleteSubmission = /* GraphQL */ `subscription OnDeleteSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onDeleteSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSubmissionSubscriptionVariables,
  APITypes.OnDeleteSubmissionSubscription
>;
export const onDeleteSubmissionMessage = /* GraphQL */ `subscription OnDeleteSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onDeleteSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSubmissionMessageSubscriptionVariables,
  APITypes.OnDeleteSubmissionMessageSubscription
>;
export const onDeleteSyllabus = /* GraphQL */ `subscription OnDeleteSyllabus($filter: ModelSubscriptionSyllabusFilterInput) {
  onDeleteSyllabus(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSyllabusSubscriptionVariables,
  APITypes.OnDeleteSyllabusSubscription
>;
export const onDeleteTeacherProfile = /* GraphQL */ `subscription OnDeleteTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onDeleteTeacherProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTeacherProfileSubscriptionVariables,
  APITypes.OnDeleteTeacherProfileSubscription
>;
export const onDeleteVideoWatch = /* GraphQL */ `subscription OnDeleteVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onDeleteVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteVideoWatchSubscriptionVariables,
  APITypes.OnDeleteVideoWatchSubscription
>;
export const onDeleteWeeklyPlan = /* GraphQL */ `subscription OnDeleteWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onDeleteWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteWeeklyPlanSubscriptionVariables,
  APITypes.OnDeleteWeeklyPlanSubscription
>;
export const onDeleteWeeklyPlanItem = /* GraphQL */ `subscription OnDeleteWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onDeleteWeeklyPlanItem(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteWeeklyPlanItemSubscriptionVariables,
  APITypes.OnDeleteWeeklyPlanItemSubscription
>;
export const onDeleteZoomMeeting = /* GraphQL */ `subscription OnDeleteZoomMeeting(
  $filter: ModelSubscriptionZoomMeetingFilterInput
) {
  onDeleteZoomMeeting(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteZoomMeetingSubscriptionVariables,
  APITypes.OnDeleteZoomMeetingSubscription
>;
export const onUpdateAcademicYear = /* GraphQL */ `subscription OnUpdateAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onUpdateAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAcademicYearSubscriptionVariables,
  APITypes.OnUpdateAcademicYearSubscription
>;
export const onUpdateAnnouncement = /* GraphQL */ `subscription OnUpdateAnnouncement(
  $filter: ModelSubscriptionAnnouncementFilterInput
) {
  onUpdateAnnouncement(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAnnouncementSubscriptionVariables,
  APITypes.OnUpdateAnnouncementSubscription
>;
export const onUpdateAssignment = /* GraphQL */ `subscription OnUpdateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onUpdateAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentSubscriptionVariables,
  APITypes.OnUpdateAssignmentSubscription
>;
export const onUpdateAssignmentQuestion = /* GraphQL */ `subscription OnUpdateAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onUpdateAssignmentQuestion(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentQuestionSubscriptionVariables,
  APITypes.OnUpdateAssignmentQuestionSubscription
>;
export const onUpdateCourse = /* GraphQL */ `subscription OnUpdateCourse($filter: ModelSubscriptionCourseFilterInput) {
  onUpdateCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateCourseSubscriptionVariables,
  APITypes.OnUpdateCourseSubscription
>;
export const onUpdateEnrollment = /* GraphQL */ `subscription OnUpdateEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onUpdateEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateEnrollmentSubscriptionVariables,
  APITypes.OnUpdateEnrollmentSubscription
>;
export const onUpdateLesson = /* GraphQL */ `subscription OnUpdateLesson($filter: ModelSubscriptionLessonFilterInput) {
  onUpdateLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateLessonSubscriptionVariables,
  APITypes.OnUpdateLessonSubscription
>;
export const onUpdateLessonTemplate = /* GraphQL */ `subscription OnUpdateLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onUpdateLessonTemplate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateLessonTemplateSubscriptionVariables,
  APITypes.OnUpdateLessonTemplateSubscription
>;
export const onUpdateMessage = /* GraphQL */ `subscription OnUpdateMessage($filter: ModelSubscriptionMessageFilterInput) {
  onUpdateMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMessageSubscriptionVariables,
  APITypes.OnUpdateMessageSubscription
>;
export const onUpdateParentInvite = /* GraphQL */ `subscription OnUpdateParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onUpdateParentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateParentInviteSubscriptionVariables,
  APITypes.OnUpdateParentInviteSubscription
>;
export const onUpdateParentProfile = /* GraphQL */ `subscription OnUpdateParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onUpdateParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateParentProfileSubscriptionVariables,
  APITypes.OnUpdateParentProfileSubscription
>;
export const onUpdateParentStudent = /* GraphQL */ `subscription OnUpdateParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onUpdateParentStudent(filter: $filter) {
    createdAt
    id
    parentId
    studentEmail
    studentName
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateParentStudentSubscriptionVariables,
  APITypes.OnUpdateParentStudentSubscription
>;
export const onUpdateParentStudentLink = /* GraphQL */ `subscription OnUpdateParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onUpdateParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateParentStudentLinkSubscriptionVariables,
  APITypes.OnUpdateParentStudentLinkSubscription
>;
export const onUpdateQuarter = /* GraphQL */ `subscription OnUpdateQuarter($filter: ModelSubscriptionQuarterFilterInput) {
  onUpdateQuarter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuarterSubscriptionVariables,
  APITypes.OnUpdateQuarterSubscription
>;
export const onUpdateReportCardRecord = /* GraphQL */ `subscription OnUpdateReportCardRecord(
  $filter: ModelSubscriptionReportCardRecordFilterInput
) {
  onUpdateReportCardRecord(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateReportCardRecordSubscriptionVariables,
  APITypes.OnUpdateReportCardRecordSubscription
>;
export const onUpdateSemester = /* GraphQL */ `subscription OnUpdateSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onUpdateSemester(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSemesterSubscriptionVariables,
  APITypes.OnUpdateSemesterSubscription
>;
export const onUpdateStudentInvite = /* GraphQL */ `subscription OnUpdateStudentInvite(
  $filter: ModelSubscriptionStudentInviteFilterInput
) {
  onUpdateStudentInvite(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateStudentInviteSubscriptionVariables,
  APITypes.OnUpdateStudentInviteSubscription
>;
export const onUpdateStudentProfile = /* GraphQL */ `subscription OnUpdateStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onUpdateStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateStudentProfileSubscriptionVariables,
  APITypes.OnUpdateStudentProfileSubscription
>;
export const onUpdateSubmission = /* GraphQL */ `subscription OnUpdateSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onUpdateSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSubmissionSubscriptionVariables,
  APITypes.OnUpdateSubmissionSubscription
>;
export const onUpdateSubmissionMessage = /* GraphQL */ `subscription OnUpdateSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onUpdateSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSubmissionMessageSubscriptionVariables,
  APITypes.OnUpdateSubmissionMessageSubscription
>;
export const onUpdateSyllabus = /* GraphQL */ `subscription OnUpdateSyllabus($filter: ModelSubscriptionSyllabusFilterInput) {
  onUpdateSyllabus(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSyllabusSubscriptionVariables,
  APITypes.OnUpdateSyllabusSubscription
>;
export const onUpdateTeacherProfile = /* GraphQL */ `subscription OnUpdateTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onUpdateTeacherProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTeacherProfileSubscriptionVariables,
  APITypes.OnUpdateTeacherProfileSubscription
>;
export const onUpdateVideoWatch = /* GraphQL */ `subscription OnUpdateVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onUpdateVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateVideoWatchSubscriptionVariables,
  APITypes.OnUpdateVideoWatchSubscription
>;
export const onUpdateWeeklyPlan = /* GraphQL */ `subscription OnUpdateWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onUpdateWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateWeeklyPlanSubscriptionVariables,
  APITypes.OnUpdateWeeklyPlanSubscription
>;
export const onUpdateWeeklyPlanItem = /* GraphQL */ `subscription OnUpdateWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onUpdateWeeklyPlanItem(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateWeeklyPlanItemSubscriptionVariables,
  APITypes.OnUpdateWeeklyPlanItemSubscription
>;
export const onUpdateZoomMeeting = /* GraphQL */ `subscription OnUpdateZoomMeeting(
  $filter: ModelSubscriptionZoomMeetingFilterInput
) {
  onUpdateZoomMeeting(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateZoomMeetingSubscriptionVariables,
  APITypes.OnUpdateZoomMeetingSubscription
>;
