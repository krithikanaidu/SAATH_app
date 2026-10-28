import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { CrowdBadge } from '../components/CrowdBadge'
import {
  AmberBox,
  AmberCrowdBadge,
  AmberHomeHeader,
  AmberShell,
  LastKnownLabel,
  OfflineBanner,
  Skeleton,
  SplitButton,
} from '../components/amber'
import { useStore } from '../lib/store'
import { SMART_WINDOW, TRAINS } from '../lib/mockData'
import { urlState, useOnline } from '../lib/useOnline'

/**
 * S05 — Home (mono) plus its four documented state screens, which use the
 * amber system in the Figma file:
 *   S05a_Loading · S05b_Empty · S05c_Offline · S05_Location_Off
 *
 * States resolve in this order: `?state=` → real connectivity → natural load.
 */

type Mode = 'ready' | 'loading' | 'empty' | 'offline' | 'location-off'

export function Home() {
  const navigate = useNavigate()
  const { state } = useStore()
  const online = useOnline()
  const forced = urlState() as Mode | null

  // natural: a brief first-load skeleton per browser session (S05a)
  const [firstLoad, setFirstLoad] = useState(() => !sessionStorage.getItem('saath.loaded'))

  const mode: Mode = forced ?? (!online ? 'offline' : firstLoad ? 'loading' : 'ready')

  useEffect(() => {
    // URL-forced states persist so every design state stays inspectable
    if (mode !== 'loading' || forced) return
    const t = setTimeout(() => {
      sessionStorage.setItem('saath.loaded', '1')
      setFirstLoad(false)
    }, 700)
    return () => clearTimeout(t)
  }, [mode, forced])

  if (mode !== 'ready') {
    return (
      <HomeState
        mode={mode}
        name={state.name}
        route={{
          from: state.fromStation,
          to: state.toStation,
          line: state.usualLine,
          usual: state.departureTime.split(' · ')[0],
        }}
        onOpenSetup={() => navigate('/setup')}
        onOpenSmart={() => navigate('/smart-window')}
        onOpenTrain={(id) => navigate(`/train/${id}`)}
      />
    )
  }

  /* ---------------- ready (S05, mono) ---------------- */
  const firstName = state.name.trim().split(/\s+/)[0] || 'Asha'
  const primary = TRAINS[0]

  return (
    <DeviceFrame>
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Good morning, {firstName}</h1>
        <p className="mt-1 text-[12px] text-[#616161]">Illustrative train data · Not live</p>

        {/* journey card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <p className="text-[18px] leading-[23px] font-semibold">
            {state.fromStation} → {state.toStation}
          </p>
          <p className="mt-1.5 text-[14px] text-[#616161]">
            {state.usualLine} · Today, {state.departureTime.split(' · ')[0]}{' '}
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
            Leave {SMART_WINDOW.laterGap} minutes later for a lower-crowd option at{' '}
            {SMART_WINDOW.suggested.time}.
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

        <ul className="mt-3 space-y-3">
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
                <CrowdBadge level={t.crowd} />
              </button>
            </li>
          ))}
        </ul>

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

/* =====================================================================
 * State screens — amber system (S05a / S05b / S05c / S05_Location_Off)
 * ===================================================================== */

function HomeState({
  mode,
  name = 'Asha',
  route,
  onOpenSetup,
  onOpenSmart,
  onOpenTrain,
}: {
  mode: Mode
  name?: string
  route: { from: string; to: string; line: string; usual: string }
  onOpenSetup: () => void
  onOpenSmart: () => void
  onOpenTrain: (id: string) => void
}) {
  /* ---------------- empty (S05b) ---------------- */
  if (mode === 'empty') {
    return (
      <AmberShell>
        <AmberHomeHeader name={name} />
        <div className="px-4 pb-4">
          <AmberBox className="flex items-center justify-center px-6 py-8">
            <TrainIllustration />
          </AmberBox>
          <h1 className="mt-6 font-display text-[34px] leading-none tracking-wide">
            SET YOUR ROUTE TO SEE TRAINS
          </h1>
          <div className="mt-6">
            <SplitButton onClick={onOpenSetup} ariaLabel="Add route">
              ADD ROUTE
            </SplitButton>
          </div>
        </div>
      </AmberShell>
    )
  }

  /* ---------------- loading / offline / location-off share the shell ---- */
  const offline = mode === 'offline'
  const loading = mode === 'loading'
  const locationOff = mode === 'location-off'

  return (
    <AmberShell>
      <AmberHomeHeader name={name} />

      <div className="px-4 pb-3">
        {offline ? (
          <div className="pt-1">
            <OfflineBanner />
            <LastKnownLabel />
          </div>
        ) : null}

        {/* yellow route card */}
        <AmberBox tone="amber" className="mt-3 px-5 py-5">
          <p className="font-display text-[30px] leading-none tracking-wide">
            {route.from.toUpperCase()} TO {route.to.toUpperCase()}
          </p>
          <p className="mt-4 text-[18px] leading-[24px]">
            {route.line} · Usual {route.usual}
          </p>
          <button
            type="button"
            onClick={onOpenSetup}
            className="mt-5 font-display text-[20px] tracking-wide underline underline-offset-4"
          >
            CHANGE
          </button>

          {locationOff ? (
            <div className="mt-5 flex items-center gap-5">
              <span className="border-[3px] bg-white px-5 py-2.5 font-display text-[18px] tracking-wide" style={{ borderColor: '#111111' }}>
                LOCATION OFF
              </span>
              <button
                type="button"
                onClick={onOpenSetup}
                className="font-display text-[20px] tracking-wide underline underline-offset-4"
              >
                TURN ON
              </button>
            </div>
          ) : null}
        </AmberBox>

        {/* smart suggestion card — derived from the same SMART_WINDOW data S07 uses */}
        <AmberBox className="mt-7 px-4 py-4">
          <div className="flex items-center gap-3">
            <svg width="34" height="26" viewBox="0 0 34 26" fill="none" stroke="#111111" strokeWidth="2.4" aria-hidden>
              <path d="M4 6h10a4 4 0 0 1 0 8h6a4 4 0 0 0 0 8h4" />
              <circle cx="4.5" cy="5.5" r="3" />
              <circle cx="29" cy="21.5" r="3" />
            </svg>
            <h2 className="font-display text-[27px] leading-none tracking-wide">
              LEAVE {SMART_WINDOW.earlierGap} MIN EARLIER
            </h2>
          </div>
          <p className="mt-3 text-[17px] leading-[23px]">
            Estimated crowd drops from {SMART_WINDOW.usual.crowd.toUpperCase()} to{' '}
            {SMART_WINDOW.earlier.crowd.toUpperCase()}.
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div>
              <AmberCrowdBadge level={SMART_WINDOW.usual.crowd} />
              {offline ? <p className="mt-1.5 text-[13px] tracking-wide text-[#6E6A62] uppercase">Last known</p> : null}
            </div>
            <span aria-hidden className="text-[26px]">→</span>
            <div>
              <AmberCrowdBadge level={SMART_WINDOW.earlier.crowd} />
              {offline ? <p className="mt-1.5 text-[13px] tracking-wide text-[#6E6A62] uppercase">Last known</p> : null}
            </div>
          </div>

          <div className="mt-5">
            <SplitButton disabled={offline} onClick={onOpenSmart}>
              SEE OPTIONS
            </SplitButton>
          </div>
        </AmberBox>

        {/* next trains */}
        <div className="mt-7 flex items-end justify-between">
          <h2 className="font-display text-[32px] leading-none tracking-wide">NEXT TRAINS</h2>
          <button
            type="button"
            disabled={offline}
            onClick={onOpenSmart}
            className={`font-display text-[20px] tracking-wide underline underline-offset-4 ${
              offline ? 'cursor-not-allowed text-[#A8A196] no-underline' : ''
            }`}
          >
            VIEW ALL
          </button>
        </div>

        {loading ? (
          <div className="mt-5 space-y-4" aria-busy="true">
            <span className="sr-only">Loading next trains…</span>
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {(offline || locationOff
              ? [TRAINS[1], TRAINS[2]]
              : TRAINS.slice(0, 3)
            ).map(t => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenTrain(t.id)}
                  className="flex w-full items-center justify-between border-[3px] bg-white px-4 py-3.5 text-left"
                  style={{ borderColor: '#111111' }}
                >
                  <span className="flex items-center gap-4">
                    <span>
                      <span className="block font-display text-[30px] leading-none">{t.departure}</span>
                      <span className="mt-1 block text-[13px] tracking-wide uppercase">{t.type}</span>
                    </span>
                    <span className="text-[16px] leading-[22px]">
                      {t.platform}
                      <br />
                      Arrives {t.arrival}
                    </span>
                  </span>
                  <AmberCrowdBadge level={t.crowd} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AmberShell>
  )
}

function TrainIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" aria-hidden>
      <rect x="60" y="24" width="100" height="14" fill="#111111" />
      <rect x="46" y="38" width="128" height="112" fill="#F9B800" stroke="#111111" strokeWidth="4" />
      <rect x="66" y="58" width="42" height="44" fill="white" stroke="#111111" strokeWidth="4" />
      <rect x="112" y="58" width="42" height="44" fill="white" stroke="#111111" strokeWidth="4" />
      <circle cx="80" cy="122" r="8" fill="white" stroke="#111111" strokeWidth="4" />
      <circle cx="140" cy="122" r="8" fill="white" stroke="#111111" strokeWidth="4" />
      <rect x="66" y="138" width="88" height="7" fill="#111111" />
      <rect x="52" y="164" width="46" height="6" fill="#111111" />
      <rect x="122" y="164" width="46" height="6" fill="#111111" />
    </svg>
  )
}
