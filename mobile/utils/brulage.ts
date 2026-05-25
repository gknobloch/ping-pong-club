import type { Team, Game, MatchDay, GameSelection } from '@shared/types'

export interface BrulageInfo {
  burnedIntoTeamNumber: number | null
  burnedIntoTeamId: string | null
}

export function computeBrulage(
  playerId: string,
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  asOfMatchDayId: string | null = null,
): BrulageInfo {
  if (clubTeams.length === 0) return { burnedIntoTeamNumber: null, burnedIntoTeamId: null }

  const gamesPerTeam = countGamesPerTeam(playerId, clubTeams, matchDays, games, gameSelections, asOfMatchDayId)
  const sorted = [...clubTeams].sort((a, b) => a.number - b.number)

  let highestEligible: Team | null = null
  for (const team of sorted) {
    let gamesInHigherRanked = 0
    for (const t of sorted) {
      if (t.number < team.number) gamesInHigherRanked += gamesPerTeam.get(t.id) ?? 0
    }
    if (gamesInHigherRanked <= 1) highestEligible = team
  }

  let totalGames = 0
  for (const count of gamesPerTeam.values()) totalGames += count
  if (totalGames > 1 && highestEligible) {
    return { burnedIntoTeamNumber: highestEligible.number, burnedIntoTeamId: highestEligible.id }
  }
  return { burnedIntoTeamNumber: null, burnedIntoTeamId: null }
}

export function isPlayerEligibleForTeam(
  playerId: string,
  targetTeam: Team,
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  matchDayId: string,
): boolean {
  const gamesPerTeam = countGamesPerTeam(playerId, clubTeams, matchDays, games, gameSelections, matchDayId)

  let gamesInHigherRankedTeams = 0
  for (const team of clubTeams) {
    if (team.number < targetTeam.number) gamesInHigherRankedTeams += gamesPerTeam.get(team.id) ?? 0
  }
  if (gamesInHigherRankedTeams > 1) return false

  const sameGroupClubTeams = clubTeams.filter(
    (t) => t.groupId === targetTeam.groupId && t.id !== targetTeam.id,
  )
  for (const otherTeam of sameGroupClubTeams) {
    if ((gamesPerTeam.get(otherTeam.id) ?? 0) > 0) return false
  }
  return true
}

function countGamesPerTeam(
  playerId: string,
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  asOfMatchDayId: string | null,
): Map<string, number> {
  const mdNumberById = new Map(matchDays.map((md) => [md.id, md.number]))
  let cutoffNumber = Infinity
  if (asOfMatchDayId) cutoffNumber = mdNumberById.get(asOfMatchDayId) ?? Infinity

  const clubTeamIds = new Set(clubTeams.map((t) => t.id))
  const gamesPerTeam = new Map<string, number>()

  for (const sel of gameSelections) {
    if (!clubTeamIds.has(sel.teamId)) continue
    if (!sel.playerIds.includes(playerId)) continue
    const game = games.find((g) => g.id === sel.gameId)
    if (!game) continue
    const mdNumber = mdNumberById.get(game.matchDayId)
    if (mdNumber === undefined || mdNumber >= cutoffNumber) continue
    gamesPerTeam.set(sel.teamId, (gamesPerTeam.get(sel.teamId) ?? 0) + 1)
  }
  return gamesPerTeam
}
