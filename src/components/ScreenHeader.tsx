import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

/**
 * Screen header with back arrow, matching Figma "Header/Screen".
 * variant "plain"   — arrow + centred title (mono screens)
 * variant "display" — arrow + large left-aligned display title (amber screens)
 */
export function ScreenHeader({
  title,
  onBack,
  variant = 'plain',
  right,
}: {
  title: string
  onBack?: () => void
  variant?: 'plain' | 'display'
  right?: ReactNode
}) {
  const navigate = useNavigate()
  const back = onBack ?? (() => navigate(-1))

  if (variant === 'display') {
    return (
      <div className="flex items-start gap-3 px-4 pt-2 pb-1">
        <button
          type="button"
          onClick={back}
          aria-label="Go back"
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] text-[22px] leading-none font-bold bg-white"
        >
          ←
        </button>
        <div className="flex-1 pt-1">{right}</div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center px-4 pt-2 pb-2">
      <button
        type="button"
        onClick={back}
        aria-label="Go back"
        className="flex h-10 w-10 items-center justify-center text-[26px] leading-none"
      >
        ←
      </button>
      <h1 className="pointer-events-none absolute inset-x-0 text-center text-[24px] leading-[29px] font-semibold">
        {title}
      </h1>
      <div className="ml-auto">{right}</div>
    </div>
  )
}
