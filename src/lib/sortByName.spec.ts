import { describe, it, expect } from 'vitest'
import { sortByName } from './sortByName'

type Named = { firstName: string; lastName: string }

const person = (firstName: string, lastName: string): Named => ({ firstName, lastName })

describe('sortByName', () => {
  it('sorts by lastName ascending', () => {
    const input = [person('A', 'Zidane'), person('B', 'Adam'), person('C', 'Martin')]
    expect(sortByName(input).map((p) => p.lastName)).toEqual(['Adam', 'Martin', 'Zidane'])
  })

  it('breaks ties by firstName when lastName matches', () => {
    const input = [person('Zoe', 'Martin'), person('Anna', 'Martin')]
    expect(sortByName(input).map((p) => p.firstName)).toEqual(['Anna', 'Zoe'])
  })

  it('is case-insensitive', () => {
    const input = [person('A', 'martin'), person('B', 'Adam')]
    expect(sortByName(input).map((p) => p.lastName)).toEqual(['Adam', 'martin'])
  })

  it('sorts accented names using French collation base order', () => {
    const input = [person('A', 'Écuyer'), person('B', 'Dupont')]
    expect(sortByName(input).map((p) => p.lastName)).toEqual(['Dupont', 'Écuyer'])
  })

  it('does not mutate the input array', () => {
    const input = [person('A', 'Zidane'), person('B', 'Adam')]
    const original = [...input]
    sortByName(input)
    expect(input).toEqual(original)
  })

  it('returns an empty array for an empty input', () => {
    expect(sortByName([])).toEqual([])
  })

  it('handles a single element', () => {
    const input = [person('A', 'Solo')]
    expect(sortByName(input)).toEqual(input)
  })
})
