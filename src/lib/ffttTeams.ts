// FFTT club-teams import logic (#229), shared by the API and the web UI.
//
// Source: GET https://fftt.dafunker.com/v1/club/{affiliationNumber}/equipes
// Returns the club's engaged teams for the current FFTT season, all phases
// mixed. Each entry carries the FFTT division id (D1) in `liendivision`,
// which maps directly to a local division (#219 uses FFTT ids as local
// division ids) and therefore to a local phase.

/** Raw entry as returned by the dafunker club-teams endpoint. */
export interface FfttClubTeamEntry {
  /** FFTT team (engagement) id, e.g. "5458". */
  idequipe: string
  /** Team label, e.g. "RIXHEIM PPA  1 - Phase 1". */
  libequipe: string
  /** Division + pool label, e.g. "GE 2 Phase 1 Poule 9". */
  libdivision: string
  /** Query string carrying cx_poule, D1 and organisme_pere. */
  liendivision: string
  /** Competition label, e.g. "FED_Championnat de France par Equipes Masculin". */
  libepr?: string
}

/** A parsed, importable club team. */
export interface FfttClubTeam {
  /** FFTT team (engagement) id, used as the local team id. */
  id: string
  /** Team number within the club (…PPA "2" - Phase 1 → 2). */
  number: number
  /** FFTT phase id (1..3), from the labels; null when undetectable. */
  phase: number | null
  /** FFTT division id (liendivision D1) = local division id. */
  divisionId: string
  /** FFTT pool id (liendivision cx_poule), used as the local group id. */
  poolId: string
  /** FFTT organization id (liendivision organisme_pere), for divisions auto-import. */
  organizationId: string
  /** Division display label without the pool part, e.g. "GE 2 Phase 1". */
  divisionName: string
  /** Pool number ("Poule 9" → 9, "Poule A" → 1); null when undetectable. */
  poolNumber: number | null
  /** Original team label, for display. */
  label: string
}

/** "Poule 9" → 9; single letters map alphabetically ("Poule A" → 1). */
function parsePoolNumber(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token)
  if (/^[A-Za-z]$/.test(token)) return token.toUpperCase().charCodeAt(0) - 64
  return null
}

/** Phase number from a label: "… Phase 2 …" or a "P2" token; null otherwise. */
export function phaseFromLabel(label: string): number | null {
  const m = label.match(/\bPhase\s*(\d)\b/i) ?? label.match(/\bP(\d)\b/)
  return m ? Number(m[1]) : null
}

/**
 * Parse one dafunker entry into an importable team, or null when the entry
 * lacks the division link (team not yet assigned to a pool) or a readable
 * team number.
 */
export function parseClubTeam(entry: FfttClubTeamEntry): FfttClubTeam | null {
  const link = new URLSearchParams(entry.liendivision ?? '')
  const divisionId = link.get('D1')
  const poolId = link.get('cx_poule')
  const organizationId = link.get('organisme_pere')
  if (!divisionId || !poolId || !organizationId) return null

  // "RIXHEIM PPA  2 - Phase 1" → number 2 (phase suffix optional).
  const teamMatch = (entry.libequipe ?? '').match(/\b(\d+)\s*(?:-\s*Phase\s*\d\s*)?$/i)
  if (!teamMatch) return null

  // "GE 2 Phase 1 Poule 9" → division "GE 2 Phase 1", pool 9.
  const poolMatch = (entry.libdivision ?? '').match(/^(.*?)\s+Poule\s+(\S+)\s*$/i)

  return {
    id: entry.idequipe,
    number: Number(teamMatch[1]),
    phase: phaseFromLabel(entry.libequipe) ?? phaseFromLabel(entry.libdivision),
    divisionId,
    poolId,
    organizationId,
    divisionName: poolMatch ? poolMatch[1] : entry.libdivision,
    poolNumber: poolMatch ? parsePoolNumber(poolMatch[2]) : null,
    label: entry.libequipe,
  }
}

/** Parse a dafunker response, dropping entries that cannot be imported. */
export function parseClubTeams(entries: FfttClubTeamEntry[]): FfttClubTeam[] {
  return entries.flatMap((e) => {
    const t = parseClubTeam(e)
    return t ? [t] : []
  })
}
