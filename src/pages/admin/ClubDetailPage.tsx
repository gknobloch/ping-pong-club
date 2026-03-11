import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { ClubDetailView } from '@/components/ClubDetailView'

export function ClubDetailPage() {
  const { affiliationNumber } = useParams<{ affiliationNumber: string }>()
  const navigate = useNavigate()
  const { clubs, archiveClub } = useAppData()
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

  const handleArchive = () => {
    if (window.confirm(`Archiver le club "${club.displayName}" ? Il ne sera plus visible dans la liste active.`)) {
      archiveClub(club.id)
      navigate('/clubs')
    }
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
        <h1 className="font-display text-2xl font-semibold text-slate-800">
          {club.displayName}
          {club.isArchived && (
            <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-sm font-normal text-slate-600">
              Archivé
            </span>
          )}
        </h1>
      </div>
      <ClubDetailView
        club={club}
        canEdit={!club.isArchived}
        canEditAffiliationNumber
        onClubSaved={({ affiliationNumber: newNum }) =>
          navigate(`/clubs/${encodeURIComponent(newNum)}`, { replace: true })
        }
        idPrefix="admin-club"
      />
      {!club.isArchived && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-sm font-medium text-red-800">Zone dangereuse</h2>
          <p className="mt-1 text-sm text-red-700">
            Archiver ce club le masquera de la liste active. Cette action est réversible.
          </p>
          <button
            type="button"
            onClick={handleArchive}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Archiver ce club
          </button>
        </div>
      )}
    </div>
  )
}
