import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// The E2E dev server has no API; the FFTT teams endpoints are mocked per test.
const PREVIEW = '**/api/fftt/teams-preview*'
const IMPORT = '**/api/teams/import'

// Matches the mock data: club-1 (PPA Rixheim) already has teams 1..8 in
// phase-1 (2025/2026 Phase 1, active); divisions div-1..div-7 exist locally.
const preview = {
  club: { id: 'club-1', displayName: 'PPA Rixheim' },
  season: { id: '26', displayName: '2025/2026', exists: true },
  teams: [
    {
      id: '9101', label: 'RIXHEIM PPA 1 - Phase 1', number: 1, phase: 1,
      divisionId: 'div-1', divisionName: 'GE1', divisionExists: true,
      poolNumber: 3, exists: true, importable: false,
    },
    {
      id: '9110', label: 'RIXHEIM PPA 10 - Phase 1', number: 10, phase: 1,
      divisionId: 'div-7', divisionName: 'GE7', divisionExists: true,
      poolNumber: 5, exists: false, importable: true,
    },
    {
      id: '9111', label: 'RIXHEIM PPA 11 - Phase 1', number: 11, phase: 1,
      divisionId: '234700', divisionName: 'GE 8 Phase 1', divisionExists: false,
      poolNumber: 2, exists: false, importable: true,
    },
  ],
}

const importResult = {
  createdPhases: [],
  createdDivisions: [
    { id: '234700', phaseId: 'phase-1', displayName: 'GE 8 Phase 1', rank: 8, playersPerGame: 3, isArchived: false },
  ],
  groups: [
    { id: '1500001', divisionId: 'div-7', number: 5, teamIds: ['9110'], isArchived: false },
    { id: '1500002', divisionId: '234700', number: 2, teamIds: ['9111'], isArchived: false },
  ],
  createdTeams: [
    {
      id: '9110', clubId: 'club-1', phaseId: 'phase-1', number: 10, divisionId: 'div-7', groupId: '1500001',
      gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: '', playerIds: [], isArchived: false,
    },
    {
      id: '9111', clubId: 'club-1', phaseId: 'phase-1', number: 11, divisionId: '234700', groupId: '1500002',
      gameLocationId: 'addr-1', defaultDay: 'Jeudi', defaultTime: '20h00', captainId: '', playerIds: [], isArchived: false,
    },
  ],
  skipped: [{ id: '9101', label: 'RIXHEIM PPA 1 - Phase 1', reason: 'already_exists' }],
}

test.describe('General admin — Teams FFTT import', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('import is the primary action, manual add still available', async ({ page }) => {
    await page.goto('/equipes')
    await expect(page.getByRole('button', { name: 'Importer depuis la FFTT' })).toBeVisible()
    await page.getByRole('button', { name: 'Ajouter une équipe' }).click()
    await expect(page.getByRole('heading', { name: 'Ajouter une équipe' })).toBeVisible()
  })

  test('previews and imports teams, skipping existing ones', async ({ page }) => {
    await page.route(PREVIEW, (route) => route.fulfill({ json: preview }))
    await page.route(IMPORT, (route) => route.fulfill({ json: importResult }))

    await page.goto('/equipes')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await expect(page.getByRole('heading', { name: 'Importer les équipes FFTT' })).toBeVisible()

    await page.getByLabel('Club', { exact: true }).selectOption('club-1')
    await page.getByRole('button', { name: 'Rechercher les équipes' }).click()

    await expect(page.getByText('RIXHEIM PPA 1 - Phase 1')).toBeVisible()
    await expect(page.getByText('Déjà présente')).toBeVisible()
    await expect(page.getByText('Division à importer')).toBeVisible()

    // Defaults: the venue preselects the club's default address; pick a day.
    await expect(page.getByLabel('Lieu de jeu')).toHaveValue('addr-1')
    await page.getByLabel('Jour', { exact: true }).selectOption('Jeudi')

    await page.getByRole('button', { name: 'Importer 2 équipes' }).click()
    await expect(page.getByText('2 équipes importées.')).toBeVisible()
    await expect(page.getByText('1 division importée automatiquement.')).toBeVisible()

    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByText('PPA Rixheim 10')).toBeVisible()
    await expect(page.getByText('PPA Rixheim 11')).toBeVisible()
  })

  test('reports when the FFTT API is unreachable', async ({ page }) => {
    await page.route(PREVIEW, (route) => route.fulfill({ status: 502, json: { error: 'fftt_unavailable' } }))

    await page.goto('/equipes')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await page.getByLabel('Club', { exact: true }).selectOption('club-1')
    await page.getByRole('button', { name: 'Rechercher les équipes' }).click()
    await expect(page.getByText(/Impossible de contacter l’API FFTT/)).toBeVisible()
  })

  test('blocks the import when the FFTT season is missing locally', async ({ page }) => {
    await page.route(PREVIEW, (route) =>
      route.fulfill({
        json: {
          ...preview,
          season: { id: '27', displayName: '2026/2027', exists: false },
          teams: preview.teams.map((t) => ({ ...t, exists: false, importable: false })),
        },
      }),
    )

    await page.goto('/equipes')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await page.getByLabel('Club', { exact: true }).selectOption('club-1')
    await page.getByRole('button', { name: 'Rechercher les équipes' }).click()

    await expect(page.getByText(/La saison 2026\/2027 n’existe pas encore/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rien à importer' })).toBeDisabled()
  })
})

test.describe('Club admin — Teams FFTT import', () => {
  test('the club is locked to the admin’s own club', async ({ page }) => {
    await loginAs(page, 'club.admin')
    await page.route(PREVIEW, (route) => route.fulfill({ json: preview }))

    await page.goto('/equipes')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()

    const clubSelect = page.getByLabel('Club', { exact: true })
    await expect(clubSelect).toBeDisabled()
    await expect(clubSelect).toHaveValue('club-1')

    await page.getByRole('button', { name: 'Rechercher les équipes' }).click()
    await expect(page.getByText('RIXHEIM PPA 10 - Phase 1')).toBeVisible()
  })
})
