import { describe, it, expect } from 'vitest'
import { roundRobin, matchDayCountForGroupSize } from './roundRobin'

describe('matchDayCountForGroupSize', () => {
  it('returns 0 for n < 2', () => {
    expect(matchDayCountForGroupSize(0)).toBe(0)
    expect(matchDayCountForGroupSize(1)).toBe(0)
  })

  it('returns n-1 for even n (spec: 6→5, 8→7)', () => {
    expect(matchDayCountForGroupSize(2)).toBe(1)
    expect(matchDayCountForGroupSize(4)).toBe(3)
    expect(matchDayCountForGroupSize(6)).toBe(5)
    expect(matchDayCountForGroupSize(8)).toBe(7)
  })

  it('returns n for odd n (spec: 7→7)', () => {
    expect(matchDayCountForGroupSize(3)).toBe(3)
    expect(matchDayCountForGroupSize(5)).toBe(5)
    expect(matchDayCountForGroupSize(7)).toBe(7)
  })
})

describe('roundRobin', () => {
  it('returns empty array for fewer than 2 teams', () => {
    expect(roundRobin([])).toEqual([])
    expect(roundRobin([1])).toEqual([])
  })

  it('returns one round for 2 teams', () => {
    expect(roundRobin([1, 2])).toEqual([[{ home: 1, away: 2 }]])
  })

  it('returns 3 rounds for 4 teams (each plays each once)', () => {
    const result = roundRobin([1, 2, 3, 4])
    expect(result.length).toBe(3)
    const allPairs = result.flat()
    const pairKeys = allPairs.map(({ home, away }) =>
      [Math.min(home, away), Math.max(home, away)].join('-')
    )
    const unique = new Set(pairKeys)
    expect(unique.size).toBe(6) // 4 choose 2 = 6 unique pairings
  })

  it('for 6 teams returns 5 rounds (spec)', () => {
    const result = roundRobin([1, 2, 3, 4, 5, 6])
    expect(result.length).toBe(5)
    expect(result.every((round) => round.length === 3)).toBe(true) // 3 matches per round
  })

  it('for 8 teams returns 7 rounds (spec)', () => {
    const result = roundRobin([1, 2, 3, 4, 5, 6, 7, 8])
    expect(result.length).toBe(7)
    expect(result.every((round) => round.length === 4)).toBe(true) // 4 matches per round
  })

  it('for 7 teams (odd) returns 7 rounds with byes', () => {
    const result = roundRobin([1, 2, 3, 4, 5, 6, 7])
    expect(result.length).toBe(7)
    // Each round has 3 matches (7 teams → one bye per round)
    expect(result.every((round) => round.length === 3)).toBe(true)
  })
})
