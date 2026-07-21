import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// The browser fetches xml_club_detail.php directly (Cloudflare/FFTT egress
// block, same as the other FFTT imports) — mocked per test, never hitting
// dafunker in CI.
const CLUB_DETAIL = '**/xml_club_detail.php**'

// An affiliation number absent from the seed (all 23 seeded clubs were
// corrected to their real numbers in #248) so this exercises the "new club"
// path rather than "already present". Uses "TT" (kept as-is, <=4 letters)
// and "NOUVEAUVILLE" (title-cased) to exercise the casing normalizer without
// hitting the coincidental 4-letter-word edge case ("CLUB" would also be
// kept as-is by the same heuristic used for real abbreviations like CSS/CPPC).
const newClubXml =
  '<?xml version="1.0" encoding="ISO-8859-1"?>' +
  '<liste><club><idclub>2680999</idclub><numero>06680999</numero><nom>TT NOUVEAUVILLE</nom>' +
  '<nomsalle>Gymnase Municipal</nomsalle><adressesalle1>2 rue de la Gare</adressesalle1>' +
  '<adressesalle2/><adressesalle3></adressesalle3><codepsalle>68680</codepsalle>' +
  '<villesalle>NOUVEAUVILLE</villesalle></club></liste>'

const noAddressXml =
  '<?xml version="1.0" encoding="ISO-8859-1"?>' +
  '<liste><club><idclub>2680998</idclub><numero>06680998</numero><nom>TT SANSADRESSE</nom>' +
  '<nomsalle/><adressesalle1/><adressesalle2/><adressesalle3/><codepsalle/><villesalle/></club></liste>'

const emptyXml = '<?xml version="1.0" encoding="ISO-8859-1"?><liste></liste>'

const rixheimXml =
  '<?xml version="1.0" encoding="ISO-8859-1"?>' +
  '<liste><club><numero>06680011</numero><nom>RIXHEIM PPA</nom>' +
  '<nomsalle>Complexe Sportif</nomsalle><adressesalle1>5, rue Vaclav Havel</adressesalle1>' +
  '<codepsalle>68170</codepsalle><villesalle>RIXHEIM</villesalle></club></liste>'

test.describe('General admin — Clubs FFTT import', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('previews (with normalized, editable fields) and imports a new club', async ({ page }) => {
    await page.route(CLUB_DETAIL, (route) => route.fulfill({ body: newClubXml, contentType: 'text/xml' }))

    await page.goto('/clubs')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('N° affiliation').fill('06680999')
    await dialog.getByRole('button', { name: 'Rechercher' }).click()

    // Casing normalized: "TT" (abbreviation, <=4 letters) kept as-is,
    // "NOUVEAUVILLE" title-cased.
    await expect(dialog.getByLabel('Nom du club')).toHaveValue('TT Nouveauville')
    await expect(dialog.getByLabel('Lieu de jeu')).toHaveValue('Gymnase Municipal')
    await expect(dialog.getByLabel('Adresse')).toHaveValue('2 rue de la Gare')
    await expect(dialog.getByLabel('Code postal')).toHaveValue('68680')
    await expect(dialog.getByLabel('Ville')).toHaveValue('Nouveauville')

    await dialog.getByRole('button', { name: 'Importer ce club' }).click()
    await expect(dialog.getByText('Club importé.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('cell', { name: 'TT Nouveauville' })).toBeVisible()
  })

  test('lets the admin edit a field before importing', async ({ page }) => {
    await page.route(CLUB_DETAIL, (route) => route.fulfill({ body: newClubXml, contentType: 'text/xml' }))

    await page.goto('/clubs')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('N° affiliation').fill('06680999')
    await dialog.getByRole('button', { name: 'Rechercher' }).click()

    await dialog.getByLabel('Nom du club').fill('TT Nouveauville Corrigé')
    await dialog.getByRole('button', { name: 'Importer ce club' }).click()
    await expect(dialog.getByText('Club importé.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('cell', { name: 'TT Nouveauville Corrigé' })).toBeVisible()
  })

  test('imports without an address when the FFTT club has no venue info', async ({ page }) => {
    await page.route(CLUB_DETAIL, (route) => route.fulfill({ body: noAddressXml, contentType: 'text/xml' }))

    await page.goto('/clubs')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('N° affiliation').fill('06680998')
    await dialog.getByRole('button', { name: 'Rechercher' }).click()

    await expect(dialog.getByText(/sera importé sans adresse/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Importer ce club' }).click()
    await dialog.getByRole('button', { name: 'Fermer' }).click()

    const row = page.getByRole('row').filter({ hasText: 'TT Sansadresse' })
    await expect(row.getByRole('cell', { name: '—', exact: true })).toBeVisible()
  })

  test('reports when the affiliation number is unknown', async ({ page }) => {
    await page.route(CLUB_DETAIL, (route) => route.fulfill({ body: emptyXml, contentType: 'text/xml' }))

    await page.goto('/clubs')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('N° affiliation').fill('00000000')
    await dialog.getByRole('button', { name: 'Rechercher' }).click()

    await expect(dialog.getByText('Aucun club trouvé pour ce numéro d’affiliation.')).toBeVisible()
  })

  test('shows the existing club’s info when the affiliation number is already present locally', async ({ page }) => {
    await page.route(CLUB_DETAIL, (route) => route.fulfill({ body: rixheimXml, contentType: 'text/xml' }))

    await page.goto('/clubs')
    await page.getByRole('button', { name: 'Importer depuis la FFTT' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('N° affiliation').fill('06680011')
    await dialog.getByRole('button', { name: 'Rechercher' }).click()

    await expect(dialog.getByText('Un club avec ce numéro d’affiliation existe déjà :')).toBeVisible()
    await expect(dialog.getByText('PPA Rixheim')).toBeVisible()
    await expect(dialog.getByText('N° 06680011')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Modifier ce club' })).toBeVisible()
  })
})
