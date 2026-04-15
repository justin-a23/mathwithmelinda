'use client'

import { useState, useRef } from 'react'
import MathRenderer from './MathRenderer'

const SYMBOLS = [
  { label: '²', insert: '\\(^2\\)', title: 'Squared' },
  { label: '³', insert: '\\(^3\\)', title: 'Cubed' },
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
  const [showOverlinePopup, setShowOverlinePopup] = useState(false)
  const [showRootPopup, setShowRootPopup] = useState(false)
  const [fracNumer, setFracNumer] = useState('')
  const [fracDenom, setFracDenom] = useState('')
  const [expBase, setExpBase] = useState('')
  const [expPower, setExpPower] = useState('')
  const [overlineDigits, setOverlineDigits] = useState('')
  const [rootContent, setRootContent] = useState('')
  const [rootDegree, setRootDegree] = useState('')
  const numerRef = useRef<HTMLInputElement>(null)
  const baseRef = useRef<HTMLInputElement>(null)
  const overlineRef = useRef<HTMLInputElement>(null)
  const rootContentRef = useRef<HTMLInputElement>(null)

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

  function insertOverline() {
    if (!overlineDigits.trim()) return
    const latex = `\\(\\overline{${overlineDigits}}\\)`
    insert(latex)
    setOverlineDigits('')
    setShowOverlinePopup(false)
  }

  function insertRoot() {
    if (!rootContent.trim()) return
    const deg = rootDegree.trim()
    const latex = deg && deg !== '2'
      ? `\\(\\sqrt[${deg}]{${rootContent}}\\)`
      : `\\(\\sqrt{${rootContent}}\\)`
    insert(latex)
    setRootContent('')
    setRootDegree('')
    setShowRootPopup(false)
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
    background: 'var(--background)', color: 'var(--foreground)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500,
    minWidth: '32px', textAlign: 'center', lineHeight: 1,
    fontFamily: 'var(--font-body)'
  }

  const popupStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, zIndex: 100,
    background: 'var(--background)', border: '1px solid var(--gray-light)',
    borderRadius: '8px', padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    minWidth: '240px', marginTop: '4px'
  }

  const popupInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', borderRadius: '6px',
    border: '1px solid var(--gray-light)', fontSize: '14px',
    background: 'var(--background)', color: 'var(--foreground)',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box'
  }

  const fracPreview = fracNumer || fracDenom
    ? `\\(\\frac{${fracNumer || '\\square'}}{${fracDenom || '\\square'}}\\)`
    : null

  const expPreview = expBase || expPower
    ? `\\(${expBase || '\\square'}^{${expPower || '\\square'}}\\)`
    : null

  const overlinePreview = overlineDigits
    ? `\\(\\overline{${overlineDigits}}\\)`
    : null

  const rootPreview = rootContent
    ? (rootDegree.trim() && rootDegree.trim() !== '2'
        ? `\\(\\sqrt[${rootDegree}]{${rootContent}}\\)`
        : `\\(\\sqrt{${rootContent}}\\)`)
    : null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: 'var(--background)', borderRadius: '6px', border: '1px solid var(--gray-light)', marginBottom: '6px', position: 'relative' }}>

      {/* Fraction button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          title="Insert fraction"
          onClick={() => { setShowFractionPopup(v => !v); setShowExponentPopup(false); setTimeout(() => numerRef.current?.focus(), 50) }}
          style={{ ...btnStyle, background: showFractionPopup ? 'var(--plum)' : 'var(--background)', color: showFractionPopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          a/b
        </button>
        {showFractionPopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Fraction</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>
                Numerator (top) — use x^{'{2}'} for exponents
              </label>
              <input ref={numerRef} value={fracNumer} onChange={e => setFracNumer(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertFraction()} style={popupInputStyle} placeholder="e.g. x^{2} + 5a" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>
                Denominator (bottom)
              </label>
              <input value={fracDenom} onChange={e => setFracDenom(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertFraction()} style={popupInputStyle} placeholder="e.g. 2x + 6" />
            </div>
            {fracPreview && (
              <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', padding: '10px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                <MathRenderer text={fracPreview} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertFraction} disabled={!fracNumer.trim() || !fracDenom.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', opacity: (!fracNumer.trim() || !fracDenom.trim()) ? 0.5 : 1 }}>Insert</button>
              <button onClick={() => { setShowFractionPopup(false); setFracNumer(''); setFracDenom('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
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
          style={{ ...btnStyle, background: showExponentPopup ? 'var(--plum)' : 'var(--background)', color: showExponentPopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          xⁿ
        </button>
        {showExponentPopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Exponent</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Base — can be an expression</label>
              <input ref={baseRef} value={expBase} onChange={e => setExpBase(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertExponent()} style={popupInputStyle} placeholder="e.g. x or (2x+1)" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Power</label>
              <input value={expPower} onChange={e => setExpPower(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertExponent()} style={popupInputStyle} placeholder="e.g. 2" />
            </div>
            {expPreview && (
              <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', padding: '10px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                <MathRenderer text={expPreview} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertExponent} disabled={!expBase.trim() || !expPower.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', opacity: (!expBase.trim() || !expPower.trim()) ? 0.5 : 1 }}>Insert</button>
              <button onClick={() => { setShowExponentPopup(false); setExpBase(''); setExpPower('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Overline (repeating decimal) button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          title="Insert overline (repeating decimal)"
          onClick={() => { setShowOverlinePopup(v => !v); setShowFractionPopup(false); setShowExponentPopup(false); setTimeout(() => overlineRef.current?.focus(), 50) }}
          style={{ ...btnStyle, background: showOverlinePopup ? 'var(--plum)' : 'var(--background)', color: showOverlinePopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          x̄
        </button>
        {showOverlinePopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repeating Decimal</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Repeating digits</label>
              <input ref={overlineRef} value={overlineDigits} onChange={e => setOverlineDigits(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertOverline()} style={popupInputStyle} placeholder="e.g. 7 or 27" />
            </div>
            {overlinePreview && (
              <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', padding: '10px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                <MathRenderer text={overlinePreview} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertOverline} disabled={!overlineDigits.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', opacity: !overlineDigits.trim() ? 0.5 : 1 }}>Insert</button>
              <button onClick={() => { setShowOverlinePopup(false); setOverlineDigits('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Root / radical button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          title="Insert square root or cube root"
          onClick={() => { setShowRootPopup(v => !v); setShowFractionPopup(false); setShowExponentPopup(false); setShowOverlinePopup(false); setTimeout(() => rootContentRef.current?.focus(), 50) }}
          style={{ ...btnStyle, background: showRootPopup ? 'var(--plum)' : 'var(--background)', color: showRootPopup ? 'white' : 'var(--foreground)', fontWeight: 700 }}
        >
          {'√'}
        </button>
        {showRootPopup && (
          <div style={popupStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-dark)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Root</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>What's inside the root</label>
              <input ref={rootContentRef} value={rootContent} onChange={e => setRootContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertRoot()} style={popupInputStyle} placeholder="e.g. 8 or n^{3}" />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--gray-dark)', display: 'block', marginBottom: '4px' }}>Root type</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <button type="button" onClick={() => setRootDegree('')} style={{ ...btnStyle, flex: 1, background: (!rootDegree || rootDegree === '2') ? 'var(--plum-light)' : 'var(--background)', borderColor: (!rootDegree || rootDegree === '2') ? 'var(--plum)' : 'var(--gray-light)', fontSize: '12px' }}>Square root</button>
                <button type="button" onClick={() => setRootDegree('3')} style={{ ...btnStyle, flex: 1, background: rootDegree === '3' ? 'var(--plum-light)' : 'var(--background)', borderColor: rootDegree === '3' ? 'var(--plum)' : 'var(--gray-light)', fontSize: '12px' }}>Cube root</button>
              </div>
              <input value={rootDegree} onChange={e => setRootDegree(e.target.value)} style={{ ...popupInputStyle, fontSize: '12px', padding: '4px 8px' }} placeholder="or type a custom root (e.g. 4, 5, n)" />
            </div>
            {rootPreview && (
              <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '12px', padding: '10px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                <MathRenderer text={rootPreview} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={insertRoot} disabled={!rootContent.trim()} style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', opacity: !rootContent.trim() ? 0.5 : 1 }}>Insert</button>
              <button onClick={() => { setShowRootPopup(false); setRootContent(''); setRootDegree('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--gray-light)', color: 'var(--gray-dark)', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Cancel</button>
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
