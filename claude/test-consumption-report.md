# Chapter Test Consumption Report

How the LMS would handle a chapter *test* imported through the lesson pipeline
(`/teacher/lessons/import` → `/api/import-lesson` → `LessonTemplate`).
Investigated 2026-08-24 against the live worktree; read-only, no code changed.

**Headline:** the platform is more test-ready than expected. `lessonCategory:
"test"` is already a first-class citizen of the entire grading stack (weighted
buckets, gradebook, report card, transcripts, student grades), and no-video
lessons render cleanly everywhere. The one real landmine is **numbering**:
`lessonNumber` is an `Int` in both live schemas, so "7.1" silently becomes `7`
and ties with Lesson 7 instead of sorting after it.

---

## 1. `lessonCategory` — free string, "test" is legal and fully wired

**Schema:** free string, not an enum — [amplify/data/resource.ts:236](../amplify/data/resource.ts)
(`lessonCategory: a.string()`). Gen 1 mirror is also `String`
([amplify/backend/api/mathwithmelinda/schema.graphql](../amplify/backend/api/mathwithmelinda/schema.graphql), LessonTemplate block at line 150).
Nothing validates values; `"test"` is legal today.

**Every read site**, and what each does with it:

| Where | Lines | What it does |
|---|---|---|
| Parser output type | [app/lib/lessonMarkdownParser.ts:84](../app/lib/lessonMarkdownParser.ts) | Documents intended values `'lesson' \| 'quiz' \| 'test'` |
| Import route | [app/api/import-lesson/route.ts:116,130](../app/api/import-lesson/route.ts) | Persists parsed value, defaults `'lesson'` |
| Import preview page | [app/teacher/lessons/import/page.tsx:328](../app/teacher/lessons/import/page.tsx) | Displays the parsed category before publish |
| Lesson editor | [app/teacher/library/[courseId]/page.tsx:1463-1464](../app/teacher/library/%5BcourseId%5D/page.tsx) | Dropdown offering `lesson` / `quiz` ("✏️ Participation") / `test` ("📝 Test"), with helper text "Tests and quizzes can carry more weight than regular lessons" |
| Student grades | [app/student/grades/page.tsx:126-131,307](../app/student/grades/page.tsx) | `categoryLabel()` buckets it → Tests average and weight chip |
| Teacher gradebook | [app/teacher/gradebook/page.tsx:402](../app/teacher/gradebook/page.tsx) | Same bucketing feeding weighted term average |
| Report card | [app/teacher/report-card/page.tsx:529,656](../app/teacher/report-card/page.tsx) | Same bucketing for quarter grades |
| Transcripts | [app/teacher/transcripts/[studentId]/page.tsx:147-152,307](../app/teacher/transcripts/%5BstudentId%5D/page.tsx) | Same |

All four grade surfaces share the same (duplicated) `categoryLabel()` helper:
substring match, case-insensitive — `includes('test') || includes('exam')` →
the Tests bucket, `includes('quiz')` → Participation, anything else → Lessons.
So `"test"`, `"Test"`, `"chapter test"`, `"exam"` all land correctly, but the
canonical value to use is the editor's own: **`test`**.

One override to know about: an item scheduled with the **in-class flag** is
forced into the Participation bucket *regardless of category*
([gradebook:401-402](../app/teacher/gradebook/page.tsx) — `inClass ? 'quiz' :
categoryLabel(...)`), and the schedule page defaults Friday rows to in-class
([app/teacher/schedule/page.tsx:288](../app/teacher/schedule/page.tsx)). A test
scheduled on a Friday with the toggle left on would count as Participation, not
Tests.

## 2. Parser metadata — three fields, unknown lines silently dropped, md CAN declare the category

[app/lib/lessonMarkdownParser.ts:159-167](../app/lib/lessonMarkdownParser.ts):
in the pre-section "header" region the parser reads exactly three bold labels:

- `**Course:** …` → `courseHint` (informational; the teacher picks the course in the UI)
- `**Assignment type:** …` → lowercased, default `both` (line 129)
- `**Lesson category:** …` → lowercased, default `lesson` (line 130, 165-166)

So yes — the markdown itself declares `**Lesson category:** test` and the
import route persists it verbatim ([route.ts:116](../app/api/import-lesson/route.ts));
nothing needs to be set elsewhere. Any other header line (unrecognized bold
field, stray prose before the first `##`) is **silently discarded** — no
warning, no storage. Everything after `## Video plan / Content mapping /
Copyright trail / Teaching notes / Answer key` goes to teacher-only
`teachingNotes` (175-180); `## Instructions` goes to the student-visible
`instructions` (181-185); `## Assignment` starts question parsing.

Title handling: the full heading (`# Lesson 7.1 — Chapter 7 Test`) is stored as
the display title (lines 141-152), so "7.1" survives **in the title string**
everywhere titles are shown. The numeric extraction is a different story — see §5.

## 3. Import defaults — nothing assumes a video

On create ([app/api/import-lesson/route.ts:108-120](../app/api/import-lesson/route.ts))
the route sets only: `lessonNumber` (`parsed.lessonNumber ?? 0`), `title`,
`instructions`, `teachingNotes`, `assignmentType` (fallback `'both'`),
`lessonCategory` (fallback `'lesson'`), `courseLessonTemplatesId`. Notably:

- **`videoUrl` is never touched** — null on create, and *preserved* on
  re-import of an existing lesson (update input, lines 123-131, omits it). A
  test never gets a video and nothing downstream requires one (§4, §8).
- `worksheetUrl` likewise never touched.
- Import refuses to publish with no title, zero questions, or parser errors
  (94-103). A test whose only question is one `show_work` block passes — one
  question is enough.
- Re-import wipes and recreates all `AssignmentQuestion` rows (133-145).

## 4. No-video rendering — already clean, no change needed

Student lesson page ([app/lessons/page.tsx](../app/lessons/page.tsx)):

- `videoSrc` computed at 300-302: null when `lesson.videoUrl` is null/empty.
- The entire player block is conditional — `{videoSrc && (…)}` at **line 1133**.
  No blank player, no broken element; the section simply doesn't render.
- The "steps" checklist derives its first step from the same variable
  (line 1248: `const video = videoSrc ? ['Watch the video above'] : []`), so a
  test's steps begin directly with print/complete/upload.
- One caveat: the *scheduled* `Lesson` row is what the student page reads, and
  the schedule page copies the template's `videoUrl` into it
  ([schedule/page.tsx:256, 438](../app/teacher/schedule/page.tsx) — `''` when
  the template has none). Empty string is falsy → still hidden. Good.

Cards/thumbnails: neither the student dashboard nor any list renders video
thumbnails. The dashboard selects `videoUrl` but only uses it in static help
text ("watch the video, then submit" — [app/dashboard/page.tsx:982](../app/dashboard/page.tsx)).
The Grade Work list shows a small gray "eye-off" watch badge for any submission
with no `VideoWatch` record ([app/teacher/grades/page.tsx:255-262](../app/teacher/grades/page.tsx)),
tooltip "No video watch data" — cosmetically fine for a test, mildly
misleading at worst (§8).

**Smallest change needed: none.** The hiding the question asks for already exists.

## 5. Numbering — the real landmine: `lessonNumber` is an Int, "7.1" becomes 7

**Field type:** `LessonTemplate.lessonNumber` is **`a.integer().required()`**
in the live Gen 2 schema ([amplify/data/resource.ts:229](../amplify/data/resource.ts))
and `Int!` in Gen 1 ([schema.graphql:152](../amplify/backend/api/mathwithmelinda/schema.graphql)).
**CLAUDE.md's "stored as Float / fractional lessons like 129.5" note is wrong**
for this field — a non-integer literally cannot be stored; AppSync would reject it.

What happens to "7.1" end to end:

- Parser: heading `# Lesson 7.1 — …` → `lessonNumberLabel = "7.1"`, then
  `match(/^(\d+)/)` + `parseInt` → **`lessonNumber = 7`**
  ([lessonMarkdownParser.ts:147-151](../app/lib/lessonMarkdownParser.ts)).
- Import stores `7` ([import-lesson/route.ts:111](../app/api/import-lesson/route.ts)).
- Editor edit-save: `parseInt(editForm.lessonNumber) || 0` → also truncates
  ([library/[courseId]/page.tsx:523](../app/teacher/library/%5BcourseId%5D/page.tsx)).
  (The *new lesson* form uses `parseFloat` at line 357 — typing 7.1 there would
  send a float to an `Int!` field and the mutation would fail.)
- Scheduled `Lesson.order`: `parseInt(day.lessonNumber) || 0` → 7
  ([schedule/page.tsx:435](../app/teacher/schedule/page.tsx)).

**Ordering everywhere is numeric on that field** — no string sorts, so the
"7.1 after 70" pathology cannot happen, but neither can true 7.1 placement:

- Library list: `sort((a,b) => a.lessonNumber - b.lessonNumber)` ([library:267](../app/teacher/library/%5BcourseId%5D/page.tsx))
- Schedule dropdown + its sequence auto-fill: same numeric sort ([schedule:168](../app/teacher/schedule/page.tsx)); auto-fill walks that sorted array, so the test enters the fill sequence adjacent to Lesson 7 (266-270)
- Gradebook columns: `lesson.order ?? tmpl.lessonNumber ?? 9999`, numeric sort, **no tiebreaker** ([gradebook:403, 411](../app/teacher/gradebook/page.tsx))
- Assigned Work page: sorted by week date, not lesson number ([plans:219](../app/teacher/plans/page.tsx))
- Student dashboard: ordered by weekday within the week, number irrelevant

**Net effect:** a test imported as "7.1" stores `7`, ties with Lesson 7, and
sorts *adjacent to* it with tie order decided by JS stable sort over insertion
order — usually after, but unspecified. Display is fine (the title string keeps
"7.1"). Sorting is "nearly right, not guaranteed."

## 6. Gradebook treatment — three weighted buckets already exist; nothing to build

The Semester model carries `lessonWeightPercent` / `quizWeightPercent` /
`testWeightPercent` ([resource.ts:175-177](../amplify/data/resource.ts)),
editable on `/teacher/semesters` ([semesters/page.tsx:371](../app/teacher/semesters/page.tsx)).
Gradebook ([gradebook:441-497](../app/teacher/gradebook/page.tsx)), report card
([report-card:581-583](../app/teacher/report-card/page.tsx)), and the student's
own grades page ([student/grades:429-450](../app/student/grades/page.tsx)) all
compute: Lessons avg × 60% + Participation avg × 20% + **Tests avg × 20%**
(defaults; weights renormalize when a bucket is empty). Students see the
buckets as chips ("📝 Tests 20%").

So a test's grade is **fully distinguishable** — it lands in its own bucket
with its own weight the moment `lessonCategory` includes "test". The "smallest
path to a separate Tests weight" is **zero code**: it shipped already. The only
per-test discipline required is the Friday/in-class override from §1.

## 7. Submission capacity — 4-8 photo pages are fine; the AI grader caps at 8

- **Per-file size:** 15 MB server-side ([app/lib/fileValidation.ts:6](../app/lib/fileValidation.ts),
  enforced in [app/api/submit/route.ts:58-61](../app/api/submit/route.ts)).
  Phone photos run 2-4 MB — fine.
- **File count:** no cap anywhere in the student flow. The picker is a
  `multiple` input accepting images/HEIC/PDF
  ([app/components/SubmissionMethodPicker.tsx:237-240](../app/components/SubmissionMethodPicker.tsx));
  each file is a separate `/api/submit` POST ([lessons/page.tsx:684-711](../app/lessons/page.tsx));
  the submission `content` JSON stores only S3 keys, so DynamoDB size is a
  non-issue. HEIC→JPEG conversion is server-side as usual.
- **Rate limit:** 20 uploads/min/IP ([submit/route.ts:14](../app/api/submit/route.ts))
  — an 8-page packet is under it; only a shared-IP co-op classroom uploading
  simultaneously could brush against it.
- **The one real cap:** AI grade suggestion reads only the **first 8 files** —
  `slice(0, 8)` in [app/lib/gradeSuggestionCore.ts:303](../app/lib/gradeSuggestionCore.ts).
  Pages 9+ are silently invisible to the AI (human grading unaffected — Grade
  Work shows every photo). At 4-8 pages a test fits exactly; a 9-page packet
  would be AI-graded incompletely with no warning.

## 8. VideoWatch / progress — nothing marks a videoless lesson incomplete

- Watch tracking only starts when a video element exists:
  `if (!video || !videoSrc) return` ([lessons/page.tsx:638](../app/lessons/page.tsx)) —
  no `VideoWatch` rows are ever created for a test.
- Teacher dashboard's video gauge counts only lessons **with** a `videoUrl`
  (`if (item.lesson.videoUrl)` — [app/teacher/page.tsx:918-925](../app/teacher/page.tsx)),
  so a test never shows as "unwatched" and can't drag the percentage down.
- Grade Work rows show the gray "No video watch data" badge (§4) — cosmetic only.
- Student dashboard completion is submission-based, not watch-based; no
  progress indicator anywhere keys off watching.

**No perpetual-incomplete risk.**

---

## Recommendations

### (a) Category value for the first test import

Put `**Lesson category:** test` in the markdown header — exactly the string
`test`, matching the editor dropdown's canonical value. It flows through
import → gradebook/report card/student grades Tests bucket with no other setup.
Also confirm the target semester's Tests weight on `/teacher/semesters`
(defaults to 20%), and **do not schedule the test as an in-class (Friday
default) item**, or it will count as Participation instead.

### (b) Small code changes worth making first, ranked

1. **Decide the numbering story (the only near-necessary item).** Options:
   - *No code:* accept that "7.1" stores as `7` and sorts adjacent to Lesson 7
     in unspecified tie order. The title keeps "7.1" so humans are never confused.
     Acceptable for the first one or two tests.
   - *Proper fix (small, but touches the backend):* change
     `LessonTemplate.lessonNumber` to `a.float()` ([resource.ts:229](../amplify/data/resource.ts))
     and `Lesson.order` to float ([resource.ts:219](../amplify/data/resource.ts)),
     switch the parser's `parseInt` to `parseFloat`-on-label
     ([parser:150-151](../app/lib/lessonMarkdownParser.ts)), and the two
     `parseInt` call sites ([library:523](../app/teacher/library/%5BcourseId%5D/page.tsx),
     [schedule:435](../app/teacher/schedule/page.tsx)). Int→Float is a
     widening, deploy-safe type change (every stored value remains valid).
     Do this before tests become routine.
2. **AI grader 8-photo cap** ([gradeSuggestionCore.ts:303](../app/lib/gradeSuggestionCore.ts)):
   raise the cap or surface a "only the first 8 photos were reviewed" warning
   before the first 8-page packet meets a ninth page.
3. **Friday/in-class trap:** consider defaulting `isInClass` to false when the
   selected template's category is `test` ([schedule:250-260, 288](../app/teacher/schedule/page.tsx)) —
   or just make it a process note for Melinda.
4. *Cosmetic:* schedule dropdown renders `Lesson {number} — {title}` →
   "Lesson 7 — Lesson 7.1 — Chapter 7 Test" ([schedule:578](../app/teacher/schedule/page.tsx)).
5. *Cosmetic:* Grade Work watch badge tooltip "No video watch data" on
   videoless tests ([grades:255-262](../app/teacher/grades/page.tsx)).
6. *Docs:* fix CLAUDE.md's incorrect "lesson numbers stored as Float" claim —
   both live schemas say `Int!`.

### (c) Spec vs. code discrepancies

- **`project-instructions/test-format.md` does not exist** in the content repo
  (`~/mathwithmelinda-content/project-instructions/` holds only
  `copyright-rules.md`, `diagram-specs.md`, `output-format.md`,
  `system-prompt.md`, `voice-profile.md`). It needs to be written before tests
  are authored; until then `output-format.md` is the de-facto spec.
- The task's premise "numbered X.1 so 7.1 sorts after Lesson 7" contradicts
  both the code (Int truncation → tie at 7, §5) **and** the existing
  `output-format.md`, which states the heading number is "the sequential
  lesson number (1, 2, 3...) ... First integer saved as `lessonNumber`"
  (line 124) — i.e., the current format doc already assumes integers. If the
  X.1 convention is adopted, both the schema (rec. b-1) and `output-format.md`
  should change together.
- Everything else the pipeline expects (`**Lesson category:** test` legal
  values at output-format.md line 127, `**Assignment type:** both` at 126, one
  `show_work` question being sufficient) matches the code exactly.
