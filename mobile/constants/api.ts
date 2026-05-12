import Constants from 'expo-constants'

const manifest = Constants.expoConfig?.extra

// In dev: point to local wrangler dev server (npm run dev:full from root)
// In production: set EXPO_PUBLIC_API_URL in your EAS build profile
const DEV_API_URL = 'http://localhost:8788'

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (manifest?.apiUrl as string | undefined) ??
  DEV_API_URL

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`
}
