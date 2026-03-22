import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { User } from '@/types'
import { mockUsers, mockPlayers, getDisplayNameForUser, getRoleLabel } from '@/mock/data'

const STORAGE_KEY = 'ping-pong-club-dev-user-id'

/**
 * Build a User for any player not in mockUsers.
 * Assigns 'player' role with their club access.
 */
function buildAdHocUser(playerId: string): User | null {
  const player = mockPlayers.find((p) => p.id === playerId)
  if (!player || !player.clubId) return null
  return {
    id: `adhoc-${playerId}`,
    email: player.email,
    role: 'player',
    playerId: player.id,
    clubIds: [player.clubId],
    captainTeamIds: [],
  }
}

/** All selectable users: explicit mock users + ad-hoc users for remaining players. */
const allSelectableUsers: User[] = (() => {
  const coveredPlayerIds = new Set(mockUsers.map((u) => u.playerId).filter(Boolean))
  const adHoc = mockPlayers
    .filter((p) => p.clubId && !coveredPlayerIds.has(p.id))
    .map((p) => buildAdHocUser(p.id)!)
    .filter(Boolean)
  return [...mockUsers, ...adHoc]
})()

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
    // Check explicit mock users first, then ad-hoc
    return allSelectableUsers.find((u) => u.id === userId) ?? null
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
    mockUsers: allSelectableUsers,
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
