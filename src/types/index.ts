export type Role = 'general_admin' | 'club_admin' | 'captain' | 'player'

export type PlayerStatus = 'active' | 'pending_validation' | 'archived'

export interface Address {
  id: string
  label: string
  street: string
  postalCode: string
  city: string
  isDefault: boolean
}

export interface Club {
  id: string
  affiliationNumber: string
  displayName: string
  addresses: Address[]
}

export interface Season {
  id: string
  displayName: string
  isArchived: boolean
  isActive: boolean
}

export interface Phase {
  id: string
  seasonId: string
  name: string
  displayName: string
  isArchived: boolean
  isActive: boolean
}

export interface Division {
  id: string
  phaseId: string
  displayName: string
  rank: number
  playersPerGame: number
}

export interface Group {
  id: string
  divisionId: string
  number: number
  teamIds: string[]
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  licenseNumber: string
  email: string
  phone: string
  birthDate?: string
  birthPlace?: string
  status: PlayerStatus
  clubId: string
  /** Display points (e.g. ranking); optional. */
  points?: string
}

export interface Team {
  id: string
  clubId: string
  phaseId: string
  number: number
  divisionId: string
  groupId: string
  gameLocationId: string
  defaultDay: string
  defaultTime: string
  captainId: string
  /** Roster for this team (phase). Used for availability and game selection. */
  playerIds: string[]
  /** Optional hex color for table/header display (e.g. #374151). */
  color?: string
  whatsappLink?: string
}

export type AvailabilityStatus = 'available' | 'maybe' | 'unavailable'

export type AvailabilityOverriddenBy = 'captain' | 'club_admin'

export interface GameAvailability {
  id: string
  gameId: string
  playerId: string
  status: AvailabilityStatus
  /** Set when captain or club admin overrides the player's choice */
  overriddenBy?: AvailabilityOverriddenBy
}

export interface MatchDay {
  id: string
  groupId: string
  number: number
  date: string
}

export interface Game {
  id: string
  matchDayId: string
  homeTeamId: string
  awayTeamId: string
  /** Optional time (e.g. "20h00"). */
  time?: string
}

/** Per game, per team: which players are selected to play (captain/club admin). */
export interface GameSelection {
  id: string
  gameId: string
  teamId: string
  playerIds: string[]
}

export interface User {
  id: string
  email: string
  role: Role
  playerId?: string
  clubIds: string[]
  captainTeamIds: string[]
}
