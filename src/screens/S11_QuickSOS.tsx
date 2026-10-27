import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { TRUSTED_CONTACTS } from '../lib/mockData'

/**
 * S11 — Quick SOS.
 *  phase "idle"     → S11a (mono): hold the SOS pad for 2s
 *  phase "countdown"→ S11b (amber): 5s cancellable countdown
 *  phase "sent"     → S11c (amber): contacts notified + location sharing
 *
 * The prototype documents "intended hold: 3 seconds" on the flows board while
 * the screen copy says "Hold for 2 seconds" — the screen copy wins.
 */

const HOLD_MS = 2000
const COUNTDOWN_SECONDS = 5

type Phase = 'idle' | 'countdown' | 'sent'

export function QuickSOS() {
  const navigate = useNavigate()
  const { state, update } = useStore()

  const [phase, setPhase] = useState<Phase>('idle')
  const [holdPct, setHoldPct] = useState(0)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [shareLocation, setShareLocation] = useState(state.shareLocationOnSos)
  const [elapsed, setElapsed] = useState(0)

  const holdTimer = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  const holdStart = useRef(0)

  const stopHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    if (raf.current) {
      cancelAnimationFrame(raf.current)
      raf.current = null
    }
    setHoldPct(0)
  }, [])

  const beginHold = useCallback(() => {
    if (phase !== 'idle') return
    holdStart.current = Date.now()
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / HOLD_MS) * 100)
      setHoldPct(pct)
      if (pct < 100) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    holdTimer.current = window.setTimeout(() => {
      stopHold()
      setCountdown(COUNTDOWN_SECONDS)
      setPhase('countdown')
    }, HOLD_MS)
  }, [phase, stopHold])

  // countdown while in countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('sent')
      update({ shareLocationOnSos: shareLocation })
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, shareLocation, update])

  // location sharing timer on the "sent" screen (30 min cap in the copy)
  useEffect(() => {
    if (phase !== 'sent') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => () => stopHold(), [stopHold])

  const cancelCountdown = () => {
    stopHold()
    setPhase('idle')
    setCountdown(COUNTDOWN_SECONDS)
  }

  const goHome = () => {
    setPhase('idle')
    setHoldPct(0)
    setElapsed(0)
    navigate('/home')
  }

  /* ---------------- countdown (S11b, amber) ---------------- */
  if (phase === 'countdown') {
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <p className="mt-2 font-display text-[22px] tracking-wide uppercase">Safety</p>
          <div className="mt-6 flex flex-col items-center">
            <p className="font-display text-[72px] leading-none text-[#D92D20]">
              {String(countdown).padStart(2, '0')}
            </p>
            <p className="mt-3 font-display text-[22px] tracking-wide uppercase">
              Sending alert to 3 contacts
            </p>
          </div>

          <div className="mt-6 rounded-[8px] border-2 border-[#D92D20] bg-[#FFE9E6] px-4 py-4 text-[15px] leading-[22px]">
            Your trusted contacts will get your name, trip and (if enabled) your live location.
            This is not an emergency dispatch — call 112 for help.
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={cancelCountdown}
            className="w-full border-2 border-[#111111] bg-white py-4 font-display text-[22px] tracking-wide uppercase"
          >
            Cancel
          </button>
        </div>
      </DeviceFrame>
    )
  }

  /* ---------------- sent (S11c, amber) ---------------- */
  if (phase === 'sent') {
    const sharing = shareLocation
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const ss = String(elapsed % 60).padStart(2, '0')
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <p className="mt-2 font-display text-[22px] tracking-wide uppercase">Safety</p>
          <h1 className="mt-3 font-display text-[44px] leading-[46px] tracking-wide uppercase">
            Alert sent
          </h1>
          <p className="mt-1 font-display text-[22px] tracking-wide uppercase">Contacts notified</p>

          <ul className="mt-5 space-y-3">
            {TRUSTED_CONTACTS.map(c => (
              <li
                key={c.id}
                className="flex items-center gap-3 border-2 border-[#111111] bg-white px-3 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#111111] font-display text-[20px]">
                  {c.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{c.name}</span>
                  <span className="block text-[14px] text-[#5A5750]">{c.phone}</span>
                </span>
                <span aria-hidden className="text-[18px]">
                  ✓
                </span>
              </li>
            ))}
          </ul>

          {sharing ? (
            <div className="mt-4 border-2 border-[#111111] bg-[#F9B800] px-4 py-3">
              <p className="font-display text-[18px] tracking-wide uppercase">
                Sharing location · {mm}:{ss}
              </p>
              <button
                type="button"
                onClick={() => setShareLocation(false)}
                className="mt-2 border-2 border-[#111111] bg-white px-4 py-2 font-display text-[16px] tracking-wide uppercase"
              >
                Stop sharing
              </button>
            </div>
          ) : (
            <p className="mt-4 border-2 border-[#111111] bg-white px-4 py-3 text-[14px]">
              Location sharing stopped.
            </p>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={goHome}
            className="w-full border-2 border-[#111111] bg-[#F9B800] py-4 font-display text-[22px] tracking-wide uppercase shadow-[4px_4px_0_0_#111111]"
          >
            Home
          </button>
        </div>
      </DeviceFrame>
    )
  }

  /* ---------------- idle (S11a, mono) ---------------- */
  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/home')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Quick SOS</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          Trusted-contact alert · Not emergency dispatch
        </p>

        <p className="mt-4 text-center text-[15px] leading-[22px] text-[#616161]">
          In immediate danger? Call 112.
          <br />
          Saath cannot guarantee a response.
        </p>

        {/* hold pad */}
        <button
          type="button"
          aria-label="Hold for 2 seconds to start SOS countdown"
          onPointerDown={beginHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onKeyDown={e => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              if (holdPct === 0) beginHold()
            }
          }}
          onKeyUp={stopHold}
          disabled={phase !== 'idle'}
          className="relative mt-4 flex h-[190px] w-full flex-col items-center justify-center overflow-hidden rounded-[8px] bg-[#202020] text-white select-none"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 bg-[#D92D20] transition-[height] duration-75"
            style={{ height: `${holdPct}%` }}
          />
          <span className="relative text-[48px] leading-none font-bold">SOS</span>
          <span className="relative mt-3 text-[16px]">
            {holdPct > 0 ? 'Keep holding…' : 'Hold for 2 seconds'}
          </span>
          <span className="sr-only" role="status">
            {holdPct > 0 ? `${Math.round(holdPct)} percent` : ''}
          </span>
        </button>

        <p className="mt-4 text-center text-[15px] leading-[22px] text-[#616161]">
          Then a 5-second countdown begins.
          <br />
          Cancel before your alert is sent.
        </p>

        {/* trusted contacts */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Trusted contacts</h2>
        <ul className="mt-2">
          {TRUSTED_CONTACTS.slice(0, 2).map(c => (
            <li
              key={c.id}
              className="flex items-center justify-between border-b border-[#DDDDDD] px-1 py-3.5 text-[16px]"
            >
              <span>
                {c.name} · {c.relation}
              </span>
              <span className="text-[#616161]">•••• {c.last4}</span>
            </li>
          ))}
        </ul>

        {/* share location toggle */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={shareLocation}
              onChange={e => setShareLocation(e.target.checked)}
              className="h-6 w-6 shrink-0 accent-[#202020]"
            />
            <span className="text-[16px] font-medium">Share live location with SOS</span>
          </label>
          <p className="mt-2 pl-9 text-[13px] leading-[18px] text-[#616161]">
            Shared only after the timer. Stops after 30 min or when you choose Stop sharing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/setup')}
          className="mt-4 self-start text-[15px] font-medium underline underline-offset-4"
        >
          Manage trusted contacts →
        </button>

        <div className="flex-1" />
      </Content>
    </DeviceFrame>
  )
}
