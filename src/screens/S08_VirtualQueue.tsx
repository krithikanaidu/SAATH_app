import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { BOARDING_SLOTS, SLOT_CONFIRMATION, ZONES } from '../lib/mockData'

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

  /* ---------------- offline (S08c) ---------------- */
  if (offline) {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/train/t-0830')} />
        <Content className="flex flex-col">
          <h1 className="text-[24px] font-semibold">Virtual Queue</h1>
          <div role="status" className="mt-4 rounded-[8px] border border-[#202020] bg-[#F2F2F2] px-4 py-3 text-[14px] leading-[20px]">
            <strong className="font-semibold">You’re offline.</strong> Boarding slots can’t be
            booked without a connection.
          </div>
          <p className="mt-4 text-[14px] leading-[20px] text-[#616161]">
            Reconnect to choose a slot. Your journey details are still available below.
          </p>
          <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4 text-[14px]">
            <strong>08:30 · {state.fromStation} → {state.toStation}</strong>
            <span className="mt-1 block text-[#616161]">Platform 3 · Ladies compartment</span>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        </Content>
      </DeviceFrame>
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
