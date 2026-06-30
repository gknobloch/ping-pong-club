import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { Avatar } from '@/components/Avatar'
import { TeamBadge } from '@/components/TeamBadge'
import { GameQuickView } from '@/components/GameQuickView'
import { AvailabilityButtons } from '@/components/AvailabilityButtons'
import type { AvailabilityStatus, Club, Team } from '@/types'

const teamName = (t: Team, clubs: Club[]) => {
  const club = clubs.find((c) => c.id === t.clubId)
  return club ? `${club.displayName} ${t.number}` : `Équipe ${t.number}`
}

export function HomePage() {
  const { user, displayName, roleLabel } = useAuth()
  const {
    clubs, seasons, teams, players, phases, divisions, groups,
    matchDays, games, gameAvailabilities, gameSelections,
    setGameAvailability, clearGameAvailability,
  } = useAppData()
  const [quickGame, setQuickGame] = useState<{ gameId: string; teamId: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const myPlayerId = user?.isPlayer ? user.id : undefined
  const me = myPlayerId ? players.find((p) => p.id === myPlayerId) : undefined
  const myClub = clubs.find((c) => c.id === (me?.clubId ?? user?.clubId))

  const activeSeason = seasons.find((s) => s.isActive)
  const activePhase = phases.find((p) => p.isActive)
  const myActiveTeam = useMemo(
    () =>
      myPlayerId && activePhase
        ? teams.find((t) => t.phaseId === activePhase.id && t.playerIds.includes(myPlayerId))
        : undefined,
    [teams, activePhase, myPlayerId],
  )

  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])

  const teamGames = useMemo(
    () =>
      myActiveTeam
        ? games.filter((g) => g.homeTeamId === myActiveTeam.id || g.awayTeamId === myActiveTeam.id)
        : [],
    [games, myActiveTeam],
  )
  const upcoming = useMemo(
    () =>
      teamGames
        .filter((g) => { const md = mdMap.get(g.matchDayId); return md && md.date >= today })
        .sort((a, b) => (mdMap.get(a.matchDayId)?.date ?? '').localeCompare(mdMap.get(b.matchDayId)?.date ?? '')),
    [teamGames, mdMap, today],
  )

  const availOf = (gameId: string): AvailabilityStatus | undefined =>
    myPlayerId ? gameAvailabilities.find((a) => a.playerId === myPlayerId && a.gameId === gameId)?.status : undefined
  const selectedIn = (gameId: string) =>
    !!(myActiveTeam && myPlayerId &&
      gameSelections.find((s) => s.teamId === myActiveTeam.id && s.gameId === gameId)?.playerIds.includes(myPlayerId))

  const pastGames = teamGames.filter((g) => { const md = mdMap.get(g.matchDayId); return md && md.date < today })
  const playedCount = pastGames.filter((g) => selectedIn(g.id)).length
  const toConfirm = upcoming.filter((g) => availOf(g.id) === undefined).length

  const divisionOf = (team: Team) => {
    const grp = groups.find((g) => g.id === team.groupId)
    return grp ? divisions.find((d) => d.id === grp.divisionId)?.displayName : undefined
  }
  const venueOf = (homeTeam?: Team) => {
    if (!homeTeam) return undefined
    const addr = clubs.flatMap((c) => c.addresses ?? []).find((a) => a.id === homeTeam.gameLocationId)
    if (addr) return addr.label ? `${addr.label}, ${addr.city}` : addr.city
    const hc = clubs.find((c) => c.id === homeTeam.clubId)
    return (hc?.addresses?.find((a) => a.isDefault) ?? hc?.addresses?.[0])?.city
  }

  // Team number this player is already committed to on a game's round (so they
  // can't set availability for this team) — else undefined.
  const committedElsewhere = (gameId: string): number | undefined => {
    if (!myPlayerId || !myActiveTeam || !activePhase) return undefined
    const md = mdMap.get(games.find((g) => g.id === gameId)?.matchDayId ?? '')
    if (!md) return undefined
    for (const sel of gameSelections) {
      if (sel.teamId === myActiveTeam.id || !sel.playerIds.includes(myPlayerId)) continue
      const t = teams.find((x) => x.id === sel.teamId)
      if (!t || t.clubId !== myActiveTeam.clubId || t.phaseId !== activePhase.id) continue
      const g = games.find((x) => x.id === sel.gameId)
      if (g && mdMap.get(g.matchDayId)?.number === md.number) return t.number
    }
    return undefined
  }

  const isPlayerDashboard = !!myActiveTeam

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Welcome / identity */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {me ? (
          <Avatar playerId={me.id} avatarUpdatedAt={me.avatarUpdatedAt} firstName={me.firstName} lastName={me.lastName} size={56} />
        ) : null}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            Bienvenue, {displayName}
          </h1>
          <p className="text-slate-500">{myClub ? myClub.displayName : roleLabel}</p>
        </div>
      </div>

      {isPlayerDashboard && myActiveTeam ? (
        <>
          {/* Upcoming matches — set your availability inline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {upcoming.length > 1 ? 'Prochains matchs' : 'Prochain match'}
            </p>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                Pas de prochain match prévu.
              </div>
            ) : (
              upcoming.map((g) => {
                const md = mdMap.get(g.matchDayId)!
                const isHome = g.homeTeamId === myActiveTeam.id
                const opp = teams.find((t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId))
                const homeTeam = teams.find((t) => t.id === g.homeTeamId)
                const matchup = isHome
                  ? `${teamName(myActiveTeam, clubs)} – ${opp ? teamName(opp, clubs) : '?'}`
                  : `${opp ? teamName(opp, clubs) : '?'} – ${teamName(myActiveTeam, clubs)}`
                const dateLabel = new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })
                const locked = committedElsewhere(g.id)
                return (
                  <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill>J{md.number}</Pill>
                      {divisionOf(myActiveTeam) && <Pill>{divisionOf(myActiveTeam)}</Pill>}
                      <TeamBadge color={myActiveTeam.color} label={`Équipe ${myActiveTeam.number}`} />
                    </div>
                    <h2 className="mt-2 flex items-center gap-2 font-display text-lg font-semibold text-slate-800">
                      <span className="text-slate-400">{isHome ? <HomeIcon /> : <AwayIcon />}</span>
                      {matchup}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {dateLabel}{g.time ? ` · ${g.time}` : ''}{venueOf(homeTeam) ? ` · ${venueOf(homeTeam)}` : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {locked !== undefined ? (
                        <span className="text-xs italic text-slate-500">Joue en Équipe {locked}</span>
                      ) : myPlayerId ? (
                        <AvailabilityButtons
                          status={availOf(g.id)}
                          onSet={(s) => setGameAvailability(g.id, myPlayerId, s)}
                          onClear={() => clearGameAvailability(g.id, myPlayerId)}
                        />
                      ) : (
                        <AvailChip status={availOf(g.id)} />
                      )}
                      <button
                        type="button"
                        onClick={() => setQuickGame({ gameId: g.id, teamId: myActiveTeam.id })}
                        className="shrink-0 text-sm font-medium text-accent-600 hover:text-accent-800"
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Matchs joués</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{playedCount} / {pastGames.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">À confirmer</p>
              <p className={`mt-1 text-2xl font-bold ${toConfirm > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {toConfirm} match{toConfirm !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* All my matches → player profile (lists matches per phase; #177 adds a dedicated view) */}
          {me && (
            <Link
              to={`/joueurs/${me.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-accent-300"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">Tous mes matchs</span>
                {activeSeason && <span className="block text-xs text-slate-500">Saison {activeSeason.displayName}</span>}
              </span>
              <span className="text-slate-400">›</span>
            </Link>
          )}
        </>
      ) : (
        /* Generic view for non-players (admins) */
        <>
          {activeSeason && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saison en cours</h2>
              <p className="mt-1 text-lg font-semibold text-slate-800">{activeSeason.displayName}</p>
            </section>
          )}
          {(() => {
            const next = matchDays
              .filter((md) => md.date >= today)
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 3)
            if (next.length === 0) return null
            return (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <h2 className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Prochaines journées
                </h2>
                <ul>
                  {next.map((md) => {
                    const count = games.filter((g) => g.matchDayId === md.id).length
                    return (
                      <li key={md.id} className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">Journée {md.number}</span>
                          <span className="block text-xs text-slate-500">
                            {new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </span>
                        <span className="text-sm text-slate-500">{count} match{count > 1 ? 's' : ''}</span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })()}
        </>
      )}

      {quickGame && (
        <GameQuickView gameId={quickGame.gameId} teamId={quickGame.teamId} onClose={() => setQuickGame(null)} />
      )}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
      {children}
    </span>
  )
}

function AvailChip({ status }: { status?: AvailabilityStatus }) {
  const map = {
    available: { label: 'Disponible', cls: 'border-green-500 bg-green-50 text-green-700' },
    maybe: { label: 'Peut-être', cls: 'border-amber-500 bg-amber-50 text-amber-700' },
    unavailable: { label: 'Indisponible', cls: 'border-accent-500 bg-accent-50 text-accent-600' },
  } as const
  const v = status ? map[status] : { label: 'À confirmer', cls: 'border-slate-200 bg-slate-50 text-slate-500' }
  return <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span>
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function AwayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
