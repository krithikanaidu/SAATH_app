import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { OtpInput } from '../components/forms'
import { SplitButton } from '../components/amber'
import { useStore } from '../lib/store'

/**
 * S03a / S03b / S03c — sign-up flow.
 *
 *   phone (10 digits) → SEND CODE → verify (4-digit OTP) → location
 *
 * The phone step only collects the number; the code is entered once, on the
 * verify step. `/signup?state=error` seeds the "Check your number" error band.
 */

function AmberLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[20px] tracking-[0.04em] text-[#111111]">{children}</p>
  )
}

export function SignUp() {
  const [step, setStep] = useState<'phone' | 'verify' | 'location'>('phone')
  const seededError = new URLSearchParams(window.location.search).get('state') === 'error'
  const [digits, setDigits] = useState('')

  if (step === 'verify') return <VerifyStep onDone={() => setStep('location')} />
  if (step === 'location') return <LocationStep />

  const onlyDigits = digits.replace(/\D/g, '')
  const digitsValid = /^\d{10}$/.test(onlyDigits)
  const showError = seededError && !digitsValid

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-5">
        <p className="font-display text-[22px] tracking-[0.04em]">STEP 1 OF 3</p>
        <div className="mt-2 flex gap-2" aria-hidden>
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-white" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-white" />
        </div>

        <h1 className="mt-4 font-display text-[40px] leading-[42px] tracking-wide">
          YOUR PHONE. YOUR ACCOUNT.
        </h1>
        <p className="mt-3 text-[16px] leading-[22px] text-[#5A5750]">
          Enter your mobile number to get started with Saath.
        </p>

        {showError ? (
          <div
            role="alert"
            className="mt-4 border-[3px] border-[#111111] bg-[#FFE9E6] p-3 shadow-[4px_4px_0_0_#111111]"
          >
            <p className="font-display text-[20px] tracking-[0.04em] text-[#C81D25]">
              CHECK YOUR NUMBER
            </p>
            <p className="mt-1 text-[13px] leading-[17px] text-[#111111]">
              Enter a 10-digit mobile number, then try again.
            </p>
          </div>
        ) : null}

        <div className="mt-5">
          <AmberLabel>MOBILE NUMBER</AmberLabel>
          <div className="mt-2 flex items-stretch border-[3px] border-[#111111] bg-white focus-within:bg-[#FFF6D6]">
            <span className="flex items-center border-r-[3px] border-[#111111] px-3 font-display text-[22px]">
              +91
            </span>
            <input
              id="phone-amber"
              autoFocus
              inputMode="numeric"
              placeholder="98765 43210"
              aria-label="Mobile number"
              aria-invalid={digitsValid ? undefined : true}
              value={digits}
              onChange={e => setDigits(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[22px] tracking-[0.06em] outline-none"
            />
          </div>
          <p className="mt-2 text-[12px] leading-[16px] text-[#5A5750]">
            We&apos;ll send a 4-digit code by SMS. Standard rates may apply.
          </p>
        </div>

        <div className="flex-1" />

        <SplitButton disabled={!digitsValid} onClick={() => setStep('verify')}>
          SEND CODE
        </SplitButton>

        <p className="mt-3 text-center text-[12px] leading-[17px] text-[#5A5750]">
          By continuing you agree to Saath&apos;s terms. Crowd reports are community
          contributions, not live railway data.
        </p>
      </div>
    </DeviceFrame>
  )
}

/** S03b — SMS verification. */
function VerifyStep({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('')
  const { update } = useStore()
  const complete = code.length === 4

  const submit = () => {
    if (!complete) return
    // prototype: any 4-digit code is accepted; a real SMS OTP check is backend work
    update({ signedIn: true })
    onDone()
  }

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-5">
        <p className="font-display text-[22px] tracking-[0.04em]">STEP 2 OF 3</p>
        <div className="mt-2 flex gap-2" aria-hidden>
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-white" />
        </div>

        <h1 className="mt-4 font-display text-[40px] leading-[42px] tracking-wide">
          VERIFY YOUR NUMBER
        </h1>
        <p className="mt-3 text-[16px] leading-[22px] text-[#5A5750]">
          Enter the code sent to your phone number to continue.
        </p>

        <div className="mt-5">
          <AmberLabel>4-DIGIT CODE</AmberLabel>
          <div className="mt-2">
            <OtpInput length={4} onChange={setCode} />
          </div>
        </div>

        <div className="flex-1" />

        <Button variant="amber" onClick={submit} disabled={!complete}>
          Verify and continue
        </Button>

        <button
          type="button"
          onClick={submit}
          className="mt-3 text-center text-[14px] font-bold tracking-wide underline underline-offset-4"
        >
          RESEND CODE
        </button>
      </div>
    </DeviceFrame>
  )
}

/** S03c — location permission. */
function LocationStep() {
  const navigate = useNavigate()
  const { update } = useStore()

  const enable = () => {
    update({ locationAllowed: true })
    navigate('/setup')
  }

  const skip = () => {
    update({ locationAllowed: false })
    navigate('/setup')
  }

  return (
    <DeviceFrame nav={false} theme="amber">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-5">
        <p className="font-display text-[22px] tracking-[0.04em]">STEP 3 OF 3</p>
        <div className="mt-2 flex gap-2" aria-hidden>
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
          <span className="h-3 flex-1 border-[3px] border-[#111111] bg-[#F9B800]" />
        </div>

        <div className="mt-6 flex justify-center">
          <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" role="img" aria-hidden>
            <rect x="12" y="12" width="136" height="136" fill="#FAF8F4" stroke="#111111" strokeWidth="3" />
            {[46, 80, 114].map(x =>
              [46, 80, 114].map(y => (
                <rect key={`${x}-${y}`} x={x} y={y} width="34" height="34" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
              )),
            )}
            <path d="M20 66 h120 M20 100 h120 M66 20 v120 M100 20 v120" stroke="#111111" strokeWidth="3" />
            <circle cx="80" cy="80" r="26" fill="#F9B800" stroke="#111111" strokeWidth="3" />
            <circle cx="80" cy="80" r="9" fill="#111111" />
          </svg>
        </div>

        <h1 className="mt-4 font-display text-[40px] leading-[44px] tracking-wide uppercase">
          Location access
        </h1>
        <p className="mt-3 text-[16px] leading-[22px] text-[#5A5750]">
          Used only to find your station and share location during SOS.
        </p>

        <ul className="mt-4 space-y-3">
          {[
            'Detect your nearest station',
            'See crowd reports relevant to where you are',
            'Share your live location during an SOS',
          ].map(t => (
            <li key={t} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-[3px] h-4 w-4 shrink-0 border-[3px] border-[#111111] bg-[#F9B800]"
              />
              <span className="text-[15px] leading-[21px] text-[#111111]">{t}</span>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        <Button variant="amberSplit" onClick={enable}>
          Allow location
        </Button>

        <button
          type="button"
          onClick={skip}
          className="mx-auto mt-4 text-[15px] font-bold underline underline-offset-4"
        >
          NOT NOW
        </button>
      </div>
    </DeviceFrame>
  )
}
