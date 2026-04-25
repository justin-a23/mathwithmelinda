'use client'

import katex from 'katex'

// Renders a string that may contain KaTeX expressions wrapped in \(...\) or \[...\].
// Plain text outside those delimiters is rendered as-is (HTML-escaped).
//
// Multi-row environments (\begin{cases}, aligned, array, gathered, split, matrix)
// require displayMode to render their `\\` row separators as actual line breaks.
// We auto-promote inline `\(...\)` delimiters to displayMode when one of these
// environments is detected so the author doesn't have to remember to use \[...\].

const MULTIROW_ENVIRONMENTS = /\\begin\{(cases|aligned|align|array|gathered|gather|split|matrix|pmatrix|bmatrix|vmatrix|smallmatrix)\*?\}/

function renderMixedMath(input: string): string {
  const parts = input.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g)
  return parts.map(part => {
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return safeKatex(part.slice(2, -2), true)
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const tex = part.slice(2, -2)
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
