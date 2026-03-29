'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import ThemeToggle from '../components/ThemeToggle'
import ImageCropper from '../components/ImageCropper'

const client = generateClient()

const getProfileQuery = /* GraphQL */`
  query GetProfile($userId: String!) {
    listStudentProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items {
        id
        firstName
        lastName
        preferredName
        email
        gradeLevel
        courseId
        profilePictureKey
      }
    }
  }
`

const listCoursesQuery = /* GraphQL */`
  query ListCourses {
    listCourses(limit: 100) {
      items { id title isArchived }
    }
  }
`


type Profile = {
  id: string
  firstName: string
  lastName: string
  preferredName: string | null
  email: string
  gradeLevel: string | null
  courseId: string | null
  profilePictureKey: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--gray-light)',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  boxSizing: 'border-box',
}

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'var(--gray-light)',
  color: 'var(--gray-mid)',
  cursor: 'default',
}

export default function ProfilePage() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(true)

  const [preferredName, setPreferredName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    const userId = user?.userId || user?.username || ''
    if (!userId) return
    async function load() {
      try {
        const [profileRes, courseRes] = await Promise.all([
          client.graphql({ query: getProfileQuery, variables: { userId } }) as any,
          client.graphql({ query: listCoursesQuery }) as any,
        ])
        const items = profileRes.data.listStudentProfiles.items
        if (items.length > 0) {
          const p = items[0] as Profile
          setProfile(p)
          // Default to first name if no preferred name set yet
          setPreferredName(p.preferredName || p.firstName)
          if (p.profilePictureKey) {
            const res = await fetch('/api/profile-pic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'view', key: p.profilePictureKey }),
            })
            const { url } = await res.json()
            setProfilePicUrl(url)
          }
          if (p.courseId) {
            const courses = courseRes.data.listCourses.items as { id: string; title: string; isArchived: boolean | null }[]
            const match = courses.find(c => c.id === p.courseId)
            if (match) setCourseName(match.title)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.userId, user?.username])

  async function savePreferredName() {
    if (!profile) return
    setSaving(true)
    setSaved(false)
    try {
      const { updateStudentProfile } = await import('../../src/graphql/mutations')
      await client.graphql({
        query: updateStudentProfile,
        variables: { input: { id: profile.id, preferredName: preferredName.trim() || profile.firstName } },
      })
      setProfile(prev => prev ? { ...prev, preferredName: preferredName.trim() || profile.firstName } : prev)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving preferred name:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    setCropperSrc(src)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    if (!profile) return
    setCropperSrc(null)
    setUploadingPic(true)
    try {
      const userId = user?.userId || user?.username || ''
      const res = await fetch('/api/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', userId }),
      })
      const { signedUrl, key } = await res.json()
      await fetch(signedUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } })
      const { updateStudentProfile } = await import('../../src/graphql/mutations')
      await client.graphql({ query: updateStudentProfile, variables: { input: { id: profile.id, profilePictureKey: key } } })
      const viewRes = await fetch('/api/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', key }),
      })
      const { url } = await viewRes.json()
      setProfilePicUrl(url)
      setProfile(prev => prev ? { ...prev, profilePictureKey: key } : prev)
    } catch (err) {
      console.error('Error uploading picture:', err)
    } finally {
      setUploadingPic(false)
    }
  }

  function handleCropCancel() {
    if (cropperSrc) URL.revokeObjectURL(cropperSrc)
    setCropperSrc(null)
  }

  async function changePassword() {
    setPassError('')
    if (!newPass || !oldPass) { setPassError('Please fill in all fields.'); return }
    if (newPass !== confirmPass) { setPassError('New passwords do not match.'); return }
    if (newPass.length < 8) { setPassError('Password must be at least 8 characters.'); return }
    setChangingPass(true)
    try {
      const { updatePassword } = await import('aws-amplify/auth')
      await updatePassword({ oldPassword: oldPass, newPassword: newPass })
      setPassSaved(true)
      setOldPass(''); setNewPass(''); setConfirmPass('')
      setTimeout(() => { setPassSaved(false); setShowPasswordForm(false) }, 3000)
    } catch (err: any) {
      setPassError(err.message || 'Password change failed. Check your current password.')
    } finally {
      setChangingPass(false)
    }
  }

  const initials = profile ? (profile.firstName[0] || '') + (profile.lastName[0] || '') : '?'

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
      <nav style={{ background: 'var(--nav-bg)', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--plum)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white"/>
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '20px' }}>Math with Melinda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            ← Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>My Profile</h1>
        <p style={{ color: 'var(--gray-mid)', fontSize: '14px', marginBottom: '40px' }}>Update your name, photo, and account settings.</p>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
        ) : !profile ? (
          <p style={{ color: 'var(--gray-mid)' }}>Profile not found. Please contact your teacher.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Profile picture */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '20px' }}>Profile Photo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div
                  onClick={() => !uploadingPic && fileInputRef.current?.click()}
                  title="Click to change photo"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '3px solid var(--plum-mid)', position: 'relative', flexShrink: 0 }}>
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--plum-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--plum)' }}>{initials}</span>
                    </div>
                  )}
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploadingPic ? 1 : 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { if (!uploadingPic) e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { if (!uploadingPic) e.currentTarget.style.opacity = '0' }}>
                    <span style={{ fontSize: '11px', color: 'white', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                      {uploadingPic ? 'Uploading…' : 'Change\nPhoto'}
                    </span>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: 'none' }} />
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--foreground)', marginBottom: '4px', fontWeight: 500 }}>
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>{profile.email}</p>
                  <button
                    onClick={() => !uploadingPic && fileInputRef.current?.click()}
                    disabled={uploadingPic}
                    style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    {uploadingPic ? 'Uploading…' : 'Change Photo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '20px' }}>Name</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>First Name</label>
                  <input style={readOnlyStyle} value={profile.firstName} readOnly />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Last Name</label>
                  <input style={readOnlyStyle} value={profile.lastName} readOnly />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '20px', marginTop: '4px' }}>Your name is set by your teacher. Contact Melinda to make changes.</p>

              <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>What should we call you?</label>
                <input
                  style={{ ...inputStyle, maxWidth: '280px' }}
                  value={preferredName}
                  onChange={e => setPreferredName(e.target.value)}
                  placeholder={profile.firstName}
                />
                <p style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '6px', marginBottom: '14px' }}>This is the name shown on your dashboard greeting.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={savePreferredName}
                    disabled={saving}
                    style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  {saved && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>✓ Saved!</span>}
                </div>
              </div>
            </div>

            {/* Course info (read-only) */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '20px' }}>Enrollment</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Course</label>
                  <input style={readOnlyStyle} value={courseName || '—'} readOnly />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Grade Level</label>
                  <input style={readOnlyStyle} value={profile.gradeLevel ? 'Grade ' + profile.gradeLevel : '—'} readOnly />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gray-mid)', marginTop: '10px' }}>These are set by your teacher. Contact Melinda to make changes.</p>
            </div>

            {/* Password */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '20px' }}>Password</div>
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  style={{ background: 'transparent', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  Change Password
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Current Password</label>
                    <input type="password" style={inputStyle} value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>New Password</label>
                    <input type="password" style={inputStyle} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                    <input type="password" style={inputStyle} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter new password" />
                  </div>
                  {passError && <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>{passError}</p>}
                  {passSaved && <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, margin: 0 }}>✓ Password updated!</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={changePassword} disabled={changingPass}
                      style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                      {changingPass ? 'Updating…' : 'Update Password'}
                    </button>
                    <button onClick={() => { setShowPasswordForm(false); setPassError(''); setOldPass(''); setNewPass(''); setConfirmPass('') }}
                      style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sign out */}
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <button onClick={async () => { await signOut(); router.replace('/login') }} style={{ background: 'transparent', color: 'var(--gray-mid)', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                Sign out
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
