import { useNavigate } from 'react-router-dom'
import { DeviceFrame } from '../components/DeviceFrame'
import { SplitButton } from '../components/amber'
import { useStore } from '../lib/store'
import type { Language } from '../lib/types'

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी · Hindi' },
  { id: 'mr', label: 'मराठी · Marathi' },
]

/**
 * S01 — Splash + language selection.
 * Rendered in the amber system so the whole first-run journey (S01 → S04)
 * shares one consistent look.
 */
export function SplashLanguage() {
  const navigate = useNavigate()
  const { state, update } = useStore()

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-5">
        {/* brand */}
        <div className="flex flex-col items-center pt-6 pb-2">
          <div
            className="flex h-[110px] w-[110px] items-center justify-center border-[3px] border-[#111111] bg-white shadow-[6px_6px_0_0_#111111]"
            aria-hidden
          >
            <span className="font-display text-[68px] leading-none text-[#111111]">S</span>
          </div>
          <p className="mt-5 font-display text-[42px] leading-none tracking-wide">SAATH · साथ</p>
          <p className="mt-3 max-w-[280px] text-center text-[16px] leading-[22px] text-[#5A5750]">
            Travel together. Travel with confidence.
          </p>
        </div>

        <div className="mt-6">
          <p id="lang-label" className="font-display text-[20px] tracking-[0.04em]">
            CHOOSE YOUR LANGUAGE
          </p>

          <div role="radiogroup" aria-labelledby="lang-label" className="mt-3 space-y-3">
            {LANGUAGES.map(({ id, label }) => {
              const selected = state.language === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ language: id })}
                  className={`flex w-full items-center gap-3 border-[3px] border-[#111111] px-4 py-4 text-left text-[17px] transition-transform active:translate-y-[1px] ${
                    selected ? 'bg-[#F9B800] shadow-[4px_4px_0_0_#111111]' : 'bg-white'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[3px] border-[#111111] ${
                      selected ? 'bg-[#111111]' : 'bg-white'
                    }`}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-[#F9B800]" /> : null}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-[13px] leading-[18px] text-[#5A5750]">
            For Mumbai local journeys. You can change your language later in settings.
          </p>
        </div>

        <div className="flex-1" />

        <div>
          <SplitButton onClick={() => navigate('/onboarding')}>CONTINUE</SplitButton>
        </div>
      </div>
    </DeviceFrame>
  )
}
