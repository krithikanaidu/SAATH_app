import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { parseDeparture } from '../lib/db'
import type { DepartureFrequency, TravelAs } from '../lib/types'
import { STATIONS } from '../lib/mockData'

/**
 * S04 — profile setup, rendered entirely in the amber system so the whole
 * first-run journey (S01 → S04) reads as one continuous flow.
 *
 *   step "journey" → S04a usual-journey form (writes the route into the store,
 *                    which every later screen reads)
 *   step "about"   → S04b traveller type + toggles
 *
 * `/setup?state=error` seeds the same form with from === to, which is exactly
 * how the S04a_Error design appears.
 */

const TRAVEL_AS: { id: string; label: string }[] = [
  { id: 'woman', label: 'Woman commuter' },
  { id: 'senior', label: 'Senior citizen' },
  { id: 'differently-abled', label: 'Differently- abled' },
  { id: 'daily', label: 'Daily commuter' },
]

const LINE_CARDS = [
  { id: 'Western line', label: 'WESTERN' },
  { id: 'Central line', label: 'CENTRAL' },
  { id: 'Harbour line', label: 'HARBOUR' },
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
      className={`relative h-8 w-14 shrink-0 border-2 border-[#111111] transition-colors ${
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

function AmberBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold active:translate-y-[1px]"
    >
      ←
    </button>
  )
}

function AmberFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[20px] tracking-[0.04em] text-[#111111]">{children}</p>
  )
}

function AmberSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full appearance-none border-[3px] border-[#111111] bg-white px-4 py-4 text-[17px] font-semibold outline-none focus:bg-[#FFF6D6] ${props.className ?? ''}`}
    />
  )
}

/** Quick-pick times. Any time can also be typed in — this is a shortcut, not a limit. */
const TIME_PRESETS = [
  { label: 'EARLY', hhmm: '06:15' },
  { label: 'RUSH', hhmm: '08:30' },
  { label: 'MID', hhmm: '11:00' },
  { label: 'EVE', hhmm: '18:45' },
]

const FREQUENCIES: { id: DepartureFrequency; label: string }[] = [
  { id: 'weekdays', label: 'WEEKDAYS' },
  { id: 'weekends', label: 'WEEKENDS' },
  { id: 'daily', label: 'EVERY DAY' },
]

/** "08:30 AM · Weekdays" → "08:30" for the native time input. */
function toHHMM(display: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(display.trim())
  if (m) {
    let h = Number(m[1])
    if (/PM/i.test(m[3]) && h !== 12) h += 12
    if (/AM/i.test(m[3]) && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m[2]}`
  }
  const plain = /^(\d{1,2}):(\d{2})$/.exec(display.trim())
  return plain ? `${String(Number(plain[1])).padStart(2, '0')}:${plain[2]}` : '08:30'
}

/** "08:30" → "08:30 AM" for the button label. */
function prettyTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return hhmm
  const h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m[2]} ${suffix}`
}

const DAYS_SHORT: Record<DepartureFrequency, string> = {
  weekdays: 'Mon–Fri',
  weekends: 'Sat–Sun',
  daily: 'Every day',
}

export function ProfileSetup() {
  const navigate = useNavigate()
  const { state, update } = useStore()
  const { syncProfile } = useAuth()
  const [step, setStep] = useState<'journey' | 'about'>('journey')
  const [travelAs, setTravelAs] = useState<string | null>(null)

  /* ---------- amber "about you" (S04b) ---------- */
  if (step === 'about') {
    const chosen = travelAs ?? 'woman'
    return (
      <DeviceFrame nav={false} theme="amber">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-1 pb-5">
          <div className="flex items-start justify-between">
            <AmberBack onClick={() => setStep('journey')} />
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
                  className={`relative border-2 p-3 text-left transition-all active:translate-y-[1px] ${
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
    void syncProfile({
      onboarded: true,
      travelAs: (travelAs as TravelAs) ?? 'woman',
      largeText: state.largeText,
      shareLocationOnSos: state.shareLocationOnSos,
    })
    navigate('/home')
  }

  /* ---------- amber journey form (S04a / S04a_Error) ---------- */
  const seededError = new URLSearchParams(location.search).get('state') === 'error'

  return (
    <JourneyForm
      seedError={seededError}
      // the seeded error state is a "fix and continue" demo: it completes setup
      onContinue={seededError ? finish : () => setStep('about')}
      onBack={() => navigate('/signup')}
    />
  )
}

/**
 * S04a — the usual-journey form, in the amber system.
 * Saves the route straight into the store so Home, Smart Window, Train Detail
 * and Rewards all reflect the same journey.
 */
function JourneyForm({
  seedError,
  onContinue,
  onBack,
}: {
  seedError: boolean
  onContinue: () => void
  onBack: () => void
}) {
  const { state, update } = useStore()
  const { syncProfile } = useAuth()
  const [name, setName] = useState('')
  const [line, setLine] = useState(state.usualLine)
  const [from, setFrom] = useState(seedError ? 'Andheri' : state.fromStation)
  const [to, setTo] = useState(seedError ? 'Andheri' : state.toStation)
  // departure is a plain "HH:MM" the user owns — any time, not a fixed list
  const [time24, setTime24] = useState(toHHMM(state.departureTime))
  const [freq, setFreq] = useState<DepartureFrequency>(state.departureFrequency ?? 'weekdays')

  const stations = STATIONS[line] ?? STATIONS['Western line']
  const sameStation = from === to
  const departureDisplay = `${prettyTime(time24)} · ${DAYS_SHORT[freq]}`

  const save = () => {
    update({
      usualLine: line,
      fromStation: from,
      toStation: to,
      departureTime: departureDisplay,
      departureFrequency: freq,
      ...(name.trim() ? { name: name.trim() } : {}),
    })
    // push to the backend profile when a user is signed in
    void syncProfile({
      ...(name.trim() ? { name: name.trim() } : {}),
      usualLine: line,
      fromStation: from,
      toStation: to,
      departureTime: parseDeparture(departureDisplay),
    })
    onContinue()
  }

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-1 pb-5">
        <div className="flex items-start justify-between">
          <AmberBack onClick={onBack} />
          <span className="mt-3 text-[14px] font-bold tracking-wide">STEP 1 OF 2</span>
        </div>

        <h1 className="mt-3 font-display text-[40px] leading-[42px] tracking-wide uppercase">
          Your usual journey
        </h1>
        <p className="mt-2 text-[16px] leading-[22px] text-[#5A5750]">
          Set your routine so Saath can suggest calmer departures. All preferences can be
          changed later.
        </p>

        {/* name */}
        <div className="mt-5">
          <AmberFieldLabel>WHAT SHOULD WE CALL YOU?</AmberFieldLabel>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full border-[3px] border-[#111111] bg-white px-4 py-4 text-[17px] outline-none focus:bg-[#FFF6D6]"
          />
        </div>

        {/* line */}
        <div className="mt-5">
          <AmberFieldLabel>USUAL LINE</AmberFieldLabel>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Usual line">
            {LINE_CARDS.map(l => {
              const selected = line === l.id
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setLine(l.id)
                    const s = STATIONS[l.id] ?? STATIONS['Western line']
                    setFrom(s[0])
                    setTo(s[1])
                  }}
                  className={`border-[3px] border-[#111111] py-3 font-display text-[19px] tracking-[0.04em] transition-all active:translate-y-[1px] ${
                    selected ? 'bg-[#F9B800] shadow-[3px_3px_0_0_#111111]' : 'bg-white'
                  }`}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* from / to */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <AmberFieldLabel>FROM</AmberFieldLabel>
            <AmberSelect
              id="je-from"
              aria-label="From station"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="mt-2"
            >
              {stations.map(s => (
                <option key={s}>{s}</option>
              ))}
            </AmberSelect>
          </div>
          <div>
            <AmberFieldLabel>TO</AmberFieldLabel>
            <AmberSelect
              id="je-to"
              aria-label="To station"
              value={to}
              onChange={e => setTo(e.target.value)}
              className={`mt-2 ${sameStation ? 'border-[#C81D25] bg-[#FFE9E6]' : ''}`}
            >
              {stations.map(s => (
                <option key={s}>{s}</option>
              ))}
            </AmberSelect>
          </div>
        </div>

        {sameStation ? (
          <div
            role="alert"
            className="mt-3 border-[3px] border-[#111111] bg-[#FFE9E6] p-3 shadow-[4px_4px_0_0_#111111]"
          >
            <p className="font-display text-[20px] tracking-[0.04em] text-[#C81D25]">
              SAME STATION PICKED
            </p>
            <p className="mt-1 text-[13px] leading-[17px] text-[#111111]">
              Choose a different destination station than your origin.
            </p>
          </div>
        ) : null}

        {/* departure — flexible: presets, any time, and how often they travel */}
        <div className="mt-5">
          <AmberFieldLabel>USUAL DEPARTURE</AmberFieldLabel>

          {/* quick presets */}
          <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label="Quick departure times">
            {TIME_PRESETS.map(p => {
              const selected = time24 === p.hhmm
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTime24(p.hhmm)}
                  className={`border-[3px] border-[#111111] py-3 text-[13px] font-bold transition-all active:translate-y-[1px] ${
                    selected ? 'bg-[#F9B800] shadow-[3px_3px_0_0_#111111]' : 'bg-white'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* free time picker — the user chooses any time that fits their routine */}
          <div className="mt-3 flex items-stretch border-[3px] border-[#111111] bg-white focus-within:bg-[#FFF6D6]">
            <span className="flex items-center border-r-[3px] border-[#111111] px-3 font-display text-[20px]">
              TIME
            </span>
            <input
              id="je-time"
              type="time"
              aria-label="Departure time"
              value={time24}
              onChange={e => e.target.value && setTime24(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[22px] tracking-[0.06em] outline-none"
            />
            <span className="flex items-center border-l-[3px] border-[#111111] px-3 font-display text-[20px]">
              {prettyTime(time24)}
            </span>
          </div>

          {/* frequency — how often they make this journey */}
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="How often you travel">
            {FREQUENCIES.map(f => {
              const selected = freq === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFreq(f.id)}
                  className={`border-[3px] border-[#111111] py-3 text-[13px] font-bold transition-all active:translate-y-[1px] ${
                    selected ? 'bg-[#F9B800] shadow-[3px_3px_0_0_#111111]' : 'bg-white'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-[13px] leading-[17px] text-[#5A5750]">
            Saath will suggest calmer departures around {prettyTime(time24)} on {DAYS_SHORT[freq]}.
          </p>
        </div>

        <div className="flex-1" />

        <Button variant="amberSplit" onClick={save} disabled={sameStation}>
          CONTINUE
        </Button>
      </div>
    </DeviceFrame>
  )
}
