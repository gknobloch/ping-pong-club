import { expect, Page } from '@playwright/test'

/**
 * Log in as a user by typing in the search and selecting the first matching option.
 * Assumes we're on /login.
 */
export async function loginAs(page: Page, search: string) {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.getByPlaceholder(/Nom ou adresse email/i).fill(search)
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.getByRole('option').first().click()
  await expect(page).toHaveURL('/')
}
