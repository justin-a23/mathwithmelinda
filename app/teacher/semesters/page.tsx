'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const LIST_COURSES = /* GraphQL */ `
  query ListCourses {
    listCourses(limit: 100) {
      items { id title }
    }
  }
`

const LIST_ACADEMIC_YEARS = /* GraphQL */ `
  query ListAcademicYears {
    listAcademicYears(limit: 100) {
      items {
        id year
        quarters { items { id name startDate endDate order } }
      }
    }
  }
`

const CREATE_ACADEMIC_YEAR = /* GraphQL */ `
  mutation CreateAcademicYear($input: CreateAcademicYearInput!) {
    createAcademicYear(input: $input) { id year }
  }
`

const UPDATE_ACADEMIC_YEAR = /* GraphQL */ `
  mutation UpdateAcademicYear($input: UpdateAcademicYearInput!) {
    updateAcademicYear(input: $input) { id year }
  }
`

const DELETE_ACADEMIC_YEAR = /* GraphQL */ `
  mutation DeleteAcademicYear($input: DeleteAcademicYearInput!) {
    deleteAcademicYear(input: $input) { id }
  }
`

const LIST_SEMESTERS = /* GraphQL */ `
  query ListSemesters {
    listSemesters(limit: 100) {
      items {
        id name startDate endDate isActive courseId
        lessonWeightPercent testWeightPercent quizWeightPercent
        gradeA gradeB gradeC gradeD
        course { id title }
        academicYearSemestersId
        academicYear { id year }
      }
    }
  }
`

const CREATE_SEMESTER = /* GraphQL */ `
  mutation CreateSemester($input: CreateSemesterInput!) {
    createSemester(input: $input) {
      id name startDate endDate isActive courseId
      lessonWeightPercent testWeightPercent quizWeightPercent
      gradeA gradeB gradeC gradeD
      course { id title }
      academicYear { id year }
    }
  }
`

const UPDATE_SEMESTER = /* GraphQL */ `
  mutation UpdateSemester($input: UpdateSemesterInput!) {
    updateSemester(input: $input) { id }
  }
`

const DELETE_SEMESTER = /* GraphQL */ `
  mutation DeleteSemester($input: DeleteSemesterInput!) {
    deleteSemester(input: $input) { id }
  }
`

const CREATE_QUARTER = /* GraphQL */ `
  mutation CreateQuarter($input: CreateQuarterInput!) {
    createQuarter(input: $input) { id name startDate endDate order }
  }
`

const UPDATE_QUARTER = /* GraphQL */ `
  mutation UpdateQuarter($input: UpdateQuarterInput!) {
    updateQuarter(input: $input) { id name startDate endDate order }
  }
`

const DELETE_QUARTER = /* GraphQL */ `
  mutation DeleteQuarter($input: DeleteQuarterInput!) {
    deleteQuarter(input: $input) { id }
  }
`

type Course = { id: string; title: string }

type Quarter = {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
}

type AcademicYear = {
  id: string
  year: string
  quarters: { items: Quarter[] } | null
}

type Semester = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean | null
  courseId: string | null
  lessonWeightPercent: number | null
  quizWeightPercent: number | null
  testWeightPercent: number | null
  gradeA: number | null
  gradeB: number | null
  gradeC: number | null
  gradeD: number | null
  course: { id: string; title: string } | null
  academicYearSemestersId: string | null
  academicYear: { id: string; year: string } | null
}

type QuarterForm = {
  id: string | null
  name: string
  startDate: string
  endDate: string
  order: string
}

type FormState = {
  id: string | null
  name: string
  courseId: string
  startDate: string
  endDate: string
  isActive: boolean
  lessonWeight: string
  quizWeight: string
  testWeight: string
  gradeA: string
  gradeB: string
  gradeC: string
  gradeD: string
  academicYearId: string
}

const DEFAULT_FORM: FormState = {
  id: null,
  name: '',
  courseId: '',
  startDate: '',
  endDate: '',
  isActive: false,
  lessonWeight: '60',
  quizWeight: '20',
  testWeight: '20',
  gradeA: '90',
  gradeB: '80',
  gradeC: '70',
  gradeD: '60',
  academicYearId: '',
}

// ── Setup Wizard types ──

type WizardState = {
  step: 1 | 2 | 3
  yearName: string
  quarters: { name: string; startDate: string; endDate: string; order: number }[]
  selectedCourseIds: string[]
  termName: string
  termStartDate: string
  termEndDate: string
  isActive: boolean
  lessonWeight: string
  quizWeight: string
  testWeight: string
  gradeA: string
  gradeB: string
  gradeC: string
  gradeD: string
}

function getSchoolYearDefaults() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startYear = currentMonth >= 5 ? currentYear : currentYear - 1
  const endYear = startYear + 1
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return {
    yearName: `${startYear}-${endYear}`,
    quarters: [
      { name: 'Q1', startDate: fmt(startYear, 8, 12), endDate: fmt(startYear, 10, 17), order: 1 },
      { name: 'Q2', startDate: fmt(startYear, 10, 20), endDate: fmt(startYear, 12, 19), order: 2 },
      { name: 'Q3', startDate: fmt(endYear, 1, 6), endDate: fmt(endYear, 3, 13), order: 3 },
      { name: 'Q4', startDate: fmt(endYear, 3, 16), endDate: fmt(endYear, 5, 22), order: 4 },
    ],
    termStartDate: fmt(startYear, 8, 12),
    termEndDate: fmt(endYear, 5, 22),
  }
}

const WIZARD_STEP_LABELS = ['Name the Year', 'Set Up Quarters', 'Create Course Terms']

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

export default function SemestersPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Academic year creation/edit
  const [newAyYear, setNewAyYear] = useState('')
  const [creatingAy, setCreatingAy] = useState(false)
  const [showAyForm, setShowAyForm] = useState(false)
  const [editingAyId, setEditingAyId] = useState<string | null>(null)
  const [deletingAyId, setDeletingAyId] = useState<string | null>(null)

  // Quarter state (at AY level)
  const [expandedAyId, setExpandedAyId] = useState<string | null>(null)
  const [quarterForm, setQuarterForm] = useState<QuarterForm | null>(null)
  const [savingQuarter, setSavingQuarter] = useState(false)
  const [deletingQuarterId, setDeletingQuarterId] = useState<string | null>(null)

  // Setup wizard
  const [showWizard, setShowWizard] = useState(false)
  const [wizard, setWizard] = useState<WizardState>({
    step: 1, yearName: '', quarters: [
      { name: 'Q1', startDate: '', endDate: '', order: 1 },
      { name: 'Q2', startDate: '', endDate: '', order: 2 },
      { name: 'Q3', startDate: '', endDate: '', order: 3 },
      { name: 'Q4', startDate: '', endDate: '', order: 4 },
    ],
    selectedCourseIds: [], termName: '', termStartDate: '', termEndDate: '',
    isActive: true, lessonWeight: '60', quizWeight: '20', testWeight: '20',
    gradeA: '90', gradeB: '80', gradeC: '70', gradeD: '60',
  })
  const [wizardSaving, setWizardSaving] = useState(false)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [coursesRes, ayRes, semestersRes] = await Promise.all([
        client.graphql({ query: LIST_COURSES }) as any,
        client.graphql({ query: LIST_ACADEMIC_YEARS }) as any,
        client.graphql({ query: LIST_SEMESTERS }) as any,
      ])
      setCourses(coursesRes.data.listCourses.items)
      setAcademicYears(
        [...ayRes.data.listAcademicYears.items].sort((a: AcademicYear, b: AcademicYear) => b.year.localeCompare(a.year))
      )
      const sorted = [...semestersRes.data.listSemesters.items].sort(
        (a: Semester, b: Semester) => b.startDate.localeCompare(a.startDate)
      )
      setSemesters(sorted)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Academic Year CRUD ──

  async function createAcademicYear() {
    if (!newAyYear.trim()) return
    setCreatingAy(true)
    try {
      await (client.graphql({
        query: CREATE_ACADEMIC_YEAR,
        variables: { input: { year: newAyYear.trim() } },
      }) as any)
      setNewAyYear('')
      setShowAyForm(false)
      await loadData()
    } catch (err) {
      console.error('Error creating academic year:', err)
    } finally {
      setCreatingAy(false)
    }
  }

  async function updateAcademicYear(id: string, year: string) {
    try {
      await (client.graphql({ query: UPDATE_ACADEMIC_YEAR, variables: { input: { id, year } } }) as any)
      setEditingAyId(null)
      await loadData()
    } catch (err) {
      console.error('Error updating academic year:', err)
    }
  }

  async function deleteAcademicYear(id: string) {
    const ay = academicYears.find(a => a.id === id)
    const quarters = ay?.quarters?.items || []
    const linkedSems = semesters.filter(s => s.academicYearSemestersId === id)
    if (quarters.length > 0 || linkedSems.length > 0) {
      alert(`Cannot delete — this academic year has ${quarters.length} quarter(s) and ${linkedSems.length} term(s). Remove them first.`)
      return
    }
    if (!confirm('Delete this academic year?')) return
    setDeletingAyId(id)
    try {
      await (client.graphql({ query: DELETE_ACADEMIC_YEAR, variables: { input: { id } } }) as any)
      await loadData()
    } catch (err) {
      console.error('Error deleting academic year:', err)
    } finally {
      setDeletingAyId(null)
    }
  }

  // ── Semester CRUD ──

  function openCreate() {
    setForm({ ...DEFAULT_FORM, academicYearId: academicYears[0]?.id || '' })
    setShowForm(true)
  }

  function openEdit(sem: Semester) {
    setForm({
      id: sem.id,
      name: sem.name,
      courseId: sem.courseId || '',
      startDate: sem.startDate,
      endDate: sem.endDate,
      isActive: sem.isActive ?? false,
      lessonWeight: String(sem.lessonWeightPercent ?? 60),
      quizWeight: String(sem.quizWeightPercent ?? 20),
      testWeight: String(sem.testWeightPercent ?? 20),
      gradeA: String(sem.gradeA ?? 90),
      gradeB: String(sem.gradeB ?? 80),
      gradeC: String(sem.gradeC ?? 70),
      gradeD: String(sem.gradeD ?? 60),
      academicYearId: sem.academicYearSemestersId || '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
  }

  async function saveSemester() {
    if (!form.name || !form.courseId || !form.startDate || !form.endDate) return
    setSaving(true)
    try {
      const input: any = {
        name: form.name,
        courseId: form.courseId,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
        lessonWeightPercent: parseInt(form.lessonWeight) || 60,
        quizWeightPercent: parseInt(form.quizWeight) || 20,
        testWeightPercent: parseInt(form.testWeight) || 20,
        gradeA: parseInt(form.gradeA) || 90,
        gradeB: parseInt(form.gradeB) || 80,
        gradeC: parseInt(form.gradeC) || 70,
        gradeD: parseInt(form.gradeD) || 60,
      }
      if (form.academicYearId) input.academicYearSemestersId = form.academicYearId
      if (form.id) {
        input.id = form.id
        await (client.graphql({ query: UPDATE_SEMESTER, variables: { input } }) as any)
      } else {
        await (client.graphql({ query: CREATE_SEMESTER, variables: { input } }) as any)
      }
      setShowForm(false)
      setForm(DEFAULT_FORM)
      await loadData()
    } catch (err) {
      console.error('Error saving semester:', err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSemester(id: string) {
    if (!confirm('Delete this term? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await (client.graphql({ query: DELETE_SEMESTER, variables: { input: { id } } }) as any)
      setSemesters(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting semester:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Quarter CRUD (at Academic Year level) ──

  function openQuarterCreate(ayId: string) {
    const ay = academicYears.find(a => a.id === ayId)
    const quarters = ay?.quarters?.items || []
    const nextOrder = quarters.length > 0 ? Math.max(...quarters.map(q => q.order)) + 1 : 1
    setQuarterForm({ id: null, name: `Q${nextOrder}`, startDate: '', endDate: '', order: String(nextOrder) })
  }

  function openQuarterEdit(q: Quarter) {
    setQuarterForm({ id: q.id, name: q.name, startDate: q.startDate, endDate: q.endDate, order: String(q.order) })
  }

  async function saveQuarter(ayId: string) {
    if (!quarterForm || !quarterForm.name || !quarterForm.startDate || !quarterForm.endDate) return
    setSavingQuarter(true)
    try {
      if (quarterForm.id) {
        await (client.graphql({
          query: UPDATE_QUARTER,
          variables: {
            input: {
              id: quarterForm.id,
              name: quarterForm.name,
              startDate: quarterForm.startDate,
              endDate: quarterForm.endDate,
              order: parseInt(quarterForm.order) || 1,
            },
          },
        }) as any)
      } else {
        await (client.graphql({
          query: CREATE_QUARTER,
          variables: {
            input: {
              name: quarterForm.name,
              startDate: quarterForm.startDate,
              endDate: quarterForm.endDate,
              order: parseInt(quarterForm.order) || 1,
              academicYearQuartersId: ayId,
            },
          },
        }) as any)
      }
      setQuarterForm(null)
      await loadData()
    } catch (err) {
      console.error('Error saving quarter:', err)
    } finally {
      setSavingQuarter(false)
    }
  }

  async function deleteQuarter(id: string) {
    if (!confirm('Delete this quarter?')) return
    setDeletingQuarterId(id)
    try {
      await (client.graphql({ query: DELETE_QUARTER, variables: { input: { id } } }) as any)
      await loadData()
    } catch (err) {
      console.error('Error deleting quarter:', err)
    } finally {
      setDeletingQuarterId(null)
    }
  }

  // ── Wizard helpers ──

  function openWizard() {
    const defaults = getSchoolYearDefaults()
    setWizard({
      step: 1,
      yearName: defaults.yearName,
      quarters: defaults.quarters,
      selectedCourseIds: courses.map(c => c.id),
      termName: defaults.yearName,
      termStartDate: defaults.termStartDate,
      termEndDate: defaults.termEndDate,
      isActive: true,
      lessonWeight: '60', quizWeight: '20', testWeight: '20',
      gradeA: '90', gradeB: '80', gradeC: '70', gradeD: '60',
    })
    setShowWizard(true)
  }

  function cancelWizard() {
    setShowWizard(false)
  }

  async function submitWizard() {
    setWizardSaving(true)
    try {
      // 1. Create AcademicYear
      const ayRes = await (client.graphql({
        query: CREATE_ACADEMIC_YEAR,
        variables: { input: { year: wizard.yearName.trim() } },
      }) as any)
      const newAyId = ayRes.data.createAcademicYear.id

      // 2. Create all quarters
      await Promise.all(wizard.quarters.map(q =>
        (client.graphql({
          query: CREATE_QUARTER,
          variables: {
            input: {
              name: q.name,
              startDate: q.startDate,
              endDate: q.endDate,
              order: q.order,
              academicYearQuartersId: newAyId,
            },
          },
        }) as any)
      ))

      // 3. Create a term for each selected course
      await Promise.all(wizard.selectedCourseIds.map(courseId =>
        (client.graphql({
          query: CREATE_SEMESTER,
          variables: {
            input: {
              name: wizard.termName.trim(),
              courseId,
              startDate: wizard.termStartDate,
              endDate: wizard.termEndDate,
              isActive: wizard.isActive,
              lessonWeightPercent: parseInt(wizard.lessonWeight) || 60,
              quizWeightPercent: parseInt(wizard.quizWeight) || 20,
              testWeightPercent: parseInt(wizard.testWeight) || 20,
              gradeA: parseInt(wizard.gradeA) || 90,
              gradeB: parseInt(wizard.gradeB) || 80,
              gradeC: parseInt(wizard.gradeC) || 70,
              gradeD: parseInt(wizard.gradeD) || 60,
              academicYearSemestersId: newAyId,
            },
          },
        }) as any)
      ))

      setShowWizard(false)
      await loadData()
    } catch (err) {
      console.error('Wizard error:', err)
      alert('Something went wrong during setup. Your academic year may have been partially created — you can finish setting up using the forms below.')
    } finally {
      setWizardSaving(false)
    }
  }

  const wizardWeightSum = (parseInt(wizard.lessonWeight) || 0) + (parseInt(wizard.quizWeight) || 0) + (parseInt(wizard.testWeight) || 0)
  const wizardWeightOk = wizardWeightSum === 100
  const wizardStep2Valid = wizard.quarters.every(q => q.startDate && q.endDate)
  const wizardStep3Valid = wizard.selectedCourseIds.length > 0 && wizard.termName.trim() && wizard.termStartDate && wizard.termEndDate && wizardWeightOk

  const weightSum = (parseInt(form.lessonWeight) || 0) + (parseInt(form.quizWeight) || 0) + (parseInt(form.testWeight) || 0)
  const weightOk = weightSum === 100

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--gray-light)',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--gray-dark)',
    display: 'block',
    marginBottom: '6px',
  }

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      <TeacherNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>Academic Year</h1>
            <p style={{ color: 'var(--gray-mid)', margin: 0 }}>Manage academic years, quarters, and grading weights.</p>
          </div>
          {!loading && !showWizard && (
            <button onClick={openWizard} style={{ background: 'var(--plum)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Set Up New Year
            </button>
          )}
        </div>

        {/* ── Setup Wizard ── */}
        {showWizard && (
          <div style={{ background: 'var(--background)', border: '2px solid var(--plum)', borderRadius: 'var(--radius)', padding: '32px', marginBottom: '40px', boxShadow: '0 4px 24px rgba(123,79,166,0.10)' }}>
            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: wizard.step >= stepNum ? 'var(--plum)' : 'var(--gray-light)',
                      color: wizard.step >= stepNum ? 'white' : 'var(--gray-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                    }}>
                      {wizard.step > stepNum ? '✓' : stepNum}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: wizard.step === stepNum ? 700 : 400, color: wizard.step === stepNum ? 'var(--foreground)' : 'var(--gray-mid)' }}>
                      {WIZARD_STEP_LABELS[stepNum - 1]}
                    </span>
                  </div>
                  {stepNum < 3 && (
                    <div style={{ width: '48px', height: '2px', background: wizard.step > stepNum ? 'var(--plum)' : 'var(--gray-light)', margin: '0 16px', transition: 'background 0.2s' }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 1: Name the Year ── */}
            {wizard.step === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 8px' }}>What school year are you setting up?</h2>
                  <p style={{ color: 'var(--gray-mid)', margin: 0, fontSize: '14px' }}>This is just a label — you'll set the actual dates in the next steps.</p>
                </div>
                <div style={{ maxWidth: '320px', margin: '0 auto 32px' }}>
                  <input
                    type="text"
                    value={wizard.yearName}
                    onChange={e => setWizard(w => ({ ...w, yearName: e.target.value }))}
                    placeholder={getSchoolYearDefaults().yearName}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', fontFamily: 'var(--font-display)', padding: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button onClick={cancelWizard} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                  <button
                    onClick={() => setWizard(w => ({ ...w, step: 2, termName: w.yearName || w.termName }))}
                    disabled={!wizard.yearName.trim()}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 28px', cursor: wizard.yearName.trim() ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 600, opacity: wizard.yearName.trim() ? 1 : 0.5 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Define Quarters ── */}
            {wizard.step === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 8px' }}>When does each quarter start and end?</h2>
                  <p style={{ color: 'var(--gray-mid)', margin: '0 0 20px', fontSize: '14px' }}>These quarters are shared by all your courses. You can edit them later if dates change.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <button
                    onClick={() => {
                      const defaults = getSchoolYearDefaults()
                      setWizard(w => ({ ...w, quarters: defaults.quarters, termStartDate: defaults.termStartDate, termEndDate: defaults.termEndDate }))
                    }}
                    style={{ background: '#f0eaf8', color: 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Use typical Aug–May dates
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {wizard.quarters.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: q.startDate && q.endDate ? '#f0eaf8' : 'rgba(0,0,0,0.02)', border: '1px solid var(--gray-light)', borderRadius: '10px', flexWrap: 'wrap' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: q.startDate && q.endDate ? 'var(--plum)' : 'var(--gray-light)', color: q.startDate && q.endDate ? 'white' : 'var(--gray-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                        {q.name}
                      </div>
                      <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Start Date</label>
                        <input
                          type="date"
                          value={q.startDate}
                          onChange={e => setWizard(w => ({ ...w, quarters: w.quarters.map((qq, j) => j === i ? { ...qq, startDate: e.target.value } : qq) }))}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>End Date</label>
                        <input
                          type="date"
                          value={q.endDate}
                          onChange={e => setWizard(w => ({ ...w, quarters: w.quarters.map((qq, j) => j === i ? { ...qq, endDate: e.target.value } : qq) }))}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button onClick={() => setWizard(w => ({ ...w, step: 1 }))} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
                  <button
                    onClick={() => {
                      // Auto-fill term dates from Q1 start → Q4 end
                      const sorted = [...wizard.quarters].sort((a, b) => a.order - b.order)
                      setWizard(w => ({
                        ...w,
                        step: 3,
                        termStartDate: w.termStartDate || sorted[0]?.startDate || '',
                        termEndDate: w.termEndDate || sorted[sorted.length - 1]?.endDate || '',
                      }))
                    }}
                    disabled={!wizardStep2Valid}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 28px', cursor: wizardStep2Valid ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 600, opacity: wizardStep2Valid ? 1 : 0.5 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Create Course Terms ── */}
            {wizard.step === 3 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 8px' }}>Which courses are you teaching this year?</h2>
                  <p style={{ color: 'var(--gray-mid)', margin: 0, fontSize: '14px' }}>A term will be created for each selected course with the same grading settings.</p>
                </div>

                {/* Course checkboxes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
                  {courses.map(c => {
                    const checked = wizard.selectedCourseIds.includes(c.id)
                    return (
                      <label key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', userSelect: 'none',
                        border: checked ? '2px solid var(--plum)' : '1px solid var(--gray-light)',
                        background: checked ? '#f0eaf8' : 'var(--background)',
                        fontWeight: checked ? 600 : 400, fontSize: '14px', color: checked ? 'var(--plum)' : 'var(--foreground)',
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            setWizard(w => ({
                              ...w,
                              selectedCourseIds: e.target.checked
                                ? [...w.selectedCourseIds, c.id]
                                : w.selectedCourseIds.filter(id => id !== c.id)
                            }))
                          }}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--plum)', cursor: 'pointer' }}
                        />
                        {c.title}
                      </label>
                    )
                  })}
                </div>

                {/* Shared settings */}
                <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Term Settings (applies to all selected courses)</div>

                  {/* Term name + dates */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
                      <label style={labelStyle}>Term Name</label>
                      <input
                        type="text"
                        value={wizard.termName}
                        onChange={e => setWizard(w => ({ ...w, termName: e.target.value }))}
                        placeholder="e.g. 2026-2027"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={wizard.termStartDate} onChange={e => setWizard(w => ({ ...w, termStartDate: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={wizard.termEndDate} onChange={e => setWizard(w => ({ ...w, termEndDate: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={wizard.isActive} onChange={e => setWizard(w => ({ ...w, isActive: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: 'var(--plum)', cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500 }}>Mark as active term</span>
                    </label>
                  </div>

                  {/* Grade weights */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Grading Weights</label>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', background: wizardWeightOk ? '#dcfce7' : '#fee2e2', color: wizardWeightOk ? '#16a34a' : '#dc2626' }}>
                        Sum: {wizardWeightSum}%{wizardWeightOk ? ' ✓' : ' — must equal 100'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {[
                        { label: 'Lessons %', key: 'lessonWeight' as const },
                        { label: 'Participation %', key: 'quizWeight' as const },
                        { label: 'Tests %', key: 'testWeight' as const },
                      ].map(({ label, key }) => (
                        <div key={key} style={{ flex: '1 1 120px', minWidth: '100px' }}>
                          <label style={labelStyle}>{label}</label>
                          <input type="number" min={0} max={100} value={wizard[key]} onChange={e => setWizard(w => ({ ...w, [key]: e.target.value }))} onFocus={e => e.target.select()} style={inputStyle} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade cutoffs */}
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '10px' }}>Grade Cutoffs</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {(['gradeA', 'gradeB', 'gradeC', 'gradeD'] as const).map(key => (
                        <div key={key} style={{ flex: '1 1 80px', minWidth: '70px' }}>
                          <label style={labelStyle}>{key.replace('grade', '')} ≥</label>
                          <input type="number" min={0} max={100} value={wizard[key]} onChange={e => setWizard(w => ({ ...w, [key]: e.target.value }))} onFocus={e => e.target.select()} style={inputStyle} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary + submit */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                    This will create: <strong>1 academic year</strong>, <strong>4 quarters</strong>, and <strong>{wizard.selectedCourseIds.length} course term{wizard.selectedCourseIds.length !== 1 ? 's' : ''}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button onClick={() => setWizard(w => ({ ...w, step: 2 }))} disabled={wizardSaving} style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
                  <button
                    onClick={submitWizard}
                    disabled={wizardSaving || !wizardStep3Valid}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 32px', cursor: (wizardSaving || !wizardStep3Valid) ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 700, opacity: (wizardSaving || !wizardStep3Valid) ? 0.6 : 1 }}>
                    {wizardSaving ? 'Setting up…' : `Create ${wizard.yearName}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state: guide to wizard ── */}
        {!loading && !showWizard && academicYears.length === 0 && semesters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--gray-mid)', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', marginBottom: '40px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 16px', opacity: 0.6 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--foreground)', margin: '0 0 8px' }}>Welcome! Let's set up your school year</h2>
            <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              The setup wizard will walk you through creating your academic year, quarter dates, and course terms — all in about 2 minutes.
            </p>
            <button onClick={openWizard} style={{ background: 'var(--plum)', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
              Get Started →
            </button>
          </div>
        )}

        {/* ── Academic Years & Quarters ── */}
        {!loading && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Academic Years & Quarters
              </div>
              {!showAyForm && (
                <button
                  onClick={() => setShowAyForm(true)}
                  style={{ background: 'var(--plum)', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  + New Academic Year
                </button>
              )}
            </div>

            {/* New AY form */}
            {showAyForm && (
              <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Year</label>
                  <input
                    type="text"
                    value={newAyYear}
                    onChange={e => setNewAyYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={createAcademicYear}
                  disabled={creatingAy || !newAyYear.trim()}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: creatingAy ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: (creatingAy || !newAyYear.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {creatingAy ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowAyForm(false); setNewAyYear('') }}
                  style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
              </div>
            )}

            {academicYears.length === 0 && !showAyForm && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-mid)', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>No academic years yet. Create one to define quarters.</p>
              </div>
            )}

            {academicYears.map(ay => {
              const quarters = [...(ay.quarters?.items || [])].sort((a, b) => a.order - b.order)
              const isExpanded = expandedAyId === ay.id
              const semCount = semesters.filter(s => s.academicYearSemestersId === ay.id).length

              return (
                <div key={ay.id} style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      {editingAyId === ay.id ? (
                        <input
                          autoFocus
                          defaultValue={ay.year}
                          onKeyDown={e => { if (e.key === 'Enter') updateAcademicYear(ay.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingAyId(null) }}
                          onBlur={e => updateAcademicYear(ay.id, e.target.value)}
                          style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)', border: '1px solid var(--plum)', borderRadius: '4px', padding: '2px 8px', background: 'var(--background)', width: '160px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{ay.year}</span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '2px 10px', borderRadius: '20px' }}>
                        {semCount} term{semCount !== 1 ? 's' : ''}
                      </span>
                      {quarters.length > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--plum)', background: '#f0eaf8', padding: '2px 10px', borderRadius: '20px' }}>
                          {quarters.map(q => q.name).join(' · ')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => setEditingAyId(ay.id)}
                        style={{ background: 'transparent', color: 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAcademicYear(ay.id)}
                        disabled={deletingAyId === ay.id}
                        style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', opacity: deletingAyId === ay.id ? 0.6 : 1 }}>
                        {deletingAyId === ay.id ? '...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setExpandedAyId(isExpanded ? null : ay.id)}
                        style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Quarters
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Quarter Management Panel */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--gray-light)', background: 'rgba(123,79,166,0.02)', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase' }}>Quarters</div>
                        {!quarterForm && (
                          <button
                            onClick={() => openQuarterCreate(ay.id)}
                            style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            + Add Quarter
                          </button>
                        )}
                      </div>

                      {quarters.length === 0 && !quarterForm && (
                        <div style={{ fontSize: '13px', color: 'var(--gray-mid)', padding: '8px 0' }}>
                          No quarters defined. Add quarters to enable per-quarter report cards.
                        </div>
                      )}

                      {quarters.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: quarterForm ? '16px' : '0' }}>
                          {quarters.map(q => (
                            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0eaf8', color: 'var(--plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                                {q.order}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{q.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>{formatDateRange(q.startDate, q.endDate)}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                  onClick={() => openQuarterEdit(q)}
                                  style={{ background: 'transparent', color: 'var(--plum)', border: '1px solid var(--plum)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteQuarter(q.id)}
                                  disabled={deletingQuarterId === q.id}
                                  style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', opacity: deletingQuarterId === q.id ? 0.6 : 1 }}>
                                  {deletingQuarterId === q.id ? '...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quarter create/edit form */}
                      {quarterForm && (
                        <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>
                            {quarterForm.id ? 'Edit Quarter' : 'New Quarter'}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <label style={labelStyle}>Name</label>
                              <input
                                type="text"
                                value={quarterForm.name}
                                onChange={e => setQuarterForm(f => f ? { ...f, name: e.target.value } : f)}
                                placeholder="Q1"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Order</label>
                              <input
                                type="number"
                                min={1}
                                max={4}
                                value={quarterForm.order}
                                onChange={e => setQuarterForm(f => f ? { ...f, order: e.target.value } : f)}
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Start Date</label>
                              <input
                                type="date"
                                value={quarterForm.startDate}
                                onChange={e => setQuarterForm(f => f ? { ...f, startDate: e.target.value } : f)}
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>End Date</label>
                              <input
                                type="date"
                                value={quarterForm.endDate}
                                onChange={e => setQuarterForm(f => f ? { ...f, endDate: e.target.value } : f)}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => saveQuarter(ay.id)}
                              disabled={savingQuarter || !quarterForm.name || !quarterForm.startDate || !quarterForm.endDate}
                              style={{ background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: savingQuarter ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: (savingQuarter || !quarterForm.name || !quarterForm.startDate || !quarterForm.endDate) ? 0.6 : 1 }}>
                              {savingQuarter ? 'Saving...' : quarterForm.id ? 'Save' : 'Add Quarter'}
                            </button>
                            <button
                              onClick={() => setQuarterForm(null)}
                              style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer', fontSize: '12px' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Terms ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plum)', letterSpacing: '1px', textTransform: 'uppercase' }}>Terms</div>
          {!showForm && (
            <button
              onClick={openCreate}
              style={{ background: 'var(--plum)', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              + New Term
            </button>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--foreground)', marginBottom: '24px', marginTop: 0 }}>
              {form.id ? 'Edit Term' : 'New Term'}
            </h2>

            {/* Row 1: Name + Course + Academic Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spring 2026"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Course</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                  style={inputStyle}>
                  <option value="">Select a course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Academic Year</label>
                <select
                  value={form.academicYearId}
                  onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}
                  style={inputStyle}>
                  <option value="">Select year...</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--plum)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500 }}>Mark as active term</span>
              </label>
            </div>

            {/* Weights */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Grading Weights</label>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: weightOk ? '#dcfce7' : '#fee2e2',
                  color: weightOk ? '#16a34a' : '#dc2626',
                }}>
                  Sum: {weightSum}%{weightOk ? ' ✓' : ' — must equal 100'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Lessons %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.lessonWeight}
                    onChange={e => setForm(f => ({ ...f, lessonWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Participation %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.quizWeight}
                    onChange={e => setForm(f => ({ ...f, quizWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tests %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.testWeight}
                    onChange={e => setForm(f => ({ ...f, testWeight: e.target.value }))}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Grade cutoffs */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Grade Cutoffs</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                {(['gradeA', 'gradeB', 'gradeC', 'gradeD'] as const).map(key => (
                  <div key={key}>
                    <label style={labelStyle}>{key.replace('grade', '')} ≥</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      onFocus={e => e.target.select()}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveSemester}
                disabled={saving || !weightOk || !form.name || !form.courseId || !form.startDate || !form.endDate}
                style={{
                  background: 'var(--plum)',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: (saving || !weightOk || !form.name || !form.courseId || !form.startDate || !form.endDate) ? 0.6 : 1,
                }}>
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Term'}
              </button>
              <button
                onClick={cancelForm}
                style={{ background: 'transparent', color: 'var(--gray-mid)', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--gray-light)', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Semester list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '100px', borderRadius: 'var(--radius)', background: 'var(--gray-light)', opacity: 0.5 }} />
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--gray-mid)' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No terms yet.</p>
            <p style={{ fontSize: '14px' }}>Click "+ New Term" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {semesters.map(sem => (
              <div
                key={sem.id}
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: 'var(--radius)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + active badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--foreground)' }}>{sem.name}</span>
                    {sem.isActive && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                        Active
                      </span>
                    )}
                    {sem.academicYear && (
                      <span style={{ fontSize: '11px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '2px 10px', borderRadius: '20px' }}>
                        {sem.academicYear.year}
                      </span>
                    )}
                  </div>

                  {/* Course name */}
                  {sem.course && (
                    <div style={{ fontSize: '13px', color: 'var(--plum)', marginBottom: '6px', fontWeight: 500 }}>
                      {sem.course.title}
                    </div>
                  )}

                  {/* Date range */}
                  {sem.startDate && sem.endDate && (
                    <div style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                      {formatDateRange(sem.startDate, sem.endDate)}
                    </div>
                  )}

                  {/* Weights + cutoffs */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '3px 10px', borderRadius: '20px' }}>
                      Lessons {sem.lessonWeightPercent ?? 60}% · Participation {sem.quizWeightPercent ?? 20}% · Tests {sem.testWeightPercent ?? 20}%
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-mid)', background: 'var(--gray-light)', padding: '3px 10px', borderRadius: '20px' }}>
                      A≥{sem.gradeA ?? 90} B≥{sem.gradeB ?? 80} C≥{sem.gradeC ?? 70} D≥{sem.gradeD ?? 60}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(sem)}
                    style={{ background: 'transparent', color: 'var(--plum)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--plum)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSemester(sem.id)}
                    disabled={deletingId === sem.id}
                    style={{ background: 'transparent', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', border: '1px solid #fca5a5', cursor: 'pointer', fontSize: '13px', opacity: deletingId === sem.id ? 0.6 : 1 }}>
                    {deletingId === sem.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
