import { describe, it, expect } from 'vitest'
import { computeBrulage, isPlayerEligibleForTeam } from './brulage'
import type { Team, Game, MatchDay, GameSelection, Group } from '@/types'

// Helper factories
const makeTeam = (overrides: Partial<Team> & { id: string; number: number; clubId: string; groupId: string }): Team => ({
  phaseId: 'phase-1',
  divisionId: 'div-1',
  gameLocationId: 'addr-1',
  defaultDay: 'Jeudi',
  defaultTime: '20h00',
  captainId: '',
  playerIds: [],
  ...overrides,
})

const makeMatchDay = (id: string, number: number, groupId: string): MatchDay => ({
  id,
  groupId,
  number,
  date: `2025-01-${String(number).padStart(2, '0')}`,
})

const makeGame = (id: string, matchDayId: string, homeTeamId: string, awayTeamId: string): Game => ({
  id,
  matchDayId,
  homeTeamId,
  awayTeamId,
})

const makeSel = (gameId: string, teamId: string, playerIds: string[]): GameSelection => ({
  id: `sel-${gameId}-${teamId}`,
  gameId,
  teamId,
  playerIds,
})

const makeGroup = (id: string, divisionId: string, teamIds: string[]): Group => ({
  id,
  divisionId,
  number: 1,
  teamIds,
})

describe('computeBrulage', () => {
  const team1 = makeTeam({ id: 'team-1', number: 1, clubId: 'club-1', groupId: 'group-a' })
  const team2 = makeTeam({ id: 'team-2', number: 2, clubId: 'club-1', groupId: 'group-b' })
  const team3 = makeTeam({ id: 'team-3', number: 3, clubId: 'club-1', groupId: 'group-b' })
  const clubTeams = [team1, team2, team3]

  const groupA = makeGroup('group-a', 'div-1', ['team-1', 'team-x'])
  const groupB = makeGroup('group-b', 'div-1', ['team-2', 'team-3'])
  const groups = [groupA, groupB]

  const md1 = makeMatchDay('md-1', 1, 'group-a')
  const md2 = makeMatchDay('md-2', 2, 'group-a')
  const md3 = makeMatchDay('md-3', 3, 'group-a')
  const matchDays = [md1, md2, md3]

  it('returns no restriction when player has no games', () => {
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, [], [], groups)
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('returns no restriction after only 1 game in a team (different groups)', () => {
    const game = makeGame('g-1', 'md-1', 'team-1', 'team-x')
    const sel = makeSel('g-1', 'team-1', ['player-1'])
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, [game], [sel], groups)
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('burns player after 2 games in a higher team (rule 1)', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['player-1']),
      makeSel('g-2', 'team-1', ['player-1']),
    ]
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, games, sels, groups)
    expect(result).toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('respects asOfMatchDayId cutoff', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['player-1']),
      makeSel('g-2', 'team-1', ['player-1']),
    ]
    // As of md-2, only md-1 counts (1 game) → no burn
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, games, sels, groups, 'md-2')
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })

    // As of md-3, md-1 and md-2 count (2 games) → burned
    const result2 = computeBrulage('player-1', 'club-1', clubTeams, matchDays, games, sels, groups, 'md-3')
    expect(result2).toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('burns into the lowest team number when burned in multiple teams (rule 1)', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
      makeGame('g-3', 'md-1', 'team-2', 'team-y'),
      makeGame('g-4', 'md-2', 'team-2', 'team-y'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['player-1']),
      makeSel('g-2', 'team-1', ['player-1']),
      makeSel('g-3', 'team-2', ['player-1']),
      makeSel('g-4', 'team-2', ['player-1']),
    ]
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, games, sels, groups)
    expect(result).toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('same-group rule: playing once in a team burns from the other team in same group (rule 2)', () => {
    // team-2 and team-3 are in group-b
    const mdB1 = makeMatchDay('md-b1', 1, 'group-b')
    const mdB2 = makeMatchDay('md-b2', 2, 'group-b')
    const allMDs = [mdB1, mdB2]

    const game = makeGame('g-1', 'md-b1', 'team-2', 'team-3')
    const sel = makeSel('g-1', 'team-2', ['player-1'])

    // As of md-b2, player played in team-2 in group-b → burned into team-2
    const result = computeBrulage('player-1', 'club-1', clubTeams, allMDs, [game], [sel], groups, 'md-b2')
    expect(result).toEqual({ burnedIntoTeamNumber: 2, burnedIntoTeamId: 'team-2' })
  })

  it('same-group rule does not apply on the same match-day', () => {
    const mdB1 = makeMatchDay('md-b1', 1, 'group-b')
    const allMDs = [mdB1]

    const game = makeGame('g-1', 'md-b1', 'team-2', 'team-3')
    const sel = makeSel('g-1', 'team-2', ['player-1'])

    // As of md-b1 itself, nothing counts yet
    const result = computeBrulage('player-1', 'club-1', clubTeams, allMDs, [game], [sel], groups, 'md-b1')
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('ignores games from other clubs', () => {
    const game = makeGame('g-1', 'md-1', 'team-other', 'team-x')
    const sel = makeSel('g-1', 'team-other', ['player-1'])

    // player-1 played in another club's team — should not affect club-1 brûlage
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, [game], [sel], groups)
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('ignores selections for other players', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['player-2']),
      makeSel('g-2', 'team-1', ['player-2']),
    ]
    const result = computeBrulage('player-1', 'club-1', clubTeams, matchDays, games, sels, groups)
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })
})

describe('isPlayerEligibleForTeam', () => {
  const team1 = makeTeam({ id: 'team-1', number: 1, clubId: 'club-1', groupId: 'group-a' })
  const team2 = makeTeam({ id: 'team-2', number: 2, clubId: 'club-1', groupId: 'group-b' })
  const team3 = makeTeam({ id: 'team-3', number: 3, clubId: 'club-1', groupId: 'group-c' })
  const clubTeams = [team1, team2, team3]

  const groupA = makeGroup('group-a', 'div-1', ['team-1', 'team-x'])
  const groupB = makeGroup('group-b', 'div-1', ['team-2', 'team-y'])
  const groupC = makeGroup('group-c', 'div-1', ['team-3', 'team-z'])
  const groups = [groupA, groupB, groupC]

  const md1 = makeMatchDay('md-1', 1, 'group-a')
  const md2 = makeMatchDay('md-2', 2, 'group-a')
  const md3 = makeMatchDay('md-3', 3, 'group-a')
  const matchDays = [md1, md2, md3]

  it('eligible everywhere when no games played', () => {
    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, [], [], groups, 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, [], [], groups, 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, [], [], groups, 'md-1')).toBe(true)
  })

  it('burned into team 1 → eligible for team 1, not for team 2 or 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['p1']),
      makeSel('g-2', 'team-1', ['p1']),
    ]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(false)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(false)
  })

  it('burned into team 2 → eligible for team 1 and 2, not for team 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-y'),
      makeGame('g-2', 'md-2', 'team-2', 'team-y'),
    ]
    const sels = [
      makeSel('g-1', 'team-2', ['p1']),
      makeSel('g-2', 'team-2', ['p1']),
    ]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, groups, 'md-3')).toBe(false)
  })
})
