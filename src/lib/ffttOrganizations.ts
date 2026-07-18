// Dropdown group labels/order for the FFTT organization types, shared by the
// Divisions and Groups FFTT import UIs.

import type { Organization } from '@/types'

export const ORG_TYPE_GROUPS: ReadonlyArray<{ type: string; label: string }> = [
  { type: 'League', label: 'Ligues' },
  { type: 'Committee', label: 'Comités' },
  { type: 'Zone', label: 'Zones' },
  { type: 'Federation', label: 'Fédération' },
]

/** Buckets organizations by type, in ORG_TYPE_GROUPS order, dropping empty buckets. */
export function groupOrganizationsByType(orgs: Organization[] | null) {
  const byType = new Map<string, Organization[]>()
  for (const o of orgs ?? []) byType.set(o.type, [...(byType.get(o.type) ?? []), o])
  return ORG_TYPE_GROUPS.filter((g) => byType.has(g.type)).map((g) => ({
    ...g,
    organizations: byType.get(g.type)!,
  }))
}
