import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { CrowdBadge, CrowdBar } from '../components/CrowdBadge'
import { useStore } from '../lib/store'
import { useCrowdReports } from '../lib/hooks'
import { COMPARTMENT_CROWD, COMPARTMENT_META, TRAINS } from '../lib/mockData'
import type { CrowdLevel } from '../lib/types'
import {
  AmberCrowdBadge,
  AmberShell,
  OfflineBanner,
  Skeleton,
  SplitButton,
} from '../components/amber'

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

/* ---------------- amber helpers (S06a / S06b) ---------------- */

function SummaryBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border-[3px] bg-white shadow-[6px_6px_0_0_#111111] ${className}`}
      style={{ borderColor: '#111111' }}
    >
      <div className="grid grid-cols-3">{children}</div>
    </div>
  )
}

function SummaryCell({
  label,
  children,
  border = false,
}: {
  label: string
  children: React.ReactNode
  border?: boolean
}) {
  return (
    <div className={`px-3 py-4 ${border ? 'border-l-[3px] border-[#111111]' : ''}`}>
      <p className="font-display text-[18px] tracking-wide">{label}</p>
      <div className="mt-2 flex items-center">{children}</div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 font-display text-[19px] tracking-wide">
      <span aria-hidden className="h-5 w-5 border-2 border-[#111111]" style={{ background: color }} />
      {label}
    </span>
  )
}

/** 12-coach crowd chart from the amber design (illustrative). */
const COACH_LEVELS: CrowdLevel[] = [
  'high', 'medium', 'low', 'medium', 'high', 'medium',
  'low', 'high', 'medium', 'high', 'low', 'medium',
]
const COACH_FILL: Record<CrowdLevel, string> = { low: '35%', medium: '72%', high: '100%' }
const COACH_COLOR: Record<CrowdLevel, string> = { low: '#3BA55D', medium: '#F9B800', high: '#E5484D' }
const COACH_MARK: Record<number, string> = { 2: 'F', 4: 'L' }

function CoachChart() {
  return (
    <div
      className="mt-4 border-[3px] bg-white px-3 pt-6 pb-5 shadow-[6px_6px_0_0_#111111]"
      style={{ borderColor: '#111111' }}
    >
      <div className="flex items-end justify-between gap-1.5">
        {COACH_LEVELS.map((lvl, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <span aria-hidden className="mb-1 h-4 font-display text-[16px] leading-none">
              {COACH_MARK[i + 1] ?? ''}
            </span>
            <div className="relative h-[86px] w-full border-2 border-[#9A9A9A] bg-white">
              <div
                className="absolute inset-x-0 bottom-0"
                style={{ height: COACH_FILL[lvl], background: COACH_COLOR[lvl] }}
              />
            </div>
            <span className="mt-1.5 text-[15px] leading-none text-[#8A8A8A]">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-6">
        <Legend color="#3BA55D" label="LOW" />
        <Legend color="#F9B800" label="MEDIUM" />
        <Legend color="#E5484D" label="HIGH" />
      </div>
      <p className="mt-4 text-[17px] leading-[23px]">L = Ladies, F = First class</p>
    </div>
  )
}

export function TrainDetail() {
  const navigate = useNavigate()
  const { trainId } = useParams()
  const { state, update } = useStore()
  const crowd = useCrowdReports(trainId ?? TRAINS[0].id)
  const train = TRAINS.find(t => t.id === trainId) ?? TRAINS[0]

  const mode = new URLSearchParams(location.search).get('state')
  const [reported, setReported] = useState<CrowdLevel | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const submitReport = (level: CrowdLevel) => {
    setReported(level)
    // local mirror so the UI responds instantly, then persist to the backend
    update({
      crowdReports: [
        ...state.crowdReports,
        { compartment: 'general', level, at: Date.now() },
      ],
    })
    void crowd.report('general', level)
    setToast(`Reported ${level} crowd for General.`)
    setTimeout(() => setToast(null), 2400)
  }

  const screenTitle = `${train.departure} ${train.type.toUpperCase()}`

  /* ---------------- loading (S06a) — amber system ---------------- */
  if (mode === 'loading') {
    return (
      <AmberShell nav={false} back={() => navigate('/home')} title={screenTitle}>
        <div className="pt-1" aria-busy="true">
          <span className="sr-only">Loading train details…</span>

          <SummaryBox>
            <SummaryCell label="PLATFORM">
              <Skeleton className="h-10 w-12" />
            </SummaryCell>
            <SummaryCell label="ARRIVES" border>
              <Skeleton className="h-10 w-24" />
            </SummaryCell>
            <SummaryCell label="OVERALL" border>
              <AmberCrowdBadge level="high" />
            </SummaryCell>
          </SummaryBox>

          <h2 className="mt-6 font-display text-[36px] leading-none tracking-wide">COACH CROWD</h2>

          <div className="mt-4 border-[3px] bg-white px-4 pt-6 pb-5 shadow-[6px_6px_0_0_#111111]" style={{ borderColor: '#111111' }}>
            <Skeleton className="h-[86px] w-full" />
            <div className="mt-5 flex items-center gap-6">
              <Legend color="#3BA55D" label="LOW" />
              <Legend color="#F9B800" label="MEDIUM" />
              <Legend color="#E5484D" label="HIGH" />
            </div>
            <p className="mt-4 text-[17px] leading-[23px]">L = Ladies, F = First class</p>
          </div>

          <div className="mt-5 border-[3px] bg-white p-4 shadow-[6px_6px_0_0_#111111]" style={{ borderColor: '#111111' }}>
            <Skeleton className="h-[104px] w-full" />
          </div>

          <h3 className="mt-6 font-display text-[24px] tracking-wide">HOW CROWDED IS YOUR COACH?</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-[78px]" />
            ))}
          </div>

          <div className="mt-auto pt-6">
            <SplitButton disabled>BOOK BOARDING SLOT</SplitButton>
          </div>
          <p className="mt-4 mb-2 text-center text-[16px] leading-[22px]">
            Slots are advisory and help spread platform crowding.
          </p>
        </div>
      </AmberShell>
    )
  }

  /* ---------------- offline (S06b) — amber system ---------------- */
  if (mode === 'offline') {
    return (
      <AmberShell nav={false} back={() => navigate('/home')} title={screenTitle}>
        <div className="pt-1">
          <OfflineBanner />
          <p className="mt-6 font-display text-[18px] tracking-[0.06em] text-[#6E6A62] uppercase">
            Last known crowd levels
          </p>

          <SummaryBox className="mt-4">
            <SummaryCell label="PLATFORM">
              <span className="font-display text-[40px] leading-none">{train.platform.replace('Platform ', '')}</span>
            </SummaryCell>
            <SummaryCell label="ARRIVES" border>
              <span className="font-display text-[40px] leading-none">{train.inMinutes} MIN</span>
            </SummaryCell>
            <SummaryCell label="OVERALL" border>
              <AmberCrowdBadge level={train.crowd} />
            </SummaryCell>
          </SummaryBox>

          <h2 className="mt-6 font-display text-[36px] leading-none tracking-wide">COACH CROWD</h2>
          <CoachChart />

          <div className="mt-5 border-[3px] bg-white px-4 py-4 shadow-[6px_6px_0_0_#111111]" style={{ borderColor: '#111111' }}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-[26px] tracking-wide">COACH 4 · LADIES</p>
              <AmberCrowdBadge level="medium" />
            </div>
            <p className="mt-3 text-[17px] leading-[23px]">Updated 2 min ago · 14 reports</p>
          </div>

          <div className="mt-auto pt-6">
            <SplitButton disabled>BOOK BOARDING SLOT</SplitButton>
          </div>
          <p className="mt-4 mb-2 text-center text-[16px] leading-[22px]">
            Slots are advisory and help spread platform crowding.
          </p>
        </div>
      </AmberShell>
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
