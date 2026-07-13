import { describe, expect, it } from 'vitest'
import {
  ffttIdFromIri,
  orderDivisions,
  playersPerGameFor,
  type FfttDivision,
} from './ffttDivisions'

const d = (id: string, identifier: string, parentId: string | null): FfttDivision => ({
  id,
  identifier,
  name: identifier,
  parentId,
})

describe('ffttIdFromIri', () => {
  it('extracts the numeric id', () => {
    expect(ffttIdFromIri('/api/divisions/234020')).toBe('234020')
    expect(ffttIdFromIri('/api/contests/18368')).toBe('18368')
  })
})

describe('playersPerGameFor', () => {
  it('returns the default for regular divisions', () => {
    expect(playersPerGameFor('GEEP1')).toBe(4)
    expect(playersPerGameFor('GE3P1')).toBe(4)
  })

  it('applies the GE7 override for both phases', () => {
    expect(playersPerGameFor('GE7P1')).toBe(3)
    expect(playersPerGameFor('GE7P2')).toBe(3)
  })
})

describe('orderDivisions', () => {
  it('orders the real GRAND-EST phase 1 shape: chain first, orphan root last', () => {
    // Actual data returned by FFTT for contest 18368 / phase 1 (season 27).
    const divisions = [
      d('234020', 'GE3P1', '234461'),
      d('234142', 'GEEP1', null),
      d('234149', 'GE6P1', '234600'),
      d('234322', 'GE1P1', '234142'),
      d('234461', 'GE2P1', '234322'),
      d('234527', 'GE4P1', '234020'),
      d('234600', 'GE5P1', '234527'),
      d('234612', 'GE7P1', null),
    ]
    expect(orderDivisions(divisions).map((x) => x.identifier)).toEqual([
      'GEEP1', 'GE1P1', 'GE2P1', 'GE3P1', 'GE4P1', 'GE5P1', 'GE6P1', 'GE7P1',
    ])
  })

  it('appends nodes whose parent is missing from the list', () => {
    const divisions = [
      d('2', 'B', '1'),
      d('1', 'A', null),
      d('9', 'Z', 'not-in-list'),
    ]
    expect(orderDivisions(divisions).map((x) => x.identifier)).toEqual(['A', 'B', 'Z'])
  })

  it('sorts sibling roots and children deterministically by identifier', () => {
    const divisions = [
      d('3', 'R2', null),
      d('1', 'R1', null),
      d('2', 'R1-child', '1'),
      d('4', 'R2-child', '3'),
    ]
    expect(orderDivisions(divisions).map((x) => x.identifier)).toEqual([
      'R1', 'R1-child', 'R2', 'R2-child',
    ])
  })

  it('survives a parent cycle without dropping nodes', () => {
    const divisions = [
      d('1', 'A', '2'),
      d('2', 'B', '1'),
    ]
    const ordered = orderDivisions(divisions)
    expect(ordered).toHaveLength(2)
    expect(new Set(ordered.map((x) => x.id))).toEqual(new Set(['1', '2']))
  })

  it('returns an empty list unchanged', () => {
    expect(orderDivisions([])).toEqual([])
  })
})
