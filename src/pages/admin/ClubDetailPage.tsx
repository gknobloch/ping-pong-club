import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { ClubDetailView } from '@/components/ClubDetailView'

export function ClubDetailPage() {
  const { affiliationNumber } = useParams<{ affiliationNumber: string }>()
  const navigate = useNavigate()
  const { clubs } = useAppData()
  const club =
    affiliationNumber != null
      ? clubs.find((c) => c.affiliationNumber === affiliationNumber) ?? null
      : null

  if (!affiliationNumber || !club) {
    return (
      <div className="space-y-6">
        <p className="text-slate-600">Club introuvable.</p>
        <Link to="/clubs" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          ← Retour à la liste des clubs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          ← Retour à la liste des clubs
        </Link>
        <h1 className="font-display text-2xl font-semibold text-slate-800">{club.displayName}</h1>
      </div>
      <ClubDetailView
        club={club}
        canEdit
        canEditAffiliationNumber
        onClubSaved={({ affiliationNumber: newNum }) =>
          navigate(`/clubs/${encodeURIComponent(newNum)}`, { replace: true })
        }
        idPrefix="admin-club"
      />
    </div>
  )
}
