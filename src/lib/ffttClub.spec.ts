import { describe, expect, it } from 'vitest'
import { parseClubDetailXml } from './ffttClub'

const RIXHEIM_XML =
  '<?xml version="1.0" encoding="ISO-8859-1"?>\n' +
  '<liste><club><idclub>2680011</idclub><numero>06680011</numero><nom>RIXHEIM PPA</nom>' +
  '<nomsalle>Complexe Sportif</nomsalle><adressesalle1>5, rue Vaclav Havel</adressesalle1>' +
  '<adressesalle2/><adressesalle3></adressesalle3><codepsalle>68170</codepsalle>' +
  '<villesalle>RIXHEIM</villesalle><web/><nomcor>COLLE</nomcor><prenomcor>Quentin</prenomcor>' +
  '<mailcor>pparixheim@gmail.com</mailcor><telcor>0672124915</telcor>' +
  '<latitude>47.761898</latitude><longitude>7.394756</longitude>' +
  '<validation>06/07/2026</validation></club></liste>'

describe('parseClubDetailXml', () => {
  it('parses a real xml_club_detail.php response', () => {
    expect(parseClubDetailXml(RIXHEIM_XML)).toEqual({
      affiliationNumber: '06680011',
      displayName: 'RIXHEIM PPA',
      venueLabel: 'Complexe Sportif',
      street: '5, rue Vaclav Havel',
      postalCode: '68170',
      city: 'RIXHEIM',
    })
  })

  it('joins non-empty address lines 1-3', () => {
    const xml = RIXHEIM_XML.replace('<adressesalle2/>', '<adressesalle2>Bâtiment B</adressesalle2>')
    expect(parseClubDetailXml(xml)?.street).toBe('5, rue Vaclav Havel, Bâtiment B')
  })

  it('falls back to "Salle" when nomsalle is empty', () => {
    const xml = RIXHEIM_XML.replace('<nomsalle>Complexe Sportif</nomsalle>', '<nomsalle/>')
    expect(parseClubDetailXml(xml)?.venueLabel).toBe('Salle')
  })

  it('returns null when the club number is unknown (empty liste)', () => {
    expect(parseClubDetailXml('<?xml version="1.0"?><liste></liste>')).toBeNull()
  })

  it('returns null on malformed XML', () => {
    expect(parseClubDetailXml('not xml at all <<<')).toBeNull()
  })

  it('returns null when numero or nom is missing', () => {
    const xml = '<liste><club><nomsalle>Salle</nomsalle></club></liste>'
    expect(parseClubDetailXml(xml)).toBeNull()
  })
})
