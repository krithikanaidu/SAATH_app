import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { BUDDY_GROUPS } from '../lib/mockData'

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

  const groups = BUDDY_GROUPS.filter(g => line === 'All lines' || g.line === line.replace(' line', ''))

  const join = (id: string) => {
    const next = state.joinedGroupIds.includes(id)
      ? state.joinedGroupIds.filter(x => x !== id)
      : [...state.joinedGroupIds, id]
    update({ joinedGroupIds: next })
  }

  /* ---------------- empty (S09a) ---------------- */
  if (empty) {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/home')} />
        <Content className="flex flex-col">
          <h1 className="text-[24px] font-semibold">Saath Groups</h1>
          <p className="mt-2 text-[14px] text-[#616161]">Find company for your commute</p>

          <div className="mt-8 flex flex-col items-center rounded-[8px] border border-[#DDDDDD] px-5 py-10 text-center">
            <span aria-hidden className="text-[40px]">
              👥
            </span>
            <h2 className="mt-3 text-[18px] font-semibold">No groups match yet</h2>
            <p className="mt-2 text-[14px] leading-[20px] text-[#616161]">
              Try a different line or time filter — new buddy groups appear as organisers create
              them.
            </p>
            <div className="mt-5 w-full space-y-2">
              <Button
                onClick={() => {
                  setLine(LINES_FILTER[0])
                  setTime(TIME_FILTER[0])
                  navigate('/groups')
                }}
              >
                Clear filters
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')}>
                Back to home
              </Button>
            </div>
          </div>
        </Content>
      </DeviceFrame>
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
