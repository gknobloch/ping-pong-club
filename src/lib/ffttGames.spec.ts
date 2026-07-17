import { describe, expect, it } from 'vitest'
import { parseSportMatch, parseSportMatches, teamNumberFromName, type FfttSportMatchNode } from './ffttGames'

const NODE: FfttSportMatchNode = {
  id: '/api/sport_matches/5646635',
  roundNumber: 1,
  date: '2026-02-07T00:00:00',
  homeOpponent: {
    team: {
      id: '/api/teams/5838',
      name: 'STRASBOURG EMTT 1',
      clubs: { edges: [{ node: { id: '/api/clubs/1', identifier: '06670270', name: 'STRASBOURG EMTT' } }] },
    },
  },
  awayOpponent: {
    team: {
      id: '/api/teams/5424',
      name: 'SPICHEREN C.S.N 1',
      clubs: { edges: [{ node: { id: '/api/clubs/2', identifier: '06570030', name: 'SPICHEREN C.S.N' } }] },
    },
  },
}

describe('parseSportMatch', () => {
  it('parses a standard match node', () => {
    expect(parseSportMatch(NODE)).toEqual({
      id: '5646635',
      round: 1,
      date: '2026-02-07',
      home: {
        teamId: '5838', teamName: 'STRASBOURG EMTT 1', teamNumber: 1,
        clubIdentifier: '06670270', clubName: 'STRASBOURG EMTT',
      },
      away: {
        teamId: '5424', teamName: 'SPICHEREN C.S.N 1', teamNumber: 1,
        clubIdentifier: '06570030', clubName: 'SPICHEREN C.S.N',
      },
    })
  })

  it('returns null for a bye (missing opponent)', () => {
    expect(parseSportMatch({ ...NODE, awayOpponent: null })).toBeNull()
    expect(parseSportMatch({ ...NODE, awayOpponent: { team: null } })).toBeNull()
  })

  it('returns null without a usable round or date', () => {
    expect(parseSportMatch({ ...NODE, roundNumber: null })).toBeNull()
    expect(parseSportMatch({ ...NODE, roundNumber: 0 })).toBeNull()
    expect(parseSportMatch({ ...NODE, date: null })).toBeNull()
    expect(parseSportMatch({ ...NODE, date: 'invalid' })).toBeNull()
  })

  it('tolerates a missing club on the team', () => {
    const m = parseSportMatch({
      ...NODE,
      homeOpponent: { team: { id: '/api/teams/9', name: 'MYSTERY 3' } },
    })
    expect(m?.home).toEqual({
      teamId: '9', teamName: 'MYSTERY 3', teamNumber: 3, clubIdentifier: '', clubName: '',
    })
  })
})

describe('parseSportMatches', () => {
  it('drops unusable entries and orders by round then id', () => {
    const out = parseSportMatches([
      { node: { ...NODE, id: '/api/sport_matches/20', roundNumber: 2 } },
      { node: { ...NODE, id: '/api/sport_matches/10', roundNumber: 1 } },
      { node: { ...NODE, id: '/api/sport_matches/9', roundNumber: 1 } },
      { node: { ...NODE, id: '/api/sport_matches/30', awayOpponent: null } },
      {},
    ])
    expect(out.map((m) => [m.round, m.id])).toEqual([[1, '9'], [1, '10'], [2, '20']])
  })
})

describe('teamNumberFromName', () => {
  it.each([
    ['THIONVILLE TT 1', 1],
    ['LUNEVILLE ALTT (1)', 1],
    ['BAZEILLES PPC 12', 12],
    ['SANS NUMERO', null],
  ])('%s → %s', (name, expected) => {
    expect(teamNumberFromName(name)).toBe(expected)
  })
})
