import type { ReactNode } from 'react'

/**
 * Shared "identity" header for entity/profile screens (Compte, MyClub,
 * PlayerDetail, TeamDetail) — the same rounded box as PageHeader, but with a
 * flexible leading slot (avatar / club logo / colored badge) and free-form
 * content under the title instead of a fixed subtitle, since these vary more
 * than a list screen's plain title + actions (#243 follow-up).
 */
export function IdentityCard({
  leading,
  title,
  trailing,
  children,
}: {
  leading?: ReactNode
  title: ReactNode
  trailing?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-semibold text-slate-800">{title}</h1>
        {children}
      </div>
      {trailing}
    </div>
  )
}
