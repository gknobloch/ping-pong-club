// Shared domain logic — imported by the web app (@/lib/matchdays) and the
// mobile app (@shared/lib/matchdays). Keep this module free of any
// browser/RN/Node deps.
import type { Team, Game, MatchDay, GameSelection } from '../types'

// Players already selected for another club team in the same journée (round
// number), mapped to that team's number — they can't be fielded twice the
// same match-day, so they're non-selectable for the current team.
export function playersCommittedElsewhere(
  currentTeamId: string,
  roundNumber: number,
  clubTeams: Team[],
  games: Game[],
  matchDays: MatchDay[],
  gameSelections: GameSelection[],
): Map<string, number> {
  const mdNumberById = new Map(matchDays.map((md) => [md.id, md.number]))
  const clubTeamById = new Map(clubTeams.map((t) => [t.id, t]))
  const result = new Map<string, number>()
  for (const sel of gameSelections) {
    if (sel.teamId === currentTeamId) continue
    const team = clubTeamById.get(sel.teamId)
    if (!team) continue
    const game = games.find((g) => g.id === sel.gameId)
    if (!game || mdNumberById.get(game.matchDayId) !== roundNumber) continue
    for (const pid of sel.playerIds) if (!result.has(pid)) result.set(pid, team.number)
  }
  return result
}
