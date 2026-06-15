import type { User } from '@shared/types'
import { apiUrl } from '@/constants/api'

// ---------------------------------------------------------------------------
// Session token holder — AuthContext sets it; DataContext reads it for the
// Authorization header and subscribes to changes to refetch after login.
// (DataProvider wraps AuthProvider, so a module holder decouples them.)
// ---------------------------------------------------------------------------
let currentToken: string | null = null
const tokenListeners = new Set<() => void>()

export function setSessionToken(token: string | null): void {
  if (token === currentToken) return
  currentToken = token
  tokenListeners.forEach((l) => l())
}

export function getSessionToken(): string | null {
  return currentToken
}

export function onSessionTokenChange(listener: () => void): () => void {
  tokenListeners.add(listener)
  return () => {
    tokenListeners.delete(listener)
  }
}

/** Headers for data/mutation requests, including the session token when set. */
export function dataHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    ...(extra ?? {}),
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
  }
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------
export interface ApiError extends Error {
  status: number
  code?: string
}

function apiError(status: number, code?: string, message?: string): ApiError {
  const e = new Error(message ?? code ?? `HTTP ${status}`) as ApiError
  e.status = status
  e.code = code
  return e
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  return parse<T>(res)
}

async function parse<T>(res: Response): Promise<T> {
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const code = (data as { error?: string } | null)?.error
    throw apiError(res.status, code)
  }
  return data as T
}

/** Fetch with the Bearer token attached. */
export function authFetch(path: string, init: RequestInit, token: string): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  })
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export interface AuthSession {
  token: string
  user: User
}

/** Request an email OTP. `devCode` is only present in local dev (no email provider). */
export function requestEmailCode(email: string): Promise<{ ok: true; devCode?: string }> {
  return postJson('/auth/email/request', { email })
}

export function verifyEmailCode(email: string, code: string): Promise<AuthSession> {
  return postJson('/auth/email/verify', { email, code })
}

export function oauthLogin(provider: 'google' | 'apple', idToken: string): Promise<AuthSession> {
  return postJson('/auth/oauth', { provider, idToken })
}

export async function fetchMe(token: string): Promise<User> {
  const res = await authFetch('/auth/me', { method: 'GET' }, token)
  const { user } = await parse<{ user: User }>(res)
  return user
}

export async function logout(token: string): Promise<void> {
  await authFetch('/auth/logout', { method: 'POST' }, token).catch(() => {})
}
