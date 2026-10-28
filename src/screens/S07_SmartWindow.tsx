import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { CrowdBadge } from '../components/CrowdBadge'
import { useStore } from '../lib/store'
import { SMART_WINDOW } from '../lib/mockData'
import type { CrowdLevel } from '../lib/types'

/** S07 — Smart Window: compare nearby departures and pick one. */

type Option = {
  time: string
  arrival: string
  crowd: CrowdLevel
  note: string
}

const OPTIONS: (Option & { id: string; suggested?: boolean })[] = [
  { id: '08:18', ...SMART_WINDOW.earlier },
  { id: '08:42', ...SMART_WINDOW.suggested, suggested: true },
]

export function SmartWindow() {
  const navigate = useNavigate()
  const { state, update } = useStore()
  const [selected, setSelected] = useState<string>(state.chosenDeparture === '08:30' ? '08:42' : state.chosenDeparture)

  const choose = () => {
    update({ chosenDeparture: selected })
    // map the picked departure onto the matching mock train
    const trainId = selected === SMART_WINDOW.earlier.time ? 't-0818' : 't-0842'
    navigate(`/train/${trainId}`)
  }

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/home')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Your Smart Window</h1>
        <p className="mt-2 text-[14px] text-[#616161]">Illustrative suggestions · Not live</p>

        <p className="mt-5 text-[18px] leading-[23px] font-semibold">
          {state.fromStation} → {state.toStation}
        </p>
        <p className="mt-2 text-[16px] leading-[24px] text-[#616161]">
          A small shift in departure may mean a less crowded journey.
        </p>

        {/* usual departure */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Your usual departure</h2>
        <div className="mt-3 flex items-center justify-between rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <span>
            <span className="block text-[18px] font-semibold">
              {SMART_WINDOW.usual.time} · {SMART_WINDOW.usual.note}
            </span>
            <span className="mt-1 block text-[12px] text-[#616161]">
              {SMART_WINDOW.usual.arrival} arrival · Slow
            </span>
          </span>
          <CrowdBadge level={SMART_WINDOW.usual.crowd} />
        </div>

        {/* compare */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Compare nearby departures</h2>
        <div className="mt-3 space-y-3">
          {OPTIONS.map(opt => {
            const active = selected === opt.id
            return (
              <div key={opt.id}>
                {opt.suggested ? (
                  <p className="mb-2 text-[12px] font-bold tracking-wide">
                    ● SUGGESTED · {SMART_WINDOW.laterGap} MIN LATER
                  </p>
                ) : null}
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full rounded-[8px] px-4 py-4 text-left transition-all ${
                    active
                      ? 'border-2 border-[#202020] bg-[#F2F2F2]'
                      : 'border border-[#DDDDDD] bg-white'
                  } ${opt.suggested && !active ? 'border-2 border-[#202020]' : ''}`}
                >
                  <span className="flex items-center justify-between">
                    <span>
                      <span className="block text-[18px] font-semibold">
                        {opt.time} · {opt.note}
                      </span>
                      <span className="mt-1 block text-[12px] text-[#616161]">
                        {opt.arrival} arrival · Slow
                      </span>
                    </span>
                    <CrowdBadge level={opt.crowd} />
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-[12px] leading-[17px] text-[#616161]">
          Arrive 12 minutes later than usual. Estimates may change; no seat or boarding guarantee.
          Check station announcements.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={choose}>Use {selected} departure</Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
