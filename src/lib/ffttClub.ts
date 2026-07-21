// FFTT club detail import (#247), browser-side like the other FFTT imports
// (#229/#231): FFTT/dafunker block Cloudflare's egress IPs, so this is fetched
// from the browser and handed to the app's own club-creation flow (`addClub`)
// — a single club has no cross-entity linking to validate server-side, unlike
// divisions/teams/games, so there's no dedicated preview/import API endpoint.
//
// Source: GET https://fftt.dafunker.com/v1/proxy/xml_club_detail.php?club=<affiliationNumber>
//   <liste><club><numero/><nom/><nomsalle/><adressesalle1/><adressesalle2/>
//   <adressesalle3/><codepsalle/><villesalle/>...</club></liste>
// An unknown club number returns a <liste> with no <club> child.

const FFTT_CLUB_DETAIL_URL = 'https://fftt.dafunker.com/v1/proxy/xml_club_detail.php'
const TIMEOUT_MS = 15000

/** A parsed club detail: identity plus its single game venue. */
export interface FfttClubDetail {
  affiliationNumber: string
  displayName: string
  venueLabel: string
  street: string
  postalCode: string
  city: string
}

function text(node: ParentNode, tag: string): string {
  return node.querySelector(tag)?.textContent?.trim() ?? ''
}

/**
 * Parse an xml_club_detail.php response. Returns null when the XML is
 * malformed or carries no `<club>` (unknown affiliation number).
 */
export function parseClubDetailXml(xml: string): FfttClubDetail | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return null
  const club = doc.querySelector('club')
  if (!club) return null

  const affiliationNumber = text(club, 'numero')
  const displayName = text(club, 'nom')
  if (!affiliationNumber || !displayName) return null

  const street = [text(club, 'adressesalle1'), text(club, 'adressesalle2'), text(club, 'adressesalle3')]
    .filter(Boolean)
    .join(', ')

  return {
    affiliationNumber,
    displayName,
    venueLabel: text(club, 'nomsalle') || 'Salle',
    street,
    postalCode: text(club, 'codepsalle'),
    city: text(club, 'villesalle'),
  }
}

/** Fetch a club's detail XML from the browser; null when unreachable. */
export async function fetchClubDetailXmlFromBrowser(affiliationNumber: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const safe = affiliationNumber.replace(/[^0-9A-Za-z]/g, '')
    const res = await fetch(`${FFTT_CLUB_DETAIL_URL}?club=${safe}`, { signal: controller.signal })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
