import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('General admin — Phases (#221, #227)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/phases')
  })

  test('phase name is an FFTT dropdown and duplicates are rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une phase' }).click()
    // Phase 1 already exists for the only season (mock data).
    await page.getByLabel('Phase', { exact: true }).selectOption('Phase 1')
    await expect(page.getByText('Cette phase existe déjà pour cette saison.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    // No copy-from option anymore (superseded by the divisions import).
    await expect(page.getByText('Copier les divisions depuis')).not.toBeVisible()
  })

  test('activating a new phase shows the resulting combination and deactivates the previous one', async ({ page }) => {
    // Mock data starts with one active phase: 2025/2026 Phase 1.
    await expect(page.getByText('Active', { exact: true })).toHaveCount(1)

    await page.getByRole('button', { name: 'Ajouter une phase' }).click()
    await page.getByLabel('Phase', { exact: true }).selectOption('Phase 2')
    await page.getByLabel('Active').check()
    await expect(page.getByText(/la combinaison active sera/)).toBeVisible()
    await expect(page.getByText('2025/2026 · Phase 2')).toBeVisible()
    await expect(page.getByText(/La phase 2025\/2026 Phase 1 sera désactivée/)).toBeVisible()
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // The new phase is active; the previous one has been demoted, not archived.
    await expect(page.getByRole('cell', { name: '2025/2026 Phase 2' })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toHaveCount(1)
    const phase1Row = page.getByRole('row', { name: /2025\/2026 Phase 1/ })
    await expect(phase1Row.getByText('—')).toBeVisible()
  })

  test('activating an existing phase demotes the other one', async ({ page }) => {
    // Create a second, inactive phase first.
    await page.getByRole('button', { name: 'Ajouter une phase' }).click()
    await page.getByLabel('Phase', { exact: true }).selectOption('Phase 2')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('cell', { name: '2025/2026 Phase 2' })).toBeVisible()

    // Activate it via Modifier.
    await page.getByRole('row', { name: /2025\/2026 Phase 2/ }).getByRole('button', { name: 'Modifier' }).click()
    await page.getByLabel('Active').check()
    await expect(page.getByText(/la combinaison active sera/)).toBeVisible()
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByText('Active', { exact: true })).toHaveCount(1)
    await expect(
      page.getByRole('row', { name: /2025\/2026 Phase 2/ }).getByText('Active', { exact: true }),
    ).toBeVisible()
  })

  test('activating a phase of another season also activates that season (#227)', async ({ page }) => {
    // Create next season (upcoming) on /saisons first. Client-side navigation
    // only: a full page load would reset the in-memory mock data.
    await page.getByRole('link', { name: 'Saisons' }).click()
    await page.getByRole('button', { name: 'Ajouter une saison' }).click()
    await page.getByLabel(/Nom/).fill('2026/2027')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('cell', { name: '2026/2027' })).toBeVisible()

    // Create its Phase 1 as active: the note announces the season swap.
    await page.getByRole('link', { name: 'Phases' }).click()
    await page.getByRole('button', { name: 'Ajouter une phase' }).click()
    await page.getByLabel('Saison').selectOption({ label: '2026/2027' })
    await page.getByLabel('Active').check()
    await expect(page.getByText('2026/2027 · Phase 1')).toBeVisible()
    await expect(page.getByText(/La saison 2025\/2026 sera archivée/)).toBeVisible()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(
      page.getByRole('row', { name: /2026\/2027 Phase 1/ }).getByText('Active', { exact: true }),
    ).toBeVisible()

    // The phase's season became the active one; the previous season is archived.
    await page.getByRole('link', { name: 'Saisons' }).click()
    await expect(page.getByRole('row', { name: /2026\/2027/ }).getByText('Active', { exact: true })).toBeVisible()
    await page.getByLabel(/Afficher les saisons archivées/).check()
    await expect(page.getByRole('row', { name: /2025\/2026/ }).getByText('Archivée', { exact: true })).toBeVisible()
  })
})
