'use client'

import { useEffect, useRef } from 'react'

// Renders a string that may contain KaTeX expressions wrapped in \(...\) or \[...\]
// Plain text outside those delimiters is rendered as-is.
export default function MathRenderer({ text, block = false }: { text: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current || !text) return

    import('katex').then(({ default: katex }) => {
      if (!ref.current) return
      // Render inline \(...\) and display \[...\] delimiters
      const html = renderMixedMath(text, katex)
      ref.current.innerHTML = html
    })
  }, [text])

  return (
    <span
      ref={ref}
      style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
    >
      {text}
    </span>
  )
}

function renderMixedMath(input: string, katex: any): string {
  // Split on \(...\) inline math and \[...\] display math
  const parts = input.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g)
  return parts.map(part => {
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const math = part.slice(2, -2)
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false })
      } catch {
        return part
      }
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const math = part.slice(2, -2)
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false })
      } catch {
        return part
      }
    }
    // Plain text — escape HTML
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }).join('')
}
