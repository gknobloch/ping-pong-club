-- #227: phases move to the same 3-state lifecycle as seasons —
-- is_archived + is_active are replaced by a single status column
-- ('active' | 'upcoming' | 'archived'), at most one 'active'.

-- Deploys re-run every migration (tolerating failures); drop the scratch
-- table a previously interrupted re-run may have left behind.
DROP TABLE IF EXISTS phases_new;

CREATE TABLE phases_new (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'archived'))
);

INSERT INTO phases_new (id, season_id, name, display_name, status)
SELECT
  id, season_id, name, display_name,
  CASE
    WHEN is_active = 1 THEN 'active'
    WHEN is_archived = 1 THEN 'archived'
    ELSE 'upcoming'
  END
FROM phases;

DROP TABLE phases;
ALTER TABLE phases_new RENAME TO phases;
