import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayNameForUser, mockPlayers, mockClubs } from '@/mock/data'
import type { User } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, mockUsers } = useAuth()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockUsers
    return mockUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        getDisplayNameForUser(u).toLowerCase().includes(q)
    )
  }, [query, mockUsers])

  const handleSelect = useCallback(
    (user: User) => {
      login(user.id)
      navigate('/', { replace: true })
    },
    [login, navigate]
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-slate-800 text-center mb-2">
          Disponibilités Ping-Pong
        </h1>
        <p className="text-slate-600 text-center text-sm mb-8">
          Mode développement — choisissez un utilisateur pour vous connecter
        </p>
        <div className="relative">
          <label htmlFor="user-search" className="block text-sm font-medium text-slate-700 mb-1">
            Utilisateur
          </label>
          <input
            id="user-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Nom ou adresse email..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoComplete="off"
          />
          {(focused || query) && (
            <ul
              className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg max-h-64 overflow-auto"
              role="listbox"
            >
              {suggestions.length === 0 ? (
                <li className="px-4 py-3 text-slate-500 text-sm">Aucun utilisateur trouvé</li>
              ) : (
                suggestions.map((user) => (
                  <li
                    key={user.id}
                    role="option"
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(user)
                    }}
                    className="cursor-pointer px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    <span className="font-medium text-slate-900">
                      {getDisplayNameForUser(user)}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {(() => {
                        const player = mockPlayers.find((p) => p.id === user.playerId)
                        const club = player?.clubId ? mockClubs.find((c) => c.id === player.clubId) : null
                        return club?.displayName ?? user.email
                      })()}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
