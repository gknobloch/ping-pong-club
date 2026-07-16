-- #229 follow-up: cache the last successful FFTT lookups used by the teams
-- import so a transient/rate-limited failure from the FFTT GraphQL API or the
-- dafunker club-teams proxy can fall back to recent data instead of a hard
-- 502. Single-row cache for the current season; one row per club for teams.
CREATE TABLE IF NOT EXISTS fftt_season_cache (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fftt_club_teams_cache (
  club_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
