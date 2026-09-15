// Tests for the "Stack vertically" converter (app/lib/verticalStack.ts).
// Run: ./node_modules/.bin/tsx scripts/test-vertical-stack.ts
import { stackVertical } from '../app/lib/verticalStack'
import katex from 'katex'

let failures = 0

function check(name: string, input: string, expect: 'latex' | 'error', mustContain: string[] = []) {
  const r = stackVertical(input)
  const kind = 'error' in r ? 'error' : 'latex'
  let problems: string[] = []
  if (kind !== expect) problems.push(`expected ${expect}, got ${kind}: ${JSON.stringify(r)}`)
  if ('latex' in r) {
    try {
      katex.renderToString(r.latex.slice(2, -2), { displayMode: true, throwOnError: true })
    } catch (e) {
      problems.push(`KaTeX rejected output: ${(e as Error).message}`)
    }
    for (const s of mustContain) {
      if (!r.latex.includes(s)) problems.push(`output missing ${JSON.stringify(s)}`)
    }
  }
  if (problems.length) {
    failures++
    console.log(`FAIL ${name}`)
    console.log(`  input: ${input}`)
    for (const p of problems) console.log(`  ${p}`)
    if ('latex' in r) console.log(`  latex: ${r.latex.replace(/\n/g, ' ')}`)
  } else {
    console.log(`ok   ${name}`)
  }
}

// Melinda's four Lesson 30 - Test 2 problems (the ticket)
check('measure addition, 3 addends', '7 hr. 28 min. + 6 hr. 44 min. + 8 hr. 8 min. =', 'latex',
  ['\\begin{array}{r r l r l}', '\\text{hr.}', '\\text{min.}', '\\hline', '+'])
check('measure subtraction', '19 yd. 28 in. - 16 yd. 31 in. =', 'latex',
  ['\\text{yd.}', '\\text{in.}', '\\hline'])
check('measure times scalar', '6 wk. 5 days x 3 =', 'latex',
  ['\\times', '\\text{3}', '\\text{days}'])
check('measure long division', '9 yd. 12 in. ÷ 4 =', 'latex',
  ['\\overline{\\smash{)}', '\\text{9 yd. 12 in.}', '\\text{4}'])

// Scientific notation: + splits, × stays inside rows (fallback single column)
check('scientific notation sum', '5.59 × \\(10^{-6}\\) + 1.3 × \\(10^{-6}\\) =', 'latex',
  ['{10^{-6}}', '\\text{5.59 }\\times', '\\begin{array}{r r l}'])

// Decimal alignment via phantom padding
check('decimal padding', '12.5 + 3 + 0.75 =', 'latex', ['\\hphantom{\\text{.75}}', '\\text{12.5}\\hphantom{\\text{5}}'])
check('decimals with units', '5.2 hr. + 3.75 hr. =', 'latex', ['\\text{5.2}\\hphantom{\\text{5}}', '\\text{hr.}'])

// Money stays whole-operand (starts with $, not a digit)
check('money fallback', '$5.50 + $2.25 =', 'latex', ['\\text{\\$5.50}'])

// Plain integer column addition
check('plain integers', '345 + 62 + 1,008 =', 'latex', ['\\text{1,008}'])

// Failure modes
check('no operator', 'hello world', 'error')
check('empty', '   ', 'error')
check('divide by measure', '9 yd. ÷ 2 yd. =', 'error')
check('single operand', '42 =', 'error')

// Hyphenated words must not split (hyphen has no surrounding spaces)
check('hyphen inside words', 'twenty-one apples + 3 apples', 'latex')

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall tests passed')
process.exit(failures ? 1 : 0)
