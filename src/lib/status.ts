import type { LifecycleStatus } from '@/types'

// Shared display config for the seasons/phases 3-state lifecycle (#227).
export const STATUS_LABELS: Record<LifecycleStatus, string> = {
  active: 'Active',
  upcoming: 'À venir',
  archived: 'Archivée',
}

export const STATUS_BADGES: Record<LifecycleStatus, string> = {
  active: 'bg-green-100 text-green-800',
  upcoming: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-100 text-slate-600',
}
