import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { Field, Select } from '../components/forms'
import { useStore } from '../lib/store'
import type { TravelAs } from '../lib/types'
import { DEPARTURE_TIMES, LINES, STATIONS } from '../lib/mockData'

/**
 * S04 — profile setup.
 *  step "journey" → S04a (mono): usual journey form
 *  step "about"   → S04b (amber): traveller type + toggles
 */

const TRAVEL_AS: { id: string; label: string }[] = [
  { id: 'woman', label: 'Woman commuter' },
  { id: 'senior', label: 'Senior citizen' },
  { id: 'differently-abled', label: 'Differently- abled' },
  { id: 'daily', label: 'Daily commuter' },
]

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 border-2 border-[#111111] transition-colors ${
        checked ? 'bg-[#F9B800]' : 'bg-white'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#111111] transition-all ${
          checked ? 'left-8' : 'left-1'
        }`}
      />
    </button>
  )
}

export function ProfileSetup() {
  const navigate = useNavigate()
  const { state, update } = useStore()
  const [step, setStep] = useState<'journey' | 'about'>('journey')
  const [travelAs, setTravelAs] = useState<string | null>(null)

  const stations = STATIONS[state.usualLine] ?? STATIONS['Western line']

  /* ---------- amber "about you" (S04b) ---------- */
  if (step === 'about') {
    const chosen = travelAs ?? 'woman'
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <div className="flex items-start justify-between">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => setStep('journey')}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold"
            >
              ←
            </button>
            <div className="mt-5 flex flex-1 items-center gap-2 px-3" aria-hidden>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
            </div>
            <button
              type="button"
              onClick={() => finish()}
              className="mt-3 text-[14px] font-bold underline underline-offset-4"
            >
              SKIP
            </button>
          </div>

          <h1 className="mt-3 font-display text-[40px] leading-[44px] tracking-wide uppercase">
            About you
          </h1>
          <p className="mt-2 text-[16px] text-[#5A5750]">
            This helps us tailor suggestions. Choose one.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {TRAVEL_AS.map(t => {
              const selected = chosen === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTravelAs(t.id)}
                  className={`relative border-2 p-3 text-left transition-all ${
                    selected
                      ? 'border-[#F9B800] bg-[#FFF1C2] shadow-[4px_4px_0_0_#111111]'
                      : 'border-[#DDD9D0] bg-white'
                  }`}
                >
                  <span
                    className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-[#111111] bg-[#F9B800]' : 'border-[#CCC7BD] bg-white'
                    }`}
                    aria-hidden
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <span className="block text-[20px]" aria-hidden>
                    🚃
                  </span>
                  <span className="mt-2 block pr-6 font-display text-[18px] leading-[20px] tracking-wide uppercase">
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-4">
              <span className="text-[17px] font-bold">Large text mode</span>
              <Toggle
                label="Large text mode"
                checked={state.largeText}
                onChange={v => update({ largeText: v })}
              />
            </div>
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-4">
              <span className="text-[17px] font-bold">Share location during SOS</span>
              <Toggle
                label="Share location during SOS"
                checked={state.shareLocationOnSos}
                onChange={v => update({ shareLocationOnSos: v })}
              />
            </div>
          </div>

          <div className="flex-1" />

          <Button variant="amberSplit" onClick={() => finish()}>
            Save and start
          </Button>
          <p className="mt-3 text-center text-[14px] text-[#5A5750]">
            🛡 You can update these anytime in settings.
          </p>
        </div>
      </DeviceFrame>
    )
  }

  function finish() {
    update({
      onboarded: true,
      signedIn: true,
      travelAs: (travelAs as TravelAs) ?? 'woman',
    })
    navigate('/home')
  }

  /* ---------- mono journey form (S04a) ---------- */
  return (
    <DeviceFrame nav={false}>
      <ScreenHeader title="" onBack={() => setStep('about')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Your usual journey</h1>
        <p className="mt-3 text-[16px] leading-[24px] text-[#616161]">
          Set your routine for useful suggestions.
          <br />
          All preferences can be changed later.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Usual line" htmlFor="line">
            <Select
              id="line"
              value={state.usualLine}
              options={LINES}
              onChange={v => update({ usualLine: v, fromStation: STATIONS[v][0], toStation: STATIONS[v][1] })}
            />
          </Field>

          <Field label="From station" htmlFor="from">
            <Select
              id="from"
              value={state.fromStation}
              options={stations}
              onChange={v => update({ fromStation: v })}
            />
          </Field>

          <Field label="To station" htmlFor="to">
            <Select
              id="to"
              value={state.toStation}
              options={stations}
              onChange={v => update({ toStation: v })}
            />
          </Field>

          <Field label="Usual departure time" htmlFor="dep">
            <Select
              id="dep"
              value={state.departureTime}
              options={DEPARTURE_TIMES}
              onChange={v => update({ departureTime: v })}
            />
          </Field>

          <div>
            <p className="text-[14px] font-semibold">I travel as (optional)</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: 'woman', label: 'Woman' },
                { id: 'senior', label: 'Senior' },
                { id: 'differently-abled', label: 'Differently-abled' },
              ].map(t => {
                const selected = state.travelAs === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      update({ travelAs: (state.travelAs === t.id ? null : t.id) as TravelAs })
                    }
                    className={`rounded-[4px] border px-2 py-3 text-[13px] leading-[16px] ${
                      selected
                        ? 'border-2 border-[#202020] bg-[#F2F2F2]'
                        : 'border-[#DDDDDD] bg-white'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[16px]">Large text</span>
            <button
              type="button"
              role="switch"
              aria-checked={state.largeText}
              aria-label="Large text"
              onClick={() => update({ largeText: !state.largeText })}
              className={`relative h-7 w-12 rounded-full border border-[#B8B8B8] transition-colors ${
                state.largeText ? 'bg-[#202020]' : 'bg-white'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
                  state.largeText ? 'left-6 bg-white' : 'left-0.5 bg-[#616161]'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => setStep('about')}>Save preferences</Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
