/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://xyz.supabase.co */
  readonly VITE_SUPABASE_URL?: string
  /** Publishable (anon) key — safe for the browser, gated by RLS */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Legacy alias accepted by the client */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Digits in the SMS code — must match the Supabase auth OTP length (default 6) */
  readonly VITE_OTP_LENGTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
