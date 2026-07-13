import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// The E2E dev server has no API; the FFTT proxy endpoints are mocked per test.
const ORGS = '**/api/fftt/organizations'
const PREVIEW = '**/api/fftt/divisions-preview*'
const IMPORT = '**/api/divisions/import'

const organizations = [
  { id: '14', type: 'League', identifier: 'L06', name: 'GRAND-EST' },
  { id: '72', type: 'Committee', identifier: 'D68', name: 'HAUT RHIN' },
]

// Matches the mock data: season '26' with phase 'phase-1' (Phase 1, active).
const preview = {
  contest: { id: '18368', name: 'FED_Championnat de France par Equipes Masculin' },
  phaseExists: true,
  divisions: [
    { id: '234142', identifier: 'GEEP1', name: 'GE Elite P1', rank: 1, playersPerGame: 4, exists: false },
    { id: '234322', identifier: 'GE1P1', name: 'GE 1 Phase 1', rank: 2, playersPerGame: 4, exists: true },
    { id: '234612', identifier: 'GE7P1', name: 'GE 7 Phase 1', rank: 3, playersPerGame: 3, exists: false },
  ],
}

const importResult = {
  phase: { id: 'phase-1', seasonId: '26', name: 'Phase 1', displayName: '2025/2026 Phase 1', isArchived: false, isActive: true },
  createdPhase: false,
  created: [
    { id: '234142', phaseId: 'phase-1', displayName: 'GE Elite P1', rank: 5, playersPerGame: 4, isArchived: false },
    { id: '234612', phaseId: 'phase-1', displayName: 'GE 7 Phase 1', rank: 6, playersPerGame: 3, isArchived: false },
  ],
  skipped: [{ id: '234322', name: 'GE 1 Phase 1' }],
}

test.describe('General admin — Divisions FFTT import', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('import is the primary action, manual add still available', async ({ page }) => {
    await page.goto('/divisions')
    await expect(page.getByRole('button', { name: 'Importer depuis la FFTT' })).toBeVisible()
    await page.getByRole('button', { name: 'Ajouter une division' }).click()
    await expect(page.getByRole('heading', { name: 'Ajouter une division' })).toBeVisible()
  })

  test('previews and imports divisions, skipping existing ones', async ({ page }) => {
    await page.route(ORGS, (route) => route.fulfill({ json: { organizations } }))
    await page.route(PREVIEW, (route) => route.fulfill({ json: preview }))
    await page.route(IMPORT, (route) => route.fulfill({ json: importResult }))

    await page.goto('/divisions')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await expect(page.getByRole('heading', { name: 'Importer les divisions FFTT' })).toBeVisible()

    await page.getByLabel('Organisation', { exact: true }).selectOption('14')
    // Season defaults to the active one (2025/2026), phase to Phase 1.
    await expect(page.getByLabel('Saison')).toHaveValue('26')
    await page.getByRole('button', { name: 'Rechercher les divisions' }).click()

    await expect(page.getByText('FED_Championnat de France par Equipes Masculin')).toBeVisible()
    await expect(page.getByText('1. GE Elite P1')).toBeVisible()
    await expect(page.getByText('Déjà présente')).toBeVisible()
    await expect(page.getByText('3 j/match')).toBeVisible()

    await page.getByRole('button', { name: 'Importer 2 divisions' }).click()
    await expect(page.getByText('2 divisions importées.')).toBeVisible()

    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('cell', { name: 'GE Elite P1' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'GE 7 Phase 1' })).toBeVisible()
  })

  test('reports when no championship exists for the selection', async ({ page }) => {
    await page.route(ORGS, (route) => route.fulfill({ json: { organizations } }))
    await page.route(PREVIEW, (route) => route.fulfill({ status: 404, json: { error: 'no_contest' } }))

    await page.goto('/divisions')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await page.getByLabel('Organisation', { exact: true }).selectOption('72')
    await page.getByRole('button', { name: 'Rechercher les divisions' }).click()
    await expect(page.getByText('Aucun championnat trouvé')).toBeVisible()
  })

  test('reports when the FFTT API is unreachable', async ({ page }) => {
    await page.route(ORGS, (route) => route.fulfill({ json: { organizations } }))
    await page.route(PREVIEW, (route) => route.fulfill({ status: 502, json: { error: 'fftt_unavailable' } }))

    await page.goto('/divisions')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await page.getByLabel('Organisation', { exact: true }).selectOption('14')
    await page.getByRole('button', { name: 'Rechercher les divisions' }).click()
    await expect(page.getByText(/Impossible de contacter l’API FFTT/)).toBeVisible()
  })

  test('warns when the phase will be created', async ({ page }) => {
    await page.route(ORGS, (route) => route.fulfill({ json: { organizations } }))
    await page.route(PREVIEW, (route) =>
      route.fulfill({ json: { ...preview, phaseExists: false } }),
    )

    await page.goto('/divisions')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    await page.getByLabel('Organisation', { exact: true }).selectOption('14')
    await page.getByLabel('Phase', { exact: true }).selectOption('2')
    await page.getByRole('button', { name: 'Rechercher les divisions' }).click()
    await expect(page.getByText(/La phase « Phase 2 » n’existe pas encore/)).toBeVisible()
  })
})
