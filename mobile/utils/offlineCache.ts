import AsyncStorage from '@react-native-async-storage/async-storage'

// ---------------------------------------------------------------------------
// Offline read cache (level 1 offline support, issue #144)
//
// Persists the last successful `GET /api/data` payload so the app can render
// instantly on a cold start and stay usable with no connectivity. Stored as a
// single JSON blob alongside the time it was fetched. The cache is per-user
// data, so it is cleared on logout (see DataContext token-change handler).
// ---------------------------------------------------------------------------

const CACHE_KEY = 'pp-club-data-cache'

export interface CachedData<T> {
  data: T
  /** ISO timestamp of the fetch that produced this payload. */
  lastSyncedAt: string
}

/** Read the cached payload, or null when absent / unreadable. */
export async function readCache<T>(): Promise<CachedData<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedData<T>
    if (!parsed || typeof parsed.lastSyncedAt !== 'string' || parsed.data == null) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Persist a freshly fetched payload with its sync timestamp. */
export async function writeCache<T>(data: T, lastSyncedAt: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, lastSyncedAt }))
  } catch {
    /* best-effort — a failed cache write must never break the app */
  }
}

/** Drop the cache (e.g. on logout, so the next user doesn't see stale data). */
export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}
