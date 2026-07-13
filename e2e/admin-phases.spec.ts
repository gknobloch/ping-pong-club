import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('General admin — Phases single-active invariant (#221)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/phases')
  })

  test('activating a new phase deactivates the previous active one', async ({ page }) => {
    // Mock data starts with one active phase: 2025/2026 Phase 1.
    await expect(page.getByText('Active', { exact: true })).toHaveCount(1)

    await page.getByRole('button', { name: 'Ajouter une phase' }).click()
    await page.getByLabel(/^Nom \(ex/).fill('Phase 2')
    await page.getByLabel('Active').check()
    await expect(page.getByText('une seule phase active à la fois')).toBeVisible()
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
    await page.getByLabel(/^Nom \(ex/).fill('Phase 2')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('cell', { name: '2025/2026 Phase 2' })).toBeVisible()

    // Activate it via Modifier.
    await page.getByRole('row', { name: /2025\/2026 Phase 2/ }).getByRole('button', { name: 'Modifier' }).click()
    await page.getByLabel('Active').check()
    await expect(page.getByText('une seule phase active à la fois')).toBeVisible()
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByText('Active', { exact: true })).toHaveCount(1)
    await expect(
      page.getByRole('row', { name: /2025\/2026 Phase 2/ }).getByText('Active', { exact: true }),
    ).toBeVisible()
  })
})
