-- #236: FFTT-aligned division hierarchy (e.g. "Régionale 1" is the parent of
-- its "Régionale 2" pools). NULL for divisions with no parent, including
-- every division imported before this migration — no retroactive backfill,
-- see #236.
ALTER TABLE divisions ADD COLUMN parent_id TEXT;
