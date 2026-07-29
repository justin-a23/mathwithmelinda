/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AcademicYear = {
  __typename: "AcademicYear",
  createdAt: string,
  id: string,
  quarters?: ModelQuarterConnection | null,
  semesters?: ModelSemesterConnection | null,
  updatedAt: string,
  year: string,
};

export type ModelQuarterConnection = {
  __typename: "ModelQuarterConnection",
  items:  Array<Quarter | null >,
  nextToken?: string | null,
};

export type Quarter = {
  __typename: "Quarter",
  academicYear?: AcademicYear | null,
  academicYearQuartersId?: string | null,
  createdAt: string,
  endDate: string,
  id: string,
  name: string,
  order: number,
  startDate: string,
  updatedAt: string,
};

export type ModelSemesterConnection = {
  __typename: "ModelSemesterConnection",
  items:  Array<Semester | null >,
  nextToken?: string | null,
};

export type Semester = {
  __typename: "Semester",
  academicYear?: AcademicYear | null,
  academicYearSemestersId?: string | null,
  course?: Course | null,
  courseId?: string | null,
  createdAt: string,
  endDate: string,
  enrollments?: ModelEnrollmentConnection | null,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  id: string,
  isActive?: boolean | null,
  lessonWeightPercent?: number | null,
  name: string,
  quizWeightPercent?: number | null,
  semesterType?: string | null,
  startDate: string,
  testWeightPercent?: number | null,
  updatedAt: string,
  weeklyPlans?: ModelWeeklyPlanConnection | null,
};

export type Course = {
  __typename: "Course",
  assignments?: ModelAssignmentConnection | null,
  createdAt: string,
  description?: string | null,
  enrollments?: ModelEnrollmentConnection | null,
  gradeLevel?: string | null,
  id: string,
  isArchived?: boolean | null,
  lessonTemplates?: ModelLessonTemplateConnection | null,
  lessons?: ModelLessonConnection | null,
  semesters?: ModelSemesterConnection | null,
  title: string,
  updatedAt: string,
  weeklyPlans?: ModelWeeklyPlanConnection | null,
};

export type ModelAssignmentConnection = {
  __typename: "ModelAssignmentConnection",
  items:  Array<Assignment | null >,
  nextToken?: string | null,
};

export type Assignment = {
  __typename: "Assignment",
  course?: Course | null,
  courseAssignmentsId?: string | null,
  createdAt: string,
  description?: string | null,
  dueDate?: string | null,
  id: string,
  submissions?: ModelSubmissionConnection | null,
  title: string,
  updatedAt: string,
  weeklyPlanItem?: WeeklyPlanItem | null,
  weeklyPlanItemAssignmentsId?: string | null,
};

export type ModelSubmissionConnection = {
  __typename: "ModelSubmissionConnection",
  items:  Array<Submission | null >,
  nextToken?: string | null,
};

export type Submission = {
  __typename: "Submission",
  answers?: string | null,
  archivedAt?: string | null,
  assignment?: Assignment | null,
  assignmentSubmissionsId?: string | null,
  content?: string | null,
  createdAt: string,
  grade?: string | null,
  id: string,
  imageUrls?: string | null,
  isArchived?: boolean | null,
  lessonTemplateId?: string | null,
  messages?: ModelSubmissionMessageConnection | null,
  returnDueDate?: string | null,
  returnReason?: string | null,
  status?: string | null,
  studentId: string,
  submittedAt?: string | null,
  teacherComment?: string | null,
  updatedAt: string,
};

export type ModelSubmissionMessageConnection = {
  __typename: "ModelSubmissionMessageConnection",
  items:  Array<SubmissionMessage | null >,
  nextToken?: string | null,
};

export type SubmissionMessage = {
  __typename: "SubmissionMessage",
  createdAt: string,
  id: string,
  isRead?: boolean | null,
  message: string,
  senderId: string,
  senderType: string,
  submission?: Submission | null,
  submissionMessagesId?: string | null,
  updatedAt: string,
};

export type WeeklyPlanItem = {
  __typename: "WeeklyPlanItem",
  assignments?: ModelAssignmentConnection | null,
  createdAt: string,
  dayOfWeek: string,
  dueTime?: string | null,
  id: string,
  isPublished?: boolean | null,
  lesson?: Lesson | null,
  lessonTemplateId?: string | null,
  lessonWeeklyPlanItemsId?: string | null,
  updatedAt: string,
  weeklyPlan?: WeeklyPlan | null,
  weeklyPlanItemsId?: string | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
};

export type Lesson = {
  __typename: "Lesson",
  course?: Course | null,
  courseLessonsId?: string | null,
  createdAt: string,
  id: string,
  instructions?: string | null,
  isPublished?: boolean | null,
  order?: number | null,
  title: string,
  updatedAt: string,
  videoUrl?: string | null,
  weeklyPlanItems?: ModelWeeklyPlanItemConnection | null,
};

export type ModelWeeklyPlanItemConnection = {
  __typename: "ModelWeeklyPlanItemConnection",
  items:  Array<WeeklyPlanItem | null >,
  nextToken?: string | null,
};

export type WeeklyPlan = {
  __typename: "WeeklyPlan",
  assignedStudentIds?: string | null,
  course?: Course | null,
  courseWeeklyPlansId?: string | null,
  createdAt: string,
  id: string,
  items?: ModelWeeklyPlanItemConnection | null,
  semester?: Semester | null,
  semesterWeeklyPlansId?: string | null,
  updatedAt: string,
  weekStartDate: string,
};

export type ModelEnrollmentConnection = {
  __typename: "ModelEnrollmentConnection",
  items:  Array<Enrollment | null >,
  nextToken?: string | null,
};

export type Enrollment = {
  __typename: "Enrollment",
  course?: Course | null,
  courseEnrollmentsId?: string | null,
  createdAt: string,
  id: string,
  planType?: string | null,
  semester?: Semester | null,
  semesterEnrollmentsId?: string | null,
  studentId: string,
  updatedAt: string,
};

export type ModelLessonTemplateConnection = {
  __typename: "ModelLessonTemplateConnection",
  items:  Array<LessonTemplate | null >,
  nextToken?: string | null,
};

export type LessonTemplate = {
  __typename: "LessonTemplate",
  assignmentType?: string | null,
  course?: Course | null,
  courseLessonTemplatesId?: string | null,
  createdAt: string,
  id: string,
  instructions?: string | null,
  isArchived?: boolean | null,
  lessonCategory?: string | null,
  lessonNumber: number,
  questions?: ModelAssignmentQuestionConnection | null,
  teachingNotes?: string | null,
  title: string,
  updatedAt: string,
  videoUrl?: string | null,
  worksheetUrl?: string | null,
};

export type ModelAssignmentQuestionConnection = {
  __typename: "ModelAssignmentQuestionConnection",
  items:  Array<AssignmentQuestion | null >,
  nextToken?: string | null,
};

export type AssignmentQuestion = {
  __typename: "AssignmentQuestion",
  choices?: string | null,
  correctAnswer?: string | null,
  createdAt: string,
  diagramKey?: string | null,
  diagramSpec?: string | null,
  id: string,
  lessonTemplate?: LessonTemplate | null,
  lessonTemplateQuestionsId?: string | null,
  order: number,
  questionText: string,
  questionType: string,
  updatedAt: string,
};

export type ModelLessonConnection = {
  __typename: "ModelLessonConnection",
  items:  Array<Lesson | null >,
  nextToken?: string | null,
};

export type ModelWeeklyPlanConnection = {
  __typename: "ModelWeeklyPlanConnection",
  items:  Array<WeeklyPlan | null >,
  nextToken?: string | null,
};

export type Announcement = {
  __typename: "Announcement",
  courseId?: string | null,
  courseTitle?: string | null,
  createdAt: string,
  id: string,
  message: string,
  recipientCount?: number | null,
  recipientIds: string,
  sentAt: string,
  subject: string,
  updatedAt: string,
};

export type Message = {
  __typename: "Message",
  content: string,
  createdAt: string,
  id: string,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isRead?: boolean | null,
  isTeacherInitiated?: boolean | null,
  repliedAt?: string | null,
  sentAt: string,
  studentId: string,
  studentName?: string | null,
  teacherReply?: string | null,
  updatedAt: string,
};

export type ParentInvite = {
  __typename: "ParentInvite",
  createdAt: string,
  id: string,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  studentEmail: string,
  studentName: string,
  token: string,
  updatedAt: string,
  used?: boolean | null,
};

export type ParentProfile = {
  __typename: "ParentProfile",
  createdAt: string,
  email: string,
  firstName: string,
  id: string,
  lastName: string,
  studentLinks?: ModelParentStudentLinkConnection | null,
  updatedAt: string,
  userId: string,
};

export type ModelParentStudentLinkConnection = {
  __typename: "ModelParentStudentLinkConnection",
  items:  Array<ParentStudentLink | null >,
  nextToken?: string | null,
};

export type ParentStudentLink = {
  __typename: "ParentStudentLink",
  createdAt: string,
  id: string,
  parentProfile?: ParentProfile | null,
  parentProfileId: string,
  studentProfile?: StudentProfile | null,
  studentProfileId: string,
  updatedAt: string,
};

export type StudentProfile = {
  __typename: "StudentProfile",
  archivedAt?: string | null,
  courseId?: string | null,
  createdAt: string,
  email: string,
  enrolledAt?: string | null,
  firstName: string,
  gradeLevel?: string | null,
  id: string,
  lastName: string,
  parentEmail?: string | null,
  parentEmail2?: string | null,
  parentLinks?: ModelParentStudentLinkConnection | null,
  parentName?: string | null,
  parentName2?: string | null,
  planType?: string | null,
  preferredName?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  updatedAt: string,
  userId: string,
};

export type ParentStudent = {
  __typename: "ParentStudent",
  createdAt: string,
  id: string,
  parentId: string,
  studentEmail: string,
  studentName: string,
  updatedAt: string,
};

export type ReportCardRecord = {
  __typename: "ReportCardRecord",
  comment?: string | null,
  courseName: string,
  createdAt: string,
  finalLetter?: string | null,
  id: string,
  quarterBreakdown?: string | null,
  quarterId?: string | null,
  recipientEmails?: string | null,
  reportTitle: string,
  semesterId: string,
  semesterName: string,
  sentAt: string,
  studentId: string,
  studentName: string,
  updatedAt: string,
  weightedAvg?: number | null,
};

export type StudentInvite = {
  __typename: "StudentInvite",
  courseId?: string | null,
  courseTitle?: string | null,
  createdAt: string,
  email: string,
  firstName: string,
  id: string,
  lastName: string,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  planType: string,
  semesterId?: string | null,
  token: string,
  updatedAt: string,
  used?: boolean | null,
};

export type Syllabus = {
  __typename: "Syllabus",
  courseId: string,
  createdAt: string,
  id: string,
  pdfKey?: string | null,
  publishedAt?: string | null,
  publishedPdfKey?: string | null,
  semesterId: string,
  updatedAt: string,
};

export type TeacherProfile = {
  __typename: "TeacherProfile",
  bio?: string | null,
  createdAt: string,
  displayName?: string | null,
  email: string,
  id: string,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
  updatedAt: string,
  userId: string,
};

export type VideoWatch = {
  __typename: "VideoWatch",
  completed?: boolean | null,
  createdAt: string,
  durationSeconds?: number | null,
  id: string,
  lastWatchedAt?: string | null,
  lessonId: string,
  percentWatched?: number | null,
  studentId: string,
  updatedAt: string,
  watchedSeconds?: number | null,
  weeklyPlanItemId?: string | null,
};

export type ZoomMeeting = {
  __typename: "ZoomMeeting",
  courseId?: string | null,
  courseTitle?: string | null,
  createdAt: string,
  durationMinutes: number,
  id: string,
  inviteeType: string,
  joinUrl: string,
  notes?: string | null,
  parentId?: string | null,
  startTime: string,
  startUrl?: string | null,
  studentIds?: string | null,
  topic: string,
  updatedAt: string,
  zoomMeetingId?: string | null,
};

export type ModelAcademicYearFilterInput = {
  and?: Array< ModelAcademicYearFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelAcademicYearFilterInput | null,
  or?: Array< ModelAcademicYearFilterInput | null > | null,
  updatedAt?: ModelStringInput | null,
  year?: ModelStringInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelAcademicYearConnection = {
  __typename: "ModelAcademicYearConnection",
  items:  Array<AcademicYear | null >,
  nextToken?: string | null,
};

export type ModelAnnouncementFilterInput = {
  and?: Array< ModelAnnouncementFilterInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  message?: ModelStringInput | null,
  not?: ModelAnnouncementFilterInput | null,
  or?: Array< ModelAnnouncementFilterInput | null > | null,
  recipientCount?: ModelIntInput | null,
  recipientIds?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  subject?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelAnnouncementConnection = {
  __typename: "ModelAnnouncementConnection",
  items:  Array<Announcement | null >,
  nextToken?: string | null,
};

export type ModelAssignmentQuestionFilterInput = {
  and?: Array< ModelAssignmentQuestionFilterInput | null > | null,
  choices?: ModelStringInput | null,
  correctAnswer?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  diagramKey?: ModelStringInput | null,
  diagramSpec?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lessonTemplateQuestionsId?: ModelIDInput | null,
  not?: ModelAssignmentQuestionFilterInput | null,
  or?: Array< ModelAssignmentQuestionFilterInput | null > | null,
  order?: ModelIntInput | null,
  questionText?: ModelStringInput | null,
  questionType?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelAssignmentFilterInput = {
  and?: Array< ModelAssignmentFilterInput | null > | null,
  courseAssignmentsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelAssignmentFilterInput | null,
  or?: Array< ModelAssignmentFilterInput | null > | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  weeklyPlanItemAssignmentsId?: ModelIDInput | null,
};

export type ModelCourseFilterInput = {
  and?: Array< ModelCourseFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isArchived?: ModelBooleanInput | null,
  not?: ModelCourseFilterInput | null,
  or?: Array< ModelCourseFilterInput | null > | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelCourseConnection = {
  __typename: "ModelCourseConnection",
  items:  Array<Course | null >,
  nextToken?: string | null,
};

export type ModelEnrollmentFilterInput = {
  and?: Array< ModelEnrollmentFilterInput | null > | null,
  courseEnrollmentsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelEnrollmentFilterInput | null,
  or?: Array< ModelEnrollmentFilterInput | null > | null,
  planType?: ModelStringInput | null,
  semesterEnrollmentsId?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelLessonTemplateFilterInput = {
  and?: Array< ModelLessonTemplateFilterInput | null > | null,
  assignmentType?: ModelStringInput | null,
  courseLessonTemplatesId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  instructions?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  lessonCategory?: ModelStringInput | null,
  lessonNumber?: ModelIntInput | null,
  not?: ModelLessonTemplateFilterInput | null,
  or?: Array< ModelLessonTemplateFilterInput | null > | null,
  teachingNotes?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
};

export type ModelLessonFilterInput = {
  and?: Array< ModelLessonFilterInput | null > | null,
  courseLessonsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  instructions?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  not?: ModelLessonFilterInput | null,
  or?: Array< ModelLessonFilterInput | null > | null,
  order?: ModelIntInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
};

export type ModelMessageFilterInput = {
  and?: Array< ModelMessageFilterInput | null > | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isArchivedByTeacher?: ModelBooleanInput | null,
  isDeletedByStudent?: ModelBooleanInput | null,
  isRead?: ModelBooleanInput | null,
  isTeacherInitiated?: ModelBooleanInput | null,
  not?: ModelMessageFilterInput | null,
  or?: Array< ModelMessageFilterInput | null > | null,
  repliedAt?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  teacherReply?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelMessageConnection = {
  __typename: "ModelMessageConnection",
  items:  Array<Message | null >,
  nextToken?: string | null,
};

export type ModelParentInviteFilterInput = {
  and?: Array< ModelParentInviteFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelParentInviteFilterInput | null,
  or?: Array< ModelParentInviteFilterInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  token?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type ModelParentInviteConnection = {
  __typename: "ModelParentInviteConnection",
  items:  Array<ParentInvite | null >,
  nextToken?: string | null,
};

export type ModelParentProfileFilterInput = {
  and?: Array< ModelParentProfileFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelParentProfileFilterInput | null,
  or?: Array< ModelParentProfileFilterInput | null > | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelParentProfileConnection = {
  __typename: "ModelParentProfileConnection",
  items:  Array<ParentProfile | null >,
  nextToken?: string | null,
};

export type ModelParentStudentLinkFilterInput = {
  and?: Array< ModelParentStudentLinkFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelParentStudentLinkFilterInput | null,
  or?: Array< ModelParentStudentLinkFilterInput | null > | null,
  parentProfileId?: ModelIDInput | null,
  studentProfileId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelParentStudentFilterInput = {
  and?: Array< ModelParentStudentFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelParentStudentFilterInput | null,
  or?: Array< ModelParentStudentFilterInput | null > | null,
  parentId?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelParentStudentConnection = {
  __typename: "ModelParentStudentConnection",
  items:  Array<ParentStudent | null >,
  nextToken?: string | null,
};

export type ModelQuarterFilterInput = {
  academicYearQuartersId?: ModelIDInput | null,
  and?: Array< ModelQuarterFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  not?: ModelQuarterFilterInput | null,
  or?: Array< ModelQuarterFilterInput | null > | null,
  order?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelReportCardRecordFilterInput = {
  and?: Array< ModelReportCardRecordFilterInput | null > | null,
  comment?: ModelStringInput | null,
  courseName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  finalLetter?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelReportCardRecordFilterInput | null,
  or?: Array< ModelReportCardRecordFilterInput | null > | null,
  quarterBreakdown?: ModelStringInput | null,
  quarterId?: ModelStringInput | null,
  recipientEmails?: ModelStringInput | null,
  reportTitle?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  semesterName?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  weightedAvg?: ModelFloatInput | null,
};

export type ModelFloatInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelReportCardRecordConnection = {
  __typename: "ModelReportCardRecordConnection",
  items:  Array<ReportCardRecord | null >,
  nextToken?: string | null,
};

export type ModelSemesterFilterInput = {
  academicYearSemestersId?: ModelIDInput | null,
  and?: Array< ModelSemesterFilterInput | null > | null,
  courseId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  gradeA?: ModelIntInput | null,
  gradeB?: ModelIntInput | null,
  gradeC?: ModelIntInput | null,
  gradeD?: ModelIntInput | null,
  id?: ModelIDInput | null,
  isActive?: ModelBooleanInput | null,
  lessonWeightPercent?: ModelIntInput | null,
  name?: ModelStringInput | null,
  not?: ModelSemesterFilterInput | null,
  or?: Array< ModelSemesterFilterInput | null > | null,
  quizWeightPercent?: ModelIntInput | null,
  semesterType?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  testWeightPercent?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStudentInviteFilterInput = {
  and?: Array< ModelStudentInviteFilterInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelStudentInviteFilterInput | null,
  or?: Array< ModelStudentInviteFilterInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  token?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type ModelStudentInviteConnection = {
  __typename: "ModelStudentInviteConnection",
  items:  Array<StudentInvite | null >,
  nextToken?: string | null,
};

export type ModelStudentProfileFilterInput = {
  and?: Array< ModelStudentProfileFilterInput | null > | null,
  archivedAt?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  enrolledAt?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelStudentProfileFilterInput | null,
  or?: Array< ModelStudentProfileFilterInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentEmail2?: ModelStringInput | null,
  parentName?: ModelStringInput | null,
  parentName2?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  preferredName?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  status?: ModelStringInput | null,
  statusReason?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelStudentProfileConnection = {
  __typename: "ModelStudentProfileConnection",
  items:  Array<StudentProfile | null >,
  nextToken?: string | null,
};

export type ModelSubmissionMessageFilterInput = {
  and?: Array< ModelSubmissionMessageFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isRead?: ModelBooleanInput | null,
  message?: ModelStringInput | null,
  not?: ModelSubmissionMessageFilterInput | null,
  or?: Array< ModelSubmissionMessageFilterInput | null > | null,
  senderId?: ModelStringInput | null,
  senderType?: ModelStringInput | null,
  submissionMessagesId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelSubmissionFilterInput = {
  and?: Array< ModelSubmissionFilterInput | null > | null,
  answers?: ModelStringInput | null,
  archivedAt?: ModelStringInput | null,
  assignmentSubmissionsId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  id?: ModelIDInput | null,
  imageUrls?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  lessonTemplateId?: ModelStringInput | null,
  not?: ModelSubmissionFilterInput | null,
  or?: Array< ModelSubmissionFilterInput | null > | null,
  returnDueDate?: ModelStringInput | null,
  returnReason?: ModelStringInput | null,
  status?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelSyllabusFilterInput = {
  and?: Array< ModelSyllabusFilterInput | null > | null,
  courseId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelSyllabusFilterInput | null,
  or?: Array< ModelSyllabusFilterInput | null > | null,
  pdfKey?: ModelStringInput | null,
  publishedAt?: ModelStringInput | null,
  publishedPdfKey?: ModelStringInput | null,
  semesterId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelSyllabusConnection = {
  __typename: "ModelSyllabusConnection",
  items:  Array<Syllabus | null >,
  nextToken?: string | null,
};

export type ModelTeacherProfileFilterInput = {
  and?: Array< ModelTeacherProfileFilterInput | null > | null,
  bio?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  email?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelTeacherProfileFilterInput | null,
  or?: Array< ModelTeacherProfileFilterInput | null > | null,
  profilePictureKey?: ModelStringInput | null,
  teachingVoice?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelTeacherProfileConnection = {
  __typename: "ModelTeacherProfileConnection",
  items:  Array<TeacherProfile | null >,
  nextToken?: string | null,
};

export type ModelVideoWatchFilterInput = {
  and?: Array< ModelVideoWatchFilterInput | null > | null,
  completed?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  durationSeconds?: ModelFloatInput | null,
  id?: ModelIDInput | null,
  lastWatchedAt?: ModelStringInput | null,
  lessonId?: ModelStringInput | null,
  not?: ModelVideoWatchFilterInput | null,
  or?: Array< ModelVideoWatchFilterInput | null > | null,
  percentWatched?: ModelFloatInput | null,
  studentId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  watchedSeconds?: ModelFloatInput | null,
  weeklyPlanItemId?: ModelStringInput | null,
};

export type ModelVideoWatchConnection = {
  __typename: "ModelVideoWatchConnection",
  items:  Array<VideoWatch | null >,
  nextToken?: string | null,
};

export type ModelWeeklyPlanItemFilterInput = {
  and?: Array< ModelWeeklyPlanItemFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  dayOfWeek?: ModelStringInput | null,
  dueTime?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isPublished?: ModelBooleanInput | null,
  lessonTemplateId?: ModelIDInput | null,
  lessonWeeklyPlanItemsId?: ModelIDInput | null,
  not?: ModelWeeklyPlanItemFilterInput | null,
  or?: Array< ModelWeeklyPlanItemFilterInput | null > | null,
  updatedAt?: ModelStringInput | null,
  weeklyPlanItemsId?: ModelIDInput | null,
  zoomJoinUrl?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  zoomStartTime?: ModelStringInput | null,
};

export type ModelWeeklyPlanFilterInput = {
  and?: Array< ModelWeeklyPlanFilterInput | null > | null,
  assignedStudentIds?: ModelStringInput | null,
  courseWeeklyPlansId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelWeeklyPlanFilterInput | null,
  or?: Array< ModelWeeklyPlanFilterInput | null > | null,
  semesterWeeklyPlansId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  weekStartDate?: ModelStringInput | null,
};

export type ModelZoomMeetingFilterInput = {
  and?: Array< ModelZoomMeetingFilterInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  durationMinutes?: ModelIntInput | null,
  id?: ModelIDInput | null,
  inviteeType?: ModelStringInput | null,
  joinUrl?: ModelStringInput | null,
  not?: ModelZoomMeetingFilterInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelZoomMeetingFilterInput | null > | null,
  parentId?: ModelStringInput | null,
  startTime?: ModelStringInput | null,
  startUrl?: ModelStringInput | null,
  studentIds?: ModelStringInput | null,
  topic?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
};

export type ModelZoomMeetingConnection = {
  __typename: "ModelZoomMeetingConnection",
  items:  Array<ZoomMeeting | null >,
  nextToken?: string | null,
};

export type ModelAcademicYearConditionInput = {
  and?: Array< ModelAcademicYearConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelAcademicYearConditionInput | null,
  or?: Array< ModelAcademicYearConditionInput | null > | null,
  updatedAt?: ModelStringInput | null,
  year?: ModelStringInput | null,
};

export type CreateAcademicYearInput = {
  id?: string | null,
  year: string,
};

export type ModelAnnouncementConditionInput = {
  and?: Array< ModelAnnouncementConditionInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  message?: ModelStringInput | null,
  not?: ModelAnnouncementConditionInput | null,
  or?: Array< ModelAnnouncementConditionInput | null > | null,
  recipientCount?: ModelIntInput | null,
  recipientIds?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  subject?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAnnouncementInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  id?: string | null,
  message: string,
  recipientCount?: number | null,
  recipientIds: string,
  sentAt: string,
  subject: string,
};

export type ModelAssignmentConditionInput = {
  and?: Array< ModelAssignmentConditionInput | null > | null,
  courseAssignmentsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  not?: ModelAssignmentConditionInput | null,
  or?: Array< ModelAssignmentConditionInput | null > | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  weeklyPlanItemAssignmentsId?: ModelIDInput | null,
};

export type CreateAssignmentInput = {
  courseAssignmentsId?: string | null,
  description?: string | null,
  dueDate?: string | null,
  id?: string | null,
  title: string,
  weeklyPlanItemAssignmentsId?: string | null,
};

export type ModelAssignmentQuestionConditionInput = {
  and?: Array< ModelAssignmentQuestionConditionInput | null > | null,
  choices?: ModelStringInput | null,
  correctAnswer?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  diagramKey?: ModelStringInput | null,
  diagramSpec?: ModelStringInput | null,
  lessonTemplateQuestionsId?: ModelIDInput | null,
  not?: ModelAssignmentQuestionConditionInput | null,
  or?: Array< ModelAssignmentQuestionConditionInput | null > | null,
  order?: ModelIntInput | null,
  questionText?: ModelStringInput | null,
  questionType?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAssignmentQuestionInput = {
  choices?: string | null,
  correctAnswer?: string | null,
  diagramKey?: string | null,
  diagramSpec?: string | null,
  id?: string | null,
  lessonTemplateQuestionsId?: string | null,
  order: number,
  questionText: string,
  questionType: string,
};

export type ModelCourseConditionInput = {
  and?: Array< ModelCourseConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  not?: ModelCourseConditionInput | null,
  or?: Array< ModelCourseConditionInput | null > | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateCourseInput = {
  description?: string | null,
  gradeLevel?: string | null,
  id?: string | null,
  isArchived?: boolean | null,
  title: string,
};

export type ModelEnrollmentConditionInput = {
  and?: Array< ModelEnrollmentConditionInput | null > | null,
  courseEnrollmentsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelEnrollmentConditionInput | null,
  or?: Array< ModelEnrollmentConditionInput | null > | null,
  planType?: ModelStringInput | null,
  semesterEnrollmentsId?: ModelIDInput | null,
  studentId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateEnrollmentInput = {
  courseEnrollmentsId?: string | null,
  id?: string | null,
  planType?: string | null,
  semesterEnrollmentsId?: string | null,
  studentId: string,
};

export type ModelLessonConditionInput = {
  and?: Array< ModelLessonConditionInput | null > | null,
  courseLessonsId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  not?: ModelLessonConditionInput | null,
  or?: Array< ModelLessonConditionInput | null > | null,
  order?: ModelIntInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
};

export type CreateLessonInput = {
  courseLessonsId?: string | null,
  id?: string | null,
  instructions?: string | null,
  isPublished?: boolean | null,
  order?: number | null,
  title: string,
  videoUrl?: string | null,
};

export type ModelLessonTemplateConditionInput = {
  and?: Array< ModelLessonTemplateConditionInput | null > | null,
  assignmentType?: ModelStringInput | null,
  courseLessonTemplatesId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  lessonCategory?: ModelStringInput | null,
  lessonNumber?: ModelIntInput | null,
  not?: ModelLessonTemplateConditionInput | null,
  or?: Array< ModelLessonTemplateConditionInput | null > | null,
  teachingNotes?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  videoUrl?: ModelStringInput | null,
  worksheetUrl?: ModelStringInput | null,
};

export type CreateLessonTemplateInput = {
  assignmentType?: string | null,
  courseLessonTemplatesId?: string | null,
  id?: string | null,
  instructions?: string | null,
  isArchived?: boolean | null,
  lessonCategory?: string | null,
  lessonNumber: number,
  teachingNotes?: string | null,
  title: string,
  videoUrl?: string | null,
  worksheetUrl?: string | null,
};

export type ModelMessageConditionInput = {
  and?: Array< ModelMessageConditionInput | null > | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  isArchivedByTeacher?: ModelBooleanInput | null,
  isDeletedByStudent?: ModelBooleanInput | null,
  isRead?: ModelBooleanInput | null,
  isTeacherInitiated?: ModelBooleanInput | null,
  not?: ModelMessageConditionInput | null,
  or?: Array< ModelMessageConditionInput | null > | null,
  repliedAt?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  teacherReply?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateMessageInput = {
  content: string,
  id?: string | null,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isRead?: boolean | null,
  isTeacherInitiated?: boolean | null,
  repliedAt?: string | null,
  sentAt: string,
  studentId: string,
  studentName?: string | null,
  teacherReply?: string | null,
};

export type ModelParentInviteConditionInput = {
  and?: Array< ModelParentInviteConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelParentInviteConditionInput | null,
  or?: Array< ModelParentInviteConditionInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  token?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type CreateParentInviteInput = {
  id?: string | null,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  studentEmail: string,
  studentName: string,
  token: string,
  used?: boolean | null,
};

export type ModelParentProfileConditionInput = {
  and?: Array< ModelParentProfileConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelParentProfileConditionInput | null,
  or?: Array< ModelParentProfileConditionInput | null > | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateParentProfileInput = {
  email: string,
  firstName: string,
  id?: string | null,
  lastName: string,
  userId: string,
};

export type ModelParentStudentConditionInput = {
  and?: Array< ModelParentStudentConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelParentStudentConditionInput | null,
  or?: Array< ModelParentStudentConditionInput | null > | null,
  parentId?: ModelStringInput | null,
  studentEmail?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateParentStudentInput = {
  id?: string | null,
  parentId: string,
  studentEmail: string,
  studentName: string,
};

export type ModelParentStudentLinkConditionInput = {
  and?: Array< ModelParentStudentLinkConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelParentStudentLinkConditionInput | null,
  or?: Array< ModelParentStudentLinkConditionInput | null > | null,
  parentProfileId?: ModelIDInput | null,
  studentProfileId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateParentStudentLinkInput = {
  id?: string | null,
  parentProfileId: string,
  studentProfileId: string,
};

export type ModelQuarterConditionInput = {
  academicYearQuartersId?: ModelIDInput | null,
  and?: Array< ModelQuarterConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelQuarterConditionInput | null,
  or?: Array< ModelQuarterConditionInput | null > | null,
  order?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateQuarterInput = {
  academicYearQuartersId?: string | null,
  endDate: string,
  id?: string | null,
  name: string,
  order: number,
  startDate: string,
};

export type ModelReportCardRecordConditionInput = {
  and?: Array< ModelReportCardRecordConditionInput | null > | null,
  comment?: ModelStringInput | null,
  courseName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  finalLetter?: ModelStringInput | null,
  not?: ModelReportCardRecordConditionInput | null,
  or?: Array< ModelReportCardRecordConditionInput | null > | null,
  quarterBreakdown?: ModelStringInput | null,
  quarterId?: ModelStringInput | null,
  recipientEmails?: ModelStringInput | null,
  reportTitle?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  semesterName?: ModelStringInput | null,
  sentAt?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  studentName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  weightedAvg?: ModelFloatInput | null,
};

export type CreateReportCardRecordInput = {
  comment?: string | null,
  courseName: string,
  finalLetter?: string | null,
  id?: string | null,
  quarterBreakdown?: string | null,
  quarterId?: string | null,
  recipientEmails?: string | null,
  reportTitle: string,
  semesterId: string,
  semesterName: string,
  sentAt: string,
  studentId: string,
  studentName: string,
  weightedAvg?: number | null,
};

export type ModelSemesterConditionInput = {
  academicYearSemestersId?: ModelIDInput | null,
  and?: Array< ModelSemesterConditionInput | null > | null,
  courseId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  gradeA?: ModelIntInput | null,
  gradeB?: ModelIntInput | null,
  gradeC?: ModelIntInput | null,
  gradeD?: ModelIntInput | null,
  isActive?: ModelBooleanInput | null,
  lessonWeightPercent?: ModelIntInput | null,
  name?: ModelStringInput | null,
  not?: ModelSemesterConditionInput | null,
  or?: Array< ModelSemesterConditionInput | null > | null,
  quizWeightPercent?: ModelIntInput | null,
  semesterType?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  testWeightPercent?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateSemesterInput = {
  academicYearSemestersId?: string | null,
  courseId?: string | null,
  endDate: string,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  id?: string | null,
  isActive?: boolean | null,
  lessonWeightPercent?: number | null,
  name: string,
  quizWeightPercent?: number | null,
  semesterType?: string | null,
  startDate: string,
  testWeightPercent?: number | null,
};

export type ModelStudentInviteConditionInput = {
  and?: Array< ModelStudentInviteConditionInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelStudentInviteConditionInput | null,
  or?: Array< ModelStudentInviteConditionInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentFirstName?: ModelStringInput | null,
  parentLastName?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  semesterId?: ModelStringInput | null,
  token?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type CreateStudentInviteInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  email: string,
  firstName: string,
  id?: string | null,
  lastName: string,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  planType: string,
  semesterId?: string | null,
  token: string,
  used?: boolean | null,
};

export type ModelStudentProfileConditionInput = {
  and?: Array< ModelStudentProfileConditionInput | null > | null,
  archivedAt?: ModelStringInput | null,
  courseId?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  enrolledAt?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  gradeLevel?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelStudentProfileConditionInput | null,
  or?: Array< ModelStudentProfileConditionInput | null > | null,
  parentEmail?: ModelStringInput | null,
  parentEmail2?: ModelStringInput | null,
  parentName?: ModelStringInput | null,
  parentName2?: ModelStringInput | null,
  planType?: ModelStringInput | null,
  preferredName?: ModelStringInput | null,
  profilePictureKey?: ModelStringInput | null,
  status?: ModelStringInput | null,
  statusReason?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateStudentProfileInput = {
  archivedAt?: string | null,
  courseId?: string | null,
  email: string,
  enrolledAt?: string | null,
  firstName: string,
  gradeLevel?: string | null,
  id?: string | null,
  lastName: string,
  parentEmail?: string | null,
  parentEmail2?: string | null,
  parentName?: string | null,
  parentName2?: string | null,
  planType?: string | null,
  preferredName?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  userId: string,
};

export type ModelSubmissionConditionInput = {
  and?: Array< ModelSubmissionConditionInput | null > | null,
  answers?: ModelStringInput | null,
  archivedAt?: ModelStringInput | null,
  assignmentSubmissionsId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  grade?: ModelStringInput | null,
  imageUrls?: ModelStringInput | null,
  isArchived?: ModelBooleanInput | null,
  lessonTemplateId?: ModelStringInput | null,
  not?: ModelSubmissionConditionInput | null,
  or?: Array< ModelSubmissionConditionInput | null > | null,
  returnDueDate?: ModelStringInput | null,
  returnReason?: ModelStringInput | null,
  status?: ModelStringInput | null,
  studentId?: ModelStringInput | null,
  submittedAt?: ModelStringInput | null,
  teacherComment?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateSubmissionInput = {
  answers?: string | null,
  archivedAt?: string | null,
  assignmentSubmissionsId?: string | null,
  content?: string | null,
  grade?: string | null,
  id?: string | null,
  imageUrls?: string | null,
  isArchived?: boolean | null,
  lessonTemplateId?: string | null,
  returnDueDate?: string | null,
  returnReason?: string | null,
  status?: string | null,
  studentId: string,
  submittedAt?: string | null,
  teacherComment?: string | null,
};

export type ModelSubmissionMessageConditionInput = {
  and?: Array< ModelSubmissionMessageConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  message?: ModelStringInput | null,
  not?: ModelSubmissionMessageConditionInput | null,
  or?: Array< ModelSubmissionMessageConditionInput | null > | null,
  senderId?: ModelStringInput | null,
  senderType?: ModelStringInput | null,
  submissionMessagesId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateSubmissionMessageInput = {
  id?: string | null,
  isRead?: boolean | null,
  message: string,
  senderId: string,
  senderType: string,
  submissionMessagesId?: string | null,
};

export type ModelSyllabusConditionInput = {
  and?: Array< ModelSyllabusConditionInput | null > | null,
  courseId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelSyllabusConditionInput | null,
  or?: Array< ModelSyllabusConditionInput | null > | null,
  pdfKey?: ModelStringInput | null,
  publishedAt?: ModelStringInput | null,
  publishedPdfKey?: ModelStringInput | null,
  semesterId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateSyllabusInput = {
  courseId: string,
  id?: string | null,
  pdfKey?: string | null,
  publishedAt?: string | null,
  publishedPdfKey?: string | null,
  semesterId: string,
};

export type ModelTeacherProfileConditionInput = {
  and?: Array< ModelTeacherProfileConditionInput | null > | null,
  bio?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  email?: ModelStringInput | null,
  not?: ModelTeacherProfileConditionInput | null,
  or?: Array< ModelTeacherProfileConditionInput | null > | null,
  profilePictureKey?: ModelStringInput | null,
  teachingVoice?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateTeacherProfileInput = {
  bio?: string | null,
  displayName?: string | null,
  email: string,
  id?: string | null,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
  userId: string,
};

export type ModelVideoWatchConditionInput = {
  and?: Array< ModelVideoWatchConditionInput | null > | null,
  completed?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  durationSeconds?: ModelFloatInput | null,
  lastWatchedAt?: ModelStringInput | null,
  lessonId?: ModelStringInput | null,
  not?: ModelVideoWatchConditionInput | null,
  or?: Array< ModelVideoWatchConditionInput | null > | null,
  percentWatched?: ModelFloatInput | null,
  studentId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  watchedSeconds?: ModelFloatInput | null,
  weeklyPlanItemId?: ModelStringInput | null,
};

export type CreateVideoWatchInput = {
  completed?: boolean | null,
  durationSeconds?: number | null,
  id?: string | null,
  lastWatchedAt?: string | null,
  lessonId: string,
  percentWatched?: number | null,
  studentId: string,
  watchedSeconds?: number | null,
  weeklyPlanItemId?: string | null,
};

export type ModelWeeklyPlanConditionInput = {
  and?: Array< ModelWeeklyPlanConditionInput | null > | null,
  assignedStudentIds?: ModelStringInput | null,
  courseWeeklyPlansId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelWeeklyPlanConditionInput | null,
  or?: Array< ModelWeeklyPlanConditionInput | null > | null,
  semesterWeeklyPlansId?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  weekStartDate?: ModelStringInput | null,
};

export type CreateWeeklyPlanInput = {
  assignedStudentIds?: string | null,
  courseWeeklyPlansId?: string | null,
  id?: string | null,
  semesterWeeklyPlansId?: string | null,
  weekStartDate: string,
};

export type ModelWeeklyPlanItemConditionInput = {
  and?: Array< ModelWeeklyPlanItemConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  dayOfWeek?: ModelStringInput | null,
  dueTime?: ModelStringInput | null,
  isPublished?: ModelBooleanInput | null,
  lessonTemplateId?: ModelIDInput | null,
  lessonWeeklyPlanItemsId?: ModelIDInput | null,
  not?: ModelWeeklyPlanItemConditionInput | null,
  or?: Array< ModelWeeklyPlanItemConditionInput | null > | null,
  updatedAt?: ModelStringInput | null,
  weeklyPlanItemsId?: ModelIDInput | null,
  zoomJoinUrl?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
  zoomStartTime?: ModelStringInput | null,
};

export type CreateWeeklyPlanItemInput = {
  dayOfWeek: string,
  dueTime?: string | null,
  id?: string | null,
  isPublished?: boolean | null,
  lessonTemplateId?: string | null,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
};

export type ModelZoomMeetingConditionInput = {
  and?: Array< ModelZoomMeetingConditionInput | null > | null,
  courseId?: ModelStringInput | null,
  courseTitle?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  durationMinutes?: ModelIntInput | null,
  inviteeType?: ModelStringInput | null,
  joinUrl?: ModelStringInput | null,
  not?: ModelZoomMeetingConditionInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelZoomMeetingConditionInput | null > | null,
  parentId?: ModelStringInput | null,
  startTime?: ModelStringInput | null,
  startUrl?: ModelStringInput | null,
  studentIds?: ModelStringInput | null,
  topic?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  zoomMeetingId?: ModelStringInput | null,
};

export type CreateZoomMeetingInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  durationMinutes: number,
  id?: string | null,
  inviteeType: string,
  joinUrl: string,
  notes?: string | null,
  parentId?: string | null,
  startTime: string,
  startUrl?: string | null,
  studentIds?: string | null,
  topic: string,
  zoomMeetingId?: string | null,
};

export type DeleteAcademicYearInput = {
  id: string,
};

export type DeleteAnnouncementInput = {
  id: string,
};

export type DeleteAssignmentInput = {
  id: string,
};

export type DeleteAssignmentQuestionInput = {
  id: string,
};

export type DeleteCourseInput = {
  id: string,
};

export type DeleteEnrollmentInput = {
  id: string,
};

export type DeleteLessonInput = {
  id: string,
};

export type DeleteLessonTemplateInput = {
  id: string,
};

export type DeleteMessageInput = {
  id: string,
};

export type DeleteParentInviteInput = {
  id: string,
};

export type DeleteParentProfileInput = {
  id: string,
};

export type DeleteParentStudentInput = {
  id: string,
};

export type DeleteParentStudentLinkInput = {
  id: string,
};

export type DeleteQuarterInput = {
  id: string,
};

export type DeleteReportCardRecordInput = {
  id: string,
};

export type DeleteSemesterInput = {
  id: string,
};

export type DeleteStudentInviteInput = {
  id: string,
};

export type DeleteStudentProfileInput = {
  id: string,
};

export type DeleteSubmissionInput = {
  id: string,
};

export type DeleteSubmissionMessageInput = {
  id: string,
};

export type DeleteSyllabusInput = {
  id: string,
};

export type DeleteTeacherProfileInput = {
  id: string,
};

export type DeleteVideoWatchInput = {
  id: string,
};

export type DeleteWeeklyPlanInput = {
  id: string,
};

export type DeleteWeeklyPlanItemInput = {
  id: string,
};

export type DeleteZoomMeetingInput = {
  id: string,
};

export type UpdateAcademicYearInput = {
  id: string,
  year?: string | null,
};

export type UpdateAnnouncementInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  id: string,
  message?: string | null,
  recipientCount?: number | null,
  recipientIds?: string | null,
  sentAt?: string | null,
  subject?: string | null,
};

export type UpdateAssignmentInput = {
  courseAssignmentsId?: string | null,
  description?: string | null,
  dueDate?: string | null,
  id: string,
  title?: string | null,
  weeklyPlanItemAssignmentsId?: string | null,
};

export type UpdateAssignmentQuestionInput = {
  choices?: string | null,
  correctAnswer?: string | null,
  diagramKey?: string | null,
  diagramSpec?: string | null,
  id: string,
  lessonTemplateQuestionsId?: string | null,
  order?: number | null,
  questionText?: string | null,
  questionType?: string | null,
};

export type UpdateCourseInput = {
  description?: string | null,
  gradeLevel?: string | null,
  id: string,
  isArchived?: boolean | null,
  title?: string | null,
};

export type UpdateEnrollmentInput = {
  courseEnrollmentsId?: string | null,
  id: string,
  planType?: string | null,
  semesterEnrollmentsId?: string | null,
  studentId?: string | null,
};

export type UpdateLessonInput = {
  courseLessonsId?: string | null,
  id: string,
  instructions?: string | null,
  isPublished?: boolean | null,
  order?: number | null,
  title?: string | null,
  videoUrl?: string | null,
};

export type UpdateLessonTemplateInput = {
  assignmentType?: string | null,
  courseLessonTemplatesId?: string | null,
  id: string,
  instructions?: string | null,
  isArchived?: boolean | null,
  lessonCategory?: string | null,
  lessonNumber?: number | null,
  teachingNotes?: string | null,
  title?: string | null,
  videoUrl?: string | null,
  worksheetUrl?: string | null,
};

export type UpdateMessageInput = {
  content?: string | null,
  id: string,
  isArchivedByTeacher?: boolean | null,
  isDeletedByStudent?: boolean | null,
  isRead?: boolean | null,
  isTeacherInitiated?: boolean | null,
  repliedAt?: string | null,
  sentAt?: string | null,
  studentId?: string | null,
  studentName?: string | null,
  teacherReply?: string | null,
};

export type UpdateParentInviteInput = {
  id: string,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  studentEmail?: string | null,
  studentName?: string | null,
  token?: string | null,
  used?: boolean | null,
};

export type UpdateParentProfileInput = {
  email?: string | null,
  firstName?: string | null,
  id: string,
  lastName?: string | null,
  userId?: string | null,
};

export type UpdateParentStudentInput = {
  id: string,
  parentId?: string | null,
  studentEmail?: string | null,
  studentName?: string | null,
};

export type UpdateParentStudentLinkInput = {
  id: string,
  parentProfileId?: string | null,
  studentProfileId?: string | null,
};

export type UpdateQuarterInput = {
  academicYearQuartersId?: string | null,
  endDate?: string | null,
  id: string,
  name?: string | null,
  order?: number | null,
  startDate?: string | null,
};

export type UpdateReportCardRecordInput = {
  comment?: string | null,
  courseName?: string | null,
  finalLetter?: string | null,
  id: string,
  quarterBreakdown?: string | null,
  quarterId?: string | null,
  recipientEmails?: string | null,
  reportTitle?: string | null,
  semesterId?: string | null,
  semesterName?: string | null,
  sentAt?: string | null,
  studentId?: string | null,
  studentName?: string | null,
  weightedAvg?: number | null,
};

export type UpdateSemesterInput = {
  academicYearSemestersId?: string | null,
  courseId?: string | null,
  endDate?: string | null,
  gradeA?: number | null,
  gradeB?: number | null,
  gradeC?: number | null,
  gradeD?: number | null,
  id: string,
  isActive?: boolean | null,
  lessonWeightPercent?: number | null,
  name?: string | null,
  quizWeightPercent?: number | null,
  semesterType?: string | null,
  startDate?: string | null,
  testWeightPercent?: number | null,
};

export type UpdateStudentInviteInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  email?: string | null,
  firstName?: string | null,
  id: string,
  lastName?: string | null,
  parentEmail?: string | null,
  parentFirstName?: string | null,
  parentLastName?: string | null,
  planType?: string | null,
  semesterId?: string | null,
  token?: string | null,
  used?: boolean | null,
};

export type UpdateStudentProfileInput = {
  archivedAt?: string | null,
  courseId?: string | null,
  email?: string | null,
  enrolledAt?: string | null,
  firstName?: string | null,
  gradeLevel?: string | null,
  id: string,
  lastName?: string | null,
  parentEmail?: string | null,
  parentEmail2?: string | null,
  parentName?: string | null,
  parentName2?: string | null,
  planType?: string | null,
  preferredName?: string | null,
  profilePictureKey?: string | null,
  status?: string | null,
  statusReason?: string | null,
  userId?: string | null,
};

export type UpdateSubmissionInput = {
  answers?: string | null,
  archivedAt?: string | null,
  assignmentSubmissionsId?: string | null,
  content?: string | null,
  grade?: string | null,
  id: string,
  imageUrls?: string | null,
  isArchived?: boolean | null,
  lessonTemplateId?: string | null,
  returnDueDate?: string | null,
  returnReason?: string | null,
  status?: string | null,
  studentId?: string | null,
  submittedAt?: string | null,
  teacherComment?: string | null,
};

export type UpdateSubmissionMessageInput = {
  id: string,
  isRead?: boolean | null,
  message?: string | null,
  senderId?: string | null,
  senderType?: string | null,
  submissionMessagesId?: string | null,
};

export type UpdateSyllabusInput = {
  courseId?: string | null,
  id: string,
  pdfKey?: string | null,
  publishedAt?: string | null,
  publishedPdfKey?: string | null,
  semesterId?: string | null,
};

export type UpdateTeacherProfileInput = {
  bio?: string | null,
  displayName?: string | null,
  email?: string | null,
  id: string,
  profilePictureKey?: string | null,
  teachingVoice?: string | null,
  userId?: string | null,
};

export type UpdateVideoWatchInput = {
  completed?: boolean | null,
  durationSeconds?: number | null,
  id: string,
  lastWatchedAt?: string | null,
  lessonId?: string | null,
  percentWatched?: number | null,
  studentId?: string | null,
  watchedSeconds?: number | null,
  weeklyPlanItemId?: string | null,
};

export type UpdateWeeklyPlanInput = {
  assignedStudentIds?: string | null,
  courseWeeklyPlansId?: string | null,
  id: string,
  semesterWeeklyPlansId?: string | null,
  weekStartDate?: string | null,
};

export type UpdateWeeklyPlanItemInput = {
  dayOfWeek?: string | null,
  dueTime?: string | null,
  id: string,
  isPublished?: boolean | null,
  lessonTemplateId?: string | null,
  lessonWeeklyPlanItemsId?: string | null,
  weeklyPlanItemsId?: string | null,
  zoomJoinUrl?: string | null,
  zoomMeetingId?: string | null,
  zoomStartTime?: string | null,
};

export type UpdateZoomMeetingInput = {
  courseId?: string | null,
  courseTitle?: string | null,
  durationMinutes?: number | null,
  id: string,
  inviteeType?: string | null,
  joinUrl?: string | null,
  notes?: string | null,
  parentId?: string | null,
  startTime?: string | null,
  startUrl?: string | null,
  studentIds?: string | null,
  topic?: string | null,
  zoomMeetingId?: string | null,
};

export type ModelSubscriptionAcademicYearFilterInput = {
  and?: Array< ModelSubscriptionAcademicYearFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionAcademicYearFilterInput | null > | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  year?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionAnnouncementFilterInput = {
  and?: Array< ModelSubscriptionAnnouncementFilterInput | null > | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  message?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAnnouncementFilterInput | null > | null,
  recipientCount?: ModelSubscriptionIntInput | null,
  recipientIds?: ModelSubscriptionStringInput | null,
  sentAt?: ModelSubscriptionStringInput | null,
  subject?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionAssignmentFilterInput = {
  and?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  courseAssignmentsId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  dueDate?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  weeklyPlanItemAssignmentsId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionAssignmentQuestionFilterInput = {
  and?: Array< ModelSubscriptionAssignmentQuestionFilterInput | null > | null,
  choices?: ModelSubscriptionStringInput | null,
  correctAnswer?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  diagramKey?: ModelSubscriptionStringInput | null,
  diagramSpec?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lessonTemplateQuestionsId?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionAssignmentQuestionFilterInput | null > | null,
  order?: ModelSubscriptionIntInput | null,
  questionText?: ModelSubscriptionStringInput | null,
  questionType?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionCourseFilterInput = {
  and?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  gradeLevel?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isArchived?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionCourseFilterInput | null > | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionEnrollmentFilterInput = {
  and?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
  courseEnrollmentsId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionEnrollmentFilterInput | null > | null,
  planType?: ModelSubscriptionStringInput | null,
  semesterEnrollmentsId?: ModelSubscriptionIDInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionLessonFilterInput = {
  and?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  courseLessonsId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  isPublished?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionLessonFilterInput | null > | null,
  order?: ModelSubscriptionIntInput | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionLessonTemplateFilterInput = {
  and?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
  assignmentType?: ModelSubscriptionStringInput | null,
  courseLessonTemplatesId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  isArchived?: ModelSubscriptionBooleanInput | null,
  lessonCategory?: ModelSubscriptionStringInput | null,
  lessonNumber?: ModelSubscriptionIntInput | null,
  or?: Array< ModelSubscriptionLessonTemplateFilterInput | null > | null,
  teachingNotes?: ModelSubscriptionStringInput | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  videoUrl?: ModelSubscriptionStringInput | null,
  worksheetUrl?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionMessageFilterInput = {
  and?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  content?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isArchivedByTeacher?: ModelSubscriptionBooleanInput | null,
  isDeletedByStudent?: ModelSubscriptionBooleanInput | null,
  isRead?: ModelSubscriptionBooleanInput | null,
  isTeacherInitiated?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  repliedAt?: ModelSubscriptionStringInput | null,
  sentAt?: ModelSubscriptionStringInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  teacherReply?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionParentInviteFilterInput = {
  and?: Array< ModelSubscriptionParentInviteFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionParentInviteFilterInput | null > | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  parentFirstName?: ModelSubscriptionStringInput | null,
  parentLastName?: ModelSubscriptionStringInput | null,
  studentEmail?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  token?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  used?: ModelSubscriptionBooleanInput | null,
};

export type ModelSubscriptionParentProfileFilterInput = {
  and?: Array< ModelSubscriptionParentProfileFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionParentProfileFilterInput | null > | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionParentStudentFilterInput = {
  and?: Array< ModelSubscriptionParentStudentFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionParentStudentFilterInput | null > | null,
  parentId?: ModelSubscriptionStringInput | null,
  studentEmail?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionParentStudentLinkFilterInput = {
  and?: Array< ModelSubscriptionParentStudentLinkFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionParentStudentLinkFilterInput | null > | null,
  parentProfileId?: ModelSubscriptionIDInput | null,
  studentProfileId?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionQuarterFilterInput = {
  academicYearQuartersId?: ModelSubscriptionIDInput | null,
  and?: Array< ModelSubscriptionQuarterFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionQuarterFilterInput | null > | null,
  order?: ModelSubscriptionIntInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionReportCardRecordFilterInput = {
  and?: Array< ModelSubscriptionReportCardRecordFilterInput | null > | null,
  comment?: ModelSubscriptionStringInput | null,
  courseName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  finalLetter?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionReportCardRecordFilterInput | null > | null,
  quarterBreakdown?: ModelSubscriptionStringInput | null,
  quarterId?: ModelSubscriptionStringInput | null,
  recipientEmails?: ModelSubscriptionStringInput | null,
  reportTitle?: ModelSubscriptionStringInput | null,
  semesterId?: ModelSubscriptionStringInput | null,
  semesterName?: ModelSubscriptionStringInput | null,
  sentAt?: ModelSubscriptionStringInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  studentName?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  weightedAvg?: ModelSubscriptionFloatInput | null,
};

export type ModelSubscriptionFloatInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionSemesterFilterInput = {
  academicYearSemestersId?: ModelSubscriptionIDInput | null,
  and?: Array< ModelSubscriptionSemesterFilterInput | null > | null,
  courseId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  gradeA?: ModelSubscriptionIntInput | null,
  gradeB?: ModelSubscriptionIntInput | null,
  gradeC?: ModelSubscriptionIntInput | null,
  gradeD?: ModelSubscriptionIntInput | null,
  id?: ModelSubscriptionIDInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  lessonWeightPercent?: ModelSubscriptionIntInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionSemesterFilterInput | null > | null,
  quizWeightPercent?: ModelSubscriptionIntInput | null,
  semesterType?: ModelSubscriptionStringInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  testWeightPercent?: ModelSubscriptionIntInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStudentInviteFilterInput = {
  and?: Array< ModelSubscriptionStudentInviteFilterInput | null > | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionStudentInviteFilterInput | null > | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  parentFirstName?: ModelSubscriptionStringInput | null,
  parentLastName?: ModelSubscriptionStringInput | null,
  planType?: ModelSubscriptionStringInput | null,
  semesterId?: ModelSubscriptionStringInput | null,
  token?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  used?: ModelSubscriptionBooleanInput | null,
};

export type ModelSubscriptionStudentProfileFilterInput = {
  and?: Array< ModelSubscriptionStudentProfileFilterInput | null > | null,
  archivedAt?: ModelSubscriptionStringInput | null,
  courseId?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  enrolledAt?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  gradeLevel?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionStudentProfileFilterInput | null > | null,
  parentEmail?: ModelSubscriptionStringInput | null,
  parentEmail2?: ModelSubscriptionStringInput | null,
  parentName?: ModelSubscriptionStringInput | null,
  parentName2?: ModelSubscriptionStringInput | null,
  planType?: ModelSubscriptionStringInput | null,
  preferredName?: ModelSubscriptionStringInput | null,
  profilePictureKey?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  statusReason?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionSubmissionFilterInput = {
  and?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  answers?: ModelSubscriptionStringInput | null,
  archivedAt?: ModelSubscriptionStringInput | null,
  assignmentSubmissionsId?: ModelSubscriptionIDInput | null,
  content?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  grade?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  imageUrls?: ModelSubscriptionStringInput | null,
  isArchived?: ModelSubscriptionBooleanInput | null,
  lessonTemplateId?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionSubmissionFilterInput | null > | null,
  returnDueDate?: ModelSubscriptionStringInput | null,
  returnReason?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  submittedAt?: ModelSubscriptionStringInput | null,
  teacherComment?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionSubmissionMessageFilterInput = {
  and?: Array< ModelSubscriptionSubmissionMessageFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isRead?: ModelSubscriptionBooleanInput | null,
  message?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionSubmissionMessageFilterInput | null > | null,
  senderId?: ModelSubscriptionStringInput | null,
  senderType?: ModelSubscriptionStringInput | null,
  submissionMessagesId?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionSyllabusFilterInput = {
  and?: Array< ModelSubscriptionSyllabusFilterInput | null > | null,
  courseId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionSyllabusFilterInput | null > | null,
  pdfKey?: ModelSubscriptionStringInput | null,
  publishedAt?: ModelSubscriptionStringInput | null,
  publishedPdfKey?: ModelSubscriptionStringInput | null,
  semesterId?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionTeacherProfileFilterInput = {
  and?: Array< ModelSubscriptionTeacherProfileFilterInput | null > | null,
  bio?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  displayName?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionTeacherProfileFilterInput | null > | null,
  profilePictureKey?: ModelSubscriptionStringInput | null,
  teachingVoice?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionVideoWatchFilterInput = {
  and?: Array< ModelSubscriptionVideoWatchFilterInput | null > | null,
  completed?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  durationSeconds?: ModelSubscriptionFloatInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastWatchedAt?: ModelSubscriptionStringInput | null,
  lessonId?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionVideoWatchFilterInput | null > | null,
  percentWatched?: ModelSubscriptionFloatInput | null,
  studentId?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  watchedSeconds?: ModelSubscriptionFloatInput | null,
  weeklyPlanItemId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionWeeklyPlanFilterInput = {
  and?: Array< ModelSubscriptionWeeklyPlanFilterInput | null > | null,
  assignedStudentIds?: ModelSubscriptionStringInput | null,
  courseWeeklyPlansId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionWeeklyPlanFilterInput | null > | null,
  semesterWeeklyPlansId?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  weekStartDate?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionWeeklyPlanItemFilterInput = {
  and?: Array< ModelSubscriptionWeeklyPlanItemFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  dayOfWeek?: ModelSubscriptionStringInput | null,
  dueTime?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isPublished?: ModelSubscriptionBooleanInput | null,
  lessonTemplateId?: ModelSubscriptionIDInput | null,
  lessonWeeklyPlanItemsId?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionWeeklyPlanItemFilterInput | null > | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  weeklyPlanItemsId?: ModelSubscriptionIDInput | null,
  zoomJoinUrl?: ModelSubscriptionStringInput | null,
  zoomMeetingId?: ModelSubscriptionStringInput | null,
  zoomStartTime?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionZoomMeetingFilterInput = {
  and?: Array< ModelSubscriptionZoomMeetingFilterInput | null > | null,
  courseId?: ModelSubscriptionStringInput | null,
  courseTitle?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  durationMinutes?: ModelSubscriptionIntInput | null,
  id?: ModelSubscriptionIDInput | null,
  inviteeType?: ModelSubscriptionStringInput | null,
  joinUrl?: ModelSubscriptionStringInput | null,
  notes?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionZoomMeetingFilterInput | null > | null,
  parentId?: ModelSubscriptionStringInput | null,
  startTime?: ModelSubscriptionStringInput | null,
  startUrl?: ModelSubscriptionStringInput | null,
  studentIds?: ModelSubscriptionStringInput | null,
  topic?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  zoomMeetingId?: ModelSubscriptionStringInput | null,
};

export type GetAcademicYearQueryVariables = {
  id: string,
};

export type GetAcademicYearQuery = {
  getAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type GetAnnouncementQueryVariables = {
  id: string,
};

export type GetAnnouncementQuery = {
  getAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type GetAssignmentQueryVariables = {
  id: string,
};

export type GetAssignmentQuery = {
  getAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type GetAssignmentQuestionQueryVariables = {
  id: string,
};

export type GetAssignmentQuestionQuery = {
  getAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type GetCourseQueryVariables = {
  id: string,
};

export type GetCourseQuery = {
  getCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type GetEnrollmentQueryVariables = {
  id: string,
};

export type GetEnrollmentQuery = {
  getEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type GetLessonQueryVariables = {
  id: string,
};

export type GetLessonQuery = {
  getLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type GetLessonTemplateQueryVariables = {
  id: string,
};

export type GetLessonTemplateQuery = {
  getLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type GetMessageQueryVariables = {
  id: string,
};

export type GetMessageQuery = {
  getMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type GetParentInviteQueryVariables = {
  id: string,
};

export type GetParentInviteQuery = {
  getParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type GetParentProfileQueryVariables = {
  id: string,
};

export type GetParentProfileQuery = {
  getParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type GetParentStudentQueryVariables = {
  id: string,
};

export type GetParentStudentQuery = {
  getParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type GetParentStudentLinkQueryVariables = {
  id: string,
};

export type GetParentStudentLinkQuery = {
  getParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type GetQuarterQueryVariables = {
  id: string,
};

export type GetQuarterQuery = {
  getQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type GetReportCardRecordQueryVariables = {
  id: string,
};

export type GetReportCardRecordQuery = {
  getReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type GetSemesterQueryVariables = {
  id: string,
};

export type GetSemesterQuery = {
  getSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type GetStudentInviteQueryVariables = {
  id: string,
};

export type GetStudentInviteQuery = {
  getStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type GetStudentProfileQueryVariables = {
  id: string,
};

export type GetStudentProfileQuery = {
  getStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type GetSubmissionQueryVariables = {
  id: string,
};

export type GetSubmissionQuery = {
  getSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type GetSubmissionMessageQueryVariables = {
  id: string,
};

export type GetSubmissionMessageQuery = {
  getSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type GetSyllabusQueryVariables = {
  id: string,
};

export type GetSyllabusQuery = {
  getSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type GetTeacherProfileQueryVariables = {
  id: string,
};

export type GetTeacherProfileQuery = {
  getTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type GetVideoWatchQueryVariables = {
  id: string,
};

export type GetVideoWatchQuery = {
  getVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type GetWeeklyPlanQueryVariables = {
  id: string,
};

export type GetWeeklyPlanQuery = {
  getWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type GetWeeklyPlanItemQueryVariables = {
  id: string,
};

export type GetWeeklyPlanItemQuery = {
  getWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type GetZoomMeetingQueryVariables = {
  id: string,
};

export type GetZoomMeetingQuery = {
  getZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
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
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null >,
    nextToken?: string | null,
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
      courseId?: string | null,
      courseTitle?: string | null,
      createdAt: string,
      id: string,
      message: string,
      recipientCount?: number | null,
      recipientIds: string,
      sentAt: string,
      subject: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      choices?: string | null,
      correctAnswer?: string | null,
      createdAt: string,
      diagramKey?: string | null,
      diagramSpec?: string | null,
      id: string,
      lessonTemplateQuestionsId?: string | null,
      order: number,
      questionText: string,
      questionType: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      courseEnrollmentsId?: string | null,
      createdAt: string,
      id: string,
      planType?: string | null,
      semesterEnrollmentsId?: string | null,
      studentId: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null >,
    nextToken?: string | null,
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
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null >,
    nextToken?: string | null,
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
      content: string,
      createdAt: string,
      id: string,
      isArchivedByTeacher?: boolean | null,
      isDeletedByStudent?: boolean | null,
      isRead?: boolean | null,
      isTeacherInitiated?: boolean | null,
      repliedAt?: string | null,
      sentAt: string,
      studentId: string,
      studentName?: string | null,
      teacherReply?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      id: string,
      parentEmail?: string | null,
      parentFirstName?: string | null,
      parentLastName?: string | null,
      studentEmail: string,
      studentName: string,
      token: string,
      updatedAt: string,
      used?: boolean | null,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      id: string,
      parentProfileId: string,
      studentProfileId: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      id: string,
      parentId: string,
      studentEmail: string,
      studentName: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListQuartersQueryVariables = {
  filter?: ModelQuarterFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuartersQuery = {
  listQuarters?:  {
    __typename: "ModelQuarterConnection",
    items:  Array< {
      __typename: "Quarter",
      academicYearQuartersId?: string | null,
      createdAt: string,
      endDate: string,
      id: string,
      name: string,
      order: number,
      startDate: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListReportCardRecordsQueryVariables = {
  filter?: ModelReportCardRecordFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListReportCardRecordsQuery = {
  listReportCardRecords?:  {
    __typename: "ModelReportCardRecordConnection",
    items:  Array< {
      __typename: "ReportCardRecord",
      comment?: string | null,
      courseName: string,
      createdAt: string,
      finalLetter?: string | null,
      id: string,
      quarterBreakdown?: string | null,
      quarterId?: string | null,
      recipientEmails?: string | null,
      reportTitle: string,
      semesterId: string,
      semesterName: string,
      sentAt: string,
      studentId: string,
      studentName: string,
      updatedAt: string,
      weightedAvg?: number | null,
    } | null >,
    nextToken?: string | null,
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
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      courseId?: string | null,
      courseTitle?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentFirstName?: string | null,
      parentLastName?: string | null,
      planType: string,
      semesterId?: string | null,
      token: string,
      updatedAt: string,
      used?: boolean | null,
    } | null >,
    nextToken?: string | null,
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
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      id: string,
      isRead?: boolean | null,
      message: string,
      senderId: string,
      senderType: string,
      submissionMessagesId?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      courseId: string,
      createdAt: string,
      id: string,
      pdfKey?: string | null,
      publishedAt?: string | null,
      publishedPdfKey?: string | null,
      semesterId: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
      bio?: string | null,
      createdAt: string,
      displayName?: string | null,
      email: string,
      id: string,
      profilePictureKey?: string | null,
      teachingVoice?: string | null,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
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
      completed?: boolean | null,
      createdAt: string,
      durationSeconds?: number | null,
      id: string,
      lastWatchedAt?: string | null,
      lessonId: string,
      percentWatched?: number | null,
      studentId: string,
      updatedAt: string,
      watchedSeconds?: number | null,
      weeklyPlanItemId?: string | null,
    } | null >,
    nextToken?: string | null,
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
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null >,
    nextToken?: string | null,
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
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null >,
    nextToken?: string | null,
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
      courseId?: string | null,
      courseTitle?: string | null,
      createdAt: string,
      durationMinutes: number,
      id: string,
      inviteeType: string,
      joinUrl: string,
      notes?: string | null,
      parentId?: string | null,
      startTime: string,
      startUrl?: string | null,
      studentIds?: string | null,
      topic: string,
      updatedAt: string,
      zoomMeetingId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateAcademicYearMutationVariables = {
  condition?: ModelAcademicYearConditionInput | null,
  input: CreateAcademicYearInput,
};

export type CreateAcademicYearMutation = {
  createAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type CreateAnnouncementMutationVariables = {
  condition?: ModelAnnouncementConditionInput | null,
  input: CreateAnnouncementInput,
};

export type CreateAnnouncementMutation = {
  createAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type CreateAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: CreateAssignmentInput,
};

export type CreateAssignmentMutation = {
  createAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type CreateAssignmentQuestionMutationVariables = {
  condition?: ModelAssignmentQuestionConditionInput | null,
  input: CreateAssignmentQuestionInput,
};

export type CreateAssignmentQuestionMutation = {
  createAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type CreateCourseMutationVariables = {
  condition?: ModelCourseConditionInput | null,
  input: CreateCourseInput,
};

export type CreateCourseMutation = {
  createCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateEnrollmentMutationVariables = {
  condition?: ModelEnrollmentConditionInput | null,
  input: CreateEnrollmentInput,
};

export type CreateEnrollmentMutation = {
  createEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type CreateLessonMutationVariables = {
  condition?: ModelLessonConditionInput | null,
  input: CreateLessonInput,
};

export type CreateLessonMutation = {
  createLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateLessonTemplateMutationVariables = {
  condition?: ModelLessonTemplateConditionInput | null,
  input: CreateLessonTemplateInput,
};

export type CreateLessonTemplateMutation = {
  createLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type CreateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: CreateMessageInput,
};

export type CreateMessageMutation = {
  createMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateParentInviteMutationVariables = {
  condition?: ModelParentInviteConditionInput | null,
  input: CreateParentInviteInput,
};

export type CreateParentInviteMutation = {
  createParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type CreateParentProfileMutationVariables = {
  condition?: ModelParentProfileConditionInput | null,
  input: CreateParentProfileInput,
};

export type CreateParentProfileMutation = {
  createParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type CreateParentStudentMutationVariables = {
  condition?: ModelParentStudentConditionInput | null,
  input: CreateParentStudentInput,
};

export type CreateParentStudentMutation = {
  createParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type CreateParentStudentLinkMutationVariables = {
  condition?: ModelParentStudentLinkConditionInput | null,
  input: CreateParentStudentLinkInput,
};

export type CreateParentStudentLinkMutation = {
  createParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type CreateQuarterMutationVariables = {
  condition?: ModelQuarterConditionInput | null,
  input: CreateQuarterInput,
};

export type CreateQuarterMutation = {
  createQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type CreateReportCardRecordMutationVariables = {
  condition?: ModelReportCardRecordConditionInput | null,
  input: CreateReportCardRecordInput,
};

export type CreateReportCardRecordMutation = {
  createReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type CreateSemesterMutationVariables = {
  condition?: ModelSemesterConditionInput | null,
  input: CreateSemesterInput,
};

export type CreateSemesterMutation = {
  createSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateStudentInviteMutationVariables = {
  condition?: ModelStudentInviteConditionInput | null,
  input: CreateStudentInviteInput,
};

export type CreateStudentInviteMutation = {
  createStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type CreateStudentProfileMutationVariables = {
  condition?: ModelStudentProfileConditionInput | null,
  input: CreateStudentProfileInput,
};

export type CreateStudentProfileMutation = {
  createStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type CreateSubmissionMutationVariables = {
  condition?: ModelSubmissionConditionInput | null,
  input: CreateSubmissionInput,
};

export type CreateSubmissionMutation = {
  createSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateSubmissionMessageMutationVariables = {
  condition?: ModelSubmissionMessageConditionInput | null,
  input: CreateSubmissionMessageInput,
};

export type CreateSubmissionMessageMutation = {
  createSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateSyllabusMutationVariables = {
  condition?: ModelSyllabusConditionInput | null,
  input: CreateSyllabusInput,
};

export type CreateSyllabusMutation = {
  createSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type CreateTeacherProfileMutationVariables = {
  condition?: ModelTeacherProfileConditionInput | null,
  input: CreateTeacherProfileInput,
};

export type CreateTeacherProfileMutation = {
  createTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type CreateVideoWatchMutationVariables = {
  condition?: ModelVideoWatchConditionInput | null,
  input: CreateVideoWatchInput,
};

export type CreateVideoWatchMutation = {
  createVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type CreateWeeklyPlanMutationVariables = {
  condition?: ModelWeeklyPlanConditionInput | null,
  input: CreateWeeklyPlanInput,
};

export type CreateWeeklyPlanMutation = {
  createWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type CreateWeeklyPlanItemMutationVariables = {
  condition?: ModelWeeklyPlanItemConditionInput | null,
  input: CreateWeeklyPlanItemInput,
};

export type CreateWeeklyPlanItemMutation = {
  createWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type CreateZoomMeetingMutationVariables = {
  condition?: ModelZoomMeetingConditionInput | null,
  input: CreateZoomMeetingInput,
};

export type CreateZoomMeetingMutation = {
  createZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};

export type DeleteAcademicYearMutationVariables = {
  condition?: ModelAcademicYearConditionInput | null,
  input: DeleteAcademicYearInput,
};

export type DeleteAcademicYearMutation = {
  deleteAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type DeleteAnnouncementMutationVariables = {
  condition?: ModelAnnouncementConditionInput | null,
  input: DeleteAnnouncementInput,
};

export type DeleteAnnouncementMutation = {
  deleteAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type DeleteAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: DeleteAssignmentInput,
};

export type DeleteAssignmentMutation = {
  deleteAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type DeleteAssignmentQuestionMutationVariables = {
  condition?: ModelAssignmentQuestionConditionInput | null,
  input: DeleteAssignmentQuestionInput,
};

export type DeleteAssignmentQuestionMutation = {
  deleteAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type DeleteCourseMutationVariables = {
  condition?: ModelCourseConditionInput | null,
  input: DeleteCourseInput,
};

export type DeleteCourseMutation = {
  deleteCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteEnrollmentMutationVariables = {
  condition?: ModelEnrollmentConditionInput | null,
  input: DeleteEnrollmentInput,
};

export type DeleteEnrollmentMutation = {
  deleteEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type DeleteLessonMutationVariables = {
  condition?: ModelLessonConditionInput | null,
  input: DeleteLessonInput,
};

export type DeleteLessonMutation = {
  deleteLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteLessonTemplateMutationVariables = {
  condition?: ModelLessonTemplateConditionInput | null,
  input: DeleteLessonTemplateInput,
};

export type DeleteLessonTemplateMutation = {
  deleteLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type DeleteMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: DeleteMessageInput,
};

export type DeleteMessageMutation = {
  deleteMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteParentInviteMutationVariables = {
  condition?: ModelParentInviteConditionInput | null,
  input: DeleteParentInviteInput,
};

export type DeleteParentInviteMutation = {
  deleteParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type DeleteParentProfileMutationVariables = {
  condition?: ModelParentProfileConditionInput | null,
  input: DeleteParentProfileInput,
};

export type DeleteParentProfileMutation = {
  deleteParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteParentStudentMutationVariables = {
  condition?: ModelParentStudentConditionInput | null,
  input: DeleteParentStudentInput,
};

export type DeleteParentStudentMutation = {
  deleteParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type DeleteParentStudentLinkMutationVariables = {
  condition?: ModelParentStudentLinkConditionInput | null,
  input: DeleteParentStudentLinkInput,
};

export type DeleteParentStudentLinkMutation = {
  deleteParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type DeleteQuarterMutationVariables = {
  condition?: ModelQuarterConditionInput | null,
  input: DeleteQuarterInput,
};

export type DeleteQuarterMutation = {
  deleteQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type DeleteReportCardRecordMutationVariables = {
  condition?: ModelReportCardRecordConditionInput | null,
  input: DeleteReportCardRecordInput,
};

export type DeleteReportCardRecordMutation = {
  deleteReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type DeleteSemesterMutationVariables = {
  condition?: ModelSemesterConditionInput | null,
  input: DeleteSemesterInput,
};

export type DeleteSemesterMutation = {
  deleteSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteStudentInviteMutationVariables = {
  condition?: ModelStudentInviteConditionInput | null,
  input: DeleteStudentInviteInput,
};

export type DeleteStudentInviteMutation = {
  deleteStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type DeleteStudentProfileMutationVariables = {
  condition?: ModelStudentProfileConditionInput | null,
  input: DeleteStudentProfileInput,
};

export type DeleteStudentProfileMutation = {
  deleteStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteSubmissionMutationVariables = {
  condition?: ModelSubmissionConditionInput | null,
  input: DeleteSubmissionInput,
};

export type DeleteSubmissionMutation = {
  deleteSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteSubmissionMessageMutationVariables = {
  condition?: ModelSubmissionMessageConditionInput | null,
  input: DeleteSubmissionMessageInput,
};

export type DeleteSubmissionMessageMutation = {
  deleteSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteSyllabusMutationVariables = {
  condition?: ModelSyllabusConditionInput | null,
  input: DeleteSyllabusInput,
};

export type DeleteSyllabusMutation = {
  deleteSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type DeleteTeacherProfileMutationVariables = {
  condition?: ModelTeacherProfileConditionInput | null,
  input: DeleteTeacherProfileInput,
};

export type DeleteTeacherProfileMutation = {
  deleteTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteVideoWatchMutationVariables = {
  condition?: ModelVideoWatchConditionInput | null,
  input: DeleteVideoWatchInput,
};

export type DeleteVideoWatchMutation = {
  deleteVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type DeleteWeeklyPlanMutationVariables = {
  condition?: ModelWeeklyPlanConditionInput | null,
  input: DeleteWeeklyPlanInput,
};

export type DeleteWeeklyPlanMutation = {
  deleteWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type DeleteWeeklyPlanItemMutationVariables = {
  condition?: ModelWeeklyPlanItemConditionInput | null,
  input: DeleteWeeklyPlanItemInput,
};

export type DeleteWeeklyPlanItemMutation = {
  deleteWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type DeleteZoomMeetingMutationVariables = {
  condition?: ModelZoomMeetingConditionInput | null,
  input: DeleteZoomMeetingInput,
};

export type DeleteZoomMeetingMutation = {
  deleteZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};

export type UpdateAcademicYearMutationVariables = {
  condition?: ModelAcademicYearConditionInput | null,
  input: UpdateAcademicYearInput,
};

export type UpdateAcademicYearMutation = {
  updateAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type UpdateAnnouncementMutationVariables = {
  condition?: ModelAnnouncementConditionInput | null,
  input: UpdateAnnouncementInput,
};

export type UpdateAnnouncementMutation = {
  updateAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type UpdateAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: UpdateAssignmentInput,
};

export type UpdateAssignmentMutation = {
  updateAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type UpdateAssignmentQuestionMutationVariables = {
  condition?: ModelAssignmentQuestionConditionInput | null,
  input: UpdateAssignmentQuestionInput,
};

export type UpdateAssignmentQuestionMutation = {
  updateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type UpdateCourseMutationVariables = {
  condition?: ModelCourseConditionInput | null,
  input: UpdateCourseInput,
};

export type UpdateCourseMutation = {
  updateCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateEnrollmentMutationVariables = {
  condition?: ModelEnrollmentConditionInput | null,
  input: UpdateEnrollmentInput,
};

export type UpdateEnrollmentMutation = {
  updateEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type UpdateLessonMutationVariables = {
  condition?: ModelLessonConditionInput | null,
  input: UpdateLessonInput,
};

export type UpdateLessonMutation = {
  updateLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateLessonTemplateMutationVariables = {
  condition?: ModelLessonTemplateConditionInput | null,
  input: UpdateLessonTemplateInput,
};

export type UpdateLessonTemplateMutation = {
  updateLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type UpdateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: UpdateMessageInput,
};

export type UpdateMessageMutation = {
  updateMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateParentInviteMutationVariables = {
  condition?: ModelParentInviteConditionInput | null,
  input: UpdateParentInviteInput,
};

export type UpdateParentInviteMutation = {
  updateParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type UpdateParentProfileMutationVariables = {
  condition?: ModelParentProfileConditionInput | null,
  input: UpdateParentProfileInput,
};

export type UpdateParentProfileMutation = {
  updateParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateParentStudentMutationVariables = {
  condition?: ModelParentStudentConditionInput | null,
  input: UpdateParentStudentInput,
};

export type UpdateParentStudentMutation = {
  updateParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type UpdateParentStudentLinkMutationVariables = {
  condition?: ModelParentStudentLinkConditionInput | null,
  input: UpdateParentStudentLinkInput,
};

export type UpdateParentStudentLinkMutation = {
  updateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type UpdateQuarterMutationVariables = {
  condition?: ModelQuarterConditionInput | null,
  input: UpdateQuarterInput,
};

export type UpdateQuarterMutation = {
  updateQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type UpdateReportCardRecordMutationVariables = {
  condition?: ModelReportCardRecordConditionInput | null,
  input: UpdateReportCardRecordInput,
};

export type UpdateReportCardRecordMutation = {
  updateReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type UpdateSemesterMutationVariables = {
  condition?: ModelSemesterConditionInput | null,
  input: UpdateSemesterInput,
};

export type UpdateSemesterMutation = {
  updateSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateStudentInviteMutationVariables = {
  condition?: ModelStudentInviteConditionInput | null,
  input: UpdateStudentInviteInput,
};

export type UpdateStudentInviteMutation = {
  updateStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type UpdateStudentProfileMutationVariables = {
  condition?: ModelStudentProfileConditionInput | null,
  input: UpdateStudentProfileInput,
};

export type UpdateStudentProfileMutation = {
  updateStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateSubmissionMutationVariables = {
  condition?: ModelSubmissionConditionInput | null,
  input: UpdateSubmissionInput,
};

export type UpdateSubmissionMutation = {
  updateSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateSubmissionMessageMutationVariables = {
  condition?: ModelSubmissionMessageConditionInput | null,
  input: UpdateSubmissionMessageInput,
};

export type UpdateSubmissionMessageMutation = {
  updateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateSyllabusMutationVariables = {
  condition?: ModelSyllabusConditionInput | null,
  input: UpdateSyllabusInput,
};

export type UpdateSyllabusMutation = {
  updateSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type UpdateTeacherProfileMutationVariables = {
  condition?: ModelTeacherProfileConditionInput | null,
  input: UpdateTeacherProfileInput,
};

export type UpdateTeacherProfileMutation = {
  updateTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateVideoWatchMutationVariables = {
  condition?: ModelVideoWatchConditionInput | null,
  input: UpdateVideoWatchInput,
};

export type UpdateVideoWatchMutation = {
  updateVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type UpdateWeeklyPlanMutationVariables = {
  condition?: ModelWeeklyPlanConditionInput | null,
  input: UpdateWeeklyPlanInput,
};

export type UpdateWeeklyPlanMutation = {
  updateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type UpdateWeeklyPlanItemMutationVariables = {
  condition?: ModelWeeklyPlanItemConditionInput | null,
  input: UpdateWeeklyPlanItemInput,
};

export type UpdateWeeklyPlanItemMutation = {
  updateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type UpdateZoomMeetingMutationVariables = {
  condition?: ModelZoomMeetingConditionInput | null,
  input: UpdateZoomMeetingInput,
};

export type UpdateZoomMeetingMutation = {
  updateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};

export type OnCreateAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnCreateAcademicYearSubscription = {
  onCreateAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type OnCreateAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnCreateAnnouncementSubscription = {
  onCreateAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type OnCreateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnCreateAssignmentSubscription = {
  onCreateAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type OnCreateAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnCreateAssignmentQuestionSubscription = {
  onCreateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type OnCreateCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnCreateCourseSubscription = {
  onCreateCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnCreateEnrollmentSubscription = {
  onCreateEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type OnCreateLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnCreateLessonSubscription = {
  onCreateLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnCreateLessonTemplateSubscription = {
  onCreateLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type OnCreateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnCreateMessageSubscription = {
  onCreateMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnCreateParentInviteSubscription = {
  onCreateParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnCreateParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnCreateParentProfileSubscription = {
  onCreateParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnCreateParentStudentSubscription = {
  onCreateParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type OnCreateParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnCreateParentStudentLinkSubscription = {
  onCreateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type OnCreateQuarterSubscriptionVariables = {
  filter?: ModelSubscriptionQuarterFilterInput | null,
};

export type OnCreateQuarterSubscription = {
  onCreateQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type OnCreateReportCardRecordSubscriptionVariables = {
  filter?: ModelSubscriptionReportCardRecordFilterInput | null,
};

export type OnCreateReportCardRecordSubscription = {
  onCreateReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type OnCreateSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnCreateSemesterSubscription = {
  onCreateSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnCreateStudentInviteSubscription = {
  onCreateStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnCreateStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnCreateStudentProfileSubscription = {
  onCreateStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnCreateSubmissionSubscription = {
  onCreateSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnCreateSubmissionMessageSubscription = {
  onCreateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnCreateSyllabusSubscription = {
  onCreateSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type OnCreateTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnCreateTeacherProfileSubscription = {
  onCreateTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnCreateVideoWatchSubscription = {
  onCreateVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type OnCreateWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnCreateWeeklyPlanSubscription = {
  onCreateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type OnCreateWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnCreateWeeklyPlanItemSubscription = {
  onCreateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type OnCreateZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnCreateZoomMeetingSubscription = {
  onCreateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};

export type OnDeleteAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnDeleteAcademicYearSubscription = {
  onDeleteAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type OnDeleteAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnDeleteAnnouncementSubscription = {
  onDeleteAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnDeleteAssignmentSubscription = {
  onDeleteAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type OnDeleteAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnDeleteAssignmentQuestionSubscription = {
  onDeleteAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnDeleteCourseSubscription = {
  onDeleteCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnDeleteEnrollmentSubscription = {
  onDeleteEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnDeleteLessonSubscription = {
  onDeleteLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnDeleteLessonTemplateSubscription = {
  onDeleteLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type OnDeleteMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnDeleteMessageSubscription = {
  onDeleteMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnDeleteParentInviteSubscription = {
  onDeleteParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnDeleteParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnDeleteParentProfileSubscription = {
  onDeleteParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnDeleteParentStudentSubscription = {
  onDeleteParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnDeleteParentStudentLinkSubscription = {
  onDeleteParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteQuarterSubscriptionVariables = {
  filter?: ModelSubscriptionQuarterFilterInput | null,
};

export type OnDeleteQuarterSubscription = {
  onDeleteQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteReportCardRecordSubscriptionVariables = {
  filter?: ModelSubscriptionReportCardRecordFilterInput | null,
};

export type OnDeleteReportCardRecordSubscription = {
  onDeleteReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type OnDeleteSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnDeleteSemesterSubscription = {
  onDeleteSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnDeleteStudentInviteSubscription = {
  onDeleteStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnDeleteStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnDeleteStudentProfileSubscription = {
  onDeleteStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnDeleteSubmissionSubscription = {
  onDeleteSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnDeleteSubmissionMessageSubscription = {
  onDeleteSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnDeleteSyllabusSubscription = {
  onDeleteSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnDeleteTeacherProfileSubscription = {
  onDeleteTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnDeleteVideoWatchSubscription = {
  onDeleteVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type OnDeleteWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnDeleteWeeklyPlanSubscription = {
  onDeleteWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type OnDeleteWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnDeleteWeeklyPlanItemSubscription = {
  onDeleteWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type OnDeleteZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnDeleteZoomMeetingSubscription = {
  onDeleteZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};

export type OnUpdateAcademicYearSubscriptionVariables = {
  filter?: ModelSubscriptionAcademicYearFilterInput | null,
};

export type OnUpdateAcademicYearSubscription = {
  onUpdateAcademicYear?:  {
    __typename: "AcademicYear",
    createdAt: string,
    id: string,
    quarters?:  {
      __typename: "ModelQuarterConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    year: string,
  } | null,
};

export type OnUpdateAnnouncementSubscriptionVariables = {
  filter?: ModelSubscriptionAnnouncementFilterInput | null,
};

export type OnUpdateAnnouncementSubscription = {
  onUpdateAnnouncement?:  {
    __typename: "Announcement",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    id: string,
    message: string,
    recipientCount?: number | null,
    recipientIds: string,
    sentAt: string,
    subject: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
};

export type OnUpdateAssignmentSubscription = {
  onUpdateAssignment?:  {
    __typename: "Assignment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseAssignmentsId?: string | null,
    createdAt: string,
    description?: string | null,
    dueDate?: string | null,
    id: string,
    submissions?:  {
      __typename: "ModelSubmissionConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlanItem?:  {
      __typename: "WeeklyPlanItem",
      createdAt: string,
      dayOfWeek: string,
      dueTime?: string | null,
      id: string,
      isPublished?: boolean | null,
      lessonTemplateId?: string | null,
      lessonWeeklyPlanItemsId?: string | null,
      updatedAt: string,
      weeklyPlanItemsId?: string | null,
      zoomJoinUrl?: string | null,
      zoomMeetingId?: string | null,
      zoomStartTime?: string | null,
    } | null,
    weeklyPlanItemAssignmentsId?: string | null,
  } | null,
};

export type OnUpdateAssignmentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentQuestionFilterInput | null,
};

export type OnUpdateAssignmentQuestionSubscription = {
  onUpdateAssignmentQuestion?:  {
    __typename: "AssignmentQuestion",
    choices?: string | null,
    correctAnswer?: string | null,
    createdAt: string,
    diagramKey?: string | null,
    diagramSpec?: string | null,
    id: string,
    lessonTemplate?:  {
      __typename: "LessonTemplate",
      assignmentType?: string | null,
      courseLessonTemplatesId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isArchived?: boolean | null,
      lessonCategory?: string | null,
      lessonNumber: number,
      teachingNotes?: string | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
      worksheetUrl?: string | null,
    } | null,
    lessonTemplateQuestionsId?: string | null,
    order: number,
    questionText: string,
    questionType: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateCourseSubscriptionVariables = {
  filter?: ModelSubscriptionCourseFilterInput | null,
};

export type OnUpdateCourseSubscription = {
  onUpdateCourse?:  {
    __typename: "Course",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeLevel?: string | null,
    id: string,
    isArchived?: boolean | null,
    lessonTemplates?:  {
      __typename: "ModelLessonTemplateConnection",
      nextToken?: string | null,
    } | null,
    lessons?:  {
      __typename: "ModelLessonConnection",
      nextToken?: string | null,
    } | null,
    semesters?:  {
      __typename: "ModelSemesterConnection",
      nextToken?: string | null,
    } | null,
    title: string,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateEnrollmentSubscriptionVariables = {
  filter?: ModelSubscriptionEnrollmentFilterInput | null,
};

export type OnUpdateEnrollmentSubscription = {
  onUpdateEnrollment?:  {
    __typename: "Enrollment",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseEnrollmentsId?: string | null,
    createdAt: string,
    id: string,
    planType?: string | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterEnrollmentsId?: string | null,
    studentId: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateLessonSubscriptionVariables = {
  filter?: ModelSubscriptionLessonFilterInput | null,
};

export type OnUpdateLessonSubscription = {
  onUpdateLesson?:  {
    __typename: "Lesson",
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonsId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isPublished?: boolean | null,
    order?: number | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    weeklyPlanItems?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateLessonTemplateSubscriptionVariables = {
  filter?: ModelSubscriptionLessonTemplateFilterInput | null,
};

export type OnUpdateLessonTemplateSubscription = {
  onUpdateLessonTemplate?:  {
    __typename: "LessonTemplate",
    assignmentType?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseLessonTemplatesId?: string | null,
    createdAt: string,
    id: string,
    instructions?: string | null,
    isArchived?: boolean | null,
    lessonCategory?: string | null,
    lessonNumber: number,
    questions?:  {
      __typename: "ModelAssignmentQuestionConnection",
      nextToken?: string | null,
    } | null,
    teachingNotes?: string | null,
    title: string,
    updatedAt: string,
    videoUrl?: string | null,
    worksheetUrl?: string | null,
  } | null,
};

export type OnUpdateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnUpdateMessageSubscription = {
  onUpdateMessage?:  {
    __typename: "Message",
    content: string,
    createdAt: string,
    id: string,
    isArchivedByTeacher?: boolean | null,
    isDeletedByStudent?: boolean | null,
    isRead?: boolean | null,
    isTeacherInitiated?: boolean | null,
    repliedAt?: string | null,
    sentAt: string,
    studentId: string,
    studentName?: string | null,
    teacherReply?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateParentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionParentInviteFilterInput | null,
};

export type OnUpdateParentInviteSubscription = {
  onUpdateParentInvite?:  {
    __typename: "ParentInvite",
    createdAt: string,
    id: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    studentEmail: string,
    studentName: string,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnUpdateParentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionParentProfileFilterInput | null,
};

export type OnUpdateParentProfileSubscription = {
  onUpdateParentProfile?:  {
    __typename: "ParentProfile",
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    studentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateParentStudentSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentFilterInput | null,
};

export type OnUpdateParentStudentSubscription = {
  onUpdateParentStudent?:  {
    __typename: "ParentStudent",
    createdAt: string,
    id: string,
    parentId: string,
    studentEmail: string,
    studentName: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateParentStudentLinkSubscriptionVariables = {
  filter?: ModelSubscriptionParentStudentLinkFilterInput | null,
};

export type OnUpdateParentStudentLinkSubscription = {
  onUpdateParentStudentLink?:  {
    __typename: "ParentStudentLink",
    createdAt: string,
    id: string,
    parentProfile?:  {
      __typename: "ParentProfile",
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      updatedAt: string,
      userId: string,
    } | null,
    parentProfileId: string,
    studentProfile?:  {
      __typename: "StudentProfile",
      archivedAt?: string | null,
      courseId?: string | null,
      createdAt: string,
      email: string,
      enrolledAt?: string | null,
      firstName: string,
      gradeLevel?: string | null,
      id: string,
      lastName: string,
      parentEmail?: string | null,
      parentEmail2?: string | null,
      parentName?: string | null,
      parentName2?: string | null,
      planType?: string | null,
      preferredName?: string | null,
      profilePictureKey?: string | null,
      status?: string | null,
      statusReason?: string | null,
      updatedAt: string,
      userId: string,
    } | null,
    studentProfileId: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateQuarterSubscriptionVariables = {
  filter?: ModelSubscriptionQuarterFilterInput | null,
};

export type OnUpdateQuarterSubscription = {
  onUpdateQuarter?:  {
    __typename: "Quarter",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearQuartersId?: string | null,
    createdAt: string,
    endDate: string,
    id: string,
    name: string,
    order: number,
    startDate: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateReportCardRecordSubscriptionVariables = {
  filter?: ModelSubscriptionReportCardRecordFilterInput | null,
};

export type OnUpdateReportCardRecordSubscription = {
  onUpdateReportCardRecord?:  {
    __typename: "ReportCardRecord",
    comment?: string | null,
    courseName: string,
    createdAt: string,
    finalLetter?: string | null,
    id: string,
    quarterBreakdown?: string | null,
    quarterId?: string | null,
    recipientEmails?: string | null,
    reportTitle: string,
    semesterId: string,
    semesterName: string,
    sentAt: string,
    studentId: string,
    studentName: string,
    updatedAt: string,
    weightedAvg?: number | null,
  } | null,
};

export type OnUpdateSemesterSubscriptionVariables = {
  filter?: ModelSubscriptionSemesterFilterInput | null,
};

export type OnUpdateSemesterSubscription = {
  onUpdateSemester?:  {
    __typename: "Semester",
    academicYear?:  {
      __typename: "AcademicYear",
      createdAt: string,
      id: string,
      updatedAt: string,
      year: string,
    } | null,
    academicYearSemestersId?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseId?: string | null,
    createdAt: string,
    endDate: string,
    enrollments?:  {
      __typename: "ModelEnrollmentConnection",
      nextToken?: string | null,
    } | null,
    gradeA?: number | null,
    gradeB?: number | null,
    gradeC?: number | null,
    gradeD?: number | null,
    id: string,
    isActive?: boolean | null,
    lessonWeightPercent?: number | null,
    name: string,
    quizWeightPercent?: number | null,
    semesterType?: string | null,
    startDate: string,
    testWeightPercent?: number | null,
    updatedAt: string,
    weeklyPlans?:  {
      __typename: "ModelWeeklyPlanConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateStudentInviteSubscriptionVariables = {
  filter?: ModelSubscriptionStudentInviteFilterInput | null,
};

export type OnUpdateStudentInviteSubscription = {
  onUpdateStudentInvite?:  {
    __typename: "StudentInvite",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentFirstName?: string | null,
    parentLastName?: string | null,
    planType: string,
    semesterId?: string | null,
    token: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnUpdateStudentProfileSubscriptionVariables = {
  filter?: ModelSubscriptionStudentProfileFilterInput | null,
};

export type OnUpdateStudentProfileSubscription = {
  onUpdateStudentProfile?:  {
    __typename: "StudentProfile",
    archivedAt?: string | null,
    courseId?: string | null,
    createdAt: string,
    email: string,
    enrolledAt?: string | null,
    firstName: string,
    gradeLevel?: string | null,
    id: string,
    lastName: string,
    parentEmail?: string | null,
    parentEmail2?: string | null,
    parentLinks?:  {
      __typename: "ModelParentStudentLinkConnection",
      nextToken?: string | null,
    } | null,
    parentName?: string | null,
    parentName2?: string | null,
    planType?: string | null,
    preferredName?: string | null,
    profilePictureKey?: string | null,
    status?: string | null,
    statusReason?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateSubmissionSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionFilterInput | null,
};

export type OnUpdateSubmissionSubscription = {
  onUpdateSubmission?:  {
    __typename: "Submission",
    answers?: string | null,
    archivedAt?: string | null,
    assignment?:  {
      __typename: "Assignment",
      courseAssignmentsId?: string | null,
      createdAt: string,
      description?: string | null,
      dueDate?: string | null,
      id: string,
      title: string,
      updatedAt: string,
      weeklyPlanItemAssignmentsId?: string | null,
    } | null,
    assignmentSubmissionsId?: string | null,
    content?: string | null,
    createdAt: string,
    grade?: string | null,
    id: string,
    imageUrls?: string | null,
    isArchived?: boolean | null,
    lessonTemplateId?: string | null,
    messages?:  {
      __typename: "ModelSubmissionMessageConnection",
      nextToken?: string | null,
    } | null,
    returnDueDate?: string | null,
    returnReason?: string | null,
    status?: string | null,
    studentId: string,
    submittedAt?: string | null,
    teacherComment?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateSubmissionMessageSubscriptionVariables = {
  filter?: ModelSubscriptionSubmissionMessageFilterInput | null,
};

export type OnUpdateSubmissionMessageSubscription = {
  onUpdateSubmissionMessage?:  {
    __typename: "SubmissionMessage",
    createdAt: string,
    id: string,
    isRead?: boolean | null,
    message: string,
    senderId: string,
    senderType: string,
    submission?:  {
      __typename: "Submission",
      answers?: string | null,
      archivedAt?: string | null,
      assignmentSubmissionsId?: string | null,
      content?: string | null,
      createdAt: string,
      grade?: string | null,
      id: string,
      imageUrls?: string | null,
      isArchived?: boolean | null,
      lessonTemplateId?: string | null,
      returnDueDate?: string | null,
      returnReason?: string | null,
      status?: string | null,
      studentId: string,
      submittedAt?: string | null,
      teacherComment?: string | null,
      updatedAt: string,
    } | null,
    submissionMessagesId?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateSyllabusSubscriptionVariables = {
  filter?: ModelSubscriptionSyllabusFilterInput | null,
};

export type OnUpdateSyllabusSubscription = {
  onUpdateSyllabus?:  {
    __typename: "Syllabus",
    courseId: string,
    createdAt: string,
    id: string,
    pdfKey?: string | null,
    publishedAt?: string | null,
    publishedPdfKey?: string | null,
    semesterId: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateTeacherProfileSubscriptionVariables = {
  filter?: ModelSubscriptionTeacherProfileFilterInput | null,
};

export type OnUpdateTeacherProfileSubscription = {
  onUpdateTeacherProfile?:  {
    __typename: "TeacherProfile",
    bio?: string | null,
    createdAt: string,
    displayName?: string | null,
    email: string,
    id: string,
    profilePictureKey?: string | null,
    teachingVoice?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateVideoWatchSubscriptionVariables = {
  filter?: ModelSubscriptionVideoWatchFilterInput | null,
};

export type OnUpdateVideoWatchSubscription = {
  onUpdateVideoWatch?:  {
    __typename: "VideoWatch",
    completed?: boolean | null,
    createdAt: string,
    durationSeconds?: number | null,
    id: string,
    lastWatchedAt?: string | null,
    lessonId: string,
    percentWatched?: number | null,
    studentId: string,
    updatedAt: string,
    watchedSeconds?: number | null,
    weeklyPlanItemId?: string | null,
  } | null,
};

export type OnUpdateWeeklyPlanSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanFilterInput | null,
};

export type OnUpdateWeeklyPlanSubscription = {
  onUpdateWeeklyPlan?:  {
    __typename: "WeeklyPlan",
    assignedStudentIds?: string | null,
    course?:  {
      __typename: "Course",
      createdAt: string,
      description?: string | null,
      gradeLevel?: string | null,
      id: string,
      isArchived?: boolean | null,
      title: string,
      updatedAt: string,
    } | null,
    courseWeeklyPlansId?: string | null,
    createdAt: string,
    id: string,
    items?:  {
      __typename: "ModelWeeklyPlanItemConnection",
      nextToken?: string | null,
    } | null,
    semester?:  {
      __typename: "Semester",
      academicYearSemestersId?: string | null,
      courseId?: string | null,
      createdAt: string,
      endDate: string,
      gradeA?: number | null,
      gradeB?: number | null,
      gradeC?: number | null,
      gradeD?: number | null,
      id: string,
      isActive?: boolean | null,
      lessonWeightPercent?: number | null,
      name: string,
      quizWeightPercent?: number | null,
      semesterType?: string | null,
      startDate: string,
      testWeightPercent?: number | null,
      updatedAt: string,
    } | null,
    semesterWeeklyPlansId?: string | null,
    updatedAt: string,
    weekStartDate: string,
  } | null,
};

export type OnUpdateWeeklyPlanItemSubscriptionVariables = {
  filter?: ModelSubscriptionWeeklyPlanItemFilterInput | null,
};

export type OnUpdateWeeklyPlanItemSubscription = {
  onUpdateWeeklyPlanItem?:  {
    __typename: "WeeklyPlanItem",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    dayOfWeek: string,
    dueTime?: string | null,
    id: string,
    isPublished?: boolean | null,
    lesson?:  {
      __typename: "Lesson",
      courseLessonsId?: string | null,
      createdAt: string,
      id: string,
      instructions?: string | null,
      isPublished?: boolean | null,
      order?: number | null,
      title: string,
      updatedAt: string,
      videoUrl?: string | null,
    } | null,
    lessonTemplateId?: string | null,
    lessonWeeklyPlanItemsId?: string | null,
    updatedAt: string,
    weeklyPlan?:  {
      __typename: "WeeklyPlan",
      assignedStudentIds?: string | null,
      courseWeeklyPlansId?: string | null,
      createdAt: string,
      id: string,
      semesterWeeklyPlansId?: string | null,
      updatedAt: string,
      weekStartDate: string,
    } | null,
    weeklyPlanItemsId?: string | null,
    zoomJoinUrl?: string | null,
    zoomMeetingId?: string | null,
    zoomStartTime?: string | null,
  } | null,
};

export type OnUpdateZoomMeetingSubscriptionVariables = {
  filter?: ModelSubscriptionZoomMeetingFilterInput | null,
};

export type OnUpdateZoomMeetingSubscription = {
  onUpdateZoomMeeting?:  {
    __typename: "ZoomMeeting",
    courseId?: string | null,
    courseTitle?: string | null,
    createdAt: string,
    durationMinutes: number,
    id: string,
    inviteeType: string,
    joinUrl: string,
    notes?: string | null,
    parentId?: string | null,
    startTime: string,
    startUrl?: string | null,
    studentIds?: string | null,
    topic: string,
    updatedAt: string,
    zoomMeetingId?: string | null,
  } | null,
};
