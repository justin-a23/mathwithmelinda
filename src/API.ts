/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateAcademicYearInput = {
  id?: string | null,
  year: string,
};

export type ModelAcademicYearConditionInput = {
  year?: ModelStringInput | null,
  and?: Array< ModelAcademicYearConditionInput | null > | null,
  or?: Array< ModelAcademicYearConditionInput | null > | null,
  not?: ModelAcademicYearConditionInput | null,
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

export type AcademicYear = {
  __typename: "AcademicYear",
  id: string,
  year: string,
  semesters?: ModelSemesterConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelSemesterConnection = {
  __typename: "ModelSemesterConnection",
  items:  Array<Semester | null >,
  nextToken?: string | null,
};

export type Semester = {
  __typename: "Semester",
  id: string,
  name: string,
  startDate: string,
  endDate: string,
  isActive?: boolean | null,
  academicYear?: AcademicYear | null,
  enrollments?: ModelEnrollmentConnection | null,
  weeklyPlans?: ModelWeeklyPlanConnection | null,
  createdAt: string,
  updatedAt: string,
  academicYearSemestersId?: string | null,
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
  planType?: string | null,
  course?: Course | null,
  semester?: Semester | null,
  createdAt: string,
  updatedAt: string,
  semesterEnrollmentsId?: string | null,
  courseEnrollmentsId?: string | null,
};

export type Course = {
  __typename: "Course",
  id: string,
  title: string,
  description?: string | null,
  gradeLevel?: string | null,
  isArchived?: boolean | null,
  lessons?: ModelLessonConnection | null,
  assignments?: ModelAssignmentConnection | null,
  enrollments?: ModelEnrollmentConnection | null,
  weeklyPlans?: ModelWeeklyPlanConnection | null,
  lessonTemplates?: ModelLessonTemplateConnection | null,
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
  isPublished?: boolean | null,
  course?: Course | null,
  weeklyPlanItems?: ModelWeeklyPlanItemConnection | null,
  createdAt: string,
  updatedAt: string,
  courseLessonsId?: string | null,
};

export type ModelWeeklyPlanItemConnection = {
  __typename: "ModelWeeklyPlanItemConnection",
  items:  Array<WeeklyPlanItem | null >,
  nextToken?: string | null,
};

export type WeeklyPlanItem = {
  __typename: "WeeklyPlanItem",
  id: string,
  dayOfWeek: string,
  dueTime?: string | null,
  isPublished?: boolean | null,
  lesson?: Lesson | null,
  weeklyPlan?: WeeklyPlan | null,
  assignments?: ModelAssignmentConnection | null,
  createdAt: string,
  updatedAt: string,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
};

export type WeeklyPlan = {
  __typename: "WeeklyPlan",
  id: string,
  weekStartDate: string,
  semester?: Semester | null,
  course?: Course | null,
  items?: ModelWeeklyPlanItemConnection | null,
  createdAt: string,
  updatedAt: string,
  semesterWeeklyPlansId?: string | null,
  courseWeeklyPlansId?: string | null,
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
  weeklyPlanItemAssignmentsId?: string | null,
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
  teacherComment?: string | null,
  assignment?: Assignment | null,
  createdAt: string,
  updatedAt: string,
  assignmentSubmissionsId?: string | null,
};

export type ModelWeeklyPlanConnection = {
  __typename: "ModelWeeklyPlanConnection",
  items:  Array<WeeklyPlan | null >,
  nextToken?: string | null,
};

export type ModelLessonTemplateConnection = {
  __typename: "ModelLessonTemplateConnection",
  items:  Array<LessonTemplate | null >,
  nextToken?: string | null,
};

export type LessonTemplate = {
  __typename: "LessonTemplate",
  id: string,
  lessonNumber: number,
  title: string,
  instructions?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  course?: Course | null,
  createdAt: string,
  updatedAt: string,
  courseLessonTemplatesId?: string | null,
};

export type UpdateAcademicYearInput = {
  id: string,
  year?: string | null,
};

export type DeleteAcademicYearInput = {
  id: string,
};

export type CreateSemesterInput = {
  id?: string | null,
  name: string,
  startDate: string,
  endDate: string,
  isActive?: boolean | null,
  academicYearSemestersId?: string | null,
};

export type ModelSemesterConditionInput = {
  name?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  and?: Array< ModelSemesterConditionInput | null > | null,
  or?: Array< ModelSemesterConditionInput | null > | null,
  not?: ModelSemesterConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  academicYearSemestersId?: ModelIDInput | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
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

export type UpdateSemesterInput = {
  id: string,
  name?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  isActive?: boolean | null,
  academicYearSemestersId?: string | null,
};

export type DeleteSemesterInput = {
  id: string,
};

export type CreateCourseInput = {
  id?: string | null,
  title: string,
  description?: string | null,
  gradeLevel?: string | null,
  isArchived?: boolean | null,
};

export type ModelCourseConditionInput = {
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  and?: Array< ModelCourseConditionInput | null > | null,
  or?: Array< ModelCourseConditionInput | null > | null,
  not?: ModelCourseConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type UpdateCourseInput = {
  id: string,
  title?: string | null,
  description?: string | null,
  gradeLevel?: string | null,
  isArchived?: boolean | null,
};

export type DeleteCourseInput = {
  id: string,
};

export type CreateLessonInput = {
  id?: string | null,
  title: string,
  videoUrl?: string | null,
  order?: number | null,
  isPublished?: boolean | null,
  courseLessonsId?: string | null,
};

export type ModelLessonConditionInput = {
  title?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  order?: ModelIntInput | null,
  isPublished?: ModelBooleanInput | null,
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

export type UpdateLessonInput = {
  id: string,
  title?: string | null,
  videoUrl?: string | null,
  order?: number | null,
  isPublished?: boolean | null,
  courseLessonsId?: string | null,
};

export type DeleteLessonInput = {
  id: string,
};

export type CreateWeeklyPlanInput = {
  id?: string | null,
  weekStartDate: string,
  semesterWeeklyPlansId?: string | null,
  courseWeeklyPlansId?: string | null,
};

export type ModelWeeklyPlanConditionInput = {
  weekStartDate?: ModelStringInput | null,
  and?: Array< ModelWeeklyPlanConditionInput | null > | null,
  or?: Array< ModelWeeklyPlanConditionInput | null > | null,
  not?: ModelWeeklyPlanConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  semesterWeeklyPlansId?: ModelIDInput | null,
  courseWeeklyPlansId?: ModelIDInput | null,
};

export type UpdateWeeklyPlanInput = {
  id: string,
  weekStartDate?: string | null,
  semesterWeeklyPlansId?: string | null,
  courseWeeklyPlansId?: string | null,
};

export type DeleteWeeklyPlanInput = {
  id: string,
};

export type CreateWeeklyPlanItemInput = {
  id?: string | null,
  dayOfWeek: string,
  dueTime?: string | null,
  isPublished?: boolean | null,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
};

export type ModelWeeklyPlanItemConditionInput = {
  dayOfWeek?: ModelStringInput | null,
  dueTime?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  and?: Array< ModelWeeklyPlanItemConditionInput | null > | null,
  or?: Array< ModelWeeklyPlanItemConditionInput | null > | null,
  not?: ModelWeeklyPlanItemConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  lessonWeeklyPlanItemsId?: ModelIDInput | null,
  weeklyPlanItemsId?: ModelIDInput | null,
};

export type UpdateWeeklyPlanItemInput = {
  id: string,
  dayOfWeek?: string | null,
  dueTime?: string | null,
  isPublished?: boolean | null,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
};

export type DeleteWeeklyPlanItemInput = {
  id: string,
};

export type CreateAssignmentInput = {
  id?: string | null,
  title: string,
  description?: string | null,
  dueDate?: string | null,
  courseAssignmentsId?: string | null,
  weeklyPlanItemAssignmentsId?: string | null,
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
  weeklyPlanItemAssignmentsId?: ModelIDInput | null,
};

export type UpdateAssignmentInput = {
  id: string,
  title?: string | null,
  description?: string | null,
  dueDate?: string | null,
  courseAssignmentsId?: string | null,
  weeklyPlanItemAssignmentsId?: string | null,
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
  teacherComment?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type ModelSubmissionConditionInput = {
  studentId?: ModelStringInput | null,
  content?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
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
  teacherComment?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type DeleteSubmissionInput = {
  id: string,
};

export type CreateEnrollmentInput = {
  id?: string | null,
  studentId: string,
  planType?: string | null,
  semesterEnrollmentsId?: string | null,
  courseEnrollmentsId?: string | null,
};

export type ModelEnrollmentConditionInput = {
  studentId?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  and?: Array< ModelEnrollmentConditionInput | null > | null,
  or?: Array< ModelEnrollmentConditionInput | null > | null,
  not?: ModelEnrollmentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  semesterEnrollmentsId?: ModelIDInput | null,
  courseEnrollmentsId?: ModelIDInput | null,
};

export type UpdateEnrollmentInput = {
  id: string,
  studentId?: string | null,
  planType?: string | null,
  semesterEnrollmentsId?: string | null,
  courseEnrollmentsId?: string | null,
};

export type DeleteEnrollmentInput = {
  id: string,
};

export type CreateLessonTemplateInput = {
  id?: string | null,
  lessonNumber: number,
  title: string,
  instructions?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  courseLessonTemplatesId?: string | null,
};

export type ModelLessonTemplateConditionInput = {
  lessonNumber?: ModelIntInput | null,
  title?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  and?: Array< ModelLessonTemplateConditionInput | null > | null,
  or?: Array< ModelLessonTemplateConditionInput | null > | null,
  not?: ModelLessonTemplateConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  courseLessonTemplatesId?: ModelIDInput | null,
};

export type UpdateLessonTemplateInput = {
  id: string,
  lessonNumber?: number | null,
  title?: string | null,
  instructions?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  courseLessonTemplatesId?: string | null,
};

export type DeleteLessonTemplateInput = {
  id: string,
};

export type ModelAcademicYearFilterInput = {
  id?: ModelIDInput | null,
  year?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAcademicYearFilterInput | null > | null,
  or?: Array< ModelAcademicYearFilterInput | null > | null,
  not?: ModelAcademicYearFilterInput | null,
};

export type ModelAcademicYearConnection = {
  __typename: "ModelAcademicYearConnection",
  items:  Array<AcademicYear | null >,
  nextToken?: string | null,
};

export type ModelSemesterFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSemesterFilterInput | null > | null,
  or?: Array< ModelSemesterFilterInput | null > | null,
  not?: ModelSemesterFilterInput | null,
  academicYearSemestersId?: ModelIDInput | null,
};

export type ModelCourseFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
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
  isPublished?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelLessonFilterInput | null > | null,
  or?: Array< ModelLessonFilterInput | null > | null,
  not?: ModelLessonFilterInput | null,
  courseLessonsId?: ModelIDInput | null,
};

export type ModelWeeklyPlanFilterInput = {
  id?: ModelIDInput | null,
  weekStartDate?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelWeeklyPlanFilterInput | null > | null,
  or?: Array< ModelWeeklyPlanFilterInput | null > | null,
  not?: ModelWeeklyPlanFilterInput | null,
  semesterWeeklyPlansId?: ModelIDInput | null,
  courseWeeklyPlansId?: ModelIDInput | null,
};

export type ModelWeeklyPlanItemFilterInput = {
  id?: ModelIDInput | null,
  dayOfWeek?: ModelStringInput | null,
  dueTime?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelWeeklyPlanItemFilterInput | null > | null,
  or?: Array< ModelWeeklyPlanItemFilterInput | null > | null,
  not?: ModelWeeklyPlanItemFilterInput | null,
  lessonWeeklyPlanItemsId?: ModelIDInput | null,
  weeklyPlanItemsId?: ModelIDInput | null,
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
  weeklyPlanItemAssignmentsId?: ModelIDInput | null,
};

export type ModelSubmissionFilterInput = {
  id?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  content?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
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
  planType?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelEnrollmentFilterInput | null > | null,
  or?: Array< ModelEnrollmentFilterInput | null > | null,
  not?: ModelEnrollmentFilterInput | null,
  semesterEnrollmentsId?: ModelIDInput | null,
  courseEnrollmentsId?: ModelIDInput | null,
};

export type ModelLessonTemplateFilterInput = {
  id?: ModelIDInput | null,
  lessonNumber?: ModelIntInput | null,
  title?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelLessonTemplateFilterInput | null > | null,
  or?: Array< ModelLessonTemplateFilterInput | null > | null,
  not?: ModelLessonTemplateFilterInput | null,
  courseLessonTemplatesId?: ModelIDInput | null,
};

export type ModelSubscriptionAcademicYearFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  year?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAcademicYearFilterInput | null > | null,
  or?: Array< ModelSubscriptionAcademicYearFilterInput | null > | null,
  academicYearSemestersId?: ModelSubscriptionIDInput | null,
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

export type ModelSubscriptionSemesterFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSemesterFilterInput | null > | null,
  or?: Array< ModelSubscriptionSemesterFilterInput | null > | null,
  semesterEnrollmentsId?: ModelSubscriptionIDInput | null,
  semesterWeeklyPlansId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
};

export type ModelSubscriptionCourseFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  gradeLevel?: ModelSubscriptionStringInput | null,
  isArchived?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  or?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  courseLessonsId?: ModelSubscriptionIDInput | null,
  courseAssignmentsId?: ModelSubscriptionIDInput | null,
  courseEnrollmentsId?: ModelSubscriptionIDInput | null,
  courseWeeklyPlansId?: ModelSubscriptionIDInput | null,
  courseLessonTemplatesId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionLessonFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  order?: ModelSubscriptionIntInput | null,
  isPublished?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  or?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  lessonWeeklyPlanItemsId?: ModelSubscriptionIDInput | null,
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

export type ModelSubscriptionWeeklyPlanFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  weekStartDate?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionWeeklyPlanFilterInput | null > | null,
  or?: Array< ModelSubscriptionWeeklyPlanFilterInput | null > | null,
  weeklyPlanItemsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionWeeklyPlanItemFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  dayOfWeek?: ModelSubscriptionStringInput | null,
  dueTime?: ModelSubscriptionStringInput | null,
  isPublished?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionWeeklyPlanItemFilterInput | null > | null,
  or?: Array< ModelSubscriptionWeeklyPlanItemFilterInput | null > | null,
  weeklyPlanItemAssignmentsId?: ModelSubscriptionIDInput | null,
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
  teacherComment?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  or?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
};

export type ModelSubscriptionEnrollmentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  planType?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
  or?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
};

export type ModelSubscriptionLessonTemplateFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  lessonNumber?: ModelSubscriptionIntInput | null,
  title?: ModelSubscriptionStringInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  worksheetUrl?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
  or?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
};

export type CreateAcademicYearMutationVariables = {
  input: CreateAcademicYearInput,
  condition?: ModelAcademicYearConditionInput | null,
};

export type CreateAcademicYearMutation = {
  createAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateAcademicYearMutationVariables = {
  input: UpdateAcademicYearInput,
  condition?: ModelAcademicYearConditionInput | null,
};

export type UpdateAcademicYearMutation = {
  updateAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteAcademicYearMutationVariables = {
  input: DeleteAcademicYearInput,
  condition?: ModelAcademicYearConditionInput | null,
};

export type DeleteAcademicYearMutation = {
  deleteAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateSemesterMutationVariables = {
  input: CreateSemesterInput,
  condition?: ModelSemesterConditionInput | null,
};

export type CreateSemesterMutation = {
  createSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
};

export type UpdateSemesterMutationVariables = {
  input: UpdateSemesterInput,
  condition?: ModelSemesterConditionInput | null,
};

export type UpdateSemesterMutation = {
  updateSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
};

export type DeleteSemesterMutationVariables = {
  input: DeleteSemesterInput,
  condition?: ModelSemesterConditionInput | null,
};

export type DeleteSemesterMutation = {
  deleteSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type CreateWeeklyPlanMutationVariables = {
  input: CreateWeeklyPlanInput,
  condition?: ModelWeeklyPlanConditionInput | null,
};

export type CreateWeeklyPlanMutation = {
  createWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type UpdateWeeklyPlanMutationVariables = {
  input: UpdateWeeklyPlanInput,
  condition?: ModelWeeklyPlanConditionInput | null,
};

export type UpdateWeeklyPlanMutation = {
  updateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type DeleteWeeklyPlanMutationVariables = {
  input: DeleteWeeklyPlanInput,
  condition?: ModelWeeklyPlanConditionInput | null,
};

export type DeleteWeeklyPlanMutation = {
  deleteWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type CreateWeeklyPlanItemMutationVariables = {
  input: CreateWeeklyPlanItemInput,
  condition?: ModelWeeklyPlanItemConditionInput | null,
};

export type CreateWeeklyPlanItemMutation = {
  createWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
  } | null,
};

export type UpdateWeeklyPlanItemMutationVariables = {
  input: UpdateWeeklyPlanItemInput,
  condition?: ModelWeeklyPlanItemConditionInput | null,
};

export type UpdateWeeklyPlanItemMutation = {
  updateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
  } | null,
};

export type DeleteWeeklyPlanItemMutationVariables = {
  input: DeleteWeeklyPlanItemInput,
  condition?: ModelWeeklyPlanItemConditionInput | null,
};

export type DeleteWeeklyPlanItemMutation = {
  deleteWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type CreateLessonTemplateMutationVariables = {
  input: CreateLessonTemplateInput,
  condition?: ModelLessonTemplateConditionInput | null,
};

export type CreateLessonTemplateMutation = {
  createLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type UpdateLessonTemplateMutationVariables = {
  input: UpdateLessonTemplateInput,
  condition?: ModelLessonTemplateConditionInput | null,
};

export type UpdateLessonTemplateMutation = {
  updateLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type DeleteLessonTemplateMutationVariables = {
  input: DeleteLessonTemplateInput,
  condition?: ModelLessonTemplateConditionInput | null,
};

export type DeleteLessonTemplateMutation = {
  deleteLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type GetAcademicYearQueryVariables = {
  id: string,
};

export type GetAcademicYearQuery = {
  getAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListAcademicYearsQueryVariables = {
  filter?: ModelAcademicYearFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAcademicYearsQuery = {
  listAcademicYears?:  {
    __typename: "ModelAcademicYearConnection",
    items:  Array< {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSemesterQueryVariables = {
  id: string,
};

export type GetSemesterQuery = {
  getSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
};

export type ListSemestersQueryVariables = {
  filter?: ModelSemesterFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSemestersQuery = {
  listSemesters?:  {
    __typename: "ModelSemesterConnection",
    items:  Array< {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null >,
    nextToken?: string | null,
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
      isArchived?: boolean | null,
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
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
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetWeeklyPlanQueryVariables = {
  id: string,
};

export type GetWeeklyPlanQuery = {
  getWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type ListWeeklyPlansQueryVariables = {
  filter?: ModelWeeklyPlanFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWeeklyPlansQuery = {
  listWeeklyPlans?:  {
    __typename: "ModelWeeklyPlanConnection",
    items:  Array< {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetWeeklyPlanItemQueryVariables = {
  id: string,
};

export type GetWeeklyPlanItemQuery = {
  getWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
  } | null,
};

export type ListWeeklyPlanItemsQueryVariables = {
  filter?: ModelWeeklyPlanItemFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWeeklyPlanItemsQuery = {
  listWeeklyPlanItems?:  {
    __typename: "ModelWeeklyPlanItemConnection",
    items:  Array< {
      __typename: "WeeklyPlanItem",
      id: string,
      dayOfWeek: string,
      dueTime?: string | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      lessonWeeklyPlanItemsId?: string | null,
      weeklyPlanItemsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
      weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
      teacherComment?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
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
      planType?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterEnrollmentsId?: string | null,
      courseEnrollmentsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetLessonTemplateQueryVariables = {
  id: string,
};

export type GetLessonTemplateQuery = {
  getLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type ListLessonTemplatesQueryVariables = {
  filter?: ModelLessonTemplateFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLessonTemplatesQuery = {
  listLessonTemplates?:  {
    __typename: "ModelLessonTemplateConnection",
    items:  Array< {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnCreateAcademicYearSubscription = {
  onCreateAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnUpdateAcademicYearSubscription = {
  onUpdateAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnDeleteAcademicYearSubscription = {
  onDeleteAcademicYear?:  {
    __typename: "AcademicYear",
    id: string,
    year: string,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnCreateSemesterSubscription = {
  onCreateSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
};

export type OnUpdateSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnUpdateSemesterSubscription = {
  onUpdateSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
  } | null,
};

export type OnDeleteSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnDeleteSemesterSubscription = {
  onDeleteSemester?:  {
    __typename: "Semester",
    id: string,
    name: string,
    startDate: string,
    endDate: string,
    isActive?: boolean | null,
    academicYear?:  {
      __typename: "AcademicYear",
      id: string,
      year: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isArchived?: boolean | null,
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
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
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
    isPublished?: boolean | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonsId?: string | null,
  } | null,
};

export type OnCreateWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnCreateWeeklyPlanSubscription = {
  onCreateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type OnUpdateWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnUpdateWeeklyPlanSubscription = {
  onUpdateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type OnDeleteWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnDeleteWeeklyPlanSubscription = {
  onDeleteWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    id: string,
    weekStartDate: string,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterWeeklyPlansId?: string | null,
    courseWeeklyPlansId?: string | null,
  } | null,
};

export type OnCreateWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnCreateWeeklyPlanItemSubscription = {
  onCreateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
  } | null,
};

export type OnUpdateWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnUpdateWeeklyPlanItemSubscription = {
  onUpdateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
  } | null,
};

export type OnDeleteWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnDeleteWeeklyPlanItemSubscription = {
  onDeleteWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    id: string,
    dayOfWeek: string,
    dueTime?: string | null,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      id: string,
      title: string,
      videoUrl?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonWeeklyPlanItemsId?: string | null,
    weeklyPlanItemsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
      isArchived?: boolean | null,
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
    weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    teacherComment?: string | null,
    assignment?:  {
      __typename: "Assignment",
      id: string,
      title: string,
      description?: string | null,
      dueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      courseAssignmentsId?: string | null,
      weeklyPlanItemAssignmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
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
    planType?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    semesterEnrollmentsId?: string | null,
    courseEnrollmentsId?: string | null,
  } | null,
};

export type OnCreateLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnCreateLessonTemplateSubscription = {
  onCreateLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type OnUpdateLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnUpdateLessonTemplateSubscription = {
  onUpdateLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type OnDeleteLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnDeleteLessonTemplateSubscription = {
  onDeleteLessonTemplate?:  {
    __typename: "LessonTemplate",
    id: string,
    lessonNumber: number,
    title: string,
    instructions?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    course?:  {
      __typename: "Course",
      id: string,
      title: string,
      description?: string | null,
      gradeLevel?: string | null,
      isArchived?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};
