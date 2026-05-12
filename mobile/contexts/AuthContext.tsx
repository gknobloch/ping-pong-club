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
  /** Injected at app bootstrap once data is loaded */
  users: User[]
  players: Player[]
  teams: Team[]
}

export function AuthProvider({ children, users, players, teams }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setUserId(stored)
    })
  }, [])

  const user = useMemo(
    () => (userId ? (users.find((u) => u.id === userId) ?? null) : null),
    [userId, users],
  )

  const login = useCallback(
    async (id: string) => {
      setUserId(id)
      await AsyncStorage.setItem(STORAGE_KEY, id)
    },
    [],
  )

  const logout = useCallback(async () => {
    setUserId(null)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      displayName: user ? getDisplayName(user, players) : '',
      roleLabel: user ? getRoleLabel(user.role) : '',
      login,
      logout,
      isAuthenticated: !!user,
      availableUsers: users,
    }),
    [user, players, login, logout, users],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
