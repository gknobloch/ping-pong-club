import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Club admin / Captain — Mon club', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'szulc')
  })

  test('sees Mon club in nav and can open it', async ({ page }) => {
    await expect(page.getByText(/Bienvenue/)).toBeVisible()
    await page.getByRole('link', { name: 'Mon club' }).click()
    await expect(page).toHaveURL('/mon-club')
    await expect(page.getByRole('heading', { name: 'Mon club' })).toBeVisible()
  })

  test('Mon club page shows club info and addresses section', async ({ page }) => {
    await page.goto('/mon-club')
    await expect(page.getByRole('heading', { name: 'Mon club' })).toBeVisible()
    await expect(page.getByText(/Informations du club/i)).toBeVisible()
    await expect(page.getByText(/Adresses \(lieux de jeu\)/i)).toBeVisible()
  })
})

test.describe('Club admin — Mon club (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'club.admin')
  })

  test('club admin sees Mon club and can see club name in form', async ({ page }) => {
    await page.goto('/mon-club')
    await expect(page.getByRole('heading', { name: 'Mon club' })).toBeVisible()
    await expect(page.getByLabel(/Nom/i)).toHaveValue(/PPA Rixheim|Rixheim/i)
  })
})
