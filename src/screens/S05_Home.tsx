import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { CrowdBadge } from '../components/CrowdBadge'
import { useStore } from '../lib/store'
import { TRAINS } from '../lib/mockData'

/**
 * S05 — Home.
 * Query `?state=loading|empty|offline|location-off` renders the documented
 * alternate states (S05a/S05b/S05c/S05_Location_Off).
 */

type Mode = 'ready' | 'loading' | 'empty' | 'offline' | 'location-off'

function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>(
    () => (new URLSearchParams(location.search).get('state') as Mode) || 'ready',
  )
  return [mode, setMode]
}

/** Small dev-only state switcher so every documented state is reachable. */
function StateJump({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const options: Mode[] = ['ready', 'loading', 'empty', 'offline', 'location-off']
  return (
    <select
      aria-label="Preview state"
      value={mode}
      onChange={e => {
        const v = e.target.value as Mode
        setMode(v)
        const url = new URL(location.href)
        if (v === 'ready') url.searchParams.delete('state')
        else url.searchParams.set('state', v)
        history.replaceState(null, '', url)
      }}
      className="mb-3 w-full rounded-[8px] border border-dashed border-[#B8B8B8] bg-white px-3 py-2 text-[12px] text-[#616161]"
    >
      {options.map(o => (
        <option key={o} value={o}>
          state: {o}
        </option>
      ))}
    </select>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { state } = useStore()
  const [mode, setMode] = useMode()

  // brief loading flash on first mount, mirroring S05a
  useEffect(() => {
    if (mode === 'loading') {
      const t = setTimeout(() => setMode('ready'), 1600)
      return () => clearTimeout(t)
    }
  }, [mode, setMode])

  const firstName = 'Asha'
  const primary = TRAINS[0]

  /* ---------------- loading (S05a) ---------------- */
  if (mode === 'loading') {
    return (
      <DeviceFrame>
        <Content className="flex flex-col">
          <StateJump mode={mode} setMode={setMode} />
          <h1 className="text-[24px] leading-[29px] font-semibold">Good morning, {firstName}</h1>
          <p className="mt-1 text-[12px] text-[#616161]">Illustrative train data · Not live</p>

          <div className="mt-5 space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading next trains…</span>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-[92px] animate-pulse rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2]"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </div>
        </Content>
      </DeviceFrame>
    )
  }

  /* ---------------- empty (S05b) ---------------- */
  if (mode === 'empty') {
    return (
      <DeviceFrame>
        <Content className="flex flex-col">
          <StateJump mode={mode} setMode={setMode} />
          <h1 className="text-[24px] leading-[29px] font-semibold">Good morning, {firstName}</h1>
          <p className="mt-1 text-[12px] text-[#616161]">Illustrative train data · Not live</p>

          <div className="mt-8 flex flex-col items-center rounded-[8px] border border-[#DDDDDD] px-5 py-10 text-center">
            <span aria-hidden className="text-[40px]">
              🚃
            </span>
            <h2 className="mt-3 text-[18px] font-semibold">No trains yet</h2>
            <p className="mt-2 text-[14px] leading-[20px] text-[#616161]">
              Set your usual journey and we’ll show the next departures here.
            </p>
            <div className="mt-5 w-full">
              <Button onClick={() => navigate('/setup')}>Set usual journey</Button>
            </div>
          </div>
        </Content>
      </DeviceFrame>
    )
  }

  /* ---------------- offline (S05c) ---------------- */
  if (mode === 'offline') {
    return (
      <DeviceFrame>
        <Content className="flex flex-col">
          <StateJump mode={mode} setMode={setMode} />
          <div
            role="status"
            className="mb-4 rounded-[8px] border border-[#202020] bg-[#F2F2F2] px-4 py-3 text-[14px] leading-[20px]"
          >
            <strong className="font-semibold">You’re offline.</strong> Showing the last saved
            schedule — times may be out of date.
          </div>

          <h1 className="text-[24px] leading-[29px] font-semibold">Good morning, {firstName}</h1>
          <p className="mt-1 text-[12px] text-[#616161]">Cached data · Last updated 08:12</p>

          <div className="mt-4 space-y-3">
            {TRAINS.slice(0, 2).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/train/${t.id}`)}
                className="flex w-full items-center justify-between rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-4 text-left"
              >
                <span>
                  <span className="block text-[18px] font-semibold">
                    {t.departure} · in {t.inMinutes} min
                  </span>
                  <span className="mt-1 block text-[12px] text-[#616161]">
                    {t.platform} · {t.arrival} arrival
                  </span>
                </span>
                <CrowdBadge level={t.crowd} />
              </button>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="secondary" onClick={() => setMode('ready')}>
              Try again
            </Button>
          </div>
        </Content>
      </DeviceFrame>
    )
  }

  /* ---------------- location off (S05_Location_Off) ---------------- */
  if (mode === 'location-off') {
    return (
      <DeviceFrame>
        <Content className="flex flex-col">
          <StateJump mode={mode} setMode={setMode} />
          <div
            role="status"
            className="rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-3"
          >
            <p className="text-[14px] leading-[20px]">
              <strong className="font-semibold">Location is off.</strong> We can’t suggest nearby
              stations until you allow location access.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                full={false}
                className="min-h-[40px] px-4 text-[14px]"
                onClick={() => navigate('/setup')}
              >
                Open settings
              </Button>
              <Button
                full={false}
                variant="secondary"
                className="min-h-[40px] px-4 text-[14px]"
                onClick={() => setMode('ready')}
              >
                Continue without
              </Button>
            </div>
          </div>

          <h1 className="mt-4 text-[24px] leading-[29px] font-semibold">
            Good morning, {firstName}
          </h1>
          <div className="mt-4">{trainList(navigate, false)}</div>
        </Content>
      </DeviceFrame>
    )
  }

  /* ---------------- ready (S05) ---------------- */
  return (
    <DeviceFrame>
      <Content className="flex flex-col">
        <StateJump mode={mode} setMode={setMode} />
        <h1 className="text-[24px] leading-[29px] font-semibold">Good morning, {firstName}</h1>
        <p className="mt-1 text-[12px] text-[#616161]">Illustrative train data · Not live</p>

        {/* journey card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <p className="text-[18px] leading-[23px] font-semibold">
            {state.fromStation} → {state.toStation}
          </p>
          <p className="mt-1.5 text-[14px] text-[#616161]">
            {state.usualLine} · Today, 08:30 AM{' '}
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="ml-2 underline underline-offset-2"
            >
              Edit
            </button>
          </p>
        </div>

        {/* smart window promo */}
        <div className="mt-3 rounded-[8px] bg-[#F2F2F2] px-4 py-4">
          <h2 className="text-[18px] leading-[23px] font-semibold">Your Smart Window</h2>
          <p className="mt-2 text-[16px] leading-[24px]">
            Leave 12 minutes later for a lower-crowd option at 08:42.
          </p>
          <button
            type="button"
            onClick={() => navigate('/smart-window')}
            className="mt-3 text-[15px] font-medium underline underline-offset-4"
          >
            Compare departures →
          </button>
        </div>

        {/* next trains */}
        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="text-[18px] leading-[23px] font-semibold">Next trains</h2>
          <span className="text-[12px] text-[#616161]">Slow · Southbound</span>
        </div>

        <div className="mt-3">{trainList(navigate, true)}</div>

        <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
          Crowd reports are community estimates. Always check station announcements.
        </p>

        <div className="mt-3 pb-2">
          <Button onClick={() => navigate(`/train/${primary.id}`)}>
            View {primary.departure} train
          </Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}

function trainList(navigate: (p: string) => void, withCrowd: boolean) {
  return (
    <ul className="space-y-3">
      {TRAINS.slice(0, 3).map(t => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => navigate(`/train/${t.id}`)}
            className="flex w-full items-center justify-between rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
          >
            <span>
              <span className="block text-[18px] leading-[23px] font-semibold">
                {t.departure} · in {t.inMinutes} min
              </span>
              <span className="mt-1 block text-[12px] leading-[15px] text-[#616161]">
                {t.platform} · {t.arrival} arrival
              </span>
            </span>
            {withCrowd ? <CrowdBadge level={t.crowd} /> : null}
          </button>
        </li>
      ))}
    </ul>
  )
}
