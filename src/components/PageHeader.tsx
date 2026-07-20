import type { ReactNode } from 'react'
import { ClubLogo } from '@/components/ClubLogo'

/**
 * Standard admin list-screen header: rounded box, title (+ optional club
 * logo/name when the screen is club-scoped), and a right-aligned actions
 * slot. Shared by Clubs, Saisons, Phases, Divisions, Groupes, Équipes and
 * Joueurs so the header markup can't drift apart page to page (#243).
 * Journées keeps its own header — its sticky multi-control toolbar (phase
 * switcher, team shortcuts, journée switcher) is a different shape entirely.
 */
export function PageHeader({
  title,
  club,
  actions,
}: {
  title: string
  club?: { id: string; displayName: string; logoUpdatedAt?: string }
  actions?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {club && <ClubLogo clubId={club.id} logoUpdatedAt={club.logoUpdatedAt} size={56} />}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-semibold text-slate-800">{title}</h1>
        {club && <p className="text-slate-500">{club.displayName}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
