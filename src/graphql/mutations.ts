/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAcademicYear = /* GraphQL */ `mutation CreateAcademicYear(
  $input: CreateAcademicYearInput!
  $condition: ModelAcademicYearConditionInput
) {
  createAcademicYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAcademicYearMutationVariables,
  APITypes.CreateAcademicYearMutation
>;
export const updateAcademicYear = /* GraphQL */ `mutation UpdateAcademicYear(
  $input: UpdateAcademicYearInput!
  $condition: ModelAcademicYearConditionInput
) {
  updateAcademicYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAcademicYearMutationVariables,
  APITypes.UpdateAcademicYearMutation
>;
export const deleteAcademicYear = /* GraphQL */ `mutation DeleteAcademicYear(
  $input: DeleteAcademicYearInput!
  $condition: ModelAcademicYearConditionInput
) {
  deleteAcademicYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAcademicYearMutationVariables,
  APITypes.DeleteAcademicYearMutation
>;
export const createSemester = /* GraphQL */ `mutation CreateSemester(
  $input: CreateSemesterInput!
  $condition: ModelSemesterConditionInput
) {
  createSemester(input: $input, condition: $condition) {
    id
    name
    startDate
    endDate
    isActive
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
    createdAt
    updatedAt
    academicYearSemestersId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSemesterMutationVariables,
  APITypes.CreateSemesterMutation
>;
export const updateSemester = /* GraphQL */ `mutation UpdateSemester(
  $input: UpdateSemesterInput!
  $condition: ModelSemesterConditionInput
) {
  updateSemester(input: $input, condition: $condition) {
    id
    name
    startDate
    endDate
    isActive
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
    createdAt
    updatedAt
    academicYearSemestersId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSemesterMutationVariables,
  APITypes.UpdateSemesterMutation
>;
export const deleteSemester = /* GraphQL */ `mutation DeleteSemester(
  $input: DeleteSemesterInput!
  $condition: ModelSemesterConditionInput
) {
  deleteSemester(input: $input, condition: $condition) {
    id
    name
    startDate
    endDate
    isActive
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
    createdAt
    updatedAt
    academicYearSemestersId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSemesterMutationVariables,
  APITypes.DeleteSemesterMutation
>;
export const createCourse = /* GraphQL */ `mutation CreateCourse(
  $input: CreateCourseInput!
  $condition: ModelCourseConditionInput
) {
  createCourse(input: $input, condition: $condition) {
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
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCourseMutationVariables,
  APITypes.CreateCourseMutation
>;
export const updateCourse = /* GraphQL */ `mutation UpdateCourse(
  $input: UpdateCourseInput!
  $condition: ModelCourseConditionInput
) {
  updateCourse(input: $input, condition: $condition) {
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
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateCourseMutationVariables,
  APITypes.UpdateCourseMutation
>;
export const deleteCourse = /* GraphQL */ `mutation DeleteCourse(
  $input: DeleteCourseInput!
  $condition: ModelCourseConditionInput
) {
  deleteCourse(input: $input, condition: $condition) {
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
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteCourseMutationVariables,
  APITypes.DeleteCourseMutation
>;
export const createLesson = /* GraphQL */ `mutation CreateLesson(
  $input: CreateLessonInput!
  $condition: ModelLessonConditionInput
) {
  createLesson(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateLessonMutationVariables,
  APITypes.CreateLessonMutation
>;
export const updateLesson = /* GraphQL */ `mutation UpdateLesson(
  $input: UpdateLessonInput!
  $condition: ModelLessonConditionInput
) {
  updateLesson(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateLessonMutationVariables,
  APITypes.UpdateLessonMutation
>;
export const deleteLesson = /* GraphQL */ `mutation DeleteLesson(
  $input: DeleteLessonInput!
  $condition: ModelLessonConditionInput
) {
  deleteLesson(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteLessonMutationVariables,
  APITypes.DeleteLessonMutation
>;
export const createWeeklyPlan = /* GraphQL */ `mutation CreateWeeklyPlan(
  $input: CreateWeeklyPlanInput!
  $condition: ModelWeeklyPlanConditionInput
) {
  createWeeklyPlan(input: $input, condition: $condition) {
    id
    weekStartDate
    semester {
      id
      name
      startDate
      endDate
      isActive
      createdAt
      updatedAt
      academicYearSemestersId
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
` as GeneratedMutation<
  APITypes.CreateWeeklyPlanMutationVariables,
  APITypes.CreateWeeklyPlanMutation
>;
export const updateWeeklyPlan = /* GraphQL */ `mutation UpdateWeeklyPlan(
  $input: UpdateWeeklyPlanInput!
  $condition: ModelWeeklyPlanConditionInput
) {
  updateWeeklyPlan(input: $input, condition: $condition) {
    id
    weekStartDate
    semester {
      id
      name
      startDate
      endDate
      isActive
      createdAt
      updatedAt
      academicYearSemestersId
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
` as GeneratedMutation<
  APITypes.UpdateWeeklyPlanMutationVariables,
  APITypes.UpdateWeeklyPlanMutation
>;
export const deleteWeeklyPlan = /* GraphQL */ `mutation DeleteWeeklyPlan(
  $input: DeleteWeeklyPlanInput!
  $condition: ModelWeeklyPlanConditionInput
) {
  deleteWeeklyPlan(input: $input, condition: $condition) {
    id
    weekStartDate
    semester {
      id
      name
      startDate
      endDate
      isActive
      createdAt
      updatedAt
      academicYearSemestersId
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
` as GeneratedMutation<
  APITypes.DeleteWeeklyPlanMutationVariables,
  APITypes.DeleteWeeklyPlanMutation
>;
export const createWeeklyPlanItem = /* GraphQL */ `mutation CreateWeeklyPlanItem(
  $input: CreateWeeklyPlanItemInput!
  $condition: ModelWeeklyPlanItemConditionInput
) {
  createWeeklyPlanItem(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateWeeklyPlanItemMutationVariables,
  APITypes.CreateWeeklyPlanItemMutation
>;
export const updateWeeklyPlanItem = /* GraphQL */ `mutation UpdateWeeklyPlanItem(
  $input: UpdateWeeklyPlanItemInput!
  $condition: ModelWeeklyPlanItemConditionInput
) {
  updateWeeklyPlanItem(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateWeeklyPlanItemMutationVariables,
  APITypes.UpdateWeeklyPlanItemMutation
>;
export const deleteWeeklyPlanItem = /* GraphQL */ `mutation DeleteWeeklyPlanItem(
  $input: DeleteWeeklyPlanItemInput!
  $condition: ModelWeeklyPlanItemConditionInput
) {
  deleteWeeklyPlanItem(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteWeeklyPlanItemMutationVariables,
  APITypes.DeleteWeeklyPlanItemMutation
>;
export const createAssignment = /* GraphQL */ `mutation CreateAssignment(
  $input: CreateAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  createAssignment(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAssignmentMutationVariables,
  APITypes.CreateAssignmentMutation
>;
export const updateAssignment = /* GraphQL */ `mutation UpdateAssignment(
  $input: UpdateAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  updateAssignment(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAssignmentMutationVariables,
  APITypes.UpdateAssignmentMutation
>;
export const deleteAssignment = /* GraphQL */ `mutation DeleteAssignment(
  $input: DeleteAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  deleteAssignment(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAssignmentMutationVariables,
  APITypes.DeleteAssignmentMutation
>;
export const createSubmission = /* GraphQL */ `mutation CreateSubmission(
  $input: CreateSubmissionInput!
  $condition: ModelSubmissionConditionInput
) {
  createSubmission(input: $input, condition: $condition) {
    id
    studentId
    content
    answers
    imageUrls
    lessonTemplateId
    grade
    submittedAt
    teacherComment
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
` as GeneratedMutation<
  APITypes.CreateSubmissionMutationVariables,
  APITypes.CreateSubmissionMutation
>;
export const updateSubmission = /* GraphQL */ `mutation UpdateSubmission(
  $input: UpdateSubmissionInput!
  $condition: ModelSubmissionConditionInput
) {
  updateSubmission(input: $input, condition: $condition) {
    id
    studentId
    content
    answers
    imageUrls
    lessonTemplateId
    grade
    submittedAt
    teacherComment
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
` as GeneratedMutation<
  APITypes.UpdateSubmissionMutationVariables,
  APITypes.UpdateSubmissionMutation
>;
export const deleteSubmission = /* GraphQL */ `mutation DeleteSubmission(
  $input: DeleteSubmissionInput!
  $condition: ModelSubmissionConditionInput
) {
  deleteSubmission(input: $input, condition: $condition) {
    id
    studentId
    content
    answers
    imageUrls
    lessonTemplateId
    grade
    submittedAt
    teacherComment
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
` as GeneratedMutation<
  APITypes.DeleteSubmissionMutationVariables,
  APITypes.DeleteSubmissionMutation
>;
export const createSubmissionMessage = /* GraphQL */ `mutation CreateSubmissionMessage(
  $input: CreateSubmissionMessageInput!
  $condition: ModelSubmissionMessageConditionInput
) {
  createSubmissionMessage(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateSubmissionMessageMutationVariables,
  APITypes.CreateSubmissionMessageMutation
>;
export const updateSubmissionMessage = /* GraphQL */ `mutation UpdateSubmissionMessage(
  $input: UpdateSubmissionMessageInput!
  $condition: ModelSubmissionMessageConditionInput
) {
  updateSubmissionMessage(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateSubmissionMessageMutationVariables,
  APITypes.UpdateSubmissionMessageMutation
>;
export const deleteSubmissionMessage = /* GraphQL */ `mutation DeleteSubmissionMessage(
  $input: DeleteSubmissionMessageInput!
  $condition: ModelSubmissionMessageConditionInput
) {
  deleteSubmissionMessage(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteSubmissionMessageMutationVariables,
  APITypes.DeleteSubmissionMessageMutation
>;
export const createEnrollment = /* GraphQL */ `mutation CreateEnrollment(
  $input: CreateEnrollmentInput!
  $condition: ModelEnrollmentConditionInput
) {
  createEnrollment(input: $input, condition: $condition) {
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
      createdAt
      updatedAt
      academicYearSemestersId
      __typename
    }
    createdAt
    updatedAt
    semesterEnrollmentsId
    courseEnrollmentsId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateEnrollmentMutationVariables,
  APITypes.CreateEnrollmentMutation
>;
export const updateEnrollment = /* GraphQL */ `mutation UpdateEnrollment(
  $input: UpdateEnrollmentInput!
  $condition: ModelEnrollmentConditionInput
) {
  updateEnrollment(input: $input, condition: $condition) {
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
      createdAt
      updatedAt
      academicYearSemestersId
      __typename
    }
    createdAt
    updatedAt
    semesterEnrollmentsId
    courseEnrollmentsId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateEnrollmentMutationVariables,
  APITypes.UpdateEnrollmentMutation
>;
export const deleteEnrollment = /* GraphQL */ `mutation DeleteEnrollment(
  $input: DeleteEnrollmentInput!
  $condition: ModelEnrollmentConditionInput
) {
  deleteEnrollment(input: $input, condition: $condition) {
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
      createdAt
      updatedAt
      academicYearSemestersId
      __typename
    }
    createdAt
    updatedAt
    semesterEnrollmentsId
    courseEnrollmentsId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteEnrollmentMutationVariables,
  APITypes.DeleteEnrollmentMutation
>;
export const createLessonTemplate = /* GraphQL */ `mutation CreateLessonTemplate(
  $input: CreateLessonTemplateInput!
  $condition: ModelLessonTemplateConditionInput
) {
  createLessonTemplate(input: $input, condition: $condition) {
    id
    lessonNumber
    title
    instructions
    worksheetUrl
    videoUrl
    assignmentType
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
` as GeneratedMutation<
  APITypes.CreateLessonTemplateMutationVariables,
  APITypes.CreateLessonTemplateMutation
>;
export const updateLessonTemplate = /* GraphQL */ `mutation UpdateLessonTemplate(
  $input: UpdateLessonTemplateInput!
  $condition: ModelLessonTemplateConditionInput
) {
  updateLessonTemplate(input: $input, condition: $condition) {
    id
    lessonNumber
    title
    instructions
    worksheetUrl
    videoUrl
    assignmentType
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
` as GeneratedMutation<
  APITypes.UpdateLessonTemplateMutationVariables,
  APITypes.UpdateLessonTemplateMutation
>;
export const deleteLessonTemplate = /* GraphQL */ `mutation DeleteLessonTemplate(
  $input: DeleteLessonTemplateInput!
  $condition: ModelLessonTemplateConditionInput
) {
  deleteLessonTemplate(input: $input, condition: $condition) {
    id
    lessonNumber
    title
    instructions
    worksheetUrl
    videoUrl
    assignmentType
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
` as GeneratedMutation<
  APITypes.DeleteLessonTemplateMutationVariables,
  APITypes.DeleteLessonTemplateMutation
>;
export const createAssignmentQuestion = /* GraphQL */ `mutation CreateAssignmentQuestion(
  $input: CreateAssignmentQuestionInput!
  $condition: ModelAssignmentQuestionConditionInput
) {
  createAssignmentQuestion(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAssignmentQuestionMutationVariables,
  APITypes.CreateAssignmentQuestionMutation
>;
export const updateAssignmentQuestion = /* GraphQL */ `mutation UpdateAssignmentQuestion(
  $input: UpdateAssignmentQuestionInput!
  $condition: ModelAssignmentQuestionConditionInput
) {
  updateAssignmentQuestion(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAssignmentQuestionMutationVariables,
  APITypes.UpdateAssignmentQuestionMutation
>;
export const deleteAssignmentQuestion = /* GraphQL */ `mutation DeleteAssignmentQuestion(
  $input: DeleteAssignmentQuestionInput!
  $condition: ModelAssignmentQuestionConditionInput
) {
  deleteAssignmentQuestion(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAssignmentQuestionMutationVariables,
  APITypes.DeleteAssignmentQuestionMutation
>;
export const createParentInvite = /* GraphQL */ `mutation CreateParentInvite(
  $input: CreateParentInviteInput!
  $condition: ModelParentInviteConditionInput
) {
  createParentInvite(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateParentInviteMutationVariables,
  APITypes.CreateParentInviteMutation
>;
export const updateParentInvite = /* GraphQL */ `mutation UpdateParentInvite(
  $input: UpdateParentInviteInput!
  $condition: ModelParentInviteConditionInput
) {
  updateParentInvite(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateParentInviteMutationVariables,
  APITypes.UpdateParentInviteMutation
>;
export const deleteParentInvite = /* GraphQL */ `mutation DeleteParentInvite(
  $input: DeleteParentInviteInput!
  $condition: ModelParentInviteConditionInput
) {
  deleteParentInvite(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteParentInviteMutationVariables,
  APITypes.DeleteParentInviteMutation
>;
export const createParentStudent = /* GraphQL */ `mutation CreateParentStudent(
  $input: CreateParentStudentInput!
  $condition: ModelParentStudentConditionInput
) {
  createParentStudent(input: $input, condition: $condition) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateParentStudentMutationVariables,
  APITypes.CreateParentStudentMutation
>;
export const updateParentStudent = /* GraphQL */ `mutation UpdateParentStudent(
  $input: UpdateParentStudentInput!
  $condition: ModelParentStudentConditionInput
) {
  updateParentStudent(input: $input, condition: $condition) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateParentStudentMutationVariables,
  APITypes.UpdateParentStudentMutation
>;
export const deleteParentStudent = /* GraphQL */ `mutation DeleteParentStudent(
  $input: DeleteParentStudentInput!
  $condition: ModelParentStudentConditionInput
) {
  deleteParentStudent(input: $input, condition: $condition) {
    id
    parentId
    studentEmail
    studentName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteParentStudentMutationVariables,
  APITypes.DeleteParentStudentMutation
>;
export const createStudentProfile = /* GraphQL */ `mutation CreateStudentProfile(
  $input: CreateStudentProfileInput!
  $condition: ModelStudentProfileConditionInput
) {
  createStudentProfile(input: $input, condition: $condition) {
    id
    userId
    email
    firstName
    lastName
    gradeLevel
    courseId
    planType
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateStudentProfileMutationVariables,
  APITypes.CreateStudentProfileMutation
>;
export const updateStudentProfile = /* GraphQL */ `mutation UpdateStudentProfile(
  $input: UpdateStudentProfileInput!
  $condition: ModelStudentProfileConditionInput
) {
  updateStudentProfile(input: $input, condition: $condition) {
    id
    userId
    email
    firstName
    lastName
    gradeLevel
    courseId
    planType
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateStudentProfileMutationVariables,
  APITypes.UpdateStudentProfileMutation
>;
export const deleteStudentProfile = /* GraphQL */ `mutation DeleteStudentProfile(
  $input: DeleteStudentProfileInput!
  $condition: ModelStudentProfileConditionInput
) {
  deleteStudentProfile(input: $input, condition: $condition) {
    id
    userId
    email
    firstName
    lastName
    gradeLevel
    courseId
    planType
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteStudentProfileMutationVariables,
  APITypes.DeleteStudentProfileMutation
>;
