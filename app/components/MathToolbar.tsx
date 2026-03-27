'use client'

import { useState, useRef } from 'react'

const SYMBOLS = [
  { label: '²', insert: '\\(^2\\)', title: 'Squared' },
  { label: '³', insert: '\\(^3\\)', title: 'Cubed' },
  { label: '√', insert: '\\(\\sqrt{}\\)', title: 'Square root', cursor: -2 },
  { label: '÷', insert: '÷', title: 'Divide' },
  { label: '×', insert: '×', title: 'Multiply' },
  { label: '≠', insert: '≠', title: 'Not equal' },
  { label: '≤', insert: '≤', title: 'Less than or equal' },
  { label: '≥', insert: '≥', title: 'Greater than or equal' },
  { label: 'π', insert: '\\(\\pi\\)', title: 'Pi' },
  { label: '°', insert: '°', title: 'Degrees' },
  { label: '∞', insert: '\\(\\infty\\)', title: 'Infinity' },
  { label: '±', insert: '±', title: 'Plus or minus' },
  { label: '∠', insert: '∠', title: 'Angle' },
  { label: '△', insert: '△', title: 'Triangle' },
]

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (val: string) => void
}

export default function MathToolbar({ textareaRef, value, onChange }: Props) {
  const [showFractionPopup, setShowFractionPopup] = useState(false)
  const [showExponentPopup, setShowExponentPopup] = useState(false)
  const [fracNumer, setFracNumer] = useState('')
  const [fracDenom, setFracDenom] = useState('')
  const [expBase, setExpBase] = useState('')
  const [expPower, setExpPower] = useState('')
  const numerRef = useRef<HTMLInputElement>(null)
  const baseRef = useRef<HTMLInputElement>(null)

  function insert(symbol: string) {
    const ta = textareaRef.current
    if (!ta) {
      onChange(value + symbol)
      return
    }
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? value.length
    const newVal = value.slice(0, start) + symbol + value.slice(end)
    onChange(newVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + symbol.length, start + symbol.length)
    }, 0)
  }

  function insertFraction() {
    if (!fracNumer.trim() || !fracDenom.trim()) return
    const latex = `\\(\\frac{${fracNumer}}{${fracDenom}}\\)`
    insert(latex)
    setFracNumer('')
    setFracDenom('')
    setShowFractionPopup(false)
  }

  function insertExponent() {
    if (!expBase.trim() || !expPower.trim()) return
    const latex = `\\(${expBase}^{${expPower}}\\)`
    insert(latex)
    setExpBase('')
    setExpPower('')
    setShowExponentPopup(false)
  }

  const btnStyle: React.CSSProperties = {
    padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--gray-light)',
    background: 'var(--white)', color: 'var(--foreground)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500,
    minWidth: '32px', textAlign: 'center', lineHeight: 1,
    fontFamily: 'var(--font-body)'
  }

  const popupStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, zIndex: 100,
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    borderRadius: '8px', padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    minWidth: '220px', marginTop: '4px'
  }

  const popupInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', borderRadius: '6px',
    border: '1px solid var(--gray-light)', fontSize: '14px',
    background: 'var(--white)', color: 'var(--foreground)',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box'
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: 'var(--background)', borderRadius: '6px', border: '1px solid var(--gray-light)', marginBottom: '6px', position: 'relative' }}>

      {/* Fraction button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          title="Insert fraction"
          onClick={() => { setShowFractionPopup(v => !v); setShowExponentPopup(false); setTimeout(() => numerRef.current?.focus(), 50) }}
          style={{ ...btnStyle, background: showFractionPopup ? 'var(--plum)' : 'var(--white)', color: showFractionPopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          a/b
        </button>
        {showFractionPopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Fraction</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Numerator (top)</label>
              <input ref={numerRef} value={fracNumer} onChange={e => setFracNumer(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertFraction()} style={popupInputStyle} placeholder="e.g. 7" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Denominator (bottom)</label>
              <input value={fracDenom} onChange={e => setFracDenom(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertFraction()} style={popupInputStyle} placeholder="e.g. 8" />
            </div>
            {fracNumer && fracDenom && (
              <div style={{ textAlign: 'center', fontSize: '18px', marginBottom: '10px', padding: '8px', background: 'var(--background)', borderRadius: '6px' }}>
                <sup>{fracNumer}</sup>/<sub>{fracDenom}</sub>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertFraction} disabled={!fracNumer.trim() || !fracDenom.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Insert</button>
              <button onClick={() => setShowFractionPopup(false)} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Exponent button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          title="Insert exponent"
          onClick={() => { setShowExponentPopup(v => !v); setShowFractionPopup(false); setTimeout(() => baseRef.current?.focus(), 50) }}
          style={{ ...btnStyle, background: showExponentPopup ? 'var(--plum)' : 'var(--white)', color: showExponentPopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          xⁿ
        </button>
        {showExponentPopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Exponent</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Base</label>
              <input ref={baseRef} value={expBase} onChange={e => setExpBase(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertExponent()} style={popupInputStyle} placeholder="e.g. x" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Power</label>
              <input value={expPower} onChange={e => setExpPower(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertExponent()} style={popupInputStyle} placeholder="e.g. 2" />
            </div>
            {expBase && expPower && (
              <div style={{ textAlign: 'center', fontSize: '18px', marginBottom: '10px', padding: '8px', background: 'var(--background)', borderRadius: '6px' }}>
                {expBase}<sup>{expPower}</sup>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertExponent} disabled={!expBase.trim() || !expPower.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Insert</button>
              <button onClick={() => setShowExponentPopup(false)} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Symbol buttons */}
      {SYMBOLS.map(({ label, insert: sym, title }) => (
        <button
          key={label}
          type="button"
          title={title}
          onClick={() => insert(sym)}
          style={btnStyle}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
