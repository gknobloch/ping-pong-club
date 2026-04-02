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
// Divisions
// ---------------------------------------------------------------------------
export const mockDivisions: Division[] = [
  { id: 'div-1', phaseId: 'phase-1', displayName: 'GE1', rank: 1, playersPerGame: 4, isArchived: false },
  { id: 'div-2', phaseId: 'phase-1', displayName: 'GE2', rank: 2, playersPerGame: 4, isArchived: false },
  { id: 'div-3', phaseId: 'phase-1', displayName: 'GE3', rank: 3, playersPerGame: 4, isArchived: false },
  { id: 'div-4', phaseId: 'phase-1', displayName: 'GE4', rank: 4, playersPerGame: 4, isArchived: false },
  { id: 'div-5', phaseId: 'phase-1', displayName: 'GE5', rank: 5, playersPerGame: 4, isArchived: false },
  { id: 'div-6', phaseId: 'phase-1', displayName: 'GE6', rank: 6, playersPerGame: 3, isArchived: false },
  { id: 'div-7', phaseId: 'phase-1', displayName: 'GE7', rank: 7, playersPerGame: 3, isArchived: false },
]

// ---------------------------------------------------------------------------
// Players — PPA Rixheim (IDs match remote DB p2-player-* scheme)
// ---------------------------------------------------------------------------
export const mockPlayers: Player[] = [
  // Equipe 1
  { id: 'p2-player-5', firstName: 'Joris', lastName: 'Szulc', licenseNumber: '686910', email: 'joris.szulc@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1887' },
  { id: 'p2-player-1', firstName: 'Grégory', lastName: 'Canaque', licenseNumber: '425881', email: 'gregory.canaque@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1763' },
  { id: 'p2-player-2', firstName: 'Quentin', lastName: 'Colle', licenseNumber: '8810008', email: 'quentin.colle@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1665' },
  { id: 'p2-player-3', firstName: 'Stéphane', lastName: 'Lach', licenseNumber: '681364', email: 'stephane.lach@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1647' },
  { id: 'p2-player-4', firstName: 'Enzo', lastName: 'Lotz', licenseNumber: '6716966', email: 'enzo.lotz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1566' },
  // Equipe 2
  { id: 'p2-player-6', firstName: 'Christian', lastName: 'Buchi', licenseNumber: '6815117', email: 'christian.buchi@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1791' },
  { id: 'p2-player-10', firstName: 'Olivier', lastName: 'Philippe', licenseNumber: '683975', email: 'olivier.philippe@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1661' },
  { id: 'p2-player-7', firstName: 'Hervé', lastName: 'Ceroni', licenseNumber: '684545', email: 'herve.ceroni@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1500' },
  { id: 'p2-player-9', firstName: 'Fabrice', lastName: 'Dangelser', licenseNumber: '682480', email: 'fabrice.dangelser@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1301' },
  { id: 'p2-player-8', firstName: 'Cédric', lastName: 'Cunin', licenseNumber: '6810711', email: 'cedric.cunin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1301' },
  // Equipe 3
  { id: 'p2-player-12', firstName: 'Sébastien', lastName: 'Rentz', licenseNumber: '687433', email: 'sebastien.rentz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1356' },
  { id: 'p2-player-13', firstName: 'Sébastien', lastName: 'Schatt', licenseNumber: '685143', email: 'sebastien.schatt@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1267' },
  { id: 'p2-player-14', firstName: 'Yannick', lastName: 'Schill', licenseNumber: '6814304', email: 'yannick.schill@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1198' },
  { id: 'p2-player-11', firstName: 'Nello', lastName: 'Cristini', licenseNumber: '683787', email: 'nello.cristini@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1186' },
  { id: 'p2-player-17', firstName: 'Bastien', lastName: 'Dangelser', licenseNumber: '684113', email: 'bastien.dangelser@example.com', phone: '', status: 'active', clubId: 'club-1', points: '754' },
  // Equipe 4
  { id: 'p2-player-16', firstName: 'Didier', lastName: 'Clément', licenseNumber: '392885', email: 'didier.clement@example.com', phone: '', status: 'active', clubId: 'club-1', points: '889' },
  { id: 'p2-player-19', firstName: 'Mathieu', lastName: 'Mougey', licenseNumber: '6810243', email: 'mathieu.mougey@example.com', phone: '', status: 'active', clubId: 'club-1', points: '728' },
  { id: 'p2-player-18', firstName: 'Bertrand', lastName: 'De Coatpont', licenseNumber: '6813454', email: 'bertrand.decoatpont@example.com', phone: '', status: 'active', clubId: 'club-1', points: '727' },
  { id: 'p2-player-15', firstName: 'Nicolas', lastName: 'Broglin', licenseNumber: '6815877', email: 'nicolas.broglin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '713' },
  { id: 'p2-player-20', firstName: 'David', lastName: 'Schmitt', licenseNumber: '6815675', email: 'david.schmitt@example.com', phone: '', status: 'active', clubId: 'club-1', points: '704' },
  // Equipe 5
  { id: 'p2-player-22', firstName: 'Patricia', lastName: 'De Pauli', licenseNumber: '6812597', email: 'patricia.depauli@example.com', phone: '', status: 'active', clubId: 'club-1', points: '735' },
  { id: 'p2-player-24', firstName: 'Gilles', lastName: 'Knobloch', licenseNumber: '6814428', email: 'gilles.knobloch@example.com', phone: '', status: 'active', clubId: 'club-1', points: '701' },
  { id: 'p2-player-21', firstName: 'Abdelaziz', lastName: 'Arif', licenseNumber: '9131446', email: 'abdelaziz.arif@example.com', phone: '', status: 'active', clubId: 'club-1', points: '702' },
  { id: 'p2-player-23', firstName: 'Christophe', lastName: 'Heurtin', licenseNumber: '6816317', email: 'christophe.heurtin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1050' },
  { id: 'p2-player-26', firstName: 'Frédéric', lastName: 'Zilbermann', licenseNumber: '689768', email: 'frederic.zilbermann@example.com', phone: '', status: 'active', clubId: 'club-1', points: '707' },
  // Equipe 6
  { id: 'p2-player-29', firstName: 'Christophe', lastName: 'Hueber', licenseNumber: '686956', email: 'christophe.hueber@example.com', phone: '', status: 'active', clubId: 'club-1', points: '632' },
  { id: 'p2-player-39', firstName: 'Samuel', lastName: 'Canemolla', licenseNumber: '6816075', email: 'samuel.canemolla@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-40', firstName: 'Yvan', lastName: 'Meyer', licenseNumber: '6815960', email: 'yvan.meyer@example.com', phone: '', status: 'active', clubId: 'club-1', points: '503' },
  { id: 'p2-player-41', firstName: 'Nathan', lastName: 'Moreau', licenseNumber: '6816100', email: 'nathan.moreau@example.com', phone: '', status: 'active', clubId: 'club-1', points: '561' },
  { id: 'p2-player-42', firstName: 'Sacha', lastName: 'Pent', licenseNumber: '6816097', email: 'sacha.pent@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-38', firstName: 'Quentin', lastName: 'Broglin', licenseNumber: '6816118', email: 'quentin.broglin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-43', firstName: 'Léo', lastName: 'Remetter', licenseNumber: '6815965', email: 'leo.remetter@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-44', firstName: 'Mathéo', lastName: 'Scremin', licenseNumber: '6816084', email: 'matheo.scremin@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  // Equipe 7
  { id: 'p2-player-33', firstName: 'Eric', lastName: 'Cavasino', licenseNumber: '6815606', email: 'eric.cavasino@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-35', firstName: 'Luc', lastName: 'Guehl', licenseNumber: '6816152', email: 'luc.guehl@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-34', firstName: 'Boris', lastName: 'Fessler', licenseNumber: '6816176', email: 'boris.fessler@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-36', firstName: 'Bruno', lastName: 'Lafont', licenseNumber: '6816419', email: 'bruno.lafont@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-37', firstName: 'Alain', lastName: 'Schillinger', licenseNumber: '6816418', email: 'alain.schillinger@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  // Equipe 8
  { id: 'p2-player-32', firstName: 'Vincent', lastName: 'Rambeau', licenseNumber: '6815464', email: 'vincent.rambeau@example.com', phone: '', status: 'active', clubId: 'club-1', points: '607' },
  { id: 'p2-player-27', firstName: 'Jacky', lastName: 'Antony', licenseNumber: '6815563', email: 'jacky.antony@example.com', phone: '', status: 'active', clubId: 'club-1', points: '501' },
  { id: 'p2-player-28', firstName: 'Stéphane', lastName: 'Donditz', licenseNumber: '6816101', email: 'stephane.donditz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-30', firstName: 'Jean-Claude', lastName: 'Laffuge', licenseNumber: '68357', email: 'jeanclaude.laffuge@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  { id: 'p2-player-31', firstName: 'Gilles', lastName: 'Metz', licenseNumber: '6816164', email: 'gilles.metz@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
  // Remplaçante (unassigned)
  { id: 'p2-player-45', firstName: 'Marie-Line', lastName: 'Wertenschlag', licenseNumber: '686416', email: 'marieline.wertenschlag@example.com', phone: '', status: 'active', clubId: 'club-1', points: '1287' },
  // Equipe 5 extra
  { id: 'p2-player-25', firstName: 'Jordan', lastName: 'Pesenti', licenseNumber: '6718937', email: 'jordan.pesenti@example.com', phone: '', status: 'active', clubId: 'club-1', points: '500' },
]

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
export const mockGroups: Group[] = [
  { id: 'group-1', divisionId: 'div-1', number: 1, teamIds: ['team-1', 'opp-etival-1', 'opp-rosenau-1', 'opp-rcs-2', 'opp-vittel-1', 'opp-illzach-2', 'opp-moussey-1', 'opp-anould-2'], isArchived: false },
  { id: 'group-2', divisionId: 'div-2', number: 1, teamIds: ['team-2', 'opp-illzach-3', 'opp-rosenau-2', 'opp-cmjc-3', 'opp-caje-1', 'opp-stlouis-1', 'opp-huningue-1', 'opp-ingersheim-1'], isArchived: false },
  { id: 'group-3', divisionId: 'div-3', number: 1, teamIds: ['team-3', 'opp-issenheim-1', 'opp-illzach-6', 'opp-wintzfelden-2', 'opp-huningue-2', 'opp-thann-2', 'opp-rosenau-4'], isArchived: false },
  { id: 'group-4', divisionId: 'div-4', number: 1, teamIds: ['team-4', 'opp-soultz-2', 'opp-wittelsheim-5', 'opp-illzach-8', 'opp-fcm-3', 'opp-kembs-2', 'opp-ensisheim-1', 'opp-rosenau-6'], isArchived: false },
  { id: 'group-5', divisionId: 'div-5', number: 1, teamIds: ['team-5', 'team-6', 'opp-issenheim-3', 'opp-illzach-7', 'opp-ballons-4', 'opp-mutt-5', 'opp-wittelsheim-4', 'opp-wintzfelden-3'], isArchived: false },
  { id: 'group-6', divisionId: 'div-6', number: 1, teamIds: ['team-7', 'opp-huningue-3', 'opp-mutt-7', 'opp-thann-5', 'opp-stlouis-3', 'opp-kembs-3', 'opp-illzach-10', 'opp-soultz-4'], isArchived: false },
  { id: 'group-7', divisionId: 'div-7', number: 1, teamIds: ['team-8', 'opp-rosenau-7', 'opp-thann-4', 'opp-issenheim-4', 'opp-huningue-4', 'opp-kembs-6', 'opp-kembs-4', 'opp-illzach-11'], isArchived: false },
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
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00', captainId: 'p2-player-2',
    playerIds: ['p2-player-5', 'p2-player-1', 'p2-player-2', 'p2-player-3', 'p2-player-4'],
    rosterInitialPoints: { 'p2-player-5': '1887', 'p2-player-1': '1763', 'p2-player-2': '1665', 'p2-player-3': '1647', 'p2-player-4': '1566' },
    color: '#374151', isArchived: false,
  },
  {
    id: 'team-2', clubId: 'club-1', phaseId: 'phase-1', number: 2, divisionId: 'div-2', groupId: 'group-2',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00', captainId: 'p2-player-6',
    playerIds: ['p2-player-6', 'p2-player-10', 'p2-player-7', 'p2-player-9', 'p2-player-8'],
    rosterInitialPoints: { 'p2-player-6': '1791', 'p2-player-10': '1661', 'p2-player-7': '1500', 'p2-player-9': '1301', 'p2-player-8': '1301' },
    color: '#b91c1c', isArchived: false,
  },
  {
    id: 'team-3', clubId: 'club-1', phaseId: 'phase-1', number: 3, divisionId: 'div-3', groupId: 'group-3',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00', captainId: 'p2-player-12',
    playerIds: ['p2-player-12', 'p2-player-13', 'p2-player-14', 'p2-player-11', 'p2-player-17'],
    rosterInitialPoints: { 'p2-player-12': '1356', 'p2-player-13': '1267', 'p2-player-14': '1198', 'p2-player-11': '1186', 'p2-player-17': '754' },
    color: '#15803d', isArchived: false,
  },
  {
    id: 'team-4', clubId: 'club-1', phaseId: 'phase-1', number: 4, divisionId: 'div-4', groupId: 'group-4',
    gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'p2-player-16',
    playerIds: ['p2-player-16', 'p2-player-19', 'p2-player-18', 'p2-player-15', 'p2-player-20'],
    rosterInitialPoints: { 'p2-player-16': '889', 'p2-player-19': '728', 'p2-player-18': '727', 'p2-player-15': '713', 'p2-player-20': '704' },
    color: '#c2410c', isArchived: false,
  },
  {
    id: 'team-5', clubId: 'club-1', phaseId: 'phase-1', number: 5, divisionId: 'div-5', groupId: 'group-5',
    gameLocationId: 'addr-1', defaultDay: 'Samedi', defaultTime: '16h00', captainId: 'p2-player-23',
    playerIds: ['p2-player-22', 'p2-player-24', 'p2-player-21', 'p2-player-23', 'p2-player-26'],
    rosterInitialPoints: { 'p2-player-22': '735', 'p2-player-24': '701', 'p2-player-21': '702', 'p2-player-23': '1050', 'p2-player-26': '707' },
    color: '#1d4ed8', isArchived: false,
  },
  {
    id: 'team-6', clubId: 'club-1', phaseId: 'phase-1', number: 6, divisionId: 'div-5', groupId: 'group-5',
    gameLocationId: 'addr-2', defaultDay: 'Samedi', defaultTime: '16h00', captainId: 'p2-player-42',
    playerIds: ['p2-player-29', 'p2-player-39', 'p2-player-40', 'p2-player-41', 'p2-player-42', 'p2-player-38', 'p2-player-43', 'p2-player-44'],
    rosterInitialPoints: { 'p2-player-29': '632', 'p2-player-39': '500', 'p2-player-40': '503', 'p2-player-41': '561', 'p2-player-42': '500', 'p2-player-38': '500', 'p2-player-43': '500', 'p2-player-44': '500' },
    color: '#be185d', isArchived: false,
  },
  {
    id: 'team-7', clubId: 'club-1', phaseId: 'phase-1', number: 7, divisionId: 'div-6', groupId: 'group-6',
    gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'p2-player-33',
    playerIds: ['p2-player-33', 'p2-player-35', 'p2-player-34', 'p2-player-36', 'p2-player-37'],
    rosterInitialPoints: { 'p2-player-33': '500', 'p2-player-35': '500', 'p2-player-34': '500', 'p2-player-36': '500', 'p2-player-37': '500' },
    color: '#7c2d12', isArchived: false,
  },
  {
    id: 'team-8', clubId: 'club-1', phaseId: 'phase-1', number: 8, divisionId: 'div-7', groupId: 'group-7',
    gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'p2-player-32',
    playerIds: ['p2-player-32', 'p2-player-27', 'p2-player-28', 'p2-player-30', 'p2-player-31'],
    rosterInitialPoints: { 'p2-player-32': '607', 'p2-player-27': '501', 'p2-player-28': '500', 'p2-player-30': '500', 'p2-player-31': '500' },
    color: '#0d9488', isArchived: false,
  },
  // Group 1-5 opponents
  oppTeam('opp-etival-1', 'club-etival', 1, 'div-1', 'group-1'),
  oppTeam('opp-rosenau-1', 'club-rosenau', 1, 'div-1', 'group-1'),
  oppTeam('opp-rcs-2', 'club-rc-strasbourg', 2, 'div-1', 'group-1'),
  oppTeam('opp-vittel-1', 'club-vittel', 1, 'div-1', 'group-1'),
  oppTeam('opp-illzach-2', 'club-illzach', 2, 'div-1', 'group-1'),
  oppTeam('opp-moussey-1', 'club-moussey', 1, 'div-1', 'group-1'),
  oppTeam('opp-anould-2', 'club-anould', 2, 'div-1', 'group-1'),
  oppTeam('opp-illzach-3', 'club-illzach', 3, 'div-2', 'group-2'),
  oppTeam('opp-rosenau-2', 'club-rosenau', 2, 'div-2', 'group-2'),
  oppTeam('opp-cmjc-3', 'club-colmar-mjc', 3, 'div-2', 'group-2'),
  oppTeam('opp-caje-1', 'club-colmar-aje', 1, 'div-2', 'group-2'),
  oppTeam('opp-stlouis-1', 'club-saint-louis', 1, 'div-2', 'group-2'),
  oppTeam('opp-huningue-1', 'club-huningue', 1, 'div-2', 'group-2'),
  oppTeam('opp-ingersheim-1', 'club-ingersheim', 1, 'div-2', 'group-2'),
  oppTeam('opp-issenheim-1', 'club-issenheim', 1, 'div-3', 'group-3'),
  oppTeam('opp-illzach-6', 'club-illzach', 6, 'div-3', 'group-3'),
  oppTeam('opp-wintzfelden-2', 'club-wintzfelden', 2, 'div-3', 'group-3'),
  oppTeam('opp-huningue-2', 'club-huningue', 2, 'div-3', 'group-3'),
  oppTeam('opp-thann-2', 'club-thann', 2, 'div-3', 'group-3'),
  oppTeam('opp-rosenau-4', 'club-rosenau', 4, 'div-3', 'group-3'),
  oppTeam('opp-soultz-2', 'club-soultz', 2, 'div-4', 'group-4'),
  oppTeam('opp-wittelsheim-5', 'club-wittelsheim', 5, 'div-4', 'group-4'),
  oppTeam('opp-illzach-8', 'club-illzach', 8, 'div-4', 'group-4'),
  oppTeam('opp-fcm-3', 'club-fc-mulhouse', 3, 'div-4', 'group-4'),
  oppTeam('opp-kembs-2', 'club-kembs', 2, 'div-4', 'group-4'),
  oppTeam('opp-ensisheim-1', 'club-ensisheim', 1, 'div-4', 'group-4'),
  oppTeam('opp-rosenau-6', 'club-rosenau', 6, 'div-4', 'group-4'),
  oppTeam('opp-issenheim-3', 'club-issenheim', 3, 'div-5', 'group-5'),
  oppTeam('opp-illzach-7', 'club-illzach', 7, 'div-5', 'group-5'),
  oppTeam('opp-ballons-4', 'club-ballons', 4, 'div-5', 'group-5'),
  oppTeam('opp-mutt-5', 'club-mulhouse-tt', 5, 'div-5', 'group-5'),
  oppTeam('opp-wittelsheim-4', 'club-wittelsheim', 4, 'div-5', 'group-5'),
  oppTeam('opp-wintzfelden-3', 'club-wintzfelden', 3, 'div-5', 'group-5'),
  // Group 6 opponents (Equipe 7)
  oppTeam('opp-huningue-3', 'club-huningue', 3, 'div-6', 'group-6'),
  oppTeam('opp-mutt-7', 'club-mulhouse-tt', 7, 'div-6', 'group-6'),
  oppTeam('opp-thann-5', 'club-thann', 5, 'div-6', 'group-6'),
  oppTeam('opp-stlouis-3', 'club-saint-louis', 3, 'div-6', 'group-6'),
  oppTeam('opp-kembs-3', 'club-kembs', 3, 'div-6', 'group-6'),
  oppTeam('opp-illzach-10', 'club-illzach', 10, 'div-6', 'group-6'),
  oppTeam('opp-soultz-4', 'club-soultz', 4, 'div-6', 'group-6'),
  // Group 7 opponents (Equipe 8)
  oppTeam('opp-rosenau-7', 'club-rosenau', 7, 'div-7', 'group-7'),
  oppTeam('opp-thann-4', 'club-thann', 4, 'div-7', 'group-7'),
  oppTeam('opp-issenheim-4', 'club-issenheim', 4, 'div-7', 'group-7'),
  oppTeam('opp-huningue-4', 'club-huningue', 4, 'div-7', 'group-7'),
  oppTeam('opp-kembs-6', 'club-kembs', 6, 'div-7', 'group-7'),
  oppTeam('opp-kembs-4', 'club-kembs', 4, 'div-7', 'group-7'),
  oppTeam('opp-illzach-11', 'club-illzach', 11, 'div-7', 'group-7'),
]

// ---------------------------------------------------------------------------
// Match Days (7 per group)
// ---------------------------------------------------------------------------
export const mockMatchDays: MatchDay[] = [
  // Group 1 (Equipe 1)
  { id: 'md-g1-1', groupId: 'group-1', number: 1, date: '2025-09-27' },
  { id: 'md-g1-2', groupId: 'group-1', number: 2, date: '2025-10-11' },
  { id: 'md-g1-3', groupId: 'group-1', number: 3, date: '2025-11-08' },
  { id: 'md-g1-4', groupId: 'group-1', number: 4, date: '2025-11-15' },
  { id: 'md-g1-5', groupId: 'group-1', number: 5, date: '2025-11-29' },
  { id: 'md-g1-6', groupId: 'group-1', number: 6, date: '2025-12-13' },
  { id: 'md-g1-7', groupId: 'group-1', number: 7, date: '2026-01-10' },
  // Group 2 (Equipe 2)
  { id: 'md-g2-1', groupId: 'group-2', number: 1, date: '2025-09-27' },
  { id: 'md-g2-2', groupId: 'group-2', number: 2, date: '2025-10-11' },
  { id: 'md-g2-3', groupId: 'group-2', number: 3, date: '2025-11-08' },
  { id: 'md-g2-4', groupId: 'group-2', number: 4, date: '2025-11-16' },
  { id: 'md-g2-5', groupId: 'group-2', number: 5, date: '2025-11-29' },
  { id: 'md-g2-6', groupId: 'group-2', number: 6, date: '2025-12-13' },
  { id: 'md-g2-7', groupId: 'group-2', number: 7, date: '2026-01-10' },
  // Group 3 (Equipe 3)
  { id: 'md-g3-1', groupId: 'group-3', number: 1, date: '2025-09-27' },
  { id: 'md-g3-2', groupId: 'group-3', number: 2, date: '2025-10-10' },
  { id: 'md-g3-3', groupId: 'group-3', number: 3, date: '2025-11-08' },
  { id: 'md-g3-4', groupId: 'group-3', number: 4, date: '2025-11-14' },
  { id: 'md-g3-5', groupId: 'group-3', number: 5, date: '2025-11-29' },
  { id: 'md-g3-6', groupId: 'group-3', number: 6, date: '2025-12-13' },
  { id: 'md-g3-7', groupId: 'group-3', number: 7, date: '2026-01-10' },
  // Group 4 (Equipe 4)
  { id: 'md-g4-1', groupId: 'group-4', number: 1, date: '2025-09-22' },
  { id: 'md-g4-2', groupId: 'group-4', number: 2, date: '2025-10-09' },
  { id: 'md-g4-3', groupId: 'group-4', number: 3, date: '2025-11-05' },
  { id: 'md-g4-4', groupId: 'group-4', number: 4, date: '2025-11-13' },
  { id: 'md-g4-5', groupId: 'group-4', number: 5, date: '2025-11-27' },
  { id: 'md-g4-6', groupId: 'group-4', number: 6, date: '2025-12-13' },
  { id: 'md-g4-7', groupId: 'group-4', number: 7, date: '2026-01-08' },
  // Group 5 (Equipe 5 & 6)
  { id: 'md-g5-1', groupId: 'group-5', number: 1, date: '2025-09-27' },
  { id: 'md-g5-2', groupId: 'group-5', number: 2, date: '2025-10-11' },
  { id: 'md-g5-3', groupId: 'group-5', number: 3, date: '2025-11-07' },
  { id: 'md-g5-4', groupId: 'group-5', number: 4, date: '2025-11-15' },
  { id: 'md-g5-5', groupId: 'group-5', number: 5, date: '2025-11-28' },
  { id: 'md-g5-6', groupId: 'group-5', number: 6, date: '2025-12-13' },
  { id: 'md-g5-7', groupId: 'group-5', number: 7, date: '2026-01-10' },
  // Group 6 (Equipe 7)
  { id: 'md-g6-1', groupId: 'group-6', number: 1, date: '2025-09-25' },
  { id: 'md-g6-2', groupId: 'group-6', number: 2, date: '2025-10-09' },
  { id: 'md-g6-3', groupId: 'group-6', number: 3, date: '2025-11-08' },
  { id: 'md-g6-4', groupId: 'group-6', number: 4, date: '2025-11-11' },
  { id: 'md-g6-5', groupId: 'group-6', number: 5, date: '2025-11-27' },
  { id: 'md-g6-6', groupId: 'group-6', number: 6, date: '2025-12-10' },
  { id: 'md-g6-7', groupId: 'group-6', number: 7, date: '2026-01-08' },
  // Group 7 (Equipe 8)
  { id: 'md-g7-1', groupId: 'group-7', number: 1, date: '2025-09-25' },
  { id: 'md-g7-2', groupId: 'group-7', number: 2, date: '2025-10-09' },
  { id: 'md-g7-3', groupId: 'group-7', number: 3, date: '2025-11-07' },
  { id: 'md-g7-4', groupId: 'group-7', number: 4, date: '2025-11-13' },
  { id: 'md-g7-5', groupId: 'group-7', number: 5, date: '2025-11-27' },
  { id: 'md-g7-6', groupId: 'group-7', number: 6, date: '2025-12-09' },
  { id: 'md-g7-7', groupId: 'group-7', number: 7, date: '2026-01-08' },
]

// ---------------------------------------------------------------------------
// Games (PPA Rixheim games only)
// ---------------------------------------------------------------------------
export const mockGames: Game[] = [
  // Equipe 1
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
  // Equipe 3 (J7 = exempt)
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
  // Equipe 6
  { id: 'g6-2', matchDayId: 'md-g5-2', homeTeamId: 'opp-illzach-7', awayTeamId: 'team-6' },
  { id: 'g6-3', matchDayId: 'md-g5-3', homeTeamId: 'opp-ballons-4', awayTeamId: 'team-6' },
  { id: 'g6-4', matchDayId: 'md-g5-4', homeTeamId: 'opp-mutt-5', awayTeamId: 'team-6' },
  { id: 'g6-5', matchDayId: 'md-g5-5', homeTeamId: 'opp-wittelsheim-4', awayTeamId: 'team-6' },
  { id: 'g6-6', matchDayId: 'md-g5-6', homeTeamId: 'opp-wintzfelden-3', awayTeamId: 'team-6' },
  { id: 'g6-7', matchDayId: 'md-g5-7', homeTeamId: 'opp-issenheim-3', awayTeamId: 'team-6' },
  // Equipe 7
  { id: 'g7-1', matchDayId: 'md-g6-1', homeTeamId: 'opp-huningue-3', awayTeamId: 'team-7' },
  { id: 'g7-2', matchDayId: 'md-g6-2', homeTeamId: 'opp-mutt-7', awayTeamId: 'team-7' },
  { id: 'g7-3', matchDayId: 'md-g6-3', homeTeamId: 'opp-thann-5', awayTeamId: 'team-7' },
  { id: 'g7-4', matchDayId: 'md-g6-4', homeTeamId: 'opp-stlouis-3', awayTeamId: 'team-7' },
  { id: 'g7-5', matchDayId: 'md-g6-5', homeTeamId: 'opp-kembs-3', awayTeamId: 'team-7' },
  { id: 'g7-6', matchDayId: 'md-g6-6', homeTeamId: 'opp-illzach-10', awayTeamId: 'team-7' },
  { id: 'g7-7', matchDayId: 'md-g6-7', homeTeamId: 'opp-soultz-4', awayTeamId: 'team-7' },
  // Equipe 8
  { id: 'g8-1', matchDayId: 'md-g7-1', homeTeamId: 'opp-rosenau-7', awayTeamId: 'team-8' },
  { id: 'g8-2', matchDayId: 'md-g7-2', homeTeamId: 'opp-thann-4', awayTeamId: 'team-8' },
  { id: 'g8-3', matchDayId: 'md-g7-3', homeTeamId: 'opp-issenheim-4', awayTeamId: 'team-8' },
  { id: 'g8-4', matchDayId: 'md-g7-4', homeTeamId: 'opp-huningue-4', awayTeamId: 'team-8' },
  { id: 'g8-5', matchDayId: 'md-g7-5', homeTeamId: 'opp-kembs-6', awayTeamId: 'team-8' },
  { id: 'g8-6', matchDayId: 'md-g7-6', homeTeamId: 'opp-kembs-4', awayTeamId: 'team-8' },
  { id: 'g8-7', matchDayId: 'md-g7-7', homeTeamId: 'opp-illzach-11', awayTeamId: 'team-8' },
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
  { id: 'user-1', email: 'admin@example.com', role: 'general_admin', clubIds: [], captainTeamIds: [] },
  { id: 'user-2', email: 'club.admin@example.com', role: 'club_admin', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-3', email: 'joris.szulc@example.com', role: 'player', playerId: 'p2-player-5', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-4', email: 'christophe.heurtin@example.com', role: 'player', playerId: 'p2-player-23', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-5', email: 'gilles.knobloch@example.com', role: 'player', playerId: 'p2-player-24', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-6', email: 'sebastien.rentz@example.com', role: 'captain', playerId: 'p2-player-12', clubIds: ['club-1'], captainTeamIds: ['team-3'] },
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
