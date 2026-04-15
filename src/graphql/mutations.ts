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
` as GeneratedMutation<
  APITypes.DeleteAssignmentQuestionMutationVariables,
  APITypes.DeleteAssignmentQuestionMutation
>;
export const createTeacherProfile = /* GraphQL */ `mutation CreateTeacherProfile(
  $input: CreateTeacherProfileInput!
  $condition: ModelTeacherProfileConditionInput
) {
  createTeacherProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTeacherProfileMutationVariables,
  APITypes.CreateTeacherProfileMutation
>;
export const updateTeacherProfile = /* GraphQL */ `mutation UpdateTeacherProfile(
  $input: UpdateTeacherProfileInput!
  $condition: ModelTeacherProfileConditionInput
) {
  updateTeacherProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTeacherProfileMutationVariables,
  APITypes.UpdateTeacherProfileMutation
>;
export const deleteTeacherProfile = /* GraphQL */ `mutation DeleteTeacherProfile(
  $input: DeleteTeacherProfileInput!
  $condition: ModelTeacherProfileConditionInput
) {
  deleteTeacherProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTeacherProfileMutationVariables,
  APITypes.DeleteTeacherProfileMutation
>;
export const createVideoWatch = /* GraphQL */ `mutation CreateVideoWatch(
  $input: CreateVideoWatchInput!
  $condition: ModelVideoWatchConditionInput
) {
  createVideoWatch(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateVideoWatchMutationVariables,
  APITypes.CreateVideoWatchMutation
>;
export const updateVideoWatch = /* GraphQL */ `mutation UpdateVideoWatch(
  $input: UpdateVideoWatchInput!
  $condition: ModelVideoWatchConditionInput
) {
  updateVideoWatch(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateVideoWatchMutationVariables,
  APITypes.UpdateVideoWatchMutation
>;
export const deleteVideoWatch = /* GraphQL */ `mutation DeleteVideoWatch(
  $input: DeleteVideoWatchInput!
  $condition: ModelVideoWatchConditionInput
) {
  deleteVideoWatch(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteVideoWatchMutationVariables,
  APITypes.DeleteVideoWatchMutation
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
` as GeneratedMutation<
  APITypes.DeleteStudentProfileMutationVariables,
  APITypes.DeleteStudentProfileMutation
>;
export const createParentProfile = /* GraphQL */ `mutation CreateParentProfile(
  $input: CreateParentProfileInput!
  $condition: ModelParentProfileConditionInput
) {
  createParentProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateParentProfileMutationVariables,
  APITypes.CreateParentProfileMutation
>;
export const updateParentProfile = /* GraphQL */ `mutation UpdateParentProfile(
  $input: UpdateParentProfileInput!
  $condition: ModelParentProfileConditionInput
) {
  updateParentProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateParentProfileMutationVariables,
  APITypes.UpdateParentProfileMutation
>;
export const deleteParentProfile = /* GraphQL */ `mutation DeleteParentProfile(
  $input: DeleteParentProfileInput!
  $condition: ModelParentProfileConditionInput
) {
  deleteParentProfile(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteParentProfileMutationVariables,
  APITypes.DeleteParentProfileMutation
>;
export const createParentStudentLink = /* GraphQL */ `mutation CreateParentStudentLink(
  $input: CreateParentStudentLinkInput!
  $condition: ModelParentStudentLinkConditionInput
) {
  createParentStudentLink(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateParentStudentLinkMutationVariables,
  APITypes.CreateParentStudentLinkMutation
>;
export const updateParentStudentLink = /* GraphQL */ `mutation UpdateParentStudentLink(
  $input: UpdateParentStudentLinkInput!
  $condition: ModelParentStudentLinkConditionInput
) {
  updateParentStudentLink(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateParentStudentLinkMutationVariables,
  APITypes.UpdateParentStudentLinkMutation
>;
export const deleteParentStudentLink = /* GraphQL */ `mutation DeleteParentStudentLink(
  $input: DeleteParentStudentLinkInput!
  $condition: ModelParentStudentLinkConditionInput
) {
  deleteParentStudentLink(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteParentStudentLinkMutationVariables,
  APITypes.DeleteParentStudentLinkMutation
>;
export const createMessage = /* GraphQL */ `mutation CreateMessage(
  $input: CreateMessageInput!
  $condition: ModelMessageConditionInput
) {
  createMessage(input: $input, condition: $condition) {
    id
    studentId
    studentName
    content
    sentAt
    isRead
    teacherReply
    repliedAt
    isArchivedByTeacher
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMessageMutationVariables,
  APITypes.CreateMessageMutation
>;
export const updateMessage = /* GraphQL */ `mutation UpdateMessage(
  $input: UpdateMessageInput!
  $condition: ModelMessageConditionInput
) {
  updateMessage(input: $input, condition: $condition) {
    id
    studentId
    studentName
    content
    sentAt
    isRead
    teacherReply
    repliedAt
    isArchivedByTeacher
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMessageMutationVariables,
  APITypes.UpdateMessageMutation
>;
export const deleteMessage = /* GraphQL */ `mutation DeleteMessage(
  $input: DeleteMessageInput!
  $condition: ModelMessageConditionInput
) {
  deleteMessage(input: $input, condition: $condition) {
    id
    studentId
    studentName
    content
    sentAt
    isRead
    teacherReply
    repliedAt
    isArchivedByTeacher
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMessageMutationVariables,
  APITypes.DeleteMessageMutation
>;
export const createSyllabus = /* GraphQL */ `mutation CreateSyllabus(
  $input: CreateSyllabusInput!
  $condition: ModelSyllabusConditionInput
) {
  createSyllabus(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateSyllabusMutationVariables,
  APITypes.CreateSyllabusMutation
>;
export const updateSyllabus = /* GraphQL */ `mutation UpdateSyllabus(
  $input: UpdateSyllabusInput!
  $condition: ModelSyllabusConditionInput
) {
  updateSyllabus(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateSyllabusMutationVariables,
  APITypes.UpdateSyllabusMutation
>;
export const deleteSyllabus = /* GraphQL */ `mutation DeleteSyllabus(
  $input: DeleteSyllabusInput!
  $condition: ModelSyllabusConditionInput
) {
  deleteSyllabus(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteSyllabusMutationVariables,
  APITypes.DeleteSyllabusMutation
>;
export const createZoomMeeting = /* GraphQL */ `mutation CreateZoomMeeting(
  $input: CreateZoomMeetingInput!
  $condition: ModelZoomMeetingConditionInput
) {
  createZoomMeeting(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateZoomMeetingMutationVariables,
  APITypes.CreateZoomMeetingMutation
>;
export const updateZoomMeeting = /* GraphQL */ `mutation UpdateZoomMeeting(
  $input: UpdateZoomMeetingInput!
  $condition: ModelZoomMeetingConditionInput
) {
  updateZoomMeeting(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateZoomMeetingMutationVariables,
  APITypes.UpdateZoomMeetingMutation
>;
export const deleteZoomMeeting = /* GraphQL */ `mutation DeleteZoomMeeting(
  $input: DeleteZoomMeetingInput!
  $condition: ModelZoomMeetingConditionInput
) {
  deleteZoomMeeting(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteZoomMeetingMutationVariables,
  APITypes.DeleteZoomMeetingMutation
>;
