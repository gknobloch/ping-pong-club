import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Player — Accueil', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'lotz')
  })

  test('shows welcome, club, and the upcoming match card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Enzo Lotz', level: 1 })).toBeVisible()
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

  test('shows the "Tous mes matchs" section with a phase switcher', async ({ page }) => {
    await expect(page.getByText('Tous mes matchs')).toBeVisible()
    await expect(page.getByText('Saison 2025/2026 Phase 1')).toBeVisible()
  })
})

// Cédric Cunin is the seeded renfort/brûlage case: rostered on team-2, called
// up to team-1 for a second game — his full match history exercises the
// "Renfort" tag and spans two of the club's teams.
test.describe('Player — Accueil (Tous mes matchs)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'cunin')
  })

  test('shows every game across the club with a renfort tag on the called-up game', async ({ page }) => {
    await expect(page.getByText('Tous mes matchs')).toBeVisible()
    await expect(page.getByText('J1')).toBeVisible()
    await expect(page.getByText('J2')).toBeVisible()
    await expect(page.getByText('Renfort')).toBeVisible()
  })

  test('opens the game modal from the match history', async ({ page }) => {
    await page.getByRole('button', { name: 'Détails du match' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
