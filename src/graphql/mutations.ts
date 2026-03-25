/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createCourse = /* GraphQL */ `mutation CreateCourse(
  $input: CreateCourseInput!
  $condition: ModelCourseConditionInput
) {
  createCourse(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteLessonMutationVariables,
  APITypes.DeleteLessonMutation
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
` as GeneratedMutation<
  APITypes.DeleteSubmissionMutationVariables,
  APITypes.DeleteSubmissionMutation
>;
export const createEnrollment = /* GraphQL */ `mutation CreateEnrollment(
  $input: CreateEnrollmentInput!
  $condition: ModelEnrollmentConditionInput
) {
  createEnrollment(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteEnrollmentMutationVariables,
  APITypes.DeleteEnrollmentMutation
>;
