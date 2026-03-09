import type { Team, Game, MatchDay, GameSelection } from '@/types'

export interface BrulageInfo {
  /** The lowest team number the player can play for (burned into this team or above). null = no restriction. */
  burnedIntoTeamNumber: number | null
  /** Team ID of the burned-into team (for display). null = no restriction. */
  burnedIntoTeamId: string | null
}

/**
 * For a given player and club, compute brûlage status based on game selections
 * up to (but not including) the given match-day.
 *
 * Rule 1 only: A player who played 2+ games in a higher-ranked team (lower team number)
 * is "burned" into that team — they can no longer play for teams with a higher number.
 *
 * Returns the lowest team number (most restrictive) the player is burned into.
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

  const gamesPlayedPerTeam = countGamesPerTeam(playerId, clubTeams, matchDays, games, gameSelections, asOfMatchDayId)
  const teamById = new Map(clubTeams.map((t) => [t.id, t]))

  let burnedNumber: number | null = null
  let burnedTeamId: string | null = null

  for (const [teamId, count] of gamesPlayedPerTeam) {
    if (count >= 2) {
      const team = teamById.get(teamId)
      if (team && (burnedNumber === null || team.number < burnedNumber)) {
        burnedNumber = team.number
        burnedTeamId = teamId
      }
    }
  }

  return { burnedIntoTeamNumber: burnedNumber, burnedIntoTeamId: burnedTeamId }
}

/**
 * Check if a player is eligible to be selected for a specific team on a specific match-day.
 *
 * A player is NOT eligible if:
 * - Rule 1: They played 2+ games in a higher-ranked team (lower number), burning them
 *   into that team — they can't play for teams with a higher number.
 * - Rule 2: The target team shares a group with another club team, and the player already
 *   played in that other team — they can no longer switch between same-group teams.
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
  // Rule 1: brûlage (2+ games)
  const { burnedIntoTeamNumber } = computeBrulage(
    playerId,
    clubTeams,
    matchDays,
    games,
    gameSelections,
    matchDayId,
  )

  if (burnedIntoTeamNumber !== null && targetTeam.number > burnedIntoTeamNumber) {
    return false
  }

  // Rule 2: same-group restriction
  // If another club team shares the target team's group and the player played in that
  // other team, they can't switch to the target team.
  const sameGroupTeams = clubTeams.filter(
    (t) => t.groupId === targetTeam.groupId && t.id !== targetTeam.id
  )
  if (sameGroupTeams.length > 0) {
    const gamesPlayedPerTeam = countGamesPerTeam(playerId, clubTeams, matchDays, games, gameSelections, matchDayId)
    for (const otherTeam of sameGroupTeams) {
      if ((gamesPlayedPerTeam.get(otherTeam.id) ?? 0) > 0) {
        return false
      }
    }
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
  const gamesPlayedPerTeam = new Map<string, number>()

  for (const sel of gameSelections) {
    if (!clubTeamIds.has(sel.teamId)) continue
    if (!sel.playerIds.includes(playerId)) continue

    const game = games.find((g) => g.id === sel.gameId)
    if (!game) continue

    const mdNumber = mdNumberById.get(game.matchDayId)
    if (mdNumber === undefined || mdNumber >= cutoffNumber) continue

    gamesPlayedPerTeam.set(sel.teamId, (gamesPlayedPerTeam.get(sel.teamId) ?? 0) + 1)
  }

  return gamesPlayedPerTeam
}
