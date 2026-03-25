'use client'

import { generateClient } from 'aws-amplify/api'
import { createCourse } from '../../src/graphql/mutations'
import { useState } from 'react'

const client = generateClient()

const courses = [
  { title: 'Arithmetic 6', description: 'Foundational arithmetic for 6th grade', gradeLevel: '6' },
  { title: 'Middle School Math', description: 'Core math concepts for middle school', gradeLevel: '7' },
  { title: 'Pre-Algebra', description: 'Preparation for algebra concepts', gradeLevel: '8' },
  { title: 'Algebra 1', description: 'Introduction to algebraic thinking', gradeLevel: '9' },
]

export default function SeedPage() {
  const [status, setStatus] = useState('')

  async function seedCourses() {
    setStatus('Seeding...')
    try {
      for (const course of courses) {
        await client.graphql({
          query: createCourse,
          variables: { input: course }
        })
      }
      setStatus('Done! All 4 courses added.')
    } catch (err) {
      setStatus('Error: ' + err)
    }
  }

  return (
    <div style={{ padding: '48px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Seed Database</h1>
      <button onClick={seedCourses} style={{ background: 'var(--plum)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
        Add Courses to Database
      </button>
      <p style={{ marginTop: '24px', color: 'var(--gray-mid)' }}>{status}</p>
    </div>
  )
}