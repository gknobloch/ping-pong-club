import type { Club, Team } from '../types'

// Venue label for a home team's games: its configured game location if set,
// else the club's default (or first) address's city.
export function getVenue(homeTeam: Team | undefined, clubs: Club[]): string | undefined {
  if (!homeTeam) return undefined
  const addr = clubs.flatMap((c) => c.addresses ?? []).find((a) => a.id === homeTeam.gameLocationId)
  if (addr) return addr.label ? `${addr.label}, ${addr.city}` : addr.city
  const homeClub = clubs.find((c) => c.id === homeTeam.clubId)
  return (homeClub?.addresses?.find((a) => a.isDefault) ?? homeClub?.addresses?.[0])?.city
}
