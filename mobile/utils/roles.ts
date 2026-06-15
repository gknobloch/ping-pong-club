import type { User, Team, Club } from '@shared/types'

export function getDisplayName(user: User): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  }
  return user.email
}

export function getRoleLabel(role: User['role']): string {
  const labels: Record<User['role'], string> = {
    general_admin: 'Administrateur général',
    club_admin: 'Administrateur de club',
    player: 'Joueur',
  }
  return labels[role]
}

/** Captaincy is per-team (team.captainId), so it's derived from the team. */
export function canManageTeam(user: User, team: Team): boolean {
  if (user.role === 'general_admin') return true
  if (user.role === 'club_admin') return true
  return team.captainId === user.id
}

export function getTeamName(team: Team, clubs: Club[]): string {
  const club = clubs.find((c) => c.id === team.clubId)
  return club ? `${club.displayName} ${team.number}` : `Équipe ${team.number}`
}

export function canManageClub(user: User, clubId: string): boolean {
  if (user.role === 'general_admin') return true
  if (user.role === 'club_admin') return user.clubId === clubId
  return false
}
