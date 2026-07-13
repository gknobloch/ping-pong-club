-- #219: local cache of FFTT organizations (federation, zones, leagues,
-- committees). Populated on demand via POST /api/fftt/organizations/refresh so
-- the divisions-import dropdown never hits the FFTT API on page load.
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  name TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
