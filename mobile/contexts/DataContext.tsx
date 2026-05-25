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
import {
  mockClubs, mockSeasons, mockPhases, mockDivisions, mockGroups,
  mockTeams, mockPlayers, mockMatchDays, mockGames,
} from '@/mock/appData'

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

const mockFallback: DataState = {
  clubs: mockClubs,
  seasons: mockSeasons,
  phases: mockPhases,
  divisions: mockDivisions,
  groups: mockGroups,
  teams: mockTeams,
  players: mockPlayers,
  matchDays: mockMatchDays,
  games: mockGames,
  gameAvailabilities: [],
  gameSelections: [],
  users: [],
}

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------
interface DataContextValue extends DataState {
  loading: boolean
  error: string | null
  refresh: () => void
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
  const [state, setState] = useState<DataState>(mockFallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/data'))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Partial<DataState> = await res.json()
      // Merge: use API data where present, fall back to mock for missing fields
      setState((prev) => ({ ...prev, ...data }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setAvailability = useCallback(
    async (playerId: string, gameId: string, status: AvailabilityStatus) => {
      // Optimistic update
      setState((prev) => {
        const existing = prev.gameAvailabilities.find(
          (a) => a.playerId === playerId && a.gameId === gameId,
        )
        if (existing) {
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
            { id: `avail-${Date.now()}`, playerId, gameId, status },
          ],
        }
      })
      fetch(apiUrl('/availability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, gameId, status }),
      }).catch(console.error)
    },
    [],
  )

  const setGameSelection = useCallback(
    async (teamId: string, gameId: string, playerIds: string[]) => {
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
            { id: `sel-${Date.now()}`, teamId, gameId, playerIds },
          ],
        }
      })
      fetch(apiUrl('/game-selections'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, gameId, playerIds }),
      }).catch(console.error)
    },
    [],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      ...state,
      loading,
      error,
      refresh: load,
      setAvailability,
      setGameSelection,
    }),
    [state, loading, error, load, setAvailability, setGameSelection],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}
