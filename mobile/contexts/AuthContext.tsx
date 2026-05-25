import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User, Player } from '@shared/types'
import { getDisplayName, getRoleLabel } from '@/utils/roles'
import { mockAuthUsers, mockAuthPlayers } from '@/mock/authData'

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
  /** API users — merged with bundled mock users; may be empty before API loads */
  apiUsers?: User[]
  /** API players — used for display names; falls back to bundled mock players */
  players?: Player[]
}

export function AuthProvider({ children, apiUsers = [], players = [] }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setUserId(stored)
    })
  }, [])

  // Merge: bundled mock users are always present; API users are added if not already there
  const allUsers = useMemo<User[]>(() => {
    const extra = apiUsers.filter((u) => !mockAuthUsers.some((m) => m.id === u.id))
    return [...mockAuthUsers, ...extra]
  }, [apiUsers])

  // Players: prefer API data (more complete), fall back to mock for display names
  const allPlayers = useMemo<Player[]>(() => {
    if (players.length > 0) return players
    return mockAuthPlayers as Player[]
  }, [players])

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
