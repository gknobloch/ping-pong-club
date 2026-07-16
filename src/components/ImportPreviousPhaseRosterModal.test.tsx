import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Club, Phase, Player, Team } from '@/types'
import { ImportPreviousPhaseRosterModal } from './ImportPreviousPhaseRosterModal'

const club: Club = {
  id: 'club-1',
  affiliationNumber: '06680011',
  displayName: 'PPA Rixheim',
  isArchived: false,
  addresses: [],
  channels: [],
}

const previousPhase: Phase = {
  id: 'phase-25-3',
  seasonId: '25',
  name: 'Phase 3',
  displayName: '2024/2025 Phase 3',
  status: 'archived',
}

function player(id: string, firstName: string, lastName: string): Player {
  return {
    id, firstName, lastName, licenseNumber: `L-${id}`, email: `${id}@example.com`,
    phone: '', status: 'active', clubId: 'club-1',
  }
}

const players: Player[] = [
  player('p1', 'Alice', 'Martin'),
  player('p2', 'Bob', 'Durand'),
  player('p3', 'Chloé', 'Petit'),
  player('p4', 'David', 'Leroy'),
  player('p5', 'Eva', 'Simon'),
]

// A club that swapped its team 6 / team 8 rosters between phases (#229 follow-up):
// team-a was "team 6" last phase, team-b was "team 8". Captains double as
// roster members, so roster lookups below scope to the roster list — the
// name also appears in the "Capitaine :" summary line.
const teamA: Team = {
  id: 'team-a', clubId: 'club-1', phaseId: previousPhase.id, number: 6,
  divisionId: 'div-1', groupId: 'group-1', gameLocationId: 'addr-1',
  defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'p1',
  playerIds: ['p1', 'p2', 'p3'], isArchived: false,
  whatsappLink: 'https://chat.whatsapp.com/team6', color: '#2563eb',
}
const teamB: Team = {
  id: 'team-b', clubId: 'club-1', phaseId: previousPhase.id, number: 8,
  divisionId: 'div-2', groupId: 'group-2', gameLocationId: 'addr-1',
  defaultDay: 'Jeudi', defaultTime: '20h00', captainId: 'p4',
  playerIds: ['p4', 'p5'], isArchived: false,
}

function setup(overrides: Partial<Parameters<typeof ImportPreviousPhaseRosterModal>[0]> = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <ImportPreviousPhaseRosterModal
      onClose={onClose}
      club={club}
      previousPhase={previousPhase}
      sourceTeams={[teamA, teamB]}
      players={players}
      defaultTeamNumber={8}
      currentPlayerIds={[]}
      playerIdsInOtherTeams={new Set()}
      onConfirm={onConfirm}
      {...overrides}
    />,
  )
  return { onConfirm, onClose }
}

/** The roster `<ul>`, scoped away from the "Capitaine :" summary line which repeats a name. */
const rosterList = () => within(screen.getByRole('list'))

describe('ImportPreviousPhaseRosterModal', () => {
  it('defaults to the source team matching the current team number', () => {
    setup({ defaultTeamNumber: 8 })
    expect(screen.getByLabelText('Équipe source')).toHaveValue('team-b')
    expect(rosterList().getByText('David Leroy')).toBeInTheDocument()
  })

  it('falls back to the first team when no number matches (teams renumbered between phases)', () => {
    setup({ defaultTeamNumber: 42 })
    expect(screen.getByLabelText('Équipe source')).toHaveValue('team-a')
  })

  it('switching the source team refreshes roster, captain, and WhatsApp selections', async () => {
    setup({ defaultTeamNumber: 8 })
    await userEvent.selectOptions(screen.getByLabelText('Équipe source'), 'team-a')

    expect(rosterList().getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText(/Capitaine/)).toBeInTheDocument()
    expect(screen.getByText('Groupe WhatsApp')).toBeInTheDocument()
  })

  it('disables and excludes a player already on the team being edited', () => {
    setup({ defaultTeamNumber: 8, currentPlayerIds: ['p5'] })
    const row = rosterList().getByText('Eva Simon').closest('li')!
    expect(row).toHaveTextContent('Déjà dans l’équipe')
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox).toBeDisabled()
    expect(checkbox).not.toBeChecked()
  })

  it('disables and excludes a player already on another team this phase', () => {
    setup({ defaultTeamNumber: 6, playerIdsInOtherTeams: new Set(['p2']) })
    const row = rosterList().getByText('Bob Durand').closest('li')!
    expect(row).toHaveTextContent('Déjà dans une autre équipe')
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox).toBeDisabled()
    expect(checkbox).not.toBeChecked()
  })

  it('confirms with the selected players, captain, WhatsApp link, and color by default', async () => {
    const { onConfirm } = setup({ defaultTeamNumber: 6 })
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(onConfirm).toHaveBeenCalledWith({
      captainId: 'p1',
      addPlayerIds: expect.arrayContaining(['p1', 'p2', 'p3']),
      whatsappLink: 'https://chat.whatsapp.com/team6',
      color: '#2563eb',
    })
    expect(onConfirm.mock.calls[0][0].addPlayerIds).toHaveLength(3)
  })

  it('omits the color when unchecked, and offers no color checkbox for a team without one', async () => {
    const { onConfirm } = setup({ defaultTeamNumber: 6 })
    await userEvent.click(screen.getByText('Couleur').closest('label')!.querySelector('input')!)
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(onConfirm.mock.calls[0][0].color).toBeUndefined()

    // team-b has no color set — no checkbox offered at all.
    await userEvent.selectOptions(screen.getByLabelText('Équipe source'), 'team-b')
    expect(screen.queryByText('Couleur')).not.toBeInTheDocument()
  })

  it('drops the captain from the patch once their player checkbox is unchecked', async () => {
    const { onConfirm } = setup({ defaultTeamNumber: 6 })
    // Uncheck Alice (the captain) — the captain checkbox should become
    // ineligible and stop being offered.
    const aliceRow = rosterList().getByText('Alice Martin').closest('li')!
    await userEvent.click(aliceRow.querySelector('input[type="checkbox"]')!)
    expect(screen.getByText(/Capitaine/).closest('label')!.querySelector('input')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ captainId: undefined, addPlayerIds: ['p2', 'p3'] }),
    )
  })

  it('omits the WhatsApp link when unchecked', async () => {
    const { onConfirm } = setup({ defaultTeamNumber: 6 })
    await userEvent.click(screen.getByText('Groupe WhatsApp').closest('label')!.querySelector('input')!)
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(onConfirm.mock.calls[0][0].whatsappLink).toBeUndefined()
  })

  it('keeps the captain importable when they are already on the team being edited', async () => {
    const { onConfirm } = setup({ defaultTeamNumber: 6, currentPlayerIds: ['p1'] })
    // p1 is already on the team, so their row is disabled/unselected, but the
    // captain checkbox should stay eligible since p1 will still be on the roster.
    expect(screen.getByText(/Capitaine/).closest('label')!.querySelector('input')).not.toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(onConfirm.mock.calls[0][0].captainId).toBe('p1')
  })

  it('calls onClose from Annuler', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
