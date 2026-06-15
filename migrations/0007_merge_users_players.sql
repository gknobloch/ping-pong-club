-- Merge `users` + `players` into a single `users` table (issue #105).
--
-- A person is a user; "player" is a flag (is_player). The merged row keeps the
-- PLAYER's id, so teams.player_ids / teams.captain_id / game_availabilities /
-- game_selections keep referencing valid ids with no changes.
--
-- Dropped: users.player_id, users.club_ids (-> single club_id),
-- users.captain_team_ids (captaincy is derived from teams.captain_id),
-- players.points, and the 'captain' role (-> 'player').
--
-- Re-run safety: the deploy applies every migration on each push. The FIRST
-- statement references `players`, so on a second run (after players is dropped)
-- it errors immediately and aborts before touching `users` — leaving the
-- already-migrated schema intact.

ALTER TABLE players RENAME TO players_old;
ALTER TABLE users RENAME TO users_old;

CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL DEFAULT 'player',   -- general_admin | club_admin | player
  is_player      INTEGER NOT NULL DEFAULT 1,
  first_name     TEXT,
  last_name      TEXT,
  license_number TEXT,
  phone          TEXT NOT NULL DEFAULT '',
  birth_date     TEXT,
  birth_place    TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  club_id        TEXT
);

-- Players become users (is_player = 1). When an old users row links to the
-- player, its auth email/role win (email '©' typo repaired); else the player's.
-- email must be UNIQUE, but real data has empty/duplicate player emails — those
-- get a stable per-id placeholder (they were never usable logins anyway). A
-- player with a unique real email keeps it.
INSERT INTO users
  (id, email, role, is_player, first_name, last_name, license_number, phone, birth_date, birth_place, status, club_id)
SELECT
  id,
  CASE WHEN raw_email = '' OR cnt > 1 THEN 'noemail-' || id || '@ppclub.invalid' ELSE raw_email END,
  role, 1, first_name, last_name, license_number, phone, birth_date, birth_place, status, club_id
FROM (
  SELECT m.*, COUNT(*) OVER (PARTITION BY raw_email) AS cnt
  FROM (
    SELECT
      p.id AS id,
      REPLACE(COALESCE(NULLIF(u.email, ''), NULLIF(p.email, ''), ''), '©', '@') AS raw_email,
      CASE WHEN u.role IS NULL OR u.role = 'captain' THEN 'player' ELSE u.role END AS role,
      p.first_name, p.last_name, p.license_number, p.phone, p.birth_date, p.birth_place, p.status,
      NULLIF(p.club_id, '') AS club_id
    FROM players_old p
    LEFT JOIN users_old u ON u.player_id = p.id
  ) m
);

-- Admin-only users (no linked player) become non-player users.
INSERT INTO users (id, email, role, is_player, club_id)
SELECT
  u.id,
  REPLACE(u.email, '©', '@'),
  CASE WHEN u.role = 'captain' THEN 'player' ELSE u.role END,
  0,
  CASE WHEN u.club_ids IS NOT NULL AND u.club_ids != '[]' THEN json_extract(u.club_ids, '$[0]') END
FROM users_old u
WHERE (u.player_id IS NULL OR u.player_id = '')
  AND NOT EXISTS (SELECT 1 FROM users n WHERE n.id = u.id);

DROP TABLE users_old;
DROP TABLE players_old;

-- Player-user ids changed from the old users.id, so existing sessions / OAuth
-- links no longer resolve — clear them (OTP codes too). Everyone re-logs in.
DELETE FROM sessions;
DELETE FROM auth_identities;
DELETE FROM auth_otp;
