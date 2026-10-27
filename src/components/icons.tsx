/** Minimal line icons drawn to match the Figma "Icon/Line" set (24px grid, 1.75 stroke). */

type Props = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function IconHome({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function IconTrain({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="4" width="14" height="13" rx="2.5" />
      <path d="M5 10h14" />
      <path d="M8.5 13.5h.01M15.5 13.5h.01" strokeWidth={2.25} />
      <path d="m7.5 17-2 3M16.5 17l2 3" />
    </svg>
  )
}

export function IconGroups({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="6.5" r="2.4" />
      <circle cx="5.5" cy="9.5" r="2" />
      <circle cx="18.5" cy="9.5" r="2" />
      <path d="M7.5 19c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2" />
      <path d="M2.5 18.5c0-2 1.3-3.4 3.2-3.6" />
      <path d="M21.5 18.5c0-2-1.3-3.4-3.2-3.6" />
    </svg>
  )
}

export function IconSafety({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" />
      <path d="M12 8.5v4M12 15.5h.01" strokeWidth={2} />
    </svg>
  )
}

export function IconProfile({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="7.5" r="3.2" />
      <path d="M5.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
    </svg>
  )
}
