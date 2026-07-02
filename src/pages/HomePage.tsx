import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { Avatar } from '@/components/Avatar'
import { TeamBadge } from '@/components/TeamBadge'
import { GameQuickView } from '@/components/GameQuickView'
import { AvailabilityButtons, AvailabilityChip } from '@/components/Availability'
import { HomeIcon, AwayIcon, InfoIcon, Pill, PhaseSwitchButton } from '@/components/icons'
import { getTeamName } from '@/lib/teamName'
import { getVenue } from '@/lib/venue'
import { playersCommittedElsewhere } from '@/lib/matchdays'
import type { AvailabilityStatus, Team } from '@/types'

export function HomePage() {
  const { user, displayName, roleLabel } = useAuth()
  const {
    clubs, seasons, teams, players, phases, divisions, groups,
    matchDays, games, gameAvailabilities, gameSelections,
    setGameAvailability, clearGameAvailability,
  } = useAppData()
  const [quickGame, setQuickGame] = useState<{ gameId: string; teamId: string } | null>(null)
  const [myMatchesPhaseId, setMyMatchesPhaseId] = useState<string | undefined>(undefined)

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

  const clubTeamsInActivePhase = useMemo(
    () =>
      myActiveTeam && activePhase
        ? teams.filter((t) => t.clubId === myActiveTeam.clubId && t.phaseId === activePhase.id)
        : [],
    [teams, myActiveTeam, activePhase],
  )

  // Team number this player is already committed to on a game's round (so they
  // can't set availability for this team) — else undefined.
  const committedElsewhere = (gameId: string): number | undefined => {
    if (!myPlayerId || !myActiveTeam) return undefined
    const md = mdMap.get(games.find((g) => g.id === gameId)?.matchDayId ?? '')
    if (!md) return undefined
    return playersCommittedElsewhere(myActiveTeam.id, md.number, clubTeamsInActivePhase, games, matchDays, gameSelections).get(myPlayerId)
  }

  const isPlayerDashboard = !!myActiveTeam

  // Full match history (all phases the player took part in, across any of
  // their club's teams — games for a team they're not rostered on are tagged
  // "Renfort"). Mirrors the mobile Mes matchs screen.
  const myClubId = user?.clubId
  const teamByPhase = useMemo(() => {
    const map = new Map<string, Team>()
    if (myPlayerId) for (const t of teams) if (t.playerIds.includes(myPlayerId)) map.set(t.phaseId, t)
    return map
  }, [teams, myPlayerId])

  const myMatchesOrdered = useMemo(() => {
    const participated = new Set<string>(teamByPhase.keys())
    if (myPlayerId) {
      for (const sel of gameSelections) {
        if (!sel.playerIds.includes(myPlayerId)) continue
        const t = teams.find((x) => x.id === sel.teamId)
        if (t) participated.add(t.phaseId)
      }
    }
    return phases.filter((p) => participated.has(p.id)).sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [teamByPhase, gameSelections, teams, phases, myPlayerId])

  const myMatchesFallback =
    activePhase && myMatchesOrdered.some((p) => p.id === activePhase.id)
      ? activePhase
      : myMatchesOrdered[myMatchesOrdered.length - 1]
  const myMatchesPhase = phases.find((p) => p.id === myMatchesPhaseId) ?? myMatchesFallback
  const myMatchesIdx = myMatchesOrdered.findIndex((p) => p.id === myMatchesPhase?.id)

  const myGames = useMemo(() => {
    type Row = {
      gameId: string; team: Team; raw: string; date: string; jNumber: number
      isHome: boolean; oppName: string; isPast: boolean; isRenfort: boolean
    }
    if (!myMatchesPhase || !myPlayerId) return [] as Row[]
    const assigned = teamByPhase.get(myMatchesPhase.id)
    const phaseTeams = teams.filter(
      (t) => t.phaseId === myMatchesPhase.id && (myClubId ? t.clubId === myClubId : t.id === assigned?.id),
    )
    const out: Row[] = []
    const seen = new Set<string>()
    for (const t of phaseTeams) {
      for (const g of games) {
        if (g.homeTeamId !== t.id && g.awayTeamId !== t.id) continue
        const sel = gameSelections.find((s) => s.teamId === t.id && s.gameId === g.id)
        if (!sel?.playerIds.includes(myPlayerId) || seen.has(g.id)) continue
        const md = mdMap.get(g.matchDayId)
        if (!md) continue
        seen.add(g.id)
        const isHome = g.homeTeamId === t.id
        const opp = teams.find((x) => x.id === (isHome ? g.awayTeamId : g.homeTeamId))
        out.push({
          gameId: g.id,
          team: t,
          raw: md.date,
          jNumber: md.number,
          isHome,
          oppName: opp ? getTeamName(opp, clubs) : '—',
          date: new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          isPast: md.date < today,
          isRenfort: assigned ? t.id !== assigned.id : false,
        })
      }
    }
    return out.sort((a, b) => a.raw.localeCompare(b.raw))
  }, [myMatchesPhase, myPlayerId, myClubId, teamByPhase, teams, games, gameSelections, mdMap, clubs, today])

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
                  ? `${getTeamName(myActiveTeam, clubs)} – ${opp ? getTeamName(opp, clubs) : '?'}`
                  : `${opp ? getTeamName(opp, clubs) : '?'} – ${getTeamName(myActiveTeam, clubs)}`
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
                      <span className="text-slate-400">{isHome ? <HomeIcon className="h-4 w-4" /> : <AwayIcon className="h-4 w-4" />}</span>
                      {matchup}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {dateLabel}{g.time ? ` · ${g.time}` : ''}{getVenue(homeTeam, clubs) ? ` · ${getVenue(homeTeam, clubs)}` : ''}
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
                        <AvailabilityChip status={availOf(g.id)} />
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

      {/* Full match history across every phase the player took part in. */}
      {myPlayerId && myMatchesOrdered.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tous mes matchs</p>

          {myMatchesPhase && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <PhaseSwitchButton
                dir="prev"
                disabled={myMatchesIdx <= 0}
                onClick={() => myMatchesIdx > 0 && setMyMatchesPhaseId(myMatchesOrdered[myMatchesIdx - 1].id)}
              />
              <span className="font-display text-sm font-semibold text-slate-800">Saison {myMatchesPhase.displayName}</span>
              <PhaseSwitchButton
                dir="next"
                disabled={myMatchesIdx >= myMatchesOrdered.length - 1}
                onClick={() => myMatchesIdx < myMatchesOrdered.length - 1 && setMyMatchesPhaseId(myMatchesOrdered[myMatchesIdx + 1].id)}
              />
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {myGames.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Aucun match pour cette phase.</p>
            ) : (
              <ul className="px-5 py-2">
                {myGames.map((e) => (
                  <li key={e.gameId} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 first:border-t-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`w-6 text-xs font-bold ${e.isPast ? 'text-slate-400' : 'text-accent-600'}`}>J{e.jNumber}</span>
                      <span className={e.isPast ? 'text-slate-400' : 'text-slate-500'} title={e.isHome ? 'Domicile' : 'Extérieur'}>
                        {e.isHome ? <HomeIcon /> : <AwayIcon />}
                      </span>
                      <span className={`truncate text-sm ${e.isPast ? 'text-slate-400' : 'text-slate-800'}`}>{e.oppName}</span>
                      {e.isRenfort && (
                        <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">Renfort</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-sm ${e.isPast ? 'text-slate-400' : 'text-slate-500'}`}>{e.date}</span>
                      <button
                        type="button"
                        onClick={() => setQuickGame({ gameId: e.gameId, teamId: e.team.id })}
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
          </section>
        </div>
      )}

      {quickGame && (
        <GameQuickView gameId={quickGame.gameId} teamId={quickGame.teamId} onClose={() => setQuickGame(null)} />
      )}
    </div>
  )
}
