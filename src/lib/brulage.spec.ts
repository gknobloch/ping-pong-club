import { describe, it, expect } from 'vitest'
import { computeBrulage, isPlayerEligibleForTeam } from './brulage'
import type { Team, Game, MatchDay, GameSelection } from '@/types'

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

describe('computeBrulage', () => {
  const team1 = makeTeam({ id: 'team-1', number: 1, clubId: 'club-1', groupId: 'group-a' })
  const team2 = makeTeam({ id: 'team-2', number: 2, clubId: 'club-1', groupId: 'group-b' })
  const team3 = makeTeam({ id: 'team-3', number: 3, clubId: 'club-1', groupId: 'group-b' })
  const clubTeams = [team1, team2, team3]

  const md1 = makeMatchDay('md-1', 1, 'group-a')
  const md2 = makeMatchDay('md-2', 2, 'group-a')
  const md3 = makeMatchDay('md-3', 3, 'group-a')
  const matchDays = [md1, md2, md3]

  it('returns no restriction when player has no games', () => {
    const result = computeBrulage('player-1', clubTeams, matchDays, [], [])
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('returns no restriction after only 1 game in a team', () => {
    const game = makeGame('g-1', 'md-1', 'team-1', 'team-x')
    const sel = makeSel('g-1', 'team-1', ['player-1'])
    const result = computeBrulage('player-1', clubTeams, matchDays, [game], [sel])
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
    const result = computeBrulage('player-1', clubTeams, matchDays, games, sels)
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
    const result = computeBrulage('player-1', clubTeams, matchDays, games, sels, 'md-2')
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })

    // As of md-3, md-1 and md-2 count (2 games) → burned
    const result2 = computeBrulage('player-1', clubTeams, matchDays, games, sels, 'md-3')
    expect(result2).toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('burns into the lowest team number when burned in multiple teams', () => {
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
    const result = computeBrulage('player-1', clubTeams, matchDays, games, sels)
    expect(result).toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('does not burn based on same-group rule (only rule 1 applies to brûlage)', () => {
    // team-2 and team-3 are in group-b — playing 1 game should NOT set brûlage
    const mdB1 = makeMatchDay('md-b1', 1, 'group-b')
    const mdB2 = makeMatchDay('md-b2', 2, 'group-b')
    const game = makeGame('g-1', 'md-b1', 'team-2', 'team-3')
    const sel = makeSel('g-1', 'team-2', ['player-1'])

    const result = computeBrulage('player-1', clubTeams, [mdB1, mdB2], [game], [sel], 'md-b2')
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('ignores games from other clubs', () => {
    const game = makeGame('g-1', 'md-1', 'team-other', 'team-x')
    const sel = makeSel('g-1', 'team-other', ['player-1'])
    const result = computeBrulage('player-1', clubTeams, matchDays, [game], [sel])
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
    const result = computeBrulage('player-1', clubTeams, matchDays, games, sels)
    expect(result).toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })
})

describe('isPlayerEligibleForTeam', () => {
  const team1 = makeTeam({ id: 'team-1', number: 1, clubId: 'club-1', groupId: 'group-a' })
  const team2 = makeTeam({ id: 'team-2', number: 2, clubId: 'club-1', groupId: 'group-b' })
  const team3 = makeTeam({ id: 'team-3', number: 3, clubId: 'club-1', groupId: 'group-c' })
  const clubTeams = [team1, team2, team3]

  const md1 = makeMatchDay('md-1', 1, 'group-a')
  const md2 = makeMatchDay('md-2', 2, 'group-a')
  const md3 = makeMatchDay('md-3', 3, 'group-a')
  const matchDays = [md1, md2, md3]

  it('eligible everywhere when no games played', () => {
    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
  })

  it('still eligible for lower teams after only 1 game in a higher team', () => {
    const game = makeGame('g-1', 'md-1', 'team-1', 'team-x')
    const sel = makeSel('g-1', 'team-1', ['p1'])

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
  })

  it('burned into team 1 after 2 games → eligible for team 1, not for team 2 or 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['p1']),
      makeSel('g-2', 'team-1', ['p1']),
    ]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })

  it('burned into team 2 after 2 games → eligible for team 1 and 2, not for team 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-y'),
      makeGame('g-2', 'md-2', 'team-2', 'team-y'),
    ]
    const sels = [
      makeSel('g-1', 'team-2', ['p1']),
      makeSel('g-2', 'team-2', ['p1']),
    ]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })

  describe('same-group rule (rule 2)', () => {
    // team-a2 and team-a3 share group-shared
    const teamA1 = makeTeam({ id: 'team-a1', number: 1, clubId: 'club-1', groupId: 'group-solo' })
    const teamA2 = makeTeam({ id: 'team-a2', number: 2, clubId: 'club-1', groupId: 'group-shared' })
    const teamA3 = makeTeam({ id: 'team-a3', number: 3, clubId: 'club-1', groupId: 'group-shared' })
    const sameGroupTeams = [teamA1, teamA2, teamA3]

    const sgMd1 = makeMatchDay('sg-md-1', 1, 'group-shared')
    const sgMd2 = makeMatchDay('sg-md-2', 2, 'group-shared')
    const sgMatchDays = [sgMd1, sgMd2]

    it('playing in one same-group team blocks selection for the other on next match-day', () => {
      const game = makeGame('g-1', 'sg-md-1', 'team-a2', 'team-a3')
      const sel = makeSel('g-1', 'team-a2', ['p1'])

      // As of sg-md-2: played in team-a2 → can't play team-a3 (same group)
      expect(isPlayerEligibleForTeam('p1', teamA2, sameGroupTeams, sgMatchDays, [game], [sel], 'sg-md-2')).toBe(true)
      expect(isPlayerEligibleForTeam('p1', teamA3, sameGroupTeams, sgMatchDays, [game], [sel], 'sg-md-2')).toBe(false)
      // team-a1 is in a different group, still eligible
      expect(isPlayerEligibleForTeam('p1', teamA1, sameGroupTeams, sgMatchDays, [game], [sel], 'sg-md-2')).toBe(true)
    })

    it('same-group rule does not apply on the same match-day (only prior)', () => {
      const game = makeGame('g-1', 'sg-md-1', 'team-a2', 'team-a3')
      const sel = makeSel('g-1', 'team-a2', ['p1'])

      // As of sg-md-1 itself, nothing prior counts
      expect(isPlayerEligibleForTeam('p1', teamA3, sameGroupTeams, sgMatchDays, [game], [sel], 'sg-md-1')).toBe(true)
    })
  })
})
