import type { ReactNode } from 'react'

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
