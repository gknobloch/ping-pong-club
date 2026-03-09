import type { User, Club, Season, Phase, Division, Group, Team, Player, Address, MatchDay, Game, GameAvailability, GameSelection } from '@/types'

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
  { id: 'club-3', affiliationNumber: '06680033', displayName: 'TT Bergheim', addresses: [{ id: 'addr-4', label: 'Gymnase', street: '1 rue du Stade', postalCode: '68750', city: 'Bergheim', isDefault: true }] },
  { id: 'club-4', affiliationNumber: '06680044', displayName: 'AS Wittelsheim', addresses: [{ id: 'addr-5', label: 'Salle', street: '2 ave des Sports', postalCode: '68270', city: 'Wittelsheim', isDefault: true }] },
  { id: 'club-5', affiliationNumber: '06680055', displayName: 'TT Anould', addresses: [{ id: 'addr-6', label: 'Gymnase', street: '3 rue Principale', postalCode: '67130', city: 'Anould', isDefault: true }] },
  { id: 'club-6', affiliationNumber: '06680066', displayName: 'TT Staffelfelden', addresses: [{ id: 'addr-7', label: 'Salle', street: '4 place du Jeu', postalCode: '68850', city: 'Staffelfelden', isDefault: true }] },
  { id: 'club-7', affiliationNumber: '06680077', displayName: 'TT Bitschwiller', addresses: [{ id: 'addr-8', label: 'Gymnase', street: '5 rue du Sport', postalCode: '68220', city: 'Bitschwiller', isDefault: true }] },
  { id: 'club-8', affiliationNumber: '06680088', displayName: 'TT Cernay', addresses: [{ id: 'addr-9', label: 'Salle', street: '6 rue des Lilas', postalCode: '68700', city: 'Cernay', isDefault: true }] },
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
  { id: 'player-2', firstName: 'Jean', lastName: 'Martin', licenseNumber: '6814427', email: 'jean.martin@example.com', phone: '06 23 45 67 89', status: 'active', clubId: 'club-2' },
  { id: 'player-3', firstName: 'Sophie', lastName: 'Bernard', licenseNumber: '6814428', email: 'sophie.bernard@example.com', phone: '06 34 56 78 90', status: 'active', clubId: 'club-1' },
  { id: 'player-4', firstName: 'Pierre', lastName: 'Leroy', licenseNumber: '6814429', email: 'pierre.leroy@example.com', phone: '06 45 67 89 01', status: 'active', clubId: 'club-1' },
  { id: 'player-5', firstName: 'Admin', lastName: 'Global', licenseNumber: '0000001', email: 'admin@example.com', phone: '', status: 'active', clubId: '' },
  { id: 'player-6', firstName: 'Claire', lastName: 'Admin', licenseNumber: '0000002', email: 'club.admin@example.com', phone: '', status: 'active', clubId: 'club-1' },
  // Clubs 3–8: 2 players per club (captain + one)
  { id: 'player-7', firstName: 'Lucas', lastName: 'Bergheim', licenseNumber: '6814430', email: 'lucas@bergheim.example.com', phone: '', status: 'active', clubId: 'club-3' },
  { id: 'player-8', firstName: 'Emma', lastName: 'Bergheim', licenseNumber: '6814431', email: 'emma@bergheim.example.com', phone: '', status: 'active', clubId: 'club-3' },
  { id: 'player-9', firstName: 'Hugo', lastName: 'Wittelsheim', licenseNumber: '6814432', email: 'hugo@wittelsheim.example.com', phone: '', status: 'active', clubId: 'club-4' },
  { id: 'player-10', firstName: 'Léa', lastName: 'Wittelsheim', licenseNumber: '6814433', email: 'lea@wittelsheim.example.com', phone: '', status: 'active', clubId: 'club-4' },
  { id: 'player-11', firstName: 'Raphaël', lastName: 'Anould', licenseNumber: '6814434', email: 'raphael@anould.example.com', phone: '', status: 'active', clubId: 'club-5' },
  { id: 'player-12', firstName: 'Chloé', lastName: 'Anould', licenseNumber: '6814435', email: 'chloe@anould.example.com', phone: '', status: 'active', clubId: 'club-5' },
  { id: 'player-13', firstName: 'Nathan', lastName: 'Staffelfelden', licenseNumber: '6814436', email: 'nathan@staffelfelden.example.com', phone: '', status: 'active', clubId: 'club-6' },
  { id: 'player-14', firstName: 'Manon', lastName: 'Staffelfelden', licenseNumber: '6814437', email: 'manon@staffelfelden.example.com', phone: '', status: 'active', clubId: 'club-6' },
  { id: 'player-15', firstName: 'Tom', lastName: 'Bitschwiller', licenseNumber: '6814438', email: 'tom@bitschwiller.example.com', phone: '', status: 'active', clubId: 'club-7' },
  { id: 'player-16', firstName: 'Julie', lastName: 'Bitschwiller', licenseNumber: '6814439', email: 'julie@bitschwiller.example.com', phone: '', status: 'active', clubId: 'club-7' },
  { id: 'player-17', firstName: 'Noah', lastName: 'Cernay', licenseNumber: '6814440', email: 'noah@cernay.example.com', phone: '', status: 'active', clubId: 'club-8' },
  { id: 'player-18', firstName: 'Jade', lastName: 'Cernay', licenseNumber: '6814441', email: 'jade@cernay.example.com', phone: '', status: 'active', clubId: 'club-8' },
  { id: 'player-19', firstName: 'Inès', lastName: 'Rixheim', licenseNumber: '6814442', email: 'ines@rixheim.example.com', phone: '', status: 'active', clubId: 'club-1' },
]

export const mockGroups: Group[] = [
  { id: 'group-1', divisionId: 'div-1', number: 1, teamIds: ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6', 'team-7', 'team-8', 'team-9'] },
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
    playerIds: ['player-1', 'player-3', 'player-4'],
    rosterInitialPoints: { 'player-1': '850', 'player-3': '720', 'player-4': '680' },
    color: '#374151',
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
    playerIds: ['player-2'],
    color: '#b91c1c',
  },
  { id: 'team-3', clubId: 'club-3', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-4', defaultDay: 'Mardi', defaultTime: '20h00', captainId: 'player-7', playerIds: ['player-7', 'player-8'], color: '#15803d' },
  { id: 'team-4', clubId: 'club-4', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-5', defaultDay: 'Mercredi', defaultTime: '19h30', captainId: 'player-9', playerIds: ['player-9', 'player-10'], color: '#c2410c' },
  { id: 'team-5', clubId: 'club-5', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-6', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'player-11', playerIds: ['player-11', 'player-12'], color: '#1d4ed8' },
  { id: 'team-6', clubId: 'club-6', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-7', defaultDay: 'Vendredi', defaultTime: '19h00', captainId: 'player-13', playerIds: ['player-13', 'player-14'], color: '#7c2d12' },
  { id: 'team-7', clubId: 'club-7', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-8', defaultDay: 'Lundi', defaultTime: '20h00', captainId: 'player-15', playerIds: ['player-15', 'player-16'], color: '#4f46e5' },
  { id: 'team-8', clubId: 'club-8', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-9', defaultDay: 'Mercredi', defaultTime: '20h00', captainId: 'player-17', playerIds: ['player-17', 'player-18'], color: '#0d9488' },
  {
    id: 'team-9',
    clubId: 'club-1',
    phaseId: 'phase-1',
    number: 2,
    divisionId: 'div-1',
    groupId: 'group-1',
    gameLocationId: 'addr-1',
    defaultDay: 'Jeudi',
    defaultTime: '20h00',
    captainId: 'player-6',
    playerIds: ['player-6', 'player-19'],
    rosterInitialPoints: { 'player-6': '920', 'player-19': '650' },
    color: '#65a30d',
  },
]

export const mockMatchDays: MatchDay[] = [
  { id: 'md-1', groupId: 'group-1', number: 1, date: '2025-10-02' },
  { id: 'md-2', groupId: 'group-1', number: 2, date: '2025-10-09' },
  { id: 'md-3', groupId: 'group-1', number: 3, date: '2025-10-16' },
  { id: 'md-4', groupId: 'group-1', number: 4, date: '2025-10-23' },
  { id: 'md-5', groupId: 'group-1', number: 5, date: '2025-10-30' },
  { id: 'md-6', groupId: 'group-1', number: 6, date: '2025-11-06' },
  { id: 'md-7', groupId: 'group-1', number: 7, date: '2025-11-13' },
]

// Round-robin 8 teams, 7 match-days, 4 games per day (each team plays once per day)
export const mockGames: Game[] = [
  { id: 'game-1', matchDayId: 'md-1', homeTeamId: 'team-1', awayTeamId: 'team-2' },
  { id: 'game-2', matchDayId: 'md-1', homeTeamId: 'team-3', awayTeamId: 'team-4' },
  { id: 'game-3', matchDayId: 'md-1', homeTeamId: 'team-5', awayTeamId: 'team-6' },
  { id: 'game-4', matchDayId: 'md-1', homeTeamId: 'team-7', awayTeamId: 'team-8' },
  { id: 'game-5', matchDayId: 'md-2', homeTeamId: 'team-1', awayTeamId: 'team-3' },
  { id: 'game-6', matchDayId: 'md-2', homeTeamId: 'team-2', awayTeamId: 'team-4' },
  { id: 'game-7', matchDayId: 'md-2', homeTeamId: 'team-5', awayTeamId: 'team-7' },
  { id: 'game-8', matchDayId: 'md-2', homeTeamId: 'team-6', awayTeamId: 'team-8' },
  { id: 'game-9', matchDayId: 'md-3', homeTeamId: 'team-1', awayTeamId: 'team-4' },
  { id: 'game-10', matchDayId: 'md-3', homeTeamId: 'team-2', awayTeamId: 'team-3' },
  { id: 'game-11', matchDayId: 'md-3', homeTeamId: 'team-5', awayTeamId: 'team-8' },
  { id: 'game-12', matchDayId: 'md-3', homeTeamId: 'team-6', awayTeamId: 'team-7' },
  { id: 'game-13', matchDayId: 'md-4', homeTeamId: 'team-1', awayTeamId: 'team-5' },
  { id: 'game-14', matchDayId: 'md-4', homeTeamId: 'team-2', awayTeamId: 'team-6' },
  { id: 'game-15', matchDayId: 'md-4', homeTeamId: 'team-3', awayTeamId: 'team-7' },
  { id: 'game-16', matchDayId: 'md-4', homeTeamId: 'team-4', awayTeamId: 'team-8' },
  { id: 'game-17', matchDayId: 'md-5', homeTeamId: 'team-1', awayTeamId: 'team-6' },
  { id: 'game-18', matchDayId: 'md-5', homeTeamId: 'team-2', awayTeamId: 'team-5' },
  { id: 'game-19', matchDayId: 'md-5', homeTeamId: 'team-3', awayTeamId: 'team-8' },
  { id: 'game-20', matchDayId: 'md-5', homeTeamId: 'team-4', awayTeamId: 'team-7' },
  { id: 'game-21', matchDayId: 'md-6', homeTeamId: 'team-1', awayTeamId: 'team-7' },
  { id: 'game-22', matchDayId: 'md-6', homeTeamId: 'team-2', awayTeamId: 'team-8' },
  { id: 'game-23', matchDayId: 'md-6', homeTeamId: 'team-3', awayTeamId: 'team-5' },
  { id: 'game-24', matchDayId: 'md-6', homeTeamId: 'team-4', awayTeamId: 'team-6' },
  { id: 'game-25', matchDayId: 'md-7', homeTeamId: 'team-1', awayTeamId: 'team-8', time: '20h00' },
  { id: 'game-26', matchDayId: 'md-7', homeTeamId: 'team-2', awayTeamId: 'team-7', time: '19h30' },
  { id: 'game-27', matchDayId: 'md-7', homeTeamId: 'team-3', awayTeamId: 'team-6', time: '20h00' },
  { id: 'game-28', matchDayId: 'md-7', homeTeamId: 'team-4', awayTeamId: 'team-5', time: '19h30' },
  // PPA Rixheim 2 (team-9) games
  { id: 'game-29', matchDayId: 'md-1', homeTeamId: 'team-9', awayTeamId: 'team-2', time: '20h00' },
  { id: 'game-30', matchDayId: 'md-2', homeTeamId: 'team-3', awayTeamId: 'team-9', time: '20h00' },
  { id: 'game-31', matchDayId: 'md-3', homeTeamId: 'team-9', awayTeamId: 'team-4', time: '20h00' },
  { id: 'game-32', matchDayId: 'md-4', homeTeamId: 'team-5', awayTeamId: 'team-9', time: '20h00' },
  { id: 'game-33', matchDayId: 'md-5', homeTeamId: 'team-9', awayTeamId: 'team-6', time: '20h00' },
  { id: 'game-34', matchDayId: 'md-6', homeTeamId: 'team-7', awayTeamId: 'team-9', time: '20h00' },
  { id: 'game-35', matchDayId: 'md-7', homeTeamId: 'team-9', awayTeamId: 'team-8', time: '20h00' },
]

export const mockGameAvailabilities: GameAvailability[] = []

export const mockGameSelections: GameSelection[] = []

export const mockUsers: User[] = [
  { id: 'user-1', email: 'admin@example.com', role: 'general_admin', playerId: 'player-5', clubIds: [], captainTeamIds: [] },
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
