'use client'

/**
 * Before/after picker shown under a diagram the editor auto-cleaned. The
 * cleaned version is preselected; "Original" is for the occasional photo the
 * cleanup hurts (colored shading, very light pencil).
 */

export type DiagramVersions = {
  original: File
  originalUrl: string
  cleaned: File
  cleanedUrl: string
}

type Props = {
  versions: DiagramVersions
  current: File | null
  onPick: (file: File, url: string) => void
}

export default function DiagramVersionToggle({ versions, current, onPick }: Props) {
  const options = [
    { label: 'Cleaned up', file: versions.cleaned, url: versions.cleanedUrl },
    { label: 'Original', file: versions.original, url: versions.originalUrl },
  ]
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
        Cleaned up so it prints white. Pick the original if anything looks lost.
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {options.map(o => {
          const selected = current === o.file
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onPick(o.file, o.url)}
              style={{
                width: '160px', padding: '6px', cursor: 'pointer', background: 'var(--background)',
                border: selected ? '2px solid var(--plum)' : '1px solid var(--gray-light)',
                borderRadius: '8px', fontFamily: 'var(--font-body)', textAlign: 'left',
              }}
            >
              {/* White backing so the preview reads as paper in dark mode too */}
              <img src={o.url} alt={o.label} style={{ width: '100%', height: '70px', objectFit: 'contain', background: '#fff', borderRadius: '4px', display: 'block' }} />
              <div style={{ fontSize: '12px', marginTop: '4px', color: selected ? 'var(--plum)' : 'var(--gray-dark)', fontWeight: selected ? 600 : 400 }}>
                {selected ? '✓ ' : ''}{o.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
