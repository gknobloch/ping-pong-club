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
  whatsappLink?: string
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
}

export interface User {
  id: string
  email: string
  role: Role
  playerId?: string
  clubIds: string[]
  captainTeamIds: string[]
}
