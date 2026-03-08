import type { User, Club, Season, Phase, Division, Group, Team, Player, Address, MatchDay, Game } from '@/types'

const addresses: Address[] = [
  { id: 'addr-1', label: 'Gymnase principal', street: '12 rue du Sport', postalCode: '68170', city: 'Rixheim', isDefault: true },
  { id: 'addr-2', label: 'Salle annexe', street: '5 avenue des Lilas', postalCode: '68170', city: 'Rixheim', isDefault: false },
]

export const mockClubs: Club[] = [
  {
    id: 'club-1',
    affiliationNumber: '06680011',
    displayName: 'PPA Rixheim',
    addresses,
  },
  {
    id: 'club-2',
    affiliationNumber: '06680022',
    displayName: 'TT Mulhouse',
    addresses: [
      { id: 'addr-3', label: 'Salle Omnisports', street: '1 place de la République', postalCode: '68100', city: 'Mulhouse', isDefault: true },
    ],
  },
]

export const mockSeasons: Season[] = [
  { id: 'season-1', displayName: '2025/2026', isArchived: false, isActive: true },
]

export const mockPhases: Phase[] = [
  { id: 'phase-1', seasonId: 'season-1', name: 'Phase 1', displayName: '2025/2026 Phase 1', isArchived: false, isActive: true },
]

export const mockDivisions: Division[] = [
  { id: 'div-1', phaseId: 'phase-1', displayName: 'GE1', rank: 1, playersPerGame: 4 },
  { id: 'div-2', phaseId: 'phase-1', displayName: 'GE2', rank: 2, playersPerGame: 4 },
]

export const mockPlayers: Player[] = [
  { id: 'player-1', firstName: 'Marie', lastName: 'Dupont', licenseNumber: '6814426', email: 'marie.dupont@example.com', phone: '06 12 34 56 78', status: 'active', clubId: 'club-1' },
  { id: 'player-2', firstName: 'Jean', lastName: 'Martin', licenseNumber: '6814427', email: 'jean.martin@example.com', phone: '06 23 45 67 89', status: 'active', clubId: 'club-1' },
  { id: 'player-3', firstName: 'Sophie', lastName: 'Bernard', licenseNumber: '6814428', email: 'sophie.bernard@example.com', phone: '06 34 56 78 90', status: 'active', clubId: 'club-1' },
  { id: 'player-4', firstName: 'Pierre', lastName: 'Leroy', licenseNumber: '6814429', email: 'pierre.leroy@example.com', phone: '06 45 67 89 01', status: 'active', clubId: 'club-1' },
  { id: 'player-5', firstName: 'Admin', lastName: 'Global', licenseNumber: '0000001', email: 'admin@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-6', firstName: 'Claire', lastName: 'Admin', licenseNumber: '0000002', email: 'club.admin@example.com', phone: '', status: 'active', clubId: 'club-1' },
]

export const mockGroups: Group[] = [
  { id: 'group-1', divisionId: 'div-1', number: 1, teamIds: ['team-1', 'team-2'] },
]

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    clubId: 'club-1',
    phaseId: 'phase-1',
    number: 1,
    divisionId: 'div-1',
    groupId: 'group-1',
    gameLocationId: 'addr-1',
    defaultDay: 'Jeudi',
    defaultTime: '20h00',
    captainId: 'player-1',
  },
  {
    id: 'team-2',
    clubId: 'club-2',
    phaseId: 'phase-1',
    number: 1,
    divisionId: 'div-1',
    groupId: 'group-1',
    gameLocationId: 'addr-3',
    defaultDay: 'Mercredi',
    defaultTime: '19h30',
    captainId: 'player-2',
  },
]

export const mockMatchDays: MatchDay[] = [
  { id: 'md-1', phaseId: 'phase-1', number: 1, date: '2025-10-02' },
  { id: 'md-2', phaseId: 'phase-1', number: 2, date: '2025-10-09' },
]

export const mockGames: Game[] = [
  { id: 'game-1', matchDayId: 'md-1', homeTeamId: 'team-1', awayTeamId: 'team-2' },
]

export const mockUsers: User[] = [
  { id: 'user-1', email: 'admin@example.com', role: 'general_admin', playerId: 'player-5', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-2', email: 'club.admin@example.com', role: 'club_admin', playerId: 'player-6', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-3', email: 'marie.dupont@example.com', role: 'captain', playerId: 'player-1', clubIds: ['club-1'], captainTeamIds: ['team-1'] },
  { id: 'user-4', email: 'jean.martin@example.com', role: 'player', playerId: 'player-2', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-5', email: 'sophie.bernard@example.com', role: 'player', playerId: 'player-3', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-6', email: 'pierre.leroy@example.com', role: 'player', playerId: 'player-4', clubIds: ['club-1'], captainTeamIds: [] },
]

export function getDisplayNameForUser(user: User): string {
  const player = mockPlayers.find((p) => p.id === user.playerId)
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
