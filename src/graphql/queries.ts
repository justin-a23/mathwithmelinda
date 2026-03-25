/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getCourse = /* GraphQL */ `query GetCourse($id: ID!) {
  getCourse(id: $id) {
    id
    title
    description
    gradeLevel
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
    course {
      id
      title
      description
      gradeLevel
      createdAt
      updatedAt
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
    assignment {
      id
      title
      description
      dueDate
      createdAt
      updatedAt
      courseAssignmentsId
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
    course {
      id
      title
      description
      gradeLevel
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
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
      createdAt
      updatedAt
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
