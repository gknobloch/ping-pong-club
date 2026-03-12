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
    isArchived: false,
    addresses,
  },
  {
    id: 'club-2',
    affiliationNumber: '06680022',
    displayName: 'TT Mulhouse',
    isArchived: false,
    addresses: [
      { id: 'addr-3', label: 'Salle Omnisports', street: '1 place de la République', postalCode: '68100', city: 'Mulhouse', isDefault: true },
    ],
  },
  { id: 'club-3', affiliationNumber: '06680033', displayName: 'TT Bergheim', isArchived: false, addresses: [{ id: 'addr-4', label: 'Gymnase', street: '1 rue du Stade', postalCode: '68750', city: 'Bergheim', isDefault: true }] },
  { id: 'club-4', affiliationNumber: '06680044', displayName: 'AS Wittelsheim', isArchived: false, addresses: [{ id: 'addr-5', label: 'Salle', street: '2 ave des Sports', postalCode: '68270', city: 'Wittelsheim', isDefault: true }] },
  { id: 'club-5', affiliationNumber: '06680055', displayName: 'TT Anould', isArchived: false, addresses: [{ id: 'addr-6', label: 'Gymnase', street: '3 rue Principale', postalCode: '67130', city: 'Anould', isDefault: true }] },
  { id: 'club-6', affiliationNumber: '06680066', displayName: 'TT Staffelfelden', isArchived: false, addresses: [{ id: 'addr-7', label: 'Salle', street: '4 place du Jeu', postalCode: '68850', city: 'Staffelfelden', isDefault: true }] },
  { id: 'club-7', affiliationNumber: '06680077', displayName: 'TT Bitschwiller', isArchived: false, addresses: [{ id: 'addr-8', label: 'Gymnase', street: '5 rue du Sport', postalCode: '68220', city: 'Bitschwiller', isDefault: true }] },
  { id: 'club-8', affiliationNumber: '06680088', displayName: 'TT Cernay', isArchived: false, addresses: [{ id: 'addr-9', label: 'Salle', street: '6 rue des Lilas', postalCode: '68700', city: 'Cernay', isDefault: true }] },
]

export const mockSeasons: Season[] = [
  { id: 'season-1', displayName: '2025/2026', isArchived: false, isActive: true },
]

export const mockPhases: Phase[] = [
  { id: 'phase-1', seasonId: 'season-1', name: 'Phase 1', displayName: '2025/2026 Phase 1', isArchived: false, isActive: true },
]

export const mockDivisions: Division[] = [
  { id: 'div-1', phaseId: 'phase-1', displayName: 'GE1', rank: 1, playersPerGame: 4, isArchived: false },
  { id: 'div-2', phaseId: 'phase-1', displayName: 'GE2', rank: 2, playersPerGame: 4, isArchived: false },
  { id: 'div-3', phaseId: 'phase-1', displayName: 'GE3', rank: 3, playersPerGame: 4, isArchived: false },
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
  // Extra PPA Rixheim players for teams 3 and 4
  { id: 'player-20', firstName: 'Thomas', lastName: 'Weber', licenseNumber: '6814443', email: 'thomas.weber@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-21', firstName: 'Camille', lastName: 'Schmitt', licenseNumber: '6814444', email: 'camille.schmitt@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-22', firstName: 'Maxime', lastName: 'Keller', licenseNumber: '6814445', email: 'maxime.keller@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-23', firstName: 'Léonie', lastName: 'Muller', licenseNumber: '6814446', email: 'leonie.muller@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-24', firstName: 'Antoine', lastName: 'Fischer', licenseNumber: '6814447', email: 'antoine.fischer@example.com', phone: '', status: 'active', clubId: 'club-1' },
  { id: 'player-25', firstName: 'Lucie', lastName: 'Meyer', licenseNumber: '6814448', email: 'lucie.meyer@example.com', phone: '', status: 'active', clubId: 'club-1' },
  // PPA Rixheim player not assigned to any team (shows in "Autres joueurs du club")
  { id: 'player-26', firstName: 'Marc', lastName: 'Hoffmann', licenseNumber: '6814449', email: 'marc.hoffmann@example.com', phone: '06 56 78 90 12', status: 'active', clubId: 'club-1' },
]

export const mockGroups: Group[] = [
  { id: 'group-1', divisionId: 'div-1', number: 1, teamIds: ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6', 'team-7', 'team-8'] },
  { id: 'group-2', divisionId: 'div-2', number: 1, teamIds: ['team-9', 'team-10', 'team-11', 'team-12'] },
  { id: 'group-3', divisionId: 'div-3', number: 1, teamIds: ['team-13', 'team-14', 'team-15', 'team-16', 'team-17', 'team-18', 'team-19', 'team-20'] },
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
    isArchived: false,
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
    isArchived: false,
  },
  { id: 'team-3', clubId: 'club-3', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-4', defaultDay: 'Mardi', defaultTime: '20h00', captainId: 'player-7', playerIds: ['player-7', 'player-8'], color: '#15803d', isArchived: false },
  { id: 'team-4', clubId: 'club-4', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-5', defaultDay: 'Mercredi', defaultTime: '19h30', captainId: 'player-9', playerIds: ['player-9', 'player-10'], color: '#c2410c', isArchived: false },
  { id: 'team-5', clubId: 'club-5', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-6', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'player-11', playerIds: ['player-11', 'player-12'], color: '#1d4ed8', isArchived: false },
  { id: 'team-6', clubId: 'club-6', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-7', defaultDay: 'Vendredi', defaultTime: '19h00', captainId: 'player-13', playerIds: ['player-13', 'player-14'], color: '#7c2d12', isArchived: false },
  { id: 'team-7', clubId: 'club-7', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-8', defaultDay: 'Lundi', defaultTime: '20h00', captainId: 'player-15', playerIds: ['player-15', 'player-16'], color: '#4f46e5', isArchived: false },
  { id: 'team-8', clubId: 'club-8', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-9', defaultDay: 'Mercredi', defaultTime: '20h00', captainId: 'player-17', playerIds: ['player-17', 'player-18'], color: '#0d9488', isArchived: false },
  {
    id: 'team-9',
    clubId: 'club-1',
    phaseId: 'phase-1',
    number: 2,
    divisionId: 'div-2',
    groupId: 'group-2',
    gameLocationId: 'addr-1',
    defaultDay: 'Jeudi',
    defaultTime: '20h00',
    captainId: 'player-6',
    playerIds: ['player-6', 'player-19'],
    rosterInitialPoints: { 'player-6': '920', 'player-19': '650' },
    color: '#65a30d',
    isArchived: false,
  },
  // GE2 group-2 opponents
  { id: 'team-10', clubId: 'club-2', phaseId: 'phase-1', number: 2, divisionId: 'div-2', groupId: 'group-2', gameLocationId: 'addr-3', defaultDay: 'Mercredi', defaultTime: '19h30', captainId: 'player-2', playerIds: ['player-2'], color: '#dc2626', isArchived: false },
  { id: 'team-11', clubId: 'club-3', phaseId: 'phase-1', number: 2, divisionId: 'div-2', groupId: 'group-2', gameLocationId: 'addr-4', defaultDay: 'Mardi', defaultTime: '20h00', captainId: 'player-8', playerIds: ['player-8'], color: '#059669', isArchived: false },
  { id: 'team-12', clubId: 'club-4', phaseId: 'phase-1', number: 2, divisionId: 'div-2', groupId: 'group-2', gameLocationId: 'addr-5', defaultDay: 'Mercredi', defaultTime: '19h30', captainId: 'player-10', playerIds: ['player-10'], color: '#ea580c', isArchived: false },
  // GE3 group-3: PPA Rixheim 3 + 3 opponents
  {
    id: 'team-13',
    clubId: 'club-1',
    phaseId: 'phase-1',
    number: 3,
    divisionId: 'div-3',
    groupId: 'group-3',
    gameLocationId: 'addr-1',
    defaultDay: 'Vendredi',
    defaultTime: '20h00',
    captainId: 'player-20',
    playerIds: ['player-20', 'player-21', 'player-22'],
    rosterInitialPoints: { 'player-20': '580', 'player-21': '540', 'player-22': '510' },
    color: '#0891b2',
    isArchived: false,
  },
  { id: 'team-14', clubId: 'club-5', phaseId: 'phase-1', number: 2, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-6', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'player-12', playerIds: ['player-12'], color: '#2563eb', isArchived: false },
  { id: 'team-15', clubId: 'club-6', phaseId: 'phase-1', number: 2, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-7', defaultDay: 'Vendredi', defaultTime: '19h00', captainId: 'player-14', playerIds: ['player-14'], color: '#92400e', isArchived: false },
  { id: 'team-16', clubId: 'club-7', phaseId: 'phase-1', number: 2, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-8', defaultDay: 'Lundi', defaultTime: '20h00', captainId: 'player-16', playerIds: ['player-16'], color: '#6366f1', isArchived: false },
  // GE3 group-3: PPA Rixheim 4 + 3 opponents (same group as PPA Rixheim 3)
  {
    id: 'team-17',
    clubId: 'club-1',
    phaseId: 'phase-1',
    number: 4,
    divisionId: 'div-3',
    groupId: 'group-3',
    gameLocationId: 'addr-2',
    defaultDay: 'Lundi',
    defaultTime: '20h00',
    captainId: 'player-23',
    playerIds: ['player-23', 'player-24', 'player-25'],
    rosterInitialPoints: { 'player-23': '500', 'player-24': '480', 'player-25': '450' },
    color: '#be185d',
    isArchived: false,
  },
  { id: 'team-18', clubId: 'club-2', phaseId: 'phase-1', number: 3, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-3', defaultDay: 'Mercredi', defaultTime: '19h30', captainId: 'player-2', playerIds: ['player-2'], color: '#e11d48', isArchived: false },
  { id: 'team-19', clubId: 'club-3', phaseId: 'phase-1', number: 3, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-4', defaultDay: 'Mardi', defaultTime: '20h00', captainId: 'player-7', playerIds: ['player-7'], color: '#16a34a', isArchived: false },
  { id: 'team-20', clubId: 'club-8', phaseId: 'phase-1', number: 2, divisionId: 'div-3', groupId: 'group-3', gameLocationId: 'addr-9', defaultDay: 'Mercredi', defaultTime: '20h00', captainId: 'player-18', playerIds: ['player-18'], color: '#0f766e', isArchived: false },
]

export const mockMatchDays: MatchDay[] = [
  // GE1 group-1: 8-team round-robin, 7 match-days
  { id: 'md-1', groupId: 'group-1', number: 1, date: '2025-10-02' },
  { id: 'md-2', groupId: 'group-1', number: 2, date: '2025-10-09' },
  { id: 'md-3', groupId: 'group-1', number: 3, date: '2025-10-16' },
  { id: 'md-4', groupId: 'group-1', number: 4, date: '2025-10-23' },
  { id: 'md-5', groupId: 'group-1', number: 5, date: '2025-10-30' },
  { id: 'md-6', groupId: 'group-1', number: 6, date: '2025-11-06' },
  { id: 'md-7', groupId: 'group-1', number: 7, date: '2025-11-13' },
  // GE2 group-2: 4-team round-robin, 3 match-days
  { id: 'md-g2-1', groupId: 'group-2', number: 1, date: '2025-10-02' },
  { id: 'md-g2-2', groupId: 'group-2', number: 2, date: '2025-10-09' },
  { id: 'md-g2-3', groupId: 'group-2', number: 3, date: '2025-10-16' },
  // GE3 group-3: 8-team round-robin, 7 match-days (PPA Rixheim 3 & 4 in same group)
  { id: 'md-g3-1', groupId: 'group-3', number: 1, date: '2025-10-03' },
  { id: 'md-g3-2', groupId: 'group-3', number: 2, date: '2025-10-10' },
  { id: 'md-g3-3', groupId: 'group-3', number: 3, date: '2025-10-17' },
  { id: 'md-g3-4', groupId: 'group-3', number: 4, date: '2025-10-24' },
  { id: 'md-g3-5', groupId: 'group-3', number: 5, date: '2025-10-31' },
  { id: 'md-g3-6', groupId: 'group-3', number: 6, date: '2025-11-07' },
  { id: 'md-g3-7', groupId: 'group-3', number: 7, date: '2025-11-14' },
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
  // GE2 group-2: 4-team round-robin (team-9, team-10, team-11, team-12)
  { id: 'game-29', matchDayId: 'md-g2-1', homeTeamId: 'team-9', awayTeamId: 'team-10' },
  { id: 'game-30', matchDayId: 'md-g2-1', homeTeamId: 'team-11', awayTeamId: 'team-12' },
  { id: 'game-31', matchDayId: 'md-g2-2', homeTeamId: 'team-9', awayTeamId: 'team-11' },
  { id: 'game-32', matchDayId: 'md-g2-2', homeTeamId: 'team-10', awayTeamId: 'team-12' },
  { id: 'game-33', matchDayId: 'md-g2-3', homeTeamId: 'team-9', awayTeamId: 'team-12' },
  { id: 'game-34', matchDayId: 'md-g2-3', homeTeamId: 'team-10', awayTeamId: 'team-11' },
  // GE3 group-3: 8-team round-robin (team-13..20, PPA Rixheim 3=team-13 vs PPA Rixheim 4=team-17 on J1)
  { id: 'game-35', matchDayId: 'md-g3-1', homeTeamId: 'team-13', awayTeamId: 'team-17' },
  { id: 'game-36', matchDayId: 'md-g3-1', homeTeamId: 'team-14', awayTeamId: 'team-18' },
  { id: 'game-37', matchDayId: 'md-g3-1', homeTeamId: 'team-15', awayTeamId: 'team-19' },
  { id: 'game-38', matchDayId: 'md-g3-1', homeTeamId: 'team-16', awayTeamId: 'team-20' },
  { id: 'game-39', matchDayId: 'md-g3-2', homeTeamId: 'team-13', awayTeamId: 'team-14' },
  { id: 'game-40', matchDayId: 'md-g3-2', homeTeamId: 'team-15', awayTeamId: 'team-17' },
  { id: 'game-41', matchDayId: 'md-g3-2', homeTeamId: 'team-16', awayTeamId: 'team-18' },
  { id: 'game-42', matchDayId: 'md-g3-2', homeTeamId: 'team-19', awayTeamId: 'team-20' },
  { id: 'game-43', matchDayId: 'md-g3-3', homeTeamId: 'team-13', awayTeamId: 'team-15' },
  { id: 'game-44', matchDayId: 'md-g3-3', homeTeamId: 'team-14', awayTeamId: 'team-16' },
  { id: 'game-45', matchDayId: 'md-g3-3', homeTeamId: 'team-17', awayTeamId: 'team-19' },
  { id: 'game-46', matchDayId: 'md-g3-3', homeTeamId: 'team-18', awayTeamId: 'team-20' },
  { id: 'game-47', matchDayId: 'md-g3-4', homeTeamId: 'team-13', awayTeamId: 'team-16' },
  { id: 'game-48', matchDayId: 'md-g3-4', homeTeamId: 'team-14', awayTeamId: 'team-15' },
  { id: 'game-49', matchDayId: 'md-g3-4', homeTeamId: 'team-17', awayTeamId: 'team-20' },
  { id: 'game-50', matchDayId: 'md-g3-4', homeTeamId: 'team-18', awayTeamId: 'team-19' },
  { id: 'game-51', matchDayId: 'md-g3-5', homeTeamId: 'team-13', awayTeamId: 'team-18' },
  { id: 'game-52', matchDayId: 'md-g3-5', homeTeamId: 'team-14', awayTeamId: 'team-17' },
  { id: 'game-53', matchDayId: 'md-g3-5', homeTeamId: 'team-15', awayTeamId: 'team-20' },
  { id: 'game-54', matchDayId: 'md-g3-5', homeTeamId: 'team-16', awayTeamId: 'team-19' },
  { id: 'game-55', matchDayId: 'md-g3-6', homeTeamId: 'team-13', awayTeamId: 'team-19' },
  { id: 'game-56', matchDayId: 'md-g3-6', homeTeamId: 'team-14', awayTeamId: 'team-20' },
  { id: 'game-57', matchDayId: 'md-g3-6', homeTeamId: 'team-15', awayTeamId: 'team-18' },
  { id: 'game-58', matchDayId: 'md-g3-6', homeTeamId: 'team-16', awayTeamId: 'team-17' },
  { id: 'game-59', matchDayId: 'md-g3-7', homeTeamId: 'team-13', awayTeamId: 'team-20' },
  { id: 'game-60', matchDayId: 'md-g3-7', homeTeamId: 'team-14', awayTeamId: 'team-19' },
  { id: 'game-61', matchDayId: 'md-g3-7', homeTeamId: 'team-15', awayTeamId: 'team-16' },
  { id: 'game-62', matchDayId: 'md-g3-7', homeTeamId: 'team-17', awayTeamId: 'team-18' },
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
