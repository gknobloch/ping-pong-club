-- Reverts #251/#252: tying clubs.id to the FFTT affiliation number turned out
-- to be fragile in practice (a games-import request may need to create an
-- opponent club before its real number is reliably known, and renaming the id
-- later — the whole point of #251 — is exactly the primary-key-rename that
-- broke twice in production during #253/#254). affiliation_number goes back
-- to being a plain, independent, editable field; clubs.id is once again an
-- opaque generated value that never changes after creation.
--
-- The 28 clubs already collapsed onto their real number by #253/#254 are NOT
-- renamed back to an arbitrary id here — their id is stable, already correctly
-- linked from every dependent table, and renaming it again would just be
-- another risky cascade for zero benefit. They simply get affiliation_number
-- set to their current id (a harmless coincidence, not a bug) so the FFTT
-- sync features that read affiliation_number keep working for them. The 5
-- clubs that got a synthetic 99xxxxxx id in #252 (no known number) keep
-- affiliation_number NULL, same as before that whole detour.
--
-- Re-run safety: same pattern as 0007/0016/0017 — the first statement adds a
-- column that already exists on any re-run, so a redeploy fails immediately
-- on line 1 without re-touching anything the first successful run already did.

ALTER TABLE clubs ADD COLUMN affiliation_number TEXT;

UPDATE clubs
SET affiliation_number = id
WHERE affiliation_number IS NULL
  AND id GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
  AND id NOT GLOB '99[0-9][0-9][0-9][0-9][0-9][0-9]';
