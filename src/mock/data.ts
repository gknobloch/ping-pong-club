import type { User, Club, Season, Phase, Division, Group, Team, Player, Address, MatchDay, Game, GameAvailability, GameSelection } from '@/types'

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
const ppaAddresses: Address[] = [
  { id: 'addr-1', label: 'Gymnase principal', street: '12 rue du Sport', postalCode: '68170', city: 'Rixheim', isDefault: true },
  { id: 'addr-2', label: 'Salle annexe', street: '5 avenue des Lilas', postalCode: '68170', city: 'Rixheim', isDefault: false },
]

const opponentAddr = (id: string, city: string): Address[] => [
  { id, label: 'Salle', street: '1 rue du Sport', postalCode: '68000', city, isDefault: true },
]

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------
export const mockClubs: Club[] = [
  { id: 'club-1', affiliationNumber: '06680011', displayName: 'PPA Rixheim', isArchived: false, addresses: ppaAddresses },
  // Opponent clubs (one per unique club name across all groups)
  { id: 'club-etival', affiliationNumber: '06880001', displayName: 'Etival', isArchived: false, addresses: opponentAddr('addr-etival', 'Etival') },
  { id: 'club-rosenau', affiliationNumber: '06680002', displayName: 'Rosenau', isArchived: false, addresses: opponentAddr('addr-rosenau', 'Rosenau') },
  { id: 'club-rc-strasbourg', affiliationNumber: '06670001', displayName: 'RC Strasbourg', isArchived: false, addresses: opponentAddr('addr-rcs', 'Strasbourg') },
  { id: 'club-vittel', affiliationNumber: '06880002', displayName: 'Vittel St Remy', isArchived: false, addresses: opponentAddr('addr-vittel', 'Vittel') },
  { id: 'club-illzach', affiliationNumber: '06680003', displayName: 'Illzach', isArchived: false, addresses: opponentAddr('addr-illzach', 'Illzach') },
  { id: 'club-moussey', affiliationNumber: '06570001', displayName: 'Moussey', isArchived: false, addresses: opponentAddr('addr-moussey', 'Moussey') },
  { id: 'club-anould', affiliationNumber: '06880003', displayName: 'Anould', isArchived: false, addresses: opponentAddr('addr-anould', 'Anould') },
  { id: 'club-colmar-mjc', affiliationNumber: '06680004', displayName: 'Colmar MJC', isArchived: false, addresses: opponentAddr('addr-cmjc', 'Colmar') },
  { id: 'club-colmar-aje', affiliationNumber: '06680005', displayName: 'Colmar AJE', isArchived: false, addresses: opponentAddr('addr-caje', 'Colmar') },
  { id: 'club-saint-louis', affiliationNumber: '06680006', displayName: 'Saint-Louis', isArchived: false, addresses: opponentAddr('addr-stlouis', 'Saint-Louis') },
  { id: 'club-huningue', affiliationNumber: '06680007', displayName: 'Huningue', isArchived: false, addresses: opponentAddr('addr-huningue', 'Huningue') },
  { id: 'club-ingersheim', affiliationNumber: '06680008', displayName: 'Ingersheim', isArchived: false, addresses: opponentAddr('addr-ingersheim', 'Ingersheim') },
  { id: 'club-issenheim', affiliationNumber: '06680009', displayName: 'Issenheim', isArchived: false, addresses: opponentAddr('addr-issenheim', 'Issenheim') },
  { id: 'club-wintzfelden', affiliationNumber: '06680010', displayName: 'Wintzfelden', isArchived: false, addresses: opponentAddr('addr-wintzfelden', 'Wintzfelden') },
  { id: 'club-thann', affiliationNumber: '06680012', displayName: 'Thann', isArchived: false, addresses: opponentAddr('addr-thann', 'Thann') },
  { id: 'club-soultz', affiliationNumber: '06680013', displayName: 'Soultz', isArchived: false, addresses: opponentAddr('addr-soultz', 'Soultz') },
  { id: 'club-wittelsheim', affiliationNumber: '06680014', displayName: 'Wittelsheim', isArchived: false, addresses: opponentAddr('addr-wittelsheim', 'Wittelsheim') },
  { id: 'club-fc-mulhouse', affiliationNumber: '06680015', displayName: 'FC Mulhouse', isArchived: false, addresses: opponentAddr('addr-fcm', 'Mulhouse') },
  { id: 'club-kembs', affiliationNumber: '06680016', displayName: 'Kembs', isArchived: false, addresses: opponentAddr('addr-kembs', 'Kembs') },
  { id: 'club-ensisheim', affiliationNumber: '06680017', displayName: 'Ensisheim TTMC', isArchived: false, addresses: opponentAddr('addr-ensisheim', 'Ensisheim') },
  { id: 'club-ballons', affiliationNumber: '06680018', displayName: 'Ballons des Vosges', isArchived: false, addresses: opponentAddr('addr-ballons', 'Ballons des Vosges') },
  { id: 'club-mulhouse-tt', affiliationNumber: '06680019', displayName: 'Mulhouse TT', isArchived: false, addresses: opponentAddr('addr-mutt', 'Mulhouse') },
]

// ---------------------------------------------------------------------------
// Season & Phase
// ---------------------------------------------------------------------------
export const mockSeasons: Season[] = [
  { id: 'season-1', displayName: '2025/2026', isArchived: false, isActive: true },
]

export const mockPhases: Phase[] = [
  { id: 'phase-1', seasonId: 'season-1', name: 'Phase 1', displayName: '2025/2026 Phase 1', isArchived: false, isActive: true },
]

// ---------------------------------------------------------------------------
// Divisions (one per PPA team level)
// ---------------------------------------------------------------------------
export const mockDivisions: Division[] = [
  { id: 'div-1', phaseId: 'phase-1', displayName: 'GE1', rank: 1, playersPerGame: 4, isArchived: false },
  { id: 'div-2', phaseId: 'phase-1', displayName: 'GE2', rank: 2, playersPerGame: 4, isArchived: false },
  { id: 'div-3', phaseId: 'phase-1', displayName: 'GE3', rank: 3, playersPerGame: 4, isArchived: false },
  { id: 'div-4', phaseId: 'phase-1', displayName: 'GE4', rank: 4, playersPerGame: 4, isArchived: false },
  { id: 'div-5', phaseId: 'phase-1', displayName: 'GE5', rank: 5, playersPerGame: 4, isArchived: false },
]

// ---------------------------------------------------------------------------
// Players — PPA Rixheim
// ---------------------------------------------------------------------------
export const mockPlayers: Player[] = [
  // Admin / system users
  { id: 'player-admin', firstName: 'Admin', lastName: 'Global', licenseNumber: '0000001', email: 'admin@example.com', phone: '', status: 'active', clubId: '' },
  { id: 'player-club-admin', firstName: 'Claire', lastName: 'Admin', licenseNumber: '0000002', email: 'club.admin@example.com', phone: '', status: 'active', clubId: 'club-1' },
  // Equipe 1
  { id: 'p-szulc', firstName: 'Joris', lastName: 'Szulc', licenseNumber: '686910', email: 'joris.szulc@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1887' },
  { id: 'p-canaque', firstName: 'Gregory', lastName: 'Canaque', licenseNumber: '425881', email: 'gregory.canaque@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1763' },
  { id: 'p-colle', firstName: 'Quentin', lastName: 'Colle', licenseNumber: '8810008', email: 'quentin.colle@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1665' },
  { id: 'p-lach', firstName: 'Stéphane', lastName: 'Lach', licenseNumber: '681364', email: 'stephane.lach@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1647' },
  { id: 'p-lotz', firstName: 'Enzo', lastName: 'Lotz', licenseNumber: '6716966', email: 'enzo.lotz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1566' },
  // Equipe 2
  { id: 'p-buchi', firstName: 'Christian', lastName: 'Buchi', licenseNumber: '6815117', email: 'christian.buchi@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1791' },
  { id: 'p-philippe', firstName: 'Olivier', lastName: 'Philippe', licenseNumber: '683975', email: 'olivier.philippe@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1661' },
  { id: 'p-ceroni', firstName: 'Hervé', lastName: 'Ceroni', licenseNumber: '684545', email: 'herve.ceroni@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1500' },
  { id: 'p-dangelser-f', firstName: 'Fabrice', lastName: 'Dangelser', licenseNumber: '682480', email: 'fabrice.dangelser@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1301' },
  { id: 'p-cunin', firstName: 'Cédric', lastName: 'Cunin', licenseNumber: '6810711', email: 'cedric.cunin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1301' },
  // Equipe 3
  { id: 'p-rentz', firstName: 'Sébastien', lastName: 'Rentz', licenseNumber: '687433', email: 'sebastien.rentz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1356' },
  { id: 'p-schatt', firstName: 'Sébastien', lastName: 'Schatt', licenseNumber: '685143', email: 'sebastien.schatt@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1267' },
  { id: 'p-schill', firstName: 'Yannick', lastName: 'Schill', licenseNumber: '6814304', email: 'yannick.schill@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1198' },
  { id: 'p-cristini', firstName: 'Nello', lastName: 'Cristini', licenseNumber: '683787', email: 'nello.cristini@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1186' },
  { id: 'p-dangelser-b', firstName: 'Bastien', lastName: 'Dangelser', licenseNumber: '684113', email: 'bastien.dangelser@example.com', phone: '', status: 'active', clubId: 'club-1', points: '754' },
  // Equipe 4
  { id: 'p-clement', firstName: 'Didier', lastName: 'Clément', licenseNumber: '392885', email: 'didier.clement@example.com', phone: '', status: 'active', clubId: 'club-1', points: '889' },
  { id: 'p-mougey', firstName: 'Mathieu', lastName: 'Mougey', licenseNumber: '6810243', email: 'mathieu.mougey@example.com', phone: '', status: 'active', clubId: 'club-1', points: '728' },
  { id: 'p-decoatpont', firstName: 'Bertrand', lastName: 'De Coatpont', licenseNumber: '6813454', email: 'bertrand.decoatpont@example.com', phone: '', status: 'active', clubId: 'club-1', points: '727' },
  { id: 'p-broglin', firstName: 'Nicolas', lastName: 'Broglin', licenseNumber: '6815877', email: 'nicolas.broglin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '713' },
  { id: 'p-schmitt', firstName: 'David', lastName: 'Schmitt', licenseNumber: '6815675', email: 'david.schmitt@example.com', phone: '', status: 'active', clubId: 'club-1', points: '704' },
  // Equipe 5
  { id: 'p-depauli', firstName: 'Patricia', lastName: 'De Pauli', licenseNumber: '6812597', email: 'patricia.depauli@example.com', phone: '', status: 'active', clubId: 'club-1', points: '735' },
  { id: 'p-knobloch', firstName: 'Gilles', lastName: 'Knobloch', licenseNumber: '6814428', email: 'gilles.knobloch@example.com', phone: '', status: 'active', clubId: 'club-1', points: '701' },
  { id: 'p-arif', firstName: 'Abdelaziz', lastName: 'Arif', licenseNumber: '9131446', email: 'abdelaziz.arif@example.com', phone: '', status: 'active', clubId: 'club-1', points: '702' },
  { id: 'p-heurtin', firstName: 'Christophe', lastName: 'Heurtin', licenseNumber: '6816317', email: 'christophe.heurtin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1050' },
  { id: 'p-zilbermann', firstName: 'Frédéric', lastName: 'Zilbermann', licenseNumber: '689768', email: 'frederic.zilbermann@example.com', phone: '', status: 'active', clubId: 'club-1', points: '707' },
  // Unassigned PPA player (shows in "Autres joueurs du club")
  { id: 'p-hoffmann', firstName: 'Marc', lastName: 'Hoffmann', licenseNumber: '6814449', email: 'marc.hoffmann@example.com', phone: '06 56 78 90 12', status: 'active', clubId: 'club-1', points: '620' },
]

// ---------------------------------------------------------------------------
// Groups (one per division, 8 teams each)
// ---------------------------------------------------------------------------
export const mockGroups: Group[] = [
  { id: 'group-1', divisionId: 'div-1', number: 1, teamIds: ['team-1', 'opp-etival-1', 'opp-rosenau-1', 'opp-rcs-2', 'opp-vittel-1', 'opp-illzach-2', 'opp-moussey-1', 'opp-anould-2'], isArchived: false },
  { id: 'group-2', divisionId: 'div-2', number: 1, teamIds: ['team-2', 'opp-illzach-3', 'opp-rosenau-2', 'opp-cmjc-3', 'opp-caje-1', 'opp-stlouis-1', 'opp-huningue-1', 'opp-ingersheim-1'], isArchived: false },
  { id: 'group-3', divisionId: 'div-3', number: 1, teamIds: ['team-3', 'opp-issenheim-1', 'opp-illzach-6', 'opp-wintzfelden-2', 'opp-huningue-2', 'opp-thann-2', 'opp-rosenau-4'], isArchived: false },
  { id: 'group-4', divisionId: 'div-4', number: 1, teamIds: ['team-4', 'opp-soultz-2', 'opp-wittelsheim-5', 'opp-illzach-8', 'opp-fcm-3', 'opp-kembs-2', 'opp-ensisheim-1', 'opp-rosenau-6'], isArchived: false },
  { id: 'group-5', divisionId: 'div-5', number: 1, teamIds: ['team-5', 'team-6', 'opp-issenheim-3', 'opp-illzach-7', 'opp-ballons-4', 'opp-mutt-5', 'opp-wittelsheim-4', 'opp-wintzfelden-3'], isArchived: false },
]

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
const oppTeam = (id: string, clubId: string, num: number, divId: string, groupId: string): Team => ({
  id, clubId, phaseId: 'phase-1', number: num, divisionId: divId, groupId,
  gameLocationId: '', defaultDay: '', defaultTime: '', captainId: '',
  isArchived: false, playerIds: [],
})

export const mockTeams: Team[] = [
  // PPA Rixheim teams
  {
    id: 'team-1', clubId: 'club-1', phaseId: 'phase-1', number: 1, divisionId: 'div-1', groupId: 'group-1',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00',
    captainId: 'p-szulc',
    playerIds: ['p-szulc', 'p-canaque', 'p-colle', 'p-lach', 'p-lotz'],
    rosterInitialPoints: { 'p-szulc': '1887', 'p-canaque': '1763', 'p-colle': '1665', 'p-lach': '1647', 'p-lotz': '1566' },
    color: '#374151', isArchived: false,
  },
  {
    id: 'team-2', clubId: 'club-1', phaseId: 'phase-1', number: 2, divisionId: 'div-2', groupId: 'group-2',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00',
    captainId: 'p-buchi',
    playerIds: ['p-buchi', 'p-philippe', 'p-ceroni', 'p-dangelser-f', 'p-cunin'],
    rosterInitialPoints: { 'p-buchi': '1791', 'p-philippe': '1661', 'p-ceroni': '1500', 'p-dangelser-f': '1301', 'p-cunin': '1301' },
    color: '#b91c1c', isArchived: false,
  },
  {
    id: 'team-3', clubId: 'club-1', phaseId: 'phase-1', number: 3, divisionId: 'div-3', groupId: 'group-3',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00',
    captainId: 'p-rentz',
    playerIds: ['p-rentz', 'p-schatt', 'p-schill', 'p-cristini', 'p-dangelser-b'],
    rosterInitialPoints: { 'p-rentz': '1356', 'p-schatt': '1267', 'p-schill': '1198', 'p-cristini': '1186', 'p-dangelser-b': '754' },
    color: '#15803d', isArchived: false,
  },
  {
    id: 'team-4', clubId: 'club-1', phaseId: 'phase-1', number: 4, divisionId: 'div-4', groupId: 'group-4',
    gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00',
    captainId: 'p-clement',
    playerIds: ['p-clement', 'p-mougey', 'p-decoatpont', 'p-broglin', 'p-schmitt'],
    rosterInitialPoints: { 'p-clement': '889', 'p-mougey': '728', 'p-decoatpont': '727', 'p-broglin': '713', 'p-schmitt': '704' },
    color: '#c2410c', isArchived: false,
  },
  {
    id: 'team-5', clubId: 'club-1', phaseId: 'phase-1', number: 5, divisionId: 'div-5', groupId: 'group-5',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00',
    captainId: 'p-heurtin',
    playerIds: ['p-depauli', 'p-knobloch', 'p-arif', 'p-heurtin', 'p-zilbermann'],
    rosterInitialPoints: { 'p-depauli': '735', 'p-knobloch': '701', 'p-arif': '702', 'p-heurtin': '1050', 'p-zilbermann': '707' },
    color: '#1d4ed8', isArchived: false,
  },
  {
    id: 'team-6', clubId: 'club-1', phaseId: 'phase-1', number: 6, divisionId: 'div-5', groupId: 'group-5',
    gameLocationId: 'addr-2', defaultDay: 'Samedi', defaultTime: '16h00',
    captainId: 'p-hoffmann',
    playerIds: ['p-hoffmann'],
    color: '#be185d', isArchived: false,
  },
  // Group 1 opponents (Equipe 1)
  oppTeam('opp-etival-1', 'club-etival', 1, 'div-1', 'group-1'),
  oppTeam('opp-rosenau-1', 'club-rosenau', 1, 'div-1', 'group-1'),
  oppTeam('opp-rcs-2', 'club-rc-strasbourg', 2, 'div-1', 'group-1'),
  oppTeam('opp-vittel-1', 'club-vittel', 1, 'div-1', 'group-1'),
  oppTeam('opp-illzach-2', 'club-illzach', 2, 'div-1', 'group-1'),
  oppTeam('opp-moussey-1', 'club-moussey', 1, 'div-1', 'group-1'),
  oppTeam('opp-anould-2', 'club-anould', 2, 'div-1', 'group-1'),
  // Group 2 opponents (Equipe 2)
  oppTeam('opp-illzach-3', 'club-illzach', 3, 'div-2', 'group-2'),
  oppTeam('opp-rosenau-2', 'club-rosenau', 2, 'div-2', 'group-2'),
  oppTeam('opp-cmjc-3', 'club-colmar-mjc', 3, 'div-2', 'group-2'),
  oppTeam('opp-caje-1', 'club-colmar-aje', 1, 'div-2', 'group-2'),
  oppTeam('opp-stlouis-1', 'club-saint-louis', 1, 'div-2', 'group-2'),
  oppTeam('opp-huningue-1', 'club-huningue', 1, 'div-2', 'group-2'),
  oppTeam('opp-ingersheim-1', 'club-ingersheim', 1, 'div-2', 'group-2'),
  // Group 3 opponents (Equipe 3) — 7-team group (J7 = Exempt)
  oppTeam('opp-issenheim-1', 'club-issenheim', 1, 'div-3', 'group-3'),
  oppTeam('opp-illzach-6', 'club-illzach', 6, 'div-3', 'group-3'),
  oppTeam('opp-wintzfelden-2', 'club-wintzfelden', 2, 'div-3', 'group-3'),
  oppTeam('opp-huningue-2', 'club-huningue', 2, 'div-3', 'group-3'),
  oppTeam('opp-thann-2', 'club-thann', 2, 'div-3', 'group-3'),
  oppTeam('opp-rosenau-4', 'club-rosenau', 4, 'div-3', 'group-3'),
  // Group 4 opponents (Equipe 4)
  oppTeam('opp-soultz-2', 'club-soultz', 2, 'div-4', 'group-4'),
  oppTeam('opp-wittelsheim-5', 'club-wittelsheim', 5, 'div-4', 'group-4'),
  oppTeam('opp-illzach-8', 'club-illzach', 8, 'div-4', 'group-4'),
  oppTeam('opp-fcm-3', 'club-fc-mulhouse', 3, 'div-4', 'group-4'),
  oppTeam('opp-kembs-2', 'club-kembs', 2, 'div-4', 'group-4'),
  oppTeam('opp-ensisheim-1', 'club-ensisheim', 1, 'div-4', 'group-4'),
  oppTeam('opp-rosenau-6', 'club-rosenau', 6, 'div-4', 'group-4'),
  // Group 5 opponents (Equipe 5) — team-6 (PPA Rixheim 6) is already above
  oppTeam('opp-issenheim-3', 'club-issenheim', 3, 'div-5', 'group-5'),
  oppTeam('opp-illzach-7', 'club-illzach', 7, 'div-5', 'group-5'),
  oppTeam('opp-ballons-4', 'club-ballons', 4, 'div-5', 'group-5'),
  oppTeam('opp-mutt-5', 'club-mulhouse-tt', 5, 'div-5', 'group-5'),
  oppTeam('opp-wittelsheim-4', 'club-wittelsheim', 4, 'div-5', 'group-5'),
  oppTeam('opp-wintzfelden-3', 'club-wintzfelden', 3, 'div-5', 'group-5'),
]

// ---------------------------------------------------------------------------
// Match Days (7 per group)
// ---------------------------------------------------------------------------
export const mockMatchDays: MatchDay[] = [
  // Group 1 (Equipe 1) — Samedi
  { id: 'md-g1-1', groupId: 'group-1', number: 1, date: '2025-09-27' },
  { id: 'md-g1-2', groupId: 'group-1', number: 2, date: '2025-10-11' },
  { id: 'md-g1-3', groupId: 'group-1', number: 3, date: '2025-11-08' },
  { id: 'md-g1-4', groupId: 'group-1', number: 4, date: '2025-11-15' },
  { id: 'md-g1-5', groupId: 'group-1', number: 5, date: '2025-11-29' },
  { id: 'md-g1-6', groupId: 'group-1', number: 6, date: '2025-12-13' },
  { id: 'md-g1-7', groupId: 'group-1', number: 7, date: '2026-01-10' },
  // Group 2 (Equipe 2) — Samedi (J4 = dimanche)
  { id: 'md-g2-1', groupId: 'group-2', number: 1, date: '2025-09-27' },
  { id: 'md-g2-2', groupId: 'group-2', number: 2, date: '2025-10-11' },
  { id: 'md-g2-3', groupId: 'group-2', number: 3, date: '2025-11-08' },
  { id: 'md-g2-4', groupId: 'group-2', number: 4, date: '2025-11-16' },
  { id: 'md-g2-5', groupId: 'group-2', number: 5, date: '2025-11-29' },
  { id: 'md-g2-6', groupId: 'group-2', number: 6, date: '2025-12-13' },
  { id: 'md-g2-7', groupId: 'group-2', number: 7, date: '2026-01-10' },
  // Group 3 (Equipe 3) — mixed days; J7 exists but Equipe 3 is exempt
  { id: 'md-g3-1', groupId: 'group-3', number: 1, date: '2025-09-27' },
  { id: 'md-g3-2', groupId: 'group-3', number: 2, date: '2025-10-10' },
  { id: 'md-g3-3', groupId: 'group-3', number: 3, date: '2025-11-08' },
  { id: 'md-g3-4', groupId: 'group-3', number: 4, date: '2025-11-14' },
  { id: 'md-g3-5', groupId: 'group-3', number: 5, date: '2025-11-29' },
  { id: 'md-g3-6', groupId: 'group-3', number: 6, date: '2025-12-13' },
  { id: 'md-g3-7', groupId: 'group-3', number: 7, date: '2026-01-10' },
  // Group 4 (Equipe 4) — Jeudi/Lundi/Mercredi/Samedi
  { id: 'md-g4-1', groupId: 'group-4', number: 1, date: '2025-09-22' },
  { id: 'md-g4-2', groupId: 'group-4', number: 2, date: '2025-10-09' },
  { id: 'md-g4-3', groupId: 'group-4', number: 3, date: '2025-11-05' },
  { id: 'md-g4-4', groupId: 'group-4', number: 4, date: '2025-11-13' },
  { id: 'md-g4-5', groupId: 'group-4', number: 5, date: '2025-11-27' },
  { id: 'md-g4-6', groupId: 'group-4', number: 6, date: '2025-12-13' },
  { id: 'md-g4-7', groupId: 'group-4', number: 7, date: '2026-01-08' },
  // Group 5 (Equipe 5) — Samedi/Vendredi
  { id: 'md-g5-1', groupId: 'group-5', number: 1, date: '2025-09-27' },
  { id: 'md-g5-2', groupId: 'group-5', number: 2, date: '2025-10-11' },
  { id: 'md-g5-3', groupId: 'group-5', number: 3, date: '2025-11-07' },
  { id: 'md-g5-4', groupId: 'group-5', number: 4, date: '2025-11-15' },
  { id: 'md-g5-5', groupId: 'group-5', number: 5, date: '2025-11-28' },
  { id: 'md-g5-6', groupId: 'group-5', number: 6, date: '2025-12-13' },
  { id: 'md-g5-7', groupId: 'group-5', number: 7, date: '2026-01-10' },
]

// ---------------------------------------------------------------------------
// Games (PPA Rixheim games only, home/away from screenshot)
// ---------------------------------------------------------------------------
export const mockGames: Game[] = [
  // Equipe 1 — all away in screenshot (opponent listed = away venue)
  { id: 'g1-1', matchDayId: 'md-g1-1', homeTeamId: 'opp-etival-1', awayTeamId: 'team-1' },
  { id: 'g1-2', matchDayId: 'md-g1-2', homeTeamId: 'opp-rosenau-1', awayTeamId: 'team-1' },
  { id: 'g1-3', matchDayId: 'md-g1-3', homeTeamId: 'opp-rcs-2', awayTeamId: 'team-1' },
  { id: 'g1-4', matchDayId: 'md-g1-4', homeTeamId: 'opp-vittel-1', awayTeamId: 'team-1' },
  { id: 'g1-5', matchDayId: 'md-g1-5', homeTeamId: 'opp-illzach-2', awayTeamId: 'team-1' },
  { id: 'g1-6', matchDayId: 'md-g1-6', homeTeamId: 'opp-moussey-1', awayTeamId: 'team-1' },
  { id: 'g1-7', matchDayId: 'md-g1-7', homeTeamId: 'opp-anould-2', awayTeamId: 'team-1' },
  // Equipe 2
  { id: 'g2-1', matchDayId: 'md-g2-1', homeTeamId: 'opp-illzach-3', awayTeamId: 'team-2' },
  { id: 'g2-2', matchDayId: 'md-g2-2', homeTeamId: 'opp-rosenau-2', awayTeamId: 'team-2' },
  { id: 'g2-3', matchDayId: 'md-g2-3', homeTeamId: 'opp-cmjc-3', awayTeamId: 'team-2' },
  { id: 'g2-4', matchDayId: 'md-g2-4', homeTeamId: 'opp-caje-1', awayTeamId: 'team-2' },
  { id: 'g2-5', matchDayId: 'md-g2-5', homeTeamId: 'opp-stlouis-1', awayTeamId: 'team-2' },
  { id: 'g2-6', matchDayId: 'md-g2-6', homeTeamId: 'opp-huningue-1', awayTeamId: 'team-2' },
  { id: 'g2-7', matchDayId: 'md-g2-7', homeTeamId: 'opp-ingersheim-1', awayTeamId: 'team-2' },
  // Equipe 3 (J7 = exempt, no game)
  { id: 'g3-1', matchDayId: 'md-g3-1', homeTeamId: 'opp-issenheim-1', awayTeamId: 'team-3' },
  { id: 'g3-2', matchDayId: 'md-g3-2', homeTeamId: 'opp-illzach-6', awayTeamId: 'team-3', time: '20h00' },
  { id: 'g3-3', matchDayId: 'md-g3-3', homeTeamId: 'opp-wintzfelden-2', awayTeamId: 'team-3' },
  { id: 'g3-4', matchDayId: 'md-g3-4', homeTeamId: 'opp-huningue-2', awayTeamId: 'team-3', time: '20h00' },
  { id: 'g3-5', matchDayId: 'md-g3-5', homeTeamId: 'opp-thann-2', awayTeamId: 'team-3' },
  { id: 'g3-6', matchDayId: 'md-g3-6', homeTeamId: 'opp-rosenau-4', awayTeamId: 'team-3' },
  // Equipe 4
  { id: 'g4-1', matchDayId: 'md-g4-1', homeTeamId: 'opp-soultz-2', awayTeamId: 'team-4', time: '20h00' },
  { id: 'g4-2', matchDayId: 'md-g4-2', homeTeamId: 'opp-wittelsheim-5', awayTeamId: 'team-4' },
  { id: 'g4-3', matchDayId: 'md-g4-3', homeTeamId: 'opp-illzach-8', awayTeamId: 'team-4', time: '20h00' },
  { id: 'g4-4', matchDayId: 'md-g4-4', homeTeamId: 'opp-fcm-3', awayTeamId: 'team-4' },
  { id: 'g4-5', matchDayId: 'md-g4-5', homeTeamId: 'opp-kembs-2', awayTeamId: 'team-4' },
  { id: 'g4-6', matchDayId: 'md-g4-6', homeTeamId: 'opp-ensisheim-1', awayTeamId: 'team-4', time: '16h00' },
  { id: 'g4-7', matchDayId: 'md-g4-7', homeTeamId: 'opp-rosenau-6', awayTeamId: 'team-4' },
  // Equipe 5
  { id: 'g5-1', matchDayId: 'md-g5-1', homeTeamId: 'team-6', awayTeamId: 'team-5' },
  { id: 'g5-2', matchDayId: 'md-g5-2', homeTeamId: 'opp-issenheim-3', awayTeamId: 'team-5' },
  { id: 'g5-3', matchDayId: 'md-g5-3', homeTeamId: 'opp-illzach-7', awayTeamId: 'team-5', time: '20h00' },
  { id: 'g5-4', matchDayId: 'md-g5-4', homeTeamId: 'opp-ballons-4', awayTeamId: 'team-5', time: '20h00' },
  { id: 'g5-5', matchDayId: 'md-g5-5', homeTeamId: 'opp-mutt-5', awayTeamId: 'team-5', time: '20h00' },
  { id: 'g5-6', matchDayId: 'md-g5-6', homeTeamId: 'opp-wittelsheim-4', awayTeamId: 'team-5' },
  { id: 'g5-7', matchDayId: 'md-g5-7', homeTeamId: 'opp-wintzfelden-3', awayTeamId: 'team-5' },
]

// ---------------------------------------------------------------------------
// Availabilities & Selections (empty — filled at runtime)
// ---------------------------------------------------------------------------
export const mockGameAvailabilities: GameAvailability[] = []
export const mockGameSelections: GameSelection[] = []

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const mockUsers: User[] = [
  { id: 'user-1', email: 'admin@example.com', role: 'general_admin', playerId: 'player-admin', clubIds: [], captainTeamIds: [] },
  { id: 'user-2', email: 'club.admin@example.com', role: 'club_admin', playerId: 'player-club-admin', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-3', email: 'joris.szulc@example.com', role: 'captain', playerId: 'p-szulc', clubIds: ['club-1'], captainTeamIds: ['team-1'] },
  { id: 'user-4', email: 'christophe.heurtin@example.com', role: 'player', playerId: 'p-heurtin', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-5', email: 'gilles.knobloch@example.com', role: 'player', playerId: 'p-knobloch', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-6', email: 'sebastien.rentz@example.com', role: 'captain', playerId: 'p-rentz', clubIds: ['club-1'], captainTeamIds: ['team-3'] },
]

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------
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
