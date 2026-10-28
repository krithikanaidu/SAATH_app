import { useRef, type ReactNode } from 'react'

/** Field label + control, matching Figma "Input/Field". */
export function Field({
  label,
  children,
  hint,
  htmlFor,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[14px] leading-[17px] font-semibold text-black"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] leading-[15px] text-[#616161]">{hint}</p> : null}
    </div>
  )
}

/** Native select styled like the design's dropdown rows. */
export function Select({
  value,
  onChange,
  options,
  id,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  id?: string
  'aria-label'?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 pr-10 text-[16px] text-[#202020] disabled:text-[#616161]"
      >
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-[#202020]"
      >
        ⌄
      </span>
    </div>
  )
}

/** Text input. */
export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = 'text',
  inputMode,
  maxLength,
  error,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel'
  maxLength?: number
  error?: string
  'aria-label'?: string
}) {
  return (
    <>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-[8px] border bg-white px-4 py-3.5 text-[16px] text-[#202020] placeholder:text-[#B8B8B8] ${
          error ? 'border-[#D92D20]' : 'border-[#DDDDDD]'
        }`}
      />
      {error ? (
        <p role="alert" className="text-[12px] leading-[15px] text-[#D92D20]">
          {error}
        </p>
      ) : null}
    </>
  )
}

/**
 * Segmented OTP entry (amber system) — used by the verify step of sign-up.
 * Typing fills forward, backspace clears and steps back, and pasting a code
 * distributes it across the boxes.
 */
export function OtpInput({
  length = 4,
  onChange,
  label = 'OTP',
}: {
  length?: number
  onChange: (value: string) => void
  label?: string
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const setAt = (index: number, digit: string) => {
    const next = refs.current.map((el, i) => (i === index ? digit : el?.value ?? ''))
    onChange(next.join(''))
  }

  return (
    <div role="group" aria-label={label} className="flex gap-3">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`${label} digit ${i + 1}`}
          onChange={e => {
            const digit = e.target.value.replace(/\D/g, '').slice(-1)
            setAt(i, digit)
            if (digit && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !refs.current[i]?.value && i > 0) {
              refs.current[i - 1]?.focus()
            }
          }}
          onPaste={e => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (!pasted) return
            e.preventDefault()
            onChange(pasted.padEnd(length, ' ').trimEnd())
            refs.current[Math.min(pasted.length, length - 1)]?.focus()
          }}
          className="h-[64px] w-full min-w-0 flex-1 border-[3px] border-[#111111] bg-white text-center text-[26px] font-bold outline-none focus:bg-[#FFF6D6]"
        />
      ))}
    </div>
  )
}
