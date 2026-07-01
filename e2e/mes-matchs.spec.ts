import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Player — Mes matchs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'cunin')
    await page.getByRole('link', { name: /Tous mes matchs/i }).click()
    await expect(page).toHaveURL('/mes-matchs')
  })

  test('shows the phase switcher and a renfort tag on the called-up game', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mes matchs' })).toBeVisible()
    await expect(page.getByText('Saison 2025/2026 Phase 1')).toBeVisible()
    await expect(page.getByText('J1')).toBeVisible()
    await expect(page.getByText('J2')).toBeVisible()
    await expect(page.getByText('Renfort')).toBeVisible()
  })

  test('opens the game modal and can navigate back to Accueil', async ({ page }) => {
    await page.getByRole('button', { name: 'Détails du match' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    await page.getByRole('link', { name: '← Accueil' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/Bienvenue/)).toBeVisible()
  })
})
