// Web OAuth helpers: Google Identity Services + Sign in with Apple JS.
// Both are gated on client-id env vars — when unset, the buttons stay disabled
// (credentials are provisioned in issue #100).

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined
// Apple requires a redirect URI registered on the Service ID; defaults to the
// current origin's /login (popup mode posts the result back to the opener).
const APPLE_REDIRECT_URI =
  (import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined) ??
  (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined)

export const googleConfigured = Boolean(GOOGLE_CLIENT_ID)
export const appleConfigured = Boolean(APPLE_CLIENT_ID)

// ---------------------------------------------------------------------------
// Minimal global typings for the provider SDKs
// ---------------------------------------------------------------------------
interface GoogleCredentialResponse {
  credential: string
}
interface GoogleIdApi {
  initialize(opts: { client_id: string; callback: (r: GoogleCredentialResponse) => void }): void
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void
}
interface AppleAuthApi {
  init(opts: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }): void
  signIn(): Promise<{ authorization: { id_token: string; code: string } }>
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
    AppleID?: { auth: AppleAuthApi }
  }
}

// ---------------------------------------------------------------------------
// Script loading (idempotent)
// ---------------------------------------------------------------------------
const loaded = new Map<string, Promise<void>>()
function loadScript(src: string): Promise<void> {
  let p = loaded.get(src)
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error(`failed to load ${src}`))
      document.head.appendChild(s)
    })
    loaded.set(src, p)
  }
  return p
}

// ---------------------------------------------------------------------------
// Google — renders the official GIS button; the callback yields an ID token.
// ---------------------------------------------------------------------------
export async function mountGoogleButton(
  container: HTMLElement,
  onToken: (idToken: string) => void,
): Promise<void> {
  if (!GOOGLE_CLIENT_ID) return
  await loadScript('https://accounts.google.com/gsi/client')
  const id = window.google?.accounts.id
  if (!id) throw new Error('google_unavailable')
  id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onToken(r.credential) })
  id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'center',
    width: container.clientWidth || 320,
    locale: 'fr',
  })
}

// ---------------------------------------------------------------------------
// Apple — popup sign-in; returns the ID token.
// ---------------------------------------------------------------------------
export async function appleSignIn(): Promise<string> {
  if (!APPLE_CLIENT_ID || !APPLE_REDIRECT_URI) throw new Error('apple_not_configured')
  await loadScript(
    'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
  )
  const auth = window.AppleID?.auth
  if (!auth) throw new Error('apple_unavailable')
  auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: 'name email',
    redirectURI: APPLE_REDIRECT_URI,
    usePopup: true,
  })
  const res = await auth.signIn()
  return res.authorization.id_token
}
