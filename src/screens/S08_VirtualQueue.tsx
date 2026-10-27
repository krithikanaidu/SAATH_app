import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { BOARDING_SLOTS, SLOT_CONFIRMATION, TRAINS, ZONES } from '../lib/mockData'
import { AmberShell, OfflineBanner, SplitButton } from '../components/amber'

/**
 * S08 — Virtual Queue.
 *  step "choose"     → S08a (mono): pick slot + zone
 *  step "confirmed"  → S08b (amber): confirmation + countdown
 *  ?state=offline    → S08c
 */

export function VirtualQueue() {
  const navigate = useNavigate()
  const { state, update } = useStore()
  const offline = new URLSearchParams(location.search).get('state') === 'offline'

  const [step, setStep] = useState<'choose' | 'confirmed'>(state.slotBooked ? 'confirmed' : 'choose')
  const [slotId, setSlotId] = useState(BOARDING_SLOTS[0].id)
  const [zone, setZone] = useState<'A' | 'B' | 'C' | 'D'>(state.slotZone)
  const [seconds, setSeconds] = useState(372) // 06:12

  useEffect(() => {
    if (step !== 'confirmed') return
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [step])

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  /* ---------------- offline (S08c) — amber system ---------------- */
  if (offline) {
    return (
      <AmberShell nav={false} back={() => navigate(-1)} title="BOARDING SLOT">
        <div className="pt-1">
          <OfflineBanner />
          <p className="mt-6 font-display text-[18px] tracking-[0.06em] text-[#6E6A62] uppercase">
            Last known crowd levels
          </p>

          <p className="mt-4 font-display text-[28px] leading-none tracking-wide">
            {TRAINS[0].departure} {TRAINS[0].type.toUpperCase()} · {TRAINS[0].platform.toUpperCase()}
          </p>

          <p className="mt-5 font-display text-[20px] tracking-[0.04em]">CHOOSE A SLOT</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {BOARDING_SLOTS.map(s => (
              <div
                key={s.id}
                className="flex cursor-not-allowed items-center justify-between border-[3px] border-[#111111] bg-[#E4DED0] px-3 py-3.5"
                aria-disabled="true"
              >
                <span className="font-display text-[24px] leading-none text-[#A8A196]">
                  {s.label.split(' · ')[0]}
                </span>
                <DisabledPeople />
              </div>
            ))}
          </div>

          <PlatformMap />

          <div className="mt-4 flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[14px] font-bold"
            >
              i
            </span>
            <p className="text-[16px] leading-[22px]">
              Advisory slot. Boarding is not blocked if you miss it.
            </p>
          </div>

          <div className="mt-auto pt-6">
            <SplitButton disabled>CONFIRM SLOT</SplitButton>
          </div>
        </div>
      </AmberShell>
    )
  }

  /* ---------------- confirmed (S08b, amber) ---------------- */
  if (step === 'confirmed') {
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate('/home')}
            className="flex h-11 w-11 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold"
          >
            ←
          </button>

          <p className="mt-4 font-display text-[22px] tracking-wide uppercase">Boarding slot</p>
          <h1 className="font-display text-[44px] leading-[46px] tracking-wide uppercase">
            Slot confirmed
          </h1>

          <div className="mt-5 border-2 border-[#111111] bg-white">
            <div className="border-b-2 border-[#111111] px-4 py-4">
              <p className="font-display text-[28px] leading-none tracking-wide">
                {SLOT_CONFIRMATION.window}
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x-2 divide-[#111111] border-b-2 border-[#111111]">
              {[SLOT_CONFIRMATION.platform, SLOT_CONFIRMATION.coach, SLOT_CONFIRMATION.queuePosition].map(
                label => (
                  <div key={label} className="px-2 py-3 text-center">
                    <p className="font-display text-[15px] leading-[17px] tracking-wide">{label}</p>
                  </div>
                ),
              )}
            </div>
            <div className="flex flex-col items-center px-4 py-5">
              <p className="font-display text-[64px] leading-none tracking-wide">{mmss}</p>
              <p className="mt-1 font-display text-[16px] tracking-wide uppercase">
                Until your slot opens
              </p>
            </div>
          </div>

          <p className="mt-4 text-[16px] text-[#5A5750]">Your advisory slot is confirmed.</p>

          <div className="flex-1" />

          <Button variant="amberSplit" onClick={() => navigate('/home')}>
            Navigate to platform
          </Button>
          <button
            type="button"
            onClick={() => {
              update({ slotBooked: false })
              setStep('choose')
            }}
            className="mx-auto mt-4 text-[15px] font-bold underline underline-offset-4"
          >
            CANCEL SLOT
          </button>
        </div>
      </DeviceFrame>
    )
  }

  /* ---------------- choose (S08a, mono) ---------------- */
  const slot = BOARDING_SLOTS.find(s => s.id === slotId)!

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/train/t-0830')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Virtual Queue</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          Illustrative coordination · Not a railway booking
        </p>

        {/* trip summary */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <p className="text-[18px] leading-[23px] font-semibold">
            08:30 · {state.fromStation} → {state.toStation}
          </p>
          <p className="mt-2 text-[14px] leading-[20px] text-[#616161]">
            Platform 3 · Ladies compartment
          </p>
          <p className="mt-2 text-[14px] text-[#202020]">Boarding reminder in 05:40</p>
        </div>

        {/* slot select */}
        <div className="mt-5 space-y-1.5">
          <label htmlFor="slot" className="block text-[14px] font-semibold">
            Choose boarding slot
          </label>
          <div className="relative">
            <select
              id="slot"
              value={slotId}
              onChange={e => setSlotId(e.target.value)}
              className="w-full appearance-none rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 pr-10 text-[16px]"
            >
              {BOARDING_SLOTS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px]">
              ⌄
            </span>
          </div>
        </div>

        {/* zone picker */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] p-4">
          <p className="text-[16px] font-semibold">Meeting marker · Zone {zone}</p>
          <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Meeting zone">
            {ZONES.map(z => {
              const active = zone === z
              return (
                <button
                  key={z}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Zone ${z}`}
                  onClick={() => setZone(z)}
                  className={`flex h-14 items-center justify-center border text-[16px] transition-colors ${
                    active
                      ? 'border-2 border-[#202020] bg-[#F2F2F2] font-semibold'
                      : 'border-[#DDDDDD] bg-white'
                  }`}
                >
                  {active ? (
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#202020]" /> {z}
                    </span>
                  ) : (
                    z
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[12px] text-[#616161]">
            Stairs → A · Keep the platform edge clear
          </p>
        </div>

        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">
          Wait near Zone {zone}, away from the edge.
        </h2>
        <p className="mt-2 text-[16px] leading-[24px] text-[#616161]">
          Follow station staff instructions. This in-app slot does not reserve a seat, boarding
          priority or railway space.
        </p>
        <p className="mt-3 text-[14px] leading-[20px] text-[#616161]">
          After booking: see your confirmation, queue number and reminder countdown.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button
            onClick={() => {
              update({ slotBooked: true, slotZone: zone })
              setSeconds(372)
              setStep('confirmed')
            }}
          >
            Book boarding slot
          </Button>
          <p className="mt-2 text-center text-[11px] text-[#616161]">
            {slot.label} · advisory only
          </p>
        </div>
      </Content>
    </DeviceFrame>
  )
}

/* ---------------- amber helpers (S08c) ---------------- */

/** muted three-person glyph shown inside the disabled offline slots */
function DisabledPeople() {
  return (
    <svg width="30" height="14" viewBox="0 0 34 14" fill="none" stroke="#A8A196" strokeWidth="1.6" aria-hidden>
      <circle cx="7" cy="3.2" r="2.2" />
      <path d="M3.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
      <circle cx="17" cy="3.2" r="2.2" />
      <path d="M13.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
      <circle cx="27" cy="3.2" r="2.2" />
      <path d="M23.4 12.5V8.2c0-1.5 1.6-2.6 3.6-2.6s3.6 1.1 3.6 2.6v4.3" />
    </svg>
  )
}

/** platform map with the highlighted coach zone (S08c illustration) */
function PlatformMap() {
  const COACHES = 12
  const HIGHLIGHT = 4
  return (
    <div
      className="mt-5 border-[3px] bg-white px-4 pt-8 pb-4 shadow-[6px_6px_0_0_#111111]"
      style={{ borderColor: '#111111' }}
    >
      <div className="relative">
        <span
          aria-hidden
          className="absolute -top-7 -translate-x-1/2"
          style={{ left: `${((HIGHLIGHT - 0.5) / COACHES) * 100}%` }}
        >
          <svg width="26" height="32" viewBox="0 0 26 32">
            <path
              d="M13 1c6.1 0 11 4.9 11 11 0 7.8-11 19-11 19S2 19.8 2 12C2 5.9 6.9 1 13 1z"
              fill="#F9B800"
              stroke="#111111"
              strokeWidth="2.5"
            />
            <circle cx="13" cy="12" r="4" fill="#FAF8F4" stroke="#111111" strokeWidth="2" />
          </svg>
        </span>

        <div className="flex gap-1">
          {Array.from({ length: COACHES }, (_, i) => (
            <div
              key={i}
              className={`h-12 flex-1 border-2 border-[#111111] ${
                i === HIGHLIGHT - 1 ? 'bg-[#F9B800]' : 'bg-white'
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: COACHES }, (_, i) => (
            <span key={i} className="flex-1 text-center text-[13px] leading-none text-[#8A8A8A]">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: COACHES }, (_, i) => (
            <div key={i} className={`h-[6px] flex-1 ${i === HIGHLIGHT - 1 ? 'bg-[#111111]' : ''}`} />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center font-display text-[22px] tracking-wide">
        BOARD HERE · COACH {HIGHLIGHT} ZONE
      </p>
    </div>
  )
}
