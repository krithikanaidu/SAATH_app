import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { CrowdLevel } from '../lib/types'

/**
 * Shared pieces for the amber (Bebas Neue / cream / #F9B800) visual system.
 * In the Figma file every loading, empty, offline, error and confirmation
 * screen uses this system while the 12 primary screens use the mono system.
 */

export const AMBER_BG = '#FAF8F4'
export const AMBER = '#F9B800'
export const AMBER_INK = '#111111'
export const AMBER_MUTED = '#5A5750'

/** white card with the hard offset shadow used throughout the amber screens */
export function AmberBox({
  children,
  className = '',
  tone = 'surface',
  shadow = true,
}: {
  children: ReactNode
  className?: string
  tone?: 'surface' | 'amber'
  shadow?: boolean
}) {
  return (
    <div
      className={`border-[3px] ${AMBER_INK} ${shadow ? 'shadow-[6px_6px_0_0_#111111]' : ''} ${
        tone === 'amber' ? AMBER : 'bg-white'
      } ${className}`}
      style={{ borderColor: AMBER_INK }}
    >
      {children}
    </div>
  )
}

/** split CTA: yellow body + black arrow block, or the disabled beige variant */
export function SplitButton({
  children,
  disabled = false,
  onClick,
  ariaLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex w-full items-stretch border-[3px] disabled:cursor-not-allowed ${
        disabled
          ? 'border-[#111111] bg-[#E4DED0]'
          : `bg-[${AMBER}] shadow-[5px_5px_0_0_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_0_#111111]`
      }`}
      style={{ borderColor: AMBER_INK }}
    >
      <span
        className={`flex flex-1 items-center justify-center px-4 py-4 font-display text-[20px] tracking-wide ${
          disabled ? 'text-[#A8A196]' : 'text-[#111111]'
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`flex w-[64px] shrink-0 items-center justify-center text-[26px] ${
          disabled ? 'bg-[#A8A196] text-[#E4DED0]' : 'bg-[#111111] text-white'
        }`}
      >
        →
      </span>
    </button>
  )
}

/** crowd badge in the amber system: [colour square] LEVEL + people glyph */
const AMBER_CROWD: Record<CrowdLevel, { square: string; label: string }> = {
  low: { square: '#3BA55D', label: 'LOW' },
  medium: { square: '#F9B800', label: 'MEDIUM' },
  high: { square: '#E5484D', label: 'HIGH' },
}

export function AmberCrowdBadge({ level, muted = false }: { level: CrowdLevel; muted?: boolean }) {
  const c = AMBER_CROWD[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-[3px] px-2 py-1.5 font-display text-[16px] tracking-wide ${
        muted ? 'border-[#B8B4AB] bg-[#EFECE5] text-[#A8A196]' : 'bg-white'
      }`}
      style={{ borderColor: muted ? '#B8B4AB' : AMBER_INK }}
    >
      <span aria-hidden className="h-4 w-4 shrink-0" style={{ background: muted ? '#CFCAC0' : c.square, border: `2px solid ${AMBER_INK}` }} />
      {c.label}
      {!muted ? <PeopleGlyph /> : null}
    </span>
  )
}

function PeopleGlyph() {
  return (
    <svg width="26" height="12" viewBox="0 0 34 14" fill="none" stroke={AMBER_INK} strokeWidth="1.8" aria-hidden>
      <circle cx="7" cy="3.2" r="2.2" />
      <path d="M3.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
      <circle cx="17" cy="3.2" r="2.2" />
      <path d="M13.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
      <circle cx="27" cy="3.2" r="2.2" />
      <path d="M23.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
    </svg>
  )
}

/** yellow offline banner used on S05c / S06b / S08c */
export function OfflineBanner({ text = 'You are offline. Showing last known crowd levels.' }: { text?: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 border-[3px] px-4 py-3 shadow-[5px_5px_0_0_#111111]"
      style={{ background: AMBER, borderColor: AMBER_INK }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={AMBER_INK} strokeWidth="2" strokeLinecap="round" aria-hidden className="mt-0.5 shrink-0">
        <path d="M2 2l20 20" />
        <path d="M5 12.5a11 11 0 0 1 4-2.4M12 5c2.9 0 5.7 1.1 8 3.2" />
        <path d="M8.5 16a6 6 0 0 1 7-1.2" />
        <path d="M12 20h.01" strokeWidth="2.6" />
      </svg>
      <p className="text-[17px] leading-[23px]">{text}</p>
    </div>
  )
}

/** section label above cached data: "LAST KNOWN CROWD LEVELS" */
export function LastKnownLabel() {
  return (
    <p className="mt-6 font-display text-[18px] tracking-[0.06em] text-[#6E6A62] uppercase">
      Last known crowd levels
    </p>
  )
}

/* ---------------- amber bottom navigation ---------------- */

const AMBER_TABS = [
  { to: '/home', label: 'HOME', Icon: IconHomeA, match: ['/home', '/train', '/queue'] },
  { to: '/smart-window', label: 'PLAN', Icon: IconPlanA, match: ['/smart-window'] },
  { to: '/groups', label: 'GROUPS', Icon: IconGroupsA, match: ['/groups'] },
  { to: '/sos', label: 'SAFETY', Icon: IconSafetyA, match: ['/sos'] },
  { to: '/profile', label: 'ME', Icon: IconMeA, match: ['/profile'] },
]

export function AmberNav() {
  const { pathname } = useLocation()
  return (
    <nav className="nav-safe shrink-0 border-t-[3px] bg-white" style={{ borderColor: AMBER_INK }} aria-label="Primary">
      <ul className="flex">
        {AMBER_TABS.map(({ to, label, Icon, match }) => {
          const active = match.some(p => pathname === p || pathname.startsWith(p + '/'))
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1.5 px-1 pt-3 pb-1 transition-transform active:translate-y-[1px]"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center border-[3px] ${
                    active ? '' : 'border-transparent'
                  }`}
                  style={active ? { background: AMBER, borderColor: AMBER_INK } : undefined}
                >
                  <Icon />
                </span>
                <span
                  className={`text-[13px] leading-none ${active ? 'font-bold text-black' : 'text-[#5A5750]'}`}
                >
                  {label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
      <div aria-hidden className="mx-auto mt-1 mb-1 h-[5px] w-[134px] rounded-full bg-black" />
    </nav>
  )
}

/* ---------------- amber shell ---------------- */

/**
 * Full amber frame: cream background, optional amber tab bar.
 * `back` renders the squared back button used on stack screens.
 */
export function AmberShell({
  children,
  nav = true,
  back,
  title,
  right,
  bg,
}: {
  children: ReactNode
  nav?: boolean
  back?: () => void
  title?: string
  right?: ReactNode
  /** overrides the cream background (S11b uses the danger-soft tint) */
  bg?: string
}) {
  return (
    <div className="device" style={{ background: bg ?? AMBER_BG }}>
      <div className="screen">
        <div className="flex min-h-0 flex-1 flex-col" style={{ color: AMBER_INK }}>
          {back || title ? (
            <div className="flex items-center gap-4 px-4 pt-2 pb-3">
              {back ? (
                <button
                  type="button"
                  onClick={back}
                  aria-label="Go back"
                  className="flex h-[54px] w-[54px] shrink-0 items-center justify-center border-[3px] bg-white text-[26px] leading-none"
                  style={{ borderColor: AMBER_INK }}
                >
                  ←
                </button>
              ) : null}
              {title ? (
                <h1 className="font-display text-[34px] leading-none tracking-wide">{title}</h1>
              ) : null}
              <div className="ml-auto">{right}</div>
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2">{children}</div>
        </div>
        {nav ? (
          <AmberNav />
        ) : (
          <div className="nav-safe px-4 pt-2">
            <div aria-hidden className="mx-auto h-[5px] w-[134px] rounded-full bg-black" />
          </div>
        )}
      </div>
    </div>
  )
}

/** dashed skeleton block — the loading placeholder used in the amber screens */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse border-[3px] border-dashed border-[#111111] ${className}`}
      style={{ borderColor: '#111111' }}
    />
  )
}

/* ---------------- amber icons ---------------- */

const stroke = {
  fill: 'none',
  stroke: AMBER_INK,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconHomeA() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M4 10.5 12 4l8 6.5V20H4z" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  )
}
function IconPlanA() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M6 5h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6" />
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="18" cy="17" r="2.2" />
    </svg>
  )
}
function IconGroupsA() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.4a3 3 0 0 1 0 5.2M17 14.4c2 .7 3.5 2.4 3.5 4.6" />
    </svg>
  )
}
function IconSafetyA() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M6 16a6 6 0 0 1 12 0z" />
      <path d="M12 4v2M4.5 7.5l1.5 1M19.5 7.5 18 8.5M3 16h18" />
    </svg>
  )
}
function IconMeA() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6" />
    </svg>
  )
}

/** amber home header: GOOD MORNING, <name> + bell + avatar */
export function AmberHomeHeader({ name = 'Asha' }: { name?: string }) {
  const first = name.trim().split(/\s+/)[0] || 'Asha'
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || 'AS'
  return (
    <header className="flex items-center gap-3 px-4 pt-3 pb-2">
      <p className="font-display text-[19px] tracking-[0.06em] uppercase">Good morning,</p>
      <p className="font-display text-[40px] leading-none tracking-wide uppercase">{first}</p>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-[46px] w-[46px] items-center justify-center border-[3px] bg-white"
          style={{ borderColor: AMBER_INK }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
            <path d="M6 16a6 6 0 0 1 12 0z" />
            <path d="M12 4v2M4.5 7.5l1.5 1M19.5 7.5 18 8.5M4 16h16" />
          </svg>
          <span aria-hidden className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF5A1F]" />
        </button>
        <span
          className="flex h-[46px] w-[46px] items-center justify-center border-[3px] font-display text-[19px]"
          style={{ background: AMBER, borderColor: AMBER_INK }}
        >
          {initials}
        </span>
      </div>
    </header>
  )
}
