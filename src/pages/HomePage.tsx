import { useAuth } from '@/contexts/AuthContext'
import { useMockData } from '@/contexts/MockDataContext'

export function HomePage() {
  const { user, displayName, roleLabel } = useAuth()
  const { clubs } = useMockData()
  const adminClubNames =
    user?.clubIds
      ?.map((id) => clubs.find((c) => c.id === id)?.displayName)
      .filter(Boolean)
      .join(', ') ?? ''

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-slate-800">
          Bienvenue, {displayName}
        </h1>
        <p className="mt-2 text-slate-600">
          Vous êtes connecté en tant que <strong>{roleLabel}</strong>.
        </p>
        {user?.role === 'club_admin' && adminClubNames && (
          <p className="mt-2 text-slate-600">
            Vous gérez le(s) club(s) : <strong>{adminClubNames}</strong>.
          </p>
        )}
        <p className="mt-4 text-slate-500 text-sm">
          Utilisez le menu pour accéder aux différentes sections de l&apos;application.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
        <h2 className="font-display text-lg font-medium text-slate-700">
          Application de gestion des disponibilités
        </h2>
        <p className="mt-2 text-slate-600 text-sm">
          Gestion des joueurs, équipes et disponibilités pour les matchs de tennis de table.
        </p>
      </section>
    </div>
  )
}
