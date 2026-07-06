import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Club admin / Captain — Mon club', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'szulc')
  })

  test('sees Mon club in nav and can open it', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('link', { name: 'Mon club' }).click()
    await expect(page).toHaveURL('/mon-club')
    await expect(page.getByRole('heading', { name: 'PPA Rixheim' })).toBeVisible()
  })

  test('Mon club page shows a read-only club header, addresses, and channels — no Modifier button', async ({ page }) => {
    await page.goto('/mon-club')
    await expect(page.getByRole('heading', { name: 'PPA Rixheim' })).toBeVisible()
    await expect(page.getByText(/N° 06680011/)).toBeVisible()
    await expect(page.getByText('Adresses')).toBeVisible()
    await expect(page.getByText('Canaux de communication')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Modifier' })).toHaveCount(0)
  })
})

test.describe('Club admin — Mon club (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'club.admin')
  })

  test('club admin sees a Modifier button and can open the edit form', async ({ page }) => {
    await page.goto('/mon-club')
    await expect(page.getByRole('heading', { name: 'PPA Rixheim' })).toBeVisible()
    await page.getByRole('button', { name: 'Modifier' }).click()
    await expect(page.getByLabel(/Nom/i)).toHaveValue(/PPA Rixheim|Rixheim/i)
    await page.getByRole('button', { name: 'Terminé' }).click()
    await expect(page.getByLabel(/Nom/i)).toHaveCount(0)
  })
})
