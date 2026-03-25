/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateCourse = /* GraphQL */ `subscription OnCreateCourse($filter: ModelSubscriptionCourseFilterInput) {
  onCreateCourse(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteLessonSubscriptionVariables,
  APITypes.OnDeleteLessonSubscription
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
` as GeneratedSubscription<
  APITypes.OnDeleteEnrollmentSubscriptionVariables,
  APITypes.OnDeleteEnrollmentSubscription
>;
