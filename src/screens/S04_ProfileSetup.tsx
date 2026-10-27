import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { Field, Select } from '../components/forms'
import { useStore } from '../lib/store'
import { SplitButton } from '../components/amber'
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

  /* ---------- amber journey form with validation error (S04a_Error) ---------- */
  if (new URLSearchParams(location.search).get('state') === 'error') {
    return <JourneyErrorAmber onFinish={finish} />
  }

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

/* ---------------- amber journey form with validation (S04a_Error) ---------------- */

const LINE_CARDS = [
  { id: 'Western line', label: 'WESTERN' },
  { id: 'Central line', label: 'CENTRAL' },
  { id: 'Harbour line', label: 'HARBOUR' },
]

const SHORT_TIMES = ['08:10 AM', '08:40 AM', '09:20 AM', '18:10 PM']

/**
 * S04a_Error — the usual-journey form as it appears when destination equals
 * origin. Opens in the error state (Andheri → Andheri); fixing the destination
 * clears the error and enables CONTINUE.
 */
function JourneyErrorAmber({ onFinish }: { onFinish: () => void }) {
  const { update } = useStore()
  const [name, setName] = useState('')
  const [line, setLine] = useState('Western line')
  const [from, setFrom] = useState('Andheri')
  const [to, setTo] = useState('Andheri')
  const [time, setTime] = useState('08:40 AM')

  const stations = STATIONS[line] ?? STATIONS['Western line']
  const sameStation = from === to

  return (
    <DeviceFrame nav={false} theme="amber" statusVariant="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex items-start justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={onFinish}
            className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold"
          >
            ←
          </button>
          <div className="mt-5 flex flex-1 items-center gap-2 px-3" aria-hidden>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
            <span className="h-0.5 flex-1 bg-[#111111]" />
            <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
            <span className="h-0.5 flex-1 bg-[#111111]" />
            <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-white" />
          </div>
          <button
            type="button"
            onClick={onFinish}
            className="mt-3 text-[14px] font-bold underline underline-offset-4"
          >
            SKIP
          </button>
        </div>

        <h1 className="mt-3 font-display text-[40px] leading-[44px] tracking-wide uppercase">
          Your usual journey
        </h1>

        {/* full name */}
        <div className="mt-5">
          <label htmlFor="je-name" className="font-display text-[18px] tracking-[0.04em]">
            FULL NAME
          </label>
          <div className="mt-2 flex items-stretch border-[3px] border-[#111111] bg-white">
            <span className="flex w-12 shrink-0 items-center justify-center border-r-[3px] border-[#111111]">
              <IconPerson />
            </span>
            <input
              id="je-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-white px-4 py-4 text-[18px] outline-none placeholder:text-[#A8A196]"
            />
          </div>
        </div>

        {/* line */}
        <div className="mt-5">
          <p className="font-display text-[18px] tracking-[0.04em]">LINE</p>
          <div className="mt-2 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Line">
            {LINE_CARDS.map(card => {
              const selected = line === card.id
              return (
                <button
                  key={card.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickLine(card.id)}
                  className={`relative border-[3px] border-[#111111] px-2 pt-3 pb-2.5 text-left ${
                    selected ? 'bg-[#F9B800] shadow-[4px_4px_0_0_#111111]' : 'bg-white'
                  }`}
                >
                  <span
                    className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#111111] bg-white"
                    aria-hidden
                  >
                    {selected ? <IconCheck /> : null}
                  </span>
                  <IconTrain />
                  <span className="mt-2 block font-display text-[20px] leading-none tracking-wide">
                    {card.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* from / to */}
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="je-from" className="font-display text-[18px] tracking-[0.04em]">
              FROM STATION
            </label>
            <div className="mt-2">
              <AmberField id="je-from" icon={<IconPin />} value={from} options={stations} onChange={setFrom} />
            </div>
          </div>

          <div>
            <label htmlFor="je-to" className="font-display text-[18px] tracking-[0.04em]">
              TO STATION
            </label>
            <div className="mt-2">
              <AmberField
                id="je-to"
                icon={<IconPin />}
                value={to}
                options={stations}
                onChange={setTo}
                error={sameStation}
              />
            </div>
            {sameStation ? (
              <p role="alert" className="mt-2 flex items-start gap-2 text-[17px] leading-[23px] text-[#D92D20]">
                <span aria-hidden>⚠</span> Choose a different destination station.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="je-time" className="font-display text-[18px] tracking-[0.04em]">
              USUAL DEPARTURE
            </label>
            <div className="mt-2">
              <AmberField id="je-time" icon={<IconClock />} value={time} options={SHORT_TIMES} onChange={setTime} />
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="pt-6">
          <SplitButton
            disabled={sameStation}
            onClick={() => {
              update({
                usualLine: line,
                fromStation: from,
                toStation: to,
                departureTime: `${time} · Weekdays`,
                onboarded: true,
                signedIn: true,
                travelAs: 'woman',
              })
              onFinish()
            }}
          >
            CONTINUE
          </SplitButton>
        </div>

        {/* hazard-tape band from the design */}
        <div
          aria-hidden
          className="mt-5 h-10 w-[calc(100%+2rem)] -ml-4"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, #111111 0 12px, transparent 12px 26px)',
          }}
        />
      </div>
    </DeviceFrame>
  )

  function pickLine(id: string) {
    setLine(id)
    setFrom(STATIONS[id][0])
    setTo(STATIONS[id][1])
  }
}

/** labelled bordered field with icon gutter + chevron, used by S04a_Error */
function AmberField({
  id,
  icon,
  value,
  options,
  onChange,
  error = false,
}: {
  id: string
  icon: React.ReactNode
  value: string
  options: string[]
  onChange: (v: string) => void
  error?: boolean
}) {
  return (
    <div
      className={`flex items-stretch border-[3px] bg-white ${error ? 'border-[#D92D20]' : 'border-[#111111]'}`}
    >
      <span className="flex w-12 shrink-0 items-center justify-center border-r-[3px] border-[#111111]">
        {icon}
      </span>
      <div className="relative flex flex-1 items-center">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent py-4 pr-10 pl-4 font-display text-[24px] tracking-wide outline-none"
        >
          {options.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-3 text-[18px]">
          ▾
        </span>
      </div>
    </div>
  )
}

/* amber line-art icons (S04a_Error) */
const amberIcon = {
  fill: 'none',
  stroke: '#111111',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...amberIcon}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...amberIcon}>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}
function IconTrain() {
  return (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden {...amberIcon}>
      <rect x="5" y="2" width="20" height="17" />
      <path d="M5 11h20M11 2v17" />
      <path d="M8 19l-3 5M22 19l3 5" />
      <circle cx="11" cy="15" r="1.2" fill="#111111" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...amberIcon}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden {...amberIcon} strokeWidth={2.6}>
      <path d="M2 6.4 4.6 9 10 3.2" />
    </svg>
  )
}
