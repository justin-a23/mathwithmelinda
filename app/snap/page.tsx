'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type PhotoEntry = {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export default function SnapPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [remainingUploads, setRemainingUploads] = useState(10)
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidating(false)
      setErrorMsg('No upload token provided. Please scan the QR code from your computer.')
      return
    }
    fetch(`/api/mobile-upload/validate?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        setValid(data.valid)
        if (data.valid) {
          setRemainingUploads(data.remainingUploads ?? 10)
        } else {
          setErrorMsg(
            data.reason === 'Token expired'
              ? 'This upload link has expired. Go back to your computer and generate a new QR code.'
              : data.reason === 'Maximum uploads reached'
              ? 'You have already uploaded the maximum number of photos for this assignment.'
              : 'This upload link is not valid. Please scan the QR code again from your computer.'
          )
        }
      })
      .catch(() => {
        setErrorMsg('Could not verify the upload link. Check your internet connection and try again.')
      })
      .finally(() => setValidating(false))
  }, [token])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos: PhotoEntry[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      })
    }
    setPhotos(prev => [...prev, ...newPhotos])
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) URL.revokeObjectURL(photo.previewUrl)
      return prev.filter(p => p.id !== id)
    })
  }, [])

  const uploadAll = useCallback(async () => {
    const pending = photos.filter(p => p.status === 'pending')
    if (pending.length === 0) return

    setUploading(true)
    let successCount = 0

    for (const photo of pending) {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p))

      try {
        const formData = new FormData()
        formData.append('file', photo.file)

        const res = await fetch(`/api/mobile-upload?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Upload failed')
        }

        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'done' } : p))
        successCount++
        setRemainingUploads(prev => Math.max(0, prev - 1))
      } catch (err: any) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'error' } : p))
        // If token expired or maxed out, stop trying
        if (err.message?.includes('expired') || err.message?.includes('Maximum')) {
          setErrorMsg(err.message)
          break
        }
      }
    }

    setUploading(false)
    if (successCount > 0 && photos.every(p => p.status === 'done' || p.status === 'error')) {
      setAllDone(true)
    }
  }, [photos, token])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.previewUrl))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = photos.filter(p => p.status === 'pending').length
  const doneCount = photos.filter(p => p.status === 'done').length
  const canAddMore = remainingUploads - photos.filter(p => p.status !== 'error').length > 0

  // ─── LOADING STATE ──────────────────────────────────────────────
  if (validating) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying upload link...</p>
        </div>
      </div>
    )
  }

  // ─── ERROR STATE ────────────────────────────────────────────────
  if (!valid || errorMsg) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>
          <p style={styles.errorText}>{errorMsg}</p>
        </div>
      </div>
    )
  }

  // ─── ALL DONE STATE ─────────────────────────────────────────────
  if (allDone) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.checkIcon}>&#10003;</div>
          <h2 style={styles.doneTitle}>
            {doneCount} photo{doneCount !== 1 ? 's' : ''} uploaded!
          </h2>
          <p style={styles.doneText}>
            Go back to your computer to finish submitting your assignment.
          </p>
        </div>
      </div>
    )
  }

  // ─── MAIN CAPTURE UI ───────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Math with Melinda</h1>
        <p style={styles.subtitle}>Take photos of your homework</p>

        {/* Hidden file input — opens native camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <div style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <div key={photo.id} style={styles.photoThumb}>
                <img src={photo.previewUrl} alt={`Page ${index + 1}`} style={styles.thumbImg} />
                <div style={styles.pageLabel}>Page {index + 1}</div>
                {photo.status === 'uploading' && (
                  <div style={styles.thumbOverlay}>
                    <div style={styles.miniSpinner} />
                  </div>
                )}
                {photo.status === 'done' && (
                  <div style={{ ...styles.thumbOverlay, ...styles.thumbDone }}>&#10003;</div>
                )}
                {photo.status === 'error' && (
                  <div style={{ ...styles.thumbOverlay, ...styles.thumbError }}>!</div>
                )}
                {photo.status === 'pending' && (
                  <button
                    onClick={() => removePhoto(photo.id)}
                    style={styles.removeBtn}
                    aria-label={`Remove page ${index + 1}`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.actions}>
          {canAddMore && !uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={photos.length === 0 ? styles.primaryBtn : styles.secondaryBtn}
            >
              {photos.length === 0 ? 'Take Photo' : '+ Add Another Page'}
            </button>
          )}

          {/* Also allow choosing from gallery */}
          {canAddMore && !uploading && (
            <button
              onClick={() => {
                // Create a temporary input without capture to open gallery
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.multiple = true
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (!files) return
                  const newPhotos: PhotoEntry[] = []
                  for (let i = 0; i < files.length; i++) {
                    newPhotos.push({
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      file: files[i],
                      previewUrl: URL.createObjectURL(files[i]),
                      status: 'pending',
                    })
                  }
                  setPhotos(prev => [...prev, ...newPhotos])
                }
                input.click()
              }}
              style={styles.textBtn}
            >
              Choose from gallery
            </button>
          )}

          {pendingCount > 0 && !uploading && (
            <button onClick={uploadAll} style={styles.uploadBtn}>
              Upload {pendingCount} Photo{pendingCount !== 1 ? 's' : ''}
            </button>
          )}

          {uploading && (
            <p style={styles.uploadingText}>Uploading... please wait</p>
          )}

          {doneCount > 0 && !uploading && pendingCount === 0 && (
            <button onClick={() => setAllDone(true)} style={styles.doneBtn}>
              Done — Go Back to Computer
            </button>
          )}
        </div>

        <p style={styles.remaining}>
          {remainingUploads - photos.filter(p => p.status !== 'error').length} photo{remainingUploads !== 1 ? 's' : ''} remaining
        </p>
      </div>
    </div>
  )
}

// ─── INLINE STYLES (mobile-first, no external CSS dependency) ──────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: '#F5F3F8',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px 24px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 2px 16px rgba(123,79,166,0.1)',
  },
  title: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '22px',
    color: '#7B4FA6',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#7A7A96',
    margin: '0 0 24px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '20px',
  },
  photoThumb: {
    position: 'relative',
    aspectRatio: '3/4',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #EBEBF3',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  pageLabel: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 0',
  },
  thumbOverlay: {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.7)',
  },
  thumbDone: {
    background: 'rgba(123,79,166,0.15)',
    color: '#7B4FA6',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  thumbError: {
    background: 'rgba(220,50,50,0.15)',
    color: '#D32F2F',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  removeBtn: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '16px',
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSpinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #EBEBF3',
    borderTopColor: '#7B4FA6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    background: '#7B4FA6',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#7B4FA6',
    background: '#EFE6F8',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  textBtn: {
    padding: '8px',
    fontSize: '14px',
    color: '#7A7A96',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  uploadBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    background: '#4E2B72',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  doneBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    background: '#7B4FA6',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  uploadingText: {
    fontSize: '15px',
    color: '#7B4FA6',
    fontWeight: '600',
  },
  remaining: {
    fontSize: '13px',
    color: '#7A7A96',
    marginTop: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    margin: '0 auto 16px',
    border: '4px solid #EBEBF3',
    borderTopColor: '#7B4FA6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '15px',
    color: '#7A7A96',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    background: '#FDECEA',
    color: '#D32F2F',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: '15px',
    color: '#3C3C50',
    lineHeight: '1.5',
  },
  checkIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    background: '#EFE6F8',
    color: '#7B4FA6',
    fontSize: '32px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '20px',
    color: '#7B4FA6',
    margin: '0 0 8px',
  },
  doneText: {
    fontSize: '15px',
    color: '#7A7A96',
    lineHeight: '1.5',
  },
}
