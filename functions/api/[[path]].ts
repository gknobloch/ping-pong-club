import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { authApp, bearer, userFromToken, type Env } from './auth'
import { seasonIdFromFftt, seasonIdFromName, seasonNameFromFftt } from '../../src/lib/season'
import { ffttIdFromIri, orderDivisions, playersPerGameFor, type FfttDivision } from '../../src/lib/ffttDivisions'
import { FFTT_PHASES, localPhaseId, phaseOrderKey } from '../../src/lib/ffttPhases'
import { parseClubTeams, type FfttClubTeam, type FfttClubTeamEntry } from '../../src/lib/ffttTeams'
import { parseSportMatches, type FfttMatch, type FfttMatchTeam, type FfttSportMatchNode } from '../../src/lib/ffttGames'

const app = new Hono<Env>().basePath('/api')

// Public endpoints that must work without a session (you're not logged in yet).
const PUBLIC_PATH = /^\/api\/auth\/(email\/|oauth$)/

// Image endpoints are served to <img> / <Image> tags, which can't send the
// Bearer header — so GETs to them are public (read-only, non-sensitive logos /
// avatars). Writes (PUT/DELETE) still go through the guard below.
const PUBLIC_IMAGE_PATH = /^\/api\/(clubs\/[^/]+\/logo|players\/[^/]+\/avatar)$/

// Session guard (#98): every /api route except the public auth + image endpoints
// requires a valid Bearer session. Bypassed locally via AUTH_GUARD_DISABLED so
// the dev user-picker login (no server session) still works in development.
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (PUBLIC_PATH.test(path) || c.env.AUTH_GUARD_DISABLED === 'true') return next()
  if (c.req.method === 'GET' && PUBLIC_IMAGE_PATH.test(path)) return next()
  const token = bearer(c.req.header('Authorization'))
  const user = token ? await userFromToken(c.env.DB, token) : null
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  c.set('user', user)
  return next()
})

// Authentication (email OTP + Google/Apple OAuth).
app.route('/auth', authApp)

// --- Helpers ---
const bool = (v: unknown) => v === 1 || v === true
const jsonParse = (v: unknown): unknown => {
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return v } }
  return v ?? []
}
const jsonStr = (v: unknown) => JSON.stringify(v)

// --- GET /api/data — return all entities ---
app.get('/data', async (c) => {
  const db = c.env.DB
  const [
    seasonsR, phasesR, divisionsR, clubsR, addressesR, channelsR,
    groupsR, teamsR, matchDaysR, gamesR,
    availsR, selectionsR, usersR, avatarsR, clubLogosR,
  ] = await Promise.all([
    db.prepare('SELECT * FROM seasons').all(),
    db.prepare('SELECT * FROM phases').all(),
    db.prepare('SELECT * FROM divisions').all(),
    db.prepare('SELECT * FROM clubs').all(),
    db.prepare('SELECT * FROM club_addresses').all(),
    db.prepare('SELECT * FROM club_channels ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM groups_tbl').all(),
    db.prepare('SELECT * FROM teams').all(),
    db.prepare('SELECT * FROM match_days').all(),
    db.prepare('SELECT * FROM games').all(),
    db.prepare('SELECT * FROM game_availabilities').all(),
    db.prepare('SELECT * FROM game_selections').all(),
    db.prepare('SELECT * FROM users').all(),
    // Only the version marker — the image bytes are served separately so this
    // bulk payload stays light.
    db.prepare('SELECT user_id, updated_at FROM player_avatars').all(),
    db.prepare('SELECT club_id, updated_at FROM club_logos').all(),
  ])
  const avatarUpdatedAt = new Map(
    avatarsR.results.map((r) => [r.user_id as string, r.updated_at as string]),
  )
  const logoUpdatedAt = new Map(
    clubLogosR.results.map((r) => [r.club_id as string, r.updated_at as string]),
  )

  const addrByClub = new Map<string, unknown[]>()
  for (const a of addressesR.results) {
    const cid = a.club_id as string
    if (!addrByClub.has(cid)) addrByClub.set(cid, [])
    addrByClub.get(cid)!.push({
      id: a.id, label: a.label, street: a.street,
      postalCode: a.postal_code, city: a.city, isDefault: bool(a.is_default),
    })
  }

  // Channels are pre-sorted by sort_order in the query above.
  const channelsByClub = new Map<string, unknown[]>()
  for (const ch of channelsR.results) {
    const cid = ch.club_id as string
    if (!channelsByClub.has(cid)) channelsByClub.set(cid, [])
    channelsByClub.get(cid)!.push({
      id: ch.id, type: ch.type, link: ch.link, sortOrder: ch.sort_order,
      ...(ch.display_name ? { displayName: ch.display_name } : {}),
    })
  }

  return c.json({
    seasons: seasonsR.results.map(r => ({
      id: r.id, displayName: r.display_name, status: r.status,
    })),
    phases: phasesR.results.map(r => ({
      id: r.id, seasonId: r.season_id, name: r.name, displayName: r.display_name,
      // Fallback for databases that haven't run migration 0012 yet: PR
      // previews share the production D1 but never run migrations, so the
      // old is_active/is_archived columns may still be what exists.
      status: r.status ?? (bool(r.is_active) ? 'active' : bool(r.is_archived) ? 'archived' : 'upcoming'),
    })),
    divisions: divisionsR.results.map(r => ({
      id: r.id, phaseId: r.phase_id, displayName: r.display_name,
      rank: r.rank, playersPerGame: r.players_per_game,
      isArchived: bool(r.is_archived),
    })),
    clubs: clubsR.results.map(r => ({
      id: r.id, affiliationNumber: r.affiliation_number, displayName: r.display_name,
      isArchived: bool(r.is_archived),
      addresses: addrByClub.get(r.id as string) ?? [],
      channels: channelsByClub.get(r.id as string) ?? [],
      ...(logoUpdatedAt.has(r.id as string)
        ? { logoUpdatedAt: logoUpdatedAt.get(r.id as string) }
        : {}),
    })),
    groups: groupsR.results.map(r => ({
      id: r.id, divisionId: r.division_id, number: r.number, teamIds: jsonParse(r.team_ids),
      isArchived: bool(r.is_archived),
    })),
    // Players are the projection of users where is_player = 1.
    players: usersR.results.filter(r => bool(r.is_player)).map(r => ({
      id: r.id, firstName: r.first_name, lastName: r.last_name,
      licenseNumber: r.license_number, email: r.email, phone: r.phone ?? '',
      ...(r.birth_date ? { birthDate: r.birth_date } : {}),
      ...(r.birth_place ? { birthPlace: r.birth_place } : {}),
      status: r.status, clubId: r.club_id ?? '',
      ...(avatarUpdatedAt.has(r.id as string)
        ? { avatarUpdatedAt: avatarUpdatedAt.get(r.id as string) }
        : {}),
    })),
    teams: teamsR.results.map(r => ({
      id: r.id, clubId: r.club_id, phaseId: r.phase_id, number: r.number,
      divisionId: r.division_id, groupId: r.group_id, gameLocationId: r.game_location_id,
      defaultDay: r.default_day, defaultTime: r.default_time, captainId: r.captain_id,
      isArchived: bool(r.is_archived),
      playerIds: jsonParse(r.player_ids),
      ...(r.roster_initial_points ? { rosterInitialPoints: jsonParse(r.roster_initial_points) } : {}),
      ...(r.color ? { color: r.color } : {}),
      ...(r.whatsapp_link ? { whatsappLink: r.whatsapp_link } : {}),
    })),
    matchDays: matchDaysR.results.map(r => ({
      id: r.id, groupId: r.group_id, number: r.number, date: r.date,
    })),
    games: gamesR.results.map(r => ({
      id: r.id, matchDayId: r.match_day_id, homeTeamId: r.home_team_id,
      awayTeamId: r.away_team_id, ...(r.time ? { time: r.time } : {}),
    })),
    gameAvailabilities: availsR.results.map(r => ({
      id: r.id, gameId: r.game_id, playerId: r.player_id, status: r.status,
      ...(r.overridden_by ? { overriddenBy: r.overridden_by } : {}),
    })),
    gameSelections: selectionsR.results.map(r => ({
      id: r.id, gameId: r.game_id, teamId: r.team_id, playerIds: jsonParse(r.player_ids),
    })),
    users: usersR.results.map(r => ({
      id: r.id, email: r.email, role: r.role, isPlayer: bool(r.is_player),
      ...(r.first_name ? { firstName: r.first_name } : {}),
      ...(r.last_name ? { lastName: r.last_name } : {}),
      ...(r.license_number ? { licenseNumber: r.license_number } : {}),
      ...(r.phone ? { phone: r.phone } : {}),
      ...(r.birth_date ? { birthDate: r.birth_date } : {}),
      ...(r.birth_place ? { birthPlace: r.birth_place } : {}),
      ...(r.status ? { status: r.status } : {}),
      ...(r.club_id ? { clubId: r.club_id } : {}),
    })),
  })
})

// --- Seasons ---
const SEASON_STATUSES = ['active', 'upcoming', 'archived']

// Demotion is chronology-aware (#227): what stops being active is archived
// when it is older than what becomes active, but goes back to 'upcoming' when
// it is newer (rolling back to an older phase/season).
async function demoteActivePhases(db: Env['Bindings']['DB'], exceptId: string, newKey: number) {
  const actives = await db.prepare(
    "SELECT id, season_id, name FROM phases WHERE status = 'active' AND id != ?",
  ).bind(exceptId).all()
  for (const r of actives.results) {
    const demoted = phaseOrderKey(r.season_id as string, r.name as string) < newKey ? 'archived' : 'upcoming'
    await db.prepare('UPDATE phases SET status = ? WHERE id = ?').bind(demoted, r.id).run()
  }
}

async function demoteActiveSeasons(db: Env['Bindings']['DB'], newSeasonId: string) {
  const actives = await db.prepare(
    "SELECT id FROM seasons WHERE status = 'active' AND id != ?",
  ).bind(newSeasonId).all()
  for (const r of actives.results) {
    const demoted = Number(r.id) < Number(newSeasonId) ? 'archived' : 'upcoming'
    await db.prepare('UPDATE seasons SET status = ? WHERE id = ?').bind(demoted, r.id).run()
  }
}

// Mirror of the phase→season cascade (#227): activating a season keeps the
// active phase when it already belongs to it, otherwise switches to that
// season's most recent non-archived phase (Phase 2 over Phase 1) — or none
// when the season has no phases yet.
async function alignActivePhaseToSeason(db: Env['Bindings']['DB'], seasonId: string) {
  const active = await db.prepare("SELECT id, season_id FROM phases WHERE status = 'active'").all()
  const coherent = active.results.length > 0 && active.results.every(r => r.season_id === seasonId)
  if (coherent) return
  const latest = await db.prepare(
    "SELECT id, name FROM phases WHERE season_id = ? AND status != 'archived' ORDER BY name DESC LIMIT 1",
  ).bind(seasonId).first()
  // No phase to activate → compare against the season alone (phase 0).
  await demoteActivePhases(db, (latest?.id as string) ?? '', phaseOrderKey(seasonId, (latest?.name as string) ?? ''))
  if (latest) await db.prepare("UPDATE phases SET status = 'active' WHERE id = ?").bind(latest.id).run()
}

// The FFTT GraphQL API and the dafunker proxy both occasionally hiccup on a
// single request (observed in production: a teams import failing with a 502
// right after an identical one had succeeded, more than once even with a
// single retry). A few attempts with growing backoff absorb that without
// masking a genuinely-down upstream; a per-attempt timeout keeps one slow
// request from eating the whole budget.
const RETRY_DELAYS_MS = [300, 700, 1500]
const FETCH_TIMEOUT_MS = 8000

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response | null> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      if (res.ok) return res
    } catch {
      // fall through to retry
    } finally {
      clearTimeout(timeout)
    }
  }
  return null
}

// FFTT GraphQL API — source of truth for season ids and names (#217).
const FFTT_GRAPHQL_URL = 'https://apiv2.fftt.com/api/graphql'

// Run a GraphQL query against the FFTT API; null when unreachable/invalid.
async function ffttGraphql<T>(query: string): Promise<T | null> {
  const res = await fetchWithRetry(FFTT_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res) return null
  try {
    const body = await res.json() as { data?: T }
    return body.data ?? null
  } catch {
    return null
  }
}

type FfttEdges<N> = { edges?: Array<{ node?: N }> }

async function fetchFfttCurrentSeason(): Promise<{ id: string; displayName: string } | null> {
  const data = await ffttGraphql<{ seasons?: FfttEdges<{ id?: string; name?: string }> }>(
    '{ seasons(current: true) { edges { node { id name } } } }',
  )
  const node = data?.seasons?.edges?.[0]?.node
  if (!node?.id || !node.name) return null
  return { id: seasonIdFromFftt(node.id), displayName: seasonNameFromFftt(node.name) }
}

// GET /seasons/fftt-current — the FFTT current season + whether it exists
// locally and with which status (an existing-but-archived season should be
// offered for activation, not silently ignored — #223).
app.get('/seasons/fftt-current', async (c) => {
  const fftt = await fetchFfttCurrentSeason()
  if (!fftt) return c.json({ error: 'fftt_unavailable' }, 502)
  const existing = await c.env.DB.prepare('SELECT status FROM seasons WHERE id = ?').bind(fftt.id).first()
  return c.json({ ...fftt, exists: !!existing, ...(existing ? { status: existing.status } : {}) })
})

// POST /seasons/import-current — import the FFTT current season, make it
// active, and archive the previously active season(s).
app.post('/seasons/import-current', async (c) => {
  const db = c.env.DB
  const fftt = await fetchFfttCurrentSeason()
  if (!fftt) return c.json({ error: 'fftt_unavailable' }, 502)
  const existing = await db.prepare('SELECT id FROM seasons WHERE id = ?').bind(fftt.id).first()
  if (existing) return c.json({ error: 'already_exists' }, 409)
  const activeR = await db.prepare("SELECT id FROM seasons WHERE status = 'active'").all()
  await demoteActiveSeasons(db, fftt.id)
  await db.prepare("INSERT INTO seasons (id, display_name, status) VALUES (?, ?, 'active')")
    .bind(fftt.id, fftt.displayName).run()
  await alignActivePhaseToSeason(db, fftt.id)
  return c.json({
    season: { id: fftt.id, displayName: fftt.displayName, status: 'active' },
    archivedSeasonIds: activeR.results.map(r => r.id as string),
  })
})

app.post('/seasons', async (c) => {
  const d = await c.req.json()
  // The id is always derived from the name (FFTT convention), never trusted
  // from the client — this is what prevents garbage seasons.
  const displayName = typeof d.displayName === 'string' ? d.displayName.trim() : ''
  const id = seasonIdFromName(displayName)
  if (!id) return c.json({ error: 'invalid_name' }, 400)
  const existing = await c.env.DB.prepare('SELECT id FROM seasons WHERE id = ?').bind(id).first()
  if (existing) return c.json({ error: 'already_exists' }, 409)
  const status = SEASON_STATUSES.includes(d.status) ? d.status : 'upcoming'
  if (status === 'active') await demoteActiveSeasons(c.env.DB, id)
  await c.env.DB.prepare('INSERT INTO seasons (id, display_name, status) VALUES (?, ?, ?)')
    .bind(id, displayName, status).run()
  if (status === 'active') await alignActivePhaseToSeason(c.env.DB, id)
  return c.json({ id, displayName, status })
})

app.patch('/seasons/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('displayName' in p) {
    // Renaming keeps the id (fixed at creation) but must stay a valid season name.
    const displayName = typeof p.displayName === 'string' ? p.displayName.trim() : ''
    if (!seasonIdFromName(displayName)) return c.json({ error: 'invalid_name' }, 400)
    s.push('display_name = ?'); v.push(displayName)
  }
  if ('status' in p) {
    if (!SEASON_STATUSES.includes(p.status)) return c.json({ error: 'invalid_status' }, 400)
    s.push('status = ?'); v.push(p.status)
  }
  if (s.length) {
    // Single-active invariant: activating a season demotes the previous one
    // (archived when older, back to 'upcoming' when newer).
    if (p.status === 'active') await demoteActiveSeasons(c.env.DB, id)
    v.push(id)
    await c.env.DB.prepare(`UPDATE seasons SET ${s.join(', ')} WHERE id = ?`).bind(...v).run()
    // Season→phase cascade (#227), symmetric with the phase→season one.
    if (p.status === 'active') await alignActivePhaseToSeason(c.env.DB, id)
  }
  return c.json({ ok: true })
})

// --- FFTT divisions import (#219) ---

// GET /fftt/organizations — locally cached FFTT organizations (never hits FFTT).
app.get('/fftt/organizations', async (c) => {
  const r = await c.env.DB.prepare('SELECT id, type, identifier, name FROM organizations ORDER BY type, name').all()
  return c.json({ organizations: r.results })
})

// POST /fftt/organizations/refresh — re-fetch the list from FFTT and replace the cache.
app.post('/fftt/organizations/refresh', async (c) => {
  let members: Array<{ '@type': string; id: number; identifier: string; name: string }>
  try {
    const res = await fetch('https://apiv2.fftt.com/api/organizations/all')
    if (!res.ok) return c.json({ error: 'fftt_unavailable' }, 502)
    const body = await res.json() as { 'hydra:member'?: typeof members }
    if (!body['hydra:member']?.length) return c.json({ error: 'fftt_unavailable' }, 502)
    members = body['hydra:member']
  } catch {
    return c.json({ error: 'fftt_unavailable' }, 502)
  }
  const db = c.env.DB
  const now = new Date().toISOString()
  const stmts = [
    db.prepare('DELETE FROM organizations'),
    ...members.map((m) =>
      db.prepare('INSERT INTO organizations (id, type, identifier, name, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(String(m.id), m['@type'], m.identifier, m.name, now),
    ),
  ]
  // Chunked: D1 batches are capped well below the ~130 rows FFTT returns.
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50))
  const r = await db.prepare('SELECT id, type, identifier, name FROM organizations ORDER BY type, name').all()
  return c.json({ organizations: r.results })
})

// Fetch the championship contest (identifier "1") then its divisions from FFTT.
// null = FFTT unreachable; contest null = no championship for those params.
async function fetchFfttDivisions(organizationId: number, seasonId: number, phase: number): Promise<{
  contest: { id: string; name: string } | null
  divisions: FfttDivision[]
} | null> {
  const contestData = await ffttGraphql<{ contests?: FfttEdges<{ id: string; name: string }> }>(
    `{ contests(divisions_organization_id: ${organizationId} season_id: ${seasonId} identifier: "1") { edges { node { id name } } } }`,
  )
  if (contestData === null) return null
  const contestNode = contestData.contests?.edges?.[0]?.node
  if (!contestNode) return { contest: null, divisions: [] }
  const contestId = ffttIdFromIri(contestNode.id)
  const divData = await ffttGraphql<{
    divisions?: FfttEdges<{ id: string; identifier: string; name: string; parent: { id: string } | null }>
  }>(
    `{ divisions(contest_id: ${Number(contestId)} organization_id: ${organizationId} phase_id: ${phase}) { edges { node { id identifier name parent { id } } } } }`,
  )
  if (divData === null) return null
  const divisions: FfttDivision[] = (divData.divisions?.edges ?? []).flatMap((e) => e.node ? [{
    id: ffttIdFromIri(e.node.id),
    identifier: e.node.identifier,
    name: e.node.name,
    parentId: e.node.parent ? ffttIdFromIri(e.node.parent.id) : null,
  }] : [])
  return { contest: { id: contestId, name: contestNode.name }, divisions }
}

const importParams = (organizationId: unknown, seasonId: unknown, phase: unknown) => {
  const org = Number(organizationId), season = Number(seasonId), ph = Number(phase)
  const knownPhase = FFTT_PHASES.some((p) => Number(p.id) === ph)
  if (!Number.isInteger(org) || org <= 0 || !Number.isInteger(season) || season <= 0 || !knownPhase) return null
  return { org, season, ph }
}

// Existing divisions of a phase, for skip-matching by FFTT id or name.
async function phaseDivisions(db: Env['Bindings']['DB'], phaseId: string) {
  const r = await db.prepare('SELECT id, display_name, rank FROM divisions WHERE phase_id = ?').bind(phaseId).all()
  return {
    ids: new Set(r.results.map((x) => x.id as string)),
    names: new Set(r.results.map((x) => (x.display_name as string).toLowerCase())),
    maxRank: r.results.reduce((m, x) => Math.max(m, x.rank as number), 0),
  }
}

// GET /fftt/divisions-preview — ordered division list for (organization, season, phase),
// flagging the ones that already exist locally.
app.get('/fftt/divisions-preview', async (c) => {
  const p = importParams(c.req.query('organizationId'), c.req.query('seasonId'), c.req.query('phase'))
  if (!p) return c.json({ error: 'invalid_params' }, 400)
  const result = await fetchFfttDivisions(p.org, p.season, p.ph)
  if (!result) return c.json({ error: 'fftt_unavailable' }, 502)
  if (!result.contest) return c.json({ error: 'no_contest' }, 404)
  const phaseRow = await c.env.DB.prepare('SELECT id FROM phases WHERE season_id = ? AND name = ?')
    .bind(String(p.season), `Phase ${p.ph}`).first()
  const existing = phaseRow
    ? await phaseDivisions(c.env.DB, phaseRow.id as string)
    : { ids: new Set<string>(), names: new Set<string>(), maxRank: 0 }
  return c.json({
    contest: result.contest,
    phaseExists: !!phaseRow,
    divisions: orderDivisions(result.divisions).map((d, i) => ({
      id: d.id, identifier: d.identifier, name: d.name, rank: i + 1,
      playersPerGame: playersPerGameFor(d.identifier),
      exists: existing.ids.has(d.id) || existing.names.has(d.name.toLowerCase()),
    })),
  })
})

type ImportedPhase = { id: string; seasonId: unknown; name: unknown; displayName: unknown; status: unknown }
type ImportedDivision = { id: string; phaseId: string; displayName: string; rank: number; playersPerGame: number; isArchived: boolean }

// Core of the divisions import: re-fetches from FFTT (never trusts a client
// list), creates the phase if missing (inactive), inserts the divisions not
// already present, ranked after any existing ones. Shared by
// POST /divisions/import and the teams import (#229), which auto-imports the
// divisions of a phase when a team's division is unknown locally.
async function importDivisions(db: Env['Bindings']['DB'], p: { org: number; season: number; ph: number }): Promise<
  | { phase: ImportedPhase; createdPhase: boolean; created: ImportedDivision[]; skipped: Array<{ id: string; name: string }> }
  | 'season_not_found' | 'fftt_unavailable' | 'no_divisions'
> {
  const season = await db.prepare('SELECT id, display_name FROM seasons WHERE id = ?').bind(String(p.season)).first()
  if (!season) return 'season_not_found'
  const result = await fetchFfttDivisions(p.org, p.season, p.ph)
  if (!result) return 'fftt_unavailable'
  if (!result.contest || result.divisions.length === 0) return 'no_divisions'

  const phaseName = `Phase ${p.ph}`
  let phaseRow = await db.prepare(
    'SELECT id, season_id, name, display_name, status FROM phases WHERE season_id = ? AND name = ?',
  ).bind(String(p.season), phaseName).first()
  const createdPhase = !phaseRow
  if (!phaseRow) {
    const displayName = `${season.display_name} ${phaseName}`
    const id = localPhaseId(p.season, p.ph)
    // Created 'upcoming' on purpose: activation stays a manual step on /phases.
    await db.prepare("INSERT INTO phases (id, season_id, name, display_name, status) VALUES (?, ?, ?, ?, 'upcoming')")
      .bind(id, String(p.season), phaseName, displayName).run()
    phaseRow = { id, season_id: String(p.season), name: phaseName, display_name: displayName, status: 'upcoming' }
  }
  const phaseId = phaseRow.id as string

  const existing = await phaseDivisions(db, phaseId)
  let rank = existing.maxRank
  const created: ImportedDivision[] = []
  const skipped: Array<{ id: string; name: string }> = []
  for (const d of orderDivisions(result.divisions)) {
    if (existing.ids.has(d.id) || existing.names.has(d.name.toLowerCase())) {
      skipped.push({ id: d.id, name: d.name })
      continue
    }
    rank += 1
    created.push({
      id: d.id, phaseId, displayName: d.name, rank,
      playersPerGame: playersPerGameFor(d.identifier), isArchived: false,
    })
  }
  if (created.length) {
    await db.batch(created.map((d) =>
      db.prepare('INSERT INTO divisions (id, phase_id, display_name, rank, players_per_game, is_archived) VALUES (?, ?, ?, ?, ?, 0)')
        .bind(d.id, d.phaseId, d.displayName, d.rank, d.playersPerGame),
    ))
  }
  return {
    phase: {
      id: phaseId, seasonId: phaseRow.season_id, name: phaseRow.name,
      displayName: phaseRow.display_name, status: phaseRow.status,
    },
    createdPhase,
    created,
    skipped,
  }
}

app.post('/divisions/import', async (c) => {
  const b = await c.req.json()
  const p = importParams(b.organizationId, b.seasonId, b.phase)
  if (!p) return c.json({ error: 'invalid_params' }, 400)
  const result = await importDivisions(c.env.DB, p)
  if (result === 'season_not_found') return c.json({ error: 'season_not_found' }, 404)
  if (result === 'fftt_unavailable') return c.json({ error: 'fftt_unavailable' }, 502)
  if (result === 'no_divisions') return c.json({ error: 'no_divisions' }, 404)
  return c.json(result)
})

// --- FFTT teams import (#229) ---

// The dafunker proxy exposes a club's engaged teams (current FFTT season, all
// phases mixed) — apiv2.fftt.com has no equivalent per-club query.
const FFTT_CLUB_TEAMS_URL = (affiliation: string) =>
  `https://fftt.dafunker.com/v1/club/${encodeURIComponent(affiliation)}/equipes`

async function fetchFfttClubTeams(affiliation: string): Promise<FfttClubTeam[] | null> {
  const res = await fetchWithRetry(FFTT_CLUB_TEAMS_URL(affiliation))
  if (!res) return null
  try {
    const body = await res.json()
    return parseClubTeams(Array.isArray(body) ? (body as FfttClubTeamEntry[]) : [])
  } catch {
    return null
  }
}

// --- Cache fallback (#229 follow-up) ---
// The FFTT GraphQL API and, more often, the unofficial dafunker proxy
// occasionally reject requests from Cloudflare's network specifically (a
// plain curl from outside succeeds every time retries here still fail — this
// looks like an upstream rate-limit/IP block rather than plain flakiness, so
// more retries alone don't help). Caching the last successful result lets a
// transient failure fall back to recent data instead of a hard 502.
interface CacheResult<T> { data: T; stale: boolean; fetchedAt: string | null }

// The cache is an optimization, never a correctness requirement, so neither
// half may fail a request on its own: a write error still returns the fresh
// data we already hold, and a read error is treated as "no cache" (the caller
// then reports fftt_unavailable, i.e. the pre-cache behaviour). This also
// keeps the deploy order-independent — PR previews share the production D1
// but never run migrations, so the tables can legitimately be missing.
async function cacheWrite(stmt: () => D1PreparedStatement): Promise<void> {
  try {
    await stmt().run()
  } catch {
    // Cache unavailable (e.g. migration 0013 not applied yet) — ignore.
  }
}

async function cacheRead(stmt: () => D1PreparedStatement): Promise<Record<string, unknown> | null> {
  try {
    return await stmt().first()
  } catch {
    return null
  }
}

async function cachedCurrentSeason(db: Env['Bindings']['DB']): Promise<CacheResult<{ id: string; displayName: string }> | null> {
  const fresh = await fetchFfttCurrentSeason()
  if (fresh) {
    const now = new Date().toISOString()
    await cacheWrite(() => db.prepare(
      `INSERT INTO fftt_season_cache (id, payload, fetched_at) VALUES ('current', ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
    ).bind(JSON.stringify(fresh), now))
    return { data: fresh, stale: false, fetchedAt: now }
  }
  const cached = await cacheRead(() =>
    db.prepare(`SELECT payload, fetched_at FROM fftt_season_cache WHERE id = 'current'`))
  if (!cached) return null
  return { data: JSON.parse(cached.payload as string), stale: true, fetchedAt: cached.fetched_at as string }
}

async function cachedClubTeams(db: Env['Bindings']['DB'], clubId: string, affiliation: string): Promise<CacheResult<FfttClubTeam[]> | null> {
  const fresh = await fetchFfttClubTeams(affiliation)
  if (fresh) {
    const now = new Date().toISOString()
    await cacheWrite(() => db.prepare(
      `INSERT INTO fftt_club_teams_cache (club_id, payload, fetched_at) VALUES (?, ?, ?)
       ON CONFLICT(club_id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
    ).bind(clubId, JSON.stringify(fresh), now))
    return { data: fresh, stale: false, fetchedAt: now }
  }
  const cached = await cacheRead(() =>
    db.prepare('SELECT payload, fetched_at FROM fftt_club_teams_cache WHERE club_id = ?').bind(clubId))
  if (!cached) return null
  return { data: JSON.parse(cached.payload as string), stale: true, fetchedAt: cached.fetched_at as string }
}

// Shared context for the teams preview and import: the club, the FFTT current
// season, and the club's parsed FFTT teams — live when reachable, otherwise
// the last cached successful result.
async function teamsImportContext(db: Env['Bindings']['DB'], clubId: string) {
  const club = await db.prepare('SELECT id, affiliation_number, display_name FROM clubs WHERE id = ?')
    .bind(clubId).first()
  if (!club) return { error: 'club_not_found' as const }
  const seasonResult = await cachedCurrentSeason(db)
  if (!seasonResult) return { error: 'fftt_unavailable' as const }
  const teamsResult = await cachedClubTeams(db, clubId, club.affiliation_number as string)
  if (!teamsResult) return { error: 'fftt_unavailable' as const }
  const teams = teamsResult.data
  const seasonRow = await db.prepare('SELECT id FROM seasons WHERE id = ?').bind(seasonResult.data.id).first()
  // Stable order: phase first, then team number.
  teams.sort((a, b) => (a.phase ?? 9) - (b.phase ?? 9) || a.number - b.number)
  return {
    club, teams,
    season: { ...seasonResult.data, exists: !!seasonRow },
    stale: seasonResult.stale || teamsResult.stale,
    // Teams data is what the preview mostly shows — prioritize its "as of"
    // time; only the season's when that's the (rarer) stale one.
    fetchedAt: teamsResult.stale ? teamsResult.fetchedAt : (seasonResult.stale ? seasonResult.fetchedAt : null),
  }
}

// Existing teams of a club, for skip-matching by FFTT id or (phase, number).
async function clubTeamKeys(db: Env['Bindings']['DB'], clubId: string) {
  const r = await db.prepare('SELECT id, phase_id, number FROM teams WHERE club_id = ?').bind(clubId).all()
  return {
    ids: new Set(r.results.map((t) => t.id as string)),
    byPhaseNumber: new Set(r.results.map((t) => `${t.phase_id}|${t.number}`)),
  }
}

// GET /fftt/teams-preview — the club's FFTT teams flagged with what an import
// would do (already present, division to auto-import, …).
app.get('/fftt/teams-preview', async (c) => {
  const clubId = c.req.query('clubId')
  if (!clubId) return c.json({ error: 'invalid_params' }, 400)
  const ctx = await teamsImportContext(c.env.DB, clubId)
  if ('error' in ctx) return c.json({ error: ctx.error }, ctx.error === 'club_not_found' ? 404 : 502)

  const divisionRows = await c.env.DB.prepare('SELECT id, display_name, phase_id FROM divisions').all()
  const divisionById = new Map(divisionRows.results.map((d) => [d.id as string, d]))
  const existing = await clubTeamKeys(c.env.DB, clubId)

  return c.json({
    club: { id: ctx.club.id, displayName: ctx.club.display_name },
    season: ctx.season,
    stale: ctx.stale,
    fetchedAt: ctx.fetchedAt,
    teams: ctx.teams.map((t) => {
      const division = divisionById.get(t.divisionId)
      const exists = existing.ids.has(t.id) ||
        (!!division && existing.byPhaseNumber.has(`${division.phase_id}|${t.number}`))
      return {
        id: t.id,
        // Simplified display name, consistent with existing teams ("PPA Rixheim 2").
        name: `${ctx.club.display_name} ${t.number}`,
        number: t.number, phase: t.phase,
        divisionId: t.divisionId,
        divisionName: (division?.display_name as string | undefined) ?? t.divisionName,
        divisionExists: !!division,
        poolNumber: t.poolNumber,
        exists,
        // Importable = not already there, and the division is known or can be
        // auto-imported (needs a detectable phase and an existing season).
        importable: !exists && ctx.season.exists && (!!division || t.phase !== null),
      }
    }),
  })
})

type TeamImportOverride = { id: string; gameLocationId: string; defaultDay: string; defaultTime: string }

// POST /teams/import — re-fetches from FFTT (never trusts a client list),
// auto-imports missing divisions (and their phase) via the divisions import,
// creates/reuses the FFTT pools as groups, and inserts only the requested
// teams with their own venue / day / time. Rosters stay empty: completing
// each team remains a manual step.
app.post('/teams/import', async (c) => {
  const b = await c.req.json()
  const clubId = typeof b.clubId === 'string' ? b.clubId : ''
  const requested: TeamImportOverride[] = Array.isArray(b.teams)
    ? b.teams.filter((t: unknown): t is TeamImportOverride =>
        !!t && typeof t === 'object' &&
        typeof (t as TeamImportOverride).id === 'string' &&
        typeof (t as TeamImportOverride).gameLocationId === 'string' &&
        typeof (t as TeamImportOverride).defaultDay === 'string' &&
        typeof (t as TeamImportOverride).defaultTime === 'string')
    : []
  if (!clubId || requested.length === 0) return c.json({ error: 'invalid_params' }, 400)
  const db = c.env.DB

  const addressRows = await db.prepare('SELECT id FROM club_addresses WHERE club_id = ?').bind(clubId).all()
  const validLocationIds = new Set(addressRows.results.map((a) => a.id as string))

  const ctx = await teamsImportContext(db, clubId)
  if ('error' in ctx) return c.json({ error: ctx.error }, ctx.error === 'club_not_found' ? 404 : 502)
  if (!ctx.season.exists) return c.json({ error: 'season_not_found' }, 404)

  const requestedById = new Map(requested.map((r) => [r.id, r]))
  const teamsToImport = ctx.teams.filter((t) => requestedById.has(t.id))

  // Auto-import the divisions of every (organization, phase) pair we can't
  // resolve locally — one championship import per pair (#219 logic).
  const createdPhases: ImportedPhase[] = []
  const createdDivisions: ImportedDivision[] = []
  let divisionRows = await db.prepare('SELECT id, phase_id FROM divisions').all()
  let divisionById = new Map(divisionRows.results.map((d) => [d.id as string, d]))
  const pairs = new Map<string, { org: number; ph: number }>()
  for (const t of teamsToImport) {
    if (divisionById.has(t.divisionId) || t.phase === null) continue
    pairs.set(`${t.organizationId}|${t.phase}`, { org: Number(t.organizationId), ph: t.phase })
  }
  for (const { org, ph } of pairs.values()) {
    const p = importParams(org, ctx.season.id, ph)
    if (!p) continue
    const result = await importDivisions(db, p)
    if (typeof result === 'string') continue // affected teams end up skipped below
    if (result.createdPhase) createdPhases.push(result.phase)
    createdDivisions.push(...result.created)
  }
  if (pairs.size) {
    divisionRows = await db.prepare('SELECT id, phase_id FROM divisions').all()
    divisionById = new Map(divisionRows.results.map((d) => [d.id as string, d]))
  }

  const groupRows = await db.prepare('SELECT id, division_id, number, team_ids, is_archived FROM groups_tbl').all()
  const groups = groupRows.results.map((g) => ({
    id: g.id as string, divisionId: g.division_id as string, number: g.number as number,
    teamIds: (jsonParse(g.team_ids) as string[]) ?? [], isArchived: bool(g.is_archived),
  }))
  const existing = await clubTeamKeys(db, clubId)

  const createdGroups: typeof groups = []
  const touchedGroups = new Map<string, (typeof groups)[number]>()
  const createdTeams: Array<Record<string, unknown>> = []
  const skipped: Array<{ id: string; label: string; reason: 'already_exists' | 'division_missing' | 'invalid_location' }> = []

  for (const t of teamsToImport) {
    const override = requestedById.get(t.id)!
    const division = divisionById.get(t.divisionId)
    if (!division) {
      skipped.push({ id: t.id, label: t.label, reason: 'division_missing' })
      continue
    }
    const phaseId = division.phase_id as string
    // Re-verify existence right before insert (never trust the preview's
    // snapshot — a concurrent import or manual creation may have landed since).
    if (existing.ids.has(t.id) || existing.byPhaseNumber.has(`${phaseId}|${t.number}`)) {
      skipped.push({ id: t.id, label: t.label, reason: 'already_exists' })
      continue
    }
    if (!validLocationIds.has(override.gameLocationId)) {
      skipped.push({ id: t.id, label: t.label, reason: 'invalid_location' })
      continue
    }

    // Reuse the pool when known by FFTT id or by (division, number); create it
    // otherwise, FFTT-aligned (local group id = FFTT pool id).
    let group = groups.find((g) => g.id === t.poolId) ??
      (t.poolNumber !== null
        ? groups.find((g) => g.divisionId === t.divisionId && g.number === t.poolNumber)
        : undefined)
    if (!group) {
      group = { id: t.poolId, divisionId: t.divisionId, number: t.poolNumber ?? 1, teamIds: [], isArchived: false }
      groups.push(group)
      createdGroups.push(group)
    }

    const team = {
      id: t.id, clubId, phaseId, number: t.number,
      divisionId: t.divisionId, groupId: group.id, gameLocationId: override.gameLocationId,
      defaultDay: override.defaultDay, defaultTime: override.defaultTime,
      captainId: '', playerIds: [] as string[], isArchived: false,
    }
    group.teamIds = [...group.teamIds, team.id]
    touchedGroups.set(group.id, group)
    createdTeams.push(team)
    existing.ids.add(t.id)
    existing.byPhaseNumber.add(`${phaseId}|${t.number}`)
  }

  const stmts = [
    ...createdGroups.map((g) =>
      db.prepare('INSERT INTO groups_tbl (id, division_id, number, team_ids, is_archived) VALUES (?, ?, ?, ?, 0)')
        .bind(g.id, g.divisionId, g.number, jsonStr(g.teamIds))),
    ...[...touchedGroups.values()].filter((g) => !createdGroups.includes(g)).map((g) =>
      db.prepare('UPDATE groups_tbl SET team_ids = ? WHERE id = ?').bind(jsonStr(g.teamIds), g.id)),
    ...createdTeams.map((t) =>
      db.prepare(
        `INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '[]', 0)`,
      ).bind(t.id, t.clubId, t.phaseId, t.number, t.divisionId, t.groupId, t.gameLocationId, t.defaultDay, t.defaultTime)),
  ]
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50))

  return c.json({
    createdPhases,
    createdDivisions,
    // Created + updated groups, in their final state, for client-side upsert.
    groups: [...touchedGroups.values()],
    createdTeams,
    skipped,
    stale: ctx.stale,
    fetchedAt: ctx.fetchedAt,
  })
})

// --- FFTT games import (#231) ---

// Fetch every pool of an FFTT division ("group" in their schema) with its
// matches. Returns pool-id → parsed matches, or null when FFTT is unreachable.
async function fetchFfttDivisionMatches(divisionId: number): Promise<Map<string, FfttMatch[]> | null> {
  const data = await ffttGraphql<{
    pools?: FfttEdges<{ id: string; sportMatches?: { edges?: Array<{ node?: FfttSportMatchNode }> } }>
  }>(
    `{ pools(group_id: ${divisionId}) { edges { node { id sportMatches { edges { node { id roundNumber date ` +
    `homeOpponent { team { id name clubs { edges { node { identifier name } } } } } ` +
    `awayOpponent { team { id name clubs { edges { node { identifier name } } } } } } } } } } } }`,
  )
  if (data === null) return null
  const byPool = new Map<string, FfttMatch[]>()
  for (const e of data.pools?.edges ?? []) {
    if (!e.node) continue
    byPool.set(ffttIdFromIri(e.node.id), parseSportMatches(e.node.sportMatches?.edges))
  }
  return byPool
}

type GamesGroupError = 'group_not_found' | 'fftt_unavailable' | 'pool_not_found'
interface GamesGroupContext {
  groupId: string
  error?: GamesGroupError
  group?: { id: string; divisionId: string; number: number; teamIds: string[] }
  divisionName?: string
  phaseId?: string
  matches?: FfttMatch[]
}

// Shared context for the games preview and import: for each requested group,
// its division/phase and the FFTT matches of the matching pool (local group
// id = FFTT pool id, #229). One GraphQL call per distinct division.
async function gamesImportContext(db: Env['Bindings']['DB'], groupIds: string[]): Promise<GamesGroupContext[]> {
  const groupRows = await db.prepare('SELECT id, division_id, number, team_ids FROM groups_tbl').all()
  const groupById = new Map(groupRows.results.map((g) => [g.id as string, g]))
  const divisionRows = await db.prepare('SELECT id, display_name, phase_id FROM divisions').all()
  const divisionById = new Map(divisionRows.results.map((d) => [d.id as string, d]))

  const wantedDivisions = new Set<string>()
  for (const gid of groupIds) {
    const g = groupById.get(gid)
    if (g && divisionById.has(g.division_id as string)) wantedDivisions.add(g.division_id as string)
  }
  const poolsByDivision = new Map<string, Map<string, FfttMatch[]> | null>()
  for (const divId of wantedDivisions) {
    poolsByDivision.set(divId, await fetchFfttDivisionMatches(Number(divId)))
  }

  return groupIds.map((groupId): GamesGroupContext => {
    const g = groupById.get(groupId)
    if (!g) return { groupId, error: 'group_not_found' }
    const division = divisionById.get(g.division_id as string)
    if (!division) return { groupId, error: 'group_not_found' }
    const pools = poolsByDivision.get(g.division_id as string)
    if (pools === null || pools === undefined) return { groupId, error: 'fftt_unavailable' }
    const matches = pools.get(groupId)
    if (!matches) return { groupId, error: 'pool_not_found' }
    return {
      groupId,
      group: {
        id: groupId, divisionId: g.division_id as string, number: g.number as number,
        teamIds: (jsonParse(g.team_ids) as string[]) ?? [],
      },
      divisionName: division.display_name as string,
      phaseId: division.phase_id as string,
      matches,
    }
  })
}

// Resolve an FFTT match side to a local team of the given phase: by FFTT id
// first (imported teams share ids), then by club affiliation + team number.
function makeTeamResolver(
  clubRows: Array<Record<string, unknown>>, teamRows: Array<Record<string, unknown>>,
) {
  const clubByAffiliation = new Map(clubRows.map((c) => [c.affiliation_number as string, c.id as string]))
  const teamByIdPhase = new Map(teamRows.map((t) => [`${t.id}|${t.phase_id}`, t.id as string]))
  const teamByClubNumberPhase = new Map(teamRows.map((t) => [`${t.club_id}|${t.number}|${t.phase_id}`, t.id as string]))
  const teamIds = new Set(teamRows.map((t) => t.id as string))
  return {
    clubByAffiliation,
    teamIds,
    resolve(side: FfttMatchTeam, phaseId: string): string | null {
      const byId = teamByIdPhase.get(`${side.teamId}|${phaseId}`)
      if (byId) return byId
      const clubId = side.clubIdentifier ? clubByAffiliation.get(side.clubIdentifier) : undefined
      if (clubId && side.teamNumber !== null) {
        return teamByClubNumberPhase.get(`${clubId}|${side.teamNumber}|${phaseId}`) ?? null
      }
      return null
    },
    register(teamId: string, clubId: string, number: number, phaseId: string, ffttTeamId: string) {
      teamIds.add(teamId)
      teamByIdPhase.set(`${ffttTeamId}|${phaseId}`, teamId)
      teamByClubNumberPhase.set(`${clubId}|${number}|${phaseId}`, teamId)
    },
  }
}

const parseGroupIds = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && !!x).slice(0, 100) : []

// GET /fftt/games-preview?groupIds=a,b — per group: what an import would do
// (rounds/matches found, games and opponents to create).
app.get('/fftt/games-preview', async (c) => {
  const groupIds = (c.req.query('groupIds') ?? '').split(',').filter(Boolean)
  if (groupIds.length === 0) return c.json({ error: 'invalid_params' }, 400)
  const db = c.env.DB
  const ctxs = await gamesImportContext(db, groupIds)

  const [clubRows, teamRows, mdRows, gameRows] = await Promise.all([
    db.prepare('SELECT id, affiliation_number FROM clubs').all(),
    db.prepare('SELECT id, club_id, phase_id, number FROM teams').all(),
    db.prepare('SELECT id, group_id, number FROM match_days').all(),
    db.prepare('SELECT id FROM games').all(),
  ])
  const resolver = makeTeamResolver(clubRows.results, teamRows.results)
  const matchDayKeys = new Set(mdRows.results.map((m) => `${m.group_id}|${m.number}`))
  const gameIds = new Set(gameRows.results.map((g) => g.id as string))

  const newClubIdentifiers = new Set<string>()
  const newTeamKeys = new Set<string>()
  const groups = ctxs.map((ctx) => {
    if (ctx.error || !ctx.group || !ctx.matches) {
      return { groupId: ctx.groupId, error: ctx.error ?? 'group_not_found' }
    }
    const rounds = new Set<number>()
    let newGames = 0, existingGames = 0, newMatchDays = 0
    const groupNewTeams = new Set<string>()
    const seenRounds = new Set<number>()
    for (const m of ctx.matches) {
      rounds.add(m.round)
      if (!seenRounds.has(m.round)) {
        seenRounds.add(m.round)
        if (!matchDayKeys.has(`${ctx.groupId}|${m.round}`)) newMatchDays++
      }
      if (gameIds.has(m.id)) existingGames++
      else newGames++
      for (const side of [m.home, m.away]) {
        if (resolver.resolve(side, ctx.phaseId!)) continue
        groupNewTeams.add(`${side.clubIdentifier}|${side.teamName}`)
        newTeamKeys.add(`${side.clubIdentifier}|${side.teamName}|${ctx.phaseId}`)
        if (side.clubIdentifier && !resolver.clubByAffiliation.has(side.clubIdentifier)) {
          newClubIdentifiers.add(side.clubIdentifier)
        }
      }
    }
    return {
      groupId: ctx.groupId,
      groupNumber: ctx.group.number,
      divisionName: ctx.divisionName,
      rounds: rounds.size,
      matches: ctx.matches.length,
      newMatchDays,
      newGames,
      existingGames,
      newTeams: groupNewTeams.size,
    }
  })

  return c.json({ groups, totals: { newClubs: newClubIdentifiers.size, newTeams: newTeamKeys.size } })
})

// POST /games/import — re-fetches from FFTT (never trusts a client list),
// auto-creates missing opponent clubs/teams, upserts the journées by
// (group, round) — refreshing dates on re-import — and inserts the games not
// already present (matched by FFTT match id, or same pairing on the same
// journée for manually created ones). Scores are not imported (#231); manual
// game times are never touched.
app.post('/games/import', async (c) => {
  const b = await c.req.json()
  const groupIds = parseGroupIds(b.groupIds)
  if (groupIds.length === 0) return c.json({ error: 'invalid_params' }, 400)
  const db = c.env.DB
  const ctxs = await gamesImportContext(db, groupIds)

  const [clubRows, teamRows, mdRows, gameRows] = await Promise.all([
    db.prepare('SELECT id, affiliation_number FROM clubs').all(),
    db.prepare('SELECT id, club_id, phase_id, number FROM teams').all(),
    db.prepare('SELECT id, group_id, number, date FROM match_days').all(),
    db.prepare('SELECT id, match_day_id, home_team_id, away_team_id FROM games').all(),
  ])
  const resolver = makeTeamResolver(clubRows.results, teamRows.results)
  const matchDayByKey = new Map(mdRows.results.map((m) => [`${m.group_id}|${m.number}`, m]))
  const gameIds = new Set(gameRows.results.map((g) => g.id as string))
  const pairingsByMatchDay = new Map<string, Set<string>>()
  for (const g of gameRows.results) {
    const key = g.match_day_id as string
    if (!pairingsByMatchDay.has(key)) pairingsByMatchDay.set(key, new Set())
    pairingsByMatchDay.get(key)!.add(`${g.home_team_id}|${g.away_team_id}`)
    pairingsByMatchDay.get(key)!.add(`${g.away_team_id}|${g.home_team_id}`)
  }

  const createdClubs: Array<Record<string, unknown>> = []
  const createdTeams: Array<Record<string, unknown>> = []
  const createdMatchDays: Array<Record<string, unknown>> = []
  let updatedMatchDays: Array<Record<string, unknown>> = []
  // Pre-import dates of updated journées: a round spanning several dates makes
  // the walk flip the date back and forth, and an entry that lands back on its
  // original date is a no-op, not an update.
  const originalDates = new Map<string, string>()
  const createdGames: Array<Record<string, unknown>> = []
  const touchedGroups = new Map<string, { id: string; divisionId: string; number: number; teamIds: string[]; isArchived: boolean }>()
  const skippedGroups: Array<{ groupId: string; reason: GamesGroupError }> = []
  let existingGames = 0, skippedMatches = 0

  // Auto-created club ids are FFTT-aligned on the affiliation number, which
  // doubles as the natural dedup key across groups in one import.
  const clubIdFor = (side: FfttMatchTeam): string | null => {
    if (!side.clubIdentifier) return null
    const existing = resolver.clubByAffiliation.get(side.clubIdentifier)
    if (existing) return existing
    const id = `club-fftt-${side.clubIdentifier}`
    const displayName = side.clubName || side.teamName.replace(/\s*\(?\d+\)?\s*$/, '')
    createdClubs.push({ id, affiliationNumber: side.clubIdentifier, displayName, isArchived: false, addresses: [], channels: [] })
    resolver.clubByAffiliation.set(side.clubIdentifier, id)
    return id
  }

  for (const ctx of ctxs) {
    if (ctx.error || !ctx.group || !ctx.matches || !ctx.phaseId) {
      skippedGroups.push({ groupId: ctx.groupId, reason: ctx.error ?? 'group_not_found' })
      continue
    }
    const group = touchedGroups.get(ctx.groupId) ??
      { ...ctx.group, isArchived: false, teamIds: [...ctx.group.teamIds] }

    const teamIdFor = (side: FfttMatchTeam): string | null => {
      const existing = resolver.resolve(side, ctx.phaseId!)
      if (existing) return existing
      const clubId = clubIdFor(side)
      if (!clubId || side.teamNumber === null) return null
      // FFTT team ids are stable across phases, so the id may already be a
      // team row of another phase — suffix to keep the primary key unique.
      const id = resolver.teamIds.has(side.teamId) ? `${side.teamId}-${ctx.phaseId}` : side.teamId
      createdTeams.push({
        id, clubId, phaseId: ctx.phaseId, number: side.teamNumber,
        divisionId: group.divisionId, groupId: group.id, gameLocationId: '',
        defaultDay: '', defaultTime: '', captainId: '', playerIds: [], isArchived: false,
      })
      resolver.register(id, clubId, side.teamNumber, ctx.phaseId!, side.teamId)
      if (!group.teamIds.includes(id)) group.teamIds.push(id)
      touchedGroups.set(group.id, group)
      return id
    }

    for (const m of ctx.matches) {
      const mdKey = `${ctx.groupId}|${m.round}`
      let md = matchDayByKey.get(mdKey)
      if (!md) {
        md = { id: `md-fftt-${ctx.groupId}-r${m.round}`, group_id: ctx.groupId, number: m.round, date: m.date }
        matchDayByKey.set(mdKey, md)
        createdMatchDays.push({ id: md.id, groupId: ctx.groupId, number: m.round, date: m.date })
      } else if (md.date !== m.date) {
        // FFTT can stagger one round across days; the journée keeps a single
        // date, so the last one seen wins (stable across re-imports since
        // matches are ordered by round then id).
        const created = createdMatchDays.find((x) => x.id === md!.id)
        if (created) {
          created.date = m.date
        } else {
          const updated = updatedMatchDays.find((x) => x.id === md!.id)
          if (updated) updated.date = m.date
          else {
            originalDates.set(md.id as string, md.date as string)
            updatedMatchDays.push({ id: md.id, groupId: md.group_id, number: md.number, date: m.date })
          }
        }
        md.date = m.date
      }

      if (gameIds.has(m.id)) { existingGames++; continue }
      const homeId = teamIdFor(m.home)
      const awayId = teamIdFor(m.away)
      if (!homeId || !awayId) { skippedMatches++; continue }
      // A manually created game for the same pairing on the same journée
      // counts as existing — never duplicate it.
      const pairings = pairingsByMatchDay.get(md.id as string)
      if (pairings?.has(`${homeId}|${awayId}`)) { existingGames++; continue }
      if (!pairingsByMatchDay.has(md.id as string)) pairingsByMatchDay.set(md.id as string, new Set())
      pairingsByMatchDay.get(md.id as string)!.add(`${homeId}|${awayId}`)
      pairingsByMatchDay.get(md.id as string)!.add(`${awayId}|${homeId}`)
      gameIds.add(m.id)
      createdGames.push({ id: m.id, matchDayId: md.id, homeTeamId: homeId, awayTeamId: awayId })
    }
  }

  // Journées whose date walked back to its pre-import value are no-ops.
  updatedMatchDays = updatedMatchDays.filter((m) => m.date !== originalDates.get(m.id as string))

  const stmts = [
    ...createdClubs.map((cl) =>
      db.prepare('INSERT INTO clubs (id, affiliation_number, display_name, is_archived) VALUES (?, ?, ?, 0)')
        .bind(cl.id, cl.affiliationNumber, cl.displayName)),
    ...createdTeams.map((t) =>
      db.prepare(
        `INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, '', '', '', '', '[]', 0)`,
      ).bind(t.id, t.clubId, t.phaseId, t.number, t.divisionId, t.groupId)),
    ...[...touchedGroups.values()].map((g) =>
      db.prepare('UPDATE groups_tbl SET team_ids = ? WHERE id = ?').bind(jsonStr(g.teamIds), g.id)),
    ...createdMatchDays.map((m) =>
      db.prepare('INSERT INTO match_days (id, group_id, number, date) VALUES (?, ?, ?, ?)')
        .bind(m.id, m.groupId, m.number, m.date)),
    ...updatedMatchDays.map((m) =>
      db.prepare('UPDATE match_days SET date = ? WHERE id = ?').bind(m.date, m.id)),
    ...createdGames.map((g) =>
      db.prepare('INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES (?, ?, ?, ?, NULL)')
        .bind(g.id, g.matchDayId, g.homeTeamId, g.awayTeamId)),
  ]
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50))

  return c.json({
    createdClubs,
    createdTeams,
    // Groups whose team list changed, in their final state (client-side upsert).
    groups: [...touchedGroups.values()],
    createdMatchDays,
    updatedMatchDays,
    createdGames,
    skippedGroups,
    existingGames,
    skippedMatches,
  })
})

app.delete('/seasons/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  // Find phases belonging to this season
  const phasesR = await db.prepare('SELECT id FROM phases WHERE season_id = ?').bind(id).all()
  const phaseIds = phasesR.results.map(r => r.id as string)
  for (const phaseId of phaseIds) {
    // Find divisions in phase
    const divsR = await db.prepare('SELECT id FROM divisions WHERE phase_id = ?').bind(phaseId).all()
    const divIds = divsR.results.map(r => r.id as string)
    for (const divId of divIds) {
      // Find groups in division
      const grpsR = await db.prepare('SELECT id FROM groups_tbl WHERE division_id = ?').bind(divId).all()
      const grpIds = grpsR.results.map(r => r.id as string)
      // Delete match days in these groups
      for (const gid of grpIds) {
        // Delete games + availabilities + selections for match days in this group
        const mdsR = await db.prepare('SELECT id FROM match_days WHERE group_id = ?').bind(gid).all()
        for (const md of mdsR.results) {
          const mdGames = await db.prepare('SELECT id FROM games WHERE match_day_id = ?').bind(md.id).all()
          for (const g of mdGames.results) {
            await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(g.id).run()
            await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(g.id).run()
          }
          await db.prepare('DELETE FROM games WHERE match_day_id = ?').bind(md.id).run()
        }
        await db.prepare('DELETE FROM match_days WHERE group_id = ?').bind(gid).run()
        await db.prepare('DELETE FROM groups_tbl WHERE id = ?').bind(gid).run()
      }
      // Delete teams in division
      await db.prepare('DELETE FROM teams WHERE division_id = ?').bind(divId).run()
      await db.prepare('DELETE FROM divisions WHERE id = ?').bind(divId).run()
    }
    await db.prepare('DELETE FROM phases WHERE id = ?').bind(phaseId).run()
  }
  await db.prepare('DELETE FROM seasons WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// --- Phases ---

// The active (season · phase) combination must stay coherent (#227): activating
// a phase demotes every other active phase (#221, archived when older,
// 'upcoming' when newer) AND activates the phase's season (same demotion rule
// for the previous season).
async function activatePhaseCascade(db: Env['Bindings']['DB'], phaseId: string, seasonId: string, phaseName: string) {
  await demoteActivePhases(db, phaseId, phaseOrderKey(seasonId, phaseName))
  await demoteActiveSeasons(db, seasonId)
  await db.prepare("UPDATE seasons SET status = 'active' WHERE id = ?").bind(seasonId).run()
}

app.post('/phases', async (c) => {
  const d = await c.req.json()
  const existing = await c.env.DB.prepare('SELECT id FROM phases WHERE season_id = ? AND name = ?')
    .bind(d.seasonId, d.name).first()
  if (existing) return c.json({ error: 'already_exists' }, 409)
  const status = SEASON_STATUSES.includes(d.status) ? d.status : 'upcoming'
  if (status === 'active') await activatePhaseCascade(c.env.DB, d.id, d.seasonId, d.name)
  await c.env.DB.prepare(
    'INSERT INTO phases (id, season_id, name, display_name, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(d.id, d.seasonId, d.name, d.displayName, status).run()
  return c.json({ ok: true })
})

app.patch('/phases/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('seasonId' in p) { s.push('season_id = ?'); v.push(p.seasonId) }
  if ('name' in p) { s.push('name = ?'); v.push(p.name) }
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName) }
  if ('status' in p) {
    if (!SEASON_STATUSES.includes(p.status)) return c.json({ error: 'invalid_status' }, 400)
    s.push('status = ?'); v.push(p.status)
  }
  if (s.length) {
    // Activating a phase cascades to its season (#227).
    if (p.status === 'active') {
      const row = await c.env.DB.prepare('SELECT season_id, name FROM phases WHERE id = ?').bind(id).first()
      if (row) await activatePhaseCascade(c.env.DB, id, row.season_id as string, row.name as string)
    }
    v.push(id)
    await c.env.DB.prepare(`UPDATE phases SET ${s.join(', ')} WHERE id = ?`).bind(...v).run()
  }
  return c.json({ ok: true })
})

// Delete phase (archived only) — cascades: divisions → groups → teams, match days → games → availabilities → selections
app.delete('/phases/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  // Find divisions in this phase
  const divsR = await db.prepare('SELECT id FROM divisions WHERE phase_id = ?').bind(id).all()
  const divIds = divsR.results.map(r => r.id as string)
  if (divIds.length > 0) {
    for (const divId of divIds) {
      // Find groups in this division
      const grpsR = await db.prepare('SELECT id FROM groups_tbl WHERE division_id = ?').bind(divId).all()
      const grpIds = grpsR.results.map(r => r.id as string)
      for (const grpId of grpIds) {
        // Find match days in this group → games → availabilities → selections
        const mdsR = await db.prepare('SELECT id FROM match_days WHERE group_id = ?').bind(grpId).all()
        for (const md of mdsR.results) {
          const mdId = md.id as string
          const gmsR = await db.prepare('SELECT id FROM games WHERE match_day_id = ?').bind(mdId).all()
          for (const gm of gmsR.results) {
            const gmId = gm.id as string
            await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(gmId).run()
            await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(gmId).run()
          }
          await db.prepare('DELETE FROM games WHERE match_day_id = ?').bind(mdId).run()
        }
        await db.prepare('DELETE FROM match_days WHERE group_id = ?').bind(grpId).run()
      }
      await db.prepare('DELETE FROM groups_tbl WHERE division_id = ?').bind(divId).run()
    }
    await db.prepare('DELETE FROM divisions WHERE phase_id = ?').bind(id).run()
  }
  // Delete teams in this phase (and their game references)
  const teamsR = await db.prepare('SELECT id FROM teams WHERE phase_id = ?').bind(id).all()
  for (const t of teamsR.results) {
    const tid = t.id as string
    const gamesR = await db.prepare('SELECT id FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(tid, tid).all()
    for (const gm of gamesR.results) {
      const gmId = gm.id as string
      await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(gmId).run()
      await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(gmId).run()
    }
    await db.prepare('DELETE FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(tid, tid).run()
  }
  await db.prepare('DELETE FROM teams WHERE phase_id = ?').bind(id).run()
  await db.prepare('DELETE FROM phases WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// --- Divisions ---
app.post('/divisions', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO divisions (id, phase_id, display_name, rank, players_per_game, is_archived) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(d.id, d.phaseId, d.displayName, d.rank, d.playersPerGame, d.isArchived ? 1 : 0).run()
  return c.json({ ok: true })
})

app.patch('/divisions/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('phaseId' in p) { s.push('phase_id = ?'); v.push(p.phaseId) }
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName) }
  if ('rank' in p) { s.push('rank = ?'); v.push(p.rank) }
  if ('playersPerGame' in p) { s.push('players_per_game = ?'); v.push(p.playersPerGame) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE divisions SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// Delete division (archived only) — cascades: groups → teams → match days → games → availabilities → selections
app.delete('/divisions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  // Find groups in this division
  const groupsR = await db.prepare('SELECT id FROM groups_tbl WHERE division_id = ?').bind(id).all()
  const groupIds = groupsR.results.map(r => r.id as string)
  for (const gid of groupIds) {
    // Find match days in this group
    const mdsR = await db.prepare('SELECT id FROM match_days WHERE group_id = ?').bind(gid).all()
    const mdIds = mdsR.results.map(r => r.id as string)
    for (const mdId of mdIds) {
      // Find games in this match day
      const gamesR = await db.prepare('SELECT id FROM games WHERE match_day_id = ?').bind(mdId).all()
      for (const game of gamesR.results) {
        await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(game.id).run()
        await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(game.id).run()
      }
      await db.prepare('DELETE FROM games WHERE match_day_id = ?').bind(mdId).run()
    }
    await db.prepare('DELETE FROM match_days WHERE group_id = ?').bind(gid).run()
    // Delete teams in this group
    await db.prepare('DELETE FROM teams WHERE group_id = ?').bind(gid).run()
  }
  // Delete groups
  await db.prepare('DELETE FROM groups_tbl WHERE division_id = ?').bind(id).run()
  // Delete division
  await db.prepare('DELETE FROM divisions WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

app.post('/divisions/:id/move', async (c) => {
  const id = c.req.param('id')
  const { otherId, myNewRank, otherNewRank } = await c.req.json()
  const db = c.env.DB
  await db.batch([
    db.prepare('UPDATE divisions SET rank = ? WHERE id = ?').bind(myNewRank, id),
    db.prepare('UPDATE divisions SET rank = ? WHERE id = ?').bind(otherNewRank, otherId),
  ])
  return c.json({ ok: true })
})

// --- Clubs ---
app.post('/clubs', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO clubs (id, affiliation_number, display_name, is_archived) VALUES (?, ?, ?, ?)'
  ).bind(d.id, d.affiliationNumber, d.displayName, d.isArchived ? 1 : 0).run()
  // Insert addresses
  if (d.addresses?.length) {
    const stmts = d.addresses.map((a: Record<string, unknown>) =>
      c.env.DB.prepare(
        'INSERT INTO club_addresses (id, club_id, label, street, postal_code, city, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(a.id, d.id, a.label, a.street, a.postalCode, a.city, a.isDefault ? 1 : 0)
    )
    await c.env.DB.batch(stmts)
  }
  // Insert channels
  if (d.channels?.length) {
    const stmts = d.channels.map((ch: Record<string, unknown>, i: number) =>
      c.env.DB.prepare(
        'INSERT INTO club_channels (id, club_id, type, link, display_name, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(ch.id, d.id, ch.type, ch.link, ch.displayName ?? null, (ch.sortOrder as number | undefined) ?? i)
    )
    await c.env.DB.batch(stmts)
  }
  return c.json({ ok: true })
})

app.patch('/clubs/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('affiliationNumber' in p) { s.push('affiliation_number = ?'); v.push(p.affiliationNumber) }
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE clubs SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Club Addresses ---
app.post('/clubs/:clubId/addresses', async (c) => {
  const clubId = c.req.param('clubId')
  const d = await c.req.json()
  if (d.isDefault) {
    await c.env.DB.prepare('UPDATE club_addresses SET is_default = 0 WHERE club_id = ?').bind(clubId).run()
  }
  await c.env.DB.prepare(
    'INSERT INTO club_addresses (id, club_id, label, street, postal_code, city, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(d.id, clubId, d.label, d.street, d.postalCode, d.city, d.isDefault ? 1 : 0).run()
  return c.json({ ok: true })
})

app.patch('/clubs/:clubId/addresses/:addressId', async (c) => {
  const clubId = c.req.param('clubId')
  const addressId = c.req.param('addressId')
  const p = await c.req.json()
  if (p.isDefault) {
    await c.env.DB.prepare('UPDATE club_addresses SET is_default = 0 WHERE club_id = ?').bind(clubId).run()
  }
  const s: string[] = [], v: unknown[] = []
  if ('label' in p) { s.push('label = ?'); v.push(p.label) }
  if ('street' in p) { s.push('street = ?'); v.push(p.street) }
  if ('postalCode' in p) { s.push('postal_code = ?'); v.push(p.postalCode) }
  if ('city' in p) { s.push('city = ?'); v.push(p.city) }
  if ('isDefault' in p) { s.push('is_default = ?'); v.push(p.isDefault ? 1 : 0) }
  if (s.length) { v.push(addressId); await c.env.DB.prepare(`UPDATE club_addresses SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

app.delete('/clubs/:clubId/addresses/:addressId', async (c) => {
  const clubId = c.req.param('clubId')
  const addressId = c.req.param('addressId')
  const row = await c.env.DB.prepare('SELECT is_default FROM club_addresses WHERE id = ?').bind(addressId).first()
  await c.env.DB.prepare('DELETE FROM club_addresses WHERE id = ?').bind(addressId).run()
  if (row && bool(row.is_default)) {
    await c.env.DB.prepare(
      'UPDATE club_addresses SET is_default = 1 WHERE club_id = ? AND id != ? LIMIT 1'
    ).bind(clubId, addressId).run()
  }
  return c.json({ ok: true })
})

// --- Club Communication Channels (#135) ---
app.post('/clubs/:clubId/channels', async (c) => {
  const clubId = c.req.param('clubId')
  const d = await c.req.json()
  // New channels go to the end of the list.
  const row = await c.env.DB
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM club_channels WHERE club_id = ?')
    .bind(clubId).first() as { m: number } | null
  const sortOrder = (row?.m ?? -1) + 1
  await c.env.DB.prepare(
    'INSERT INTO club_channels (id, club_id, type, link, display_name, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(d.id, clubId, d.type, d.link, d.displayName ?? null, sortOrder).run()
  return c.json({ ok: true, sortOrder })
})

app.patch('/clubs/:clubId/channels/:channelId', async (c) => {
  const channelId = c.req.param('channelId')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('type' in p) { s.push('type = ?'); v.push(p.type) }
  if ('link' in p) { s.push('link = ?'); v.push(p.link) }
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName || null) }
  if ('sortOrder' in p) { s.push('sort_order = ?'); v.push(p.sortOrder) }
  if (s.length) { v.push(channelId); await c.env.DB.prepare(`UPDATE club_channels SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

app.delete('/clubs/:clubId/channels/:channelId', async (c) => {
  const channelId = c.req.param('channelId')
  await c.env.DB.prepare('DELETE FROM club_channels WHERE id = ?').bind(channelId).run()
  return c.json({ ok: true })
})

// Reorder: body { ids: string[] } — sort_order becomes each id's index.
app.put('/clubs/:clubId/channels/reorder', async (c) => {
  const clubId = c.req.param('clubId')
  const { ids } = await c.req.json() as { ids?: string[] }
  if (ids?.length) {
    const stmts = ids.map((id, i) =>
      c.env.DB.prepare('UPDATE club_channels SET sort_order = ? WHERE id = ? AND club_id = ?').bind(i, id, clubId)
    )
    await c.env.DB.batch(stmts)
  }
  return c.json({ ok: true })
})

// --- Club logos (#135) ---
// Mirrors player avatars: stored base64 in D1, served here so the bulk /api/data
// payload stays light (it only carries logoUpdatedAt for cache-busting).
app.get('/clubs/:id/logo', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB
    .prepare('SELECT data, content_type, updated_at FROM club_logos WHERE club_id = ?')
    .bind(id)
    .first() as { data: string; content_type: string; updated_at: string } | null
  if (!row) return c.json({ error: 'not_found' }, 404)
  const bytes = Uint8Array.from(atob(row.data), (ch) => ch.charCodeAt(0))
  return new Response(bytes, {
    headers: {
      'Content-Type': row.content_type,
      // The client appends ?v=<updatedAt>, so each version has a unique URL.
      'Cache-Control': 'private, max-age=31536000, immutable',
      ETag: `"${row.updated_at}"`,
    },
  })
})

app.put('/clubs/:id/logo', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as { data?: string; contentType?: string }
  if (!body.data) return c.json({ error: 'missing data' }, 400)
  const updatedAt = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO club_logos (club_id, data, content_type, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(club_id) DO UPDATE SET
       data = excluded.data, content_type = excluded.content_type, updated_at = excluded.updated_at`
  ).bind(id, body.data, body.contentType ?? 'image/png', updatedAt).run()
  return c.json({ ok: true, logoUpdatedAt: updatedAt })
})

app.delete('/clubs/:id/logo', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM club_logos WHERE club_id = ?').bind(id).run()
  return c.json({ ok: true })
})

// --- Groups ---
app.post('/groups', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO groups_tbl (id, division_id, number, team_ids, is_archived) VALUES (?, ?, ?, ?, ?)'
  ).bind(d.id, d.divisionId, d.number, jsonStr(d.teamIds ?? []), d.isArchived ? 1 : 0).run()
  return c.json({ ok: true })
})

app.patch('/groups/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('divisionId' in p) { s.push('division_id = ?'); v.push(p.divisionId) }
  if ('number' in p) { s.push('number = ?'); v.push(p.number) }
  if ('teamIds' in p) { s.push('team_ids = ?'); v.push(jsonStr(p.teamIds)) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE groups_tbl SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// Delete group (archived only) — cascades: teams, match days → games → availabilities → selections
app.delete('/groups/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  // Delete teams in this group (and their game cascades)
  const teamsR = await db.prepare('SELECT id FROM teams WHERE group_id = ?').bind(id).all()
  for (const t of teamsR.results) {
    const tid = t.id as string
    const gamesR = await db.prepare('SELECT id FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(tid, tid).all()
    for (const g of gamesR.results) {
      await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(g.id).run()
      await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(g.id).run()
    }
    await db.prepare('DELETE FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(tid, tid).run()
  }
  await db.prepare('DELETE FROM teams WHERE group_id = ?').bind(id).run()
  // Delete match days in this group and their games/availabilities/selections
  const matchDaysR = await db.prepare('SELECT id FROM match_days WHERE group_id = ?').bind(id).all()
  for (const md of matchDaysR.results) {
    const mdGamesR = await db.prepare('SELECT id FROM games WHERE match_day_id = ?').bind(md.id).all()
    for (const g of mdGamesR.results) {
      await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(g.id).run()
      await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(g.id).run()
    }
    await db.prepare('DELETE FROM games WHERE match_day_id = ?').bind(md.id).run()
  }
  await db.prepare('DELETE FROM match_days WHERE group_id = ?').bind(id).run()
  await db.prepare('DELETE FROM groups_tbl WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// --- Players ---
// Players are users with is_player = 1 (see #105). These routes manage that row.
app.post('/players', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, role, is_player, first_name, last_name, license_number, phone, birth_date, birth_place, status, club_id)
     VALUES (?, ?, 'player', 1, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(d.id, d.email, d.firstName, d.lastName, d.licenseNumber, d.phone ?? '', d.birthDate ?? null, d.birthPlace ?? null, d.status, d.clubId).run()
  return c.json({ ok: true })
})

app.patch('/players/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('firstName' in p) { s.push('first_name = ?'); v.push(p.firstName) }
  if ('lastName' in p) { s.push('last_name = ?'); v.push(p.lastName) }
  if ('licenseNumber' in p) { s.push('license_number = ?'); v.push(p.licenseNumber) }
  if ('email' in p) { s.push('email = ?'); v.push(p.email) }
  if ('phone' in p) { s.push('phone = ?'); v.push(p.phone) }
  if ('birthDate' in p) { s.push('birth_date = ?'); v.push(p.birthDate ?? null) }
  if ('birthPlace' in p) { s.push('birth_place = ?'); v.push(p.birthPlace ?? null) }
  if ('status' in p) { s.push('status = ?'); v.push(p.status) }
  if ('clubId' in p) { s.push('club_id = ?'); v.push(p.clubId) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE users SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Player avatars (#124) ---
// Images are stored base64 in D1 and served here so the bulk /api/data payload
// stays light (it only carries avatarUpdatedAt for cache-busting).
app.get('/players/:id/avatar', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB
    .prepare('SELECT data, content_type, updated_at FROM player_avatars WHERE user_id = ?')
    .bind(id)
    .first() as { data: string; content_type: string; updated_at: string } | null
  if (!row) return c.json({ error: 'not_found' }, 404)
  const bytes = Uint8Array.from(atob(row.data), (ch) => ch.charCodeAt(0))
  return new Response(bytes, {
    headers: {
      'Content-Type': row.content_type,
      // The client appends ?v=<updatedAt>, so each version has a unique URL and
      // can be cached aggressively.
      'Cache-Control': 'private, max-age=31536000, immutable',
      ETag: `"${row.updated_at}"`,
    },
  })
})

app.put('/players/:id/avatar', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as { data?: string; contentType?: string }
  if (!body.data) return c.json({ error: 'missing data' }, 400)
  const updatedAt = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO player_avatars (user_id, data, content_type, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       data = excluded.data, content_type = excluded.content_type, updated_at = excluded.updated_at`
  ).bind(id, body.data, body.contentType ?? 'image/jpeg', updatedAt).run()
  return c.json({ ok: true, avatarUpdatedAt: updatedAt })
})

app.delete('/players/:id/avatar', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM player_avatars WHERE user_id = ?').bind(id).run()
  return c.json({ ok: true })
})

// --- Teams ---
app.post('/teams', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link, is_archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    d.id, d.clubId, d.phaseId, d.number, d.divisionId, d.groupId,
    d.gameLocationId, d.defaultDay, d.defaultTime, d.captainId ?? '',
    jsonStr(d.playerIds ?? []), d.rosterInitialPoints ? jsonStr(d.rosterInitialPoints) : null,
    d.color ?? null, d.whatsappLink ?? null, d.isArchived ? 1 : 0,
  ).run()
  return c.json({ ok: true })
})

app.patch('/teams/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('clubId' in p) { s.push('club_id = ?'); v.push(p.clubId) }
  if ('phaseId' in p) { s.push('phase_id = ?'); v.push(p.phaseId) }
  if ('number' in p) { s.push('number = ?'); v.push(p.number) }
  if ('divisionId' in p) { s.push('division_id = ?'); v.push(p.divisionId) }
  if ('groupId' in p) { s.push('group_id = ?'); v.push(p.groupId) }
  if ('gameLocationId' in p) { s.push('game_location_id = ?'); v.push(p.gameLocationId) }
  if ('defaultDay' in p) { s.push('default_day = ?'); v.push(p.defaultDay) }
  if ('defaultTime' in p) { s.push('default_time = ?'); v.push(p.defaultTime) }
  if ('captainId' in p) { s.push('captain_id = ?'); v.push(p.captainId) }
  if ('playerIds' in p) { s.push('player_ids = ?'); v.push(jsonStr(p.playerIds)) }
  if ('rosterInitialPoints' in p) { s.push('roster_initial_points = ?'); v.push(p.rosterInitialPoints ? jsonStr(p.rosterInitialPoints) : null) }
  if ('color' in p) { s.push('color = ?'); v.push(p.color ?? null) }
  if ('whatsappLink' in p) { s.push('whatsapp_link = ?'); v.push(p.whatsappLink ?? null) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE teams SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// Delete team (archived only) — removes from group teamIds, cascades availabilities/selections
app.delete('/teams/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  // Remove team from group's team_ids
  const groupsR = await db.prepare('SELECT id, team_ids FROM groups_tbl').all()
  for (const g of groupsR.results) {
    const teamIds: string[] = jsonParse(g.team_ids) as string[]
    if (teamIds.includes(id)) {
      await db.prepare('UPDATE groups_tbl SET team_ids = ? WHERE id = ?')
        .bind(jsonStr(teamIds.filter(t => t !== id)), g.id).run()
    }
  }
  // Delete related game availabilities and selections for games involving this team
  const gamesR = await db.prepare('SELECT id FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(id, id).all()
  const gameIds = gamesR.results.map(r => r.id as string)
  if (gameIds.length > 0) {
    for (const gid of gameIds) {
      await db.prepare('DELETE FROM game_availabilities WHERE game_id = ?').bind(gid).run()
      await db.prepare('DELETE FROM game_selections WHERE game_id = ?').bind(gid).run()
    }
    await db.prepare('DELETE FROM games WHERE home_team_id = ? OR away_team_id = ?').bind(id, id).run()
  }
  await db.prepare('DELETE FROM teams WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// Batch update teams (used for player conflict resolution)
app.post('/teams/batch', async (c) => {
  const { updates } = await c.req.json()
  if (!updates?.length) return c.json({ ok: true })
  const stmts = updates.map((u: { id: string; playerIds: string[]; rosterInitialPoints?: Record<string, string> }) =>
    c.env.DB.prepare('UPDATE teams SET player_ids = ?, roster_initial_points = ? WHERE id = ?')
      .bind(jsonStr(u.playerIds), u.rosterInitialPoints ? jsonStr(u.rosterInitialPoints) : null, u.id)
  )
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

// --- Match Days ---
app.post('/match-days', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO match_days (id, group_id, number, date) VALUES (?, ?, ?, ?)'
  ).bind(d.id, d.groupId, d.number, d.date).run()
  return c.json({ ok: true })
})

app.patch('/match-days/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('groupId' in p) { s.push('group_id = ?'); v.push(p.groupId) }
  if ('number' in p) { s.push('number = ?'); v.push(p.number) }
  if ('date' in p) { s.push('date = ?'); v.push(p.date) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE match_days SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Games ---
app.post('/games', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES (?, ?, ?, ?, ?)'
  ).bind(d.id, d.matchDayId, d.homeTeamId, d.awayTeamId, d.time ?? null).run()
  return c.json({ ok: true })
})

app.patch('/games/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('matchDayId' in p) { s.push('match_day_id = ?'); v.push(p.matchDayId) }
  if ('homeTeamId' in p) { s.push('home_team_id = ?'); v.push(p.homeTeamId) }
  if ('awayTeamId' in p) { s.push('away_team_id = ?'); v.push(p.awayTeamId) }
  if ('time' in p) { s.push('time = ?'); v.push(p.time ?? null) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE games SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Game Availabilities ---
app.post('/game-availabilities/set', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO game_availabilities (id, game_id, player_id, status, overridden_by) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, overridden_by = excluded.overridden_by`
  ).bind(d.id, d.gameId, d.playerId, d.status, d.overriddenBy ?? null).run()
  return c.json({ ok: true })
})

app.post('/game-availabilities/clear', async (c) => {
  const { gameId, playerId } = await c.req.json()
  await c.env.DB.prepare(
    'DELETE FROM game_availabilities WHERE game_id = ? AND player_id = ?'
  ).bind(gameId, playerId).run()
  return c.json({ ok: true })
})

// --- Game Selections ---
app.post('/game-selections/set', async (c) => {
  const d = await c.req.json()
  if (!d.playerIds?.length) {
    await c.env.DB.prepare('DELETE FROM game_selections WHERE game_id = ? AND team_id = ?')
      .bind(d.gameId, d.teamId).run()
  } else {
    const existing = await c.env.DB.prepare('SELECT id FROM game_selections WHERE game_id = ? AND team_id = ?')
      .bind(d.gameId, d.teamId).first()
    if (existing) {
      await c.env.DB.prepare('UPDATE game_selections SET player_ids = ? WHERE id = ?')
        .bind(jsonStr(d.playerIds), existing.id).run()
    } else {
      await c.env.DB.prepare('INSERT INTO game_selections (id, game_id, team_id, player_ids) VALUES (?, ?, ?, ?)')
        .bind(d.id, d.gameId, d.teamId, jsonStr(d.playerIds)).run()
    }
  }
  return c.json({ ok: true })
})

app.post('/game-selections/batch', async (c) => {
  const { updates } = await c.req.json()
  for (const d of updates) {
    if (!d.playerIds?.length) {
      await c.env.DB.prepare('DELETE FROM game_selections WHERE game_id = ? AND team_id = ?')
        .bind(d.gameId, d.teamId).run()
    } else {
      const existing = await c.env.DB.prepare('SELECT id FROM game_selections WHERE game_id = ? AND team_id = ?')
        .bind(d.gameId, d.teamId).first()
      if (existing) {
        await c.env.DB.prepare('UPDATE game_selections SET player_ids = ? WHERE id = ?')
          .bind(jsonStr(d.playerIds), existing.id).run()
      } else {
        await c.env.DB.prepare('INSERT INTO game_selections (id, game_id, team_id, player_ids) VALUES (?, ?, ?, ?)')
          .bind(d.id, d.gameId, d.teamId, jsonStr(d.playerIds)).run()
      }
    }
  }
  return c.json({ ok: true })
})

export const onRequest = handle(app)
