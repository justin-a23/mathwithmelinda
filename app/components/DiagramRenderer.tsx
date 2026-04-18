'use client'

/**
 * DiagramRenderer — renders math diagrams from a JSON spec.
 *
 * Takes a spec string (stored in AssignmentQuestion.diagramSpec) and renders
 * as inline SVG. All diagrams are:
 *   - Pixel-perfect at any zoom (SVG)
 *   - Print-friendly (dark lines, no dark-mode-only colors)
 *   - Copyright-original (generated from scratch each render)
 *
 * Supported types:
 *   - number-line        → labeled number line with optional plotted points
 *   - coord-plane        → x/y plane with optional lines and points
 *   - triangle           → triangle with labeled sides/angles
 *   - rectangle          → rectangle with labeled sides
 *   - circle             → circle with optional labeled radius/diameter
 *   - svg                → raw SVG passthrough (escape hatch for novel cases)
 *
 * Spec is a JSON string. The `type` field selects the renderer.
 * Invalid specs render as a small warning badge — never crash the page.
 */

import React, { useMemo } from 'react'

type NumberLinePoint = {
  value: number
  label?: string
  /** open (○) vs closed (●) circle — used for inequalities */
  closed?: boolean
  /** optional color override */
  color?: string
}

type NumberLineSpec = {
  type: 'number-line'
  range: [number, number]
  /** tick interval; default 1 */
  step?: number
  points?: NumberLinePoint[]
  /** optional shaded region e.g. for x > 3 */
  shade?: {
    from: number | '-infinity'
    to: number | 'infinity'
  }
  /** optional title/caption under the line */
  caption?: string
}

type CoordLine = {
  /** e.g. "y = 2x + 1" or "x = 3" or "y = -x" */
  equation: string
  color?: string
  /** dashed/dotted for asymptotes or reference */
  style?: 'solid' | 'dashed' | 'dotted'
}

type CoordPoint = {
  x: number
  y: number
  label?: string
  color?: string
}

type CoordPlaneSpec = {
  type: 'coord-plane'
  xRange: [number, number]
  yRange: [number, number]
  /** grid step; default 1 */
  step?: number
  lines?: CoordLine[]
  points?: CoordPoint[]
  caption?: string
}

type TriangleSpec = {
  type: 'triangle'
  /** side labels — "a", "5", "x" etc */
  sides?: [string?, string?, string?]
  /** angle labels at vertices A, B, C */
  angles?: [string?, string?, string?]
  /** optional: isoceles / right / equilateral shape */
  shape?: 'right' | 'equilateral' | 'isoceles' | 'scalene'
  caption?: string
}

type RectangleSpec = {
  type: 'rectangle'
  /** width label (bottom side) */
  width?: string
  /** height label (right side) */
  height?: string
  /** aspect ratio for drawing; default 1.6 */
  aspect?: number
  caption?: string
}

type CircleSpec = {
  type: 'circle'
  /** label for the radius or diameter */
  radiusLabel?: string
  diameterLabel?: string
  caption?: string
}

type RawSvgSpec = {
  type: 'svg'
  svg: string
  caption?: string
}

type DiagramSpec =
  | NumberLineSpec
  | CoordPlaneSpec
  | TriangleSpec
  | RectangleSpec
  | CircleSpec
  | RawSvgSpec

const DEFAULT_COLOR = '#7B4FA6' // plum
const AXIS_COLOR = '#4A4A62'
const TICK_COLOR = '#6b7280'
const LABEL_COLOR = '#1a1a2e'
const GRID_COLOR = '#e5e7eb'

// ─────────────────────────────────────────────────────────────────────────────

function parseSpec(raw: string): DiagramSpec | null {
  if (!raw || !raw.trim()) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.type) return null
    return parsed as DiagramSpec
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Number Line

function NumberLine({ spec }: { spec: NumberLineSpec }) {
  const [min, max] = spec.range
  const step = spec.step ?? 1
  const width = 480
  const height = 80
  const padding = 32
  const usableWidth = width - padding * 2
  const xFor = (v: number) => padding + ((v - min) / (max - min)) * usableWidth

  // Generate ticks
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)))
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }}>
      {/* Shaded region */}
      {spec.shade && (() => {
        const fromX = spec.shade.from === '-infinity' ? padding : xFor(spec.shade.from as number)
        const toX = spec.shade.to === 'infinity' ? width - padding : xFor(spec.shade.to as number)
        return (
          <rect x={Math.min(fromX, toX)} y={35} width={Math.abs(toX - fromX)} height={6} fill={DEFAULT_COLOR} opacity={0.25} />
        )
      })()}

      {/* Main line with arrows */}
      <line x1={padding - 8} y1={38} x2={width - padding + 8} y2={38} stroke={AXIS_COLOR} strokeWidth={1.5} />
      <polygon points={`${padding - 10},38 ${padding - 2},34 ${padding - 2},42`} fill={AXIS_COLOR} />
      <polygon points={`${width - padding + 10},38 ${width - padding + 2},34 ${width - padding + 2},42`} fill={AXIS_COLOR} />

      {/* Ticks + labels */}
      {ticks.map(t => {
        const x = xFor(t)
        const isZero = t === 0
        const isInt = Number.isInteger(t)
        return (
          <g key={t}>
            <line x1={x} y1={isInt ? 33 : 35} x2={x} y2={isInt ? 43 : 41} stroke={TICK_COLOR} strokeWidth={isZero ? 2 : 1} />
            {isInt && (
              <text x={x} y={60} fontSize={12} fill={LABEL_COLOR} textAnchor="middle" fontFamily="var(--font-body), sans-serif">
                {t}
              </text>
            )}
          </g>
        )
      })}

      {/* Plotted points */}
      {(spec.points || []).map((p, i) => {
        const x = xFor(p.value)
        const color = p.color || DEFAULT_COLOR
        return (
          <g key={i}>
            <circle cx={x} cy={38} r={6} fill={p.closed === false ? 'white' : color} stroke={color} strokeWidth={2} />
            {p.label !== undefined && (
              <text x={x} y={22} fontSize={12} fill={color} textAnchor="middle" fontWeight={600} fontFamily="var(--font-body), sans-serif">
                {p.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Caption */}
      {spec.caption && (
        <text x={width / 2} y={height - 8} fontSize={11} fill={TICK_COLOR} textAnchor="middle" fontStyle="italic">
          {spec.caption}
        </text>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate Plane

/** Evaluate a simple linear equation "y = mx + b" or "x = c" at given x */
function evalLine(eq: string, x: number): number | null {
  const trimmed = eq.replace(/\s+/g, '')
  // Vertical line "x=c"
  const vertMatch = trimmed.match(/^x=(-?[\d.]+)$/)
  if (vertMatch) return null // handled separately
  // y = mx + b form
  const yMatch = trimmed.match(/^y=(-?[\d.]*)x([+-]\d*\.?\d+)?$/)
  if (yMatch) {
    const mStr = yMatch[1]
    const bStr = yMatch[2] || '0'
    const m = mStr === '' || mStr === '+' ? 1 : mStr === '-' ? -1 : parseFloat(mStr)
    const b = parseFloat(bStr)
    return m * x + b
  }
  // y = b (horizontal)
  const hMatch = trimmed.match(/^y=(-?[\d.]+)$/)
  if (hMatch) return parseFloat(hMatch[1])
  return null
}

/** Is equation a vertical line? Returns the x-intercept */
function verticalX(eq: string): number | null {
  const m = eq.replace(/\s+/g, '').match(/^x=(-?[\d.]+)$/)
  return m ? parseFloat(m[1]) : null
}

function CoordPlane({ spec }: { spec: CoordPlaneSpec }) {
  const [xMin, xMax] = spec.xRange
  const [yMin, yMax] = spec.yRange
  const step = spec.step ?? 1
  const W = 360
  const H = 360
  const pad = 28
  const usableW = W - pad * 2
  const usableH = H - pad * 2
  const xFor = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * usableW
  const yFor = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * usableH

  // Grid ticks
  const xTicks: number[] = []
  for (let x = Math.ceil(xMin / step) * step; x <= xMax + 1e-9; x += step) xTicks.push(Number(x.toFixed(10)))
  const yTicks: number[] = []
  for (let y = Math.ceil(yMin / step) * step; y <= yMax + 1e-9; y += step) yTicks.push(Number(y.toFixed(10)))

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {xTicks.map(x => (
        <line key={`vx${x}`} x1={xFor(x)} y1={pad} x2={xFor(x)} y2={H - pad} stroke={GRID_COLOR} strokeWidth={0.5} />
      ))}
      {yTicks.map(y => (
        <line key={`hy${y}`} x1={pad} y1={yFor(y)} x2={W - pad} y2={yFor(y)} stroke={GRID_COLOR} strokeWidth={0.5} />
      ))}

      {/* Axes */}
      {xMin <= 0 && xMax >= 0 && (
        <line x1={xFor(0)} y1={pad} x2={xFor(0)} y2={H - pad} stroke={AXIS_COLOR} strokeWidth={1.5} />
      )}
      {yMin <= 0 && yMax >= 0 && (
        <line x1={pad} y1={yFor(0)} x2={W - pad} y2={yFor(0)} stroke={AXIS_COLOR} strokeWidth={1.5} />
      )}

      {/* Axis labels on integer ticks */}
      {yMin <= 0 && yMax >= 0 && xTicks.filter(x => Number.isInteger(x) && x !== 0).map(x => (
        <text key={`xl${x}`} x={xFor(x)} y={yFor(0) + 14} fontSize={10} fill={TICK_COLOR} textAnchor="middle">
          {x}
        </text>
      ))}
      {xMin <= 0 && xMax >= 0 && yTicks.filter(y => Number.isInteger(y) && y !== 0).map(y => (
        <text key={`yl${y}`} x={xFor(0) - 6} y={yFor(y) + 3} fontSize={10} fill={TICK_COLOR} textAnchor="end">
          {y}
        </text>
      ))}
      {/* Origin */}
      {xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0 && (
        <text x={xFor(0) - 6} y={yFor(0) + 14} fontSize={10} fill={TICK_COLOR} textAnchor="end">0</text>
      )}

      {/* Lines */}
      {(spec.lines || []).map((ln, i) => {
        const color = ln.color || DEFAULT_COLOR
        const dash = ln.style === 'dashed' ? '6,4' : ln.style === 'dotted' ? '2,3' : undefined
        const vx = verticalX(ln.equation)
        if (vx !== null) {
          return (
            <line key={i} x1={xFor(vx)} y1={pad} x2={xFor(vx)} y2={H - pad} stroke={color} strokeWidth={2} strokeDasharray={dash} />
          )
        }
        // Linear — plot across x range
        const y1 = evalLine(ln.equation, xMin)
        const y2 = evalLine(ln.equation, xMax)
        if (y1 === null || y2 === null) return null
        return (
          <line key={i} x1={xFor(xMin)} y1={yFor(y1)} x2={xFor(xMax)} y2={yFor(y2)} stroke={color} strokeWidth={2} strokeDasharray={dash} />
        )
      })}

      {/* Plotted points */}
      {(spec.points || []).map((p, i) => (
        <g key={`pt${i}`}>
          <circle cx={xFor(p.x)} cy={yFor(p.y)} r={4} fill={p.color || DEFAULT_COLOR} />
          {p.label && (
            <text x={xFor(p.x) + 8} y={yFor(p.y) - 6} fontSize={11} fill={p.color || LABEL_COLOR} fontWeight={600}>
              {p.label}
            </text>
          )}
        </g>
      ))}

      {/* Caption */}
      {spec.caption && (
        <text x={W / 2} y={H - 4} fontSize={11} fill={TICK_COLOR} textAnchor="middle" fontStyle="italic">
          {spec.caption}
        </text>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Triangle

function Triangle({ spec }: { spec: TriangleSpec }) {
  const W = 280, H = 220, pad = 20
  // Choose coordinates based on shape
  const shape = spec.shape || 'scalene'
  let A: [number, number], B: [number, number], C: [number, number]
  if (shape === 'right') {
    A = [pad, H - pad]; B = [W - pad, H - pad]; C = [pad, pad + 20]
  } else if (shape === 'equilateral') {
    A = [W / 2, pad]; B = [pad + 20, H - pad]; C = [W - pad - 20, H - pad]
  } else if (shape === 'isoceles') {
    A = [W / 2, pad]; B = [pad + 30, H - pad]; C = [W - pad - 30, H - pad]
  } else {
    A = [W * 0.3, pad + 10]; B = [pad, H - pad]; C = [W - pad, H - pad - 10]
  }
  const points = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`

  const [sideAB, sideBC, sideCA] = spec.sides || []
  const [angleA, angleB, angleC] = spec.angles || []

  // Midpoints for side labels
  const mAB: [number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
  const mBC: [number, number] = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]
  const mCA: [number, number] = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }}>
      <polygon points={points} fill="none" stroke={AXIS_COLOR} strokeWidth={2} strokeLinejoin="round" />

      {/* Right-angle marker for right triangles */}
      {shape === 'right' && (
        <path d={`M ${A[0]} ${A[1] - 12} L ${A[0] + 12} ${A[1] - 12} L ${A[0] + 12} ${A[1]}`} fill="none" stroke={AXIS_COLOR} strokeWidth={1.5} />
      )}

      {/* Side labels */}
      {sideAB && <text x={mAB[0] - 14} y={mAB[1]} fontSize={13} fill={LABEL_COLOR} fontWeight={600} fontStyle="italic">{sideAB}</text>}
      {sideBC && <text x={mBC[0]} y={mBC[1] + 16} fontSize={13} fill={LABEL_COLOR} fontWeight={600} fontStyle="italic" textAnchor="middle">{sideBC}</text>}
      {sideCA && <text x={mCA[0] + 10} y={mCA[1]} fontSize={13} fill={LABEL_COLOR} fontWeight={600} fontStyle="italic">{sideCA}</text>}

      {/* Angle labels at vertices */}
      {angleA && <text x={A[0]} y={A[1] - 6} fontSize={12} fill={DEFAULT_COLOR} fontWeight={600} textAnchor="middle">{angleA}</text>}
      {angleB && <text x={B[0] - 4} y={B[1] + 14} fontSize={12} fill={DEFAULT_COLOR} fontWeight={600} textAnchor="end">{angleB}</text>}
      {angleC && <text x={C[0] + 4} y={C[1] + 14} fontSize={12} fill={DEFAULT_COLOR} fontWeight={600}>{angleC}</text>}

      {spec.caption && (
        <text x={W / 2} y={H - 4} fontSize={11} fill={TICK_COLOR} textAnchor="middle" fontStyle="italic">{spec.caption}</text>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Rectangle

function Rectangle({ spec }: { spec: RectangleSpec }) {
  const aspect = spec.aspect || 1.6
  const W = 280
  const rectH = 140
  const rectW = rectH * aspect > W - 40 ? W - 40 : rectH * aspect
  const H = rectH + 60
  const x = (W - rectW) / 2
  const y = 30
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }}>
      <rect x={x} y={y} width={rectW} height={rectH} fill="none" stroke={AXIS_COLOR} strokeWidth={2} />
      {/* width below */}
      {spec.width && (
        <text x={W / 2} y={y + rectH + 18} fontSize={13} fill={LABEL_COLOR} textAnchor="middle" fontWeight={600} fontStyle="italic">{spec.width}</text>
      )}
      {/* height right */}
      {spec.height && (
        <text x={x + rectW + 8} y={y + rectH / 2 + 4} fontSize={13} fill={LABEL_COLOR} fontWeight={600} fontStyle="italic">{spec.height}</text>
      )}
      {spec.caption && (
        <text x={W / 2} y={H - 4} fontSize={11} fill={TICK_COLOR} textAnchor="middle" fontStyle="italic">{spec.caption}</text>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle

function Circle({ spec }: { spec: CircleSpec }) {
  const W = 240, H = 220
  const cx = W / 2, cy = H / 2 - 6, r = 70
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={AXIS_COLOR} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2} fill={AXIS_COLOR} />
      {spec.radiusLabel && (
        <>
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={DEFAULT_COLOR} strokeWidth={1.5} />
          <text x={cx + r / 2} y={cy - 6} fontSize={13} fill={DEFAULT_COLOR} fontWeight={600} textAnchor="middle" fontStyle="italic">{spec.radiusLabel}</text>
        </>
      )}
      {spec.diameterLabel && !spec.radiusLabel && (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={DEFAULT_COLOR} strokeWidth={1.5} />
          <text x={cx} y={cy - 6} fontSize={13} fill={DEFAULT_COLOR} fontWeight={600} textAnchor="middle" fontStyle="italic">{spec.diameterLabel}</text>
        </>
      )}
      {spec.caption && (
        <text x={W / 2} y={H - 4} fontSize={11} fill={TICK_COLOR} textAnchor="middle" fontStyle="italic">{spec.caption}</text>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw SVG escape hatch

function RawSvg({ spec }: { spec: RawSvgSpec }) {
  // Basic safety: strip <script> tags. Not bulletproof but reduces obvious XSS.
  const safe = spec.svg.replace(/<script[\s\S]*?<\/script>/gi, '')
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: safe }} />
      {spec.caption && (
        <div style={{ fontSize: '11px', color: TICK_COLOR, fontStyle: 'italic', textAlign: 'center', marginTop: '4px' }}>
          {spec.caption}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main renderer

export default function DiagramRenderer({ spec }: { spec: string | null | undefined }) {
  const parsed = useMemo(() => parseSpec(spec || ''), [spec])
  if (!parsed) {
    if (!spec) return null
    return (
      <span style={{ fontSize: '11px', color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', fontStyle: 'italic' }}>
        ⚠ invalid diagram spec
      </span>
    )
  }
  try {
    switch (parsed.type) {
      case 'number-line': return <NumberLine spec={parsed} />
      case 'coord-plane': return <CoordPlane spec={parsed} />
      case 'triangle': return <Triangle spec={parsed} />
      case 'rectangle': return <Rectangle spec={parsed} />
      case 'circle': return <Circle spec={parsed} />
      case 'svg': return <RawSvg spec={parsed} />
      default:
        return (
          <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
            unknown diagram type: {(parsed as any).type}
          </span>
        )
    }
  } catch (err) {
    return (
      <span style={{ fontSize: '11px', color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
        diagram render error
      </span>
    )
  }
}
