import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { useStore } from '../lib/store'
import type { Language } from '../lib/types'

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी · Hindi' },
  { id: 'mr', label: 'मराठी · Marathi' },
]

/** S01 — Splash + language selection. */
export function SplashLanguage() {
  const navigate = useNavigate()
  const { state, update } = useStore()

  const choose = (id: Language) => update({ language: id })

  return (
    <DeviceFrame nav={false}>
      <header className="px-5 pt-1 pb-2">
        <h1 className="text-[24px] leading-[29px] font-semibold">Welcome to Saath</h1>
      </header>

      <Content className="flex flex-col">
        {/* brand */}
        <div className="flex flex-col items-center pt-10 pb-6">
          <div
            className="flex h-[120px] w-[120px] items-center justify-center border border-[#202020]"
            aria-hidden
          >
            <span className="text-[64px] leading-none font-semibold text-[#202020]">S</span>
          </div>
          <p className="mt-5 text-[32px] leading-[38px] font-semibold">Saath · साथ</p>
          <p className="mt-4 max-w-[280px] text-center text-[16px] leading-[24px] text-[#202020]">
            Travel together. Travel with confidence.
          </p>
        </div>

        <div className="border-t border-[#DDDDDD] pt-4">
          <p
            id="lang-label"
            className="text-[12px] leading-[15px] font-semibold tracking-wide text-[#616161] uppercase"
          >
            Choose your language
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
                  onClick={() => choose(id)}
                  className={`flex w-full items-center gap-3 rounded-[8px] border px-4 py-4 text-left text-[16px] transition-colors ${
                    selected
                      ? 'border-[#202020] bg-[#F2F2F2] font-medium'
                      : 'border-[#DDDDDD] bg-white hover:bg-[#FAFAFA]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-[#202020] bg-[#202020]' : 'border-[#616161]'
                    }`}
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
            For Mumbai local journeys. You can change your language later.
          </p>
        </div>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => navigate('/onboarding')}>Continue</Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
