import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'

/**
 * S02a / S02b / S02c — 3-slide onboarding carousel.
 * All slides render in the amber system so the whole first-run journey
 * (S01 → S04) reads as one continuous flow.
 */

const SLIDES = [
  {
    id: 'a',
    title: 'Know before you go',
    body: 'Compare crowd reports before choosing a train or compartment. Reports come from commuters and may change quickly.',
    cta: 'Next',
  },
  {
    id: 'b',
    title: 'Skip the rush',
    body: 'Get suggestions to leave a little earlier or later, and book an advisory boarding slot.',
    cta: 'Next',
  },
  {
    id: 'c',
    title: 'Never travel alone',
    body: 'Join verified buddy groups and send an SOS in one tap.',
    cta: 'Get started',
  },
]

/** Example crowd graphic on slide 1, drawn in the amber system. */
function CrowdExample() {
  const LEVELS: { label: string; color: string; name: string }[] = [
    { label: 'LOW', color: '#3BA55D', name: 'Ladies' },
    { label: 'MEDIUM', color: '#F9B800', name: 'General' },
    { label: 'HIGH', color: '#E5484D', name: 'First' },
  ]
  return (
    <div className="border-[3px] border-[#111111] bg-white p-4 shadow-[5px_5px_0_0_#111111]">
      <p className="font-display text-[18px] tracking-[0.04em] text-[#5A5750]">
        COMPARTMENT CROWD · EXAMPLE
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {LEVELS.map(l => (
          <div
            key={l.name}
            className="flex h-[74px] items-center justify-center border-[3px] border-[#111111] bg-white font-display text-[20px] tracking-wide"
          >
            {l.name}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {LEVELS.map(l => (
          <span
            key={l.name}
            className="flex items-center justify-center gap-2 border-[3px] border-[#111111] bg-white px-1 py-2 font-display text-[17px] tracking-wide"
          >
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 border-2 border-[#111111]"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Line illustration for slides 2 and 3. */
function SlideIllustration({ kind }: { kind: 'queue' | 'group' }) {
  return (
    <div className="border-[3px] border-[#111111] bg-white p-5">
      <svg viewBox="0 0 300 150" className="w-full" role="img" aria-hidden>
        {kind === 'queue' ? (
          <>
            <rect x="40" y="14" width="220" height="52" fill="none" stroke="#111111" strokeWidth="3" />
            {[52, 97, 142, 187, 232].map(x => (
              <rect key={x} x={x} y="26" width="30" height="30" fill="#F9B800" stroke="#111111" strokeWidth="3" />
            ))}
            {[55, 120, 185, 240].map((x, i) => (
              <g key={x} stroke="#111111" strokeWidth="3" fill="none">
                <circle cx={x} cy="86" r="10" />
                <path d={`M${x} 96 v22 M${x - 16} 104 h32 M${x} 118 l-12 18 M${x} 118 l12 18`} />
                {i === 3 ? <rect x={x + 14} y="112" width="34" height="14" fill="#F9B800" stroke="#111111" /> : null}
              </g>
            ))}
            <line x1="30" y1="140" x2="270" y2="140" stroke="#111111" strokeWidth="4" />
          </>
        ) : (
          <>
            {[45, 110, 175, 240].map((x, i) => (
              <g key={x} stroke="#111111" strokeWidth="3" fill="none">
                <circle cx={x} cy={30 + (i % 2) * 10} r="13" />
                <rect x={x - 20} y={48 + (i % 2) * 10} width="40" height="56" fill="#F9B800" stroke="#111111" />
                <path d={`M${x} ${104 + (i % 2) * 10} v22`} />
              </g>
            ))}
            <line x1="30" y1="130" x2="270" y2="130" stroke="#111111" strokeWidth="4" />
          </>
        )}
      </svg>
    </div>
  )
}

function Dots({ index, count }: { index: number; count: number }) {
  return (
    <div className="flex items-center justify-center gap-3 py-5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-3 rounded-full border-2 border-[#111111] transition-all ${
            i === index ? 'w-7 bg-[#F9B800]' : 'w-3 bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

export function Onboarding() {
  const navigate = useNavigate()
  const { update } = useStore()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  const next = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1)
      return
    }
    // last slide → complete onboarding into sign-up
    update({ onboarded: true })
    navigate('/signup')
  }

  const skip = () => {
    update({ onboarded: true })
    navigate('/signup')
  }

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-5">
        <div className="flex items-start justify-between">
          <ScreenHeader
            title=""
            variant="display"
            onBack={() => (index > 0 ? setIndex(index - 1) : navigate('/'))}
          />
          <button
            type="button"
            onClick={skip}
            className="mt-3 text-[14px] font-bold tracking-wide underline underline-offset-4"
          >
            SKIP
          </button>
        </div>

        <div className="px-1">
          <h1 className="font-display text-[40px] leading-[44px] tracking-wide uppercase">
            {slide.title}
          </h1>
          <p className="mt-4 text-[16px] leading-[24px] text-[#5A5750]">{slide.body}</p>
        </div>

        <div className="mt-5">
          {index === 0 ? <CrowdExample /> : <SlideIllustration kind={index === 1 ? 'queue' : 'group'} />}
        </div>

        <Dots index={index} count={SLIDES.length} />

        <div className="flex-1" />

        <Button variant="amberSplit" onClick={next}>
          {slide.cta}
        </Button>
      </div>
    </DeviceFrame>
  )
}
