@AGENTS.md
@MWM_PROJECT_BRIEF.md

---

# Current Development State (as of April 2026)

## What's Actually Built (beyond the brief)

The project brief's "What's Left to Build" list is partially outdated. Here's the real current state:

### ✅ Completed Since Brief Was Written
- **Student profiles** — self-setup flow at `/profile/setup`: student fills name + desired course, creates `StudentProfile` with `status: "pending"`, waits for teacher approval
- **Teacher student management** — `/teacher/students`: approve (assigns course + academic year + semester enrollment), delete (removes from both DynamoDB and Cognito)
- **Teacher nav badges** — ungraded count (red), unread messages (red), pending student approvals (amber)
- **Teacher dashboard banner** — yellow banner when students are waiting for approval, clickable, navigates to `/teacher/students`
- **Messaging** — `/teacher/messages` and `/student/messages`: threaded by student, read/unread, archive, permanent delete (teacher only on archived)
- **Gradebook** — `/teacher/gradebook`: grid view of all grades by student + assignment
- **Academic Year / Semesters** — `/teacher/semesters`: create academic years, semesters, manage enrollment
- **Assigned Work** — `/teacher/plans`: assign lessons to students with due dates
- **Teacher profile** — `/teacher/profile`: display name, profile picture (circular crop with `ImageCropper` component)
- **Student profile picture** — on student dashboard, same crop flow
- **Lesson editor** — `/teacher/library/[courseId]`: create/edit lessons with questions, section headers, drag-to-reorder, preview/print (KaTeX popup), math toolbar
- **Parent portal** — `/parent`: basic built, invite token flow at `/parent/accept/[token]`
- **Report card** — `/teacher/report-card`
- **Dark mode** — fully implemented across all pages via CSS variables + `ThemeToggle` component

### 🔲 Still Pending
- CSV/MD bulk import for lesson questions (one lesson at a time — Justin's admin tool, not Melinda's)
- Manage Lessons UI reorganization (Melinda finds it overwhelming — needs layout cleanup)
- Stripe payments
- Zoom integration
- Email notifications
- AI scheduling assistant
- Syllabus per course

---

## Key Technical Gotchas (hard-won knowledge)

### Git / Deployment
- **Always commit and push** — Amplify only deploys from `main` branch pushes. Never leave changes unstaged.
- Local path: `/Users/justinall/mathwithmelinda`
- GitHub: `github.com/justin-a23/mathwithmelinda`
- Amplify app ID: `dg6hiwssnna5c`

### DynamoDB / AppSync
- **400KB item size limit** — profile pictures MUST be compressed before base64 encoding. Use the `compressImage()` utility (200×200 JPEG at quality 0.75) already in `app/dashboard/page.tsx`
- **API key is hardcoded** in server-side API routes (e.g. `app/api/delete-student/route.ts`) for AppSync calls — `da2-qgdyi5epjjarbjhwhqq7mrdbsy`
- AppSync endpoint: `https://irzsqprjcjco5kq7w7g72zm7qy.appsync-api.us-east-1.amazonaws.com/graphql`
- GraphQL schema: `amplify/backend/api/mathwithmelinda/schema.graphql`

### Cognito
- User pool ID: `us-east-1_LvIY8oPmV`
- 3 groups: `teacher`, `student`, `parent`
- **`AdminDeleteUser` requires actual `Username`, NOT the sub UUID** — must call `ListUsersCommand` with `Filter: 'sub = "..."'` first to get the real Username, then delete
- **`signOut()` from `useAuthenticator` is not truly async** — never do `await signOut(); router.replace(...)`. Just call `signOut()` and let a `useEffect` guard (`if (user === null) router.replace('/login')`) handle the redirect

### Student Dashboard Assignment Visibility Rules
- **No lower cutoff** — past unsubmitted assignments always show up
- **Future cutoff**: 7 days normally; expands to 14 days starting Friday 8am CDT (= Friday 13:00 UTC) through end of weekend
- Friday 8am CDT rule: `const showNextWeek = (dayOfWeek === 5 && hourUTC >= 13) || dayOfWeek === 0 || dayOfWeek === 6`
- Past weeks where all lessons are submitted render empty naturally — no special filtering needed

### Lesson Numbers
- Stored as `Float` in DynamoDB — can be non-integer (e.g. `168` → stored as `168`, fractional lessons like `129.5`)
- Display as-is; don't force integer formatting

### Math Rendering
- KaTeX used for math display — `MathRenderer` component, `MathInput` component, `MathToolbar` component
- Print/preview popup: `window.open('', '_blank')` + write full HTML with KaTeX CDN stylesheet + `onload="setTimeout(function(){window.print()},1200)"`

### Dark Mode
- CSS variables in `app/globals.css` and `app/brand.css`
- `--gray-light: #2E2E42` on `--background: #28283C` is nearly invisible — forms/grids need `border-color: #4A4A62` override in dark mode
- All form inputs/selects/textareas get this fix via globals.css

### Profile Pictures
- Teacher: uploaded to S3, retrieved via `/api/profile-pic?key=...` presigned URL
- Student: stored as base64 data URL directly in DynamoDB (must be compressed first — see 400KB limit above)
- `ImageCropper` component handles circular crop UI (drag + pinch zoom)

---

## Database Key Models

```
AcademicYear → Semester → Enrollment (student ↔ semester)
Course → Lesson (video lessons in library)
LessonTemplate (imported lesson library, all 4 courses)
Assignment (teacher assigns lesson to student with due date)
Submission (student submits work photo)
StudentProfile (userId, email, firstName, lastName, status: pending|active)
TeacherProfile (userId, displayName, profilePictureKey)
Message (studentId, senderId, content, isRead, isArchived)
WeeklyPlan → WeeklyPlanItem (scheduled week view)
```

## Key Components
- `TeacherNav` — sticky top nav with badge counts, profile picture, sign out
- `ThemeToggle` — dark/light switch, persists to localStorage
- `ImageCropper` — circular photo crop with drag + pinch zoom
- `MathInput` / `MathRenderer` / `MathToolbar` — KaTeX math entry and display

## AWS Credentials
- Stored in `.env.local` (gitignored)
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` for server-side routes
- IAM user: `amplify-dev`, policy: `MathWithMelindaS3UploadPolicy`

## S3 Buckets
- Videos: `mathwithmelinda-videos` (CloudFront: `dgmfzo1xk5r4e.cloudfront.net`)
- Submissions: `mathwithmelinda-submissions`
- Both have CORS configured for localhost + production
