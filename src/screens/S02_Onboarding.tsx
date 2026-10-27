import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'

/**
 * S02a / S02b / S02c — 3-slide onboarding carousel.
 * Slide 1 uses the mono style; slides 2–3 use the amber/Bebas style, exactly
 * as the two systems exist side by side in the Figma file.
 */

type Slide = {
  id: 'a' | 'b' | 'c'
  theme: 'mono' | 'amber'
  title: string
  body: string
  cta: string
}

const SLIDES: Slide[] = [
  {
    id: 'a',
    theme: 'mono',
    title: 'Know before you go',
    body: 'Compare crowd reports before choosing a train or compartment. Reports come from commuters and may change quickly.',
    cta: 'Next',
  },
  {
    id: 'b',
    theme: 'amber',
    title: 'Skip the rush',
    body: 'Get suggestions to leave a little earlier or later, and book an advisory boarding slot.',
    cta: 'Next',
  },
  {
    id: 'c',
    theme: 'amber',
    title: 'Never travel alone',
    body: 'Join verified buddy groups and send an SOS in one tap.',
    cta: 'Get started',
  },
]

/** Example crowd graphic on slide 1 (COMPARTMENT CROWD · EXAMPLE). */
function CrowdExample() {
  return (
    <div className="rounded-[8px] border border-[#DDDDDD] p-4">
      <p className="text-[12px] leading-[15px] font-semibold tracking-wide text-[#616161]">
        COMPARTMENT CROWD · EXAMPLE
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {['Ladies', 'General', 'First'].map(name => (
          <div
            key={name}
            className="flex h-[74px] items-center justify-center border border-[#202020] bg-white text-[14px]"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <span className="flex items-center justify-center gap-1.5 rounded-[4px] bg-[#E8F0FA] px-2 py-2 text-[13px] font-semibold text-[#234D7D]">
          <span aria-hidden>○</span> Low
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-[4px] bg-[#A8C5EB] px-2 py-2 text-[13px] font-semibold text-[#34649C]">
          <span aria-hidden>≡</span> Medium
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-[4px] bg-[#234D7D] px-2 py-2 text-[13px] font-semibold text-white">
          <span aria-hidden>▲</span> High
        </span>
      </div>
    </div>
  )
}

/** Amber-style line illustration for slides 2 and 3. */
function AmberIllustration({ kind }: { kind: 'queue' | 'group' }) {
  return (
    <div className="border-2 border-[#111111] bg-white p-5">
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

function Dots({ index, count, amber }: { index: number; count: number; amber: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 py-5" aria-hidden>
      {Array.from({ length: count }, (_, i) =>
        amber ? (
          <span
            key={i}
            className={`h-3 rounded-full border-2 border-[#111111] transition-all ${
              i === index ? 'w-7 bg-[#F9B800]' : 'w-3 bg-transparent'
            }`}
          />
        ) : (
          <span
            key={i}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-7 bg-[#202020]' : 'w-2.5 bg-[#DDDDDD]'
            }`}
          />
        ),
      )}
    </div>
  )
}

export function Onboarding() {
  const navigate = useNavigate()
  const { update } = useStore()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const amber = slide.theme === 'amber'

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
    <DeviceFrame nav={false} theme={slide.theme} statusVariant={amber ? 'amber' : 'mono'}>
      {amber ? (
        /* ---- amber slides ---- */
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-4">
          <div className="flex items-start justify-between">
            <ScreenHeader title="" variant="display" onBack={() => (index > 0 ? setIndex(index - 1) : navigate('/'))} />
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
            <AmberIllustration kind={slide.id === 'b' ? 'queue' : 'group'} />
          </div>

          <Dots index={index} count={SLIDES.length} amber />

          <div className="flex-1" />

          <Button variant="amberSplit" onClick={next}>
            {slide.cta}
          </Button>
        </div>
      ) : (
        /* ---- mono slide 1 ---- */
        <>
          <ScreenHeader
            title=""
            onBack={() => navigate('/')}
            right={
              <button
                type="button"
                onClick={skip}
                className="text-[15px] underline underline-offset-4"
              >
                Skip
              </button>
            }
          />
          <Content className="flex flex-col">
            <h1 className="text-[24px] leading-[29px] font-semibold">{slide.title}</h1>

            <div className="mt-3 flex items-center justify-between text-[14px]">
              <span className="text-[#616161]">1 of 3 · Crowd information</span>
            </div>

            <div className="mt-4">
              <CrowdExample />
            </div>

            <div className="mt-5">
              <h2 className="text-[18px] leading-[23px] font-semibold">
                A little information. A calmer journey.
              </h2>
              <p className="mt-2 text-[16px] leading-[24px] text-[#616161]">{slide.body}</p>
            </div>

            <Dots index={index} count={SLIDES.length} amber={false} />

            <p className="text-center text-[14px] text-[#616161]">
              Up next: boarding queue → safety support
            </p>

            <div className="flex-1" />

            <div className="pb-2">
              <Button onClick={next}>{slide.cta}</Button>
            </div>
          </Content>
        </>
      )}
    </DeviceFrame>
  )
}
