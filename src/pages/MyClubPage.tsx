import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { ClubDetailView } from '@/components/ClubDetailView'

export function MyClubPage() {
  const { user } = useAuth()
  const { clubs } = useAppData()

  const clubId =
    user && user.clubIds && user.clubIds.length > 0 ? user.clubIds[0] : null
  const currentClub = clubId
    ? (clubs.find((c) => c.id === clubId) ?? null)
    : null
  const canEdit = user !== null && user.role === 'club_admin'

  if (!user?.clubIds?.length || !clubId) {
    return <Navigate to="/" replace />
  }

  if (!currentClub) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">Club introuvable.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-800">Mon club</h1>
      {!canEdit && (
        <p className="text-sm text-slate-600">
          Seul l’administrateur du club peut modifier les informations et adresses.
        </p>
      )}
      <ClubDetailView club={currentClub} canEdit={canEdit} idPrefix="my-club" />
    </div>
  )
}
