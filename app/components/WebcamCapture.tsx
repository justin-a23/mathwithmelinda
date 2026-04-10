'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Props = {
  onCapture: (file: File) => void
}

export default function WebcamCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<'requesting' | 'active' | 'denied' | 'unsupported'>('requesting')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string | undefined>()
  const [captureCount, setCaptureCount] = useState(0)

  const startCamera = useCallback(async (deviceId?: string) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      // Don't attach to video here — the video element may not be mounted yet.
      // A separate useEffect handles attaching the stream once the element exists.
      setState('active')

      // Enumerate cameras after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      setCameras(videoDevices)
      if (!activeCameraId && videoDevices.length > 0) {
        const track = stream.getVideoTracks()[0]
        setActiveCameraId(track.getSettings().deviceId)
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setState('denied')
      } else {
        setState('unsupported')
      }
    }
  }, [activeCameraId])

  // Attach stream to video element once both exist.
  // This runs after setState('active') triggers a re-render that mounts <video>.
  useEffect(() => {
    if (state !== 'active') return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    video.srcObject = stream
    video.play().catch(() => {})
  }, [state])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchCamera = useCallback(() => {
    if (cameras.length < 2) return
    const currentIndex = cameras.findIndex(c => c.deviceId === activeCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextId = cameras[nextIndex].deviceId
    setActiveCameraId(nextId)
    startCamera(nextId)
  }, [cameras, activeCameraId, startCamera])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Video not ready yet
    if (video.readyState < 2 || video.videoWidth === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const count = captureCount + 1
        setCaptureCount(count)
        const file = new File([blob], `webcam-page-${count}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      },
      'image/jpeg',
      0.92
    )
  }, [captureCount, onCapture])

  // ─── DENIED STATE ────────────────────────────────────────
  if (state === 'denied') {
    return (
      <div style={boxStyle}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--plum, #7B4FA6)' }}>
          Camera access denied
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray-mid, #7A7A96)' }}>
          Please allow camera access in your browser settings, then reload this page.
          Or use one of the other upload options.
        </p>
      </div>
    )
  }

  // ─── UNSUPPORTED STATE ───────────────────────────────────
  if (state === 'unsupported') {
    return (
      <div style={boxStyle}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--plum, #7B4FA6)' }}>
          Camera not available
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray-mid, #7A7A96)' }}>
          Your browser doesn&apos;t support camera access, or no camera was found.
          Try using the &quot;Upload Files&quot; or &quot;Phone Camera&quot; option instead.
        </p>
      </div>
    )
  }

  // ─── REQUESTING STATE ────────────────────────────────────
  if (state === 'requesting') {
    return (
      <div style={boxStyle}>
        <p style={{ margin: 0, color: 'var(--gray-mid, #7A7A96)' }}>
          Requesting camera access...
        </p>
      </div>
    )
  }

  // ─── ACTIVE CAMERA ──────────────────────────────────────
  return (
    <div>
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', display: 'block' }}
        />
        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Switch Camera
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={capture}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--plum, #7B4FA6)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {captureCount === 0 ? 'Capture Page' : 'Capture Next Page'}
        </button>
      </div>

      {captureCount > 0 && (
        <p style={{ fontSize: '13px', color: 'var(--gray-mid, #7A7A96)', marginTop: '8px', textAlign: 'center' }}>
          {captureCount} page{captureCount !== 1 ? 's' : ''} captured. Hold your paper steady and click capture for each page.
        </p>
      )}
    </div>
  )
}

const boxStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  border: '1px dashed var(--gray-light, #EBEBF3)',
  borderRadius: '8px',
}
