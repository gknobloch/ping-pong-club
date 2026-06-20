import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppState } from 'react-native'

// Minimum gap between automatic foreground refetches. A manual pull-to-refresh
// always forces a fetch and ignores this.
const FOREGROUND_REFETCH_THROTTLE_MS = 30_000
import type {
  Club,
  Season,
  Phase,
  Division,
  Group,
  Team,
  Player,
  MatchDay,
  Game,
  GameAvailability,
  GameSelection,
  AvailabilityStatus,
  User,
} from '@shared/types'
import { apiUrl } from '@/constants/api'
import { dataHeaders, onSessionTokenChange } from '@/utils/api'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
interface DataState {
  clubs: Club[]
  seasons: Season[]
  phases: Phase[]
  divisions: Division[]
  groups: Group[]
  teams: Team[]
  players: Player[]
  matchDays: MatchDay[]
  games: Game[]
  gameAvailabilities: GameAvailability[]
  gameSelections: GameSelection[]
  users: User[]
}

const emptyState: DataState = {
  clubs: [],
  seasons: [],
  phases: [],
  divisions: [],
  groups: [],
  teams: [],
  players: [],
  matchDays: [],
  games: [],
  gameAvailabilities: [],
  gameSelections: [],
  users: [],
}

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------
type PlayerProfilePatch = Partial<Pick<Player, 'email' | 'phone' | 'birthDate' | 'birthPlace'>>
type TeamPatch = { playerIds?: string[]; whatsappLink?: string | null }

interface DataContextValue extends DataState {
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => void
  updatePlayer: (id: string, patch: PlayerProfilePatch) => Promise<void>
  updateTeam: (id: string, patch: TeamPatch) => void
  setAvailability: (
    playerId: string,
    gameId: string,
    status: AvailabilityStatus,
  ) => Promise<void>
  setGameSelection: (
    teamId: string,
    gameId: string,
    playerIds: string[],
  ) => Promise<void>
  /** Upload (or replace) a player's avatar. `base64` is the raw image bytes. */
  setAvatar: (playerId: string, base64: string, contentType: string) => Promise<void>
  /** Remove a player's avatar. */
  removeAvatar: (playerId: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)
  const lastFetchAt = useRef(0)

  // `mode` decides which spinner reflects the fetch: 'initial' uses the
  // full-screen loading flag, 'refresh' uses the lightweight one so the UI
  // (pull-to-refresh, foreground refetch) doesn't blank out existing content.
  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/data'), { headers: dataHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: DataState = await res.json()
      setState(data)
      setApiAvailable(true)
      lastFetchAt.current = Date.now()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
      setApiAvailable(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => load('refresh'), [load])

  useEffect(() => {
    load()
    // Refetch when the session token changes (e.g. after login/logout).
    return onSessionTokenChange(() => load())
  }, [load])

  // Refetch when the app returns to the foreground, so changes made elsewhere
  // (e.g. on the web app) show up without a full restart. Throttled so rapid
  // app switching doesn't spam the API — pull-to-refresh bypasses this.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return
      if (Date.now() - lastFetchAt.current < FOREGROUND_REFETCH_THROTTLE_MS) return
      load('refresh')
    })
    return () => sub.remove()
  }, [load])

  const updatePlayer = useCallback(
    async (id: string, patch: PlayerProfilePatch) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }))
      if (apiAvailable) {
        fetch(apiUrl(`/players/${id}`), {
          method: 'PATCH',
          headers: dataHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(patch),
        }).catch(() => {})
      }
    },
    [apiAvailable],
  )

  const updateTeam = useCallback(
    (id: string, patch: TeamPatch) => {
      setState((prev) => ({
        ...prev,
        teams: prev.teams.map((t) => {
          if (t.id !== id) return t
          const next = { ...t }
          if (patch.playerIds !== undefined) next.playerIds = patch.playerIds
          if ('whatsappLink' in patch) next.whatsappLink = patch.whatsappLink ?? undefined
          return next
        }),
      }))
      if (apiAvailable) {
        fetch(apiUrl(`/teams/${id}`), {
          method: 'PATCH',
          headers: dataHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(patch),
        }).catch(() => {})
      }
    },
    [apiAvailable],
  )

  const setAvailability = useCallback(
    async (playerId: string, gameId: string, status: AvailabilityStatus) => {
      // Determine (or generate) the record ID before the state update so we
      // can pass the same ID to the API call.
      let recordId = `avail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      setState((prev) => {
        const existing = prev.gameAvailabilities.find(
          (a) => a.playerId === playerId && a.gameId === gameId,
        )
        if (existing) {
          recordId = existing.id   // reuse the server-assigned ID for the upsert
          return {
            ...prev,
            gameAvailabilities: prev.gameAvailabilities.map((a) =>
              a.playerId === playerId && a.gameId === gameId ? { ...a, status } : a,
            ),
          }
        }
        return {
          ...prev,
          gameAvailabilities: [
            ...prev.gameAvailabilities,
            { id: recordId, playerId, gameId, status },
          ],
        }
      })

      if (apiAvailable) {
        fetch(apiUrl('/game-availabilities/set'), {
          method: 'POST',
          headers: dataHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id: recordId, playerId, gameId, status }),
        }).catch(() => {})
      }
    },
    [apiAvailable],
  )

  const setGameSelection = useCallback(
    async (teamId: string, gameId: string, playerIds: string[]) => {
      // Always generate an ID; the server uses it only when creating a new record
      // (existing records are updated by their DB id).
      const id = `sel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      setState((prev) => {
        const existing = prev.gameSelections.find(
          (s) => s.teamId === teamId && s.gameId === gameId,
        )
        if (existing) {
          return {
            ...prev,
            gameSelections: prev.gameSelections.map((s) =>
              s.teamId === teamId && s.gameId === gameId
                ? { ...s, playerIds }
                : s,
            ),
          }
        }
        return {
          ...prev,
          gameSelections: [
            ...prev.gameSelections,
            { id, teamId, gameId, playerIds },
          ],
        }
      })

      if (apiAvailable) {
        fetch(apiUrl('/game-selections/set'), {
          method: 'POST',
          headers: dataHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id, teamId, gameId, playerIds }),
        }).catch(() => {})
      }
    },
    [apiAvailable],
  )

  const patchPlayerAvatar = useCallback((playerId: string, avatarUpdatedAt: string | undefined) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === playerId ? { ...p, avatarUpdatedAt } : p)),
    }))
  }, [])

  const setAvatar = useCallback(
    async (playerId: string, base64: string, contentType: string) => {
      // Optimistic: bump the version immediately so the image refreshes.
      patchPlayerAvatar(playerId, new Date().toISOString())
      if (!apiAvailable) return
      const res = await fetch(apiUrl(`/players/${playerId}/avatar`), {
        method: 'PUT',
        headers: dataHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ data: base64, contentType }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { avatarUpdatedAt } = (await res.json()) as { avatarUpdatedAt?: string }
      if (avatarUpdatedAt) patchPlayerAvatar(playerId, avatarUpdatedAt)
    },
    [apiAvailable, patchPlayerAvatar],
  )

  const removeAvatar = useCallback(
    async (playerId: string) => {
      patchPlayerAvatar(playerId, undefined)
      if (!apiAvailable) return
      const res = await fetch(apiUrl(`/players/${playerId}/avatar`), {
        method: 'DELETE',
        headers: dataHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    [apiAvailable, patchPlayerAvatar],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      ...state,
      loading,
      refreshing,
      error,
      refresh,
      updatePlayer,
      updateTeam,
      setAvailability,
      setGameSelection,
      setAvatar,
      removeAvatar,
    }),
    [state, loading, refreshing, error, refresh, updatePlayer, updateTeam, setAvailability, setGameSelection, setAvatar, removeAvatar],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}
