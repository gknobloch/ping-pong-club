import type { User, Player, Team, Club } from '@shared/types'

export function getDisplayName(user: User, players: Player[]): string {
  const player = players.find((p) => p.id === user.playerId)
  if (player) return `${player.firstName} ${player.lastName}`
  return user.email
}

export function getRoleLabel(role: User['role']): string {
  const labels: Record<User['role'], string> = {
    general_admin: 'Administrateur général',
    club_admin: 'Administrateur de club',
    captain: 'Capitaine',
    player: 'Joueur',
  }
  return labels[role]
}

export function canManageTeam(user: User, teamId: string): boolean {
  if (user.role === 'general_admin') return true
  if (user.role === 'club_admin') return true
  if (user.role === 'captain') return user.captainTeamIds?.includes(teamId) ?? false
  return false
}

export function getTeamName(team: Team, clubs: Club[]): string {
  const club = clubs.find((c) => c.id === team.clubId)
  return club ? `${club.displayName} ${team.number}` : `Équipe ${team.number}`
}

export function canManageClub(user: User, clubId: string): boolean {
  if (user.role === 'general_admin') return true
  if (user.role === 'club_admin') return user.clubIds?.includes(clubId) ?? false
  return false
}
