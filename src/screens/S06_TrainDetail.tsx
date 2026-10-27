import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { CrowdBadge, CrowdBar } from '../components/CrowdBadge'
import { useStore } from '../lib/store'
import { COMPARTMENT_CROWD, COMPARTMENT_META, TRAINS } from '../lib/mockData'
import type { CrowdLevel } from '../lib/types'

/**
 * S06 — train detail with compartment crowd + anonymous crowd reporting.
 * Query `?state=loading|offline` renders S06a / S06b.
 */

const COMPARTMENTS: { key: keyof typeof COMPARTMENT_CROWD; label: string }[] = [
  { key: 'ladies', label: 'Ladies' },
  { key: 'general', label: 'General' },
  { key: 'firstClass', label: 'First class' },
]

const LEVELS: CrowdLevel[] = ['low', 'medium', 'high']

export function TrainDetail() {
  const navigate = useNavigate()
  const { trainId } = useParams()
  const { state, update } = useStore()
  const train = TRAINS.find(t => t.id === trainId) ?? TRAINS[0]

  const mode = new URLSearchParams(location.search).get('state')
  const [reported, setReported] = useState<CrowdLevel | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const submitReport = (level: CrowdLevel) => {
    // Mock persistence — a real backend would POST an anonymous report here.
    setReported(level)
    update({
      crowdReports: [
        ...state.crowdReports,
        { compartment: 'general', level, at: Date.now() },
      ],
    })
    setToast(`Reported ${level} crowd for General.`)
    setTimeout(() => setToast(null), 2400)
  }

  /* ---------------- loading (S06a) ---------------- */
  if (mode === 'loading') {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/home')} />
        <Content className="flex flex-col" aria-busy="true">
          <span className="sr-only">Loading train details…</span>
          <div className="h-7 w-2/3 animate-pulse rounded bg-[#F2F2F2]" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#F2F2F2]" />
          <div className="mt-6 h-28 animate-pulse rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2]" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-[8px] bg-[#F2F2F2]" />
            ))}
          </div>
        </Content>
      </DeviceFrame>
    )
  }

  /* ---------------- offline (S06b) ---------------- */
  if (mode === 'offline') {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/home')} />
        <Content className="flex flex-col">
          <div role="status" className="rounded-[8px] border border-[#202020] bg-[#F2F2F2] px-4 py-3 text-[14px]">
            <strong className="font-semibold">You’re offline.</strong> Crowd reports can’t refresh
            right now.
          </div>
          <h1 className="mt-4 text-[24px] font-semibold">{train.departure} to {state.toStation}</h1>
          <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4 text-[14px] leading-[20px] text-[#616161]">
            Last known crowd data was saved at 08:12. It may no longer be accurate.
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/home')}>
              Back to home
            </Button>
          </div>
        </Content>
      </DeviceFrame>
    )
  }

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/home')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">
          {train.departure} to {state.toStation}
        </h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          Illustrative · Not live · {train.platform}
        </p>

        {/* summary card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <p className="text-[18px] leading-[23px] font-semibold">
            {state.fromStation} → {state.toStation}
          </p>
          <p className="mt-2 text-[16px] leading-[22px] text-[#616161]">
            {train.line} · {train.type === 'slow' ? 'Slow' : 'Fast'} · {train.coaches} coaches
            <br />
            Departs {train.departure} · Arrives {train.arrival}
          </p>
        </div>

        {/* compartment crowd */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Compartment crowd</h2>
        <div className="mt-3 space-y-4">
          {COMPARTMENTS.map(({ key, label }) => {
            const level = COMPARTMENT_CROWD[key]
            return (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="text-[16px]">{label}</span>
                  <CrowdBadge level={level} />
                </div>
                <div className="mt-2">
                  <CrowdBar level={level} />
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
          Example reports · {COMPARTMENT_META.reportedAt} · {COMPARTMENT_META.reporters} commuters
          <br />
          Crowd can change before arrival.
        </p>

        {/* report crowd */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Report crowd · General</h2>
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Report crowd level">
          {LEVELS.map(level => {
            const active = reported === level
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => submitReport(level)}
                className={`rounded-[8px] border px-2 py-3 transition-colors ${
                  active ? 'border-2 border-[#202020] bg-[#F2F2F2]' : 'border-[#DDDDDD] bg-white'
                }`}
              >
                <span className="flex justify-center">
                  <CrowdBadge level={level} size="sm" />
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
          Tap once to submit. Reports are anonymous community estimates, not verified occupancy.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => navigate('/queue')}>Plan boarding</Button>
        </div>
      </Content>

      {toast ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-5 bottom-24 rounded-[8px] bg-[#202020] px-4 py-3 text-center text-[14px] text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </DeviceFrame>
  )
}
