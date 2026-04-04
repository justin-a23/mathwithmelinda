'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import { getCourse, listAssignmentQuestions } from '../../../../src/graphql/queries'
import { createAssignmentQuestion, deleteAssignmentQuestion, updateAssignmentQuestion } from '../../../../src/graphql/mutations'

// Inline queries include teachingNotes which postdates the generated types
const listLessonTemplatesInline = /* GraphQL */`
  query ListLessonTemplates($filter: ModelLessonTemplateFilterInput, $limit: Int, $nextToken: String) {
    listLessonTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id lessonNumber title instructions teachingNotes
        worksheetUrl videoUrl assignmentType lessonCategory
        courseLessonTemplatesId updatedAt
      }
      nextToken
    }
  }
`
const updateLessonTemplateInline = /* GraphQL */`
  mutation UpdateLessonTemplate($input: UpdateLessonTemplateInput!) {
    updateLessonTemplate(input: $input) {
      id lessonNumber title instructions teachingNotes
      worksheetUrl videoUrl assignmentType lessonCategory updatedAt
    }
  }
`
const createLessonTemplateInline = /* GraphQL */`
  mutation CreateLessonTemplate($input: CreateLessonTemplateInput!) {
    createLessonTemplate(input: $input) {
      id lessonNumber title instructions teachingNotes
      worksheetUrl videoUrl assignmentType lessonCategory updatedAt
    }
  }
`
import TeacherNav from '../../../components/TeacherNav'
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
  teachingNotes: string | null
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
  teachingNotes: string
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
  multiple_choice_multi: 'Multiple Choice (multi)',
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
  const [editForm, setEditForm] = useState<EditForm>({ title: '', lessonNumber: '', instructions: '', teachingNotes: '', worksheetUrl: '', videoUrl: '', assignmentType: 'none', lessonCategory: 'lesson' })
  const [saving, setSaving] = useState(false)
  const [videoUpload, setVideoUpload] = useState<UploadState>({ uploading: false, progress: 0, error: '' })
  const [orphanVideos, setOrphanVideos] = useState<{ key: string; label: string }[] | null>(null)
  const [loadingOrphans, setLoadingOrphans] = useState(false)
  const [showOrphanPicker, setShowOrphanPicker] = useState(false)
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
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const editQuestionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const correctAnswerInputRef = useRef<HTMLTextAreaElement>(null)
  const editCorrectAnswerInputRef = useRef<HTMLTextAreaElement>(null)

  // Dirty-state tracking for unsaved changes warning
  const [isDirty, setIsDirty] = useState(false)
  const editFormLoadedRef = useRef(false)
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details')

  // New lesson creation
  const [showNewLessonForm, setShowNewLessonForm] = useState(false)
  const [newLessonForm, setNewLessonForm] = useState({ lessonNumber: '', title: '' })
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchLessons()
    }
  }, [courseId])

  // Mark dirty whenever editForm changes, but skip the initial population from startEdit
  useEffect(() => {
    if (!editFormLoadedRef.current) {
      editFormLoadedRef.current = true
      return
    }
    if (editingId) setIsDirty(true)
  }, [editForm]) // eslint-disable-line react-hooks/exhaustive-deps

  // Browser-tab close warning when there are unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

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
          query: listLessonTemplatesInline,
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
    editFormLoadedRef.current = false
    setIsDirty(false)
    setActiveTab('details')
    setEditingId(lesson.id)
    setEditForm({
      title: lesson.title,
      lessonNumber: String(lesson.lessonNumber),
      instructions: lesson.instructions || '',
      teachingNotes: lesson.teachingNotes || '',
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

  async function handleCreateLesson() {
    const num = parseFloat(newLessonForm.lessonNumber)
    if (!newLessonForm.title.trim()) { setCreateError('Title is required.'); return }
    if (isNaN(num)) { setCreateError('Lesson number is required.'); return }
    if (!course) return
    setCreatingLesson(true)
    setCreateError('')
    try {
      const result: any = await client.graphql({
        query: createLessonTemplateInline,
        variables: {
          input: {
            lessonNumber: num,
            title: newLessonForm.title.trim(),
            assignmentType: 'none',
            lessonCategory: 'lesson',
            courseLessonTemplatesId: course.id,
          } as any
        }
      })
      const created = result.data.createLessonTemplate
      const newLesson: LessonTemplate = {
        id: created.id,
        lessonNumber: created.lessonNumber,
        title: created.title,
        instructions: null,
        teachingNotes: null,
        worksheetUrl: null,
        videoUrl: null,
        assignmentType: 'none',
        lessonCategory: 'lesson',
        courseLessonTemplatesId: course.id,
        updatedAt: created.updatedAt,
      }
      setLessons(prev => [...prev, newLesson].sort((a, b) => a.lessonNumber - b.lessonNumber))
      setShowNewLessonForm(false)
      setNewLessonForm({ lessonNumber: '', title: '' })
      // Open the new lesson for editing immediately
      startEdit(newLesson)
    } catch (err) {
      console.error(err)
      setCreateError('Failed to create lesson. Please try again.')
    } finally {
      setCreatingLesson(false)
    }
  }

  function cancelEdit() {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    setEditingId(null)
    setIsDirty(false)
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
      setIsDirty(true)
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
      setIsDirty(true)
      setWorksheetFile(null)
    } catch (err) {
      setWorksheetUpload({ uploading: false, progress: 0, error: 'Upload failed. Please try again.' })
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      await (client.graphql({
        query: updateLessonTemplateInline,
        variables: {
          input: {
            id,
            title: editForm.title,
            lessonNumber: parseInt(editForm.lessonNumber) || 0,
            instructions: editForm.instructions || null,
            teachingNotes: editForm.teachingNotes || null,
            worksheetUrl: editForm.worksheetUrl || null,
            videoUrl: editForm.videoUrl || null,
            assignmentType: editForm.assignmentType || 'none',
            lessonCategory: editForm.lessonCategory || 'lesson'
          }
        }
      }) as any)
      setLessons(prev => prev.map(l => l.id === id ? {
        ...l,
        title: editForm.title,
        lessonNumber: parseInt(editForm.lessonNumber) || l.lessonNumber,
        instructions: editForm.instructions || null,
        teachingNotes: editForm.teachingNotes || null,
        worksheetUrl: editForm.worksheetUrl || null,
        videoUrl: editForm.videoUrl || null,
        assignmentType: editForm.assignmentType || 'none',
        lessonCategory: editForm.lessonCategory || 'lesson'
      } : l).sort((a, b) => a.lessonNumber - b.lessonNumber))
      setIsDirty(false)
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
            choices: (newQuestion.questionType === 'multiple_choice' || newQuestion.questionType === 'multiple_choice_multi') && newQuestion.choices.trim() ? newQuestion.choices.trim() : null,
            correctAnswer: (newQuestion.questionType === 'number' || newQuestion.questionType === 'multiple_choice' || newQuestion.questionType === 'multiple_choice_multi') && newQuestion.correctAnswer.trim() ? newQuestion.correctAnswer.trim() : null,
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
      setIsDirty(true)
      setNewQuestion({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
    } catch (err) {
      console.error('Error adding question:', err)
    } finally {
      setAddingQuestion(false)
    }
  }

  async function handleAddSectionHeader(lessonId: string) {
    setAddingQuestion(true)
    try {
      const result: any = await client.graphql({
        query: createAssignmentQuestion,
        variables: {
          input: {
            questionText: 'Section Header',
            questionType: 'section_header',
            choices: null,
            correctAnswer: null,
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
        choices: null,
        correctAnswer: null,
        lessonTemplateAssignmentQuestionsId: lessonId
      }
      setQuestions(prev => [...prev, newQ])
      setIsDirty(true)
      // Auto-open edit so teacher can type the header text
      setEditingQuestionId(created.id)
      setEditingQuestionForm({ questionText: '', questionType: 'section_header', choices: '', correctAnswer: '' })
    } catch (err) {
      console.error('Error adding section header:', err)
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
      setIsDirty(true)
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

  async function reorderQuestions(fromIndex: number, toIndex: number) {
    const newQuestions = [...questions]
    const [moved] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, moved)
    const updated = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }))
    setQuestions(updated)
    setIsDirty(true)
    const minIdx = Math.min(fromIndex, toIndex)
    const maxIdx = Math.max(fromIndex, toIndex)
    const toUpdate = updated.slice(minIdx, maxIdx + 1)
    await Promise.all(toUpdate.map(q =>
      client.graphql({
        query: updateAssignmentQuestion,
        variables: { input: { id: q.id, order: q.order } }
      })
    ))
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
            choices: (editingQuestionForm.questionType === 'multiple_choice' || editingQuestionForm.questionType === 'multiple_choice_multi') && editingQuestionForm.choices.trim() ? editingQuestionForm.choices.trim() : null,
            correctAnswer: (editingQuestionForm.questionType === 'number' || editingQuestionForm.questionType === 'multiple_choice' || editingQuestionForm.questionType === 'multiple_choice_multi') && editingQuestionForm.correctAnswer.trim() ? editingQuestionForm.correctAnswer.trim() : null,
          }
        }
      })
      const updated = result.data.updateAssignmentQuestion
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updated } : q))
      setIsDirty(true)
      setEditingQuestionId(null)
    } catch (err) {
      console.error('Error updating question:', err)
    } finally {
      setSavingQuestion(false)
    }
  }

  async function previewWorksheet(lesson: LessonTemplate) {
    const qs = questions.filter(q => q.lessonTemplateAssignmentQuestionsId === lesson.id || questions.length > 0)
    if (qs.length === 0) { alert('No questions to preview.'); return }

    // Only show show_work questions (and section headers that group them) — matching student print exactly
    const sorted = [...qs].sort((a, b) => a.order - b.order)
    // Determine which section headers have at least one show_work under them
    const showWorkOnly: typeof sorted = []
    let pendingHeader: (typeof sorted[0]) | null = null
    for (const q of sorted) {
      if (q.questionType === 'section_header') {
        pendingHeader = q
      } else if (q.questionType === 'show_work') {
        if (pendingHeader) { showWorkOnly.push(pendingHeader); pendingHeader = null }
        showWorkOnly.push(q)
      }
      // Skip all other types
    }

    if (showWorkOnly.length === 0) {
      alert('No show-work questions to preview. Add questions with type "Show Work" to see the worksheet preview.')
      return
    }

    const { default: katex } = await import('katex')

    function renderMath(text: string): string {
      return text
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => { try { return katex.renderToString(m, { displayMode: true, throwOnError: false }) } catch { return m } })
        .replace(/\\\((.+?)\\\)/g, (_, m) => { try { return katex.renderToString(m, { throwOnError: false }) } catch { return m } })
    }

    // Preserve original question numbers from the full sorted list
    let fullQNum = 0
    const origNums = new Map<string, number>()
    for (const q of sorted) {
      if (q.questionType !== 'section_header') { fullQNum++; origNums.set(q.id, fullQNum) }
    }

    const questionsHTML = showWorkOnly.map(q => {
      if (q.questionType === 'section_header') {
        return `<div class="section-header">${q.questionText || 'Section Header'}</div>`
      }
      const qHtml = renderMath(q.questionText)
      const answerBox = `<div class="work-box"></div>`
      const bookNumMatch = q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)
      const qNumLabel = bookNumMatch ? bookNumMatch[1] : `${origNums.get(q.id) ?? ''}.`
      const qBody = bookNumMatch ? renderMath(bookNumMatch[2]) : qHtml
      return `<div class="question"><span class="qnum">${qNumLabel}</span><span class="qtext">${qBody}</span>${answerBox}</div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <title>Show Work — ${lesson.title}</title>
    <style>
      body{font-family:'Times New Roman',serif;font-size:14px;padding:40px;max-width:720px;margin:0 auto;color:#111}
      h1{font-size:20px;margin-bottom:4px}.header{border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px}
      .note{font-size:11px;color:#555;margin-bottom:24px;padding:8px 12px;border-left:3px solid #7B4FA6}
      .question{display:flex;align-items:flex-start;gap:8px;margin-bottom:0;page-break-inside:avoid}
      .qnum{font-weight:700;min-width:22px;flex-shrink:0}.qtext{flex:1}
      .work-box{border:1px solid #ccc;border-radius:4px;min-height:80px;margin:8px 0 18px;}
      .section-header{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#5b2d8e;border-bottom:2px solid #d8b4fe;padding-bottom:5px;margin:28px 0 16px;page-break-after:avoid}
      @media print{body{padding:20px}@page{margin:.75in}}
    </style>
  </head><body onload="setTimeout(function(){window.print()},1200)">
    <div class="header"><h1>Show Work — ${lesson.title}</h1><div style="font-size:12px;color:#666">Lesson ${lesson.lessonNumber} · Teacher Preview</div></div>
    <div class="note">Complete your digital answers online first, then print this sheet and show your work in the boxes below.</div>
    ${questionsHTML}
  </body></html>`

    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(html)
    pw.document.close()
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
      <TeacherNav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>
              {course?.title} — Lesson Library
            </h1>
            <p style={{ color: 'var(--gray-mid)' }}>
              {lessons.length} lessons total
              {missingCount > 0 && <span style={{ marginLeft: '12px', color: '#e05252', fontWeight: 500 }}>⚠ {missingCount} missing video</span>}
            </p>
          </div>
          <button
            onClick={() => { setShowNewLessonForm(v => !v); setCreateError('') }}
            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 22px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
          >
            + New Lesson
          </button>
        </div>

        {/* New lesson creation form */}
        {showNewLessonForm && (
          <div style={{ marginBottom: '24px', background: 'var(--white)', border: '2px solid var(--plum)', borderRadius: '10px', padding: '20px 24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--plum)', marginBottom: '16px' }}>New Lesson</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lesson #</label>
                <input
                  type="text"
                  value={newLessonForm.lessonNumber}
                  onChange={e => setNewLessonForm(f => ({ ...f, lessonNumber: e.target.value }))}
                  placeholder="e.g. 156"
                  autoFocus
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</label>
                <input
                  type="text"
                  value={newLessonForm.title}
                  onChange={e => setNewLessonForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Direct Variation"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateLesson() }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            {createError && <p style={{ color: '#e05252', fontSize: '13px', marginBottom: '10px' }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateLesson}
                disabled={creatingLesson}
                style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-body)' }}
              >
                {creatingLesson ? 'Creating…' : 'Create & Edit'}
              </button>
              <button
                onClick={() => { setShowNewLessonForm(false); setNewLessonForm({ lessonNumber: '', title: '' }); setCreateError('') }}
                style={{ background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', borderRadius: '6px', padding: '9px 18px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                    <div style={{ background: 'var(--background)', borderTop: '1px solid var(--gray-light)' }}>

                      {/* Tab bar */}
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-light)', background: 'var(--white)', paddingLeft: '20px' }}>
                        {(['details', 'questions'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                              padding: '14px 20px',
                              fontSize: '14px',
                              fontWeight: activeTab === tab ? 600 : 400,
                              color: activeTab === tab ? 'var(--plum)' : 'var(--gray-mid)',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: activeTab === tab ? '2px solid var(--plum)' : '2px solid transparent',
                              marginBottom: '-1px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {tab === 'details' ? 'Details' : `Questions${questions.length > 0 ? ` (${questions.length})` : ''}`}
                          </button>
                        ))}
                      </div>

                      <div style={{ padding: '24px' }}>

                        {/* DETAILS TAB */}
                        {activeTab === 'details' && (
                          <>
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

                            <div style={{ marginBottom: '16px' }}>
                              <label style={labelStyle}>Teaching Notes <span style={{ fontWeight: 400, color: 'var(--gray-mid)', textTransform: 'none', letterSpacing: 0 }}>(for AI grading)</span></label>
                              <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '0 0 6px', lineHeight: 1.5 }}>
                                Paste the relevant Abeka method explanation here. The AI will reference this when grading — so it evaluates student work against the curriculum method, not a different approach.
                              </p>
                              <textarea
                                value={editForm.teachingNotes}
                                onChange={e => setEditForm(f => ({ ...f, teachingNotes: e.target.value }))}
                                placeholder={`e.g. Abeka teaches long division using the "divide-multiply-subtract-bring down" method. Students write the remainder as a fraction attached to the quotient (e.g. 4 R2 → 4 2/3). Answers should show all steps written vertically. Skipping a step is marked wrong even if the final answer is correct.`}
                                rows={6}
                                style={{ ...inputStyle, resize: 'vertical' }}
                              />
                            </div>

                            {/* Grade Category */}
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
                                      padding: '8px 20px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                                      fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)',
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

                            {/* Assignment Type */}
                            <div style={{ marginBottom: '16px' }}>
                              <label style={labelStyle}>Assignment Type</label>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {assignmentTypes.map(at => (
                                  <button
                                    key={at.value}
                                    onClick={() => setEditForm(f => ({ ...f, assignmentType: at.value }))}
                                    style={{
                                      padding: '8px 16px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                                      fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)',
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

                            {/* Attach an existing unattached video */}
                            <div style={{ marginBottom: '16px' }}>
                              <button
                                onClick={async () => {
                                  if (showOrphanPicker) { setShowOrphanPicker(false); return }
                                  setShowOrphanPicker(true)
                                  if (orphanVideos !== null) return // already loaded
                                  setLoadingOrphans(true)
                                  try {
                                    const res = await fetch(`/api/orphan-videos?courseTitle=${encodeURIComponent(course?.title || '')}`)
                                    const data = await res.json()
                                    setOrphanVideos(data.orphans || [])
                                  } catch { setOrphanVideos([]) }
                                  finally { setLoadingOrphans(false) }
                                }}
                                style={{ background: 'none', border: '1px dashed var(--gray-light)', color: 'var(--gray-mid)', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                              >
                                {showOrphanPicker ? '▲ Hide' : '📎 Attach existing video…'}
                              </button>

                              {showOrphanPicker && (
                                <div style={{ marginTop: '10px', padding: '14px', background: 'var(--page-bg)', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
                                    Videos already uploaded to S3 but not attached to any lesson:
                                  </div>
                                  {loadingOrphans ? (
                                    <p style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>Loading…</p>
                                  ) : !orphanVideos || orphanVideos.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: 'var(--gray-mid)', fontStyle: 'italic' }}>No unattached videos found for this course.</p>
                                  ) : (
                                    <select
                                      defaultValue=""
                                      onChange={e => {
                                        if (!e.target.value) return
                                        setEditForm(f => ({ ...f, videoUrl: e.target.value }))
                                        setIsDirty(true)
                                        setShowOrphanPicker(false)
                                        // Remove from orphan list immediately so it doesn't show again
                                        setOrphanVideos(prev => prev?.filter(v => v.key !== e.target.value) ?? null)
                                      }}
                                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)', background: 'var(--white)', color: 'var(--foreground)' }}
                                    >
                                      <option value="">— pick a video —</option>
                                      {orphanVideos.map(v => (
                                        <option key={v.key} value={v.key}>{v.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )}
                            </div>

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

                            {/* Save */}
                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <button onClick={() => saveEdit(lesson.id)} disabled={saving} style={{ background: 'var(--plum)', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                                {saving ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button onClick={cancelEdit} style={{ background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                Cancel
                              </button>
                              {isDirty && (
                                <span style={{ fontSize: '12px', color: '#e07b00', fontWeight: 500 }}>● Unsaved changes</span>
                              )}
                            </div>
                          </>
                        )}

                        {/* QUESTIONS TAB */}
                        {activeTab === 'questions' && (
                          <>
                            {!showQuestionBuilder ? (
                              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: 'var(--gray-mid)', marginBottom: '16px', lineHeight: '1.7' }}>
                                  Assignment type is set to <strong>{editForm.assignmentType === 'none' ? 'No Assignment' : 'Upload Only'}</strong>.<br />
                                  Switch to "Digital Questions" or "Questions + Upload" on the Details tab to enable the question builder.
                                </div>
                                <button
                                  onClick={() => setActiveTab('details')}
                                  style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)' }}
                                >
                                  Go to Details tab
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Toolbar */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                                  <button
                                    onClick={() => {
                                      setTimeout(() => {
                                        document.getElementById(`question-builder-${lesson.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                      }, 100)
                                    }}
                                    style={{
                                      background: 'var(--white)', border: '1px solid var(--plum)', color: 'var(--plum)',
                                      borderRadius: '6px', padding: '7px 16px', cursor: 'pointer',
                                      fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)',
                                    }}
                                  >
                                    + Add Question
                                  </button>
                                  <button
                                    onClick={() => handleAddSectionHeader(lesson.id)}
                                    disabled={addingQuestion}
                                    style={{
                                      background: 'var(--white)', border: '1px dashed var(--plum)', color: 'var(--plum)',
                                      borderRadius: '6px', padding: '7px 16px', cursor: 'pointer',
                                      fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)',
                                    }}
                                  >
                                    § Section Header
                                  </button>
                                  <button
                                    onClick={() => previewWorksheet(lesson)}
                                    disabled={questions.length === 0}
                                    style={{ background: 'transparent', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '7px 14px', borderRadius: '6px', cursor: questions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}
                                  >
                                    🖨 Preview
                                  </button>
                                </div>

                                {/* Existing questions list */}
                                {loadingQuestions ? (
                                  <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>Loading questions...</p>
                                ) : questions.length === 0 ? (
                                  <div style={{ padding: '14px 16px', background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '16px' }}>
                                    No questions yet. Add your first question below.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    {(() => {
                                      let qNum = 0
                                      return questions.map((q, i) => {
                                        const isHeader = q.questionType === 'section_header'
                                        if (!isHeader) qNum++
                                        const displayNum = qNum
                                        return (
                                          <div
                                            key={q.id}
                                            onDragOver={e => { e.preventDefault(); setDragOverIndex(i) }}
                                            onDrop={() => { if (dragIndex !== null && dragIndex !== i) reorderQuestions(dragIndex, i); setDragIndex(null); setDragOverIndex(null) }}
                                            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                                            style={{
                                              background: isHeader ? 'var(--background)' : 'var(--white)',
                                              border: `1px solid ${editingQuestionId === q.id ? 'var(--plum)' : isHeader ? 'var(--plum-mid)' : 'var(--gray-light)'}`,
                                              borderTop: dragOverIndex === i ? '3px solid var(--plum)' : undefined,
                                              borderRadius: '8px',
                                              padding: '14px 16px',
                                              cursor: 'default',
                                            }}
                                          >
                                            {editingQuestionId === q.id ? (
                                              isHeader ? (
                                                <div>
                                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px' }}>Editing Section Header</div>
                                                  <MathToolbar
                                                    textareaRef={editQuestionTextareaRef}
                                                    value={editingQuestionForm.questionText}
                                                    onChange={val => setEditingQuestionForm(f => ({ ...f, questionText: val }))}
                                                  />
                                                  <textarea
                                                    ref={editQuestionTextareaRef}
                                                    autoFocus
                                                    value={editingQuestionForm.questionText}
                                                    onChange={e => setEditingQuestionForm(f => ({ ...f, questionText: e.target.value }))}
                                                    rows={2}
                                                    placeholder="Enter header text..."
                                                    style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }}
                                                  />
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
                                                <div>
                                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px' }}>Editing Question {displayNum}</div>
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
                                                    <option value="multiple_choice">Multiple Choice (pick one)</option>
                                                    <option value="multiple_choice_multi">Multiple Choice (pick all that apply)</option>
                                                    <option value="show_work">Show Work (photo upload)</option>
                                                  </select>
                                                  {(editingQuestionForm.questionType === 'multiple_choice' || editingQuestionForm.questionType === 'multiple_choice_multi') && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                      <label style={labelStyle}>Choices — one per line</label>
                                                      <textarea
                                                        value={editingQuestionForm.choices}
                                                        onChange={e => setEditingQuestionForm(f => ({ ...f, choices: e.target.value }))}
                                                        rows={4}
                                                        placeholder={"12\n24\n36\n48"}
                                                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                                                      />
                                                      <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '4px 0 0' }}>One choice per line. Letters (A, B, C…) are added automatically when displayed to students.</p>
                                                    </div>
                                                  )}
                                                  {editingQuestionForm.questionType === 'multiple_choice_multi' && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                      <label style={labelStyle}>Correct answer(s) (optional — for auto-grading)</label>
                                                      <textarea
                                                        value={editingQuestionForm.correctAnswer}
                                                        onChange={e => setEditingQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))}
                                                        rows={2}
                                                        placeholder={(() => {
                                                          const lines = editingQuestionForm.choices.split('\n').filter(Boolean)
                                                          if (lines.length >= 2) return `e.g. ${lines[0]} | ${lines[lines.length - 1]}`
                                                          if (lines.length === 1) return `e.g. ${lines[0]}`
                                                          return 'e.g. Red | Green'
                                                        })()}
                                                        style={{ ...inputStyle, resize: 'vertical' }}
                                                      />
                                                      <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '4px 0 0' }}>
                                                        Type each correct choice separated by <code style={{ background: 'var(--gray-light)', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>|</code> — copy the text exactly as written in your choices above.
                                                      </p>
                                                    </div>
                                                  )}
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
                                              )
                                            ) : isHeader ? (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div draggable={true} onDragStart={() => setDragIndex(i)} style={{ color: 'var(--gray-mid)', fontSize: '16px', cursor: 'grab', userSelect: 'none' }}>⠿</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', background: 'var(--plum)', color: 'white', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.5px', flexShrink: 0 }}>HEADER</span>
                                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}>{q.questionText}</span>
                                                  </div>
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
                                            ) : (
                                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ color: 'var(--gray-mid)', fontSize: '16px', cursor: 'grab', paddingTop: '2px', userSelect: 'none' }}>⠿</div>
                                                <div style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '14px', minWidth: '24px', paddingTop: '1px' }}>{displayNum}.</div>
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
                                        )
                                      })
                                    })()}
                                  </div>
                                )}

                                {/* Add Question form */}
                                <div id={`question-builder-${lesson.id}`} style={{ background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '16px', marginBottom: '0' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Question</div>
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
                                  <div style={{ marginBottom: '12px' }}>
                                    <label style={labelStyle}>Answer Type</label>
                                    <select
                                      value={newQuestion.questionType}
                                      onChange={e => setNewQuestion(q => ({ ...q, questionType: e.target.value, choices: '', correctAnswer: '' }))}
                                      style={{ ...inputStyle }}
                                    >
                                      <option value="number">Number answer</option>
                                      <option value="short_text">Short text answer</option>
                                      <option value="multiple_choice">Multiple choice (pick one)</option>
                                      <option value="multiple_choice_multi">Multiple choice (pick all that apply)</option>
                                      <option value="show_work">Show work (photo)</option>
                                    </select>
                                  </div>
                                  {(newQuestion.questionType === 'multiple_choice' || newQuestion.questionType === 'multiple_choice_multi') && (
                                    <div style={{ marginBottom: '12px' }}>
                                      <label style={labelStyle}>Choices — one per line</label>
                                      <textarea
                                        value={newQuestion.choices}
                                        onChange={e => setNewQuestion(q => ({ ...q, choices: e.target.value }))}
                                        placeholder={"12\n24\n36\n48"}
                                        rows={4}
                                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                                      />
                                      <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '4px 0 0' }}>One choice per line. Letters (A, B, C…) are added automatically when displayed to students.</p>
                                    </div>
                                  )}
                                  {newQuestion.questionType === 'multiple_choice_multi' && (
                                    <div style={{ marginBottom: '12px' }}>
                                      <label style={labelStyle}>Correct answer(s) (optional — for auto-grading)</label>
                                      <textarea
                                        value={newQuestion.correctAnswer}
                                        onChange={e => setNewQuestion(q => ({ ...q, correctAnswer: e.target.value }))}
                                        rows={2}
                                        placeholder={(() => {
                                          const lines = newQuestion.choices.split('\n').filter(Boolean)
                                          if (lines.length >= 2) return `e.g. ${lines[0]} | ${lines[lines.length - 1]}`
                                          if (lines.length === 1) return `e.g. ${lines[0]}`
                                          return 'e.g. Red | Green'
                                        })()}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                      />
                                      <p style={{ fontSize: '11px', color: 'var(--gray-mid)', margin: '4px 0 0' }}>
                                        Type each correct choice separated by <code style={{ background: 'var(--gray-light)', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>|</code> — copy the text exactly as written in your choices above.
                                      </p>
                                    </div>
                                  )}
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

                                {/* Save / Cancel row — bottom of Questions tab */}
                                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <button onClick={() => saveEdit(lesson.id)} disabled={saving} style={{ background: 'var(--plum)', color: 'white', padding: '10px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                  </button>
                                  <button onClick={cancelEdit} style={{ background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                                    Cancel
                                  </button>
                                  {isDirty && (
                                    <span style={{ fontSize: '12px', color: '#e07b00', fontWeight: 500 }}>● Unsaved changes</span>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}

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
