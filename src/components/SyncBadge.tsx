import type { Source } from '../lib/db'

/**
 * Small status line telling the user whether the data on screen came from the
 * live backend or is being served from the local store.
 *
 *  · "Live · synced"      — Supabase answered; data is real and current
 *  · "Saved on this device" — backend unreachable/unconfigured; local fallback
 *  · "Syncing…"           — first load in flight
 *
 * Kept deliberately quiet (small, muted) so it reads as a status hint rather
 * than an alert, and it never blocks the UI.
 */
export function SyncBadge({
  source,
  loading,
  label,
}: {
  source: Source
  loading?: boolean
  /** optional override, e.g. "3 groups" */
  label?: string
}) {
  if (loading) {
    return (
      <p className="mt-3 flex items-center gap-2 text-[12px] leading-[16px] text-[#8A8578]">
        <span
          aria-hidden
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#F9B800]"
        />
        Syncing…
      </p>
    )
  }

  const live = source === 'remote'

  return (
    <p className="mt-3 flex items-center gap-2 text-[12px] leading-[16px] text-[#8A8578]">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${live ? 'bg-[#1B7F4B]' : 'bg-[#B8B1A4]'}`}
      />
      {live ? 'Live · synced' : 'Saved on this device'}
      {label ? <span aria-hidden>· {label}</span> : null}
    </p>
  )
}
