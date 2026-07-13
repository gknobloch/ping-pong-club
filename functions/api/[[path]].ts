import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { authApp, bearer, userFromToken, type Env } from './auth'
import { seasonIdFromFftt, seasonIdFromName, seasonNameFromFftt } from '../../src/lib/season'
import { ffttIdFromIri, orderDivisions, playersPerGameFor, type FfttDivision } from '../../src/lib/ffttDivisions'

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
      isArchived: bool(r.is_archived), isActive: bool(r.is_active),
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

// FFTT GraphQL API — source of truth for season ids and names (#217).
const FFTT_GRAPHQL_URL = 'https://apiv2.fftt.com/api/graphql'

// Run a GraphQL query against the FFTT API; null when unreachable/invalid.
async function ffttGraphql<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(FFTT_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return null
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
  await db.batch([
    db.prepare("UPDATE seasons SET status = 'archived' WHERE status = 'active'"),
    db.prepare("INSERT INTO seasons (id, display_name, status) VALUES (?, ?, 'active')")
      .bind(fftt.id, fftt.displayName),
  ])
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
  if (status === 'active') {
    await c.env.DB.prepare("UPDATE seasons SET status = 'archived' WHERE status = 'active'").run()
  }
  await c.env.DB.prepare('INSERT INTO seasons (id, display_name, status) VALUES (?, ?, ?)')
    .bind(id, displayName, status).run()
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
    // Single-active invariant: activating a season archives the previous one.
    if (p.status === 'active') {
      await c.env.DB.prepare("UPDATE seasons SET status = 'archived' WHERE status = 'active' AND id != ?").bind(id).run()
    }
    v.push(id)
    await c.env.DB.prepare(`UPDATE seasons SET ${s.join(', ')} WHERE id = ?`).bind(...v).run()
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
  if (!Number.isInteger(org) || org <= 0 || !Number.isInteger(season) || season <= 0 || (ph !== 1 && ph !== 2)) return null
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

// POST /divisions/import — re-fetches from FFTT (never trusts a client list),
// creates the phase if missing (inactive), inserts the divisions not already
// present, ranked after any existing ones.
app.post('/divisions/import', async (c) => {
  const b = await c.req.json()
  const p = importParams(b.organizationId, b.seasonId, b.phase)
  if (!p) return c.json({ error: 'invalid_params' }, 400)
  const db = c.env.DB
  const season = await db.prepare('SELECT id, display_name FROM seasons WHERE id = ?').bind(String(p.season)).first()
  if (!season) return c.json({ error: 'season_not_found' }, 404)
  const result = await fetchFfttDivisions(p.org, p.season, p.ph)
  if (!result) return c.json({ error: 'fftt_unavailable' }, 502)
  if (!result.contest || result.divisions.length === 0) return c.json({ error: 'no_divisions' }, 404)

  const phaseName = `Phase ${p.ph}`
  let phaseRow = await db.prepare(
    'SELECT id, season_id, name, display_name, is_archived, is_active FROM phases WHERE season_id = ? AND name = ?',
  ).bind(String(p.season), phaseName).first()
  const createdPhase = !phaseRow
  if (!phaseRow) {
    const displayName = `${season.display_name} ${phaseName}`
    const id = `phase-${p.season}-${p.ph}`
    // Created inactive on purpose: activation stays a manual step on /phases.
    await db.prepare('INSERT INTO phases (id, season_id, name, display_name, is_archived, is_active) VALUES (?, ?, ?, ?, 0, 0)')
      .bind(id, String(p.season), phaseName, displayName).run()
    phaseRow = { id, season_id: String(p.season), name: phaseName, display_name: displayName, is_archived: 0, is_active: 0 }
  }
  const phaseId = phaseRow.id as string

  const existing = await phaseDivisions(db, phaseId)
  let rank = existing.maxRank
  const created: Array<{ id: string; phaseId: string; displayName: string; rank: number; playersPerGame: number; isArchived: boolean }> = []
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
  return c.json({
    phase: {
      id: phaseId, seasonId: phaseRow.season_id, name: phaseRow.name,
      displayName: phaseRow.display_name,
      isArchived: bool(phaseRow.is_archived), isActive: bool(phaseRow.is_active),
    },
    createdPhase,
    created,
    skipped,
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
app.post('/phases', async (c) => {
  const d = await c.req.json()
  // Single-active invariant (#221): activating a phase deactivates the others.
  if (d.isActive) await c.env.DB.prepare('UPDATE phases SET is_active = 0 WHERE is_active = 1').run()
  await c.env.DB.prepare(
    'INSERT INTO phases (id, season_id, name, display_name, is_archived, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(d.id, d.seasonId, d.name, d.displayName, d.isArchived ? 1 : 0, d.isActive ? 1 : 0).run()
  return c.json({ ok: true })
})

app.patch('/phases/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('seasonId' in p) { s.push('season_id = ?'); v.push(p.seasonId) }
  if ('name' in p) { s.push('name = ?'); v.push(p.name) }
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if ('isActive' in p) { s.push('is_active = ?'); v.push(p.isActive ? 1 : 0) }
  if (s.length) {
    // Single-active invariant (#221): the previous active phase is only
    // deactivated, not archived — it stays relevant (brûlage, history).
    if (p.isActive) {
      await c.env.DB.prepare('UPDATE phases SET is_active = 0 WHERE is_active = 1 AND id != ?').bind(id).run()
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
