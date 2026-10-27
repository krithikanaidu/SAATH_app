import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { RECENT_TRIPS } from '../lib/mockData'

/**
 * S12 — rewards + trip summary.
 *  ?state=empty → S12a
 */

export function Rewards() {
  const navigate = useNavigate()
  const { state } = useStore()
  const empty = new URLSearchParams(location.search).get('state') === 'empty'

  /* ---------------- empty (S12a) ---------------- */
  if (empty) {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/home')} />
        <Content className="flex flex-col">
          <h1 className="text-[24px] font-semibold">Your trip, wrapped up</h1>
          <p className="mt-2 text-[14px] text-[#616161]">
            Illustrative trip history &amp; non-cash points
          </p>

          <div className="mt-8 flex flex-col items-center rounded-[8px] border border-[#DDDDDD] px-5 py-10 text-center">
            <span aria-hidden className="text-[40px]">
              🎁
            </span>
            <h2 className="mt-3 text-[18px] font-semibold">No trips yet</h2>
            <p className="mt-2 text-[14px] leading-[20px] text-[#616161]">
              Complete a journey and your Saath points will show up here.
            </p>
            <div className="mt-5 w-full">
              <Button onClick={() => navigate('/home')}>Plan a trip</Button>
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
        <h1 className="text-[24px] leading-[29px] font-semibold">Your trip, wrapped up</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          Illustrative trip history &amp; non-cash points
        </p>

        {/* points card */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-5">
          <p className="text-[12px] font-bold tracking-wide">OFF-PEAK JOURNEY COMPLETED</p>
          <p className="mt-2 text-[32px] leading-[38px] font-semibold">+20 Saath points</p>
          <p className="mt-3 text-[16px] leading-[24px]">
            You chose a lower-crowd departure.
            <br />
            Your balance: {state.points} points
          </p>
        </div>

        {/* today's trip */}
        <div className="mt-4 rounded-[8px] border border-[#DDDDDD] px-4 py-4">
          <h2 className="text-[18px] leading-[23px] font-semibold">Today’s trip</h2>
          <p className="mt-2 text-[16px] leading-[24px]">
            {state.fromStation} → {state.toStation} · {state.usualLine.replace(' line', '')}
            <br />
            08:42–09:50 · 68 minutes
            <br />
            Buddy group: Morning buddies
          </p>
        </div>

        {/* recent trips */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Recent trips</h2>
        <ul className="mt-2">
          {RECENT_TRIPS.map(t => (
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
          ))}
        </ul>

        <p className="mt-3 text-[12px] leading-[17px] text-[#616161]">
          Points recognise off-peak choices. They are not money or railway fare discounts.
        </p>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={() => navigate('/home')}>Plan next trip</Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
