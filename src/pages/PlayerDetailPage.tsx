import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { Avatar } from '@/components/Avatar'
import { ClubLogo } from '@/components/ClubLogo'
import { PlayerPhaseHistory, InfoRow } from '@/components/PlayerPhaseHistory'

export function PlayerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { players, clubs } = useAppData()
  const [zoom, setZoom] = useState(false)

  const player = players.find((p) => p.id === id)
  const club = clubs.find((c) => c.id === player?.clubId)

  if (!player) {
    return (
      <div className="space-y-4">
        <Link to="/joueurs" className="text-sm font-medium text-accent-600 hover:text-accent-800">
          ← Joueurs
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Joueur introuvable.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link to="/joueurs" className="text-sm font-medium text-accent-600 hover:text-accent-800">
        ← Joueurs
      </Link>

      {/* Identity */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => player.avatarUpdatedAt && setZoom(true)}
          className={player.avatarUpdatedAt ? 'cursor-zoom-in' : 'cursor-default'}
          aria-label="Agrandir l'avatar"
        >
          <Avatar
            playerId={player.id}
            avatarUpdatedAt={player.avatarUpdatedAt}
            firstName={player.firstName}
            lastName={player.lastName}
            size={64}
          />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            {player.firstName} {player.lastName}
          </h1>
          {club && <p className="text-slate-500">{club.displayName}</p>}
        </div>
        {club && <ClubLogo clubId={club.id} logoUpdatedAt={club.logoUpdatedAt} size={64} />}
      </div>

      {/* Informations (player-level — not phase-relative) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Informations
        </h2>
        <dl className="divide-y divide-slate-100">
          {player.licenseNumber && <InfoRow label="Licence" value={player.licenseNumber} />}
          {player.email && <InfoRow label="Email" value={player.email} />}
          {player.phone && <InfoRow label="Téléphone" value={player.phone} />}
        </dl>
      </section>

      <PlayerPhaseHistory playerId={player.id} />

      {/* Avatar lightbox */}
      {zoom && player.avatarUpdatedAt && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <Avatar
            playerId={player.id}
            avatarUpdatedAt={player.avatarUpdatedAt}
            firstName={player.firstName}
            lastName={player.lastName}
            size={280}
          />
        </div>
      )}
    </div>
  )
}
