import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client.
 *
 * Both values are safe to expose in the browser — a "publishable" (anon) key is
 * designed for client use and is gated by Row Level Security on the server.
 * No service-role key or secret is ever shipped to the client.
 *
 * The app must keep working when Supabase is unreachable or unconfigured, so
 * every consumer goes through `src/lib/db.ts`, which falls back to the local
 * mock store. Nothing outside this module should import `supabase` directly.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/** true when both env values are present — does not imply the project is reachable */
export const isSupabaseConfigured = Boolean(url && key)

/**
 * Number of digits in the SMS code.
 *
 * Supabase's default is 6. The Figma design shows 4, which also works if you set
 * Dashboard → Authentication → Providers → Phone → OTP Length to 4 and add
 * `VITE_OTP_LENGTH=4` to `.env.local`. Keep the two in sync or verification fails.
 */
export const OTP_LENGTH = Number(import.meta.env.VITE_OTP_LENGTH ?? 6) || 6

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * How long a Supabase call may take before we give up and use local state.
 * Keeps the UI responsive when the network or the project is unavailable.
 */
export const DB_TIMEOUT_MS = 6000

/** Wraps a Supabase promise so a slow/unreachable project cannot hang the UI. */
export async function withTimeout<T>(promise: PromiseLike<T>, ms = DB_TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`supabase timeout after ${ms}ms`)), ms),
    ),
  ])
}
