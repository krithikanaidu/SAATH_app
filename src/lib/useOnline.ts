import { useEffect, useState } from 'react'

/**
 * Tracks real connectivity. Offline screens appear when the device actually
 * loses its connection; `?state=offline` can still force them for review.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return online
}

/** Reads `?state=` from the current URL (documented, deep-linkable states). */
export function urlState(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('state')
}
