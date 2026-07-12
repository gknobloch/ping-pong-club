import { describe, expect, it } from 'vitest'
import { parseSeasonName, seasonIdFromFftt, seasonIdFromName, seasonNameFromFftt } from './season'

describe('parseSeasonName', () => {
  it('parses a valid season name', () => {
    expect(parseSeasonName('2025/2026')).toEqual({ startYear: 2025, endYear: 2026 })
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseSeasonName(' 2026/2027 ')).toEqual({ startYear: 2026, endYear: 2027 })
  })

  it('rejects non-consecutive years', () => {
    expect(parseSeasonName('2025/2027')).toBeNull()
    expect(parseSeasonName('2026/2026')).toBeNull()
    expect(parseSeasonName('2027/2026')).toBeNull()
  })

  it('rejects garbage input', () => {
    expect(parseSeasonName('sefsd')).toBeNull()
    expect(parseSeasonName('')).toBeNull()
    expect(parseSeasonName('25/26')).toBeNull()
    expect(parseSeasonName('2025-2026')).toBeNull()
    expect(parseSeasonName('2025 / 2026')).toBeNull()
  })
})

describe('seasonIdFromName', () => {
  it('derives the FFTT id (endYear − 2000)', () => {
    expect(seasonIdFromName('2025/2026')).toBe('26')
    expect(seasonIdFromName('2026/2027')).toBe('27')
  })

  it('returns null for invalid names', () => {
    expect(seasonIdFromName('sefsd')).toBeNull()
  })
})

describe('seasonNameFromFftt', () => {
  it('normalizes the FFTT name format', () => {
    expect(seasonNameFromFftt('Saison 2026 / 2027')).toBe('2026/2027')
    expect(seasonNameFromFftt('Saison 2025 / 2026')).toBe('2025/2026')
  })

  it('leaves an already-normalized name unchanged', () => {
    expect(seasonNameFromFftt('2026/2027')).toBe('2026/2027')
  })
})

describe('seasonIdFromFftt', () => {
  it('extracts the numeric id from the IRI', () => {
    expect(seasonIdFromFftt('/api/seasons/27')).toBe('27')
  })
})
