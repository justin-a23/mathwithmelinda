'use client'

/**
 * MWM Brand Logo — bubbly overlapping MWM monogram with amber plus accent.
 * Paths exported from Sketch (Sketch_logos.sketch) for pixel-perfect rendering.
 *
 * Variants:
 *   dark  — for dark backgrounds (nav bars). Plum-light M's, white W.
 *   plum  — for plum backgrounds. Deep plum outlines, light fills.
 *   light — for light backgrounds. Plum W, white M's.
 *
 * Usage:
 *   <MwmLogo size={36} />                    — nav icon only
 *   <MwmLogo size={36} showWordmark />       — icon + "Math with Melinda" text
 *   <MwmLogo size={36} showWordmark badge="Parent" />  — with role badge
 */

type Props = {
  size?: number
  variant?: 'dark' | 'plum' | 'light'
  showWordmark?: boolean
  badge?: string
}

/*
 * Shared path data from Sketch export (viewBox 0 0 454 220).
 * The MWM letters + amber plus, no background.
 */
const LEFT_M = "M96,162 C96,162 96,60 104,60 C112,60 124,122 138,122 C152,122 156,60 168,60 C176,60 178,162 178,162"
const W_PATH = "M177,60 C177,60 175,162 187,162 C199,162 211,87 223,87 C235,87 240,162 253,162 C265,162 263,60 263,60"
const RIGHT_M = "M256,162 C256,162 256,60 264,60 C272,60 286,122 300,122 C314,122 316,60 326,60 C334,60 336,162 336,162"
// Amber plus (two rounded rects)
const PLUS_H = "M386,89 C386,87.896 385.104,87 384,87 L372,87 C370.896,87 370,87.896 370,89 C370,90.104 370.896,91 372,91 L384,91 C385.104,91 386,90.104 386,89 Z"
const PLUS_V = "M380,83 C380,81.896 379.104,81 378,81 C376.896,81 376,81.896 376,83 L376,95 C376,96.104 376.896,97 378,97 C379.104,97 380,96.104 380,95 L380,83 Z"

type ColorSet = {
  mOuter: string
  mOuterOpacity: number
  mInner: string
  wOuter: string
  wInner: string
  bg: string
}

const COLORS: Record<string, ColorSet> = {
  dark: {
    mOuter: '#A478C8',
    mOuterOpacity: 0.85,
    mInner: '#EFE6F8',
    wOuter: '#7B4FA6',
    wInner: 'white',
    bg: 'rgba(123,79,166,0.25)',
  },
  plum: {
    mOuter: '#4E2B72',
    mOuterOpacity: 0.7,
    mInner: '#EFE6F8',
    wOuter: '#4E2B72',
    wInner: 'white',
    bg: '#7B4FA6',
  },
  light: {
    mOuter: '#A478C8',
    mOuterOpacity: 0.6,
    mInner: 'white',
    wOuter: '#4E2B72',
    wInner: '#7B4FA6',
    bg: 'rgba(123,79,166,0.1)',
  },
}

function MwmMark({ size = 36, variant = 'dark' }: { size?: number; variant?: 'dark' | 'plum' | 'light' }) {
  const c = COLORS[variant] || COLORS.dark

  return (
    <svg width={size} height={size} viewBox="60 30 340 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect x="60" y="30" width="340" height="170" rx="20" fill={c.bg} />
      {/* Left M */}
      <path d={LEFT_M} stroke={c.mOuter} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity={c.mOuterOpacity} />
      <path d={LEFT_M} stroke={c.mInner} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      {/* W (on top) */}
      <path d={W_PATH} stroke={c.wOuter} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d={W_PATH} stroke={c.wInner} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right M */}
      <path d={RIGHT_M} stroke={c.mOuter} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity={c.mOuterOpacity} />
      <path d={RIGHT_M} stroke={c.mInner} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      {/* Amber plus */}
      <path d={PLUS_H} fill="#F2C94C" />
      <path d={PLUS_V} fill="#F2C94C" />
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
            color: variant === 'light' ? 'var(--foreground, #1E1E2E)' : 'white',
            fontSize: `${Math.round(size * 0.56)}px`,
          }}>
            Math with Melinda
          </span>
          {badge && (
            <span style={{
              background: variant === 'light' ? 'var(--plum-light, #EFE6F8)' : 'rgba(255,255,255,0.15)',
              color: variant === 'light' ? 'var(--plum, #7B4FA6)' : 'white',
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
