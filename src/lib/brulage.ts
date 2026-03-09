import type { Team, Game, MatchDay, GameSelection } from '@/types'

export interface BrulageInfo {
  /** The highest team number the player can play for (burned into this level). null = no restriction. */
  burnedIntoTeamNumber: number | null
  /** Team ID of the burned-into team (for display). null = no restriction. */
  burnedIntoTeamId: string | null
}

/**
 * For a given player and club, compute brûlage status based on game selections
 * up to (but not including) the given match-day.
 *
 * Rule: a player can play at most 1 game in a team with a lower number (higher rank)
 * than their "level". Once they've accumulated >1 games across higher-ranked teams,
 * they're burned into the highest-numbered team they played in.
 *
 * Example: played MD1 in team 2, MD2 in team 1 → burned into team 2 (can play 1 or 2, not 3+).
 * Example: played MD1 in team 1 only → no burn (1 game ≤ threshold).
 * Example: played MD1 and MD2 in team 1 → burned into team 1 (can only play team 1).
 */
export function computeBrulage(
  playerId: string,
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  /** Compute brûlage as of this match-day (exclusive — only prior match-days count). null = consider all match-days. */
  asOfMatchDayId: string | null = null,
): BrulageInfo {
  if (clubTeams.length === 0) return { burnedIntoTeamNumber: null, burnedIntoTeamId: null }

  const gamesPerTeam = countGamesPerTeam(playerId, clubTeams, matchDays, games, gameSelections, asOfMatchDayId)

  // Sort club teams by number ascending
  const sorted = [...clubTeams].sort((a, b) => a.number - b.number)

  // Walk teams from lowest number to highest, accumulating game count.
  // Burned-into N means: cumulative games in teams ≤ N > 1, but cumulative in teams < N ≤ 1.
  let cumulative = 0
  let burned = false

  for (const team of sorted) {
    const count = gamesPerTeam.get(team.id) ?? 0
    cumulative += count
    if (cumulative > 1) {
      burned = true
      break
    }
  }

  // If burned, the actual level is the highest-numbered team the player played in
  // (they can still play up to that team, not beyond).
  if (burned) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((gamesPerTeam.get(sorted[i].id) ?? 0) > 0) {
        return { burnedIntoTeamNumber: sorted[i].number, burnedIntoTeamId: sorted[i].id }
      }
    }
  }

  return { burnedIntoTeamNumber: null, burnedIntoTeamId: null }
}

/**
 * Check if a player is eligible to be selected for a specific team on a specific match-day.
 *
 * Rule 1 (brûlage): count all games the player has played in teams with a LOWER number
 * (higher rank) than the target team. If that count > 1, the player is not eligible.
 *
 * Rule 2 (same group): if another club team shares the target team's group and the player
 * already played in that other team, they can no longer switch between same-group teams.
 */
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

  // Rule 1: brûlage — max 1 game in higher-ranked teams
  let gamesInHigherRankedTeams = 0
  for (const team of clubTeams) {
    if (team.number < targetTeam.number) {
      gamesInHigherRankedTeams += gamesPerTeam.get(team.id) ?? 0
    }
  }
  if (gamesInHigherRankedTeams > 1) return false

  // Rule 2: same-group — can't switch between club teams in the same group
  const sameGroupClubTeams = clubTeams.filter(
    (t) => t.groupId === targetTeam.groupId && t.id !== targetTeam.id
  )
  for (const otherTeam of sameGroupClubTeams) {
    if ((gamesPerTeam.get(otherTeam.id) ?? 0) > 0) return false
  }

  return true
}

/** Count games played per team for a player, up to (exclusive) the given match-day. */
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
  if (asOfMatchDayId) {
    cutoffNumber = mdNumberById.get(asOfMatchDayId) ?? Infinity
  }

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
