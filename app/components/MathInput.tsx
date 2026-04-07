'use client'

import { useRef, useState } from 'react'
import MathRenderer from './MathRenderer'

interface Props {
  value: string
  onChange: (val: string) => void
  multiline?: boolean
  placeholder?: string
}

const SYMBOLS = [
  { s: '±',  t: 'plus or minus' },
  { s: 'π',  t: 'pi' },
  { s: '×',  t: 'multiply' },
  { s: '÷',  t: 'divide' },
  { s: '≤',  t: 'less than or equal' },
  { s: '≥',  t: 'greater than or equal' },
  { s: '≠',  t: 'not equal' },
  { s: '°',  t: 'degrees' },
  { s: '∞',  t: 'infinity' },
]

export default function MathInput({ value, onChange, multiline = false, placeholder }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [showFraction, setShowFraction] = useState(false)
  const [showExponent, setShowExponent] = useState(false)
  const [showOverline, setShowOverline] = useState(false)
  const [showRoot, setShowRoot] = useState(false)
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState('')
  const [expBase, setExpBase] = useState('')
  const [expPower, setExpPower] = useState('')
  const [overlineDigits, setOverlineDigits] = useState('')
  const [rootContent, setRootContent] = useState('')
  const [rootDegree, setRootDegree] = useState('')

  function insertAtCursor(text: string) {
    const el = inputRef.current
    if (!el) { onChange(value + text); return }
    const start = el.selectionStart ?? value.length
    const end   = el.selectionEnd   ?? value.length
    const next  = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + text.length, start + text.length)
    })
  }

  function insertFraction() {
    const n = numerator.trim() || '□'
    const d = denominator.trim() || '□'
    insertAtCursor(`\\(\\frac{${n}}{${d}}\\)`)
    setNumerator('')
    setDenominator('')
    setShowFraction(false)
  }

  function insertExponent() {
    const b = expBase.trim() || '□'
    const p = expPower.trim() || '□'
    insertAtCursor(`\\(${b}^{${p}}\\)`)
    setExpBase('')
    setExpPower('')
    setShowExponent(false)
  }

  function insertOverline() {
    if (!overlineDigits.trim()) return
    insertAtCursor(`\\(\\overline{${overlineDigits}}\\)`)
    setOverlineDigits('')
    setShowOverline(false)
  }

  function insertRoot() {
    if (!rootContent.trim()) return
    const deg = rootDegree.trim()
    const latex = deg && deg !== '2'
      ? `\\(\\sqrt[${deg}]{${rootContent}}\\)`
      : `\\(\\sqrt{${rootContent}}\\)`
    insertAtCursor(latex)
    setRootContent('')
    setRootDegree('')
    setShowRoot(false)
  }

  const hasMath = value.includes('\\(') || value.includes('\\[')

  const fracPreview = (numerator || denominator)
    ? `\\(\\frac{${numerator || '\\square'}}{${denominator || '\\square'}}\\)`
    : null

  const expPreview = (expBase || expPower)
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

  const btnStyle: React.CSSProperties = {
    background: 'var(--background)',
    border: '1px solid var(--gray-light)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'var(--foreground)',
    lineHeight: 1.3,
    userSelect: 'none',
    flexShrink: 0,
  }

  const popupInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', borderRadius: '6px',
    border: '1px solid var(--gray-light)', fontSize: '14px',
    background: 'var(--background)', color: 'var(--foreground)',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box', textAlign: 'center'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '6px 8px',
        background: 'var(--page-bg)',
        border: '1px solid var(--gray-light)',
        borderRadius: '6px',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--gray-mid)', fontWeight: 500, marginRight: '2px', flexShrink: 0 }}>
          Insert:
        </span>

        {/* Fraction button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Insert a fraction"
            style={{ ...btnStyle, fontWeight: 600, color: 'var(--plum)', borderColor: 'var(--plum-mid)', background: showFraction ? 'var(--plum-light)' : 'var(--background)' }}
            onMouseDown={e => { e.preventDefault(); setShowFraction(v => !v); setShowExponent(false) }}
          >
            a/b
          </button>

          {showFraction && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: 'var(--background)',
              border: '1px solid var(--gray-light)',
              borderRadius: '8px',
              padding: '12px',
              zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '200px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginBottom: '2px' }}>
                Tip: use x^{'{'+'2'+'}'} for exponents in top or bottom
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <input
                  autoFocus
                  value={numerator}
                  onChange={e => setNumerator(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && insertFraction()}
                  placeholder="top (e.g. x^{2} + 5a)"
                  style={popupInputStyle}
                />
                <div style={{ width: '100px', height: '2px', background: 'var(--foreground)' }} />
                <input
                  value={denominator}
                  onChange={e => setDenominator(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && insertFraction()}
                  placeholder="bottom (e.g. 2x + 6)"
                  style={popupInputStyle}
                />
              </div>
              {fracPreview && (
                <div style={{ textAlign: 'center', fontSize: '20px', padding: '8px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                  <MathRenderer text={fracPreview} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={insertFraction}
                  style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFraction(false); setNumerator(''); setDenominator('') }}
                  style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exponent button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Insert an exponent"
            style={{ ...btnStyle, fontWeight: 600, color: 'var(--plum)', borderColor: 'var(--plum-mid)', background: showExponent ? 'var(--plum-light)' : 'var(--background)' }}
            onMouseDown={e => { e.preventDefault(); setShowExponent(v => !v); setShowFraction(false) }}
          >
            xⁿ
          </button>

          {showExponent && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: 'var(--background)',
              border: '1px solid var(--gray-light)',
              borderRadius: '8px',
              padding: '12px',
              zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '180px',
            }}>
              <input
                autoFocus
                value={expBase}
                onChange={e => setExpBase(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertExponent()}
                placeholder="base (e.g. x)"
                style={popupInputStyle}
              />
              <input
                value={expPower}
                onChange={e => setExpPower(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertExponent()}
                placeholder="power (e.g. 2)"
                style={popupInputStyle}
              />
              {expPreview && (
                <div style={{ textAlign: 'center', fontSize: '20px', padding: '8px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                  <MathRenderer text={expPreview} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={insertExponent}
                  style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExponent(false); setExpBase(''); setExpPower('') }}
                  style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overline (repeating decimal) button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Insert overline (repeating decimal)"
            style={{ ...btnStyle, fontWeight: 600, color: 'var(--plum)', borderColor: 'var(--plum-mid)', background: showOverline ? 'var(--plum-light)' : 'var(--background)' }}
            onMouseDown={e => { e.preventDefault(); setShowOverline(v => !v); setShowFraction(false); setShowExponent(false) }}
          >
            x̄
          </button>
          {showOverline && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: 'var(--background)', border: '1px solid var(--gray-light)',
              borderRadius: '8px', padding: '12px', zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>Repeating digits</div>
              <input
                autoFocus
                value={overlineDigits}
                onChange={e => setOverlineDigits(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertOverline()}
                placeholder="e.g. 7 or 27"
                style={popupInputStyle}
              />
              {overlinePreview && (
                <div style={{ textAlign: 'center', fontSize: '20px', padding: '8px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                  <MathRenderer text={overlinePreview} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={insertOverline} disabled={!overlineDigits.trim()}
                  style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, opacity: !overlineDigits.trim() ? 0.5 : 1 }}>
                  Insert
                </button>
                <button type="button" onClick={() => { setShowOverline(false); setOverlineDigits('') }}
                  style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Root / radical button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Insert square root or cube root"
            style={{ ...btnStyle, fontWeight: 600, color: 'var(--plum)', borderColor: 'var(--plum-mid)', background: showRoot ? 'var(--plum-light)' : 'var(--background)' }}
            onMouseDown={e => { e.preventDefault(); setShowRoot(v => !v); setShowFraction(false); setShowExponent(false); setShowOverline(false) }}
          >
            {'√'}
          </button>
          {showRoot && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: 'var(--background)', border: '1px solid var(--gray-light)',
              borderRadius: '8px', padding: '12px', zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-mid)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Root</div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginBottom: '4px' }}>What's inside the root</div>
                <input
                  autoFocus
                  value={rootContent}
                  onChange={e => setRootContent(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && insertRoot()}
                  placeholder="e.g. 8 or n^{3}"
                  style={popupInputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--gray-mid)', marginBottom: '4px' }}>Root type</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <button type="button" onClick={() => setRootDegree('')} style={{ ...btnStyle, flex: 1, background: (!rootDegree || rootDegree === '2') ? 'var(--plum-light)' : 'var(--background)', borderColor: (!rootDegree || rootDegree === '2') ? 'var(--plum)' : 'var(--gray-light)', fontSize: '11px', padding: '4px 6px' }}>Square root</button>
                  <button type="button" onClick={() => setRootDegree('3')} style={{ ...btnStyle, flex: 1, background: rootDegree === '3' ? 'var(--plum-light)' : 'var(--background)', borderColor: rootDegree === '3' ? 'var(--plum)' : 'var(--gray-light)', fontSize: '11px', padding: '4px 6px' }}>Cube root</button>
                </div>
                <input
                  value={rootDegree}
                  onChange={e => setRootDegree(e.target.value)}
                  placeholder="or type custom (e.g. 4, 5, n)"
                  style={{ ...popupInputStyle, fontSize: '12px', padding: '4px 8px' }}
                />
              </div>
              {rootPreview && (
                <div style={{ textAlign: 'center', fontSize: '20px', padding: '8px', background: 'var(--page-bg)', borderRadius: '6px', border: '1px solid var(--plum-mid)' }}>
                  <MathRenderer text={rootPreview} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={insertRoot} disabled={!rootContent.trim()}
                  style={{ flex: 1, background: 'var(--plum)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, opacity: !rootContent.trim() ? 0.5 : 1 }}>
                  Insert
                </button>
                <button type="button" onClick={() => { setShowRoot(false); setRootContent(''); setRootDegree('') }}
                  style={{ background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--gray-light)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--gray-light)', margin: '0 2px', flexShrink: 0 }} />

        {/* Symbol buttons */}
        {SYMBOLS.map(s => (
          <button
            key={s.s}
            type="button"
            title={s.t}
            style={btnStyle}
            onMouseDown={e => { e.preventDefault(); insertAtCursor(s.s) }}
          >
            {s.s}
          </button>
        ))}
      </div>

      {/* ── Answer input ── */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Type your answer…'}
        rows={multiline ? 3 : 1}
        onClick={() => { setShowFraction(false); setShowExponent(false); setShowOverline(false); setShowRoot(false) }}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid var(--gray-light)',
          borderRadius: '6px',
          fontSize: '15px',
          fontFamily: 'var(--font-body)',
          background: 'var(--background)',
          color: 'var(--foreground)',
          resize: multiline ? 'vertical' : 'none',
          lineHeight: 1.5,
          boxSizing: 'border-box',
          ...(multiline ? {} : { height: '42px', overflowY: 'hidden' }),
        }}
      />

      {/* ── Preview — shown when math notation is present ── */}
      {hasMath && (
        <div style={{
          background: 'var(--page-bg)',
          border: '1px solid var(--plum-mid)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.8px', flexShrink: 0 }}>
            Preview
          </span>
          <span style={{ fontSize: '16px', color: 'var(--foreground)' }}>
            <MathRenderer text={value} />
          </span>
        </div>
      )}

    </div>
  )
}
