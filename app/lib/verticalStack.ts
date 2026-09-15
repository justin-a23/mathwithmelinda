// Converts a horizontal arithmetic problem into a vertically stacked KaTeX
// display-math block — the "Stack vertically" toolbar button in the lesson
// editor (Melinda's ticket 2026-09-15: mixed-measure problems on tests are
// confusing horizontally; she wants places and decimals lined up in columns).
//
// The output is ordinary `\[ \begin{array} ... \]` display math, so every
// existing renderer (MathRenderer, the worksheet/participation/answer-key
// print popups, student lesson page) renders it with no changes.
//
// Supported shapes, chosen by top-level operator precedence:
//   A + B + C   /  A - B      → column-aligned addition/subtraction stack
//   A × 3                     → multiplication stack (scalar under last column)
//   A ÷ 4                     → long-division bracket
// Operators must have whitespace on both sides ("6 wk. 5 days x 3"), which
// keeps hyphenated words and x-as-a-letter from splitting. When +/- and ×
// both appear at top level (scientific-notation sums), +/- wins and the ×
// stays inside each row.

import { MATH_DELIMITER_SPLIT } from '../components/MathRenderer'

export type StackResult = { latex: string } | { error: string }

const OP_SPLIT = /(\s+[+\-−×xX*÷/]\s+)/
const ADD_OPS = new Set(['+', '-', '−'])
const MUL_OPS = new Set(['×', 'x', 'X', '*'])
const DIV_OPS = new Set(['÷', '/'])

const OP_TEX: Record<string, string> = {
  '+': '+', '-': '-', '−': '-',
  '×': '\\times', 'x': '\\times', 'X': '\\times', '*': '\\times',
}

// Escape plain text for use inside \text{...}
function texEscape(s: string): string {
  return s.replace(/[\\#$%&_{}~^]/g, ch => {
    switch (ch) {
      case '\\': return '\\textbackslash '
      case '~': return '\\textasciitilde '
      case '^': return '\\textasciicircum '
      default: return '\\' + ch
    }
  })
}

function isMathChunk(part: string): boolean {
  return (
    (part.startsWith('\\[') && part.endsWith('\\]')) ||
    (part.startsWith('\\(') && part.endsWith('\\)')) ||
    (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) ||
    (part.startsWith('$') && part.endsWith('$') && part.length >= 2)
  )
}

function innerTex(part: string): string {
  if (part.startsWith('$$')) return part.slice(2, -2)
  if (part.startsWith('\\[') || part.startsWith('\\(')) return part.slice(2, -2)
  return part.slice(1, -1)
}

// KaTeX's \text mode warns on ×/÷/−/± — swap them for math commands.
function textChunk(s: string): string {
  return s
    .split(/([×÷−±])/)
    .map(p => {
      if (p === '×') return '\\times '
      if (p === '÷') return '\\div '
      if (p === '−') return '-'
      if (p === '±') return '\\pm '
      return p ? `\\text{${texEscape(p)}}` : ''
    })
    .join('')
}

// Render an operand (possibly mixing prose and \(...\) math) as cell TeX.
function textify(operand: string): string {
  return operand
    .split(MATH_DELIMITER_SPLIT)
    .filter(p => p !== undefined && p !== '')
    .map(p => (isMathChunk(p) ? `{${innerTex(p)}}` : textChunk(p)))
    .join('')
}

type Operand = { text: string; hasMath: boolean }
type Segment = { num: string; unit: string }

// Split the problem into operands on the chosen top-level operator class.
// Math chunks are opaque: operators inside \(...\) never split.
function splitOperands(text: string): { operands: Operand[]; ops: string[] } | null {
  const tokens: { kind: 'text' | 'math' | 'op'; value: string }[] = []
  for (const part of text.split(MATH_DELIMITER_SPLIT)) {
    if (part === undefined || part === '') continue
    if (isMathChunk(part)) {
      tokens.push({ kind: 'math', value: part })
      continue
    }
    for (const piece of part.split(OP_SPLIT)) {
      if (piece === '') continue
      const trimmed = piece.trim()
      if (/^\s+[+\-−×xX*÷/]\s+$/.test(piece)) tokens.push({ kind: 'op', value: trimmed })
      else tokens.push({ kind: 'text', value: piece })
    }
  }

  const allOps = tokens.filter(t => t.kind === 'op').map(t => t.value)
  const opClass = allOps.some(o => ADD_OPS.has(o)) ? ADD_OPS
    : allOps.some(o => MUL_OPS.has(o)) ? MUL_OPS
    : allOps.some(o => DIV_OPS.has(o)) ? DIV_OPS
    : null
  if (!opClass) return null

  const operands: Operand[] = []
  const ops: string[] = []
  let current = ''
  let currentHasMath = false
  for (const t of tokens) {
    if (t.kind === 'op' && opClass.has(t.value)) {
      operands.push({ text: current.trim(), hasMath: currentHasMath })
      ops.push(t.value)
      current = ''
      currentHasMath = false
    } else {
      // an op outside the chosen class stays inside the operand (e.g. the ×
      // in "5.59 × 10⁻⁶" when stacking on +)
      current += t.kind === 'op' ? ` ${t.value} ` : t.value
      if (t.kind === 'math') currentHasMath = true
    }
  }
  operands.push({ text: current.trim(), hasMath: currentHasMath })
  if (operands.some(o => !o.text)) return null
  return { operands, ops }
}

// Parse a plain operand into (number, unit) measure segments:
// "7 hr. 28 min." → [{num:'7',unit:'hr.'},{num:'28',unit:'min.'}]; "3" → [{num:'3',unit:''}]
function parseMeasure(operand: string): Segment[] | null {
  const t = operand.trim()
  if (!/^\d/.test(t)) return null
  const segs: Segment[] = []
  const re = /(\d[\d,]*(?:\.\d+)?)\s*([^\d]*)/g
  let covered = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(t)) !== null) {
    if (m.index !== covered) return null
    if (m[0] === '') break
    covered = m.index + m[0].length
    segs.push({ num: m[1], unit: m[2].trim() })
  }
  if (covered !== t.length || segs.length === 0) return null
  // Only a lone bare number (a scalar multiplier/addend) may lack a unit —
  // "7 hr. 28" is more likely a typo than a intentional layout.
  if (segs.length > 1 && segs.some(s => !s.unit)) return null
  return segs
}

// Pad cell so decimal points line up under right alignment: every number in a
// column gets phantom copies of the fractional digits it is missing relative
// to the column's longest fraction.
function numCell(num: string, maxFrac: string): string {
  const frac = num.includes('.') ? num.slice(num.indexOf('.')) : ''
  const pad = maxFrac.slice(frac.length)
  return `\\text{${num}}` + (pad ? `\\hphantom{\\text{${pad}}}` : '')
}

function buildStack(rows: string[][], colCount: number): string {
  const colspec = 'r' + ' r l'.repeat(colCount)
  const emptyRow = Array(1 + colCount * 2).fill('').join(' & ')
  const body = rows.map(r => r.join(' & ')).join(' \\\\[2pt]\n')
  return `\\[\\begin{array}{${colspec}}\n${body} \\\\ \\hline\n${emptyRow}\n\\end{array}\\]`
}

export function stackVertical(input: string): StackResult {
  const text = input.trim().replace(/[=\s]+$/, '')
  if (!text) return { error: 'Select the problem you want to stack first.' }

  const split = splitOperands(text)
  if (!split) {
    return { error: 'No +, −, × or ÷ found between two parts of the problem. Select just the problem, e.g. "19 yd. 28 in. - 16 yd. 31 in. ="' }
  }
  const { operands, ops } = split

  // Long division: exactly "dividend ÷ divisor"
  if (DIV_OPS.has(ops[0])) {
    if (operands.length !== 2) return { error: 'Division problems can only be stacked as one number divided by another, e.g. "9 yd. 12 in. ÷ 4".' }
    const [dividend, divisor] = operands
    if (divisor.hasMath || !/^[\d.,]+$/.test(divisor.text)) {
      return { error: 'To stack a division problem as long division, the divisor (after the ÷) must be a plain number.' }
    }
    const latex = `\\[${textify(divisor.text)}\\;\\overline{\\smash{)}\\;${textify(dividend.text)}\\;}\\]`
    return { latex }
  }

  if (operands.length < 2) return { error: 'Need at least two parts to stack.' }

  // Try measure-column mode: every operand parses as "number unit number unit…"
  const parsed = operands.every(o => !o.hasMath) ? operands.map(o => parseMeasure(o.text)) : null
  const rowSegs = parsed && parsed.every(Boolean) ? (parsed as Segment[][]) : null

  if (rowSegs) {
    // Merge the units of every row into one ordered column list
    const units: string[] = []
    let ok = true
    for (const segs of rowSegs) {
      let cursor = -1
      for (const seg of segs) {
        if (!seg.unit) continue
        let idx = units.indexOf(seg.unit)
        if (idx === -1) {
          idx = cursor + 1
          units.splice(idx, 0, seg.unit)
        } else if (idx <= cursor) { ok = false; break }
        cursor = idx
      }
      if (!ok) break
    }

    if (ok) {
      const colCount = Math.max(units.length, 1)
      // cells[row][col] = segment or null
      const cells: (Segment | null)[][] = rowSegs.map(segs => {
        const row: (Segment | null)[] = Array(colCount).fill(null)
        for (const seg of segs) {
          // a bare scalar lands in the rightmost column (units place)
          const col = seg.unit ? units.indexOf(seg.unit) : colCount - 1
          if (row[col]) { ok = false; break }
          row[col] = seg
        }
        return row
      })

      if (ok) {
        const maxFracs = Array.from({ length: colCount }, (_, c) => {
          let max = ''
          for (const row of cells) {
            const n = row[c]?.num ?? ''
            const frac = n.includes('.') ? n.slice(n.indexOf('.')) : ''
            if (frac.length > max.length) max = frac
          }
          return max
        })
        const rows = cells.map((row, i) => {
          const opTex = i === 0 ? '' : OP_TEX[ops[i - 1]] ?? ''
          const cols = row.flatMap((seg, c) => [
            seg ? numCell(seg.num, maxFracs[c]) : '',
            seg?.unit ? `\\text{${texEscape(seg.unit)}}` : '',
          ])
          return [opTex, ...cols]
        })
        return { latex: buildStack(rows, colCount) }
      }
    }
  }

  // Fallback: stack whole operands right-aligned in a single column (handles
  // scientific notation, money, or anything with embedded math)
  const rows = operands.map((o, i) => {
    const opTex = i === 0 ? '' : OP_TEX[ops[i - 1]] ?? ''
    return [opTex, textify(o.text), '']
  })
  return { latex: buildStack(rows, 1) }
}
