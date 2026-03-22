import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Navigation after login', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('can navigate to Accueil and see welcome', async ({ page }) => {
    await page.getByRole('link', { name: 'Accueil' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/Bienvenue/)).toBeVisible()
  })

  test('can navigate to Équipes', async ({ page }) => {
    await page.getByRole('link', { name: 'Équipes' }).click()
    await expect(page).toHaveURL('/equipes')
    await expect(page.getByRole('heading', { name: 'Équipes' })).toBeVisible()
  })

  test('can navigate to Journées', async ({ page }) => {
    await page.getByRole('link', { name: 'Journées' }).click()
    await expect(page).toHaveURL('/journees')
    await expect(
      page.getByRole('heading', { name: 'Journées' })
    ).toBeVisible()
  })

  test('can logout and is redirected to login', async ({ page }) => {
    await expect(page.getByText(/Bienvenue/)).toBeVisible()
    await page.getByRole('button', { name: 'Déconnexion' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /Disponibilités Ping-Pong/i })).toBeVisible()
  })
})
