import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { useGroups, useTrips } from '../lib/hooks'
import { STATIONS } from '../lib/mockData'
import { AmberShell, SplitButton } from '../components/amber'
import { SyncBadge } from '../components/SyncBadge'
import type { Language } from '../lib/types'

/**
 * S12 — rewards + trip summary + profile.
 *  ?state=empty → S12a
 *
 * Profile data comes from the signed-in Supabase user (falling back to local
 * state when there is no backend). Trips and joined groups come from the
 * backend via `useTrips` / `useGroups`.
 */

export function Rewards() {
  const navigate = useNavigate()
  const { state } = useStore()
  const { profile, mode } = useAuth()
  const groups = useGroups()
  const trips = useTrips()
  const empty = new URLSearchParams(location.search).get('state') === 'empty'
  const [settings, setSettings] = useState(false)
  const [editing, setEditing] = useState(false)

  // resolve the buddy group the user actually joined (backend + local groups)
  const joinedGroupName = groups.data.find(g => g.joined)?.name

  const displayName = profile?.name || state.name || 'Commuter'
  const phone = profile?.phone || state.phone || ''
  const points = profile?.points ?? state.points

  /* ---------------- empty (S12a) — amber system ---------------- */
  if (empty) {
    return (
      <>
        <AmberShell
          title="MY RIDES"
          right={
            <button
              type="button"
              aria-label="Settings"
              onClick={() => setSettings(true)}
              className="flex h-[54px] w-[54px] items-center justify-center border-[3px] bg-white"
              style={{ borderColor: '#111111' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
                <path d="M19.1 13.2a7.4 7.4 0 0 0 0-2.4l1.9-1.5-1.9-3.3-2.3 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-3.8l-.3 2.8a7.4 7.4 0 0 0-2 1.2l-2.3-1L4.1 9.3 6 10.8a7.4 7.4 0 0 0 0 2.4l-1.9 1.5 1.9 3.3 2.3-1c.6.5 1.3.9 2 1.2l.3 2.8h3.8l.3-2.8a7.4 7.4 0 0 0 2-1.2l2.3 1 1.9-3.3-1.9-1.5z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          }
        >
          {/* points card */}
          <div
            className="mt-2 border-[3px] bg-[#F9B800] px-5 py-5 shadow-[6px_6px_0_0_#111111]"
            style={{ borderColor: '#111111' }}
          >
            <p className="font-display text-[20px] tracking-[0.04em]">YOUR POINTS</p>
            <p className="mt-1 font-display text-[64px] leading-none">{points}</p>
            <div className="mt-4 h-6 border-[3px] bg-white" style={{ borderColor: '#111111' }}>
              <div className="h-full" style={{ width: `${Math.min(100, (points / 300) * 100)}%` }} />
            </div>
            <p className="mt-3 font-display text-[18px] tracking-[0.04em]">
              {Math.max(0, 300 - points)} TO NEXT REWARD
            </p>
          </div>

          <h2 className="mt-7 font-display text-[32px] leading-none tracking-wide">NO TRIPS YET</h2>
          <p className="mt-3 font-display text-[22px] leading-[28px] tracking-wide">
            YOUR FIRST OFF-PEAK TRIP EARNS 30 POINTS.
          </p>

          <div className="mt-6">
            <SplitButton disabled>REDEEM POINTS</SplitButton>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-5 self-start font-display text-[22px] tracking-wide underline underline-offset-4"
          >
            VIEW TRIP HISTORY
          </button>

          {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
        </AmberShell>
      </>
    )
  }

  if (editing) {
    return <EditProfile onDone={() => setEditing(false)} />
  }

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/home')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Your trip, wrapped up</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          {mode === 'supabase'
            ? 'Signed in · points recognise off-peak choices'
            : 'Illustrative trip history & non-cash points'}
        </p>

        {/* profile card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#202020] bg-white text-[16px] font-semibold"
              aria-hidden
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[18px] leading-[23px] font-semibold">{displayName}</p>
              <p className="truncate text-[14px] text-[#616161]">{phone || 'No number on file'}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-1 text-[15px] leading-[21px]">
            <div className="flex justify-between">
              <dt className="text-[#616161]">Route</dt>
              <dd className="font-semibold">
                {state.fromStation} → {state.toStation}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#616161]">Line</dt>
              <dd className="font-semibold">{state.usualLine.replace(' line', '')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#616161]">Usual departure</dt>
              <dd className="font-semibold">{state.departureTime}</dd>
            </div>
          </dl>
          <SyncBadge source={groups.source} label={mode === 'supabase' ? undefined : 'demo mode'} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 text-[14px] font-semibold underline underline-offset-2"
          >
            Edit profile
          </button>
        </div>

        {/* points card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-5">
          <p className="text-[12px] font-bold tracking-wide">OFF-PEAK JOURNEY COMPLETED</p>
          <p className="mt-2 text-[32px] leading-[38px] font-semibold">+20 Saath points</p>
          <p className="mt-3 text-[16px] leading-[24px]">
            You chose a lower-crowd departure.
            <br />
            Your balance: {points} points
          </p>
        </div>

        {/* today's trip */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <h2 className="text-[18px] leading-[23px] font-semibold">Today’s trip</h2>
          <p className="mt-2 text-[16px] leading-[24px]">
            {state.fromStation} → {state.toStation} · {state.usualLine.replace(' line', '')}
            <br />
            {state.chosenDeparture} departure · picked from Smart Window
            <br />
            Buddy group: {joinedGroupName ?? 'No buddy group joined'}
          </p>
        </div>

        {/* recent trips */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Recent trips</h2>
        <ul className="mt-2">
          {trips.data.length === 0 ? (
            <li className="rounded-[8px] border border-dashed border-[#B8B8B8] px-4 py-6 text-center">
              <p className="text-[14px] text-[#616161]">
                No trips recorded yet. Complete a journey to start your history.
              </p>
            </li>
          ) : (
            trips.data.map(t => (
              <li
                key={t.id}
                className="flex items-center justify-between border-b border-[#DDDDDD] py-3.5"
              >
                <span>
                  <span className="block text-[16px] font-semibold">{t.when}</span>
                  <span className="mt-0.5 block text-[14px] text-[#616161]">
                    {t.from} → {t.to}
                  </span>
                </span>
                <span className="text-[15px]">+{t.points} pts</span>
              </li>
            ))
          )}
        </ul>

        <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
          Points recognise off-peak choices. They are not money or railway fare discounts.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => navigate('/home')}>Plan next trip</Button>
          <button
            type="button"
            onClick={() => setSettings(true)}
            className="mx-auto mt-3 block text-[13px] text-[#616161] underline underline-offset-2"
          >
            Settings
          </button>
        </div>
      </Content>
    </DeviceFrame>
  )
}

/**
 * Edit-profile sheet. Writes to the local store always and to the Supabase
 * profile when a session exists.
 */
function EditProfile({ onDone }: { onDone: () => void }) {
  const { state, update } = useStore()
  const { profile, syncProfile } = useAuth()
  const [name, setName] = useState(profile?.name || state.name || '')
  const [line, setLine] = useState(state.usualLine)
  const [from, setFrom] = useState(state.fromStation)
  const [to, setTo] = useState(state.toStation)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const stations = STATIONS[line] ?? STATIONS['Western line']
  const sameStation = from === to

  const save = async () => {
    if (sameStation) return
    setSaving(true)
    update({
      ...(name.trim() ? { name: name.trim() } : {}),
      usualLine: line,
      fromStation: from,
      toStation: to,
    })
    await syncProfile({
      ...(name.trim() ? { name: name.trim() } : {}),
      usualLine: line,
      fromStation: from,
      toStation: to,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(onDone, 600)
  }

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={onDone} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Edit profile</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          Your name and usual journey. Changes apply across the app.
        </p>

        <div className="mt-5">
          <label htmlFor="ep-name" className="block text-[14px] font-semibold">
            Name
          </label>
          <input
            id="ep-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 text-[16px]"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="ep-line" className="block text-[14px] font-semibold">
            Line
          </label>
          <select
            id="ep-line"
            value={line}
            onChange={e => {
              const l = e.target.value
              setLine(l)
              const s = STATIONS[l] ?? []
              if (s.length) {
                setFrom(s[0])
                setTo(s[s.length - 1])
              }
            }}
            className="mt-2 w-full rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 text-[16px]"
          >
            {Object.keys(STATIONS).map(l => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ep-from" className="block text-[14px] font-semibold">
              From
            </label>
            <select
              id="ep-from"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="mt-2 w-full rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 text-[16px]"
            >
              {stations.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ep-to" className="block text-[14px] font-semibold">
              To
            </label>
            <select
              id="ep-to"
              value={to}
              onChange={e => setTo(e.target.value)}
              className={`mt-2 w-full rounded-[8px] border bg-white px-4 py-3.5 text-[16px] ${
                sameStation ? 'border-[#D92D20]' : 'border-[#DDDDDD]'
              }`}
            >
              {stations.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {sameStation ? (
          <p role="alert" className="mt-3 text-[13px] text-[#D92D20]">
            Pick two different stations.
          </p>
        ) : null}

        {saved ? (
          <p role="status" className="mt-3 text-[14px] font-semibold text-[#1B7F4B]">
            Saved.
          </p>
        ) : null}

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => void save()} disabled={sameStation || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}

/* ---------------- amber settings sheet (gear on S12a) ---------------- */

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'mr', label: 'मराठी' },
]

/**
 * Compact settings sheet behind the gear on S12a and the "Settings" link on S12.
 * It touches local state (language, large text), mirrors language/size to the
 * Supabase profile when signed in, offers a full reset, and lets the user sign
 * out of their account.
 */
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { state, update, reset } = useStore()
  const { profile, signOut, syncProfile, mode } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const doSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    onClose()
    window.location.assign('/')
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-end bg-black/40 px-4 pb-6"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full border-[3px] bg-[#FAF8F4] p-5 shadow-[6px_6px_0_0_#111111]"
        style={{ borderColor: '#111111' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[30px] leading-none tracking-wide">SETTINGS</h2>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center border-[3px] bg-white text-[20px] leading-none"
            style={{ borderColor: '#111111' }}
          >
            ×
          </button>
        </div>

        {profile ? (
          <p className="mt-3 text-[14px] leading-[19px] text-[#5A5750]">
            Signed in as {profile.name}
            {profile.phone ? ` · ${profile.phone}` : ''}
          </p>
        ) : (
          <p className="mt-3 text-[14px] leading-[19px] text-[#5A5750]">
            {mode === 'supabase'
              ? 'Not signed in.'
              : 'Demo mode — backend not connected. Data stays on this device.'}
          </p>
        )}

        <fieldset className="mt-5">
          <legend className="font-display text-[18px] tracking-wide">LANGUAGE</legend>
          <div className="mt-2 flex border-[3px]" style={{ borderColor: '#111111' }}>
            {LANGUAGE_OPTIONS.map((l, i) => {
              const active = state.language === l.id
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    update({ language: l.id })
                    void syncProfile({ language: l.id })
                  }}
                  className={`flex-1 px-2 py-3 text-[15px] ${i > 0 ? 'border-l-[3px] border-[#111111]' : ''} ${
                    active ? 'bg-[#F9B800] font-bold' : 'bg-white text-[#5A5750]'
                  }`}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-5 flex items-center justify-between">
          <span className="font-display text-[18px] tracking-wide">LARGE TEXT</span>
          <button
            type="button"
            role="switch"
            aria-checked={state.largeText}
            onClick={() => {
              const next = !state.largeText
              update({ largeText: next })
              void syncProfile({ largeText: next })
            }}
            className={`flex h-9 w-16 items-center border-[3px] px-1 ${state.largeText ? 'bg-[#F9B800]' : 'bg-white'}`}
            style={{ borderColor: '#111111' }}
          >
            <span
              aria-hidden
              className={`h-6 w-6 border-2 border-[#111111] bg-white transition-transform ${
                state.largeText ? 'translate-x-7' : ''
              }`}
            />
          </button>
        </div>

        <p className="mt-4 text-[14px] leading-[19px] text-[#5A5750]">
          Language and size are stored on this device only. Resetting clears your trips, groups and
          sign-in.
        </p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
              window.location.assign('/')
            }}
            className="w-full border-[3px] border-[#111111] bg-white px-4 py-3.5 font-display text-[20px] tracking-wide"
          >
            RESET APP
          </button>
          {profile ? (
            <button
              type="button"
              onClick={() => void doSignOut()}
              disabled={signingOut}
              className="w-full border-[3px] border-[#111111] bg-[#FFE9E6] px-4 py-3.5 font-display text-[20px] tracking-wide text-[#C81D25] disabled:opacity-60"
            >
              {signingOut ? 'SIGNING OUT…' : 'SIGN OUT'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
