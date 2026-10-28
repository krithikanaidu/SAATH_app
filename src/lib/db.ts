import { supabase, withTimeout, isSupabaseConfigured } from './supabase'
import type { AppState, BuddyGroup, CrowdLevel, CrowdReport, Trip } from './types'

/**
 * Data access layer.
 *
 * Every function tries Supabase first and falls back to the local mock store,
 * so the prototype keeps working when the project is unconfigured, offline or
 * unreachable. Callers never talk to `supabase` directly.
 *
 * Each result carries `source` so the UI can show whether data is live or
 * local-only — see `SyncBadge`.
 */

export type Source = 'remote' | 'local'

export interface DbResult<T> {
  data: T
  source: Source
}

/** True when Supabase is configured AND answered a real network round-trip. */
let reachable: boolean | null = null

/**
 * Probe the backend with an actual HTTP round-trip.
 *
 * `auth.getSession()` reads from local storage and never touches the network,
 * so it cannot tell a live project from an unreachable one. This hits the REST
 * root (which requires the apikey header the client always sends) and caches
 * the answer so the UI only pays for one failed request.
 */
export async function pingBackend(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    reachable = false
    return false
  }
  if (reachable !== null) return reachable
  try {
    const res = await withTimeout(
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
          // a HEAD-style probe: any HTTP status means the host answered
          Accept: 'application/openapi+json',
        },
      }),
      4000,
    )
    // any HTTP response (even 401/404) means the project is reachable
    reachable = res.status > 0
  } catch {
    reachable = false
  }
  return reachable
}

/** Reset the cached reachability probe (used by the settings sheet / tests). */
export function resetBackendProbe() {
  reachable = null
}

/* ------------------------------------------------------------------ profile */

export interface Profile {
  id: string
  phone: string | null
  name: string
  language: 'en' | 'hi' | 'mr'
  usualLine: string
  fromStation: string
  toStation: string
  departureTime: string
  travelAs: string | null
  largeText: boolean
  shareLocationOnSos: boolean
  locationAllowed: boolean
  onboarded: boolean
  points: number
}

/** Map a Supabase row (snake_case) onto the client Profile shape. */
function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    phone: (row.phone as string | null) ?? null,
    name: (row.name as string) ?? 'Commuter',
    language: (row.language as Profile['language']) ?? 'en',
    usualLine: (row.usual_line as string) ?? 'Western line',
    fromStation: (row.from_station as string) ?? 'Borivali',
    toStation: (row.to_station as string) ?? 'Churchgate',
    departureTime: (row.departure_time as string) ?? '08:30',
    travelAs: (row.travel_as as string | null) ?? null,
    largeText: Boolean(row.large_text),
    shareLocationOnSos: row.share_location_on_sos !== false,
    locationAllowed: Boolean(row.location_allowed),
    onboarded: Boolean(row.onboarded),
    points: Number(row.points ?? 0),
  }
}

/** Build a partial update payload from a client-side patch. */
function patchToColumns(patch: Partial<Profile>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const map: Record<string, string> = {
    name: 'name',
    language: 'language',
    usualLine: 'usual_line',
    fromStation: 'from_station',
    toStation: 'to_station',
    departureTime: 'departure_time',
    travelAs: 'travel_as',
    largeText: 'large_text',
    shareLocationOnSos: 'share_location_on_sos',
    locationAllowed: 'location_allowed',
    onboarded: 'onboarded',
    points: 'points',
  }
  for (const [k, col] of Object.entries(map)) {
    if (k in patch) out[col] = (patch as Record<string, unknown>)[k]
  }
  return out
}

/** Fetch the signed-in user's profile row. Returns null when signed out. */
export async function fetchProfile(): Promise<DbResult<Profile | null>> {
  if (!(await pingBackend())) return { data: null, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: null, source: 'local' }

    const { data, error } = await withTimeout(
      supabase!.from('profiles').select('*').eq('id', uid).single(),
    )
    if (error) throw error
    return { data: rowToProfile(data as Record<string, unknown>), source: 'remote' }
  } catch {
    return { data: null, source: 'local' }
  }
}

/** Patch the signed-in user's profile. Returns the updated row when possible. */
export async function saveProfile(
  patch: Partial<Profile>,
): Promise<DbResult<Partial<Profile> | null>> {
  if (!(await pingBackend())) return { data: null, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: null, source: 'local' }

    const { data, error } = await withTimeout(
      supabase!
        .from('profiles')
        .update({ ...patchToColumns(patch), updated_at: new Date().toISOString() })
        .eq('id', uid)
        .select()
        .single(),
    )
    if (error) throw error
    return { data: rowToProfile(data as Record<string, unknown>), source: 'remote' }
  } catch {
    return { data: null, source: 'local' }
  }
}

/* -------------------------------------------------------------------- groups */

function rowToGroup(row: Record<string, unknown>, memberCount?: number): BuddyGroup {
  const members =
    typeof row.member_count === 'number'
      ? row.member_count
      : typeof memberCount === 'number'
        ? memberCount
        : 1
  return {
    id: String(row.id),
    name: String(row.name),
    from: String(row.from_station),
    to: String(row.to_station),
    window: String(row.window ?? '08:15–08:45'),
    members,
    line: String(row.line),
    verifiedOrganiser: Boolean(row.verified_organiser),
    joined: false,
  }
}

/**
 * List groups. Signed-in users get every group plus a flag for whether they are
 * a member; this replaces the old hardcoded BUDDY_GROUPS list.
 */
export async function fetchGroups(): Promise<DbResult<BuddyGroup[]>> {
  if (!(await pingBackend())) return { data: [], source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: [], source: 'local' }

    // One query for all groups, one for the caller's memberships.
    const [groupsRes, membersRes] = await Promise.all([
      withTimeout(supabase!.from('buddy_groups').select('*').order('created_at', { ascending: false })),
      withTimeout(supabase!.from('group_members').select('group_id').eq('user_id', uid)),
    ])
    if (groupsRes.error) throw groupsRes.error

    const joined = new Set((membersRes.data ?? []).map((r: { group_id: string }) => r.group_id))
    const groups = ((groupsRes.data ?? []) as Record<string, unknown>[]).map(r => {
      const g = rowToGroup(r)
      return { ...g, joined: joined.has(g.id) }
    })
    return { data: groups, source: 'remote' }
  } catch {
    return { data: [], source: 'local' }
  }
}

export async function createGroup(input: {
  name: string
  line: string
  from: string
  to: string
  window: string
}): Promise<DbResult<BuddyGroup | null>> {
  if (!(await pingBackend())) return { data: null, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: null, source: 'local' }

    const { data, error } = await withTimeout(
      supabase!
        .from('buddy_groups')
        .insert({
          name: input.name,
          line: input.line,
          from_station: input.from,
          to_station: input.to,
          window: input.window,
          organiser_id: uid,
          verified_organiser: true,
        })
        .select()
        .single(),
    )
    if (error) throw error

    // the organiser is automatically a member
    await withTimeout(
      supabase!.from('group_members').insert({
        group_id: data.id,
        user_id: uid,
        role: 'organiser',
      }),
    )

    return { data: { ...rowToGroup(data as Record<string, unknown>), joined: true }, source: 'remote' }
  } catch {
    return { data: null, source: 'local' }
  }
}

export async function deleteGroup(id: string): Promise<DbResult<boolean>> {
  if (!(await pingBackend())) return { data: false, source: 'local' }
  try {
    const { error } = await withTimeout(supabase!.from('buddy_groups').delete().eq('id', id))
    if (error) throw error
    return { data: true, source: 'remote' }
  } catch {
    return { data: false, source: 'local' }
  }
}

export async function joinGroup(id: string): Promise<DbResult<boolean>> {
  if (!(await pingBackend())) return { data: false, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: false, source: 'local' }

    const { error } = await withTimeout(
      supabase!.from('group_members').upsert(
        { group_id: id, user_id: uid, role: 'member' },
        { onConflict: 'group_id,user_id' },
      ),
    )
    if (error) throw error
    return { data: true, source: 'remote' }
  } catch {
    return { data: false, source: 'local' }
  }
}

export async function leaveGroup(id: string): Promise<DbResult<boolean>> {
  if (!(await pingBackend())) return { data: false, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: false, source: 'local' }

    const { error } = await withTimeout(
      supabase!.from('group_members').delete().eq('group_id', id).eq('user_id', uid),
    )
    if (error) throw error
    return { data: true, source: 'remote' }
  } catch {
    return { data: false, source: 'local' }
  }
}

/* ------------------------------------------------------------- crowd reports */

export async function addCrowdReport(input: {
  trainId: string
  compartment: CrowdReport['compartment']
  level: CrowdLevel
}): Promise<DbResult<boolean>> {
  if (!(await pingBackend())) return { data: false, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: false, source: 'local' }

    const { error } = await withTimeout(
      supabase!.from('crowd_reports').insert({
        user_id: uid,
        train_id: input.trainId,
        compartment: input.compartment,
        level: input.level,
      }),
    )
    if (error) throw error
    return { data: true, source: 'remote' }
  } catch {
    return { data: false, source: 'local' }
  }
}

/** Recent crowd reports for a train — drives the live-ish coach crowd. */
export async function fetchCrowdReports(trainId: string): Promise<DbResult<CrowdReport[]>> {
  if (!(await pingBackend())) return { data: [], source: 'local' }
  try {
    const { data, error } = await withTimeout(
      supabase!
        .from('crowd_reports')
        .select('*')
        .eq('train_id', trainId)
        .order('created_at', { ascending: false })
        .limit(50),
    )
    if (error) throw error
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(r => ({
        compartment: r.compartment as CrowdReport['compartment'],
        level: r.level as CrowdLevel,
        at: new Date(String(r.created_at)).getTime(),
      })),
      source: 'remote',
    }
  } catch {
    return { data: [], source: 'local' }
  }
}

/* --------------------------------------------------------------------- trips */

export async function fetchTrips(): Promise<DbResult<Trip[]>> {
  if (!(await pingBackend())) return { data: [], source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: [], source: 'local' }

    const { data, error } = await withTimeout(
      supabase!.from('trips').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
    )
    if (error) throw error
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(r => ({
        id: String(r.id),
        when: new Date(String(r.created_at)).toLocaleString(),
        from: String(r.from_station),
        to: String(r.to_station),
        points: Number(r.points ?? 0),
      })),
      source: 'remote',
    }
  } catch {
    return { data: [], source: 'local' }
  }
}

export async function recordTrip(input: {
  from: string
  to: string
  departure: string
  arrival?: string
  points: number
  groupId?: string
}): Promise<DbResult<boolean>> {
  if (!(await pingBackend())) return { data: false, source: 'local' }
  try {
    const { data: userData } = await supabase!.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return { data: false, source: 'local' }

    const { error } = await withTimeout(
      supabase!.from('trips').insert({
        user_id: uid,
        from_station: input.from,
        to_station: input.to,
        departure: input.departure,
        arrival: input.arrival ?? null,
        points: input.points,
        group_id: input.groupId ?? null,
      }),
    )
    if (error) throw error
    return { data: true, source: 'remote' }
  } catch {
    return { data: false, source: 'local' }
  }
}

/* -------------------------------------------------------------- local mirror */

/**
 * Convert a client Profile into the local AppState patch used by the mock
 * store, so remote and local state stay interchangeable.
 */
export function profileToState(p: Profile): Partial<AppState> {
  return {
    language: p.language,
    name: p.name,
    usualLine: p.usualLine,
    fromStation: p.fromStation,
    toStation: p.toStation,
    departureTime: formatDeparture(p.departureTime),
    travelAs: p.travelAs as AppState['travelAs'],
    largeText: p.largeText,
    shareLocationOnSos: p.shareLocationOnSos,
    locationAllowed: p.locationAllowed,
    onboarded: p.onboarded,
    points: p.points,
  }
}

/**
 * Store departure as "HH:MM AM · Weekdays" locally (the display format the
 * design uses) while the database keeps plain "HH:MM".
 */
export function formatDeparture(hhmm: string): string {
  if (!hhmm) return '08:30 AM · Weekdays'
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return hhmm
  let h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${m[2]} ${suffix} · Weekdays`
}

/** Extract "HH:MM" from the local display format, for the database. */
export function parseDeparture(display: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(display.trim())
  if (!m) return display
  let h = Number(m[1])
  if (/PM/i.test(m[3]) && h !== 12) h += 12
  if (/AM/i.test(m[3]) && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
