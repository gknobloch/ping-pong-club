import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { GameQuickView } from '@/components/GameQuickView'
import type { Club, Team } from '@/types'

const teamName = (t: Team, clubs: Club[]) => {
  const club = clubs.find((c) => c.id === t.clubId)
  return club ? `${club.displayName} ${t.number}` : `Équipe ${t.number}`
}

// The logged-in player's matches for a phase (phase switcher), across any of
// their club's teams — games for a team they're not rostered on are tagged
// "Renfort". Mirrors the mobile Mes matchs screen.
export function MesMatchsPage() {
  const { user } = useAuth()
  const { teams, clubs, phases, matchDays, games, gameSelections } = useAppData()
  const [phaseId, setPhaseId] = useState<string | undefined>(undefined)
  const [quickGame, setQuickGame] = useState<{ gameId: string; teamId: string } | null>(null)

  const myPlayerId = user?.isPlayer ? user.id : undefined
  const myClubId = user?.clubId
  const today = new Date().toISOString().slice(0, 10)
  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])

  const teamByPhase = useMemo(() => {
    const map = new Map<string, Team>()
    if (myPlayerId) for (const t of teams) if (t.playerIds.includes(myPlayerId)) map.set(t.phaseId, t)
    return map
  }, [teams, myPlayerId])

  const ordered = useMemo(() => {
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

  const activePhase = phases.find((p) => p.isActive)
  const fallback =
    activePhase && ordered.some((p) => p.id === activePhase.id) ? activePhase : ordered[ordered.length - 1]
  const phase = phases.find((p) => p.id === phaseId) ?? fallback
  const idx = ordered.findIndex((p) => p.id === phase?.id)

  const playerGames = useMemo(() => {
    type Row = {
      gameId: string; team: Team; raw: string; date: string; jNumber: number
      isHome: boolean; oppName: string; isPast: boolean; isRenfort: boolean
    }
    if (!phase || !myPlayerId) return [] as Row[]
    const assigned = teamByPhase.get(phase.id)
    const phaseTeams = teams.filter(
      (t) => t.phaseId === phase.id && (myClubId ? t.clubId === myClubId : t.id === assigned?.id),
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
          oppName: opp ? teamName(opp, clubs) : '—',
          date: new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          isPast: md.date < today,
          isRenfort: assigned ? t.id !== assigned.id : false,
        })
      }
    }
    return out.sort((a, b) => a.raw.localeCompare(b.raw))
  }, [phase, myPlayerId, myClubId, teamByPhase, teams, games, gameSelections, mdMap, clubs, today])

  if (!myPlayerId || ordered.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Mes matchs</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Aucun match à afficher.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-semibold text-slate-800">Mes matchs</h1>

      {phase && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <SwitchBtn dir="prev" disabled={idx <= 0} onClick={() => idx > 0 && setPhaseId(ordered[idx - 1].id)} />
          <span className="font-display text-sm font-semibold text-slate-800">Saison {phase.displayName}</span>
          <SwitchBtn dir="next" disabled={idx >= ordered.length - 1} onClick={() => idx < ordered.length - 1 && setPhaseId(ordered[idx + 1].id)} />
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {playerGames.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">Aucun match pour cette phase.</p>
        ) : (
          <ul className="px-5 py-2">
            {playerGames.map((e) => (
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

      <Link to="/" className="inline-block text-sm font-medium text-accent-600 hover:text-accent-800">
        ← Accueil
      </Link>

      {quickGame && (
        <GameQuickView gameId={quickGame.gameId} teamId={quickGame.teamId} onClose={() => setQuickGame(null)} />
      )}
    </div>
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
