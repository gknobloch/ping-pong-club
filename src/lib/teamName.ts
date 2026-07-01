import type { Club, Team } from '../types'

// Display name for a team, e.g. "PPA Rixheim 1". Falls back to a generic
// "Équipe N" if the club can't be resolved.
export function getTeamName(team: Team, clubs: Club[]): string {
  const club = clubs.find((c) => c.id === team.clubId)
  return club ? `${club.displayName} ${team.number}` : `Équipe ${team.number}`
}
