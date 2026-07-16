import { describe, expect, it } from 'vitest'
import { parseClubTeam, parseClubTeams, phaseFromLabel, type FfttClubTeamEntry } from './ffttTeams'

const ENTRY: FfttClubTeamEntry = {
  idequipe: '3354',
  libequipe: 'RIXHEIM PPA  2 - Phase 1',
  libdivision: 'GE 2 Phase 1 Poule 9',
  liendivision: 'cx_poule=1406488&D1=234461&organisme_pere=14',
  libepr: 'FED_Championnat de France par Equipes Masculin',
}

describe('parseClubTeam', () => {
  it('parses a standard entry', () => {
    expect(parseClubTeam(ENTRY)).toEqual({
      id: '3354',
      number: 2,
      phase: 1,
      divisionId: '234461',
      poolId: '1406488',
      organizationId: '14',
      divisionName: 'GE 2 Phase 1',
      poolNumber: 9,
      label: 'RIXHEIM PPA  2 - Phase 1',
    })
  })

  it('reads the phase from a "P1" division label when the team label has none', () => {
    const t = parseClubTeam({
      ...ENTRY,
      libequipe: 'RIXHEIM PPA  1',
      libdivision: 'GE Elite P1 Poule 3',
    })
    expect(t?.number).toBe(1)
    expect(t?.phase).toBe(1)
    expect(t?.divisionName).toBe('GE Elite P1')
    expect(t?.poolNumber).toBe(3)
  })

  it('maps letter pools alphabetically', () => {
    const t = parseClubTeam({ ...ENTRY, libdivision: 'PR Phase 2 Poule B' })
    expect(t?.poolNumber).toBe(2)
  })

  it('keeps the full division label when no pool part is present', () => {
    const t = parseClubTeam({ ...ENTRY, libdivision: 'GE 2 Phase 1' })
    expect(t?.divisionName).toBe('GE 2 Phase 1')
    expect(t?.poolNumber).toBeNull()
  })

  it('returns null when the division link is missing or incomplete', () => {
    expect(parseClubTeam({ ...ENTRY, liendivision: '' })).toBeNull()
    expect(parseClubTeam({ ...ENTRY, liendivision: 'cx_poule=1&organisme_pere=14' })).toBeNull()
  })

  it('returns null when no team number can be read', () => {
    expect(parseClubTeam({ ...ENTRY, libequipe: 'RIXHEIM PPA' })).toBeNull()
  })
})

describe('parseClubTeams', () => {
  it('drops unparseable entries and keeps the rest', () => {
    const teams = parseClubTeams([ENTRY, { ...ENTRY, idequipe: 'x', liendivision: '' }])
    expect(teams.map((t) => t.id)).toEqual(['3354'])
  })
})

describe('phaseFromLabel', () => {
  it.each([
    ['RIXHEIM PPA  2 - Phase 1', 1],
    ['GE Elite P2 Poule 3', 2],
    ['GE 2', null],
  ])('%s → %s', (label, expected) => {
    expect(phaseFromLabel(label)).toBe(expected)
  })
})
