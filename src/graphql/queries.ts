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
      createdAt
      updatedAt
      academicYearSemestersId
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
      grade
      submittedAt
      teacherComment
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
