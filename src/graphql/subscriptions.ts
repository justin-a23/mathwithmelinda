/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAcademicYear = /* GraphQL */ `subscription OnCreateAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onCreateAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAcademicYearSubscriptionVariables,
  APITypes.OnCreateAcademicYearSubscription
>;
export const onUpdateAcademicYear = /* GraphQL */ `subscription OnUpdateAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onUpdateAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAcademicYearSubscriptionVariables,
  APITypes.OnUpdateAcademicYearSubscription
>;
export const onDeleteAcademicYear = /* GraphQL */ `subscription OnDeleteAcademicYear(
  $filter: ModelSubscriptionAcademicYearFilterInput
) {
  onDeleteAcademicYear(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAcademicYearSubscriptionVariables,
  APITypes.OnDeleteAcademicYearSubscription
>;
export const onCreateSemester = /* GraphQL */ `subscription OnCreateSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onCreateSemester(filter: $filter) {
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
    createdAt
    updatedAt
    academicYearSemestersId
    courseSemestersId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateSemesterSubscriptionVariables,
  APITypes.OnCreateSemesterSubscription
>;
export const onUpdateSemester = /* GraphQL */ `subscription OnUpdateSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onUpdateSemester(filter: $filter) {
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
    createdAt
    updatedAt
    academicYearSemestersId
    courseSemestersId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateSemesterSubscriptionVariables,
  APITypes.OnUpdateSemesterSubscription
>;
export const onDeleteSemester = /* GraphQL */ `subscription OnDeleteSemester($filter: ModelSubscriptionSemesterFilterInput) {
  onDeleteSemester(filter: $filter) {
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
    createdAt
    updatedAt
    academicYearSemestersId
    courseSemestersId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteSemesterSubscriptionVariables,
  APITypes.OnDeleteSemesterSubscription
>;
export const onCreateCourse = /* GraphQL */ `subscription OnCreateCourse($filter: ModelSubscriptionCourseFilterInput) {
  onCreateCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateCourseSubscriptionVariables,
  APITypes.OnCreateCourseSubscription
>;
export const onUpdateCourse = /* GraphQL */ `subscription OnUpdateCourse($filter: ModelSubscriptionCourseFilterInput) {
  onUpdateCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateCourseSubscriptionVariables,
  APITypes.OnUpdateCourseSubscription
>;
export const onDeleteCourse = /* GraphQL */ `subscription OnDeleteCourse($filter: ModelSubscriptionCourseFilterInput) {
  onDeleteCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteCourseSubscriptionVariables,
  APITypes.OnDeleteCourseSubscription
>;
export const onCreateLesson = /* GraphQL */ `subscription OnCreateLesson($filter: ModelSubscriptionLessonFilterInput) {
  onCreateLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateLessonSubscriptionVariables,
  APITypes.OnCreateLessonSubscription
>;
export const onUpdateLesson = /* GraphQL */ `subscription OnUpdateLesson($filter: ModelSubscriptionLessonFilterInput) {
  onUpdateLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateLessonSubscriptionVariables,
  APITypes.OnUpdateLessonSubscription
>;
export const onDeleteLesson = /* GraphQL */ `subscription OnDeleteLesson($filter: ModelSubscriptionLessonFilterInput) {
  onDeleteLesson(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteLessonSubscriptionVariables,
  APITypes.OnDeleteLessonSubscription
>;
export const onCreateWeeklyPlan = /* GraphQL */ `subscription OnCreateWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onCreateWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateWeeklyPlanSubscriptionVariables,
  APITypes.OnCreateWeeklyPlanSubscription
>;
export const onUpdateWeeklyPlan = /* GraphQL */ `subscription OnUpdateWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onUpdateWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateWeeklyPlanSubscriptionVariables,
  APITypes.OnUpdateWeeklyPlanSubscription
>;
export const onDeleteWeeklyPlan = /* GraphQL */ `subscription OnDeleteWeeklyPlan(
  $filter: ModelSubscriptionWeeklyPlanFilterInput
) {
  onDeleteWeeklyPlan(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteWeeklyPlanSubscriptionVariables,
  APITypes.OnDeleteWeeklyPlanSubscription
>;
export const onCreateWeeklyPlanItem = /* GraphQL */ `subscription OnCreateWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onCreateWeeklyPlanItem(filter: $filter) {
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
    createdAt
    updatedAt
    lessonWeeklyPlanItemsId
    weeklyPlanItemsId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWeeklyPlanItemSubscriptionVariables,
  APITypes.OnCreateWeeklyPlanItemSubscription
>;
export const onUpdateWeeklyPlanItem = /* GraphQL */ `subscription OnUpdateWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onUpdateWeeklyPlanItem(filter: $filter) {
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
    createdAt
    updatedAt
    lessonWeeklyPlanItemsId
    weeklyPlanItemsId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWeeklyPlanItemSubscriptionVariables,
  APITypes.OnUpdateWeeklyPlanItemSubscription
>;
export const onDeleteWeeklyPlanItem = /* GraphQL */ `subscription OnDeleteWeeklyPlanItem(
  $filter: ModelSubscriptionWeeklyPlanItemFilterInput
) {
  onDeleteWeeklyPlanItem(filter: $filter) {
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
    createdAt
    updatedAt
    lessonWeeklyPlanItemsId
    weeklyPlanItemsId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWeeklyPlanItemSubscriptionVariables,
  APITypes.OnDeleteWeeklyPlanItemSubscription
>;
export const onCreateAssignment = /* GraphQL */ `subscription OnCreateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onCreateAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentSubscriptionVariables,
  APITypes.OnCreateAssignmentSubscription
>;
export const onUpdateAssignment = /* GraphQL */ `subscription OnUpdateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onUpdateAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentSubscriptionVariables,
  APITypes.OnUpdateAssignmentSubscription
>;
export const onDeleteAssignment = /* GraphQL */ `subscription OnDeleteAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
) {
  onDeleteAssignment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentSubscriptionVariables,
  APITypes.OnDeleteAssignmentSubscription
>;
export const onCreateSubmission = /* GraphQL */ `subscription OnCreateSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onCreateSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSubmissionSubscriptionVariables,
  APITypes.OnCreateSubmissionSubscription
>;
export const onUpdateSubmission = /* GraphQL */ `subscription OnUpdateSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onUpdateSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSubmissionSubscriptionVariables,
  APITypes.OnUpdateSubmissionSubscription
>;
export const onDeleteSubmission = /* GraphQL */ `subscription OnDeleteSubmission(
  $filter: ModelSubscriptionSubmissionFilterInput
) {
  onDeleteSubmission(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSubmissionSubscriptionVariables,
  APITypes.OnDeleteSubmissionSubscription
>;
export const onCreateSubmissionMessage = /* GraphQL */ `subscription OnCreateSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onCreateSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSubmissionMessageSubscriptionVariables,
  APITypes.OnCreateSubmissionMessageSubscription
>;
export const onUpdateSubmissionMessage = /* GraphQL */ `subscription OnUpdateSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onUpdateSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSubmissionMessageSubscriptionVariables,
  APITypes.OnUpdateSubmissionMessageSubscription
>;
export const onDeleteSubmissionMessage = /* GraphQL */ `subscription OnDeleteSubmissionMessage(
  $filter: ModelSubscriptionSubmissionMessageFilterInput
) {
  onDeleteSubmissionMessage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSubmissionMessageSubscriptionVariables,
  APITypes.OnDeleteSubmissionMessageSubscription
>;
export const onCreateEnrollment = /* GraphQL */ `subscription OnCreateEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onCreateEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateEnrollmentSubscriptionVariables,
  APITypes.OnCreateEnrollmentSubscription
>;
export const onUpdateEnrollment = /* GraphQL */ `subscription OnUpdateEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onUpdateEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateEnrollmentSubscriptionVariables,
  APITypes.OnUpdateEnrollmentSubscription
>;
export const onDeleteEnrollment = /* GraphQL */ `subscription OnDeleteEnrollment(
  $filter: ModelSubscriptionEnrollmentFilterInput
) {
  onDeleteEnrollment(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteEnrollmentSubscriptionVariables,
  APITypes.OnDeleteEnrollmentSubscription
>;
export const onCreateLessonTemplate = /* GraphQL */ `subscription OnCreateLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onCreateLessonTemplate(filter: $filter) {
    id
    lessonNumber
    title
    instructions
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
` as GeneratedSubscription<
  APITypes.OnCreateLessonTemplateSubscriptionVariables,
  APITypes.OnCreateLessonTemplateSubscription
>;
export const onUpdateLessonTemplate = /* GraphQL */ `subscription OnUpdateLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onUpdateLessonTemplate(filter: $filter) {
    id
    lessonNumber
    title
    instructions
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
` as GeneratedSubscription<
  APITypes.OnUpdateLessonTemplateSubscriptionVariables,
  APITypes.OnUpdateLessonTemplateSubscription
>;
export const onDeleteLessonTemplate = /* GraphQL */ `subscription OnDeleteLessonTemplate(
  $filter: ModelSubscriptionLessonTemplateFilterInput
) {
  onDeleteLessonTemplate(filter: $filter) {
    id
    lessonNumber
    title
    instructions
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
` as GeneratedSubscription<
  APITypes.OnDeleteLessonTemplateSubscriptionVariables,
  APITypes.OnDeleteLessonTemplateSubscription
>;
export const onCreateAssignmentQuestion = /* GraphQL */ `subscription OnCreateAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onCreateAssignmentQuestion(filter: $filter) {
    id
    order
    questionText
    questionType
    choices
    correctAnswer
    lessonTemplate {
      id
      lessonNumber
      title
      instructions
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
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentQuestionSubscriptionVariables,
  APITypes.OnCreateAssignmentQuestionSubscription
>;
export const onUpdateAssignmentQuestion = /* GraphQL */ `subscription OnUpdateAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onUpdateAssignmentQuestion(filter: $filter) {
    id
    order
    questionText
    questionType
    choices
    correctAnswer
    lessonTemplate {
      id
      lessonNumber
      title
      instructions
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentQuestionSubscriptionVariables,
  APITypes.OnUpdateAssignmentQuestionSubscription
>;
export const onDeleteAssignmentQuestion = /* GraphQL */ `subscription OnDeleteAssignmentQuestion(
  $filter: ModelSubscriptionAssignmentQuestionFilterInput
) {
  onDeleteAssignmentQuestion(filter: $filter) {
    id
    order
    questionText
    questionType
    choices
    correctAnswer
    lessonTemplate {
      id
      lessonNumber
      title
      instructions
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentQuestionSubscriptionVariables,
  APITypes.OnDeleteAssignmentQuestionSubscription
>;
export const onCreateTeacherProfile = /* GraphQL */ `subscription OnCreateTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onCreateTeacherProfile(filter: $filter) {
    id
    userId
    email
    displayName
    bio
    profilePictureKey
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateTeacherProfileSubscriptionVariables,
  APITypes.OnCreateTeacherProfileSubscription
>;
export const onUpdateTeacherProfile = /* GraphQL */ `subscription OnUpdateTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onUpdateTeacherProfile(filter: $filter) {
    id
    userId
    email
    displayName
    bio
    profilePictureKey
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateTeacherProfileSubscriptionVariables,
  APITypes.OnUpdateTeacherProfileSubscription
>;
export const onDeleteTeacherProfile = /* GraphQL */ `subscription OnDeleteTeacherProfile(
  $filter: ModelSubscriptionTeacherProfileFilterInput
) {
  onDeleteTeacherProfile(filter: $filter) {
    id
    userId
    email
    displayName
    bio
    profilePictureKey
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteTeacherProfileSubscriptionVariables,
  APITypes.OnDeleteTeacherProfileSubscription
>;
export const onCreateVideoWatch = /* GraphQL */ `subscription OnCreateVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onCreateVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateVideoWatchSubscriptionVariables,
  APITypes.OnCreateVideoWatchSubscription
>;
export const onUpdateVideoWatch = /* GraphQL */ `subscription OnUpdateVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onUpdateVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateVideoWatchSubscriptionVariables,
  APITypes.OnUpdateVideoWatchSubscription
>;
export const onDeleteVideoWatch = /* GraphQL */ `subscription OnDeleteVideoWatch(
  $filter: ModelSubscriptionVideoWatchFilterInput
) {
  onDeleteVideoWatch(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteVideoWatchSubscriptionVariables,
  APITypes.OnDeleteVideoWatchSubscription
>;
export const onCreateParentInvite = /* GraphQL */ `subscription OnCreateParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onCreateParentInvite(filter: $filter) {
    id
    token
    studentEmail
    studentName
    used
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateParentInviteSubscriptionVariables,
  APITypes.OnCreateParentInviteSubscription
>;
export const onUpdateParentInvite = /* GraphQL */ `subscription OnUpdateParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onUpdateParentInvite(filter: $filter) {
    id
    token
    studentEmail
    studentName
    used
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateParentInviteSubscriptionVariables,
  APITypes.OnUpdateParentInviteSubscription
>;
export const onDeleteParentInvite = /* GraphQL */ `subscription OnDeleteParentInvite(
  $filter: ModelSubscriptionParentInviteFilterInput
) {
  onDeleteParentInvite(filter: $filter) {
    id
    token
    studentEmail
    studentName
    used
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteParentInviteSubscriptionVariables,
  APITypes.OnDeleteParentInviteSubscription
>;
export const onCreateParentStudent = /* GraphQL */ `subscription OnCreateParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onCreateParentStudent(filter: $filter) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateParentStudentSubscriptionVariables,
  APITypes.OnCreateParentStudentSubscription
>;
export const onUpdateParentStudent = /* GraphQL */ `subscription OnUpdateParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onUpdateParentStudent(filter: $filter) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateParentStudentSubscriptionVariables,
  APITypes.OnUpdateParentStudentSubscription
>;
export const onDeleteParentStudent = /* GraphQL */ `subscription OnDeleteParentStudent(
  $filter: ModelSubscriptionParentStudentFilterInput
) {
  onDeleteParentStudent(filter: $filter) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteParentStudentSubscriptionVariables,
  APITypes.OnDeleteParentStudentSubscription
>;
export const onCreateStudentProfile = /* GraphQL */ `subscription OnCreateStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onCreateStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateStudentProfileSubscriptionVariables,
  APITypes.OnCreateStudentProfileSubscription
>;
export const onUpdateStudentProfile = /* GraphQL */ `subscription OnUpdateStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onUpdateStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateStudentProfileSubscriptionVariables,
  APITypes.OnUpdateStudentProfileSubscription
>;
export const onDeleteStudentProfile = /* GraphQL */ `subscription OnDeleteStudentProfile(
  $filter: ModelSubscriptionStudentProfileFilterInput
) {
  onDeleteStudentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteStudentProfileSubscriptionVariables,
  APITypes.OnDeleteStudentProfileSubscription
>;
export const onCreateParentProfile = /* GraphQL */ `subscription OnCreateParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onCreateParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateParentProfileSubscriptionVariables,
  APITypes.OnCreateParentProfileSubscription
>;
export const onUpdateParentProfile = /* GraphQL */ `subscription OnUpdateParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onUpdateParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateParentProfileSubscriptionVariables,
  APITypes.OnUpdateParentProfileSubscription
>;
export const onDeleteParentProfile = /* GraphQL */ `subscription OnDeleteParentProfile(
  $filter: ModelSubscriptionParentProfileFilterInput
) {
  onDeleteParentProfile(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteParentProfileSubscriptionVariables,
  APITypes.OnDeleteParentProfileSubscription
>;
export const onCreateParentStudentLink = /* GraphQL */ `subscription OnCreateParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onCreateParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateParentStudentLinkSubscriptionVariables,
  APITypes.OnCreateParentStudentLinkSubscription
>;
export const onUpdateParentStudentLink = /* GraphQL */ `subscription OnUpdateParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onUpdateParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateParentStudentLinkSubscriptionVariables,
  APITypes.OnUpdateParentStudentLinkSubscription
>;
export const onDeleteParentStudentLink = /* GraphQL */ `subscription OnDeleteParentStudentLink(
  $filter: ModelSubscriptionParentStudentLinkFilterInput
) {
  onDeleteParentStudentLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteParentStudentLinkSubscriptionVariables,
  APITypes.OnDeleteParentStudentLinkSubscription
>;
