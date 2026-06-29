import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '@/contexts/DataContext'
import { teamPhaseEntries } from '@/lib/teamPhases'
import { sortByName } from '@/lib/sortByName'
import { Avatar } from '@/components/Avatar'
import { GameQuickView } from '@/components/GameQuickView'
import type { Club, Team } from '@/types'

const teamName = (t: Team, clubs: Club[]) => {
  const club = clubs.find((c) => c.id === t.clubId)
  return club ? `${club.displayName} ${t.number}` : `Équipe ${t.number}`
}

// Player/captain-facing team detail: identity + a phase switcher paging the
// phases this team (club + number) has played, each showing the roster with
// per-player play-counts and the games. Mirrors the mobile team detail +
// phase-games screens.
export function TeamDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { teams, players, clubs, phases, divisions, matchDays, games, gameSelections } = useAppData()
  const [phaseId, setPhaseId] = useState<string | undefined>(undefined)
  const [quickGame, setQuickGame] = useState<{ gameId: string; teamId: string } | null>(null)

  const baseTeam = teams.find((t) => t.id === id)
  const today = new Date().toISOString().slice(0, 10)

  // Phases this team played, chronological for the switcher.
  const ordered = useMemo(
    () =>
      baseTeam
        ? teamPhaseEntries(baseTeam, teams, phases, matchDays, games).sort((a, b) =>
            a.label.localeCompare(b.label),
          )
        : [],
    [baseTeam, teams, phases, matchDays, games],
  )

  // Default to the opened team's phase, else active, else most recent.
  const fallbackPhaseId =
    ordered.find((e) => e.phaseId === baseTeam?.phaseId)?.phaseId ??
    ordered.find((e) => e.isActive)?.phaseId ??
    ordered[ordered.length - 1]?.phaseId
  const current = ordered.find((e) => e.phaseId === (phaseId ?? fallbackPhaseId)) ?? ordered[0]
  const idx = ordered.findIndex((e) => e.phaseId === current?.phaseId)

  const team = teams.find((t) => t.id === current?.teamId) ?? baseTeam
  const division = divisions.find((d) => d.id === team?.divisionId)
  const games_ = current?.games ?? []
  const totalGames = games_.length

  // Roster with play-counts + borrowed players (renforts), for the selected phase.
  const { roster, borrowed, playedCount } = useMemo(() => {
    const counts = new Map<string, number>()
    const sels = team ? gameSelections.filter((s) => s.teamId === team.id) : []
    for (const sel of sels) for (const pid of sel.playerIds) counts.set(pid, (counts.get(pid) ?? 0) + 1)
    const rosterIds = new Set(team?.playerIds ?? [])
    const rosterPlayers = sortByName(
      (team?.playerIds ?? []).map((pid) => players.find((p) => p.id === pid)).filter(Boolean) as typeof players,
    )
    const borrowedPlayers = sortByName(
      [...counts.keys()]
        .filter((pid) => !rosterIds.has(pid))
        .map((pid) => players.find((p) => p.id === pid))
        .filter(Boolean) as typeof players,
    )
    return { roster: rosterPlayers, borrowed: borrowedPlayers, playedCount: counts }
  }, [team, gameSelections, players])

  if (!baseTeam || !team) {
    return (
      <div className="space-y-4">
        <Link to="/equipes" className="text-sm font-medium text-accent-600 hover:text-accent-800">
          ← Équipes
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Équipe introuvable.
        </div>
      </div>
    )
  }

  const memberCount = roster.length + borrowed.length

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/equipes" className="text-sm font-medium text-accent-600 hover:text-accent-800">
        ← Équipes
      </Link>

      {/* Identity */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: team.color ?? '#e23b3b' }}
        >
          {team.number}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            {teamName(team, clubs)}
          </h1>
          {division && <p className="text-slate-500">{division.displayName}</p>}
        </div>
      </div>

      {/* Phase switcher */}
      {current && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <SwitchBtn
            dir="prev"
            disabled={idx <= 0}
            onClick={() => idx > 0 && setPhaseId(ordered[idx - 1].phaseId)}
          />
          <span className="font-display text-sm font-semibold text-slate-800">{current.label}</span>
          <SwitchBtn
            dir="next"
            disabled={idx >= ordered.length - 1}
            onClick={() => idx < ordered.length - 1 && setPhaseId(ordered[idx + 1].phaseId)}
          />
        </div>
      )}

      {/* Roster with play-counts */}
      {memberCount > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Joueurs ({memberCount})
          </h2>
          <ul>
            {roster.map((p) => (
              <RosterRow
                key={p.id}
                player={p}
                captain={p.id === team.captainId}
                played={playedCount.get(p.id) ?? 0}
                total={totalGames}
              />
            ))}
            {borrowed.map((p) => (
              <RosterRow
                key={p.id}
                player={p}
                renfort
                played={playedCount.get(p.id) ?? 0}
                total={totalGames}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Games */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Matchs ({totalGames})
        </h2>
        {totalGames === 0 ? (
          <p className="px-5 pb-4 text-sm text-slate-400">Aucun match.</p>
        ) : (
          <ul className="px-5 pb-2">
            {games_.map((g) => {
              const md = g.matchDay
              const isHome = g.homeTeamId === team.id
              const opp = teams.find((t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId))
              const isPast = md ? md.date < today : false
              const dateLabel = md
                ? new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : ''
              return (
                <li key={g.id} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2 first:border-t-0">
                  <div className="flex min-w-0 items-center gap-2">
                    {md && (
                      <span className={`w-6 text-xs font-bold ${isPast ? 'text-slate-400' : 'text-accent-600'}`}>
                        J{md.number}
                      </span>
                    )}
                    <span className={isPast ? 'text-slate-400' : 'text-slate-500'} title={isHome ? 'Domicile' : 'Extérieur'}>
                      {isHome ? <HomeIcon /> : <AwayIcon />}
                    </span>
                    <span className={`truncate text-sm ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>
                      {opp ? teamName(opp, clubs) : '—'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-sm ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>{dateLabel}</span>
                    <button
                      type="button"
                      onClick={() => setQuickGame({ gameId: g.id, teamId: team.id })}
                      className="text-slate-300 hover:text-accent-600"
                      title="Détails du match"
                      aria-label="Détails du match"
                    >
                      <InfoIcon />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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

function RosterRow({
  player,
  captain,
  renfort,
  played,
  total,
}: {
  player: { id: string; firstName: string; lastName: string; avatarUpdatedAt?: string }
  captain?: boolean
  renfort?: boolean
  played: number
  total: number
}) {
  return (
    <li className="flex items-center gap-3 border-t border-slate-100 px-5 py-2.5">
      <Link to={`/joueurs/${player.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-accent-600">
        <Avatar
          playerId={player.id}
          avatarUpdatedAt={player.avatarUpdatedAt}
          firstName={player.firstName}
          lastName={player.lastName}
          size={28}
        />
        <span className="truncate text-sm text-slate-800">
          {player.firstName} {player.lastName}
        </span>
      </Link>
      {captain && (
        <span className="rounded-md bg-accent-50 px-1.5 py-0.5 text-xs font-semibold text-accent-600">Cap.</span>
      )}
      {renfort && (
        <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-500">
          Renfort
        </span>
      )}
      <span className="w-10 text-right text-sm font-semibold text-slate-500">
        {played}/{total}
      </span>
    </li>
  )
}

function SwitchBtn({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Phase précédente' : 'Phase suivante'}
      className={`rounded-lg p-1.5 ${disabled ? 'text-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        {dir === 'prev' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function AwayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
