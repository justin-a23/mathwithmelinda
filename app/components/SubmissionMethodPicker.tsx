'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import WebcamCapture from './WebcamCapture'
import { apiFetch } from '../lib/apiFetch'

type UploadedFile = {
  uid: string
  name: string
  key: string
  status: 'uploading' | 'done' | 'error'
  progress: number
  previewUrl?: string
  warning?: string
}

type Props = {
  lessonId: string
  files: UploadedFile[]
  onUploadFile: (file: File) => void
  onAddQrFiles: (keys: string[]) => void
  hasShowWork: boolean
}

type Tab = 'phone' | 'upload' | 'webcam'

type TokenState = {
  tokenId: string
  expiresAt: number
  url: string
  qrDataUrl: string
}

export default function SubmissionMethodPicker({ lessonId, files, onUploadFile, onAddQrFiles, hasShowWork }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [showPhotoTips, setShowPhotoTips] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // QR token state
  const [tokenState, setTokenState] = useState<TokenState | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [qrUploadedKeys, setQrUploadedKeys] = useState<string[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const knownKeysRef = useRef(new Set<string>())

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // ─── QR TOKEN GENERATION ─────────────────────────────────────────

  const generateToken = useCallback(async () => {
    setTokenLoading(true)
    setTokenError('')
    setQrUploadedKeys([])
    knownKeysRef.current.clear()
    if (pollRef.current) clearInterval(pollRef.current)

    try {
      const res = await apiFetch('/api/upload-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      if (!res.ok) throw new Error('Failed to create upload link')
      const data = await res.json()

      // Generate QR code data URL
      const qrDataUrl = await QRCode.toDataURL(data.url, {
        width: 256,
        margin: 2,
        color: { dark: '#1E1E2E', light: '#FFFFFF' },
      })

      setTokenState({
        tokenId: data.tokenId,
        expiresAt: data.expiresAt,
        url: data.url,
        qrDataUrl,
      })

      // Start polling for uploads
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiFetch(`/api/upload-token/${data.tokenId}/status`)
          if (!statusRes.ok) return
          const status = await statusRes.json()

          if (status.expired) {
            if (pollRef.current) clearInterval(pollRef.current)
            setTokenState(null)
            return
          }

          // Check for new keys
          const newKeys = (status.uploadedKeys || []).filter((k: string) => !knownKeysRef.current.has(k))
          if (newKeys.length > 0) {
            newKeys.forEach((k: string) => knownKeysRef.current.add(k))
            setQrUploadedKeys(prev => [...prev, ...newKeys])
            onAddQrFiles(newKeys)
          }
        } catch {
          // Polling failure is not critical
        }
      }, 3000)
    } catch (err: any) {
      setTokenError(err.message || 'Failed to generate QR code')
    } finally {
      setTokenLoading(false)
    }
  }, [lessonId, onAddQrFiles])

  // ─── TIME REMAINING ──────────────────────────────────────────────

  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!tokenState) { setTimeLeft(0); return }
    const tick = () => {
      const remaining = tokenState.expiresAt - Math.floor(Date.now() / 1000)
      setTimeLeft(Math.max(0, remaining))
      if (remaining <= 0) {
        setTokenState(null)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [tokenState])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ─── TABS ────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'upload', label: 'Upload Files', icon: '📁' },
    { key: 'phone', label: 'Phone Camera', icon: '📱' },
    { key: 'webcam', label: 'Computer Camera', icon: '📷' },
  ]

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Header row with label + photo tips toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-dark)' }}>
          {hasShowWork ? 'Upload your show-work sheet' : 'Photos of your work'}
        </label>
        <button
          onClick={() => setShowPhotoTips(t => !t)}
          style={{ background: 'none', border: '1px solid var(--gray-light)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--plum)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {showPhotoTips ? 'Hide tips' : 'Photo tips'}
        </button>
      </div>

      {/* Collapsible photo tips panel */}
      {showPhotoTips && (
        <div style={{ background: 'rgba(123,79,166,0.05)', border: '1px solid var(--plum-mid)', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--plum)', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>How to take a great photo</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              ['Hold your phone upright (portrait), not sideways'],
              ['Use good lighting \u2014 no shadows covering your work'],
              ['Lay the paper flat on a table and shoot straight down'],
              ['Get close enough that all writing fills the frame'],
              ['Check the photo before uploading \u2014 is everything readable?'],
            ].map((tip, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4 }}>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasShowWork && (
        <p style={{ fontSize: '12px', color: 'var(--gray-mid)', margin: '0 0 8px' }}>
          Print the show-work sheet above, complete the problems on paper, then take a photo and upload it here.
        </p>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: 'var(--gray-light)', borderRadius: '8px', padding: '3px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#fff' : 'var(--gray-dark)',
              background: activeTab === tab.key ? 'var(--plum)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── UPLOAD FILES TAB ───────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(onUploadFile) }}
            style={{
              border: '2px dashed var(--plum-mid)',
              borderRadius: 'var(--radius)',
              padding: files.length > 0 ? '16px' : '28px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(123,79,166,0.03)',
              transition: 'background 0.15s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.pdf,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onUploadFile) }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--plum)" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.7 }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={{ color: 'var(--plum)', fontSize: '14px', fontWeight: 600 }}>
              {files.length > 0 ? 'Add another photo' : 'Tap to take a photo or choose a file'}
            </div>
            <div style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '4px' }}>JPG, PNG, HEIC, PDF</div>
          </div>
        </div>
      )}

      {/* ─── PHONE CAMERA TAB (QR) ─────────────────────────────── */}
      {activeTab === 'phone' && (
        <div style={{ textAlign: 'center' }}>
          {!tokenState && !tokenLoading && (
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--gray-dark)', margin: '0 0 16px', lineHeight: 1.5 }}>
                Generate a QR code to scan with your phone. You can take photos and they will appear here automatically.
              </p>
              <button
                onClick={generateToken}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--plum)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Generate QR Code
              </button>
              {tokenError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{tokenError}</p>}
            </div>
          )}

          {tokenLoading && (
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--gray-mid)' }}>Generating upload link...</p>
            </div>
          )}

          {tokenState && (
            <div style={{ padding: '12px' }}>
              <img
                src={tokenState.qrDataUrl}
                alt="Scan this QR code with your phone camera"
                style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--gray-dark)', margin: '12px 0 4px', fontWeight: 600 }}>
                Scan with your phone camera
              </p>
              <p style={{ fontSize: '12px', color: 'var(--gray-mid)', margin: '0 0 12px' }}>
                Expires in {formatTime(timeLeft)}
              </p>

              {qrUploadedKeys.length > 0 && (
                <div style={{
                  background: 'rgba(123,79,166,0.05)',
                  border: '1px solid var(--plum-mid)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '8px',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--plum)', fontWeight: 600, margin: 0 }}>
                    {qrUploadedKeys.length} photo{qrUploadedKeys.length !== 1 ? 's' : ''} received from phone
                  </p>
                </div>
              )}

              <button
                onClick={generateToken}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--plum)',
                  background: 'transparent',
                  border: '1px solid var(--gray-light)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Generate New Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── WEBCAM TAB ─────────────────────────────────────────── */}
      {activeTab === 'webcam' && (
        <div>
          <WebcamCapture onCapture={onUploadFile} />
        </div>
      )}
    </div>
  )
}
