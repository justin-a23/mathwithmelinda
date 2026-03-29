# Math with Melinda — Project Brief

## Overview
Building a custom LMS (Learning Management System) for Melinda, a homeschool math teacher who teaches at a co-op and plans to expand to virtual students. The platform replaces Google Classroom + Jellyfin.

## Owner
- **Developer:** Justin (works at AWS, video producer background)
- **Teacher:** Melinda (Justin's wife)
- **Domain:** mathwithmelinda.com (bought on GoDaddy, now using Route 53 nameservers)
- **GitHub:** github.com/justin-a23/mathwithmelinda
- **Local project path:** /Users/justinall/mathwithmelinda

## Tech Stack
- **Frontend:** Next.js 16 (app router, TypeScript)
- **Hosting:** AWS Amplify (app ID: dg6hiwssnna5c, branch: main)
- **Auth:** AWS Cognito (via Amplify Gen 1 CLI) — 3 groups: teacher, student, parent
- **Database:** AWS DynamoDB via AppSync GraphQL (Amplify Gen 1)
- **Video hosting:** AWS S3 bucket: mathwithmelinda-videos + CloudFront (dgmfzo1xk5r4e.cloudfront.net)
- **Submissions:** AWS S3 bucket: mathwithmelinda-submissions
- **GraphQL endpoint:** https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql
- **AWS region:** us-east-1
- **AWS user:** amplify-dev
- **IAM policy:** MathWithMelindaS3UploadPolicy (covers both S3 buckets)

## Branding
- **Primary color:** Plum #7B4FA6
- **Background:** #FAFAFA (light) / #1E1E2E (dark)
- **Nav background:** #1E1E2E (light) / #0F0F1A (dark)
- **Accent:** #F2C94C
- **Fonts:** DM Serif Display (headings), DM Sans (body)
- **Brand file:** app/brand.css
- **Theme toggle:** dark/light mode built in, ThemeProvider in app/ThemeProvider.tsx

## Courses (4 active)
1. Arithmetic 6
2. Middle School Math
3. Pre-Algebra
4. Algebra 1

All 581 videos uploaded to S3:
- s3://mathwithmelinda-videos/algebra1/
- s3://mathwithmelinda-videos/middleschoolmath/
- s3://mathwithmelinda-videos/prealgebra/
- s3://mathwithmelinda-videos/arithmetic6/

Video naming convention: `[Course] - Lesson [N] - [Title].mp4`

## Database Schema (Amplify GraphQL)
- AcademicYear → Semester → WeeklyPlan → WeeklyPlanItem → Lesson
- Course → Lesson, Assignment, Enrollment, WeeklyPlan, LessonTemplate
- LessonTemplate (lesson library — all 4 courses imported via CSV)
- Submission (student work submissions)
- All 4 lesson libraries imported into LessonTemplate table

## Pages Built
### Student
- /login — Cognito auth
- /dashboard — weekly scheduled lessons, dark/light toggle
- /lessons — video player + submission form (HEIC→JPEG conversion)

### Teacher
- /teacher — dashboard with courses, Grade Work, Upload Video, + Add Course buttons
- /teacher/schedule — schedule a week using lesson library dropdown, editable instructions, smart due date defaults
- /teacher/upload — drag/drop video upload to S3
- /teacher/grades — grading UI with photo preview, grade + comments

### Utility
- /seed — seed courses
- /seed/import — CSV bulk import for lesson library

## API Routes
- /api/upload — presigned URL for video upload to mathwithmelinda-videos
- /api/submit — converts HEIC/PNG to JPEG, uploads to mathwithmelinda-submissions
- /api/view-submission — presigned URL for viewing submitted photos

## Melinda's Weekly Workflow
- Assigns work on Friday for next week
- Mon + Tue work → due Tuesday 5pm
- Wed + Thu work → due Thursday 5pm
- Friday = in-class assignment (still submitted)
- 1 video lesson per day per class, 5 days/week

## Subscription Plans (to be built)
1. Video Only — self-serve videos + worksheets + parent portal
2. Virtual Student — + weekly Zoom + Melinda grading + messaging
3. Co-op Student — + in-person once/week

## What's Left to Build
- [ ] Parent portal (invite link system, multi-child support, grades/comments view)
- [ ] Student profiles (self-setup after account creation)
- [ ] Stripe payments (monthly subscriptions)
- [ ] Zoom integration (for Virtual Student plan)
- [ ] Email notifications (parent alerts)
- [ ] AI scheduling assistant (Melinda types natural language to schedule a week)
- [ ] Lesson Library management UI (add/edit/delete lesson templates)
- [ ] Connect lesson video URLs to lesson templates
- [ ] Syllabus per course (visible to students and parents)
- [ ] Link Schedule Week → actual lessons with video URLs

## Parent Portal Design
- Up to 2 parents per student
- One parent can have multiple children enrolled
- Access via invite link from teacher
- Shows: grades, submitted work, Melinda's comments, performance summary
- Multi-child selector if parent has more than one child enrolled

## Key Files
- app/layout.tsx — root layout with AmplifyProvider + ThemeProvider
- app/AmplifyProvider.tsx — Amplify + Authenticator.Provider
- app/ThemeProvider.tsx — dark/light theme context
- app/globals.css — global styles + brand.css import + theme variables
- app/brand.css — brand CSS variables
- src/amplifyconfiguration.json — Amplify config (gitignored)
- src/graphql/ — generated GraphQL queries/mutations
- amplify/backend/api/mathwithmelinda/schema.graphql — DB schema
- .env.local — AWS credentials (gitignored)

## Important Notes
- amplifyconfiguration.json is gitignored — Amplify pulls it during build via connected Gen 1 backend
- Dark mode: --charcoal flips to #FAFAFA in dark mode (text color), use --nav-bg for nav backgrounds
- All pages use var(--background), var(--foreground), var(--nav-bg) for theme support
- Lesson numbers can be non-integer (e.g. 168a, 129 1/2) — stored as Float in DB
- HEIC files from iPhones are converted to JPEG server-side on upload
- S3 CORS configured on both buckets for localhost + production URLs

## Deadline
Mid-summer 2026 (approx July 15, 2026)
