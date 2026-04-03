'use client'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { generateClient } from 'aws-amplify/api'
import TeacherNav from '../../components/TeacherNav'
import ImageCropper from '../../components/ImageCropper'
import { useRoleGuard } from '../../hooks/useRoleGuard'

const client = generateClient()

const getTeacherProfileQuery = /* GraphQL */`
  query GetTeacherProfile($userId: String!) {
    listTeacherProfiles(filter: { userId: { eq: $userId } }, limit: 1) {
      items {
        id
        userId
        email
        displayName
        bio
        profilePictureKey
        teachingVoice
      }
    }
  }
`

const createTeacherProfileMutation = /* GraphQL */`
  mutation CreateTeacherProfile($input: CreateTeacherProfileInput!) {
    createTeacherProfile(input: $input) {
      id
      userId
      email
      displayName
      bio
      profilePictureKey
    }
  }
`

const updateTeacherProfileMutation = /* GraphQL */`
  mutation UpdateTeacherProfile($input: UpdateTeacherProfileInput!) {
    updateTeacherProfile(input: $input) {
      id
      displayName
      bio
      profilePictureKey
      teachingVoice
    }
  }
`


type TeacherProfile = {
  id: string
  userId: string
  email: string
  displayName: string | null
  bio: string | null
  profilePictureKey: string | null
  teachingVoice: string | null
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

export default function TeacherProfilePage() {
  const { user, signOut } = useAuthenticator()
  const router = useRouter()
  const { checking } = useRoleGuard('teacher')

  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [teachingVoice, setTeachingVoice] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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
        const result = await client.graphql({ query: getTeacherProfileQuery, variables: { userId } }) as any
        const items = result.data.listTeacherProfiles.items

        // UUID v4 pattern — manually created records like "melinda-teacher-001" won't match
        const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        // If we found a record but it has a non-UUID id (manually inserted), migrate it
        if (items.length > 0 && !UUID_PATTERN.test(items[0].id)) {
          const old = items[0] as TeacherProfile
          // Delete the broken record, then fall through to auto-create a proper one
          try {
            await client.graphql({
              query: `mutation DeleteTeacherProfile($input: DeleteTeacherProfileInput!) { deleteTeacherProfile(input: $input) { id } }`,
              variables: { input: { id: old.id } },
            })
          } catch (_) { /* ignore delete errors, create will still work */ }
          items.splice(0, items.length) // clear items so we fall into the create branch
        }

        if (items.length > 0) {
          const p = items[0] as TeacherProfile
          setProfile(p)
          setDisplayName(p.displayName || '')
          setBio(p.bio || '')
          setTeachingVoice(p.teachingVoice || '')
          if (p.profilePictureKey) {
            // Base64 data URLs are used directly; legacy S3 keys fetch a signed URL
            if (p.profilePictureKey.startsWith('data:')) {
              setProfilePicUrl(p.profilePictureKey)
            } else {
              const res = await fetch('/api/profile-pic?key=' + encodeURIComponent(p.profilePictureKey))
              const { url } = await res.json()
              setProfilePicUrl(url)
            }
          }
        } else {
          // Auto-create profile for teacher on first visit (or after migration)
          const email = user?.signInDetails?.loginId || userId
          const created = await client.graphql({
            query: createTeacherProfileMutation,
            variables: { input: { userId, email, displayName: '', bio: '' } },
          }) as any
          const p = created.data.createTeacherProfile as TeacherProfile
          setProfile(p)
          setDisplayName('')
          setBio('')
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.userId, user?.username])

  async function saveInfo() {
    if (!profile) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const result = await client.graphql({
        query: updateTeacherProfileMutation,
        variables: { input: { id: profile.id, displayName: displayName.trim(), bio: bio.trim(), teachingVoice: teachingVoice.trim() } },
      }) as any
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
      }
      setProfile(prev => prev ? { ...prev, displayName: displayName.trim(), bio: bio.trim(), teachingVoice: teachingVoice.trim() } : prev)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      const msg = err?.message || 'Unknown error'
      // If the record is broken (manually created, wrong format), delete and recreate it
      if (msg.includes('conditional') || msg.includes('ConditionalCheckFailed') || msg.includes('not found') || msg.includes('Cannot return null')) {
        try {
          // Delete the broken record and recreate
          await client.graphql({
            query: `mutation DeleteTeacherProfile($input: DeleteTeacherProfileInput!) { deleteTeacherProfile(input: $input) { id } }`,
            variables: { input: { id: profile.id } },
          })
          const userId = user?.userId || user?.username || ''
          const email = user?.signInDetails?.loginId || userId
          const created = await client.graphql({
            query: createTeacherProfileMutation,
            variables: { input: { userId, email, displayName: displayName.trim(), bio: bio.trim() } },
          }) as any
          const p = created.data.createTeacherProfile as TeacherProfile
          setProfile(p)
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        } catch (recreateErr) {
          console.error('Error recreating profile:', recreateErr)
          setSaveError('Save failed. Please try refreshing the page.')
        }
      } else {
        setSaveError(`Save failed: ${msg}`)
      }
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
    setSaveError('')
    try {
      // Convert blob to base64 data URL — stored directly in DynamoDB, no S3 needed
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const updateResult = await client.graphql({
        query: updateTeacherProfileMutation,
        variables: { input: { id: profile.id, profilePictureKey: dataUrl } },
      }) as any

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(updateResult.errors[0].message)
      }

      setProfile(prev => prev ? { ...prev, profilePictureKey: dataUrl } : prev)
      setProfilePicUrl(dataUrl)
    } catch (err: any) {
      console.error('Error saving picture:', err)
      setSaveError('Photo save failed: ' + (err?.message || 'Please try again.'))
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

  const email = user?.signInDetails?.loginId || ''
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const isDirty = displayName.trim() !== (profile?.displayName || '') || bio.trim() !== (profile?.bio || '') || teachingVoice.trim() !== (profile?.teachingVoice || '')

  if (checking) return null

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--page-bg)', minHeight: '100vh' }}>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
      <TeacherNav />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--foreground)', marginBottom: '8px' }}>My Profile</h1>
        <p style={{ color: 'var(--gray-mid)', fontSize: '14px', marginBottom: '40px' }}>Update your photo, display name, and account settings.</p>

        {loading ? (
          <p style={{ color: 'var(--gray-mid)' }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Profile photo */}
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
                    {displayName || 'Melinda'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '12px' }}>{email}</p>
                  <button
                    onClick={() => !uploadingPic && fileInputRef.current?.click()}
                    disabled={uploadingPic}
                    style={{ background: 'var(--plum-light)', color: 'var(--plum)', border: '1px solid var(--plum-mid)', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    {uploadingPic ? 'Uploading…' : 'Change Photo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Display info */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '20px' }}>About</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Display Name</label>
                  <input
                    style={inputStyle}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Melinda Johnson"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-dark)', display: 'block', marginBottom: '6px' }}>Bio <span style={{ fontWeight: 400, color: 'var(--gray-mid)' }}>(optional — shown to students)</span></label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="A short note about yourself or your teaching style…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={saveInfo}
                  disabled={saving || !isDirty}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: isDirty ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 500, opacity: isDirty ? 1 : 0.5 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {saved && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>✓ Saved!</span>}
                {saveError && <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 500 }}>{saveError}</span>}
              </div>
            </div>

            {/* Teaching Voice for AI */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius)', padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: '6px' }}>AI Grading Voice</div>
              <p style={{ fontSize: '13px', color: 'var(--gray-mid)', marginBottom: '8px', lineHeight: 1.5 }}>
                Tell the AI exactly how to write grade comments — tone, length, what to focus on. The more specific you are, the better it will match your style. You can update this anytime as you see what's working.
              </p>
              <div style={{ background: 'var(--page-bg)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: 'var(--gray-mid)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--gray-dark)' }}>Tips:</strong> Be specific about length ("1 sentence max"), tone ("encouraging but direct"), what to name ("always mention the specific problem number"), and what to avoid ("never say great job without a reason"). You can also paste in a good example comment to show the style you want.
              </div>
              <textarea
                value={teachingVoice}
                onChange={e => setTeachingVoice(e.target.value)}
                placeholder={`Examples of what works well here:\n\n"Keep comments to 1–2 sentences. Start with what they got right, then name the specific mistake. Never be vague — say 'you forgot to carry the 1 in step 2' not 'check your work.'"\n\n"Be warm but efficient. I don't want long paragraphs. Focus on the biggest mistake only."\n\n"Use phrases I actually say: 'Nice work!', 'Watch out for...', 'Here's the trick:'. Sound like a real teacher, not a robot."`}
                rows={8}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={saveInfo}
                  disabled={saving || !isDirty}
                  style={{ background: 'var(--plum)', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: isDirty ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 500, opacity: isDirty ? 1 : 0.5 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {saved && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>✓ Saved!</span>}
              </div>
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
