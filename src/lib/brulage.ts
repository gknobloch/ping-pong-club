import type { Team, Game, MatchDay, GameSelection, Group } from '@/types'

export interface BrulageInfo {
  /** The lowest team number the player can play for (burned into this team or above). null = no restriction. */
  burnedIntoTeamNumber: number | null
  /** Team ID of the burned-into team (for display). null = no restriction. */
  burnedIntoTeamId: string | null
}

/**
 * For a given player and club, compute brûlage status based on all match-days
 * up to (but not including) the given match-day.
 *
 * Rules:
 * 1. A player who played 2+ games in a higher-ranked team (lower team number) is
 *    "burned" into that team — they can no longer play for teams with a higher number.
 * 2. If 2 teams from the same club are in the same group, once a player plays in one
 *    team, they cannot be selected for the other team starting from the next match-day.
 *
 * Returns the lowest team number (most restrictive) the player can play for.
 */
export function computeBrulage(
  playerId: string,
  _clubId: string,
  /** All club teams in the same phase, sorted by number ascending. */
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  _groups: Group[],
  /** Compute brûlage as of this match-day (exclusive — only prior match-days count). null = consider all match-days. */
  asOfMatchDayId: string | null = null,
): BrulageInfo {
  if (clubTeams.length === 0) return { burnedIntoTeamNumber: null, burnedIntoTeamId: null }

  // Build a map of matchDay id → matchDay number for ordering
  const mdNumberById = new Map(matchDays.map((md) => [md.id, md.number]))

  // Determine the cutoff: only count match-days with number < asOfMatchDay's number
  let cutoffNumber = Infinity
  if (asOfMatchDayId) {
    cutoffNumber = mdNumberById.get(asOfMatchDayId) ?? Infinity
  }

  // Build a set of club team IDs for quick lookup
  const clubTeamIds = new Set(clubTeams.map((t) => t.id))

  // Count games played per team (only from match-days before the cutoff)
  const gamesPlayedPerTeam = new Map<string, number>()

  // Also track: for same-group rule, which teams the player has played in at all (before cutoff)
  const teamsPlayedIn = new Set<string>()

  for (const sel of gameSelections) {
    if (!clubTeamIds.has(sel.teamId)) continue
    if (!sel.playerIds.includes(playerId)) continue

    const game = games.find((g) => g.id === sel.gameId)
    if (!game) continue

    const mdNumber = mdNumberById.get(game.matchDayId)
    if (mdNumber === undefined || mdNumber >= cutoffNumber) continue

    teamsPlayedIn.add(sel.teamId)
    gamesPlayedPerTeam.set(sel.teamId, (gamesPlayedPerTeam.get(sel.teamId) ?? 0) + 1)
  }

  // Build team lookup by ID
  const teamById = new Map(clubTeams.map((t) => [t.id, t]))

  let burnedNumber: number | null = null
  let burnedTeamId: string | null = null

  // Rule 1: 2+ games in a team → burned into that team (can't play for higher-numbered teams)
  // We want the lowest team number where the player has 2+ games
  for (const [teamId, count] of gamesPlayedPerTeam) {
    if (count >= 2) {
      const team = teamById.get(teamId)
      if (team && (burnedNumber === null || team.number < burnedNumber)) {
        burnedNumber = team.number
        burnedTeamId = teamId
      }
    }
  }

  // Rule 2: Same-group restriction — if two club teams share a group, playing in one
  // burns you from the other (effectively burned into the one you played in)
  // Find pairs of club teams in the same group
  const teamsByGroup = new Map<string, Team[]>()
  for (const team of clubTeams) {
    const list = teamsByGroup.get(team.groupId) ?? []
    list.push(team)
    teamsByGroup.set(team.groupId, list)
  }

  for (const [, groupTeams] of teamsByGroup) {
    if (groupTeams.length < 2) continue
    // If player played in any team in this group, they're burned into that team
    for (const team of groupTeams) {
      if (teamsPlayedIn.has(team.id)) {
        if (burnedNumber === null || team.number < burnedNumber) {
          burnedNumber = team.number
          burnedTeamId = team.id
        }
      }
    }
  }

  return { burnedIntoTeamNumber: burnedNumber, burnedIntoTeamId: burnedTeamId }
}

/**
 * Check if a player is eligible to be selected for a specific team on a specific match-day.
 * A player is NOT eligible if their brûlage restricts them to a team with a lower number
 * than the target team.
 */
export function isPlayerEligibleForTeam(
  playerId: string,
  targetTeam: Team,
  clubTeams: Team[],
  matchDays: MatchDay[],
  games: Game[],
  gameSelections: GameSelection[],
  groups: Group[],
  matchDayId: string,
): boolean {
  const { burnedIntoTeamNumber } = computeBrulage(
    playerId,
    targetTeam.clubId,
    clubTeams,
    matchDays,
    games,
    gameSelections,
    groups,
    matchDayId,
  )

  if (burnedIntoTeamNumber === null) return true
  return targetTeam.number <= burnedIntoTeamNumber
}
