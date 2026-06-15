/// <reference types="vite/client" />

declare const __PR_NUMBER__: string
declare const __COMMIT_SHA__: string

interface ImportMetaEnv {
  /** Web Google OAuth client id (Google Identity Services). */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Web Apple Service ID (not the native bundle id). */
  readonly VITE_APPLE_CLIENT_ID?: string
  /** Redirect URI registered on the Apple Service ID. */
  readonly VITE_APPLE_REDIRECT_URI?: string
  /** Force the dev user-picker login in a production build. */
  readonly VITE_DEV_LOGIN?: string
}
