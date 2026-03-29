'use client'

import { useTheme } from '../ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title="Toggle light / dark mode"
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
