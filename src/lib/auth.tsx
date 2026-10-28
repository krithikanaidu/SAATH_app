import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, withTimeout } from './supabase'
import {
  fetchProfile,
  saveProfile,
  profileToState,
  parseDeparture,
  pingBackend,
  type Profile,
} from './db'
import { useStore } from './store'

/**
 * How long a verification attempt may take before we give up and fall back to
 * a local session. Long enough for a healthy SMS round-trip, short enough that
 * an unreachable project never hangs the flow.
 */
const VERIFY_TIMEOUT_MS = 6000

/**
 * Authentication.
 *
 * With Supabase configured, sign-in is real phone OTP:
 *   sendOtp(phone)  → SMS with a code
 *   verifyOtp(code) → session
 *
 * Without Supabase (unconfigured, offline, or the project is unreachable) the
 * provider falls back to a local demo session so the prototype never dead-ends.
 * `mode` tells the UI which path it is on, and the sign-in screen surfaces it.
 */

export type AuthMode = 'supabase' | 'demo'

interface AuthValue {
  mode: AuthMode
  session: Session | null
  user: User | null
  profile: Profile | null
  /** true while the initial session check is in flight */
  loading: boolean
  phone: string
  /** request an SMS code; resolves true when the code was sent */
  sendOtp: (phone: string) => Promise<{ ok: boolean; error?: string }>
  /** verify the code and establish a session */
  verifyOtp: (code: string) => Promise<{ ok: boolean; error?: string }>
  /** demo-mode sign in, used when Supabase is unavailable */
  signInDemo: (phone: string) => void
  signOut: () => Promise<void>
  /** push a local profile patch to the backend (no-op in demo mode) */
  syncProfile: (patch: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Normalise user input to E.164 for India. Accepts "98765 43210" or "+91...". */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (raw.trim().startsWith('+')) return `+${digits}`
  return `+${digits}`
}

/**
 * True for errors that mean "we could not reach the backend" rather than
 * "the request was rejected". The former should degrade to a local session;
 * the latter must be surfaced to the user.
 */
function isUnreachable(message: string | undefined): boolean {
  if (!message) return true
  const m = message.toLowerCase()
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('load failed') ||
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('enotfound') ||
    m.includes('econnrefused') ||
    m.includes('econnreset') ||
    m.includes('getaddrinfo') ||
    m.includes('fetch failed') ||
    m.includes('unexpected end of input')
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { update } = useStore()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [demoPhone, setDemoPhone] = useState<string | null>(null)

  const mode: AuthMode = isSupabaseConfigured ? 'supabase' : 'demo'

  /* ---- restore session (supabase) or accept a local demo session ---- */
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false)
        return
      }
      try {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setSession(data.session)
        if (data.session) {
          const res = await fetchProfile()
          if (!cancelled && res.data) {
            setProfile(res.data)
            update(profileToState(res.data))
          }
        }
      } catch {
        /* unreachable — the app keeps working on local state */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void init()

    if (!isSupabaseConfigured || !supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) setProfile(null)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [update])

  const sendOtp = useCallback(async (raw: string) => {
    const e164 = normalisePhone(raw)
    if (!e164 || e164.replace(/\D/g, '').length < 10) {
      return { ok: false, error: 'Enter a valid 10-digit mobile number.' }
    }
    // probe the backend first — if it is unreachable, skip the doomed network
    // call entirely so the flow never hangs waiting on it
    if (!isSupabaseConfigured || !supabase || !(await pingBackend())) {
      setPhone(e164)
      setDemoPhone(e164)
      return { ok: true }
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: { channel: 'sms' },
      })
      if (error) {
        // an unreachable/network-style error should not dead-end the prototype —
        // fall back to the local demo session so the flow can continue
        if (isUnreachable(error.message)) {
          setPhone(e164)
          setDemoPhone(e164)
          return { ok: true }
        }
        return { ok: false, error: error.message }
      }
      setPhone(e164)
      return { ok: true }
    } catch {
      // network failure reaching Supabase — degrade to demo mode
      setPhone(e164)
      setDemoPhone(e164)
      return { ok: true }
    }
  }, [])

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!phone) return { ok: false, error: 'Request a code first.' }
      const digits = code.replace(/\D/g, '')
      if (digits.length < 4) return { ok: false, error: 'Enter the code we sent you.' }

      // no backend, or we already fell back to a local session on send
      if (!isSupabaseConfigured || !supabase || demoPhone) {
        setDemoPhone(phone)
        return { ok: true }
      }
      try {
        // race the real verification against a hard timeout so a slow or
        // unreachable project cannot hang the flow
        const { data, error } = await withTimeout(
          supabase.auth.verifyOtp({ phone, token: digits, type: 'sms' }),
          VERIFY_TIMEOUT_MS,
        )
        if (error) {
          if (isUnreachable(error.message)) {
            setDemoPhone(phone)
            return { ok: true }
          }
          return { ok: false, error: error.message }
        }
        if (!data.session) return { ok: false, error: 'That code did not work. Try again.' }
        setSession(data.session)
        // load the profile created by the DB trigger
        const res = await fetchProfile()
        if (res.data) {
          setProfile(res.data)
          update(profileToState(res.data))
        }
        return { ok: true }
      } catch {
        // timeout or network failure reaching Supabase — degrade to demo mode
        setDemoPhone(phone)
        return { ok: true }
      }
    },
    [phone, demoPhone, update],
  )

  const signInDemo = useCallback(
    (raw: string) => {
      setPhone(raw)
      setDemoPhone(raw)
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut()
      } catch {
        /* ignore — clear local state regardless */
      }
    }
    setSession(null)
    setProfile(null)
    setDemoPhone(null)
  }, [])

  const syncProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!isSupabaseConfigured || !supabase) return
    const res = await saveProfile(patch)
    if (res.data) setProfile(prev => ({ ...(prev as Profile), ...res.data }))
  }, [])

  // In demo mode there is no Supabase user, but the app still needs a profile
  // object so the rest of the UI can treat both modes uniformly.
  const effectiveUser = session?.user ?? null
  const effectiveProfile = profile

  const value = useMemo<AuthValue>(
    () => ({
      mode: demoPhone && !session ? 'demo' : mode,
      session,
      user: effectiveUser,
      profile: effectiveProfile,
      loading,
      phone,
      sendOtp,
      verifyOtp,
      signInDemo,
      signOut,
      syncProfile,
    }),
    [
      demoPhone,
      session,
      mode,
      effectiveUser,
      effectiveProfile,
      loading,
      phone,
      sendOtp,
      verifyOtp,
      signInDemo,
      signOut,
      syncProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { parseDeparture, pingBackend }
