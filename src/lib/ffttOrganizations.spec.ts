import { describe, expect, it } from 'vitest'
import { groupOrganizationsByType } from './ffttOrganizations'
import type { Organization } from '@/types'

const orgs: Organization[] = [
  { id: '72', type: 'Committee', identifier: 'D68', name: 'HAUT RHIN' },
  { id: '14', type: 'League', identifier: 'L06', name: 'GRAND-EST' },
  { id: '1', type: 'Federation', identifier: 'FED', name: 'FEDERATION' },
  { id: '73', type: 'Committee', identifier: 'D57', name: 'MOSELLE' },
]

describe('groupOrganizationsByType', () => {
  it('buckets organizations by type in League/Committee/Zone/Federation order', () => {
    expect(groupOrganizationsByType(orgs)).toEqual([
      { type: 'League', label: 'Ligues', organizations: [orgs[1]] },
      { type: 'Committee', label: 'Comités', organizations: [orgs[0], orgs[3]] },
      { type: 'Federation', label: 'Fédération', organizations: [orgs[2]] },
    ])
  })

  it('drops empty type buckets (no Zone here)', () => {
    const types = groupOrganizationsByType(orgs).map((g) => g.type)
    expect(types).not.toContain('Zone')
  })

  it('returns an empty list for null or empty input', () => {
    expect(groupOrganizationsByType(null)).toEqual([])
    expect(groupOrganizationsByType([])).toEqual([])
  })
})
