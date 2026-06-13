import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, DEV_LOGIN } from '@/contexts/AuthContext'
import { getDisplayNameForUser, mockPlayers, mockClubs } from '@/mock/data'
import { appleConfigured, appleSignIn, googleConfigured, mountGoogleButton } from '@/lib/webOAuth'
import type { ApiError } from '@/lib/authApi'
import type { User } from '@/types'

function authErrorMessage(e: unknown): string {
  switch ((e as ApiError)?.code) {
    case 'invalid_code':
      return 'Code invalide ou expiré.'
    case 'too_many_attempts':
      return 'Trop de tentatives. Demandez un nouveau code.'
    case 'no_account':
      return 'Aucun compte associé à cet e-mail.'
    case 'invalid_email':
      return 'Adresse e-mail invalide.'
    default:
      return 'Une erreur est survenue. Réessayez.'
  }
}

export function LoginPage() {
  const { requestCode, verifyCode, loginWithIdToken } = useAuth()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const googleRef = useRef<HTMLDivElement>(null)
  const googleMounted = useRef(false)

  // Render the official Google button once, when configured and on the email step.
  useEffect(() => {
    if (step !== 'email' || !googleConfigured || googleMounted.current || !googleRef.current) return
    googleMounted.current = true
    mountGoogleButton(googleRef.current, (idToken) => {
      setBusy(true)
      setError(null)
      loginWithIdToken('google', idToken)
        .catch((e) => setError(authErrorMessage(e)))
        .finally(() => setBusy(false))
    }).catch(() => setError('Google indisponible.'))
  }, [step, loginWithIdToken])

  const handleRequestCode = useCallback(async () => {
    if (!email.includes('@')) {
      setError('Adresse e-mail invalide.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { devCode } = await requestCode(email.trim())
      setDevCode(devCode ?? null)
      setStep('code')
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }, [email, requestCode])

  const handleVerify = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await verifyCode(email.trim(), code.trim())
      // PublicRoute redirects to "/" once authenticated.
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }, [email, code, verifyCode])

  const handleApple = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const idToken = await appleSignIn()
      await loginWithIdToken('apple', idToken)
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }, [loginWithIdToken])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-slate-800 text-center mb-2">
          Disponibilités Ping-Pong
        </h1>
        <p className="text-slate-600 text-center text-sm mb-8">
          {step === 'email' ? 'Connectez-vous pour continuer' : `Code envoyé à ${email}`}
        </p>

        {error && <p className="mb-4 text-sm font-medium text-red-600 text-center">{error}</p>}

        {step === 'email' ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="button"
              onClick={handleRequestCode}
              disabled={busy}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Envoi…' : 'Recevoir un code'}
            </button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google — official GIS button, or disabled placeholder until configured (#100) */}
            {googleConfigured ? (
              <div ref={googleRef} className="flex justify-center" />
            ) : (
              <button
                type="button"
                disabled
                title="Configuration requise (#100)"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-400 shadow-sm cursor-not-allowed"
              >
                Continuer avec Google (à configurer)
              </button>
            )}

            <button
              type="button"
              onClick={handleApple}
              disabled={busy || !appleConfigured}
              title={appleConfigured ? undefined : 'Configuration requise (#100)'}
              className={`w-full rounded-lg px-4 py-3 font-medium shadow-sm ${
                appleConfigured
                  ? 'bg-black text-white hover:bg-slate-800'
                  : 'border border-slate-300 bg-white text-slate-400 cursor-not-allowed'
              }`}
            >
              {appleConfigured ? 'Continuer avec Apple' : 'Continuer avec Apple (à configurer)'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                Code à 6 chiffres
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleVerify()}
                placeholder="123456"
                autoFocus
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 placeholder-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {devCode && <p className="text-sm text-slate-500">Code (dev) : {devCode}</p>}
            <button
              type="button"
              onClick={handleVerify}
              disabled={busy || code.length < 6}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={handleRequestCode} disabled={busy} className="text-blue-600 hover:underline">
                Renvoyer le code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setDevCode(null)
                  setError(null)
                }}
                className="text-blue-600 hover:underline"
              >
                Modifier l’e-mail
              </button>
            </div>
          </div>
        )}

        {DEV_LOGIN && <DevLogin />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dev-only "pick any user" login (hidden behind DEV_LOGIN). Kept as the E2E
// login path since the E2E server runs `vite dev` with no backend.
// ---------------------------------------------------------------------------
function DevLogin() {
  const navigate = useNavigate()
  const { devLoginAs, mockUsers } = useAuth()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockUsers
    return mockUsers.filter(
      (u) => u.email.toLowerCase().includes(q) || getDisplayNameForUser(u).toLowerCase().includes(q),
    )
  }, [query, mockUsers])

  const handleSelect = useCallback(
    (user: User) => {
      devLoginAs(user.id)
      navigate('/', { replace: true })
    },
    [devLoginAs, navigate],
  )

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Mode développement
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
                  aria-selected={false}
                  tabIndex={0}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(user)
                  }}
                  className="cursor-pointer px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <span className="font-medium text-slate-900">{getDisplayNameForUser(user)}</span>
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
  )
}
