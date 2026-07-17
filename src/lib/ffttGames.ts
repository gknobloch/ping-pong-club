// FFTT games (calendar) import logic (#231), shared by the API and the web UI.
//
// Source: POST https://apiv2.fftt.com/api/graphql
//   { pools(group_id: <FFTT division id>) { edges { node { id sportMatches {...} } } } }
// Local ids line up with FFTT ids thanks to #219/#229: local division id =
// FFTT division id ("group" in their schema), local group id = FFTT pool id,
// and local team ids for imported teams = FFTT team ids (verified: dafunker
// idequipe 5834 = GraphQL /api/teams/5834).

import { ffttIdFromIri } from './ffttDivisions'

/** One side of a match as returned by the sportMatches GraphQL query. */
export interface FfttMatchOpponentNode {
  team?: {
    id: string
    name: string
    clubs?: { edges?: Array<{ node?: { id?: string; identifier?: string; name?: string } }> }
  } | null
}

/** A sportMatch node as returned by the GraphQL query. */
export interface FfttSportMatchNode {
  id: string
  roundNumber?: number | null
  date?: string | null
  homeOpponent?: FfttMatchOpponentNode | null
  awayOpponent?: FfttMatchOpponentNode | null
}

/** One side of a parsed match. */
export interface FfttMatchTeam {
  /** FFTT team id (numeric text) — equals the local team id for imported teams. */
  teamId: string
  /** Team label, e.g. "THIONVILLE TT 1". */
  teamName: string
  /** Team number parsed from the label; null when undetectable. */
  teamNumber: number | null
  /** Club affiliation number, e.g. "06570024"; empty when FFTT omits the club. */
  clubIdentifier: string
  clubName: string
}

/** A parsed, importable match. */
export interface FfttMatch {
  /** FFTT match id (numeric text), used as the local game id. */
  id: string
  /** Round number → local MatchDay.number. */
  round: number
  /** Match date as YYYY-MM-DD (FFTT dates carry no meaningful time). */
  date: string
  home: FfttMatchTeam
  away: FfttMatchTeam
}

/** "THIONVILLE TT 1" → 1, "LUNEVILLE ALTT (1)" → 1; null when no number found. */
export function teamNumberFromName(name: string): number | null {
  const m = name.match(/(\d+)\s*\)?\s*$/)
  return m ? Number(m[1]) : null
}

function parseOpponent(node: FfttMatchOpponentNode | null | undefined): FfttMatchTeam | null {
  const team = node?.team
  if (!team?.id || !team.name) return null
  const club = team.clubs?.edges?.[0]?.node
  return {
    teamId: ffttIdFromIri(team.id),
    teamName: team.name.trim(),
    teamNumber: teamNumberFromName(team.name),
    clubIdentifier: club?.identifier ?? '',
    clubName: club?.name ?? '',
  }
}

/**
 * Parse one sportMatch node, or null when it cannot be imported: byes/exempt
 * rounds have a missing opponent, and a match without a round or date cannot
 * be attached to a journée.
 */
export function parseSportMatch(node: FfttSportMatchNode): FfttMatch | null {
  const home = parseOpponent(node.homeOpponent)
  const away = parseOpponent(node.awayOpponent)
  if (!home || !away) return null
  if (typeof node.roundNumber !== 'number' || node.roundNumber < 1) return null
  const date = (node.date ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  return { id: ffttIdFromIri(node.id), round: node.roundNumber, date, home, away }
}

/** Parse a pool's sportMatches edges, dropping unusable entries, ordered by round then id. */
export function parseSportMatches(
  edges: Array<{ node?: FfttSportMatchNode }> | undefined,
): FfttMatch[] {
  const matches = (edges ?? []).flatMap((e) => {
    const m = e.node ? parseSportMatch(e.node) : null
    return m ? [m] : []
  })
  return matches.sort((a, b) => a.round - b.round || a.id.localeCompare(b.id, undefined, { numeric: true }))
}
