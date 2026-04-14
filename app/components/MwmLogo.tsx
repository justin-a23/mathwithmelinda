'use client'

/**
 * MWM Brand Logo — bubbly overlapping MWM monogram with amber plus accent.
 *
 * Variants:
 *   dark  — for dark backgrounds (nav bars, charcoal sections). White W, plum-light M's.
 *   light — for light backgrounds. Plum W, white M's.
 *
 * Usage:
 *   <MwmLogo size={36} />                    — nav icon only
 *   <MwmLogo size={36} showWordmark />       — icon + "Math with Melinda" text
 *   <MwmLogo size={36} showWordmark badge="Parent" />  — with role badge
 */

type Props = {
  size?: number
  variant?: 'dark' | 'light'
  showWordmark?: boolean
  badge?: string
}

/** The MWM monogram mark — renders at the given size */
function MwmMark({ size = 36, variant = 'dark' }: { size?: number; variant?: 'dark' | 'light' }) {
  if (variant === 'light') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" rx="20" fill="rgba(123,79,166,0.1)"/>
        <g transform="translate(14, 28)">
          <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60"
            stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60"
            stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4"
            stroke="#4E2B72" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4"
            stroke="#7B4FA6" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60"
            stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60"
            stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    )
  }

  // Dark variant (default) — for dark nav backgrounds
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="20" fill="rgba(123,79,166,0.25)"/>
      <g transform="translate(14, 28)">
        <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60"
          stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        <path d="M0,60 C0,60 0,4 4,4 C8,4 15,38 23,38 C31,38 33,4 39,4 C43,4 45,60 45,60"
          stroke="#EFE6F8" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4"
          stroke="#7B4FA6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M34,4 C34,4 33,60 39,60 C45,60 52,19 59,19 C66,19 68,60 75,60 C82,60 81,4 81,4"
          stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60"
          stroke="#A478C8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        <path d="M70,60 C70,60 70,4 74,4 C78,4 86,38 94,38 C102,38 103,4 108,4 C112,4 114,60 114,60"
          stroke="#EFE6F8" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  )
}

export default function MwmLogo({ size = 36, variant = 'dark', showWordmark = false, badge }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MwmMark size={size} variant={variant} />
      {showWordmark && (
        <>
          <span style={{
            fontFamily: 'var(--font-display)',
            color: variant === 'dark' ? 'white' : 'var(--foreground, #1E1E2E)',
            fontSize: '20px',
          }}>
            Math with Melinda
          </span>
          {badge && (
            <span style={{
              background: variant === 'dark' ? 'rgba(255,255,255,0.15)' : 'var(--plum-light, #EFE6F8)',
              color: variant === 'dark' ? 'white' : 'var(--plum, #7B4FA6)',
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: '20px',
            }}>
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  )
}

export { MwmMark }
