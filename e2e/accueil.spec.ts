import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Player — Accueil', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'lotz')
  })

  test('shows welcome, club, and the upcoming match card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Bienvenue, Enzo Lotz/ })).toBeVisible()
    await expect(page.getByRole('main').getByText('PPA Rixheim', { exact: true })).toBeVisible()
    await expect(page.getByText('Prochain match')).toBeVisible()
    await expect(page.getByText(/PPA Rixheim 1 – Etival 1/)).toBeVisible()
  })

  test('setting availability updates the "À confirmer" tile', async ({ page }) => {
    await expect(page.getByText('1 match', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'OUI' }).click()
    await expect(page.getByText('0 matchs')).toBeVisible()
  })

  test('Détails opens the game modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Détails' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Disponibilités')).toBeVisible()
    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Tous mes matchs navigates to /mes-matchs', async ({ page }) => {
    await page.getByRole('link', { name: /Tous mes matchs/i }).click()
    await expect(page).toHaveURL('/mes-matchs')
    await expect(page.getByRole('heading', { name: 'Mes matchs' })).toBeVisible()
  })
})
