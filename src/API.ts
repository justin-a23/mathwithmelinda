/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateCourseInput = {
  id?: string | null,
  title: string,
  description?: string | null,
  gradeLevel?: string | null,
};

export type ModelCourseConditionInput = {
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  and?: Array< ModelCourseConditionInput | null > | null,
  or?: Array< ModelCourseConditionInput | null > | null,
  not?: ModelCourseConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type Course = {
  __typename: "Course",
  id: string,
  title: string,
  description?: string | null,
  gradeLevel?: string | null,
  lessons?: ModelLessonConnection | null,
  assignments?: ModelAssignmentConnection | null,
  enrollments?: ModelEnrollmentConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelLessonConnection = {
  __typename: "ModelLessonConnection",
  items:  Array<Lesson | null >,
  nextToken?: string | null,
};

export type Lesson = {
  __typename: "Lesson",
  id: string,
  title: string,
  videoUrl?: string | null,
  order?: number | null,
  course?: Course | null,
  createdAt: string,
  updatedAt: string,
  courseLessonsId?: string | null,
};

export type ModelAssignmentConnection = {
  __typename: "ModelAssignmentConnection",
  items:  Array<Assignment | null >,
  nextToken?: string | null,
};

export type Assignment = {
  __typename: "Assignment",
  id: string,
  title: string,
  description?: string | null,
  dueDate?: string | null,
  course?: Course | null,
  submissions?: ModelSubmissionConnection | null,
  createdAt: string,
  updatedAt: string,
  courseAssignmentsId?: string | null,
};

export type ModelSubmissionConnection = {
  __typename: "ModelSubmissionConnection",
  items:  Array<Submission | null >,
  nextToken?: string | null,
};

export type Submission = {
  __typename: "Submission",
  id: string,
  studentId: string,
  content?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  assignment?: Assignment | null,
  createdAt: string,
  updatedAt: string,
  assignmentSubmissionsId?: string | null,
};

export type ModelEnrollmentConnection = {
  __typename: "ModelEnrollmentConnection",
  items:  Array<Enrollment | null >,
  nextToken?: string | null,
};

export type Enrollment = {
  __typename: "Enrollment",
  id: string,
  studentId: string,
  course?: Course | null,
  createdAt: string,
  updatedAt: string,
  courseEnrollmentsId?: string | null,
};

export type UpdateCourseInput = {
  id: string,
  title?: string | null,
  description?: string | null,
  gradeLevel?: string | null,
};

export type DeleteCourseInput = {
  id: string,
};

export type CreateLessonInput = {
  id?: string | null,
  title: string,
  videoUrl?: string | null,
  order?: number | null,
  courseLessonsId?: string | null,
};

export type ModelLessonConditionInput = {
  title?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  order?: ModelIntInput | null,
  and?: Array< ModelLessonConditionInput | null > | null,
  or?: Array< ModelLessonConditionInput | null > | null,
  not?: ModelLessonConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  courseLessonsId?: ModelIDInput | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type UpdateLessonInput = {
  id: string,
  title?: string | null,
  videoUrl?: string | null,
  order?: number | null,
  courseLessonsId?: string | null,
};

export type DeleteLessonInput = {
  id: string,
};

export type CreateAssignmentInput = {
  id?: string | null,
  title: string,
  description?: string | null,
  dueDate?: string | null,
  courseAssignmentsId?: string | null,
};

export type ModelAssignmentConditionInput = {
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  and?: Array< ModelAssignmentConditionInput | null > | null,
  or?: Array< ModelAssignmentConditionInput | null > | null,
  not?: ModelAssignmentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  courseAssignmentsId?: ModelIDInput | null,
};

export type UpdateAssignmentInput = {
  id: string,
  title?: string | null,
  description?: string | null,
  dueDate?: string | null,
  courseAssignmentsId?: string | null,
};

export type DeleteAssignmentInput = {
  id: string,
};

export type CreateSubmissionInput = {
  id?: string | null,
  studentId: string,
  content?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type ModelSubmissionConditionInput = {
  studentId?: ModelStringInput | null,
  content?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  and?: Array< ModelSubmissionConditionInput | null > | null,
  or?: Array< ModelSubmissionConditionInput | null > | null,
  not?: ModelSubmissionConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  assignmentSubmissionsId?: ModelIDInput | null,
};

export type UpdateSubmissionInput = {
  id: string,
  studentId?: string | null,
  content?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type DeleteSubmissionInput = {
  id: string,
};

export type CreateEnrollmentInput = {
  id?: string | null,
  studentId: string,
  courseEnrollmentsId?: string | null,
};

export type ModelEnrollmentConditionInput = {
  studentId?: ModelStringInput | null,
  and?: Array< ModelEnrollmentConditionInput | null > | null,
  or?: Array< ModelEnrollmentConditionInput | null > | null,
  not?: ModelEnrollmentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  courseEnrollmentsId?: ModelIDInput | null,
};

export type UpdateEnrollmentInput = {
  id: string,
  studentId?: string | null,
  courseEnrollmentsId?: string | null,
};

export type DeleteEnrollmentInput = {
  id: string,
};

export type ModelCourseFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelCourseFilterInput | null > | null,
  or?: Array< ModelCourseFilterInput | null > | null,
  not?: ModelCourseFilterInput | null,
};

export type ModelCourseConnection = {
  __typename: "ModelCourseConnection",
  items:  Array<Course | null >,
  nextToken?: string | null,
};

export type ModelLessonFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  order?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelLessonFilterInput | null > | null,
  or?: Array< ModelLessonFilterInput | null > | null,
  not?: ModelLessonFilterInput | null,
  courseLessonsId?: ModelIDInput | null,
};

export type ModelAssignmentFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAssignmentFilterInput | null > | null,
  or?: Array< ModelAssignmentFilterInput | null > | null,
  not?: ModelAssignmentFilterInput | null,
  courseAssignmentsId?: ModelIDInput | null,
};

export type ModelSubmissionFilterInput = {
  id?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  content?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSubmissionFilterInput | null > | null,
  or?: Array< ModelSubmissionFilterInput | null > | null,
  not?: ModelSubmissionFilterInput | null,
  assignmentSubmissionsId?: ModelIDInput | null,
};

export type ModelEnrollmentFilterInput = {
  id?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelEnrollmentFilterInput | null > | null,
  or?: Array< ModelEnrollmentFilterInput | null > | null,
  not?: ModelEnrollmentFilterInput | null,
  courseEnrollmentsId?: ModelIDInput | null,
};

export type ModelSubscriptionCourseFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  gradeLevel?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  or?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  courseLessonsId?: ModelSubscriptionIDInput | null,
  courseAssignmentsId?: ModelSubscriptionIDInput | null,
  courseEnrollmentsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionLessonFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  order?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  or?: Array< ModelSubscriptionLessonFilterInput | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionAssignmentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  dueDate?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  or?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  assignmentSubmissionsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionSubmissionFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  content?: ModelSubscriptionStringInput | null,
  grade?: ModelSubscriptionStringInput | null,
  submittedAt?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  or?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
};

export type ModelSubscriptionEnrollmentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
  or?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
};

export type CreateCourseMutationVariables = {
  input: CreateCourseInput,
  condition?: ModelCourseConditionInput | null,
};

export type CreateCourseMutation = {
  createCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateCourseMutationVariables = {
  input: UpdateCourseInput,
  condition?: ModelCourseConditionInput | null,
};

export type UpdateCourseMutation = {
  updateCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteCourseMutationVariables = {
  input: DeleteCourseInput,
  condition?: ModelCourseConditionInput | null,
};

export type DeleteCourseMutation = {
  deleteCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateLessonMutationVariables = {
  input: CreateLessonInput,
  condition?: ModelLessonConditionInput | null,
};

export type CreateLessonMutation = {
  createLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type UpdateLessonMutationVariables = {
  input: UpdateLessonInput,
  condition?: ModelLessonConditionInput | null,
};

export type UpdateLessonMutation = {
  updateLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type DeleteLessonMutationVariables = {
  input: DeleteLessonInput,
  condition?: ModelLessonConditionInput | null,
};

export type DeleteLessonMutation = {
  deleteLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type CreateAssignmentMutationVariables = {
  input: CreateAssignmentInput,
  condition?: ModelAssignmentConditionInput | null,
};

export type CreateAssignmentMutation = {
  createAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type UpdateAssignmentMutationVariables = {
  input: UpdateAssignmentInput,
  condition?: ModelAssignmentConditionInput | null,
};

export type UpdateAssignmentMutation = {
  updateAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type DeleteAssignmentMutationVariables = {
  input: DeleteAssignmentInput,
  condition?: ModelAssignmentConditionInput | null,
};

export type DeleteAssignmentMutation = {
  deleteAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type CreateSubmissionMutationVariables = {
  input: CreateSubmissionInput,
  condition?: ModelSubmissionConditionInput | null,
};

export type CreateSubmissionMutation = {
  createSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type UpdateSubmissionMutationVariables = {
  input: UpdateSubmissionInput,
  condition?: ModelSubmissionConditionInput | null,
};

export type UpdateSubmissionMutation = {
  updateSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type DeleteSubmissionMutationVariables = {
  input: DeleteSubmissionInput,
  condition?: ModelSubmissionConditionInput | null,
};

export type DeleteSubmissionMutation = {
  deleteSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type CreateEnrollmentMutationVariables = {
  input: CreateEnrollmentInput,
  condition?: ModelEnrollmentConditionInput | null,
};

export type CreateEnrollmentMutation = {
  createEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type UpdateEnrollmentMutationVariables = {
  input: UpdateEnrollmentInput,
  condition?: ModelEnrollmentConditionInput | null,
};

export type UpdateEnrollmentMutation = {
  updateEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type DeleteEnrollmentMutationVariables = {
  input: DeleteEnrollmentInput,
  condition?: ModelEnrollmentConditionInput | null,
};

export type DeleteEnrollmentMutation = {
  deleteEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type GetCourseQueryVariables = {
  id: string,
};

export type GetCourseQuery = {
  getCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListCoursesQueryVariables = {
  filter?: ModelCourseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListCoursesQuery = {
  listCourses?:  {
    __typename: "ModelCourseConnection",
    items:  Array< {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetLessonQueryVariables = {
  id: string,
};

export type GetLessonQuery = {
  getLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type ListLessonsQueryVariables = {
  filter?: ModelLessonFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLessonsQuery = {
  listLessons?:  {
    __typename: "ModelLessonConnection",
    items:  Array< {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetAssignmentQueryVariables = {
  id: string,
};

export type GetAssignmentQuery = {
  getAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type ListAssignmentsQueryVariables = {
  filter?: ModelAssignmentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAssignmentsQuery = {
  listAssignments?:  {
    __typename: "ModelAssignmentConnection",
    items:  Array< {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSubmissionQueryVariables = {
  id: string,
};

export type GetSubmissionQuery = {
  getSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type ListSubmissionsQueryVariables = {
  filter?: ModelSubmissionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSubmissionsQuery = {
  listSubmissions?:  {
    __typename: "ModelSubmissionConnection",
    items:  Array< {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetEnrollmentQueryVariables = {
  id: string,
};

export type GetEnrollmentQuery = {
  getEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type ListEnrollmentsQueryVariables = {
  filter?: ModelEnrollmentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListEnrollmentsQuery = {
  listEnrollments?:  {
    __typename: "ModelEnrollmentConnection",
    items:  Array< {
      __typename: "Enrollment",
      id: string,
      studentId: string,
      createdAt: string,
      updatedAt: string,
      courseEnrollmentsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnCreateCourseSubscription = {
  onCreateCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnUpdateCourseSubscription = {
  onUpdateCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnDeleteCourseSubscription = {
  onDeleteCourse?:  {
    __typename: "Course",
    id: string,
    title: string,
    description?: string | null,
    gradeLevel?: string | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnCreateLessonSubscription = {
  onCreateLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type OnUpdateLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnUpdateLessonSubscription = {
  onUpdateLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type OnDeleteLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnDeleteLessonSubscription = {
  onDeleteLesson?:  {
    __typename: "Lesson",
    id: string,
    title: string,
    videoUrl?: string | null,
    order?: number | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type OnCreateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnCreateAssignmentSubscription = {
  onCreateAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type OnUpdateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnUpdateAssignmentSubscription = {
  onUpdateAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type OnDeleteAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnDeleteAssignmentSubscription = {
  onDeleteAssignment?:  {
    __typename: "Assignment",
    id: string,
    title: string,
    description?: string | null,
    dueDate?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseAssignmentsId?: string | null,
  } | null,
};

export type OnCreateSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnCreateSubmissionSubscription = {
  onCreateSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type OnUpdateSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnUpdateSubmissionSubscription = {
  onUpdateSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type OnDeleteSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnDeleteSubmissionSubscription = {
  onDeleteSubmission?:  {
    __typename: "Submission",
    id: string,
    studentId: string,
    content?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type OnCreateEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnCreateEnrollmentSubscription = {
  onCreateEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type OnUpdateEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnUpdateEnrollmentSubscription = {
  onUpdateEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type OnDeleteEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnDeleteEnrollmentSubscription = {
  onDeleteEnrollment?:  {
    __typename: "Enrollment",
    id: string,
    studentId: string,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseEnrollmentsId?: string | null,
  } | null,
};
