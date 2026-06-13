import type { User } from '@/types'

// ---------------------------------------------------------------------------
// Low-level helpers (web — same-origin /api)
// ---------------------------------------------------------------------------
export interface ApiError extends Error {
  status: number
  code?: string
}

function apiError(status: number, code?: string): ApiError {
  const e = new Error(code ?? `HTTP ${status}`) as ApiError
  e.status = status
  e.code = code
  return e
}

async function parse<T>(res: Response): Promise<T> {
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  if (!res.ok) throw apiError(res.status, (data as { error?: string } | null)?.error)
  return data as T
}

function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(parse<T>)
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export interface AuthSession {
  token: string
  user: User
}

/** Request an email OTP. `devCode` is only returned in local dev (no email provider). */
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
  const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  const { user } = await parse<{ user: User }>(res)
  return user
}

export async function logout(token: string): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
}
