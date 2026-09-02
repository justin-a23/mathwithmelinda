'use client'

import katex from 'katex'

// Renders a string that may contain KaTeX expressions.
// Supported math delimiters:
//   \(...\)  — inline math
//   \[...\]  — display math
//   $...$    — inline math (standard markdown LaTeX syntax)
//   $$...$$  — display math
// Plain text outside those delimiters is rendered as-is (HTML-escaped).
//
// Multi-row environments (\begin{cases}, aligned, array, gathered, split, matrix)
// require displayMode to render their `\\` row separators as actual line breaks.
// We auto-promote inline `\(...\)` and `$...$` delimiters to displayMode when one
// of these environments is detected so the author doesn't have to remember to
// switch to display syntax.

const MULTIROW_ENVIRONMENTS = /\\begin\{(cases|aligned|align|array|gathered|gather|split|matrix|pmatrix|bmatrix|vmatrix|smallmatrix)\*?\}/

// Split pattern for all four delimiter styles. Order matters: $$...$$ must be
// tried before $...$ so we don't split a display-math chunk into two inline
// chunks. The $-style patterns avoid matching newlines (math is normally
// inline) and require a non-empty body. Inside a $-delimited body, `\$` (and
// any other backslash escape) is consumed as a pair, so a money amount written
// as `$\$18$` parses as ONE math chunk whose tex is `\$18` — which KaTeX
// renders as a literal dollar sign. Without that, `$\$18$ ... $\$37$` split as
// `$\$` + `18` + `$ ... $`, turning the prose between two amounts into math.
//
// The print popups in app/lessons and app/teacher/library import this same
// pattern — change it here and every renderer changes together.
export const MATH_DELIMITER_SPLIT = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$(?:\\[\s\S]|[^$])+?\$\$|\$(?:\\[\s\S]|[^$\n])+?\$)/g

function renderMixedMath(input: string): string {
  const parts = input.split(MATH_DELIMITER_SPLIT)
  return parts.map(part => {
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return safeKatex(part.slice(2, -2), true)
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const tex = part.slice(2, -2)
      const display = MULTIROW_ENVIRONMENTS.test(tex)
      return safeKatex(tex, display)
    }
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      return safeKatex(part.slice(2, -2), true)
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const tex = part.slice(1, -1)
      const display = MULTIROW_ENVIRONMENTS.test(tex)
      return safeKatex(tex, display)
    }
    return escapeHtml(part)
  }).join('')
}

function safeKatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false })
  } catch {
    return escapeHtml(tex)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function MathRenderer({ text }: { text: string; block?: boolean }) {
  const html = renderMixedMath(text || '')
  return (
    <span
      style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
