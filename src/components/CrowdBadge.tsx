import type { CrowdLevel } from '../lib/types'

/** Crowd badge — exact colors from Figma: #E8F0FA/#234D7D (low), #A8C5EB/#34649C (mid), #234D7D (high). */

const LEVELS: Record<CrowdLevel, { bg: string; fg: string; glyph: string; label: string }> = {
  low: { bg: '#E8F0FA', fg: '#234D7D', glyph: '○', label: 'Low' },
  medium: { bg: '#A8C5EB', fg: '#34649C', glyph: '≡', label: 'Medium' },
  high: { bg: '#234D7D', fg: '#FFFFFF', glyph: '▲', label: 'High' },
}

export function CrowdBadge({
  level,
  size = 'md',
}: {
  level: CrowdLevel
  size?: 'sm' | 'md'
}) {
  const l = LEVELS[level]
  const pad = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-[13px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] font-semibold ${pad}`}
      style={{ backgroundColor: l.bg, color: l.fg }}
      data-level={level}
    >
      <span aria-hidden className="text-[11px] leading-none">
        {l.glyph}
      </span>
      {l.label}
    </span>
  )
}

/** Progress-style crowd bar used on the train detail screen. */
export function CrowdBar({ level }: { level: CrowdLevel }) {
  const pct = level === 'low' ? 30 : level === 'medium' ? 60 : 88
  return (
    <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#F2F2F2]">
      <div className="h-full rounded-[4px] bg-[#5A5A5A]" style={{ width: `${pct}%` }} />
    </div>
  )
}
