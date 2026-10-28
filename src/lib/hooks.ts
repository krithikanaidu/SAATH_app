import { useCallback, useEffect, useState } from 'react'
import {
  fetchGroups,
  fetchTrips,
  fetchCrowdReports,
  createGroup as dbCreateGroup,
  deleteGroup as dbDeleteGroup,
  joinGroup as dbJoinGroup,
  leaveGroup as dbLeaveGroup,
  addCrowdReport as dbAddCrowdReport,
  type Source,
} from './db'
import type { BuddyGroup, CrowdLevel, CrowdReport, Trip } from './types'
import { useStore } from './store'

/**
 * Data hooks.
 *
 * Each hook loads from Supabase and falls back to the local store, exposing
 * `source` so screens can show a live/local badge. Mutations write to the
 * backend when available and always mirror into local state, so the UI stays
 * consistent even when offline.
 */

interface UseAsync<T> {
  data: T
  loading: boolean
  source: Source
  error: string | null
  reload: () => void
}

function useAsync<T>(fn: () => Promise<{ data: T; source: Source }>, deps: unknown[], initial: T): UseAsync<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<Source>('local')
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then(res => {
        if (cancelled) return
        setData(res.data)
        setSource(res.source)
      })
      .catch(e => {
        if (cancelled) return
        setError(String(e?.message ?? e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  return { data, loading, source, error, reload }
}

/* ------------------------------------------------------------------- groups */

/**
 * Groups from the backend, merged with locally created ones. Locally created
 * groups live in `state.customGroups` so they survive an offline session.
 */
export function useGroups(): UseAsync<BuddyGroup[]> & {
  create: (input: {
    name: string
    line: string
    from: string
    to: string
    window: string
  }) => Promise<BuddyGroup | null>
  remove: (id: string) => Promise<void>
  toggleJoin: (id: string, joined: boolean) => Promise<void>
} {
  const { state, update } = useStore()
  const local = state.customGroups ?? []

  const query = useAsync<BuddyGroup[]>(
    async () => {
      const res = await fetchGroups()
      // merge: backend groups first, then any locally created ones not on the server
      const remoteIds = new Set(res.data.map(g => g.id))
      const merged = [...res.data, ...local.filter(g => !remoteIds.has(g.id))]
      return { data: merged, source: res.source }
    },
    [local.length],
    local,
  )

  const create = useCallback(
    async (input: { name: string; line: string; from: string; to: string; window: string }) => {
      const res = await dbCreateGroup(input)
      if (res.data) {
        // backend answered — refetch so ids/members come from the server
        query.reload()
        return res.data
      }
      // local fallback: persist into the mock store
      const group: BuddyGroup = {
        id: `local-${Date.now()}`,
        name: input.name,
        from: input.from,
        to: input.to,
        window: input.window,
        members: 1,
        line: input.line,
        verifiedOrganiser: true,
        joined: true,
      }
      update({
        customGroups: [...local, group],
        joinedGroupIds: [...state.joinedGroupIds, group.id],
      })
      return group
    },
    [local, query, state.joinedGroupIds, update],
  )

  const remove = useCallback(
    async (id: string) => {
      await dbDeleteGroup(id)
      // drop from local mirror in both cases
      update({
        customGroups: local.filter(g => g.id !== id),
        joinedGroupIds: state.joinedGroupIds.filter(x => x !== id),
      })
      query.reload()
    },
    [local, query, state.joinedGroupIds, update],
  )

  const toggleJoin = useCallback(
    async (id: string, joined: boolean) => {
      if (joined) await dbLeaveGroup(id)
      else await dbJoinGroup(id)
      // mirror locally regardless of backend answer
      update({
        joinedGroupIds: joined
          ? state.joinedGroupIds.filter(x => x !== id)
          : [...state.joinedGroupIds, id],
      })
      query.reload()
    },
    [query, state.joinedGroupIds, update],
  )

  return { ...query, create, remove, toggleJoin }
}

/* -------------------------------------------------------------------- trips */

export function useTrips(): UseAsync<Trip[]> {
  const { state } = useStore()
  return useAsync<Trip[]>(
    async () => {
      const res = await fetchTrips()
      return res
    },
    [state.points],
    [],
  )
}

/* ----------------------------------------------------------- crowd reports */

export function useCrowdReports(trainId: string): UseAsync<CrowdReport[]> & {
  report: (compartment: CrowdReport['compartment'], level: CrowdLevel) => Promise<void>
} {
  const query = useAsync<CrowdReport[]>(
    async () => await fetchCrowdReports(trainId),
    [trainId],
    [],
  )
  const report = useCallback(
    async (compartment: CrowdReport['compartment'], level: CrowdLevel) => {
      await dbAddCrowdReport({ trainId, compartment, level })
      query.reload()
    },
    [query, trainId],
  )
  return { ...query, report }
}
