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
  courseId?: string | null,
  course?: Course | null,
  academicYear?: AcademicYear | null,
  enrollments?: ModelEnrollmentConnection | null,
  weeklyPlans?: ModelWeeklyPlanConnection | null,
  lessonWeightPercent?: number | null,
  testWeightPercent?: number | null,
  quizWeightPercent?: number | null,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  semesterType?: string | null,
  createdAt: string,
  updatedAt: string,
  academicYearSemestersId?: string | null,
  courseSemestersId?: string | null,
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
  semesters?: ModelSemesterConnection | null,
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
  instructions?: string | null,
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
  lessonTemplateId?: string | null,
  weeklyPlan?: WeeklyPlan | null,
  assignments?: ModelAssignmentConnection | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
  createdAt: string,
  updatedAt: string,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
};

export type WeeklyPlan = {
  __typename: "WeeklyPlan",
  id: string,
  weekStartDate: string,
  assignedStudentIds?: string | null,
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
  answers?: string | null,
  imageUrls?: string | null,
  lessonTemplateId?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  teacherComment?: string | null,
  isArchived?: boolean | null,
  archivedAt?: string | null,
  status?: string | null,
  returnReason?: string | null,
  returnDueDate?: string | null,
  assignment?: Assignment | null,
  messages?: ModelSubmissionMessageConnection | null,
  createdAt: string,
  updatedAt: string,
  assignmentSubmissionsId?: string | null,
};

export type ModelSubmissionMessageConnection = {
  __typename: "ModelSubmissionMessageConnection",
  items:  Array<SubmissionMessage | null >,
  nextToken?: string | null,
};

export type SubmissionMessage = {
  __typename: "SubmissionMessage",
  id: string,
  senderId: string,
  senderType: string,
  message: string,
  isRead?: boolean | null,
  submission?: Submission | null,
  createdAt: string,
  updatedAt: string,
  submissionMessagesId?: string | null,
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
  teachingNotes?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  assignmentType?: string | null,
  lessonCategory?: string | null,
  course?: Course | null,
  questions?: ModelAssignmentQuestionConnection | null,
  createdAt: string,
  updatedAt: string,
  courseLessonTemplatesId?: string | null,
};

export type ModelAssignmentQuestionConnection = {
  __typename: "ModelAssignmentQuestionConnection",
  items:  Array<AssignmentQuestion | null >,
  nextToken?: string | null,
};

export type AssignmentQuestion = {
  __typename: "AssignmentQuestion",
  id: string,
  order: number,
  questionText: string,
  questionType: string,
  choices?: string | null,
  correctAnswer?: string | null,
  diagramKey?: string | null,
  lessonTemplate?: LessonTemplate | null,
  createdAt: string,
  updatedAt: string,
  lessonTemplateQuestionsId?: string | null,
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
  courseId?: string | null,
  lessonWeightPercent?: number | null,
  testWeightPercent?: number | null,
  quizWeightPercent?: number | null,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  semesterType?: string | null,
  academicYearSemestersId?: string | null,
  courseSemestersId?: string | null,
};

export type ModelSemesterConditionInput = {
  name?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  courseId?: ModelIDInput | null,
  lessonWeightPercent?: ModelIntInput | null,
  testWeightPercent?: ModelIntInput | null,
  quizWeightPercent?: ModelIntInput | null,
  gradeA?: ModelIntInput | null,
  gradeB?: ModelIntInput | null,
  gradeC?: ModelIntInput | null,
  gradeD?: ModelIntInput | null,
  semesterType?: ModelStringInput | null,
  and?: Array< ModelSemesterConditionInput | null > | null,
  or?: Array< ModelSemesterConditionInput | null > | null,
  not?: ModelSemesterConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  academicYearSemestersId?: ModelIDInput | null,
  courseSemestersId?: ModelIDInput | null,
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

export type UpdateSemesterInput = {
  id: string,
  name?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  isActive?: boolean | null,
  courseId?: string | null,
  lessonWeightPercent?: number | null,
  testWeightPercent?: number | null,
  quizWeightPercent?: number | null,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  semesterType?: string | null,
  academicYearSemestersId?: string | null,
  courseSemestersId?: string | null,
};

export type DeleteSemesterInput = {
  id: string,
};

export type CreateStudentInviteInput = {
  id?: string | null,
  token: string,
  firstName: string,
  lastName: string,
  email: string,
  courseId?: string | null,
  courseTitle?: string | null,
  semesterId?: string | null,
  planType: string,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  parentEmail?: string | null,
  used?: boolean | null,
};

export type ModelStudentInviteConditionInput = {
  token?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  email?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  parentEmail?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
  and?: Array< ModelStudentInviteConditionInput | null > | null,
  or?: Array< ModelStudentInviteConditionInput | null > | null,
  not?: ModelStudentInviteConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type StudentInvite = {
  __typename: "StudentInvite",
  id: string,
  token: string,
  firstName: string,
  lastName: string,
  email: string,
  courseId?: string | null,
  courseTitle?: string | null,
  semesterId?: string | null,
  planType: string,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  parentEmail?: string | null,
  used?: boolean | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateStudentInviteInput = {
  id: string,
  token?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  courseId?: string | null,
  courseTitle?: string | null,
  semesterId?: string | null,
  planType?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  parentEmail?: string | null,
  used?: boolean | null,
};

export type DeleteStudentInviteInput = {
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
  instructions?: string | null,
  order?: number | null,
  isPublished?: boolean | null,
  courseLessonsId?: string | null,
};

export type ModelLessonConditionInput = {
  title?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  order?: ModelIntInput | null,
  isPublished?: ModelBooleanInput | null,
  and?: Array< ModelLessonConditionInput | null > | null,
  or?: Array< ModelLessonConditionInput | null > | null,
  not?: ModelLessonConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  courseLessonsId?: ModelIDInput | null,
};

export type UpdateLessonInput = {
  id: string,
  title?: string | null,
  videoUrl?: string | null,
  instructions?: string | null,
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
  assignedStudentIds?: string | null,
  semesterWeeklyPlansId?: string | null,
  courseWeeklyPlansId?: string | null,
};

export type ModelWeeklyPlanConditionInput = {
  weekStartDate?: ModelStringInput | null,
  assignedStudentIds?: ModelStringInput | null,
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
  assignedStudentIds?: string | null,
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
  lessonTemplateId?: string | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
};

export type ModelWeeklyPlanItemConditionInput = {
  dayOfWeek?: ModelStringInput | null,
  dueTime?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  lessonTemplateId?: ModelIDInput | null,
  zoomJoinUrl?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  zoomStartTime?: ModelStringInput | null,
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
  lessonTemplateId?: string | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
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
  answers?: string | null,
  imageUrls?: string | null,
  lessonTemplateId?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  teacherComment?: string | null,
  isArchived?: boolean | null,
  archivedAt?: string | null,
  status?: string | null,
  returnReason?: string | null,
  returnDueDate?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type ModelSubmissionConditionInput = {
  studentId?: ModelStringInput | null,
  content?: ModelStringInput | null,
  answers?: ModelStringInput | null,
  imageUrls?: ModelStringInput | null,
  lessonTemplateId?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  archivedAt?: ModelStringInput | null,
  status?: ModelStringInput | null,
  returnReason?: ModelStringInput | null,
  returnDueDate?: ModelStringInput | null,
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
  answers?: string | null,
  imageUrls?: string | null,
  lessonTemplateId?: string | null,
  grade?: string | null,
  submittedAt?: string | null,
  teacherComment?: string | null,
  isArchived?: boolean | null,
  archivedAt?: string | null,
  status?: string | null,
  returnReason?: string | null,
  returnDueDate?: string | null,
  assignmentSubmissionsId?: string | null,
};

export type DeleteSubmissionInput = {
  id: string,
};

export type CreateSubmissionMessageInput = {
  id?: string | null,
  senderId: string,
  senderType: string,
  message: string,
  isRead?: boolean | null,
  submissionMessagesId?: string | null,
};

export type ModelSubmissionMessageConditionInput = {
  senderId?: ModelStringInput | null,
  senderType?: ModelStringInput | null,
  message?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  and?: Array< ModelSubmissionMessageConditionInput | null > | null,
  or?: Array< ModelSubmissionMessageConditionInput | null > | null,
  not?: ModelSubmissionMessageConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  submissionMessagesId?: ModelIDInput | null,
};

export type UpdateSubmissionMessageInput = {
  id: string,
  senderId?: string | null,
  senderType?: string | null,
  message?: string | null,
  isRead?: boolean | null,
  submissionMessagesId?: string | null,
};

export type DeleteSubmissionMessageInput = {
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
  teachingNotes?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  assignmentType?: string | null,
  lessonCategory?: string | null,
  courseLessonTemplatesId?: string | null,
};

export type ModelLessonTemplateConditionInput = {
  lessonNumber?: ModelIntInput | null,
  title?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  teachingNotes?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  assignmentType?: ModelStringInput | null,
  lessonCategory?: ModelStringInput | null,
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
  teachingNotes?: string | null,
  worksheetUrl?: string | null,
  videoUrl?: string | null,
  assignmentType?: string | null,
  lessonCategory?: string | null,
  courseLessonTemplatesId?: string | null,
};

export type DeleteLessonTemplateInput = {
  id: string,
};

export type CreateAssignmentQuestionInput = {
  id?: string | null,
  order: number,
  questionText: string,
  questionType: string,
  choices?: string | null,
  correctAnswer?: string | null,
  diagramKey?: string | null,
  lessonTemplateQuestionsId?: string | null,
};

export type ModelAssignmentQuestionConditionInput = {
  order?: ModelIntInput | null,
  questionText?: ModelStringInput | null,
  questionType?: ModelStringInput | null,
  choices?: ModelStringInput | null,
  correctAnswer?: ModelStringInput | null,
  diagramKey?: ModelStringInput | null,
  and?: Array< ModelAssignmentQuestionConditionInput | null > | null,
  or?: Array< ModelAssignmentQuestionConditionInput | null > | null,
  not?: ModelAssignmentQuestionConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  lessonTemplateQuestionsId?: ModelIDInput | null,
};

export type UpdateAssignmentQuestionInput = {
  id: string,
  order?: number | null,
  questionText?: string | null,
  questionType?: string | null,
  choices?: string | null,
  correctAnswer?: string | null,
  diagramKey?: string | null,
  lessonTemplateQuestionsId?: string | null,
};

export type DeleteAssignmentQuestionInput = {
  id: string,
};

export type CreateTeacherProfileInput = {
  id?: string | null,
  userId: string,
  email: string,
  displayName?: string | null,
  bio?: string | null,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
};

export type ModelTeacherProfileConditionInput = {
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  bio?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  teachingVoice?: ModelStringInput | null,
  and?: Array< ModelTeacherProfileConditionInput | null > | null,
  or?: Array< ModelTeacherProfileConditionInput | null > | null,
  not?: ModelTeacherProfileConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type TeacherProfile = {
  __typename: "TeacherProfile",
  id: string,
  userId: string,
  email: string,
  displayName?: string | null,
  bio?: string | null,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateTeacherProfileInput = {
  id: string,
  userId?: string | null,
  email?: string | null,
  displayName?: string | null,
  bio?: string | null,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
};

export type DeleteTeacherProfileInput = {
  id: string,
};

export type CreateVideoWatchInput = {
  id?: string | null,
  studentId: string,
  lessonId: string,
  weeklyPlanItemId?: string | null,
  watchedSeconds?: number | null,
  durationSeconds?: number | null,
  percentWatched?: number | null,
  completed?: boolean | null,
  lastWatchedAt?: string | null,
};

export type ModelVideoWatchConditionInput = {
  studentId?: ModelStringInput | null,
  lessonId?: ModelStringInput | null,
  weeklyPlanItemId?: ModelStringInput | null,
  watchedSeconds?: ModelFloatInput | null,
  durationSeconds?: ModelFloatInput | null,
  percentWatched?: ModelFloatInput | null,
  completed?: ModelBooleanInput | null,
  lastWatchedAt?: ModelStringInput | null,
  and?: Array< ModelVideoWatchConditionInput | null > | null,
  or?: Array< ModelVideoWatchConditionInput | null > | null,
  not?: ModelVideoWatchConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelFloatInput = {
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

export type VideoWatch = {
  __typename: "VideoWatch",
  id: string,
  studentId: string,
  lessonId: string,
  weeklyPlanItemId?: string | null,
  watchedSeconds?: number | null,
  durationSeconds?: number | null,
  percentWatched?: number | null,
  completed?: boolean | null,
  lastWatchedAt?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateVideoWatchInput = {
  id: string,
  studentId?: string | null,
  lessonId?: string | null,
  weeklyPlanItemId?: string | null,
  watchedSeconds?: number | null,
  durationSeconds?: number | null,
  percentWatched?: number | null,
  completed?: boolean | null,
  lastWatchedAt?: string | null,
};

export type DeleteVideoWatchInput = {
  id: string,
};

export type CreateParentInviteInput = {
  id?: string | null,
  token: string,
  studentEmail: string,
  studentName: string,
  used?: boolean | null,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
};

export type ModelParentInviteConditionInput = {
  token?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  and?: Array< ModelParentInviteConditionInput | null > | null,
  or?: Array< ModelParentInviteConditionInput | null > | null,
  not?: ModelParentInviteConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ParentInvite = {
  __typename: "ParentInvite",
  id: string,
  token: string,
  studentEmail: string,
  studentName: string,
  used?: boolean | null,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateParentInviteInput = {
  id: string,
  token?: string | null,
  studentEmail?: string | null,
  studentName?: string | null,
  used?: boolean | null,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
};

export type DeleteParentInviteInput = {
  id: string,
};

export type CreateParentStudentInput = {
  id?: string | null,
  parentId: string,
  studentEmail: string,
  studentName: string,
};

export type ModelParentStudentConditionInput = {
  parentId?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  and?: Array< ModelParentStudentConditionInput | null > | null,
  or?: Array< ModelParentStudentConditionInput | null > | null,
  not?: ModelParentStudentConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ParentStudent = {
  __typename: "ParentStudent",
  id: string,
  parentId: string,
  studentEmail: string,
  studentName: string,
  createdAt: string,
  updatedAt: string,
};

export type UpdateParentStudentInput = {
  id: string,
  parentId?: string | null,
  studentEmail?: string | null,
  studentName?: string | null,
};

export type DeleteParentStudentInput = {
  id: string,
};

export type CreateStudentProfileInput = {
  id?: string | null,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  preferredName?: string | null,
  gradeLevel?: string | null,
  courseId?: string | null,
  planType?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  parentEmail?: string | null,
  parentName?: string | null,
  parentEmail2?: string | null,
  parentName2?: string | null,
};

export type ModelStudentProfileConditionInput = {
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  preferredName?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  status?: ModelStringInput | null,
  statusReason?: ModelStringInput | null,
  parentEmail?: ModelStringInput | null,
  parentName?: ModelStringInput | null,
  parentEmail2?: ModelStringInput | null,
  parentName2?: ModelStringInput | null,
  and?: Array< ModelStudentProfileConditionInput | null > | null,
  or?: Array< ModelStudentProfileConditionInput | null > | null,
  not?: ModelStudentProfileConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type StudentProfile = {
  __typename: "StudentProfile",
  id: string,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  preferredName?: string | null,
  gradeLevel?: string | null,
  courseId?: string | null,
  planType?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  parentEmail?: string | null,
  parentName?: string | null,
  parentEmail2?: string | null,
  parentName2?: string | null,
  parentLinks?: ModelParentStudentLinkConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelParentStudentLinkConnection = {
  __typename: "ModelParentStudentLinkConnection",
  items:  Array<ParentStudentLink | null >,
  nextToken?: string | null,
};

export type ParentStudentLink = {
  __typename: "ParentStudentLink",
  id: string,
  parentProfileId: string,
  parentProfile?: ParentProfile | null,
  studentProfileId: string,
  studentProfile?: StudentProfile | null,
  createdAt: string,
  updatedAt: string,
  studentProfileParentLinksId?: string | null,
  parentProfileStudentLinksId?: string | null,
};

export type ParentProfile = {
  __typename: "ParentProfile",
  id: string,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  studentLinks?: ModelParentStudentLinkConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateStudentProfileInput = {
  id: string,
  userId?: string | null,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  preferredName?: string | null,
  gradeLevel?: string | null,
  courseId?: string | null,
  planType?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  parentEmail?: string | null,
  parentName?: string | null,
  parentEmail2?: string | null,
  parentName2?: string | null,
};

export type DeleteStudentProfileInput = {
  id: string,
};

export type CreateParentProfileInput = {
  id?: string | null,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
};

export type ModelParentProfileConditionInput = {
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  and?: Array< ModelParentProfileConditionInput | null > | null,
  or?: Array< ModelParentProfileConditionInput | null > | null,
  not?: ModelParentProfileConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type UpdateParentProfileInput = {
  id: string,
  userId?: string | null,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
};

export type DeleteParentProfileInput = {
  id: string,
};

export type CreateParentStudentLinkInput = {
  id?: string | null,
  parentProfileId: string,
  studentProfileId: string,
  studentProfileParentLinksId?: string | null,
  parentProfileStudentLinksId?: string | null,
};

export type ModelParentStudentLinkConditionInput = {
  parentProfileId?: ModelIDInput | null,
  studentProfileId?: ModelIDInput | null,
  and?: Array< ModelParentStudentLinkConditionInput | null > | null,
  or?: Array< ModelParentStudentLinkConditionInput | null > | null,
  not?: ModelParentStudentLinkConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  studentProfileParentLinksId?: ModelIDInput | null,
  parentProfileStudentLinksId?: ModelIDInput | null,
};

export type UpdateParentStudentLinkInput = {
  id: string,
  parentProfileId?: string | null,
  studentProfileId?: string | null,
  studentProfileParentLinksId?: string | null,
  parentProfileStudentLinksId?: string | null,
};

export type DeleteParentStudentLinkInput = {
  id: string,
};

export type CreateMessageInput = {
  id?: string | null,
  studentId: string,
  studentName?: string | null,
  content: string,
  sentAt: string,
  isRead?: boolean | null,
  teacherReply?: string | null,
  repliedAt?: string | null,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isTeacherInitiated?: boolean | null,
};

export type ModelMessageConditionInput = {
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  content?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  teacherReply?: ModelStringInput | null,
  repliedAt?: ModelStringInput | null,
  isArchivedByTeacher?: ModelBooleanInput | null,
  isDeletedByStudent?: ModelBooleanInput | null,
  isTeacherInitiated?: ModelBooleanInput | null,
  and?: Array< ModelMessageConditionInput | null > | null,
  or?: Array< ModelMessageConditionInput | null > | null,
  not?: ModelMessageConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Message = {
  __typename: "Message",
  id: string,
  studentId: string,
  studentName?: string | null,
  content: string,
  sentAt: string,
  isRead?: boolean | null,
  teacherReply?: string | null,
  repliedAt?: string | null,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isTeacherInitiated?: boolean | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateMessageInput = {
  id: string,
  studentId?: string | null,
  studentName?: string | null,
  content?: string | null,
  sentAt?: string | null,
  isRead?: boolean | null,
  teacherReply?: string | null,
  repliedAt?: string | null,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isTeacherInitiated?: boolean | null,
};

export type DeleteMessageInput = {
  id: string,
};

export type CreateSyllabusInput = {
  id?: string | null,
  semesterId: string,
  courseId: string,
  pdfKey?: string | null,
  publishedPdfKey?: string | null,
  publishedAt?: string | null,
};

export type ModelSyllabusConditionInput = {
  semesterId?: ModelIDInput | null,
  courseId?: ModelIDInput | null,
  pdfKey?: ModelStringInput | null,
  publishedPdfKey?: ModelStringInput | null,
  publishedAt?: ModelStringInput | null,
  and?: Array< ModelSyllabusConditionInput | null > | null,
  or?: Array< ModelSyllabusConditionInput | null > | null,
  not?: ModelSyllabusConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Syllabus = {
  __typename: "Syllabus",
  id: string,
  semesterId: string,
  courseId: string,
  pdfKey?: string | null,
  publishedPdfKey?: string | null,
  publishedAt?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateSyllabusInput = {
  id: string,
  semesterId?: string | null,
  courseId?: string | null,
  pdfKey?: string | null,
  publishedPdfKey?: string | null,
  publishedAt?: string | null,
};

export type DeleteSyllabusInput = {
  id: string,
};

export type CreateZoomMeetingInput = {
  id?: string | null,
  topic: string,
  zoomMeetingId?: string | null,
  joinUrl: string,
  startUrl?: string | null,
  startTime: string,
  durationMinutes: number,
  inviteeType: string,
  courseId?: string | null,
  courseTitle?: string | null,
  studentIds?: string | null,
  parentId?: string | null,
  notes?: string | null,
};

export type ModelZoomMeetingConditionInput = {
  topic?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  joinUrl?: ModelStringInput | null,
  startUrl?: ModelStringInput | null,
  startTime?: ModelStringInput | null,
  durationMinutes?: ModelIntInput | null,
  inviteeType?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  studentIds?: ModelStringInput | null,
  parentId?: ModelStringInput | null,
  notes?: ModelStringInput | null,
  and?: Array< ModelZoomMeetingConditionInput | null > | null,
  or?: Array< ModelZoomMeetingConditionInput | null > | null,
  not?: ModelZoomMeetingConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ZoomMeeting = {
  __typename: "ZoomMeeting",
  id: string,
  topic: string,
  zoomMeetingId?: string | null,
  joinUrl: string,
  startUrl?: string | null,
  startTime: string,
  durationMinutes: number,
  inviteeType: string,
  courseId?: string | null,
  courseTitle?: string | null,
  studentIds?: string | null,
  parentId?: string | null,
  notes?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateZoomMeetingInput = {
  id: string,
  topic?: string | null,
  zoomMeetingId?: string | null,
  joinUrl?: string | null,
  startUrl?: string | null,
  startTime?: string | null,
  durationMinutes?: number | null,
  inviteeType?: string | null,
  courseId?: string | null,
  courseTitle?: string | null,
  studentIds?: string | null,
  parentId?: string | null,
  notes?: string | null,
};

export type DeleteZoomMeetingInput = {
  id: string,
};

export type CreateAnnouncementInput = {
  id?: string | null,
  subject: string,
  message: string,
  sentAt: string,
  recipientIds: string,
  recipientCount?: number | null,
  courseId?: string | null,
  courseTitle?: string | null,
};

export type ModelAnnouncementConditionInput = {
  subject?: ModelStringInput | null,
  message?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  recipientIds?: ModelStringInput | null,
  recipientCount?: ModelIntInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  and?: Array< ModelAnnouncementConditionInput | null > | null,
  or?: Array< ModelAnnouncementConditionInput | null > | null,
  not?: ModelAnnouncementConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Announcement = {
  __typename: "Announcement",
  id: string,
  subject: string,
  message: string,
  sentAt: string,
  recipientIds: string,
  recipientCount?: number | null,
  courseId?: string | null,
  courseTitle?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateAnnouncementInput = {
  id: string,
  subject?: string | null,
  message?: string | null,
  sentAt?: string | null,
  recipientIds?: string | null,
  recipientCount?: number | null,
  courseId?: string | null,
  courseTitle?: string | null,
};

export type DeleteAnnouncementInput = {
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
  courseId?: ModelIDInput | null,
  lessonWeightPercent?: ModelIntInput | null,
  testWeightPercent?: ModelIntInput | null,
  quizWeightPercent?: ModelIntInput | null,
  gradeA?: ModelIntInput | null,
  gradeB?: ModelIntInput | null,
  gradeC?: ModelIntInput | null,
  gradeD?: ModelIntInput | null,
  semesterType?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSemesterFilterInput | null > | null,
  or?: Array< ModelSemesterFilterInput | null > | null,
  not?: ModelSemesterFilterInput | null,
  academicYearSemestersId?: ModelIDInput | null,
  courseSemestersId?: ModelIDInput | null,
};

export type ModelStudentInviteFilterInput = {
  id?: ModelIDInput | null,
  token?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  email?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  parentEmail?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelStudentInviteFilterInput | null > | null,
  or?: Array< ModelStudentInviteFilterInput | null > | null,
  not?: ModelStudentInviteFilterInput | null,
};

export type ModelStudentInviteConnection = {
  __typename: "ModelStudentInviteConnection",
  items:  Array<StudentInvite | null >,
  nextToken?: string | null,
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
  instructions?: ModelStringInput | null,
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
  assignedStudentIds?: ModelStringInput | null,
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
  lessonTemplateId?: ModelIDInput | null,
  zoomJoinUrl?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  zoomStartTime?: ModelStringInput | null,
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
  answers?: ModelStringInput | null,
  imageUrls?: ModelStringInput | null,
  lessonTemplateId?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  archivedAt?: ModelStringInput | null,
  status?: ModelStringInput | null,
  returnReason?: ModelStringInput | null,
  returnDueDate?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSubmissionFilterInput | null > | null,
  or?: Array< ModelSubmissionFilterInput | null > | null,
  not?: ModelSubmissionFilterInput | null,
  assignmentSubmissionsId?: ModelIDInput | null,
};

export type ModelSubmissionMessageFilterInput = {
  id?: ModelIDInput | null,
  senderId?: ModelStringInput | null,
  senderType?: ModelStringInput | null,
  message?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSubmissionMessageFilterInput | null > | null,
  or?: Array< ModelSubmissionMessageFilterInput | null > | null,
  not?: ModelSubmissionMessageFilterInput | null,
  submissionMessagesId?: ModelIDInput | null,
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
  teachingNotes?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  assignmentType?: ModelStringInput | null,
  lessonCategory?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelLessonTemplateFilterInput | null > | null,
  or?: Array< ModelLessonTemplateFilterInput | null > | null,
  not?: ModelLessonTemplateFilterInput | null,
  courseLessonTemplatesId?: ModelIDInput | null,
};

export type ModelAssignmentQuestionFilterInput = {
  id?: ModelIDInput | null,
  order?: ModelIntInput | null,
  questionText?: ModelStringInput | null,
  questionType?: ModelStringInput | null,
  choices?: ModelStringInput | null,
  correctAnswer?: ModelStringInput | null,
  diagramKey?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAssignmentQuestionFilterInput | null > | null,
  or?: Array< ModelAssignmentQuestionFilterInput | null > | null,
  not?: ModelAssignmentQuestionFilterInput | null,
  lessonTemplateQuestionsId?: ModelIDInput | null,
};

export type ModelTeacherProfileFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  bio?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  teachingVoice?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTeacherProfileFilterInput | null > | null,
  or?: Array< ModelTeacherProfileFilterInput | null > | null,
  not?: ModelTeacherProfileFilterInput | null,
};

export type ModelTeacherProfileConnection = {
  __typename: "ModelTeacherProfileConnection",
  items:  Array<TeacherProfile | null >,
  nextToken?: string | null,
};

export type ModelVideoWatchFilterInput = {
  id?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  lessonId?: ModelStringInput | null,
  weeklyPlanItemId?: ModelStringInput | null,
  watchedSeconds?: ModelFloatInput | null,
  durationSeconds?: ModelFloatInput | null,
  percentWatched?: ModelFloatInput | null,
  completed?: ModelBooleanInput | null,
  lastWatchedAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVideoWatchFilterInput | null > | null,
  or?: Array< ModelVideoWatchFilterInput | null > | null,
  not?: ModelVideoWatchFilterInput | null,
};

export type ModelVideoWatchConnection = {
  __typename: "ModelVideoWatchConnection",
  items:  Array<VideoWatch | null >,
  nextToken?: string | null,
};

export type ModelParentInviteFilterInput = {
  id?: ModelIDInput | null,
  token?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelParentInviteFilterInput | null > | null,
  or?: Array< ModelParentInviteFilterInput | null > | null,
  not?: ModelParentInviteFilterInput | null,
};

export type ModelParentInviteConnection = {
  __typename: "ModelParentInviteConnection",
  items:  Array<ParentInvite | null >,
  nextToken?: string | null,
};

export type ModelParentStudentFilterInput = {
  id?: ModelIDInput | null,
  parentId?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelParentStudentFilterInput | null > | null,
  or?: Array< ModelParentStudentFilterInput | null > | null,
  not?: ModelParentStudentFilterInput | null,
};

export type ModelParentStudentConnection = {
  __typename: "ModelParentStudentConnection",
  items:  Array<ParentStudent | null >,
  nextToken?: string | null,
};

export type ModelStudentProfileFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  preferredName?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  status?: ModelStringInput | null,
  statusReason?: ModelStringInput | null,
  parentEmail?: ModelStringInput | null,
  parentName?: ModelStringInput | null,
  parentEmail2?: ModelStringInput | null,
  parentName2?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelStudentProfileFilterInput | null > | null,
  or?: Array< ModelStudentProfileFilterInput | null > | null,
  not?: ModelStudentProfileFilterInput | null,
};

export type ModelStudentProfileConnection = {
  __typename: "ModelStudentProfileConnection",
  items:  Array<StudentProfile | null >,
  nextToken?: string | null,
};

export type ModelParentProfileFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelParentProfileFilterInput | null > | null,
  or?: Array< ModelParentProfileFilterInput | null > | null,
  not?: ModelParentProfileFilterInput | null,
};

export type ModelParentProfileConnection = {
  __typename: "ModelParentProfileConnection",
  items:  Array<ParentProfile | null >,
  nextToken?: string | null,
};

export type ModelParentStudentLinkFilterInput = {
  id?: ModelIDInput | null,
  parentProfileId?: ModelIDInput | null,
  studentProfileId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelParentStudentLinkFilterInput | null > | null,
  or?: Array< ModelParentStudentLinkFilterInput | null > | null,
  not?: ModelParentStudentLinkFilterInput | null,
  studentProfileParentLinksId?: ModelIDInput | null,
  parentProfileStudentLinksId?: ModelIDInput | null,
};

export type ModelMessageFilterInput = {
  id?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  content?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  teacherReply?: ModelStringInput | null,
  repliedAt?: ModelStringInput | null,
  isArchivedByTeacher?: ModelBooleanInput | null,
  isDeletedByStudent?: ModelBooleanInput | null,
  isTeacherInitiated?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelMessageFilterInput | null > | null,
  or?: Array< ModelMessageFilterInput | null > | null,
  not?: ModelMessageFilterInput | null,
};

export type ModelMessageConnection = {
  __typename: "ModelMessageConnection",
  items:  Array<Message | null >,
  nextToken?: string | null,
};

export type ModelSyllabusFilterInput = {
  id?: ModelIDInput | null,
  semesterId?: ModelIDInput | null,
  courseId?: ModelIDInput | null,
  pdfKey?: ModelStringInput | null,
  publishedPdfKey?: ModelStringInput | null,
  publishedAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelSyllabusFilterInput | null > | null,
  or?: Array< ModelSyllabusFilterInput | null > | null,
  not?: ModelSyllabusFilterInput | null,
};

export type ModelSyllabusConnection = {
  __typename: "ModelSyllabusConnection",
  items:  Array<Syllabus | null >,
  nextToken?: string | null,
};

export type ModelZoomMeetingFilterInput = {
  id?: ModelIDInput | null,
  topic?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  joinUrl?: ModelStringInput | null,
  startUrl?: ModelStringInput | null,
  startTime?: ModelStringInput | null,
  durationMinutes?: ModelIntInput | null,
  inviteeType?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  studentIds?: ModelStringInput | null,
  parentId?: ModelStringInput | null,
  notes?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelZoomMeetingFilterInput | null > | null,
  or?: Array< ModelZoomMeetingFilterInput | null > | null,
  not?: ModelZoomMeetingFilterInput | null,
};

export type ModelZoomMeetingConnection = {
  __typename: "ModelZoomMeetingConnection",
  items:  Array<ZoomMeeting | null >,
  nextToken?: string | null,
};

export type ModelAnnouncementFilterInput = {
  id?: ModelIDInput | null,
  subject?: ModelStringInput | null,
  message?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  recipientIds?: ModelStringInput | null,
  recipientCount?: ModelIntInput | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAnnouncementFilterInput | null > | null,
  or?: Array< ModelAnnouncementFilterInput | null > | null,
  not?: ModelAnnouncementFilterInput | null,
};

export type ModelAnnouncementConnection = {
  __typename: "ModelAnnouncementConnection",
  items:  Array<Announcement | null >,
  nextToken?: string | null,
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
  courseId?: ModelSubscriptionIDInput | null,
  lessonWeightPercent?: ModelSubscriptionIntInput | null,
  testWeightPercent?: ModelSubscriptionIntInput | null,
  quizWeightPercent?: ModelSubscriptionIntInput | null,
  gradeA?: ModelSubscriptionIntInput | null,
  gradeB?: ModelSubscriptionIntInput | null,
  gradeC?: ModelSubscriptionIntInput | null,
  gradeD?: ModelSubscriptionIntInput | null,
  semesterType?: ModelSubscriptionStringInput | null,
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

export type ModelSubscriptionStudentInviteFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  token?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  semesterId?: ModelSubscriptionStringInput | null,
  planType?: ModelSubscriptionStringInput | null,
  parentFirstName?: ModelSubscriptionStringInput | null,
  parentLastName?: ModelSubscriptionStringInput | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  used?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionStudentInviteFilterInput | null > | null,
  or?: Array< ModelSubscriptionStudentInviteFilterInput | null > | null,
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
  courseSemestersId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionLessonFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  order?: ModelSubscriptionIntInput | null,
  isPublished?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  or?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  lessonWeeklyPlanItemsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionWeeklyPlanFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  weekStartDate?: ModelSubscriptionStringInput | null,
  assignedStudentIds?: ModelSubscriptionStringInput | null,
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
  lessonTemplateId?: ModelSubscriptionIDInput | null,
  zoomJoinUrl?: ModelSubscriptionStringInput | null,
  zoomMeetingId?: ModelSubscriptionStringInput | null,
  zoomStartTime?: ModelSubscriptionStringInput | null,
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
  answers?: ModelSubscriptionStringInput | null,
  imageUrls?: ModelSubscriptionStringInput | null,
  lessonTemplateId?: ModelSubscriptionStringInput | null,
  grade?: ModelSubscriptionStringInput | null,
  submittedAt?: ModelSubscriptionStringInput | null,
  teacherComment?: ModelSubscriptionStringInput | null,
  isArchived?: ModelSubscriptionBooleanInput | null,
  archivedAt?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  returnReason?: ModelSubscriptionStringInput | null,
  returnDueDate?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  or?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  submissionMessagesId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionSubmissionMessageFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  senderId?: ModelSubscriptionStringInput | null,
  senderType?: ModelSubscriptionStringInput | null,
  message?: ModelSubscriptionStringInput | null,
  isRead?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSubmissionMessageFilterInput | null > | null,
  or?: Array< ModelSubscriptionSubmissionMessageFilterInput | null > | null,
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
  teachingNotes?: ModelSubscriptionStringInput | null,
  worksheetUrl?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  assignmentType?: ModelSubscriptionStringInput | null,
  lessonCategory?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
  or?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
  lessonTemplateQuestionsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionAssignmentQuestionFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  order?: ModelSubscriptionIntInput | null,
  questionText?: ModelSubscriptionStringInput | null,
  questionType?: ModelSubscriptionStringInput | null,
  choices?: ModelSubscriptionStringInput | null,
  correctAnswer?: ModelSubscriptionStringInput | null,
  diagramKey?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAssignmentQuestionFilterInput | null > | null,
  or?: Array< ModelSubscriptionAssignmentQuestionFilterInput | null > | null,
};

export type ModelSubscriptionTeacherProfileFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  displayName?: ModelSubscriptionStringInput | null,
  bio?: ModelSubscriptionStringInput | null,
  profilePictureKey?: ModelSubscriptionStringInput | null,
  teachingVoice?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTeacherProfileFilterInput | null > | null,
  or?: Array< ModelSubscriptionTeacherProfileFilterInput | null > | null,
};

export type ModelSubscriptionVideoWatchFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  lessonId?: ModelSubscriptionStringInput | null,
  weeklyPlanItemId?: ModelSubscriptionStringInput | null,
  watchedSeconds?: ModelSubscriptionFloatInput | null,
  durationSeconds?: ModelSubscriptionFloatInput | null,
  percentWatched?: ModelSubscriptionFloatInput | null,
  completed?: ModelSubscriptionBooleanInput | null,
  lastWatchedAt?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionVideoWatchFilterInput | null > | null,
  or?: Array< ModelSubscriptionVideoWatchFilterInput | null > | null,
};

export type ModelSubscriptionFloatInput = {
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

export type ModelSubscriptionParentInviteFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  token?: ModelSubscriptionStringInput | null,
  studentEmail?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  used?: ModelSubscriptionBooleanInput | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  parentFirstName?: ModelSubscriptionStringInput | null,
  parentLastName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionParentInviteFilterInput | null > | null,
  or?: Array< ModelSubscriptionParentInviteFilterInput | null > | null,
};

export type ModelSubscriptionParentStudentFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  parentId?: ModelSubscriptionStringInput | null,
  studentEmail?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionParentStudentFilterInput | null > | null,
  or?: Array< ModelSubscriptionParentStudentFilterInput | null > | null,
};

export type ModelSubscriptionStudentProfileFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  preferredName?: ModelSubscriptionStringInput | null,
  gradeLevel?: ModelSubscriptionStringInput | null,
  courseId?: ModelSubscriptionStringInput | null,
  planType?: ModelSubscriptionStringInput | null,
  profilePictureKey?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  statusReason?: ModelSubscriptionStringInput | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  parentName?: ModelSubscriptionStringInput | null,
  parentEmail2?: ModelSubscriptionStringInput | null,
  parentName2?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionStudentProfileFilterInput | null > | null,
  or?: Array< ModelSubscriptionStudentProfileFilterInput | null > | null,
  studentProfileParentLinksId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionParentProfileFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionParentProfileFilterInput | null > | null,
  or?: Array< ModelSubscriptionParentProfileFilterInput | null > | null,
  parentProfileStudentLinksId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionParentStudentLinkFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  parentProfileId?: ModelSubscriptionIDInput | null,
  studentProfileId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionParentStudentLinkFilterInput | null > | null,
  or?: Array< ModelSubscriptionParentStudentLinkFilterInput | null > | null,
};

export type ModelSubscriptionMessageFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  content?: ModelSubscriptionStringInput | null,
  sentAt?: ModelSubscriptionStringInput | null,
  isRead?: ModelSubscriptionBooleanInput | null,
  teacherReply?: ModelSubscriptionStringInput | null,
  repliedAt?: ModelSubscriptionStringInput | null,
  isArchivedByTeacher?: ModelSubscriptionBooleanInput | null,
  isDeletedByStudent?: ModelSubscriptionBooleanInput | null,
  isTeacherInitiated?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  or?: Array< ModelSubscriptionMessageFilterInput | null > | null,
};

export type ModelSubscriptionSyllabusFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  semesterId?: ModelSubscriptionIDInput | null,
  courseId?: ModelSubscriptionIDInput | null,
  pdfKey?: ModelSubscriptionStringInput | null,
  publishedPdfKey?: ModelSubscriptionStringInput | null,
  publishedAt?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSyllabusFilterInput | null > | null,
  or?: Array< ModelSubscriptionSyllabusFilterInput | null > | null,
};

export type ModelSubscriptionZoomMeetingFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  topic?: ModelSubscriptionStringInput | null,
  zoomMeetingId?: ModelSubscriptionStringInput | null,
  joinUrl?: ModelSubscriptionStringInput | null,
  startUrl?: ModelSubscriptionStringInput | null,
  startTime?: ModelSubscriptionStringInput | null,
  durationMinutes?: ModelSubscriptionIntInput | null,
  inviteeType?: ModelSubscriptionStringInput | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  studentIds?: ModelSubscriptionStringInput | null,
  parentId?: ModelSubscriptionStringInput | null,
  notes?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionZoomMeetingFilterInput | null > | null,
  or?: Array< ModelSubscriptionZoomMeetingFilterInput | null > | null,
};

export type ModelSubscriptionAnnouncementFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  subject?: ModelSubscriptionStringInput | null,
  message?: ModelSubscriptionStringInput | null,
  sentAt?: ModelSubscriptionStringInput | null,
  recipientIds?: ModelSubscriptionStringInput | null,
  recipientCount?: ModelSubscriptionIntInput | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAnnouncementFilterInput | null > | null,
  or?: Array< ModelSubscriptionAnnouncementFilterInput | null > | null,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
  } | null,
};

export type CreateStudentInviteMutationVariables = {
  input: CreateStudentInviteInput,
  condition?: ModelStudentInviteConditionInput | null,
};

export type CreateStudentInviteMutation = {
  createStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateStudentInviteMutationVariables = {
  input: UpdateStudentInviteInput,
  condition?: ModelStudentInviteConditionInput | null,
};

export type UpdateStudentInviteMutation = {
  updateStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteStudentInviteMutationVariables = {
  input: DeleteStudentInviteInput,
  condition?: ModelStudentInviteConditionInput | null,
};

export type DeleteStudentInviteMutation = {
  deleteStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    instructions?: string | null,
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
    instructions?: string | null,
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
    instructions?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type CreateSubmissionMessageMutationVariables = {
  input: CreateSubmissionMessageInput,
  condition?: ModelSubmissionMessageConditionInput | null,
};

export type CreateSubmissionMessageMutation = {
  createSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
  } | null,
};

export type UpdateSubmissionMessageMutationVariables = {
  input: UpdateSubmissionMessageInput,
  condition?: ModelSubmissionMessageConditionInput | null,
};

export type UpdateSubmissionMessageMutation = {
  updateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
  } | null,
};

export type DeleteSubmissionMessageMutationVariables = {
  input: DeleteSubmissionMessageInput,
  condition?: ModelSubmissionMessageConditionInput | null,
};

export type DeleteSubmissionMessageMutation = {
  deleteSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type CreateAssignmentQuestionMutationVariables = {
  input: CreateAssignmentQuestionInput,
  condition?: ModelAssignmentQuestionConditionInput | null,
};

export type CreateAssignmentQuestionMutation = {
  createAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type UpdateAssignmentQuestionMutationVariables = {
  input: UpdateAssignmentQuestionInput,
  condition?: ModelAssignmentQuestionConditionInput | null,
};

export type UpdateAssignmentQuestionMutation = {
  updateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type DeleteAssignmentQuestionMutationVariables = {
  input: DeleteAssignmentQuestionInput,
  condition?: ModelAssignmentQuestionConditionInput | null,
};

export type DeleteAssignmentQuestionMutation = {
  deleteAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type CreateTeacherProfileMutationVariables = {
  input: CreateTeacherProfileInput,
  condition?: ModelTeacherProfileConditionInput | null,
};

export type CreateTeacherProfileMutation = {
  createTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateTeacherProfileMutationVariables = {
  input: UpdateTeacherProfileInput,
  condition?: ModelTeacherProfileConditionInput | null,
};

export type UpdateTeacherProfileMutation = {
  updateTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteTeacherProfileMutationVariables = {
  input: DeleteTeacherProfileInput,
  condition?: ModelTeacherProfileConditionInput | null,
};

export type DeleteTeacherProfileMutation = {
  deleteTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateVideoWatchMutationVariables = {
  input: CreateVideoWatchInput,
  condition?: ModelVideoWatchConditionInput | null,
};

export type CreateVideoWatchMutation = {
  createVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateVideoWatchMutationVariables = {
  input: UpdateVideoWatchInput,
  condition?: ModelVideoWatchConditionInput | null,
};

export type UpdateVideoWatchMutation = {
  updateVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteVideoWatchMutationVariables = {
  input: DeleteVideoWatchInput,
  condition?: ModelVideoWatchConditionInput | null,
};

export type DeleteVideoWatchMutation = {
  deleteVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateParentInviteMutationVariables = {
  input: CreateParentInviteInput,
  condition?: ModelParentInviteConditionInput | null,
};

export type CreateParentInviteMutation = {
  createParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateParentInviteMutationVariables = {
  input: UpdateParentInviteInput,
  condition?: ModelParentInviteConditionInput | null,
};

export type UpdateParentInviteMutation = {
  updateParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteParentInviteMutationVariables = {
  input: DeleteParentInviteInput,
  condition?: ModelParentInviteConditionInput | null,
};

export type DeleteParentInviteMutation = {
  deleteParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateParentStudentMutationVariables = {
  input: CreateParentStudentInput,
  condition?: ModelParentStudentConditionInput | null,
};

export type CreateParentStudentMutation = {
  createParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateParentStudentMutationVariables = {
  input: UpdateParentStudentInput,
  condition?: ModelParentStudentConditionInput | null,
};

export type UpdateParentStudentMutation = {
  updateParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteParentStudentMutationVariables = {
  input: DeleteParentStudentInput,
  condition?: ModelParentStudentConditionInput | null,
};

export type DeleteParentStudentMutation = {
  deleteParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateStudentProfileMutationVariables = {
  input: CreateStudentProfileInput,
  condition?: ModelStudentProfileConditionInput | null,
};

export type CreateStudentProfileMutation = {
  createStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateStudentProfileMutationVariables = {
  input: UpdateStudentProfileInput,
  condition?: ModelStudentProfileConditionInput | null,
};

export type UpdateStudentProfileMutation = {
  updateStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteStudentProfileMutationVariables = {
  input: DeleteStudentProfileInput,
  condition?: ModelStudentProfileConditionInput | null,
};

export type DeleteStudentProfileMutation = {
  deleteStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateParentProfileMutationVariables = {
  input: CreateParentProfileInput,
  condition?: ModelParentProfileConditionInput | null,
};

export type CreateParentProfileMutation = {
  createParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateParentProfileMutationVariables = {
  input: UpdateParentProfileInput,
  condition?: ModelParentProfileConditionInput | null,
};

export type UpdateParentProfileMutation = {
  updateParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteParentProfileMutationVariables = {
  input: DeleteParentProfileInput,
  condition?: ModelParentProfileConditionInput | null,
};

export type DeleteParentProfileMutation = {
  deleteParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateParentStudentLinkMutationVariables = {
  input: CreateParentStudentLinkInput,
  condition?: ModelParentStudentLinkConditionInput | null,
};

export type CreateParentStudentLinkMutation = {
  createParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type UpdateParentStudentLinkMutationVariables = {
  input: UpdateParentStudentLinkInput,
  condition?: ModelParentStudentLinkConditionInput | null,
};

export type UpdateParentStudentLinkMutation = {
  updateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type DeleteParentStudentLinkMutationVariables = {
  input: DeleteParentStudentLinkInput,
  condition?: ModelParentStudentLinkConditionInput | null,
};

export type DeleteParentStudentLinkMutation = {
  deleteParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type CreateMessageMutationVariables = {
  input: CreateMessageInput,
  condition?: ModelMessageConditionInput | null,
};

export type CreateMessageMutation = {
  createMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateMessageMutationVariables = {
  input: UpdateMessageInput,
  condition?: ModelMessageConditionInput | null,
};

export type UpdateMessageMutation = {
  updateMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteMessageMutationVariables = {
  input: DeleteMessageInput,
  condition?: ModelMessageConditionInput | null,
};

export type DeleteMessageMutation = {
  deleteMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateSyllabusMutationVariables = {
  input: CreateSyllabusInput,
  condition?: ModelSyllabusConditionInput | null,
};

export type CreateSyllabusMutation = {
  createSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateSyllabusMutationVariables = {
  input: UpdateSyllabusInput,
  condition?: ModelSyllabusConditionInput | null,
};

export type UpdateSyllabusMutation = {
  updateSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteSyllabusMutationVariables = {
  input: DeleteSyllabusInput,
  condition?: ModelSyllabusConditionInput | null,
};

export type DeleteSyllabusMutation = {
  deleteSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateZoomMeetingMutationVariables = {
  input: CreateZoomMeetingInput,
  condition?: ModelZoomMeetingConditionInput | null,
};

export type CreateZoomMeetingMutation = {
  createZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateZoomMeetingMutationVariables = {
  input: UpdateZoomMeetingInput,
  condition?: ModelZoomMeetingConditionInput | null,
};

export type UpdateZoomMeetingMutation = {
  updateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteZoomMeetingMutationVariables = {
  input: DeleteZoomMeetingInput,
  condition?: ModelZoomMeetingConditionInput | null,
};

export type DeleteZoomMeetingMutation = {
  deleteZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateAnnouncementMutationVariables = {
  input: CreateAnnouncementInput,
  condition?: ModelAnnouncementConditionInput | null,
};

export type CreateAnnouncementMutation = {
  createAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateAnnouncementMutationVariables = {
  input: UpdateAnnouncementInput,
  condition?: ModelAnnouncementConditionInput | null,
};

export type UpdateAnnouncementMutation = {
  updateAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteAnnouncementMutationVariables = {
  input: DeleteAnnouncementInput,
  condition?: ModelAnnouncementConditionInput | null,
};

export type DeleteAnnouncementMutation = {
  deleteAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetStudentInviteQueryVariables = {
  id: string,
};

export type GetStudentInviteQuery = {
  getStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListStudentInvitesQueryVariables = {
  filter?: ModelStudentInviteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStudentInvitesQuery = {
  listStudentInvites?:  {
    __typename: "ModelStudentInviteConnection",
    items:  Array< {
      __typename: "StudentInvite",
      id: string,
      token: string,
      firstName: string,
      lastName: string,
      email: string,
      courseId?: string | null,
      courseTitle?: string | null,
      semesterId?: string | null,
      planType: string,
      parentFirstName?: string | null,
      parentLastName?: string | null,
      parentEmail?: string | null,
      used?: boolean | null,
      createdAt: string,
      updatedAt: string,
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    instructions?: string | null,
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
      instructions?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      assignedStudentIds?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
      lessonTemplateId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
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
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSubmissionMessageQueryVariables = {
  id: string,
};

export type GetSubmissionMessageQuery = {
  getSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
  } | null,
};

export type ListSubmissionMessagesQueryVariables = {
  filter?: ModelSubmissionMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSubmissionMessagesQuery = {
  listSubmissionMessages?:  {
    __typename: "ModelSubmissionMessageConnection",
    items:  Array< {
      __typename: "SubmissionMessage",
      id: string,
      senderId: string,
      senderType: string,
      message: string,
      isRead?: boolean | null,
      createdAt: string,
      updatedAt: string,
      submissionMessagesId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
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
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetAssignmentQuestionQueryVariables = {
  id: string,
};

export type GetAssignmentQuestionQuery = {
  getAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type ListAssignmentQuestionsQueryVariables = {
  filter?: ModelAssignmentQuestionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAssignmentQuestionsQuery = {
  listAssignmentQuestions?:  {
    __typename: "ModelAssignmentQuestionConnection",
    items:  Array< {
      __typename: "AssignmentQuestion",
      id: string,
      order: number,
      questionText: string,
      questionType: string,
      choices?: string | null,
      correctAnswer?: string | null,
      diagramKey?: string | null,
      createdAt: string,
      updatedAt: string,
      lessonTemplateQuestionsId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetTeacherProfileQueryVariables = {
  id: string,
};

export type GetTeacherProfileQuery = {
  getTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListTeacherProfilesQueryVariables = {
  filter?: ModelTeacherProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTeacherProfilesQuery = {
  listTeacherProfiles?:  {
    __typename: "ModelTeacherProfileConnection",
    items:  Array< {
      __typename: "TeacherProfile",
      id: string,
      userId: string,
      email: string,
      displayName?: string | null,
      bio?: string | null,
      profilePictureKey?: string | null,
      teachingVoice?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetVideoWatchQueryVariables = {
  id: string,
};

export type GetVideoWatchQuery = {
  getVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListVideoWatchesQueryVariables = {
  filter?: ModelVideoWatchFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVideoWatchesQuery = {
  listVideoWatches?:  {
    __typename: "ModelVideoWatchConnection",
    items:  Array< {
      __typename: "VideoWatch",
      id: string,
      studentId: string,
      lessonId: string,
      weeklyPlanItemId?: string | null,
      watchedSeconds?: number | null,
      durationSeconds?: number | null,
      percentWatched?: number | null,
      completed?: boolean | null,
      lastWatchedAt?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetParentInviteQueryVariables = {
  id: string,
};

export type GetParentInviteQuery = {
  getParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListParentInvitesQueryVariables = {
  filter?: ModelParentInviteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListParentInvitesQuery = {
  listParentInvites?:  {
    __typename: "ModelParentInviteConnection",
    items:  Array< {
      __typename: "ParentInvite",
      id: string,
      token: string,
      studentEmail: string,
      studentName: string,
      used?: boolean | null,
      parentEmail?: string | null,
      parentFirstName?: string | null,
      parentLastName?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetParentStudentQueryVariables = {
  id: string,
};

export type GetParentStudentQuery = {
  getParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListParentStudentsQueryVariables = {
  filter?: ModelParentStudentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListParentStudentsQuery = {
  listParentStudents?:  {
    __typename: "ModelParentStudentConnection",
    items:  Array< {
      __typename: "ParentStudent",
      id: string,
      parentId: string,
      studentEmail: string,
      studentName: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetStudentProfileQueryVariables = {
  id: string,
};

export type GetStudentProfileQuery = {
  getStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListStudentProfilesQueryVariables = {
  filter?: ModelStudentProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStudentProfilesQuery = {
  listStudentProfiles?:  {
    __typename: "ModelStudentProfileConnection",
    items:  Array< {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetParentProfileQueryVariables = {
  id: string,
};

export type GetParentProfileQuery = {
  getParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListParentProfilesQueryVariables = {
  filter?: ModelParentProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListParentProfilesQuery = {
  listParentProfiles?:  {
    __typename: "ModelParentProfileConnection",
    items:  Array< {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetParentStudentLinkQueryVariables = {
  id: string,
};

export type GetParentStudentLinkQuery = {
  getParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type ListParentStudentLinksQueryVariables = {
  filter?: ModelParentStudentLinkFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListParentStudentLinksQuery = {
  listParentStudentLinks?:  {
    __typename: "ModelParentStudentLinkConnection",
    items:  Array< {
      __typename: "ParentStudentLink",
      id: string,
      parentProfileId: string,
      studentProfileId: string,
      createdAt: string,
      updatedAt: string,
      studentProfileParentLinksId?: string | null,
      parentProfileStudentLinksId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetMessageQueryVariables = {
  id: string,
};

export type GetMessageQuery = {
  getMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListMessagesQueryVariables = {
  filter?: ModelMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMessagesQuery = {
  listMessages?:  {
    __typename: "ModelMessageConnection",
    items:  Array< {
      __typename: "Message",
      id: string,
      studentId: string,
      studentName?: string | null,
      content: string,
      sentAt: string,
      isRead?: boolean | null,
      teacherReply?: string | null,
      repliedAt?: string | null,
      isArchivedByTeacher?: boolean | null,
      isDeletedByStudent?: boolean | null,
      isTeacherInitiated?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSyllabusQueryVariables = {
  id: string,
};

export type GetSyllabusQuery = {
  getSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListSyllabiQueryVariables = {
  filter?: ModelSyllabusFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSyllabiQuery = {
  listSyllabi?:  {
    __typename: "ModelSyllabusConnection",
    items:  Array< {
      __typename: "Syllabus",
      id: string,
      semesterId: string,
      courseId: string,
      pdfKey?: string | null,
      publishedPdfKey?: string | null,
      publishedAt?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetZoomMeetingQueryVariables = {
  id: string,
};

export type GetZoomMeetingQuery = {
  getZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListZoomMeetingsQueryVariables = {
  filter?: ModelZoomMeetingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListZoomMeetingsQuery = {
  listZoomMeetings?:  {
    __typename: "ModelZoomMeetingConnection",
    items:  Array< {
      __typename: "ZoomMeeting",
      id: string,
      topic: string,
      zoomMeetingId?: string | null,
      joinUrl: string,
      startUrl?: string | null,
      startTime: string,
      durationMinutes: number,
      inviteeType: string,
      courseId?: string | null,
      courseTitle?: string | null,
      studentIds?: string | null,
      parentId?: string | null,
      notes?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetAnnouncementQueryVariables = {
  id: string,
};

export type GetAnnouncementQuery = {
  getAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListAnnouncementsQueryVariables = {
  filter?: ModelAnnouncementFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAnnouncementsQuery = {
  listAnnouncements?:  {
    __typename: "ModelAnnouncementConnection",
    items:  Array< {
      __typename: "Announcement",
      id: string,
      subject: string,
      message: string,
      sentAt: string,
      recipientIds: string,
      recipientCount?: number | null,
      courseId?: string | null,
      courseTitle?: string | null,
      createdAt: string,
      updatedAt: string,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
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
    courseId?: string | null,
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
    lessonWeightPercent?: number | null,
    testWeightPercent?: number | null,
    quizWeightPercent?: number | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    semesterType?: string | null,
    createdAt: string,
    updatedAt: string,
    academicYearSemestersId?: string | null,
    courseSemestersId?: string | null,
  } | null,
};

export type OnCreateStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnCreateStudentInviteSubscription = {
  onCreateStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnUpdateStudentInviteSubscription = {
  onUpdateStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnDeleteStudentInviteSubscription = {
  onDeleteStudentInvite?:  {
    __typename: "StudentInvite",
    id: string,
    token: string,
    firstName: string,
    lastName: string,
    email: string,
    courseId?: string | null,
    courseTitle?: string | null,
    semesterId?: string | null,
    planType: string,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    parentEmail?: string | null,
    used?: boolean | null,
    createdAt: string,
    updatedAt: string,
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    semesters?:  {
      __typename: "ModelSemesterConnection",
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
    instructions?: string | null,
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
    instructions?: string | null,
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
    instructions?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    assignedStudentIds?: string | null,
    semester?:  {
      __typename: "Semester",
      id: string,
      name: string,
      startDate: string,
      endDate: string,
      isActive?: boolean | null,
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
      instructions?: string | null,
      order?: number | null,
      isPublished?: boolean | null,
      createdAt: string,
      updatedAt: string,
      courseLessonsId?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      id: string,
      weekStartDate: string,
      assignedStudentIds?: string | null,
      createdAt: string,
      updatedAt: string,
      semesterWeeklyPlansId?: string | null,
      courseWeeklyPlansId?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
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
    answers?: string | null,
    imageUrls?: string | null,
    lessonTemplateId?: string | null,
    grade?: string | null,
    submittedAt?: string | null,
    teacherComment?: string | null,
    isArchived?: boolean | null,
    archivedAt?: string | null,
    status?: string | null,
    returnReason?: string | null,
    returnDueDate?: string | null,
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
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    assignmentSubmissionsId?: string | null,
  } | null,
};

export type OnCreateSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnCreateSubmissionMessageSubscription = {
  onCreateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
  } | null,
};

export type OnUpdateSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnUpdateSubmissionMessageSubscription = {
  onUpdateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
  } | null,
};

export type OnDeleteSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnDeleteSubmissionMessageSubscription = {
  onDeleteSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    id: string,
    senderId: string,
    senderType: string,
    message: string,
    isRead?: boolean | null,
    submission?:  {
      __typename: "Submission",
      id: string,
      studentId: string,
      content?: string | null,
      answers?: string | null,
      imageUrls?: string | null,
      lessonTemplateId?: string | null,
      grade?: string | null,
      submittedAt?: string | null,
      teacherComment?: string | null,
      isArchived?: boolean | null,
      archivedAt?: string | null,
      status?: string | null,
      returnReason?: string | null,
      returnDueDate?: string | null,
      createdAt: string,
      updatedAt: string,
      assignmentSubmissionsId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    submissionMessagesId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
      courseId?: string | null,
      lessonWeightPercent?: number | null,
      testWeightPercent?: number | null,
      quizWeightPercent?: number | null,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      semesterType?: string | null,
      createdAt: string,
      updatedAt: string,
      academicYearSemestersId?: string | null,
      courseSemestersId?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
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
    teachingNotes?: string | null,
    worksheetUrl?: string | null,
    videoUrl?: string | null,
    assignmentType?: string | null,
    lessonCategory?: string | null,
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
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    courseLessonTemplatesId?: string | null,
  } | null,
};

export type OnCreateAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnCreateAssignmentQuestionSubscription = {
  onCreateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type OnUpdateAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnUpdateAssignmentQuestionSubscription = {
  onUpdateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type OnDeleteAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnDeleteAssignmentQuestionSubscription = {
  onDeleteAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    id: string,
    order: number,
    questionText: string,
    questionType: string,
    choices?: string | null,
    correctAnswer?: string | null,
    diagramKey?: string | null,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      id: string,
      lessonNumber: number,
      title: string,
      instructions?: string | null,
      teachingNotes?: string | null,
      worksheetUrl?: string | null,
      videoUrl?: string | null,
      assignmentType?: string | null,
      lessonCategory?: string | null,
      createdAt: string,
      updatedAt: string,
      courseLessonTemplatesId?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    lessonTemplateQuestionsId?: string | null,
  } | null,
};

export type OnCreateTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnCreateTeacherProfileSubscription = {
  onCreateTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnUpdateTeacherProfileSubscription = {
  onUpdateTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnDeleteTeacherProfileSubscription = {
  onDeleteTeacherProfile?:  {
    __typename: "TeacherProfile",
    id: string,
    userId: string,
    email: string,
    displayName?: string | null,
    bio?: string | null,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnCreateVideoWatchSubscription = {
  onCreateVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnUpdateVideoWatchSubscription = {
  onUpdateVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnDeleteVideoWatchSubscription = {
  onDeleteVideoWatch?:  {
    __typename: "VideoWatch",
    id: string,
    studentId: string,
    lessonId: string,
    weeklyPlanItemId?: string | null,
    watchedSeconds?: number | null,
    durationSeconds?: number | null,
    percentWatched?: number | null,
    completed?: boolean | null,
    lastWatchedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnCreateParentInviteSubscription = {
  onCreateParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnUpdateParentInviteSubscription = {
  onUpdateParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnDeleteParentInviteSubscription = {
  onDeleteParentInvite?:  {
    __typename: "ParentInvite",
    id: string,
    token: string,
    studentEmail: string,
    studentName: string,
    used?: boolean | null,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnCreateParentStudentSubscription = {
  onCreateParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnUpdateParentStudentSubscription = {
  onUpdateParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnDeleteParentStudentSubscription = {
  onDeleteParentStudent?:  {
    __typename: "ParentStudent",
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnCreateStudentProfileSubscription = {
  onCreateStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnUpdateStudentProfileSubscription = {
  onUpdateStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnDeleteStudentProfileSubscription = {
  onDeleteStudentProfile?:  {
    __typename: "StudentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    preferredName?: string | null,
    gradeLevel?: string | null,
    courseId?: string | null,
    planType?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    parentEmail?: string | null,
    parentName?: string | null,
    parentEmail2?: string | null,
    parentName2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnCreateParentProfileSubscription = {
  onCreateParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnUpdateParentProfileSubscription = {
  onUpdateParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnDeleteParentProfileSubscription = {
  onDeleteParentProfile?:  {
    __typename: "ParentProfile",
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnCreateParentStudentLinkSubscription = {
  onCreateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type OnUpdateParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnUpdateParentStudentLinkSubscription = {
  onUpdateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type OnDeleteParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnDeleteParentStudentLinkSubscription = {
  onDeleteParentStudentLink?:  {
    __typename: "ParentStudentLink",
    id: string,
    parentProfileId: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    studentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      id: string,
      userId: string,
      email: string,
      firstName: string,
      lastName: string,
      preferredName?: string | null,
      gradeLevel?: string | null,
      courseId?: string | null,
      planType?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      parentEmail?: string | null,
      parentName?: string | null,
      parentEmail2?: string | null,
      parentName2?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    createdAt: string,
    updatedAt: string,
    studentProfileParentLinksId?: string | null,
    parentProfileStudentLinksId?: string | null,
  } | null,
};

export type OnCreateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnCreateMessageSubscription = {
  onCreateMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnUpdateMessageSubscription = {
  onUpdateMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnDeleteMessageSubscription = {
  onDeleteMessage?:  {
    __typename: "Message",
    id: string,
    studentId: string,
    studentName?: string | null,
    content: string,
    sentAt: string,
    isRead?: boolean | null,
    teacherReply?: string | null,
    repliedAt?: string | null,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isTeacherInitiated?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnCreateSyllabusSubscription = {
  onCreateSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnUpdateSyllabusSubscription = {
  onUpdateSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnDeleteSyllabusSubscription = {
  onDeleteSyllabus?:  {
    __typename: "Syllabus",
    id: string,
    semesterId: string,
    courseId: string,
    pdfKey?: string | null,
    publishedPdfKey?: string | null,
    publishedAt?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnCreateZoomMeetingSubscription = {
  onCreateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnUpdateZoomMeetingSubscription = {
  onUpdateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnDeleteZoomMeetingSubscription = {
  onDeleteZoomMeeting?:  {
    __typename: "ZoomMeeting",
    id: string,
    topic: string,
    zoomMeetingId?: string | null,
    joinUrl: string,
    startUrl?: string | null,
    startTime: string,
    durationMinutes: number,
    inviteeType: string,
    courseId?: string | null,
    courseTitle?: string | null,
    studentIds?: string | null,
    parentId?: string | null,
    notes?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnCreateAnnouncementSubscription = {
  onCreateAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnUpdateAnnouncementSubscription = {
  onUpdateAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnDeleteAnnouncementSubscription = {
  onDeleteAnnouncement?:  {
    __typename: "Announcement",
    id: string,
    subject: string,
    message: string,
    sentAt: string,
    recipientIds: string,
    recipientCount?: number | null,
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};
