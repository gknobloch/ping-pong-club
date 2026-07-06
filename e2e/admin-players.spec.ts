import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Club admin — Joueurs list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'club.admin')
    await page.goto('/joueurs')
  })

  test('shows a club header and Ajouter un joueur inside it, defaults to Actif filter', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Joueurs' })).toBeVisible()
    await expect(page.getByRole('main').getByText('PPA Rixheim')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajouter un joueur' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Statut' })).toHaveValue('active')
    await expect(page.getByRole('columnheader', { name: 'Statut' })).toHaveCount(0)
  })

  test('a non-active player is hidden by default and shows a status badge under "Tous"', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un joueur' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Prénom').fill('Test')
    await dialog.getByLabel('Nom', { exact: true }).fill('Pending')
    await dialog.getByLabel('Email').fill('test.pending@example.com')
    await dialog.getByLabel('Statut').selectOption('pending_validation')
    await dialog.getByRole('button', { name: 'Enregistrer' }).click()

    await page.getByPlaceholder(/Rechercher par nom/i).fill('Pending')
    await expect(page.getByText('Test Pending')).toHaveCount(0)

    await page.getByRole('combobox', { name: 'Statut' }).selectOption('all')
    const row = page.getByRole('row', { name: /Test Pending/ })
    await expect(row).toBeVisible()
    await expect(row.getByText('En attente')).toBeVisible()

    await page.getByRole('combobox', { name: 'Statut' }).selectOption('active')
    await expect(page.getByText('Test Pending')).toHaveCount(0)
  })
})
