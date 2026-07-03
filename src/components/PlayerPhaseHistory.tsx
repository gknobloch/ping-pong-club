import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { computeBrulage } from '@/lib/brulage'
import { getTeamName } from '@/lib/teamName'
import { TeamBadge } from '@/components/TeamBadge'
import { GameQuickView } from '@/components/GameQuickView'
import { HomeIcon, AwayIcon, InfoIcon } from '@/components/icons'
import type { Team } from '@/types'

type HistoryEntry = {
  gameId: string
  teamId: string
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
  /** Played / total past games for `team` this phase — undefined with no rostered team. */
  played?: number
  total?: number
  /** Past games played for another of the club's teams (renfort) this phase. */
  borrowedPlayed: number
  history: HistoryEntry[]
}

// One card per phase a player took part in (rostered or fielded for another of
// the club's teams), side by side on wide screens, stacked otherwise. Shared
// by PlayerDetailPage (viewing any player) and HomePage (the logged-in
// player's own "Tous mes matchs").
export function PlayerPhaseHistory({ playerId, title }: { playerId: string; title?: string }) {
  const { players, teams, clubs, phases, matchDays, games, gameSelections } = useAppData()
  const [quickGame, setQuickGame] = useState<{ gameId: string; teamId: string } | null>(null)

  const player = players.find((p) => p.id === playerId)
  const today = new Date().toISOString().slice(0, 10)

  const phaseBlocks = useMemo<PhaseBlock[]>(() => {
    if (!player) return []

    const participated = new Set<string>()
    for (const t of teams) if (t.playerIds?.includes(playerId)) participated.add(t.phaseId)
    for (const sel of gameSelections) {
      if (!sel.playerIds.includes(playerId)) continue
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
        const rosterTeam = clubTeamsInPhase.find((t) => t.playerIds?.includes(playerId))
        const info = computeBrulage(playerId, clubTeamsInPhase, matchDays, games, gameSelections)
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
            if (!sel?.playerIds.includes(playerId)) continue
            const md = matchDays.find((m) => m.id === g.matchDayId)
            if (!md) continue
            const isHome = g.homeTeamId === t.id
            const opp = teams.find((ot) => ot.id === (isHome ? g.awayTeamId : g.homeTeamId))
            rows.push({
              raw: md.date,
              e: {
                gameId: g.id,
                teamId: t.id,
                jNumber: md.number,
                isHome,
                oppName: opp ? getTeamName(opp, clubs) : '—',
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

        let played: number | undefined
        let total: number | undefined
        if (rosterTeam) {
          const teamPastGames = games.filter((g) => {
            if (g.homeTeamId !== rosterTeam.id && g.awayTeamId !== rosterTeam.id) return false
            const md = matchDays.find((m) => m.id === g.matchDayId)
            return md && md.date < today
          })
          total = teamPastGames.length
          played = teamPastGames.filter((g) =>
            gameSelections.find((s) => s.teamId === rosterTeam.id && s.gameId === g.id)?.playerIds.includes(playerId),
          ).length
        }
        // Past games played for a *different* club team this phase (renfort) —
        // not part of `total` (that's the rostered team's own schedule), so
        // called out separately rather than folded into `played`.
        const borrowedPlayed = rows.filter((r) => r.e.isPast && r.e.teamId !== rosterTeam?.id).length

        return {
          phaseId: ph.id,
          label: `Saison ${ph.displayName}`,
          team: rosterTeam,
          isCaptain: rosterTeam?.captainId === playerId,
          points: rosterTeam?.rosterInitialPoints?.[playerId],
          brulageTeam,
          played,
          total,
          borrowedPlayed,
          history: rows.sort((a, b) => a.raw.localeCompare(b.raw)).map((r) => r.e),
        }
      })
  }, [player, playerId, teams, phases, matchDays, games, gameSelections, clubs, today])

  if (phaseBlocks.length === 0) return null

  return (
    <div className="space-y-3">
      {title && <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>}
      <div className={`grid gap-5 ${phaseBlocks.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {phaseBlocks.map((b) => (
          <section
            key={b.phaseId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <h2 className="min-w-0 truncate font-display text-base font-semibold text-slate-800">{b.label}</h2>
              {b.total !== undefined && (
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {b.played}{b.borrowedPlayed > 0 ? ` + ${b.borrowedPlayed}` : ''} / {b.total} joués
                </span>
              )}
            </div>
            <dl className="divide-y divide-slate-100 px-5">
              {b.points && <InfoRow label="Points" value={b.points} />}
              {b.team && (
                <TeamRow
                  label="Équipe"
                  name={getTeamName(b.team, clubs)}
                  color={b.team.color}
                  captain={b.isCaptain}
                  to={`/equipes/${b.team.id}`}
                />
              )}
              {b.brulageTeam && (
                <TeamRow
                  label="Brûlage"
                  name={getTeamName(b.brulageTeam, clubs)}
                  color={b.brulageTeam.color}
                  danger
                  to={`/equipes/${b.brulageTeam.id}`}
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
                            className={`w-6 text-xs font-bold ${e.isPast ? 'text-slate-500' : 'text-accent-600'}`}
                          >
                            J{e.jNumber}
                          </span>
                        )}
                        <TeamPill number={e.teamNumber} color={e.teamColor} small />
                        <span className="text-slate-500" title={e.isHome ? 'Domicile' : 'Extérieur'}>
                          {e.isHome ? <HomeIcon /> : <AwayIcon />}
                        </span>
                        <span className={`truncate text-sm ${e.isPast ? 'text-slate-500' : 'text-slate-800'}`}>
                          {e.oppName}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm text-slate-500">{e.date}</span>
                        <button
                          type="button"
                          onClick={() => setQuickGame({ gameId: e.gameId, teamId: e.teamId })}
                          className="text-slate-300 hover:text-accent-600"
                          title="Détails du match"
                          aria-label="Détails du match"
                        >
                          <InfoIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {quickGame && (
        <GameQuickView
          gameId={quickGame.gameId}
          teamId={quickGame.teamId}
          onClose={() => setQuickGame(null)}
        />
      )}
    </div>
  )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  )
}

// Aligned team / brûlage row: label + TeamBadge (+ Cap. badge), matching the
// mobile player quick view.
function TeamRow({
  label,
  name,
  color,
  captain,
  danger,
  to,
}: {
  label: string
  name: string
  color?: string
  captain?: boolean
  danger?: boolean
  to?: string
}) {
  const badge = <TeamBadge color={color} label={name} danger={danger} />
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        {captain && (
          <span className="rounded-md bg-accent-50 px-1.5 py-0.5 text-xs font-semibold text-accent-600">
            Cap.
          </span>
        )}
        {to ? (
          <Link to={to} className="hover:opacity-80" title="Voir la fiche équipe">
            {badge}
          </Link>
        ) : (
          badge
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
