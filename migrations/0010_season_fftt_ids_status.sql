-- #217: align seasons with the FFTT API.
-- 1. Season ids become the FFTT numeric id as text: endYear - 2000
--    (e.g. 'season-1' / 2025/2026 → '26').
-- 2. is_archived + is_active are replaced by a single status column
--    ('active' | 'upcoming' | 'archived'), at most one 'active'.
-- 3. Garbage seasons whose name doesn't match YYYY/YYYY are dropped
--    (they were created via the previously unvalidated manual form and
--    have no phases attached).

-- Deploys re-run every migration (tolerating failures); drop the scratch
-- table a previously interrupted re-run may have left behind.
DROP TABLE IF EXISTS seasons_new;

-- Remap phases.season_id first, while the old season ids are still in place.
UPDATE phases SET season_id = (
  SELECT CAST(CAST(substr(s.display_name, 6, 4) AS INTEGER) - 2000 AS TEXT)
  FROM seasons s WHERE s.id = phases.season_id
)
WHERE season_id IN (
  SELECT id FROM seasons
  WHERE display_name GLOB '[0-9][0-9][0-9][0-9]/[0-9][0-9][0-9][0-9]'
);

-- Rebuild the seasons table with FFTT ids and the single status column.
CREATE TABLE seasons_new (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'archived'))
);

INSERT INTO seasons_new (id, display_name, status)
SELECT
  CAST(CAST(substr(display_name, 6, 4) AS INTEGER) - 2000 AS TEXT),
  display_name,
  CASE
    WHEN is_active = 1 THEN 'active'
    WHEN is_archived = 1 THEN 'archived'
    ELSE 'upcoming'
  END
FROM seasons
WHERE display_name GLOB '[0-9][0-9][0-9][0-9]/[0-9][0-9][0-9][0-9]';

DROP TABLE seasons;
ALTER TABLE seasons_new RENAME TO seasons;
