// ---------------------------------------------------------------------------
// Week helpers — shared by the Accueil, Journées list and week-detail screens.
// A "week" is keyed by its Monday date string (e.g. "2025-09-22").
// ---------------------------------------------------------------------------

export function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

export function getSundayOf(mondayStr: string): string {
  const d = new Date(mondayStr + 'T12:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export function formatWeekRange(mondayStr: string): string {
  const mo = new Date(mondayStr + 'T12:00:00')
  const su = new Date(mo)
  su.setDate(mo.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  return `Lu ${fmt(mo)} au Di ${fmt(su)}`
}
