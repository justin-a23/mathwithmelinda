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
      order
      isPublished
      createdAt
      updatedAt
      courseLessonsId
      __typename
    }
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
      order
      isPublished
      createdAt
      updatedAt
      courseLessonsId
      __typename
    }
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
      order
      isPublished
      createdAt
      updatedAt
      courseLessonsId
      __typename
    }
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
