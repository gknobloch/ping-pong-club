import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

interface DataContextValue extends DataState {
  loading: boolean
  error: string | null
  refresh: () => void
  updatePlayer: (id: string, patch: PlayerProfilePatch) => Promise<void>
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
}

const DataContext = createContext<DataContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/data'), { headers: dataHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: DataState = await res.json()
      setState(data)
      setApiAvailable(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
      setApiAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Refetch when the session token changes (e.g. after login/logout).
    return onSessionTokenChange(load)
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

  const value = useMemo<DataContextValue>(
    () => ({
      ...state,
      loading,
      error,
      refresh: load,
      updatePlayer,
      setAvailability,
      setGameSelection,
    }),
    [state, loading, error, load, updatePlayer, setAvailability, setGameSelection],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}
