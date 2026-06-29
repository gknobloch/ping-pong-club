import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { computeBrulage } from '@/lib/brulage'
import { Avatar } from '@/components/Avatar'
import type { Club, Team } from '@/types'

const teamName = (t: Team, clubs: Club[]) => {
  const club = clubs.find((c) => c.id === t.clubId)
  return club ? `${club.displayName} ${t.number}` : `Équipe ${t.number}`
}

type HistoryEntry = {
  jNumber?: number
  isHome: boolean
  oppName: string
  teamNumber: number
  teamColor?: string
  date: string
  isPast: boolean
}

type PhaseBlock = {
  phaseId: string
  label: string
  team?: Team
  isCaptain: boolean
  points?: string
  brulageTeam: Team | null
  history: HistoryEntry[]
}

export function PlayerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { players, teams, clubs, phases, matchDays, games, gameSelections } = useAppData()
  const [zoom, setZoom] = useState(false)

  const player = players.find((p) => p.id === id)
  const club = clubs.find((c) => c.id === player?.clubId)
  const today = new Date().toISOString().slice(0, 10)

  // One block per phase the player took part in (rostered or fielded), each with
  // its own team / points / brûlage / games — all relative to that phase.
  const phaseBlocks = useMemo<PhaseBlock[]>(() => {
    if (!player) return []

    const participated = new Set<string>()
    for (const t of teams) if (t.playerIds?.includes(id)) participated.add(t.phaseId)
    for (const sel of gameSelections) {
      if (!sel.playerIds.includes(id)) continue
      const t = teams.find((x) => x.id === sel.teamId)
      if (t) participated.add(t.phaseId)
    }

    return phases
      .filter((p) => participated.has(p.id))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((ph) => {
        const clubTeamsInPhase = teams.filter(
          (t) => t.clubId === player.clubId && t.phaseId === ph.id,
        )
        const rosterTeam = clubTeamsInPhase.find((t) => t.playerIds?.includes(id))
        const info = computeBrulage(id, clubTeamsInPhase, matchDays, games, gameSelections)
        const brulageTeam = info.burnedIntoTeamId
          ? teams.find((t) => t.id === info.burnedIntoTeamId) ?? null
          : null

        const rows: { e: HistoryEntry; raw: string }[] = []
        for (const t of clubTeamsInPhase) {
          const mdInGroup = new Set(
            matchDays.filter((md) => md.groupId === t.groupId).map((md) => md.id),
          )
          for (const g of games) {
            if ((g.homeTeamId !== t.id && g.awayTeamId !== t.id) || !mdInGroup.has(g.matchDayId)) continue
            const sel = gameSelections.find((s) => s.teamId === t.id && s.gameId === g.id)
            if (!sel?.playerIds.includes(id)) continue
            const md = matchDays.find((m) => m.id === g.matchDayId)
            if (!md) continue
            const isHome = g.homeTeamId === t.id
            const opp = teams.find((ot) => ot.id === (isHome ? g.awayTeamId : g.homeTeamId))
            rows.push({
              raw: md.date,
              e: {
                jNumber: md.number,
                isHome,
                oppName: opp ? teamName(opp, clubs) : '—',
                teamNumber: t.number,
                teamColor: t.color,
                date: new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                }),
                isPast: md.date < today,
              },
            })
          }
        }

        return {
          phaseId: ph.id,
          label: `Saison ${ph.displayName}`,
          team: rosterTeam,
          isCaptain: rosterTeam?.captainId === id,
          points: rosterTeam?.rosterInitialPoints?.[id],
          brulageTeam,
          history: rows.sort((a, b) => a.raw.localeCompare(b.raw)).map((r) => r.e),
        }
      })
  }, [player, id, teams, phases, matchDays, games, gameSelections, clubs, today])

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
    <div className="mx-auto max-w-4xl space-y-5">
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
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            {player.firstName} {player.lastName}
          </h1>
          {club && <p className="text-slate-500">{club.displayName}</p>}
        </div>
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

      {/* One card per phase — side by side on wide screens, stacked otherwise */}
      {phaseBlocks.length > 0 && (
        <div className={`grid gap-5 ${phaseBlocks.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {phaseBlocks.map((b) => (
            <section
              key={b.phaseId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <h2 className="border-b border-slate-100 px-5 py-3 font-display text-base font-semibold text-slate-800">
                {b.label}
              </h2>
              <dl className="divide-y divide-slate-100 px-5">
                {b.team && (
                  <TeamRow
                    label="Équipe"
                    label2={teamName(b.team, clubs)}
                    number={b.team.number}
                    color={b.team.color}
                    captain={b.isCaptain}
                  />
                )}
                {b.points && <InfoRow label="Points" value={b.points} />}
                {b.brulageTeam && (
                  <TeamRow
                    label="Brûlage"
                    label2={teamName(b.brulageTeam, clubs)}
                    number={b.brulageTeam.number}
                    color={b.brulageTeam.color}
                    danger
                  />
                )}
              </dl>

              <div className="border-t border-slate-100 px-5 pb-3 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Matchs ({b.history.length})
                </p>
                {b.history.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400">Aucun match.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {b.history.map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {e.jNumber != null && (
                            <span
                              className={`w-6 text-xs font-bold ${e.isPast ? 'text-slate-400' : 'text-accent-600'}`}
                            >
                              J{e.jNumber}
                            </span>
                          )}
                          <TeamPill number={e.teamNumber} color={e.teamColor} small />
                          <span className={`text-xs ${e.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                            {e.isHome ? 'Dom.' : 'Ext.'}
                          </span>
                          <span
                            className={`truncate text-sm ${e.isPast ? 'text-slate-400' : 'text-slate-800'}`}
                          >
                            {e.oppName}
                          </span>
                        </div>
                        <span className={`text-sm ${e.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                          {e.date}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  )
}

// Aligned team / brûlage row: label + colored pill + team name (+ Cap. badge).
function TeamRow({
  label,
  label2,
  number,
  color,
  captain,
  danger,
}: {
  label: string
  label2: string
  number: number
  color?: string
  captain?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <TeamPill number={number} color={color} danger={danger} />
        <span className="truncate text-sm font-medium text-slate-800">{label2}</span>
        {captain && (
          <span className="rounded-md bg-accent-50 px-1.5 py-0.5 text-xs font-semibold text-accent-600">
            Cap.
          </span>
        )}
      </dd>
    </div>
  )
}

// Small colored team-number pill — a circle for one digit, a pill for two.
function TeamPill({
  number,
  color,
  small,
  danger,
}: {
  number: number
  color?: string
  small?: boolean
  danger?: boolean
}) {
  const c = color ?? '#e23b3b'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold ${
        small ? 'h-[18px] min-w-[18px] px-1 text-[11px]' : 'h-6 min-w-6 px-1.5 text-xs'
      }`}
      style={{ color: c, borderColor: c, backgroundColor: `${c}1a` }}
      title={danger ? 'Brûlé dans cette équipe' : undefined}
    >
      {number}
    </span>
  )
}
