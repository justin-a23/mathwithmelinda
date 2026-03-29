'use client'

import { useEffect, useRef, useState } from 'react'

const CROP_SIZE = 280  // diameter of the circular crop area (CSS px)
const CONTAINER = 340  // total draggable canvas size

interface Props {
  imageSrc: string            // object URL of the selected file
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })
  const [minScale, setMinScale] = useState(1)

  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const lastTouchDist = useRef<number | null>(null)

  // Non-passive wheel listener (React's onWheel may be passive in some versions)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = 1 - e.deltaY * 0.0008
      setScale(prev => {
        const next = Math.max(minScale, Math.min(prev * factor, minScale * 8))
        setOffset(o => clampOffset(o.x, o.y, next, naturalSize, minScale))
        return next
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [minScale, naturalSize])

  function clampOffset(ox: number, oy: number, s: number, ns: { w: number; h: number }, ms: number) {
    // Ensure the image always covers the crop circle
    const maxX = Math.max(0, (ns.w * s - CROP_SIZE) / 2)
    const maxY = Math.max(0, (ns.h * s - CROP_SIZE) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  function handleLoad() {
    const img = imgRef.current
    if (!img) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const ns = { w: nw, h: nh }
    setNaturalSize(ns)
    const init = Math.max(CROP_SIZE / nw, CROP_SIZE / nh)
    setMinScale(init)
    setScale(init)
    setOffset({ x: 0, y: 0 })
    setLoaded(true)
  }

  // Mouse drag
  function handleMouseDown(e: React.MouseEvent) {
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale, naturalSize, minScale))
  }

  function stopDrag() { dragging.current = false }

  // Touch drag + pinch zoom
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      dragging.current = true
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastTouchDist.current = null
    } else if (e.touches.length === 2) {
      dragging.current = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x
      const dy = e.touches[0].clientY - lastPos.current.y
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale, naturalSize, minScale))
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / lastTouchDist.current
      lastTouchDist.current = dist
      setScale(prev => {
        const next = Math.max(minScale, Math.min(prev * ratio, minScale * 8))
        setOffset(o => clampOffset(o.x, o.y, next, naturalSize, minScale))
        return next
      })
    }
  }

  function handleConfirm() {
    const img = imgRef.current
    if (!img || !loaded) return

    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate what portion of the natural image maps to the crop circle.
    // Image center in container coords: (CONTAINER/2 + offset.x, CONTAINER/2 + offset.y)
    // Crop circle center: (CONTAINER/2, CONTAINER/2)
    // In natural image coords, crop center = (nw/2 - offset.x/scale, nh/2 - offset.y/scale)
    const nw = naturalSize.w
    const nh = naturalSize.h
    const naturalCropCenterX = nw / 2 - offset.x / scale
    const naturalCropCenterY = nh / 2 - offset.y / scale
    const naturalHalf = (CROP_SIZE / 2) / scale

    const sx = Math.max(0, naturalCropCenterX - naturalHalf)
    const sy = Math.max(0, naturalCropCenterY - naturalHalf)
    const sSize = CROP_SIZE / scale

    // Clip output to a circle and draw the cropped region
    ctx.beginPath()
    ctx.arc(100, 100, 100, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, 200, 200)

    canvas.toBlob(blob => {
      if (blob) onConfirm(blob)
    }, 'image/jpeg', 0.85)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: 'var(--background)', borderRadius: '16px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        width: `${CONTAINER + 56}px`, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
            Position your photo
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-mid)', margin: '4px 0 0' }}>
            Drag to move · Scroll or pinch to zoom
          </p>
        </div>

        {/* Crop canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrag}
          style={{
            position: 'relative',
            width: `${CONTAINER}px`,
            height: `${CONTAINER}px`,
            background: '#1a1a1a',
            borderRadius: '10px',
            overflow: 'hidden',
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
            alignSelf: 'center',
          }}
        >
          {/* The image — centered with offset + scale */}
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={handleLoad}
            draggable={false}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Dark overlay with circular hole via box-shadow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${CROP_SIZE}px`,
            height: `${CROP_SIZE}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
            border: '2px solid rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          {/* Corner hint labels */}
          {loaded && (
            <div style={{
              position: 'absolute', bottom: '12px', left: 0, right: 0,
              textAlign: 'center', color: 'rgba(255,255,255,0.45)',
              fontSize: '11px', pointerEvents: 'none',
            }}>
              drag to reposition
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent', border: '1px solid var(--gray-light)',
              color: 'var(--gray-mid)', padding: '9px 22px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '14px',
            }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!loaded}
            style={{
              background: loaded ? 'var(--plum)' : 'var(--gray-light)',
              color: 'white', border: 'none', padding: '9px 26px', borderRadius: '8px',
              cursor: loaded ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 500,
            }}>
            Use Photo
          </button>
        </div>
      </div>
    </div>
  )
}
