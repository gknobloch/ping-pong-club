// FFTT phases, cached as configuration (#227) — the list basically never
// changes, so no runtime call. Source of truth:
//   POST https://apiv2.fftt.com/api/graphql
//   { phases { edges { node { id name } } } }
// As of 2026-07-13 it returns /api/phases/1..3. Ids follow the same
// FFTT-alignment idea as seasons: the numeric part of the IRI, as text.
export const FFTT_PHASES: ReadonlyArray<{ id: string; name: string }> = [
  { id: '1', name: 'Phase 1' },
  { id: '2', name: 'Phase 2' },
  { id: '3', name: 'Phase 3' },
]

/**
 * Deterministic local phase id: "phase-{seasonId}-{ffttPhaseId}"
 * (e.g. "phase-27-1" = 2026/2027 Phase 1). Also produced by the divisions
 * import when it creates a missing phase.
 */
export function localPhaseId(seasonId: string | number, ffttPhaseId: string | number): string {
  return `phase-${seasonId}-${ffttPhaseId}`
}

/** FFTT phase id for a phase name ("Phase 2" → "2"), or null when unknown. */
export function ffttPhaseIdForName(name: string): string | null {
  return FFTT_PHASES.find((p) => p.name === name)?.id ?? null
}
