import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { Field, TextInput } from '../components/forms'
import { useStore } from '../lib/store'

/**
 * S03 — phone sign-in.
 *  step "phone"   → S03a (mono): number + 6-digit OTP
 *  step "verify"  → S03b (amber): 4-digit confirm + resend countdown
 *  step "location"→ S03c (amber): location permission
 */

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

export function SignUp() {
  const navigate = useNavigate()
  const { state, update } = useStore()

  const [step, setStep] = useState<'phone' | 'verify' | 'location'>('phone')
  const [phone, setPhone] = useState(state.phone || '98765 43210')
  const [otp, setOtp] = useState('')
  const [otp4, setOtp4] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // resend countdown
  useEffect(() => {
    if (step !== 'phone' || countdown <= 0) return
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [step, countdown])

  const sendCode = () => {
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter a 10-digit mobile number.')
      return
    }
    setError(null)
    setSending(true)
    // mock send — a real backend would call the SMS provider here
    setTimeout(() => {
      setSending(false)
      setCountdown(RESEND_SECONDS)
      otpRefs.current[0]?.focus()
    }, 700)
  }

  const setOtpDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1)
    const next = otp.split('')
    next[i] = digit
    const joined = next.join('').slice(0, OTP_LENGTH)
    setOtp(joined)
    setError(null)
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus()
  }

  const verifyPhone = () => {
    if (otp.replace(/\s/g, '').length < OTP_LENGTH) {
      setError('Enter the 6-digit code.')
      return
    }
    update({ phone, otpVerified: true, signedIn: true })
    setStep('verify')
  }

  /* ---------- amber verify step (S03b) ---------- */
  const [resend4, setResend4] = useState(25)
  useEffect(() => {
    if (step !== 'verify' || resend4 <= 0) return
    const t = setInterval(() => setResend4(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [step, resend4])

  if (step === 'verify') {
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => setStep('phone')}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold"
            >
              ←
            </button>
            {/* 3-dot stepper: step 1 active */}
            <div className="mt-5 flex flex-1 items-center gap-2" aria-hidden>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-white" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-white" />
            </div>
          </div>

          <h1 className="mt-4 font-display text-[40px] leading-[44px] tracking-wide uppercase">
            Verify your number
          </h1>
          <p className="mt-2 text-[16px] text-[#5A5750]">Code sent to +91 {phone}</p>

          {/* illustration */}
          <div className="mt-6 border-2 border-[#111111] bg-white p-6">
            <svg viewBox="0 0 300 120" className="w-full" aria-hidden>
              <rect x="60" y="10" width="180" height="100" fill="none" stroke="#111111" strokeWidth="3" />
              <rect x="125" y="30" width="50" height="64" rx="6" fill="none" stroke="#111111" strokeWidth="3" />
              <rect x="133" y="42" width="34" height="34" fill="#F9B800" stroke="#111111" strokeWidth="3" />
              <path d="M140 58 l6 6 12 -14" fill="none" stroke="#111111" strokeWidth="3" />
            </svg>
          </div>

          {/* 4-digit OTP */}
          <div className="mt-6 flex gap-3" role="group" aria-label="4-digit verification code">
            {['2', '4', '7', '9'].map((_prefill, i) => (
              <input
                key={i}
                aria-label={`Digit ${i + 1}`}
                inputMode="numeric"
                maxLength={1}
                value={otp4[i] ?? ''}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(-1)
                  const arr = otp4.split('')
                  arr[i] = v
                  setOtp4(arr.join(''))
                  if (v && i < 3) {
                    const inputs = document.querySelectorAll<HTMLInputElement>('[aria-label^="Digit"]')
                    inputs[i + 1]?.focus()
                  }
                }}
                className="h-16 w-full max-w-[70px] border-2 border-[#111111] bg-white text-center font-display text-[36px] outline-none focus:bg-[#FFF1C2]"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[14px]">
            <span className="text-[#5A5750]">Didn&apos;t receive the code?</span>
            <button
              type="button"
              disabled={resend4 > 0}
              onClick={() => setResend4(25)}
              className="font-bold text-[#D92D20] underline underline-offset-4 disabled:text-[#5A5750] disabled:no-underline"
            >
              {resend4 > 0 ? `RESEND (00:${String(resend4).padStart(2, '0')})` : 'RESEND'}
            </button>
          </div>

          <div className="flex-1" />

          <Button variant="amberSplit" onClick={() => setStep('location')}>
            Verify and continue
          </Button>
        </div>
      </DeviceFrame>
    )
  }

  /* ---------- amber location step (S03c) ---------- */
  if (step === 'location') {
    const benefits = [
      { icon: '◎', label: 'Detect your nearest station' },
      { icon: '⌐', label: 'Accurate platform guidance' },
      { icon: '⬡', label: 'Faster help in an emergency' },
    ]
    return (
      <DeviceFrame nav={false} theme="amber" statusVariant="amber">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-1 pb-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => setStep('verify')}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111111] bg-white text-[22px] font-bold"
            >
              ←
            </button>
            <div className="mt-5 flex flex-1 items-center gap-2" aria-hidden>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-[#F9B800]" />
              <span className="h-0.5 flex-1 bg-[#111111]" />
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#111111] bg-white" />
            </div>
          </div>

          <h1 className="mt-4 font-display text-[40px] leading-[44px] tracking-wide uppercase">
            Location access
          </h1>
          <p className="mt-2 text-[16px] leading-[24px] text-[#5A5750]">
            Used only to find your station and share location during SOS.
          </p>

          <div className="mt-5 border-2 border-[#111111] bg-white p-5">
            <svg viewBox="0 0 300 140" className="w-full" aria-hidden>
              <path
                d="M150 20 c-24 0 -42 18 -42 40 0 30 42 60 42 60 s42 -30 42 -60 c0 -22 -18 -40 -42 -40z"
                fill="none"
                stroke="#111111"
                strokeWidth="3"
              />
              <circle cx="150" cy="58" r="14" fill="#F9B800" stroke="#111111" strokeWidth="3" />
              <rect x="70" y="112" width="160" height="24" fill="none" stroke="#111111" strokeWidth="3" />
              <line x1="130" y1="112" x2="130" y2="136" stroke="#111111" strokeWidth="3" />
              <line x1="70" y1="124" x2="230" y2="124" stroke="#111111" strokeWidth="3" />
            </svg>
          </div>

          <ul className="mt-4 space-y-3">
            {benefits.map(b => (
              <li
                key={b.label}
                className="flex items-center gap-3 border-2 border-[#111111] bg-white px-4 py-3.5 text-[16px] font-bold"
              >
                <span aria-hidden className="text-[20px]">
                  {b.icon}
                </span>
                {b.label}
              </li>
            ))}
          </ul>

          <div className="flex-1" />

          <Button
            variant="amberSplit"
            onClick={() => {
              update({ locationAllowed: true })
              navigate('/setup')
            }}
          >
            Allow location
          </Button>
          <button
            type="button"
            onClick={() => {
              update({ locationAllowed: false })
              navigate('/setup')
            }}
            className="mx-auto mt-4 text-[15px] font-bold underline underline-offset-4"
          >
            NOT NOW
          </button>
        </div>
      </DeviceFrame>
    )
  }

  /* ---------- mono phone step (S03a) ---------- */
  return (
    <DeviceFrame nav={false}>
      <ScreenHeader title="" onBack={() => navigate('/onboarding')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">Your phone. Your account.</h1>
        <p className="mt-3 text-[16px] leading-[24px] text-[#616161]">
          New here or coming back? Use a one-time code to continue. No password needed.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Mobile number" htmlFor="phone">
            <TextInput
              id="phone"
              inputMode="tel"
              maxLength={12}
              value={phone}
              onChange={v => {
                setPhone(v)
                setError(null)
              }}
              error={error ?? undefined}
              aria-label="Mobile number"
            />
          </Field>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setPhone('')}>
              Edit number
            </Button>
            <Button variant="ghost" onClick={sendCode} disabled={sending}>
              {sending ? 'Sending…' : 'Send code'}
            </Button>
          </div>

          <Field
            label="6-digit OTP"
            hint={
              <>
                Example code shown. Sent to ••••••{phone.slice(-4)}.
                <br />
                {countdown > 0 ? `Resend available in 00:${String(countdown).padStart(2, '0')}.` : 'You can resend now.'}
              </>
            }
          >
            <div className="flex gap-2" role="group" aria-label="6-digit OTP">
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <input
                  key={i}
                  ref={el => {
                    otpRefs.current[i] = el
                  }}
                  aria-label={`OTP digit ${i + 1}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] ?? ''}
                  onChange={e => setOtpDigit(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
                  }}
                  className="h-14 w-full border border-[#DDDDDD] bg-white text-center text-[18px] outline-none focus:border-[#202020]"
                />
              ))}
            </div>
          </Field>

          {/* location opt-in */}
          <div className="rounded-[8px] border border-[#DDDDDD] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={state.locationAllowed}
                onChange={e => update({ locationAllowed: e.target.checked })}
                className="mt-0.5 h-6 w-6 shrink-0 accent-[#202020]"
              />
              <span className="text-[16px] font-medium">Allow location access (optional)</span>
            </label>
            <p className="mt-2 pl-9 text-[14px] leading-[20px] text-[#616161]">
              Suggest nearby stations. Share live location with trusted contacts only when you choose.
            </p>
          </div>

          <p className="text-[12px] leading-[17px] text-[#616161]">
            By continuing, you agree to the Terms and Privacy Policy. You can use Saath without
            location access.
          </p>
        </div>

        <div className="flex-1" />

        <div className="pb-2">
          <Button onClick={verifyPhone}>Verify &amp; continue</Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
