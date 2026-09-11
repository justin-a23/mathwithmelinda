'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { apiFetch } from '@/app/lib/apiFetch'

export type QrTokenState = {
  tokenId: string
  expiresAt: number
  url: string
  qrDataUrl: string
}

type Options = {
  /** Request body for POST /api/upload-token — {lessonId} or {purpose:'ticket'} etc. */
  body: Record<string, unknown>
  /** Called with keys not seen before, as the phone uploads them. */
  onNewKeys: (keys: string[]) => void
}

/**
 * Mint a phone-upload token, render its QR, and poll the token status for
 * uploaded keys — the block previously duplicated in SubmissionMethodPicker
 * and the Grade Work graded-pages panel.
 *
 * The poll interval is cleared on unmount, on regenerate, and on expiry —
 * leaked intervals here are a known bug class, keep all three.
 */
export function useQrUploadToken({ body, onNewKeys }: Options) {
  const [tokenState, setTokenState] = useState<QrTokenState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const knownKeysRef = useRef(new Set<string>())
  const onNewKeysRef = useRef(onNewKeys)
  onNewKeysRef.current = onNewKeys

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const generate = useCallback(async () => {
    setLoading(true)
    setError('')
    knownKeysRef.current.clear()
    if (pollRef.current) clearInterval(pollRef.current)

    try {
      const res = await apiFetch('/api/upload-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create upload link')
      const data = await res.json()

      const qrDataUrl = await QRCode.toDataURL(data.url, {
        width: 256,
        margin: 2,
        color: { dark: '#1E1E2E', light: '#FFFFFF' },
      })

      setTokenState({ tokenId: data.tokenId, expiresAt: data.expiresAt, url: data.url, qrDataUrl })

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

          const newKeys = (status.uploadedKeys || []).filter((k: string) => !knownKeysRef.current.has(k))
          if (newKeys.length > 0) {
            newKeys.forEach((k: string) => knownKeysRef.current.add(k))
            onNewKeysRef.current(newKeys)
          }
        } catch {
          // Polling failure is not critical
        }
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
    // body is a fresh object literal at most call sites — stringify for stability
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(body)])

  // Countdown; expiry also stops the poll.
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

  return { tokenState, loading, error, timeLeft, generate }
}
