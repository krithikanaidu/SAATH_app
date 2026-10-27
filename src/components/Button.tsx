import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'amber' | 'amberSplit' | 'danger'

const VARIANTS: Record<Variant, string> = {
  /* dark filled — mono screens' main CTA */
  primary:
    'bg-[#202020] text-white hover:bg-black active:bg-black disabled:bg-[#B8B8B8]',
  /* outlined — secondary actions */
  secondary:
    'bg-white text-[#202020] border border-[#202020] hover:bg-[#F2F2F2]',
  /* underlined text link */
  ghost:
    'bg-transparent text-[#202020] underline underline-offset-4 hover:text-[#616161] disabled:text-[#B8B8B8] disabled:no-underline',
  /* amber filled — amber screens */
  amber:
    'bg-[#F9B800] text-[#111111] hover:brightness-95 disabled:bg-[#E8E4DC] disabled:text-[#5A5750]',
  /* amber split button: yellow body + black arrow block (amber screens) */
  amberSplit:
    'bg-[#F9B800] text-[#111111] hover:brightness-95 disabled:bg-[#E8E4DC]',
  /* destructive (unused in prototype, kept for SOS flows) */
  danger:
    'bg-[#D92D20] text-white hover:brightness-95',
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  full = true,
  ...rest
}: {
  variant?: Variant
  children: ReactNode
  full?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[8px] text-[16px] font-semibold transition-[filter,background-color] disabled:cursor-not-allowed'
  const sizing = full ? 'w-full min-h-[56px] px-5' : 'min-h-[44px] px-4'
  const sizeClass =
    variant === 'ghost' ? 'min-h-[40px] px-1 text-[15px]' : sizing

  if (variant === 'amberSplit') {
    return (
      <button
        type="button"
        className={`group relative flex w-full items-stretch overflow-hidden border-2 border-[#111111] bg-[#F9B800] text-[#111111] shadow-[4px_4px_0_0_#111111] disabled:cursor-not-allowed ${className}`}
        {...rest}
      >
        <span className="flex flex-1 items-center justify-center px-4 py-4 text-[18px] font-bold tracking-wide uppercase">
          {children}
        </span>
        <span
          className="flex w-16 shrink-0 items-center justify-center bg-[#111111] text-[24px] text-white"
          aria-hidden
        >
          →
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`${base} ${VARIANTS[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
