import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { User } from '@/types'
import { mockUsers, getDisplayNameForUser, getRoleLabel } from '@/mock/data'

const STORAGE_KEY = 'ping-pong-club-dev-user-id'

interface AuthContextValue {
  user: User | null
  displayName: string
  roleLabel: string
  login: (userId: string) => void
  logout: () => void
  isAuthenticated: boolean
  mockUsers: User[]
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(STORAGE_KEY)
  })

  const user = useMemo(() => {
    if (!userId) return null
    return mockUsers.find((u) => u.id === userId) ?? null
  }, [userId])

  const login = useCallback((id: string) => {
    setUserId(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const logout = useCallback(() => {
    setUserId(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    displayName: user ? getDisplayNameForUser(user) : '',
    roleLabel: user ? getRoleLabel(user.role) : '',
    login,
    logout,
    isAuthenticated: !!user,
    mockUsers,
  }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook and provider are intentionally in the same file for co-location
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
