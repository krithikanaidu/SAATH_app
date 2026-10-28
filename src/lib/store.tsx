import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppState } from './types'

const STORAGE_KEY = 'saath.state.v1'

/** Initial state mirrors a fresh first launch (pre-onboarding). */
const DEFAULT_STATE: AppState = {
  language: 'en',
  name: 'Asha',
  onboarded: false,
  signedIn: false,
  phone: '',
  otpVerified: false,
  locationAllowed: false,
  largeText: false,
  shareLocationOnSos: true,
  usualLine: 'Western line',
  fromStation: 'Borivali',
  toStation: 'Churchgate',
  departureTime: '08:30 AM · Weekdays',
  travelAs: null,
  points: 140,
  joinedGroupIds: ['western-morning-buddies'],
  customGroups: [],
  crowdReports: [],
  chosenDeparture: '08:30',
  slotBooked: false,
  slotZone: 'B',
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) }
  } catch {
    return DEFAULT_STATE
  }
}

interface StoreValue {
  state: AppState
  update: (patch: Partial<AppState>) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load())

  // persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage may be unavailable (private mode) — state stays in memory */
    }
  }, [state])

  const update = useCallback((patch: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setState(DEFAULT_STATE)
  }, [])

  const value = useMemo(() => ({ state, update, reset }), [state, update, reset])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
