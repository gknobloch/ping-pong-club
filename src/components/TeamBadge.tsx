// Neutral pill with a team-coloured square swatch, used wherever a team is
// tagged (player quick view / detail) so they all look identical. `danger`
// switches the border + text to red — used for the brûlage tag. Mirrors
// mobile/components/TeamBadge.tsx.
export function TeamBadge({
  color,
  label,
  danger,
}: {
  color?: string
  label: string
  danger?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1 ${
        danger ? 'border-accent-500' : 'border-slate-200'
      }`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
        style={{ backgroundColor: color ?? '#e23b3b' }}
      />
      <span className={`text-[13px] font-semibold ${danger ? 'text-accent-600' : 'text-slate-600'}`}>
        {label}
      </span>
    </span>
  )
}
