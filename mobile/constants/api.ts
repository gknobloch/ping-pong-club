import Constants from 'expo-constants'

const manifest = Constants.expoConfig?.extra

// Default: production Cloudflare Pages deployment.
// Override with EXPO_PUBLIC_API_URL to point at a local wrangler dev server.
const PROD_API_URL = 'https://ping-pong-club.pages.dev'

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (manifest?.apiUrl as string | undefined) ??
  PROD_API_URL

// True whenever we target the deployed Cloudflare backend (prod or a preview
// deployment). Used to hide dev login when talking to a real backend, even in
// a dev build.
export const IS_DEPLOYED_API = API_BASE_URL.includes('ping-pong-club.pages.dev')

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`
}
