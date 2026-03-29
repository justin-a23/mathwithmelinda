'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import { listLessonTemplates, getCourse, listAssignmentQuestions } from '../../../../src/graphql/queries'
import { updateLessonTemplate, createAssignmentQuestion, deleteAssignmentQuestion, updateAssignmentQuestion } from '../../../../src/graphql/mutations'
import ThemeToggle from '../../../components/ThemeToggle'
import { useRoleGuard } from '../../../hooks/useRoleGuard'
import MathToolbar from '../../../components/MathToolbar'
import MathRenderer from '../../../components/MathRenderer'

const client = generateClient()

const CLOUDFRONT = 'https://dgmfzo1xk5r4e.cloudfront.net'

const COURSE_FOLDERS: Record<string, string> = {
  'Arithmetic 6': 'arithmetic6',
  'Middle School Math': 'middleschoolmath',
  'Pre-Algebra': 'prealgebra',
  'Algebra 1': 'algebra1',
}

type LessonTemplate = {
  id: string
  lessonNumber: number
  title: string
  instructions: string | null
  worksheetUrl: string | null
  videoUrl: string | null
  assignmentType: string | null
  lessonCategory: string | null
  courseLessonTemplatesId: string | null
  updatedAt: string | null
}

type Course = {
  id: string
  title: string
}

type Filter = 'all' | 'missing-video' | 'has-video' | 'recently-updated'

type EditForm = {
  title: string
  lessonNumber: string
  instructions: string
  worksheetUrl: string
  videoUrl: string
  assignmentType: string
  lessonCategory: string
}

type UploadState = {
  uploading: boolean
  progress: number
  error: string
}

type AssignmentQuestion = {
  id: string
  order: number
  questionText: string
  questionType: string
  choices: string | null
  correctAnswer: string | null
  lessonTemplateAssignmentQuestionsId: string | null
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  number: 'Number',
  short_text: 'Short Text',
  multiple_choice: 'Multiple Choice',
  show_work: 'Show Work',
}

export default function LessonLibraryPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')
  const params = useParams()
  const courseId = params?.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<LessonTemplate[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', lessonNumber: '', instructions: '', worksheetUrl: '', videoUrl: '', assignmentType: 'none', lessonCategory: 'lesson' })
  const [saving, setSaving] = useState(false)
  const [videoUpload, setVideoUpload] = useState<UploadState>({ uploading: false, progress: 0, error: '' })
  const [worksheetUpload, setWorksheetUpload] = useState<UploadState>({ uploading: false, progress: 0, error: '' })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [worksheetFile, setWorksheetFile] = useState<File | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const worksheetInputRef = useRef<HTMLInputElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Question builder state
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [newQuestion, setNewQuestion] = useState({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingQuestionForm, setEditingQuestionForm] = useState({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
  const [savingQuestion, setSavingQuestion] = useState(false)
  const editQuestionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const correctAnswerInputRef = useRef<HTMLTextAreaElement>(null)
  const editCorrectAnswerInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchLessons()
    }
  }, [courseId])

  async function fetchCourse() {
    try {
      const result = await client.graphql({ query: getCourse, variables: { id: courseId } })
      setCourse(result.data.getCourse as Course)
    } catch (err) {
      console.error('Error fetching course:', err)
    }
  }

  async function fetchLessons() {
    setLoading(true)
    try {
      let allItems: LessonTemplate[] = []
      let nextToken: string | null = null
      do {
        const result: any = await client.graphql({
          query: listLessonTemplates,
          variables: {
            filter: { courseLessonTemplatesId: { eq: courseId } },
            limit: 200,
            nextToken
          }
        })
        allItems = [...allItems, ...result.data.listLessonTemplates.items]
        nextToken = result.data.listLessonTemplates.nextToken
      } while (nextToken)
      allItems.sort((a, b) => a.lessonNumber - b.lessonNumber)
      setLessons(allItems)
    } catch (err) {
      console.error('Error fetching lessons:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuestions(lessonId: string) {
    setLoadingQuestions(true)
    try {
      let allItems: AssignmentQuestion[] = []
      let nextToken: string | null = null
      do {
        const result: any = await client.graphql({
          query: listAssignmentQuestions,
          variables: {
            filter: { lessonTemplateQuestionsId: { eq: lessonId } },
            limit: 200,
            nextToken
          }
        })
        allItems = [...allItems, ...result.data.listAssignmentQuestions.items]
        nextToken = result.data.listAssignmentQuestions.nextToken
      } while (nextToken)
      allItems.sort((a, b) => a.order - b.order)
      setQuestions(allItems)
    } catch (err) {
      console.error('Error fetching questions:', err)
    } finally {
      setLoadingQuestions(false)
    }
  }

  function startEdit(lesson: LessonTemplate) {
    setEditingId(lesson.id)
    setEditForm({
      title: lesson.title,
      lessonNumber: String(lesson.lessonNumber),
      instructions: lesson.instructions || '',
      worksheetUrl: lesson.worksheetUrl || '',
      videoUrl: lesson.videoUrl || '',
      assignmentType: lesson.assignmentType || 'none',
      lessonCategory: lesson.lessonCategory || 'lesson'
    })
    setVideoFile(null)
    setWorksheetFile(null)
    setVideoUpload({ uploading: false, progress: 0, error: '' })
    setWorksheetUpload({ uploading: false, progress: 0, error: '' })
    setQuestions([])
    setNewQuestion({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
    fetchQuestions(lesson.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setVideoFile(null)
    setWorksheetFile(null)
    setQuestions([])
  }

  async function uploadFile(
    file: File,
    folder: string,
    filename: string,
    contentType: string,
    setUpload: (s: UploadState) => void
  ): Promise<string> {
    setUpload({ uploading: true, progress: 0, error: '' })
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType, course: folder })
    })
    if (!res.ok) throw new Error('Failed to get upload URL')
    const { signedUrl, key } = await res.json()

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUpload({ uploading: true, progress: Math.round((e.loaded / e.total) * 100), error: '' })
      }
      xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed'))
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(file)
    })

    setUpload({ uploading: false, progress: 100, error: '' })
    return key
  }

  async function handleVideoUpload(lesson: LessonTemplate) {
    if (!videoFile || !course) return
    try {
      const courseFolder = COURSE_FOLDERS[course.title] || course.title.toLowerCase().replace(/\s+/g, '')
      const filename = `${course.title} - Lesson ${lesson.lessonNumber} - ${lesson.title}.mp4`
      const key = await uploadFile(videoFile, courseFolder, filename, 'video/mp4', setVideoUpload)
      setEditForm(f => ({ ...f, videoUrl: key }))
      setVideoFile(null)
    } catch (err) {
      setVideoUpload({ uploading: false, progress: 0, error: 'Upload failed. Please try again.' })
    }
  }

  async function handleWorksheetUpload(lesson: LessonTemplate) {
    if (!worksheetFile || !course) return
    try {
      const courseFolder = COURSE_FOLDERS[course.title] || course.title.toLowerCase().replace(/\s+/g, '')
      const filename = worksheetFile.name
      const key = await uploadFile(worksheetFile, `worksheets/${courseFolder}`, filename, 'application/pdf', setWorksheetUpload)
      const url = `${CLOUDFRONT}/worksheets/${courseFolder}/${filename}`
      setEditForm(f => ({ ...f, worksheetUrl: url }))
      setWorksheetFile(null)
    } catch (err) {
      setWorksheetUpload({ uploading: false, progress: 0, error: 'Upload failed. Please try again.' })
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      await client.graphql({
        query: updateLessonTemplate,
        variables: {
          input: {
            id,
            title: editForm.title,
            lessonNumber: parseInt(editForm.lessonNumber) || 0,
            instructions: editForm.instructions || null,
            worksheetUrl: editForm.worksheetUrl || null,
            videoUrl: editForm.videoUrl || null,
            assignmentType: editForm.assignmentType || 'none',
            lessonCategory: editForm.lessonCategory || 'lesson'
          }
        }
      })
      setLessons(prev => prev.map(l => l.id === id ? {
        ...l,
        title: editForm.title,
        lessonNumber: parseInt(editForm.lessonNumber) || l.lessonNumber,
        instructions: editForm.instructions || null,
        worksheetUrl: editForm.worksheetUrl || null,
        videoUrl: editForm.videoUrl || null,
        assignmentType: editForm.assignmentType || 'none',
        lessonCategory: editForm.lessonCategory || 'lesson'
      } : l).sort((a, b) => a.lessonNumber - b.lessonNumber))
      setEditingId(null)
    } catch (err) {
      console.error('Error saving lesson:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddQuestion(lessonId: string) {
    if (!newQuestion.questionText.trim()) return
    setAddingQuestion(true)
    try {
      const result: any = await client.graphql({
        query: createAssignmentQuestion,
        variables: {
          input: {
            questionText: newQuestion.questionText.trim(),
            questionType: newQuestion.questionType,
            choices: newQuestion.questionType === 'multiple_choice' && newQuestion.choices.trim() ? newQuestion.choices.trim() : null,
            correctAnswer: (newQuestion.questionType === 'number' || newQuestion.questionType === 'multiple_choice') && newQuestion.correctAnswer.trim() ? newQuestion.correctAnswer.trim() : null,
            order: questions.length + 1,
            lessonTemplateQuestionsId: lessonId
          }
        }
      })
      const created = result.data.createAssignmentQuestion
      const newQ: AssignmentQuestion = {
        id: created.id,
        order: created.order,
        questionText: created.questionText,
        questionType: created.questionType,
        choices: created.choices ?? null,
        correctAnswer: created.correctAnswer ?? null,
        lessonTemplateAssignmentQuestionsId: lessonId
      }
      setQuestions(prev => [...prev, newQ])
      setNewQuestion({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
    } catch (err) {
      console.error('Error adding question:', err)
    } finally {
      setAddingQuestion(false)
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    try {
      await client.graphql({
        query: deleteAssignmentQuestion,
        variables: { input: { id: questionId } }
      })
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (err) {
      console.error('Error deleting question:', err)
    }
  }

  function startEditQuestion(q: AssignmentQuestion) {
    setEditingQuestionId(q.id)
    setEditingQuestionForm({
      questionText: q.questionText,
      questionType: q.questionType,
      choices: q.choices || '',
      correctAnswer: q.correctAnswer || ''
    })
  }


  async function handleUpdateQuestion(questionId: string) {
    if (!editingQuestionForm.questionText.trim()) return
    setSavingQuestion(true)
    try {
      const result: any = await client.graphql({
        query: updateAssignmentQuestion,
        variables: {
          input: {
            id: questionId,
            questionText: editingQuestionForm.questionText.trim(),
            questionType: editingQuestionForm.questionType,
            choices: editingQuestionForm.questionType === 'multiple_choice' && editingQuestionForm.choices.trim() ? editingQuestionForm.choices.trim() : null,
            correctAnswer: (editingQuestionForm.questionType === 'number' || editingQuestionForm.questionType === 'multiple_choice') && editingQuestionForm.correctAnswer.trim() ? editingQuestionForm.correctAnswer.trim() : null,
          }
        }
      })
      const updated = result.data.updateAssignmentQuestion
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updated } : q))
      setEditingQuestionId(null)
    } catch (err) {
      console.error('Error updating question:', err)
    } finally {
      setSavingQuestion(false)
    }
  }

  const filtered = lessons.filter(l => {
    const today = new Date().toDateString()
    const matchesFilter =
      filter === 'all' ||
      (filter === 'missing-video' && !l.videoUrl) ||
      (filter === 'has-video' && !!l.videoUrl) ||
      (filter === 'recently-updated' && !!l.updatedAt && new Date(l.updatedAt).toDateString() === today)
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      String(l.lessonNumber).includes(search)
    return matchesFilter && matchesSearch
  })

  const missingCount = lessons.filter(l => !l.videoUrl).length

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)',
    borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)',
    boxSizing: 'border-box', background: 'var(--white)', color: 'var(--foreground)'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px'
  }

  const sectionHeadStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--plum)', marginBottom: '12px', marginTop: '20px'
  }

  const assignmentTypes = [
    { value: 'none', label: 'No Assignment' },
    { value: 'questions', label: 'Digital Questions' },
    { value: 'upload', label: 'Upload Only' },
    { value: 'both', label: 'Questions + Upload' },
  ]

  const showQuestionBuilder = editForm.assignmentType === 'questions' || editForm.assignmentType === 'both'

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/teacher')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '18px' }}>{course?.title || 'Lesson Library'}</span>
          <span style={{ background: 'var(--plum)', color: 'white', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>Teacher</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
            {course?.title} — Lesson Library
          </h1>
          <p style={{ color: 'var(--gray-mid)' }}>
            {lessons.length} lessons total
            {missingCount > 0 && <span style={{ marginLeft: '12px', color: '#e05252', fontWeight: 500 }}>⚠ {missingCount} missing video</span>}
          </p>
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'missing-video', 'has-video', 'recently-updated'] as Filter[]).map(f => {
            const today = new Date().toDateString()
            const recentCount = lessons.filter(l => !!l.updatedAt && new Date(l.updatedAt).toDateString() === today).length
            const label =
              f === 'all' ? `All (${lessons.length})` :
              f === 'missing-video' ? `⚠ Missing Video (${missingCount})` :
              f === 'has-video' ? `Has Video (${lessons.length - missingCount})` :
              `✎ Updated Today (${recentCount})`
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 18px', borderRadius: '20px', border: '1px solid', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500,
                borderColor: filter === f ? 'var(--plum)' : 'var(--gray-light)',
                background: filter === f ? 'var(--plum)' : 'var(--white)',
                color: filter === f ? 'white' : 'var(--gray-dark)'
              }}>
                {label}
              </button>
            )
          })}
          <input
            type="text"
            placeholder="Search by title or lesson #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', padding: '8px 14px', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--white)', color: 'var(--foreground)', width: '240px' }}
          />
        </div>

        {/* Lessons Table */}
        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading lessons...</p>
        ) : (
          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 80px 100px', padding: '12px 20px', background: 'var(--background)', fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid var(--gray-light)' }}>
              <div>#</div>
              <div>Title</div>
              <div>Video</div>
              <div>Worksheet</div>
              <div></div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-mid)' }}>No lessons match your filter.</div>
            ) : (
              filtered.map((lesson, idx) => (
                <div key={lesson.id}>
                  {/* Row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 160px 80px 100px',
                    padding: '14px 20px', alignItems: 'center',
                    borderTop: idx === 0 ? 'none' : '1px solid var(--gray-light)',
                    background: editingId === lesson.id ? 'var(--background)' : 'var(--white)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--plum)' }}>{lesson.lessonNumber}</div>
                    <div style={{ fontSize: '14px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {lesson.title}
                      {lesson.updatedAt && new Date(lesson.updatedAt).toDateString() === new Date().toDateString() && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1565c0', background: '#e3f2fd', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>✎ Modified today</span>
                      )}
                    </div>
                    <div>
                      {lesson.videoUrl
                        ? <span style={{ fontSize: '12px', fontWeight: 500, color: '#2e7d32', background: '#e8f5e9', padding: '3px 10px', borderRadius: '20px' }}>✓ Video attached</span>
                        : <span style={{ fontSize: '12px', fontWeight: 500, color: '#e05252', background: '#fdecea', padding: '3px 10px', borderRadius: '20px' }}>✗ No video</span>}
                    </div>
                    <div>
                      {lesson.worksheetUrl
                        ? <span style={{ fontSize: '12px', color: '#2e7d32' }}>✓</span>
                        : <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>—</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {editingId === lesson.id
                        ? <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--gray-mid)' }}>Cancel</button>
                        : <button onClick={() => startEdit(lesson)} style={{ background: 'none', border: '1px solid var(--gray-light)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--gray-dark)', padding: '4px 12px' }}>Edit</button>}
                    </div>
                  </div>

                  {/* Edit Panel */}
                  {editingId === lesson.id && (
                    <div style={{ padding: '24px', background: 'var(--background)', borderTop: '1px solid var(--gray-light)' }}>

                      {/* Basic Info */}
                      <div style={sectionHeadStyle}>Basic Info</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={labelStyle}>Lesson #</label>
                          <input type="text" value={editForm.lessonNumber} onChange={e => setEditForm(f => ({ ...f, lessonNumber: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Title</label>
                          <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Instructions</label>
                        <textarea
                          value={editForm.instructions}
                          onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
                          placeholder="Student-facing instructions for this lesson"
                          rows={5}
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                      </div>

                      {/* Lesson Category Picker */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Grade Category</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {([
                            { value: 'lesson', label: '📖 Lesson' },
                            { value: 'quiz', label: '✏️ Participation' },
                            { value: 'test', label: '📝 Test' },
                          ] as { value: string; label: string }[]).map(cat => (
                            <button
                              key={cat.value}
                              onClick={() => setEditForm(f => ({ ...f, lessonCategory: cat.value }))}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                fontFamily: 'var(--font-body)',
                                borderColor: editForm.lessonCategory === cat.value ? 'var(--plum)' : 'var(--gray-light)',
                                background: editForm.lessonCategory === cat.value ? 'var(--plum)' : 'var(--white)',
                                color: editForm.lessonCategory === cat.value ? 'white' : 'var(--gray-dark)'
                              }}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--gray-mid)' }}>
                          Used for weighted grade calculations. Tests and quizzes can carry more weight than regular lessons.
                        </p>
                      </div>

                      {/* Assignment Type Picker */}
                      <div style={{ marginBottom: '8px' }}>
                        <label style={labelStyle}>Assignment Type</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {assignmentTypes.map(at => (
                            <button
                              key={at.value}
                              onClick={() => setEditForm(f => ({ ...f, assignmentType: at.value }))}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                fontFamily: 'var(--font-body)',
                                borderColor: editForm.assignmentType === at.value ? 'var(--plum)' : 'var(--gray-light)',
                                background: editForm.assignmentType === at.value ? 'var(--plum)' : 'var(--white)',
                                color: editForm.assignmentType === at.value ? 'white' : 'var(--gray-dark)'
                              }}
                            >
                              {at.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Video */}
                      <div style={sectionHeadStyle}>Video</div>
                      {editForm.videoUrl ? (
                        <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2e7d32', marginBottom: '2px' }}>✓ Video attached</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-mid)', fontFamily: 'monospace' }}>{editForm.videoUrl}</div>
                          </div>
                          <button onClick={() => { if (window.confirm('Are you sure you want to remove this video? This cannot be undone.')) setEditForm(f => ({ ...f, videoUrl: '' })) }} style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '12px', padding: '10px 16px', background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: '8px', fontSize: '13px', color: '#c62828' }}>
                          ✗ No video attached
                        </div>
                      )}
                      <div
                        onClick={() => videoInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setVideoFile(f) }}
                        style={{ border: `2px dashed ${videoFile ? 'var(--plum)' : 'var(--gray-light)'}`, borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: videoFile ? 'var(--background)' : 'var(--white)', marginBottom: '8px' }}>
                        <input ref={videoInputRef} type="file" accept="video/mp4" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f) }} />
                        {videoFile
                          ? <div><div style={{ fontWeight: 500, color: 'var(--plum)', marginBottom: '2px' }}>{videoFile.name}</div><div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div></div>
                          : <div style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>Click or drag & drop an MP4 to {editForm.videoUrl ? 'replace' : 'add'} video</div>}
                      </div>
                      {videoFile && !videoUpload.uploading && (
                        <button onClick={() => handleVideoUpload(lesson)} style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Upload Video
                        </button>
                      )}
                      {videoUpload.uploading && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>Uploading... {videoUpload.progress}%</div>
                          <div style={{ background: 'var(--gray-light)', borderRadius: '4px', height: '6px' }}>
                            <div style={{ background: 'var(--plum)', height: '6px', borderRadius: '4px', width: `${videoUpload.progress}%`, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}
                      {videoUpload.error && <p style={{ color: '#e05252', fontSize: '13px', marginBottom: '8px' }}>{videoUpload.error}</p>}

                      {/* Worksheet */}
                      <div style={sectionHeadStyle}>Worksheet</div>
                      {editForm.worksheetUrl ? (
                        <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2e7d32', marginBottom: '2px' }}>✓ Worksheet attached</div>
                            <a href={editForm.worksheetUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--plum)', fontFamily: 'monospace' }}>View PDF ↗</a>
                          </div>
                          <button onClick={() => { if (window.confirm('Are you sure you want to remove this worksheet?')) setEditForm(f => ({ ...f, worksheetUrl: '' })) }} style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '12px', padding: '10px 16px', background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '13px', color: 'var(--gray-mid)' }}>
                          No worksheet attached
                        </div>
                      )}
                      <div
                        onClick={() => worksheetInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setWorksheetFile(f) }}
                        style={{ border: `2px dashed ${worksheetFile ? 'var(--plum)' : 'var(--gray-light)'}`, borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: worksheetFile ? 'var(--background)' : 'var(--white)', marginBottom: '8px' }}>
                        <input ref={worksheetInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setWorksheetFile(f) }} />
                        {worksheetFile
                          ? <div><div style={{ fontWeight: 500, color: 'var(--plum)', marginBottom: '2px' }}>{worksheetFile.name}</div><div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{(worksheetFile.size / 1024).toFixed(0)} KB</div></div>
                          : <div style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>Click or drag & drop a PDF to {editForm.worksheetUrl ? 'replace' : 'add'} worksheet</div>}
                      </div>
                      {worksheetFile && !worksheetUpload.uploading && (
                        <button onClick={() => handleWorksheetUpload(lesson)} style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Upload Worksheet
                        </button>
                      )}
                      {worksheetUpload.uploading && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '4px' }}>Uploading... {worksheetUpload.progress}%</div>
                          <div style={{ background: 'var(--gray-light)', borderRadius: '4px', height: '6px' }}>
                            <div style={{ background: 'var(--plum)', height: '6px', borderRadius: '4px', width: `${worksheetUpload.progress}%`, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}
                      {worksheetUpload.error && <p style={{ color: '#e05252', fontSize: '13px', marginBottom: '8px' }}>{worksheetUpload.error}</p>}

                      {/* Assignment Questions */}
                      {showQuestionBuilder && (
                        <>
                          <div style={sectionHeadStyle}>Assignment Questions</div>

                          {/* Existing questions list */}
                          {loadingQuestions ? (
                            <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>Loading questions...</p>
                          ) : questions.length === 0 ? (
                            <div style={{ padding: '14px 16px', background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '16px' }}>
                              No questions yet. Add your first question below.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                              {questions.map((q, qIdx) => (
                                <div key={q.id} style={{ background: 'var(--white)', border: `1px solid ${editingQuestionId === q.id ? 'var(--plum)' : 'var(--gray-light)'}`, borderRadius: '8px', padding: '14px 16px' }}>
                                  {editingQuestionId === q.id ? (
                                    /* Inline edit form */
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px' }}>Editing Question {qIdx + 1}</div>
                                      <MathToolbar
                                        textareaRef={editQuestionTextareaRef}
                                        value={editingQuestionForm.questionText}
                                        onChange={val => setEditingQuestionForm(f => ({ ...f, questionText: val }))}
                                      />
                                      <textarea
                                        ref={editQuestionTextareaRef}
                                        value={editingQuestionForm.questionText}
                                        onChange={e => setEditingQuestionForm(f => ({ ...f, questionText: e.target.value }))}
                                        rows={3}
                                        style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }}
                                      />
                                      <select value={editingQuestionForm.questionType} onChange={e => setEditingQuestionForm(f => ({ ...f, questionType: e.target.value, correctAnswer: '' }))}
                                        style={{ ...inputStyle, marginBottom: '10px' }}>
                                        <option value="number">Number</option>
                                        <option value="short_text">Short Text</option>
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="show_work">Show Work (photo upload)</option>
                                      </select>
                                      {(editingQuestionForm.questionType === 'number' || editingQuestionForm.questionType === 'short_text' || editingQuestionForm.questionType === 'multiple_choice') && (
                                        <div style={{ marginBottom: '10px' }}>
                                          <label style={labelStyle}>Correct answer (optional — for auto-grading)</label>
                                          <MathToolbar
                                            textareaRef={editCorrectAnswerInputRef}
                                            value={editingQuestionForm.correctAnswer}
                                            onChange={val => setEditingQuestionForm(f => ({ ...f, correctAnswer: val }))}
                                          />
                                          <textarea
                                            ref={editCorrectAnswerInputRef}
                                            value={editingQuestionForm.correctAnswer}
                                            onChange={e => setEditingQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))}
                                            rows={2}
                                            placeholder="e.g. \(\frac{7}{8}\) or just 42"
                                            style={{ ...inputStyle, resize: 'vertical' }}
                                          />
                                          {editingQuestionForm.correctAnswer && (
                                            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--gray-dark)' }}>
                                              Preview: <MathRenderer text={editingQuestionForm.correctAnswer} />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleUpdateQuestion(q.id)} disabled={savingQuestion || !editingQuestionForm.questionText.trim()}
                                          style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                                          {savingQuestion ? 'Saving...' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditingQuestionId(null)}
                                          style={{ background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px 18px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Read-only view */
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                      <div style={{ color: 'var(--gray-mid)', fontSize: '16px', cursor: 'grab', paddingTop: '2px', userSelect: 'none' }}>⠿</div>
                                      <div style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '14px', minWidth: '24px', paddingTop: '1px' }}>{qIdx + 1}.</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '6px', lineHeight: '1.6' }}><MathRenderer text={q.questionText} /></div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'var(--background)', color: 'var(--gray-dark)', border: '1px solid var(--gray-light)' }}>
                                          {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => startEditQuestion(q)}
                                          style={{ background: 'none', border: '1px solid var(--plum)', color: 'var(--plum)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}>
                                          Edit
                                        </button>
                                        <button onClick={() => handleDeleteQuestion(q.id)}
                                          style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}>
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Question form */}
                          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '16px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Question</div>

                            {/* Question text */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={labelStyle}>Question</label>
                              <MathToolbar
                                textareaRef={questionTextareaRef}
                                value={newQuestion.questionText}
                                onChange={val => setNewQuestion(q => ({ ...q, questionText: val }))}
                              />
                              <textarea
                                ref={questionTextareaRef}
                                value={newQuestion.questionText}
                                onChange={e => setNewQuestion(q => ({ ...q, questionText: e.target.value }))}
                                placeholder="Type your question here..."
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical' }}
                              />
                            </div>

                            {/* Question type */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={labelStyle}>Answer Type</label>
                              <select
                                value={newQuestion.questionType}
                                onChange={e => setNewQuestion(q => ({ ...q, questionType: e.target.value, choices: '', correctAnswer: '' }))}
                                style={{ ...inputStyle }}
                              >
                                <option value="number">Number answer</option>
                                <option value="short_text">Short text answer</option>
                                <option value="multiple_choice">Multiple choice</option>
                                <option value="show_work">Show work (photo)</option>
                              </select>
                            </div>

                            {/* Choices (multiple choice only) */}
                            {newQuestion.questionType === 'multiple_choice' && (
                              <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Choices</label>
                                <textarea
                                  value={newQuestion.choices}
                                  onChange={e => setNewQuestion(q => ({ ...q, choices: e.target.value }))}
                                  placeholder={'One choice per line\nA) ...\nB) ...'}
                                  rows={4}
                                  style={{ ...inputStyle, resize: 'vertical' }}
                                />
                              </div>
                            )}

                            {/* Correct answer */}
                            {(newQuestion.questionType === 'number' || newQuestion.questionType === 'short_text' || newQuestion.questionType === 'multiple_choice') && (
                              <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Correct answer (optional — for auto-grading)</label>
                                <MathToolbar
                                  textareaRef={correctAnswerInputRef}
                                  value={newQuestion.correctAnswer}
                                  onChange={val => setNewQuestion(q => ({ ...q, correctAnswer: val }))}
                                />
                                <textarea
                                  ref={correctAnswerInputRef}
                                  value={newQuestion.correctAnswer}
                                  onChange={e => setNewQuestion(q => ({ ...q, correctAnswer: e.target.value }))}
                                  rows={2}
                                  placeholder="e.g. \(\frac{7}{8}\) or just 42"
                                  style={{ ...inputStyle, resize: 'vertical' }}
                                />
                                {newQuestion.correctAnswer && (
                                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--gray-dark)' }}>
                                    Preview: <MathRenderer text={newQuestion.correctAnswer} />
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => handleAddQuestion(lesson.id)}
                              disabled={addingQuestion || !newQuestion.questionText.trim()}
                              style={{
                                background: newQuestion.questionText.trim() ? 'var(--plum)' : 'var(--gray-light)',
                                color: newQuestion.questionText.trim() ? 'white' : 'var(--gray-mid)',
                                border: 'none', borderRadius: '6px', padding: '8px 20px',
                                cursor: newQuestion.questionText.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)'
                              }}
                            >
                              {addingQuestion ? 'Adding...' : 'Add Question'}
                            </button>
                          </div>
                        </>
                      )}

                      {/* Save */}
                      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-light)', display: 'flex', gap: '12px' }}>
                        <button onClick={() => saveEdit(lesson.id)} disabled={saving} style={{ background: 'var(--plum)', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={cancelEdit} style={{ background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
