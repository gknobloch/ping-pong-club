import Constants from 'expo-constants'

const manifest = Constants.expoConfig?.extra

// Default: production Cloudflare Pages deployment.
// Override with EXPO_PUBLIC_API_URL to point at a local wrangler dev server.
const PROD_API_URL = 'https://ping-pong-club.pages.dev'

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (manifest?.apiUrl as string | undefined) ??
  PROD_API_URL

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`
}
