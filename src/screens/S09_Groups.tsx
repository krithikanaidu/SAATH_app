import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { BUDDY_GROUPS } from '../lib/mockData'
import { AmberShell, SplitButton } from '../components/amber'
import type { BuddyGroup } from '../lib/types'

/**
 * S09 — Saath Groups list.
 *  ?state=empty → S09a
 */

const LINES_FILTER = ['All lines', 'Western line', 'Central line']
const TIME_FILTER = ['Morning', 'Afternoon', 'Evening']

export function Groups() {
  const navigate = useNavigate()
  const { state, update } = useStore()
  const empty = new URLSearchParams(location.search).get('state') === 'empty'

  const [line, setLine] = useState(LINES_FILTER[0])
  const [time, setTime] = useState(TIME_FILTER[0])
  const [selected, setSelected] = useState('western-morning-buddies')
  const [creating, setCreating] = useState(false)

  const allGroups = [...BUDDY_GROUPS, ...(state.customGroups ?? [])]
  const groups = allGroups.filter(g => line === 'All lines' || g.line === line.replace(' line', ''))

  const join = (id: string) => {
    const next = state.joinedGroupIds.includes(id)
      ? state.joinedGroupIds.filter(x => x !== id)
      : [...state.joinedGroupIds, id]
    update({ joinedGroupIds: next })
  }

  /* ---------------- empty (S09a) — amber system ---------------- */
  if (empty) {
    return (
      <>
        <AmberShell
          title="SAATH GROUPS"
          right={
            <button
              type="button"
              aria-label="Create a group"
              onClick={() => setCreating(true)}
              className="flex h-[54px] w-[54px] items-center justify-center border-[3px] bg-white text-[34px] leading-none"
              style={{ borderColor: '#111111' }}
            >
              +
            </button>
          }
        >
          {/* tabs */}
          <div className="flex border-[3px]" style={{ borderColor: '#111111' }}>
            <span className="flex-1 bg-[#F9B800] px-4 py-3 text-center font-display text-[20px] tracking-wide">
              MY GROUPS
            </span>
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="flex-1 border-l-[3px] border-[#111111] px-4 py-3 text-center font-display text-[20px] tracking-wide text-[#A8A196]"
            >
              DISCOVER
            </button>
          </div>

          <div className="mt-6 border-[3px] bg-white px-4 py-8" style={{ borderColor: '#111111' }}>
            <PeopleIllustration />
          </div>

          <h2 className="mt-6 font-display text-[32px] leading-none tracking-wide">NO GROUPS YET</h2>

          <div className="mt-6">
            <SplitButton onClick={() => navigate('/groups')} ariaLabel="Discover groups">
              DISCOVER GROUPS
            </SplitButton>
          </div>

          {creating ? (
            <CreateGroupModal
              onClose={() => setCreating(false)}
              onCreated={id => {
                setCreating(false)
                navigate(`/groups/${id}`)
              }}
            />
          ) : null}
        </AmberShell>
      </>
    )
  }

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/home')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Saath Groups</h1>
        <p className="mt-2 text-[14px] text-[#616161]">Find company for your commute</p>

        {/* filters */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: line, options: LINES_FILTER, value: line, set: setLine, name: 'Line filter' },
            { label: time, options: TIME_FILTER, value: time, set: setTime, name: 'Time filter' },
          ].map(f => (
            <div key={f.name} className="relative">
              <select
                aria-label={f.name}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full appearance-none rounded-[8px] border border-[#DDDDDD] bg-white px-4 py-3.5 pr-9 text-[16px]"
              >
                {f.options.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                ⌄
              </span>
            </div>
          ))}
        </div>

        {/* group cards */}
        <ul className="mt-4 space-y-3">
          {groups.map(g => {
            const isSelected = selected === g.id
            const isJoined = state.joinedGroupIds.includes(g.id)
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelected(g.id)}
                  onDoubleClick={() => navigate(`/groups/${g.id}`)}
                  className={`w-full rounded-[8px] px-4 py-4 text-left transition-all ${
                    isSelected ? 'border-2 border-[#202020] bg-[#F2F2F2]' : 'border border-[#DDDDDD] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[18px] leading-[23px] font-semibold">{g.name}</p>
                      <p className="mt-1.5 text-[14px] leading-[20px] text-[#616161]">
                        {g.from} → {g.to}
                        <br />
                        {g.window} · {g.members} members
                      </p>
                      <p className="mt-2 text-[13px] text-[#202020]">
                        {g.verifiedOrganiser ? '✓ ' : ''}
                        Phone-verified organiser
                      </p>
                    </div>
                    <span className="shrink-0 text-[14px] font-semibold">
                      {isSelected ? (
                        isJoined ? 'Joined' : 'Selected'
                      ) : (
                        <span className="underline underline-offset-2">View →</span>
                      )}
                    </span>
                  </div>
                </button>
                {isSelected ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      full={false}
                      className="min-h-[44px] flex-1"
                      onClick={() => navigate(`/groups/${g.id}`)}
                    >
                      Open group
                    </Button>
                    <Button
                      full={false}
                      variant="secondary"
                      className="min-h-[44px] flex-1"
                      onClick={() => join(g.id)}
                    >
                      {isJoined ? 'Leave' : 'Join'}
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>

        {groups.length === 0 ? (
          <div className="mt-6 rounded-[8px] border border-dashed border-[#B8B8B8] px-4 py-8 text-center">
            <p className="text-[14px] text-[#616161]">No groups on this line yet.</p>
            <button
              type="button"
              onClick={() => setLine(LINES_FILTER[0])}
              className="mt-2 text-[14px] font-semibold underline underline-offset-2"
            >
              Show all lines
            </button>
          </div>
        ) : null}

        <p className="mt-4 text-[12px] leading-[17px] text-[#616161]">
          Verified means the organiser verified a phone number, not their identity or safety. Meet
          in a public place.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button
            onClick={() => {
              join(selected)
              navigate(`/groups/${selected}`)
            }}
          >
            {state.joinedGroupIds.includes(selected) ? 'Open morning buddies' : 'Join morning buddies'}
          </Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}

/* ---------------- amber helpers for S09a ---------------- */

/** four commuters standing on a platform line — from the S09a illustration */
function PeopleIllustration() {
  const centers = [34, 98, 162, 226]
  return (
    <svg width="100%" height="150" viewBox="0 0 260 150" aria-hidden role="img">
      <title>Commuters standing together</title>
      <line x1="6" y1="138" x2="254" y2="138" stroke="#111111" strokeWidth="4" />
      {centers.map((cx, i) => {
        const headR = 15
        const bodyTop = 44 + (i % 2 === 0 ? 0 : 4)
        return (
          <g key={cx}>
            <circle cx={cx} cy={bodyTop - headR - 2} r={headR} fill="#FAF8F4" stroke="#111111" strokeWidth="4" />
            <rect x={cx - 20} y={bodyTop} width="40" height="62" fill="#F9B800" stroke="#111111" strokeWidth="4" />
            <line x1={cx - 10} y1={bodyTop + 62} x2={cx - 10} y2="138" stroke="#111111" strokeWidth="5" />
            <line x1={cx + 10} y1={bodyTop + 62} x2={cx + 10} y2="138" stroke="#111111" strokeWidth="5" />
          </g>
        )
      })}
    </svg>
  )
}

const WINDOWS = ['08:00–08:30', '08:15–08:45', '08:30–09:00', '17:00–18:00']
const LINE_OPTIONS = ['Western', 'Central', 'Harbour']

/**
 * Create-group sheet opened by the "+" on S09a. Styled in the amber system so it
 * reads as part of that screen; on success the new group is persisted to the
 * mock store and the flow continues into the group detail screen.
 */
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const { state, update } = useStore()
  const [name, setName] = useState('')
  const [lineOpt, setLineOpt] = useState('Western')
  const [win, setWin] = useState(WINDOWS[1])
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setError('Give your group a name of at least 3 characters.')
      return
    }
    const id = `custom-${Date.now()}`
    const group: BuddyGroup = {
      id,
      name: trimmed,
      from: state.fromStation,
      to: state.toStation,
      window: win,
      members: 1,
      line: lineOpt,
      verifiedOrganiser: true,
      joined: true,
    }
    update({
      customGroups: [...(state.customGroups ?? []), group],
      joinedGroupIds: [...state.joinedGroupIds, id],
    })
    onCreated(id)
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-end bg-black/40 px-4 pb-6"
      role="dialog"
      aria-modal="true"
      aria-label="Start a group"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full border-[3px] bg-[#FAF8F4] p-5 shadow-[6px_6px_0_0_#111111]"
        style={{ borderColor: '#111111' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[30px] leading-none tracking-wide">START A GROUP</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center border-[3px] bg-white text-[20px] leading-none"
            style={{ borderColor: '#111111' }}
          >
            ×
          </button>
        </div>

        <label className="mt-5 block font-display text-[18px] tracking-wide" htmlFor="cg-name">
          GROUP NAME
        </label>
        <input
          id="cg-name"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          placeholder="e.g. Western morning buddies"
          className={`mt-2 w-full border-[3px] bg-white px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-[#F9B800] ${
            error ? 'border-[#D92D20]' : 'border-[#111111]'
          }`}
        />
        {error ? (
          <p role="alert" className="mt-2 flex items-start gap-2 text-[15px] leading-[21px] text-[#D92D20]">
            <span aria-hidden>⚠</span> {error}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block font-display text-[18px] tracking-wide" htmlFor="cg-line">
              LINE
            </label>
            <select
              id="cg-line"
              value={lineOpt}
              onChange={e => setLineOpt(e.target.value)}
              className="mt-2 w-full border-[3px] border-[#111111] bg-white px-3 py-3 text-[16px]"
            >
              {LINE_OPTIONS.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-display text-[18px] tracking-wide" htmlFor="cg-window">
              WINDOW
            </label>
            <select
              id="cg-window"
              value={win}
              onChange={e => setWin(e.target.value)}
              className="mt-2 w-full border-[3px] border-[#111111] bg-white px-3 py-3 text-[16px]"
            >
              {WINDOWS.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-[14px] leading-[19px] text-[#5A5750]">
          Runs on your usual route: {state.fromStation} → {state.toStation}.
        </p>

        <div className="mt-5">
          <SplitButton onClick={submit}>CREATE GROUP</SplitButton>
        </div>
      </div>
    </div>
  )
}
