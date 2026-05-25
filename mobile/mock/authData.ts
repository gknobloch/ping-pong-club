/**
 * Bundled mock auth data — mirrors src/mock/data.ts.
 * Used so the login screen works without the API server running.
 */
import type { User, Player } from '@shared/types'

export const mockAuthUsers: User[] = [
  { id: 'user-1', email: 'admin@example.com', role: 'general_admin', clubIds: [], captainTeamIds: [] },
  { id: 'user-2', email: 'club.admin@example.com', role: 'club_admin', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-3', email: 'joris.szulc@example.com', role: 'player', playerId: 'p2-player-5', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-4', email: 'christophe.heurtin@example.com', role: 'player', playerId: 'p2-player-23', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-5', email: 'gilles.knobloch@example.com', role: 'player', playerId: 'p2-player-24', clubIds: ['club-1'], captainTeamIds: [] },
  { id: 'user-6', email: 'sebastien.rentz@example.com', role: 'player', playerId: 'p2-player-12', clubIds: ['club-1'], captainTeamIds: [] },
]

// Minimal player records so we can show names before the API responds
export const mockAuthPlayers: Pick<Player, 'id' | 'firstName' | 'lastName'>[] = [
  { id: 'p2-player-5', firstName: 'Joris', lastName: 'Szulc' },
  { id: 'p2-player-23', firstName: 'Christophe', lastName: 'Heurtin' },
  { id: 'p2-player-24', firstName: 'Gilles', lastName: 'Knobloch' },
  { id: 'p2-player-12', firstName: 'Sébastien', lastName: 'Rentz' },
]
