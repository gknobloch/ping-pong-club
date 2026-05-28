import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User, Player, Team } from '@shared/types'
import { getDisplayName, getRoleLabel } from '@/utils/roles'

const STORAGE_KEY = 'ping-pong-club-user-id'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null
  displayName: string
  roleLabel: string
  login: (userId: string) => void
  logout: () => void
  isAuthenticated: boolean
  availableUsers: User[]
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface AuthProviderProps {
  children: React.ReactNode
  apiUsers?: User[]
  players?: Player[]
  teams?: Team[]
}

export function AuthProvider({ children, apiUsers = [], players = [], teams = [] }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setUserId(stored)
    })
  }, [])

  const allPlayers = useMemo<Player[]>(() => players, [players])

  // Build captain lookup: playerId → team IDs they captain
  const captainTeamIdsByPlayer = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const team of teams) {
      if (team.captainId) {
        const existing = map.get(team.captainId) ?? []
        map.set(team.captainId, [...existing, team.id])
      }
    }
    return map
  }, [teams])

  // Merge real DB users with synthetic users for every active player not already covered
  const allUsers = useMemo<User[]>(() => {
    const coveredPlayerIds = new Set(apiUsers.map((u) => u.playerId).filter(Boolean))
    const synthetic: User[] = allPlayers
      .filter((p) => p.status === 'active' && !coveredPlayerIds.has(p.id))
      .map((p) => {
        const captainTeamIds = captainTeamIdsByPlayer.get(p.id) ?? []
        return {
          id: `synthetic-${p.id}`,
          email: p.email,
          role: captainTeamIds.length > 0 ? 'captain' : 'player',
          playerId: p.id,
          clubIds: p.clubId ? [p.clubId] : [],
          captainTeamIds,
        } satisfies User
      })
    return [...apiUsers, ...synthetic]
  }, [apiUsers, allPlayers, captainTeamIdsByPlayer])

  const user = useMemo(
    () => (userId ? (allUsers.find((u) => u.id === userId) ?? null) : null),
    [userId, allUsers],
  )

  const login = useCallback(async (id: string) => {
    setUserId(id)
    await AsyncStorage.setItem(STORAGE_KEY, id)
  }, [])

  const logout = useCallback(async () => {
    setUserId(null)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      displayName: user ? getDisplayName(user, allPlayers) : '',
      roleLabel: user ? getRoleLabel(user.role) : '',
      login,
      logout,
      isAuthenticated: !!user,
      availableUsers: allUsers,
    }),
    [user, allPlayers, allUsers, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
