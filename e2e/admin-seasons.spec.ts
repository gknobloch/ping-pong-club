import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// The dev server has no API, so the FFTT endpoints are mocked per test.
const FFTT_CHECK = '**/api/seasons/fftt-current'
const FFTT_IMPORT = '**/api/seasons/import-current'

test.describe('General admin — Saisons', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('lists seasons with their status', async ({ page }) => {
    await page.goto('/saisons')
    await expect(page.getByRole('heading', { name: 'Saisons' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '2025/2026' })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
  })

  test('rejects an invalid season name on creation', async ({ page }) => {
    await page.goto('/saisons')
    await page.getByRole('button', { name: 'Ajouter une saison' }).click()
    await page.getByLabel(/Nom/).fill('sefsd')
    await expect(page.getByText(/années consécutives/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  test('rejects a duplicate season', async ({ page }) => {
    await page.goto('/saisons')
    await page.getByRole('button', { name: 'Ajouter une saison' }).click()
    await page.getByLabel(/Nom/).fill('2025/2026')
    await expect(page.getByText('Cette saison existe déjà.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  test('creates a valid upcoming season', async ({ page }) => {
    await page.goto('/saisons')
    await page.getByRole('button', { name: 'Ajouter une saison' }).click()
    await page.getByLabel(/Nom/).fill('2027/2028')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('cell', { name: '2027/2028' })).toBeVisible()
    await expect(page.getByText('À venir')).toBeVisible()
  })

  test('shows the FFTT banner and imports the current season', async ({ page }) => {
    await page.route(FFTT_CHECK, (route) =>
      route.fulfill({
        json: { id: '27', displayName: '2026/2027', exists: false },
      }),
    )
    await page.route(FFTT_IMPORT, (route) =>
      route.fulfill({
        json: {
          season: { id: '27', displayName: '2026/2027', status: 'active' },
          archivedSeasonIds: ['26'],
        },
      }),
    )
    await page.goto('/saisons')
    await expect(page.getByText(/Nouvelle saison FFTT disponible/)).toBeVisible()
    await expect(page.getByText('2026/2027').first()).toBeVisible()
    await page.getByRole('button', { name: 'Importer' }).click()

    // Banner gone, new season active, previous one archived.
    await expect(page.getByText(/Nouvelle saison FFTT disponible/)).not.toBeVisible()
    await expect(page.getByRole('cell', { name: '2026/2027' })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '2025/2026' })).not.toBeVisible()
    await page.getByLabel(/Afficher les saisons archivées/).check()
    await expect(page.getByRole('cell', { name: '2025/2026' })).toBeVisible()
  })

  test('hides the FFTT banner when the season already exists', async ({ page }) => {
    await page.route(FFTT_CHECK, (route) =>
      route.fulfill({
        json: { id: '26', displayName: '2025/2026', exists: true },
      }),
    )
    await page.goto('/saisons')
    await expect(page.getByRole('cell', { name: '2025/2026' })).toBeVisible()
    await expect(page.getByText(/Nouvelle saison FFTT disponible/)).not.toBeVisible()
  })
})
