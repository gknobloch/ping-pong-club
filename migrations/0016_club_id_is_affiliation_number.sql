-- clubs.id becomes the FFTT affiliation number when one is known, so a club
-- can never end up duplicated under two different ids again (the PRIMARY KEY
-- itself now blocks it) — the arbitrary ids in production (club-1, p2-club-*)
-- predate the FFTT club import (#247) and its dedup-by-affiliation-number
-- check.
--
-- Clubs with no affiliation number yet (a real, ongoing state — several
-- production clubs have none) keep their existing id: there's nothing unique
-- to rename them to, and an empty string can't be the id for more than one
-- row.
--
-- Safety: a club is only renamed when NO OTHER club row already shares its
-- affiliation number. Two rows that turn out to be genuine duplicates of the
-- same real club (same affiliation number, different id — e.g. one created
-- by this app's own FFTT import before this migration, alongside a
-- pre-existing row for the same club) are left untouched rather than merged
-- automatically: picking which row's data "wins" isn't a decision this
-- migration can make safely. Those need a manual look (a one-off query lists
-- them: `SELECT affiliation_number, COUNT(*) FROM clubs WHERE
-- affiliation_number <> '' GROUP BY affiliation_number HAVING COUNT(*) > 1`).
--
-- Child tables are repointed to the new id BEFORE clubs.id itself is renamed
-- (the rename would otherwise erase the old id these lookups join on). Safe
-- to re-run: once a club's id already equals its affiliation number, every
-- statement below matches zero rows for it.

UPDATE club_addresses
SET club_id = (SELECT affiliation_number FROM clubs WHERE clubs.id = club_addresses.club_id)
WHERE club_id IN (
  SELECT id FROM clubs
  WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
    AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id)
);

UPDATE club_channels
SET club_id = (SELECT affiliation_number FROM clubs WHERE clubs.id = club_channels.club_id)
WHERE club_id IN (
  SELECT id FROM clubs
  WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
    AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id)
);

UPDATE club_logos
SET club_id = (SELECT affiliation_number FROM clubs WHERE clubs.id = club_logos.club_id)
WHERE club_id IN (
  SELECT id FROM clubs
  WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
    AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id)
);

UPDATE teams
SET club_id = (SELECT affiliation_number FROM clubs WHERE clubs.id = teams.club_id)
WHERE club_id IN (
  SELECT id FROM clubs
  WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
    AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id)
);

-- The merged auth+profile table (#105) — club_admin/player accounts scope to
-- a club via this column.
UPDATE users
SET club_id = (SELECT affiliation_number FROM clubs WHERE clubs.id = users.club_id)
WHERE club_id IN (
  SELECT id FROM clubs
  WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
    AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id)
);

UPDATE clubs
SET id = affiliation_number
WHERE affiliation_number IS NOT NULL AND affiliation_number <> '' AND affiliation_number <> id
  AND NOT EXISTS (SELECT 1 FROM clubs c2 WHERE c2.affiliation_number = clubs.affiliation_number AND c2.id <> clubs.id);
