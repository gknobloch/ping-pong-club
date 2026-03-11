import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Env = { Bindings: { DB: D1Database } }

const app = new Hono<Env>().basePath('/api')

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
    seasonsR, phasesR, divisionsR, clubsR, addressesR,
    groupsR, playersR, teamsR, matchDaysR, gamesR,
    availsR, selectionsR, usersR,
  ] = await Promise.all([
    db.prepare('SELECT * FROM seasons').all(),
    db.prepare('SELECT * FROM phases').all(),
    db.prepare('SELECT * FROM divisions').all(),
    db.prepare('SELECT * FROM clubs').all(),
    db.prepare('SELECT * FROM club_addresses').all(),
    db.prepare('SELECT * FROM groups_tbl').all(),
    db.prepare('SELECT * FROM players').all(),
    db.prepare('SELECT * FROM teams').all(),
    db.prepare('SELECT * FROM match_days').all(),
    db.prepare('SELECT * FROM games').all(),
    db.prepare('SELECT * FROM game_availabilities').all(),
    db.prepare('SELECT * FROM game_selections').all(),
    db.prepare('SELECT * FROM users').all(),
  ])

  const addrByClub = new Map<string, unknown[]>()
  for (const a of addressesR.results) {
    const cid = a.club_id as string
    if (!addrByClub.has(cid)) addrByClub.set(cid, [])
    addrByClub.get(cid)!.push({
      id: a.id, label: a.label, street: a.street,
      postalCode: a.postal_code, city: a.city, isDefault: bool(a.is_default),
    })
  }

  return c.json({
    seasons: seasonsR.results.map(r => ({
      id: r.id, displayName: r.display_name,
      isArchived: bool(r.is_archived), isActive: bool(r.is_active),
    })),
    phases: phasesR.results.map(r => ({
      id: r.id, seasonId: r.season_id, name: r.name, displayName: r.display_name,
      isArchived: bool(r.is_archived), isActive: bool(r.is_active),
    })),
    divisions: divisionsR.results.map(r => ({
      id: r.id, phaseId: r.phase_id, displayName: r.display_name,
      rank: r.rank, playersPerGame: r.players_per_game,
    })),
    clubs: clubsR.results.map(r => ({
      id: r.id, affiliationNumber: r.affiliation_number, displayName: r.display_name,
      isArchived: bool(r.is_archived),
      addresses: addrByClub.get(r.id as string) ?? [],
    })),
    groups: groupsR.results.map(r => ({
      id: r.id, divisionId: r.division_id, number: r.number, teamIds: jsonParse(r.team_ids),
    })),
    players: playersR.results.map(r => ({
      id: r.id, firstName: r.first_name, lastName: r.last_name,
      licenseNumber: r.license_number, email: r.email, phone: r.phone,
      ...(r.birth_date ? { birthDate: r.birth_date } : {}),
      ...(r.birth_place ? { birthPlace: r.birth_place } : {}),
      status: r.status, clubId: r.club_id,
      ...(r.points ? { points: r.points } : {}),
    })),
    teams: teamsR.results.map(r => ({
      id: r.id, clubId: r.club_id, phaseId: r.phase_id, number: r.number,
      divisionId: r.division_id, groupId: r.group_id, gameLocationId: r.game_location_id,
      defaultDay: r.default_day, defaultTime: r.default_time, captainId: r.captain_id,
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
      id: r.id, email: r.email, role: r.role,
      ...(r.player_id ? { playerId: r.player_id } : {}),
      clubIds: jsonParse(r.club_ids), captainTeamIds: jsonParse(r.captain_team_ids),
    })),
  })
})

// --- Seasons ---
app.post('/seasons', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO seasons (id, display_name, is_archived, is_active) VALUES (?, ?, ?, ?)'
  ).bind(d.id, d.displayName, d.isArchived ? 1 : 0, d.isActive ? 1 : 0).run()
  return c.json({ ok: true })
})

app.patch('/seasons/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('displayName' in p) { s.push('display_name = ?'); v.push(p.displayName) }
  if ('isArchived' in p) { s.push('is_archived = ?'); v.push(p.isArchived ? 1 : 0) }
  if ('isActive' in p) { s.push('is_active = ?'); v.push(p.isActive ? 1 : 0) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE seasons SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Phases ---
app.post('/phases', async (c) => {
  const d = await c.req.json()
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
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE phases SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Divisions ---
app.post('/divisions', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO divisions (id, phase_id, display_name, rank, players_per_game) VALUES (?, ?, ?, ?, ?)'
  ).bind(d.id, d.phaseId, d.displayName, d.rank, d.playersPerGame).run()
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
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE divisions SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
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

// --- Groups ---
app.post('/groups', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO groups_tbl (id, division_id, number, team_ids) VALUES (?, ?, ?, ?)'
  ).bind(d.id, d.divisionId, d.number, jsonStr(d.teamIds ?? [])).run()
  return c.json({ ok: true })
})

app.patch('/groups/:id', async (c) => {
  const id = c.req.param('id')
  const p = await c.req.json()
  const s: string[] = [], v: unknown[] = []
  if ('divisionId' in p) { s.push('division_id = ?'); v.push(p.divisionId) }
  if ('number' in p) { s.push('number = ?'); v.push(p.number) }
  if ('teamIds' in p) { s.push('team_ids = ?'); v.push(jsonStr(p.teamIds)) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE groups_tbl SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Players ---
app.post('/players', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO players (id, first_name, last_name, license_number, email, phone, birth_date, birth_place, status, club_id, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(d.id, d.firstName, d.lastName, d.licenseNumber, d.email, d.phone ?? '', d.birthDate ?? null, d.birthPlace ?? null, d.status, d.clubId, d.points ?? null).run()
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
  if ('points' in p) { s.push('points = ?'); v.push(p.points ?? null) }
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE players SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
  return c.json({ ok: true })
})

// --- Teams ---
app.post('/teams', async (c) => {
  const d = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    d.id, d.clubId, d.phaseId, d.number, d.divisionId, d.groupId,
    d.gameLocationId, d.defaultDay, d.defaultTime, d.captainId ?? '',
    jsonStr(d.playerIds ?? []), d.rosterInitialPoints ? jsonStr(d.rosterInitialPoints) : null,
    d.color ?? null, d.whatsappLink ?? null,
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
  if (s.length) { v.push(id); await c.env.DB.prepare(`UPDATE teams SET ${s.join(', ')} WHERE id = ?`).bind(...v).run() }
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
