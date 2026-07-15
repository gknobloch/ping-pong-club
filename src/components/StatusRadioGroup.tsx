import type { LifecycleStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/status'

const ORDER: LifecycleStatus[] = ['upcoming', 'active', 'archived']

/** Radio group for the seasons/phases 3-state lifecycle (#227). */
export function StatusRadioGroup({
  name,
  value,
  onChange,
}: {
  /** HTML radio group name — must be unique per form. */
  name: string
  value: LifecycleStatus
  onChange: (status: LifecycleStatus) => void
}) {
  return (
    <div className="mt-1 flex gap-4" role="radiogroup" aria-label="Statut">
      {ORDER.map((status) => (
        <label key={status} className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            value={status}
            checked={value === status}
            onChange={() => onChange(status)}
            className="border-slate-300 text-accent-600 focus:ring-accent-500"
          />
          <span className="text-sm text-slate-700">{STATUS_LABELS[status]}</span>
        </label>
      ))}
    </div>
  )
}
