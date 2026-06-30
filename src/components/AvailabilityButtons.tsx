import type { AvailabilityStatus } from '@/types'

// OUI / PE / NON toggle for a player's own availability. Clicking a status sets
// it; clicking the active one clears it. Read-only `disabled` keeps the chips
// but ignores clicks (e.g. past games).
export function AvailabilityButtons({
  status,
  onSet,
  onClear,
  disabled,
  size = 'md',
}: {
  status?: AvailabilityStatus
  onSet: (s: AvailabilityStatus) => void
  onClear: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  const cell = (s: AvailabilityStatus, label: string, active: string) => {
    const on = status === s
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => (on ? onClear() : onSet(s))}
        className={`rounded-md border font-semibold ${pad} ${
          on ? active : 'border-slate-200 text-slate-400'
        } ${disabled ? 'cursor-default' : 'hover:border-slate-300'}`}
      >
        {label}
      </button>
    )
  }
  return (
    <span className="flex shrink-0 gap-1">
      {cell('available', 'OUI', 'border-green-500 bg-green-50 text-green-700')}
      {cell('maybe', 'PE', 'border-amber-500 bg-amber-50 text-amber-700')}
      {cell('unavailable', 'NON', 'border-accent-500 bg-accent-50 text-accent-600')}
    </span>
  )
}
