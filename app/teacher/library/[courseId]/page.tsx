'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import { getCourse, listAssignmentQuestions } from '../../../../src/graphql/queries'
import { createAssignmentQuestion, deleteAssignmentQuestion, updateAssignmentQuestion } from '../../../../src/graphql/mutations'
import { apiFetch } from '@/app/lib/apiFetch'

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
  diagramKey: string | null
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
  const [addMode, setAddMode] = useState<'question' | 'header'>('question')
  const [newHeaderText, setNewHeaderText] = useState('')
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingQuestionForm, setEditingQuestionForm] = useState({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [diagramUrls, setDiagramUrls] = useState<Record<string, string>>({})
  const [pendingDiagramFile, setPendingDiagramFile] = useState<File | null>(null)
  const [pendingDiagramPreview, setPendingDiagramPreview] = useState<string | null>(null)
  const [editingDiagramFile, setEditingDiagramFile] = useState<File | null>(null)
  const [editingDiagramPreview, setEditingDiagramPreview] = useState<string | null>(null)
  const [editingDiagramRemoved, setEditingDiagramRemoved] = useState(false)
  const diagramInputRef = useRef<HTMLInputElement>(null)
  const editDiagramInputRef = useRef<HTMLInputElement>(null)
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
      // Fetch presigned URLs for any questions with diagramKey
      const withDiagrams = allItems.filter(q => q.diagramKey)
      if (withDiagrams.length > 0) {
        const urls: Record<string, string> = {}
        await Promise.all(withDiagrams.map(async (q) => {
          try {
            const res = await apiFetch('/api/view-submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: q.diagramKey })
            })
            if (res.ok) {
              const data = await res.json()
              urls[q.id] = data.url
            }
          } catch { /* skip */ }
        }))
        setDiagramUrls(urls)
      }
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
    setDiagramUrls({})
    setPendingDiagramFile(null)
    setPendingDiagramPreview(null)
    setEditingDiagramFile(null)
    setEditingDiagramPreview(null)
    setEditingDiagramRemoved(false)
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
    const res = await apiFetch('/api/upload', {
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
    // Auto-add the in-progress question/header if the form has content
    if (addMode === 'header' && newHeaderText.trim()) {
      await handleAddSectionHeader(id)
    } else if (addMode === 'question' && (newQuestion.questionText.trim() || pendingDiagramFile)) {
      await handleAddQuestion(id)
    }
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
    if (!newQuestion.questionText.trim() && !pendingDiagramFile) return
    setAddingQuestion(true)
    try {
      // Upload diagram image first if one is pending
      let diagramKey: string | null = null
      if (pendingDiagramFile) {
        const formData = new FormData()
        formData.append('file', pendingDiagramFile)
        formData.append('lessonId', lessonId)
        formData.append('index', `diagram-${Date.now()}`)
        const uploadRes = await apiFetch('/api/scan-upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          diagramKey = uploadData.key
        }
      }

      const result: any = await client.graphql({
        query: createAssignmentQuestion,
        variables: {
          input: {
            questionText: newQuestion.questionText.trim() || '(see image)',
            questionType: newQuestion.questionType,
            choices: (newQuestion.questionType === 'multiple_choice' || newQuestion.questionType === 'multiple_choice_multi') && newQuestion.choices.trim() ? newQuestion.choices.trim() : null,
            correctAnswer: (newQuestion.questionType === 'number' || newQuestion.questionType === 'multiple_choice' || newQuestion.questionType === 'multiple_choice_multi') && newQuestion.correctAnswer.trim() ? newQuestion.correctAnswer.trim() : null,
            order: questions.length + 1,
            lessonTemplateQuestionsId: lessonId,
            diagramKey,
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
        diagramKey: created.diagramKey ?? null,
        lessonTemplateAssignmentQuestionsId: lessonId
      }
      setQuestions(prev => [...prev, newQ])
      // If we uploaded a diagram, fetch its presigned URL
      if (diagramKey) {
        try {
          const res = await apiFetch('/api/view-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: diagramKey })
          })
          if (res.ok) {
            const data = await res.json()
            setDiagramUrls(prev => ({ ...prev, [created.id]: data.url }))
          }
        } catch { /* skip */ }
      }
      setIsDirty(true)
      setNewQuestion({ questionText: '', questionType: 'number', choices: '', correctAnswer: '' })
      setPendingDiagramFile(null)
      setPendingDiagramPreview(null)
    } catch (err) {
      console.error('Error adding question:', err)
    } finally {
      setAddingQuestion(false)
    }
  }

  async function handleAddSectionHeader(lessonId: string) {
    if (!newHeaderText.trim()) return
    setAddingQuestion(true)
    try {
      const result: any = await client.graphql({
        query: createAssignmentQuestion,
        variables: {
          input: {
            questionText: newHeaderText.trim(),
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
        diagramKey: null,
        lessonTemplateAssignmentQuestionsId: lessonId
      }
      setQuestions(prev => [...prev, newQ])
      setIsDirty(true)
      setNewHeaderText('')
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
    setEditingDiagramFile(null)
    setEditingDiagramPreview(null)
    setEditingDiagramRemoved(false)
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
    const existingQ = questions.find(q => q.id === questionId)
    const hasDiagram = editingDiagramFile || (existingQ?.diagramKey && !editingDiagramRemoved)
    if (!editingQuestionForm.questionText.trim() && !hasDiagram) return
    setSavingQuestion(true)
    try {
      // Upload new diagram if one was selected
      let newDiagramKey: string | null | undefined = undefined
      if (editingDiagramFile && editingId) {
        const formData = new FormData()
        formData.append('file', editingDiagramFile)
        formData.append('lessonId', editingId)
        formData.append('index', `diagram-${Date.now()}`)
        const uploadRes = await apiFetch('/api/scan-upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          newDiagramKey = uploadData.key
        }
      } else if (editingDiagramRemoved) {
        newDiagramKey = null
      }

      const input: any = {
        id: questionId,
        questionText: editingQuestionForm.questionText.trim() || '(see image)',
        questionType: editingQuestionForm.questionType,
        choices: (editingQuestionForm.questionType === 'multiple_choice' || editingQuestionForm.questionType === 'multiple_choice_multi') && editingQuestionForm.choices.trim() ? editingQuestionForm.choices.trim() : null,
        correctAnswer: (editingQuestionForm.questionType === 'number' || editingQuestionForm.questionType === 'multiple_choice' || editingQuestionForm.questionType === 'multiple_choice_multi') && editingQuestionForm.correctAnswer.trim() ? editingQuestionForm.correctAnswer.trim() : null,
      }
      if (newDiagramKey !== undefined) {
        input.diagramKey = newDiagramKey
      }

      const result: any = await client.graphql({
        query: updateAssignmentQuestion,
        variables: { input }
      })
      const updated = result.data.updateAssignmentQuestion
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updated } : q))

      // Update diagram URL cache
      if (newDiagramKey) {
        try {
          const res = await apiFetch('/api/view-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: newDiagramKey })
          })
          if (res.ok) {
            const data = await res.json()
            setDiagramUrls(prev => ({ ...prev, [questionId]: data.url }))
          }
        } catch { /* skip */ }
      } else if (newDiagramKey === null) {
        setDiagramUrls(prev => {
          const next = { ...prev }
          delete next[questionId]
          return next
        })
      }

      setIsDirty(true)
      setEditingQuestionId(null)
      setEditingDiagramFile(null)
      setEditingDiagramPreview(null)
      setEditingDiagramRemoved(false)
    } catch (err) {
      console.error('Error updating question:', err)
    } finally {
      setSavingQuestion(false)
    }
  }

  async function previewWorksheet(lesson: LessonTemplate) {
    const allQuestions = [...questions].sort((a, b) => a.order - b.order)
    if (allQuestions.length === 0) { alert('No questions to preview.'); return }

    const aType = editForm.assignmentType || lesson.assignmentType || 'upload'
    const isWorksheetType = aType === 'worksheet' || aType === 'upload'

    // For worksheet/upload type, show ALL questions (paper-only assignment)
    // For digital or both, only show show_work questions
    const filteredQuestions = isWorksheetType
      ? allQuestions.filter(q => q.questionType !== 'section_header' || true) // keep headers + all question types
      : (() => {
          const result: typeof allQuestions = []
          let pendingHeader: (typeof allQuestions[0]) | null = null
          for (const q of allQuestions) {
            if (q.questionType === 'section_header') { pendingHeader = q }
            else if (q.questionType === 'show_work') {
              if (pendingHeader) { result.push(pendingHeader); pendingHeader = null }
              result.push(q)
            }
          }
          return result
        })()

    const displayQuestions = filteredQuestions.filter(q => q.questionType !== 'section_header' || true)
    if (displayQuestions.length === 0) {
      alert('No questions to preview.')
      return
    }

    // Pre-fetch diagram images as base64 data URLs for embedding in print
    const diagramDataUrls: Record<string, string> = {}
    for (const q of displayQuestions) {
      const url = diagramUrls[q.id]
      if (!url) continue
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        diagramDataUrls[q.id] = dataUrl
      } catch { /* skip if fetch fails */ }
    }

    const { default: katex } = await import('katex')

    function renderMath(text: string): string {
      const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g)
      return parts.map(part => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false })
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: false, throwOnError: false })
        }
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }).join('')
    }

    // Preserve original question numbers
    let fullQNum = 0
    const origNums = new Map<string, number>()
    for (const q of allQuestions) {
      if (q.questionType !== 'section_header') { fullQNum++; origNums.set(q.id, fullQNum) }
    }

    // Sort by problem number extracted from text (safety net)
    displayQuestions.sort((a, b) => {
      const numA = parseInt(a.questionText.match(/^(\d+)\./)?.[1] || '0')
      const numB = parseInt(b.questionText.match(/^(\d+)\./)?.[1] || '0')
      if (numA && numB) return numA - numB
      return a.order - b.order
    })

    const questionsHTML = displayQuestions.map(q => {
      if (q.questionType === 'section_header') {
        return `<div class="section-header">${renderMath(q.questionText || 'Section Header')}</div>`
      }
      const bookNumMatch = q.questionText.match(/^(\d+\.)\s/)
      const qNumLabel = bookNumMatch ? bookNumMatch[1] : `${origNums.get(q.id) ?? ''}.`
      const qBody = renderMath(q.questionText.replace(/^\d+\.\s*/, ''))
      const diagramSrc = diagramDataUrls[q.id]
      const diagramHTML = diagramSrc
        ? `<div class="diagram"><img src="${diagramSrc}" class="diagram-img" /></div>`
        : ''
      return `<div class="work-item">
        <div class="work-label"><span class="qnum">${qNumLabel}</span> ${qBody}</div>
        ${diagramHTML}
        <div class="work-box"></div>
      </div>`
    }).join('')

    const hasDiagrams = Object.keys(diagramDataUrls).length > 0
    const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Show Work — ${lesson.title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        *{box-sizing:border-box}
        body{font-family:'Times New Roman',serif;max-width:720px;margin:0 auto;padding:40px;color:#111;font-size:15px}
        .header{text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #333}
        .header h1{font-size:22px;margin:0 0 2px}
        .header .lessonnum{font-size:13px;color:#777;margin-bottom:2px}
        .header .course{font-size:13px;color:#555;margin-bottom:6px}
        .header .instruction{font-size:12px;color:#666;font-style:italic;margin-bottom:10px}
        .header .fields{display:flex;justify-content:space-between;margin-top:10px;gap:24px}
        .header .field{flex:1;font-size:13px;color:#333;padding-bottom:3px;border-bottom:1px solid #888}
        .diagram{margin:8px 0 12px;max-width:320px}
        .diagram-img{width:100%;border:1px solid #ccc;border-radius:4px;display:block}
        .work-item{margin-bottom:18px;page-break-inside:avoid}
        .work-label{display:flex;gap:8px;align-items:baseline;margin-bottom:6px;line-height:1.4}
        .qnum{font-weight:bold;font-size:15px;min-width:22px;flex-shrink:0}
        .work-box{border:1px solid #bbb;border-radius:4px;height:120px}
        .section-header{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#5b2d8e;border-bottom:2px solid #d8b4fe;padding-bottom:5px;margin:28px 0 16px;page-break-after:avoid}
        @media print{body{padding:20px}@page{margin:.6in}}
      </style>
    </head><body onload="setTimeout(function(){window.print()},1200)">
      <div class="header">
        <div class="lessonnum">Lesson ${lesson.lessonNumber}</div>
        <h1>${lesson.title} — Show Work</h1>
        ${course?.title ? `<div class="course">${course.title}</div>` : ''}
        <div class="instruction">${hasDiagrams
          ? 'Refer to the diagrams shown with each problem. Show your work in the boxes provided.'
          : 'Complete your digital answers online first, then show your work in the boxes below.'}</div>
        <div class="fields">
          <div class="field">Name: ___________________________</div>
          <div class="field">Date: ${printDate}</div>
        </div>
      </div>
      ${questionsHTML}
    </body></html>`

    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(html)
    pw.document.close()
  }

  async function previewDigital(lesson: LessonTemplate) {
    const allQuestions = [...questions].sort((a, b) => a.order - b.order)
    if (allQuestions.length === 0) { alert('No questions to preview.'); return }

    // Use presigned URLs directly for digital preview (not print, so no need for base64)
    // Also try to convert to base64 as fallback for any CORS issues
    const diagramSrcUrls: Record<string, string> = {}
    for (const q of allQuestions) {
      const url = diagramUrls[q.id]
      if (!url) continue
      // Try base64 conversion first, fall back to direct URL
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        diagramSrcUrls[q.id] = dataUrl
      } catch {
        // Fall back to direct presigned URL
        diagramSrcUrls[q.id] = url
      }
    }

    const { default: katex } = await import('katex')

    function renderMath(text: string): string {
      const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g)
      return parts.map(part => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false })
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return katex.renderToString(part.slice(2, -2), { displayMode: false, throwOnError: false })
        }
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }).join('')
    }

    let qNum = 0
    const questionsHTML = allQuestions.map(q => {
      const isHeader = q.questionType === 'section_header'
      if (!isHeader) qNum++
      const bookNumMatch = !isHeader && q.questionText.match(/^(\d+\.)\s([\s\S]*)$/)

      if (isHeader) {
        return `<div class="section-header">${renderMath(q.questionText)}</div>`
      }

      const numLabel = bookNumMatch ? bookNumMatch[1] : `${qNum}.`
      const rawText = bookNumMatch ? bookNumMatch[2] : q.questionText
      const isImageOnly = rawText === '(see image)' && diagramSrcUrls[q.id]
      const body = isImageOnly ? '' : renderMath(rawText)
      const diagramSrc = diagramSrcUrls[q.id]
      const diagramHTML = diagramSrc
        ? `<div class="diagram"><img src="${diagramSrc}" /></div>`
        : ''

      let answerHTML = ''
      if (q.questionType === 'number' || q.questionType === 'short_text') {
        answerHTML = `<div class="answer-input">${q.questionType === 'short_text' ? '<textarea rows="2" disabled placeholder="Student types answer here..."></textarea>' : '<input type="text" disabled placeholder="Student types answer here..." />'}</div>`
      } else if ((q.questionType === 'multiple_choice' || q.questionType === 'multiple_choice_multi') && q.choices) {
        const inputType = q.questionType === 'multiple_choice' ? 'radio' : 'checkbox'
        const note = q.questionType === 'multiple_choice_multi' ? '<div class="mc-note">Select all that apply</div>' : ''
        const choicesHTML = q.choices.split('\n').filter(Boolean).map((c, i) => {
          const letter = String.fromCharCode(65 + i)
          return `<label class="choice"><input type="${inputType}" disabled /> <span class="choice-letter">${letter}.</span> ${renderMath(c)}</label>`
        }).join('')
        answerHTML = `${note}<div class="choices">${choicesHTML}</div>`
      } else if (q.questionType === 'show_work') {
        answerHTML = '<div class="show-work-note">Student uploads a photo of their work</div>'
      }

      return `<div class="question">
        ${body ? `<div class="q-row"><span class="q-num">${numLabel}</span><div class="q-body">${body}</div></div>` : `<div class="q-row"><span class="q-num">${numLabel}</span></div>`}
        ${diagramHTML}
        ${answerHTML}
      </div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Digital Preview — ${lesson.title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:40px 24px;background:#fafafa;color:#1a1a2e}
        .header{margin-bottom:32px}
        .header .lesson-num{font-size:12px;color:#888;font-weight:500;margin-bottom:2px}
        .header h1{font-size:22px;font-weight:700;font-family:'DM Serif Display',serif;margin-bottom:4px}
        .header .course{font-size:13px;color:#666}
        .header .instructions{font-size:13px;color:#555;margin-top:12px;padding:10px 14px;background:#fff;border:1px solid #e5e5e5;border-radius:8px;line-height:1.6}
        .section-header{font-size:13px;font-weight:700;color:#7B4FA6;text-transform:uppercase;letter-spacing:0.8px;border-bottom:2px solid #d8b4fe;padding-bottom:6px;padding-top:4px;margin-top:28px;margin-bottom:16px}
        .question{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #e5e5e5}
        .q-row{display:flex;gap:12px;margin-bottom:12px}
        .q-num{font-weight:700;color:#7B4FA6;font-size:16px;min-width:28px;flex-shrink:0}
        .q-body{font-size:15px;line-height:1.6;flex:1}
        .diagram{margin-bottom:14px;max-width:360px}
        .diagram img{width:100%;border-radius:8px;border:1px solid #e5e5e5;display:block}
        .answer-input input,.answer-input textarea{width:100%;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:15px;font-family:'DM Sans',sans-serif;background:#fff;color:#999}
        .answer-input textarea{resize:vertical}
        .choices{display:flex;flex-direction:column;gap:8px}
        .choice{display:flex;align-items:center;gap:10px;cursor:default;font-size:14px}
        .choice input{margin:0}
        .choice-letter{font-weight:600;color:#7B4FA6;min-width:18px}
        .mc-note{font-size:11px;color:#888;margin-bottom:6px}
        .show-work-note{font-size:13px;color:#888;font-style:italic;padding:12px;background:#fff;border:1px dashed #d5d5d5;border-radius:6px;text-align:center}
        .preview-badge{position:fixed;top:12px;right:12px;background:#7B4FA6;color:#fff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;z-index:100}
      </style>
    </head><body>
      <div class="preview-badge">TEACHER PREVIEW</div>
      <div class="header">
        <div class="lesson-num">Lesson ${lesson.lessonNumber}</div>
        <h1>${lesson.title}</h1>
        ${course?.title ? `<div class="course">${course.title}</div>` : ''}
        ${editForm.instructions ? `<div class="instructions">${renderMath(editForm.instructions)}</div>` : ''}
      </div>
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
    { value: 'worksheet', label: 'Print Worksheet' },
  ]

  const showQuestionBuilder = editForm.assignmentType === 'questions' || editForm.assignmentType === 'both' || editForm.assignmentType === 'worksheet'

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
                            {tab === 'details' ? 'Details' : `Questions${questions.filter(q => q.questionType !== 'section_header' && q.questionType !== 'instructions').length > 0 ? ` (${questions.filter(q => q.questionType !== 'section_header' && q.questionType !== 'instructions').length})` : ''}`}
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
                                  {editForm.worksheetUrl.startsWith('[')
                                    ? <span style={{ fontSize: '11px', color: 'var(--gray-mid)', fontFamily: 'monospace' }}>Scan pages imported ({(() => { try { return JSON.parse(editForm.worksheetUrl).length } catch { return '?' } })()} pages)</span>
                                    : <a href={editForm.worksheetUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--plum)', fontFamily: 'monospace' }}>View PDF ↗</a>}
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
                                  Switch to "Digital Questions", "Questions + Upload", or "Print Worksheet" on the Details tab to enable the question builder.
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
                                    + Add New ↓
                                  </button>
                                  {(editForm.assignmentType === 'questions' || editForm.assignmentType === 'both') && (
                                    <button
                                      onClick={() => previewDigital(lesson)}
                                      disabled={questions.length === 0}
                                      style={{ background: 'transparent', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '7px 14px', borderRadius: '6px', cursor: questions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}
                                    >
                                      👁 Student View
                                    </button>
                                  )}
                                  {(editForm.assignmentType === 'worksheet' || editForm.assignmentType === 'upload' || editForm.assignmentType === 'both') && (
                                    <button
                                      onClick={() => previewWorksheet(lesson)}
                                      disabled={questions.length === 0}
                                      style={{ background: 'transparent', border: '1px solid var(--gray-light)', color: 'var(--gray-mid)', padding: '7px 14px', borderRadius: '6px', cursor: questions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', ...(editForm.assignmentType === 'both' ? {} : { marginLeft: 'auto' }) }}
                                    >
                                      🖨 Worksheet
                                    </button>
                                  )}
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
                                                    <button onClick={() => {
                                                      // If header still has default placeholder text, delete it on cancel
                                                      if (q.questionText === 'Section Header' && !editingQuestionForm.questionText.trim()) {
                                                        handleDeleteQuestion(q.id)
                                                      }
                                                      setEditingQuestionId(null)
                                                    }}
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
                                                  {/* Diagram image upload */}
                                                  <div style={{ marginBottom: '10px' }}>
                                                    <label style={labelStyle}>Diagram Image (optional)</label>
                                                    {/* Show existing diagram or new preview */}
                                                    {editingDiagramPreview ? (
                                                      <div style={{ marginBottom: '8px', maxWidth: '200px', position: 'relative' }}>
                                                        <img src={editingDiagramPreview} alt="New diagram" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--gray-light)' }} />
                                                        <button onClick={() => { setEditingDiagramFile(null); setEditingDiagramPreview(null) }}
                                                          style={{ position: 'absolute', top: '4px', right: '4px', background: '#e05252', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '22px', textAlign: 'center' }}>
                                                          x
                                                        </button>
                                                      </div>
                                                    ) : !editingDiagramRemoved && q.diagramKey && diagramUrls[q.id] ? (
                                                      <div style={{ marginBottom: '8px', maxWidth: '200px', position: 'relative' }}>
                                                        <img src={diagramUrls[q.id]} alt="Current diagram" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--gray-light)' }} />
                                                        <button onClick={() => setEditingDiagramRemoved(true)}
                                                          style={{ position: 'absolute', top: '4px', right: '4px', background: '#e05252', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '22px', textAlign: 'center' }}>
                                                          x
                                                        </button>
                                                      </div>
                                                    ) : editingDiagramRemoved ? (
                                                      <p style={{ fontSize: '12px', color: '#e05252', margin: '0 0 6px' }}>Diagram will be removed on save.</p>
                                                    ) : null}
                                                    <input
                                                      ref={editDiagramInputRef}
                                                      type="file"
                                                      accept="image/jpeg,image/png"
                                                      style={{ display: 'none' }}
                                                      onChange={e => {
                                                        const f = e.target.files?.[0]
                                                        if (f) {
                                                          setEditingDiagramFile(f)
                                                          setEditingDiagramRemoved(false)
                                                          const url = URL.createObjectURL(f)
                                                          setEditingDiagramPreview(url)
                                                        }
                                                      }}
                                                    />
                                                    <button
                                                      onClick={() => editDiagramInputRef.current?.click()}
                                                      style={{ background: 'none', border: '1px dashed var(--gray-light)', color: 'var(--gray-mid)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)' }}
                                                    >
                                                      {q.diagramKey && !editingDiagramRemoved ? 'Replace image...' : 'Add image...'}
                                                    </button>
                                                  </div>
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
                                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.6px' }}><MathRenderer text={q.questionText} /></span>
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
                                                <div draggable={true} onDragStart={() => setDragIndex(i)} style={{ color: 'var(--gray-mid)', fontSize: '16px', cursor: 'grab', paddingTop: '2px', userSelect: 'none' }}>⠿</div>
                                                <div style={{ fontWeight: 700, color: 'var(--plum)', fontSize: '14px', minWidth: '24px', paddingTop: '1px' }}>{displayNum}.</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                  <div style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '6px', lineHeight: '1.6' }}><MathRenderer text={q.questionText} /></div>
                                                  {diagramUrls[q.id] && (
                                                    <div style={{ marginTop: '6px', marginBottom: '8px', maxWidth: '240px' }}>
                                                      <img src={diagramUrls[q.id]} alt="Diagram" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--gray-light)' }} />
                                                    </div>
                                                  )}
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

                                {/* Add Question / Header form */}
                                <div id={`question-builder-${lesson.id}`} style={{ background: 'var(--white)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '16px', marginBottom: '0' }}>
                                  {/* Toggle: Question vs Header */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '14px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setAddMode('question')}
                                      style={{
                                        background: addMode === 'question' ? 'var(--plum)' : 'var(--background)',
                                        color: addMode === 'question' ? 'white' : 'var(--gray-dark)',
                                        border: `1px solid ${addMode === 'question' ? 'var(--plum)' : 'var(--gray-light)'}`,
                                        borderRadius: '6px 0 0 6px', padding: '7px 16px', cursor: 'pointer',
                                        fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-body)',
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                      }}
                                    >
                                      + Question
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAddMode('header')}
                                      style={{
                                        background: addMode === 'header' ? 'var(--plum)' : 'var(--background)',
                                        color: addMode === 'header' ? 'white' : 'var(--gray-dark)',
                                        border: `1px solid ${addMode === 'header' ? 'var(--plum)' : 'var(--gray-light)'}`,
                                        borderLeft: 'none',
                                        borderRadius: '0 6px 6px 0', padding: '7px 16px', cursor: 'pointer',
                                        fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-body)',
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                      }}
                                    >
                                      § Header
                                    </button>
                                  </div>

                                  {addMode === 'question' ? (
                                    <>
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
                                      {/* Diagram image upload */}
                                      <div style={{ marginBottom: '12px' }}>
                                        <label style={labelStyle}>Diagram Image (optional)</label>
                                        {pendingDiagramPreview && (
                                          <div style={{ marginBottom: '8px', maxWidth: '200px', position: 'relative' }}>
                                            <img src={pendingDiagramPreview} alt="Diagram preview" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--gray-light)' }} />
                                            <button onClick={() => { setPendingDiagramFile(null); setPendingDiagramPreview(null) }}
                                              style={{ position: 'absolute', top: '4px', right: '4px', background: '#e05252', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '22px', textAlign: 'center' }}>
                                              x
                                            </button>
                                          </div>
                                        )}
                                        <input
                                          ref={diagramInputRef}
                                          type="file"
                                          accept="image/jpeg,image/png"
                                          style={{ display: 'none' }}
                                          onChange={e => {
                                            const f = e.target.files?.[0]
                                            if (f) {
                                              setPendingDiagramFile(f)
                                              const url = URL.createObjectURL(f)
                                              setPendingDiagramPreview(url)
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => diagramInputRef.current?.click()}
                                          style={{ background: 'none', border: '1px dashed var(--gray-light)', color: 'var(--gray-mid)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)' }}
                                        >
                                          {pendingDiagramFile ? 'Replace image...' : 'Add image...'}
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => handleAddQuestion(lesson.id)}
                                        disabled={addingQuestion || (!newQuestion.questionText.trim() && !pendingDiagramFile)}
                                        style={{
                                          background: (newQuestion.questionText.trim() || pendingDiagramFile) ? 'var(--plum)' : 'var(--gray-light)',
                                          color: (newQuestion.questionText.trim() || pendingDiagramFile) ? 'white' : 'var(--gray-mid)',
                                          border: 'none', borderRadius: '6px', padding: '8px 20px',
                                          cursor: (newQuestion.questionText.trim() || pendingDiagramFile) ? 'pointer' : 'not-allowed',
                                          fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)'
                                        }}
                                      >
                                        {addingQuestion ? 'Adding...' : 'Add Question'}
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ marginBottom: '12px' }}>
                                        <label style={labelStyle}>Header Text</label>
                                        <MathToolbar
                                          textareaRef={questionTextareaRef}
                                          value={newHeaderText}
                                          onChange={val => setNewHeaderText(val)}
                                        />
                                        <textarea
                                          ref={questionTextareaRef}
                                          value={newHeaderText}
                                          onChange={e => setNewHeaderText(e.target.value)}
                                          placeholder="e.g. Simplify each expression"
                                          rows={2}
                                          style={{ ...inputStyle, resize: 'vertical' }}
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleAddSectionHeader(lesson.id)}
                                        disabled={addingQuestion || !newHeaderText.trim()}
                                        style={{
                                          background: newHeaderText.trim() ? 'var(--plum)' : 'var(--gray-light)',
                                          color: newHeaderText.trim() ? 'white' : 'var(--gray-mid)',
                                          border: 'none', borderRadius: '6px', padding: '8px 20px',
                                          cursor: newHeaderText.trim() ? 'pointer' : 'not-allowed',
                                          fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)'
                                        }}
                                      >
                                        {addingQuestion ? 'Adding...' : 'Add Header'}
                                      </button>
                                    </>
                                  )}
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
