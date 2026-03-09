import { describe, it, expect } from 'vitest'
import { computeBrulage, isPlayerEligibleForTeam } from './brulage'
import type { Team, Game, MatchDay, GameSelection } from '@/types'

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

const makeMatchDay = (id: string, number: number, groupId: string = 'group-a'): MatchDay => ({
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

const team1 = makeTeam({ id: 'team-1', number: 1, clubId: 'club-1', groupId: 'group-a' })
const team2 = makeTeam({ id: 'team-2', number: 2, clubId: 'club-1', groupId: 'group-a' })
const team3 = makeTeam({ id: 'team-3', number: 3, clubId: 'club-1', groupId: 'group-b' })
const clubTeams = [team1, team2, team3]

const md1 = makeMatchDay('md-1', 1)
const md2 = makeMatchDay('md-2', 2)
const md3 = makeMatchDay('md-3', 3)
const md4 = makeMatchDay('md-4', 4)
const matchDays = [md1, md2, md3, md4]

describe('computeBrulage', () => {
  it('returns no restriction when player has no games', () => {
    expect(computeBrulage('p1', clubTeams, matchDays, [], []))
      .toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('returns no restriction after 1 game in any single team', () => {
    const game = makeGame('g-1', 'md-1', 'team-1', 'team-x')
    const sel = makeSel('g-1', 'team-1', ['p1'])
    expect(computeBrulage('p1', clubTeams, matchDays, [game], [sel]))
      .toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('burns into team 1 after 2 games in team 1', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-1', ['p1']), makeSel('g-2', 'team-1', ['p1'])]
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('burns into team 2 after 1 game in team 1 + 1 game in team 2', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-2', ['p1']), makeSel('g-2', 'team-1', ['p1'])]
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: 2, burnedIntoTeamId: 'team-2' })
  })

  it('burns into team 2 after 2 games in team 2 (even without team 1 games)', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-x'),
      makeGame('g-2', 'md-2', 'team-2', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-2', ['p1']), makeSel('g-2', 'team-2', ['p1'])]
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: 2, burnedIntoTeamId: 'team-2' })
  })

  it('burns into highest team played when games span multiple teams', () => {
    // 1 game in team 1, 1 game in team 2, 1 game in team 3
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-2', 'team-x'),
      makeGame('g-3', 'md-3', 'team-3', 'team-x'),
    ]
    const sels = [
      makeSel('g-1', 'team-1', ['p1']),
      makeSel('g-2', 'team-2', ['p1']),
      makeSel('g-3', 'team-3', ['p1']),
    ]
    // Cumulative: team1=1 (≤1), team2=2 (>1 → burned). Highest played = team 3.
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: 3, burnedIntoTeamId: 'team-3' })
  })

  it('respects asOfMatchDayId cutoff', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-1', ['p1']), makeSel('g-2', 'team-1', ['p1'])]

    // As of md-2, only md-1 counts (1 game) → no burn
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels, 'md-2'))
      .toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })

    // As of md-3, both count (2 games) → burned
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels, 'md-3'))
      .toEqual({ burnedIntoTeamNumber: 1, burnedIntoTeamId: 'team-1' })
  })

  it('ignores selections for other players', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-1', ['other']), makeSel('g-2', 'team-1', ['other'])]
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })

  it('ignores games from other clubs', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-other', 'team-x'),
      makeGame('g-2', 'md-2', 'team-other', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-other', ['p1']), makeSel('g-2', 'team-other', ['p1'])]
    expect(computeBrulage('p1', clubTeams, matchDays, games, sels))
      .toEqual({ burnedIntoTeamNumber: null, burnedIntoTeamId: null })
  })
})

describe('isPlayerEligibleForTeam', () => {
  it('eligible everywhere when no games played', () => {
    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, [], [], 'md-1')).toBe(true)
  })

  it('eligible everywhere after 1 game in team 1 (max 1 allowed)', () => {
    const game = makeGame('g-1', 'md-1', 'team-1', 'team-x')
    const sel = makeSel('g-1', 'team-1', ['p1'])

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, [game], [sel], 'md-2')).toBe(true)
  })

  it('2 games in team 1 → only eligible for team 1', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-1', ['p1']), makeSel('g-2', 'team-1', ['p1'])]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })

  it('1 game in team 1 + 1 game in team 2 → eligible for team 1 and 2, not 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-2', ['p1']), makeSel('g-2', 'team-1', ['p1'])]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })

  it('2 games in team 2 → eligible for team 1 and 2, not 3', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-2', 'team-x'),
      makeGame('g-2', 'md-2', 'team-2', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-2', ['p1']), makeSel('g-2', 'team-2', ['p1'])]

    expect(isPlayerEligibleForTeam('p1', team1, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(true)
    expect(isPlayerEligibleForTeam('p1', team3, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })

  it('respects cutoff — not burned until games are in prior match-days', () => {
    const games = [
      makeGame('g-1', 'md-1', 'team-1', 'team-x'),
      makeGame('g-2', 'md-2', 'team-1', 'team-x'),
    ]
    const sels = [makeSel('g-1', 'team-1', ['p1']), makeSel('g-2', 'team-1', ['p1'])]

    // As of md-2: only 1 game counts → still eligible for team 2
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-2')).toBe(true)
    // As of md-3: 2 games count → not eligible for team 2
    expect(isPlayerEligibleForTeam('p1', team2, clubTeams, matchDays, games, sels, 'md-3')).toBe(false)
  })
})
