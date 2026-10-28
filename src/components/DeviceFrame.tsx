import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

/**
 * Device frame — renders the 390px phone canvas from Figma.
 * `nav={false}` for full-bleed screens (onboarding, auth) that hide the tab bar.
 *
 * Note: the "9:41 / LTE / Wi-Fi" bar in the Figma exports is a Figma reference
 * element only — it is intentionally not rendered in the product.
 */
export function DeviceFrame({
  children,
  nav = true,
  theme = 'mono',
  bg,
}: {
  children: ReactNode
  nav?: boolean
  theme?: 'mono' | 'amber'
  /** overrides the theme background (S11b uses the danger-soft tint) */
  bg?: string
}) {
  return (
    <div
      className="device"
      data-theme={theme}
      style={{ background: bg ?? (theme === 'amber' ? '#FAF8F4' : undefined) }}
    >
      <div className="screen">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {nav ? <BottomNav /> : null}
      </div>
    </div>
  )
}

/** Standard scrollable content column with the design's horizontal padding. */
export function Content({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto px-5 pb-4 ${className}`}>{children}</div>
}

/** Fixed bottom action area above the nav / home indicator. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-transparent bg-inherit px-5 pt-3 pb-3">{children}</div>
  )
}
