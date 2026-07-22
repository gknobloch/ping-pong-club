-- Fixes fallout from #252 (migration 0017): that migration assumed every club
-- with a non-empty affiliation_number had already been renamed to it by 0016.
-- In production 0016 never actually renamed any pre-existing club (confirmed
-- by a full id/display_name export: even single, non-duplicated clubs like
-- "Etival" were still on their old id after 0017 ran), so every club that had
-- a real number kept its old id, and that number is now gone forever from the
-- dropped column — except where it can be reconstructed from this project's
-- own history (migration 0015's hardcoded display_name -> number mapping, and
-- screenshots shared while diagnosing this).
--
-- Separately, the export also surfaced this project's real, long-standing
-- duplicate problem: most clubs exist under *two* ids (an original "club-X"
-- row and a "p2-club-X" row from an earlier duplicate import), each with its
-- own real teams attached — not an empty shell next to a real one. Fixing the
-- id therefore means merging: repoint every dependent row from every id in a
-- group onto the one real (or synthetic, if truly unknown) id, then remove the
-- now-empty duplicate rows.
--
-- Re-run safety: every statement below is naturally idempotent (an UPDATE/
-- DELETE targeting an id that no longer exists simply matches zero rows on a
-- second run; the canonical-row INSERTs guard with NOT EXISTS), so this
-- doesn't need the "fails fast" trick used by 0007/0016/0017.
--
-- Known limitation: this repoints club-level rows (teams, addresses, etc.)
-- but has no visibility into individual team rows, so if the same (phase,
-- number) pair happens to exist under two merged ids, that duplication isn't
-- detected here — worth a manual spot-check per merged club afterward.
--
-- Address handling: each duplicate carries its own single placeholder address
-- row for the same venue; only one is kept per merged club (the one from
-- whichever id has the most teams, tied broken alphabetically) and the rest
-- are deleted — a judgment call, not a guaranteed-correct reconciliation of
-- possibly-edited address details.

-- === Simple renames (single row, no duplicate) ===

UPDATE club_addresses SET club_id = '06680120' WHERE club_id = 'club-1784620922570-3vcxw';
UPDATE club_channels SET club_id = '06680120' WHERE club_id = 'club-1784620922570-3vcxw';
UPDATE club_logos SET club_id = '06680120' WHERE club_id = 'club-1784620922570-3vcxw' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680120');
UPDATE teams SET club_id = '06680120' WHERE club_id = 'club-1784620922570-3vcxw';
UPDATE users SET club_id = '06680120' WHERE club_id = 'club-1784620922570-3vcxw';
UPDATE clubs SET id = '06680120' WHERE id = 'club-1784620922570-3vcxw';

UPDATE club_addresses SET club_id = '06880123' WHERE club_id = 'club-etival';
UPDATE club_channels SET club_id = '06880123' WHERE club_id = 'club-etival';
UPDATE club_logos SET club_id = '06880123' WHERE club_id = 'club-etival' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880123');
UPDATE teams SET club_id = '06880123' WHERE club_id = 'club-etival';
UPDATE users SET club_id = '06880123' WHERE club_id = 'club-etival';
UPDATE clubs SET id = '06880123' WHERE id = 'club-etival';

UPDATE club_addresses SET club_id = '08921458' WHERE club_id = 'club-1784700386126-kfpu5';
UPDATE club_channels SET club_id = '08921458' WHERE club_id = 'club-1784700386126-kfpu5';
UPDATE club_logos SET club_id = '08921458' WHERE club_id = 'club-1784700386126-kfpu5' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '08921458');
UPDATE teams SET club_id = '08921458' WHERE club_id = 'club-1784700386126-kfpu5';
UPDATE users SET club_id = '08921458' WHERE club_id = 'club-1784700386126-kfpu5';
UPDATE clubs SET id = '08921458' WHERE id = 'club-1784700386126-kfpu5';

UPDATE club_addresses SET club_id = '06680020' WHERE club_id = 'club-1784614355608-ezt6w';
UPDATE club_channels SET club_id = '06680020' WHERE club_id = 'club-1784614355608-ezt6w';
UPDATE club_logos SET club_id = '06680020' WHERE club_id = 'club-1784614355608-ezt6w' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680020');
UPDATE teams SET club_id = '06680020' WHERE club_id = 'club-1784614355608-ezt6w';
UPDATE users SET club_id = '06680020' WHERE club_id = 'club-1784614355608-ezt6w';
UPDATE clubs SET id = '06680020' WHERE id = 'club-1784614355608-ezt6w';

UPDATE club_addresses SET club_id = '06670045' WHERE club_id = 'club-rc-strasbourg';
UPDATE club_channels SET club_id = '06670045' WHERE club_id = 'club-rc-strasbourg';
UPDATE club_logos SET club_id = '06670045' WHERE club_id = 'club-rc-strasbourg' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06670045');
UPDATE teams SET club_id = '06670045' WHERE club_id = 'club-rc-strasbourg';
UPDATE users SET club_id = '06670045' WHERE club_id = 'club-rc-strasbourg';
UPDATE clubs SET id = '06670045' WHERE id = 'club-rc-strasbourg';

UPDATE club_addresses SET club_id = '06680011' WHERE club_id = 'club-1';
UPDATE club_channels SET club_id = '06680011' WHERE club_id = 'club-1';
UPDATE club_logos SET club_id = '06680011' WHERE club_id = 'club-1' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680011');
UPDATE teams SET club_id = '06680011' WHERE club_id = 'club-1';
UPDATE users SET club_id = '06680011' WHERE club_id = 'club-1';
UPDATE clubs SET id = '06680011' WHERE id = 'club-1';

UPDATE club_addresses SET club_id = '06880064' WHERE club_id = 'club-ballons';
UPDATE club_channels SET club_id = '06880064' WHERE club_id = 'club-ballons';
UPDATE club_logos SET club_id = '06880064' WHERE club_id = 'club-ballons' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880064');
UPDATE teams SET club_id = '06880064' WHERE club_id = 'club-ballons';
UPDATE users SET club_id = '06880064' WHERE club_id = 'club-ballons';
UPDATE clubs SET id = '06880064' WHERE id = 'club-ballons';

-- 06670183 (FCJ Bootzheim) is already correct — no action needed.

-- === Merge groups (duplicate rows for the same real club) ===

-- Anould -> 06880002 ("Anould Cercle Pongiste")
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06880002', 'Anould Cercle Pongiste', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06880002')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('club-anould', 'p2-club-anould'));
UPDATE teams SET club_id = '06880002' WHERE club_id IN ('club-anould', 'p2-club-anould');
UPDATE users SET club_id = '06880002' WHERE club_id IN ('club-anould', 'p2-club-anould');
UPDATE club_channels SET club_id = '06880002' WHERE club_id IN ('club-anould', 'p2-club-anould');
UPDATE club_logos SET club_id = '06880002' WHERE club_id = 'club-anould' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880002');
UPDATE club_logos SET club_id = '06880002' WHERE club_id = 'p2-club-anould' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880002');
UPDATE club_addresses SET club_id = '06880002' WHERE club_id = 'p2-club-anould';
DELETE FROM club_addresses WHERE club_id = 'club-anould';
DELETE FROM clubs WHERE id IN ('club-anould', 'p2-club-anould');

-- Bergheim -> 06680128 ("Bergheim CSS")
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680128', 'Bergheim CSS', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680128')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('99000002', 'club-1784613652575-o403a'));
UPDATE teams SET club_id = '06680128' WHERE club_id IN ('99000002', 'club-1784613652575-o403a');
UPDATE users SET club_id = '06680128' WHERE club_id IN ('99000002', 'club-1784613652575-o403a');
UPDATE club_channels SET club_id = '06680128' WHERE club_id IN ('99000002', 'club-1784613652575-o403a');
UPDATE club_logos SET club_id = '06680128' WHERE club_id = '99000002' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680128');
UPDATE club_logos SET club_id = '06680128' WHERE club_id = 'club-1784613652575-o403a' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680128');
UPDATE club_addresses SET club_id = '06680128' WHERE club_id = '99000002';
DELETE FROM club_addresses WHERE club_id = 'club-1784613652575-o403a';
DELETE FROM clubs WHERE id IN ('99000002', 'club-1784613652575-o403a');

-- Colmar AJE -> 06680080
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680080', 'Colmar AJE', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680080')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-colmaraje', 'club-colmar-aje'));
UPDATE teams SET club_id = '06680080' WHERE club_id IN ('p2-club-colmaraje', 'club-colmar-aje');
UPDATE users SET club_id = '06680080' WHERE club_id IN ('p2-club-colmaraje', 'club-colmar-aje');
UPDATE club_channels SET club_id = '06680080' WHERE club_id IN ('p2-club-colmaraje', 'club-colmar-aje');
UPDATE club_logos SET club_id = '06680080' WHERE club_id = 'p2-club-colmaraje' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680080');
UPDATE club_logos SET club_id = '06680080' WHERE club_id = 'club-colmar-aje' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680080');
UPDATE club_addresses SET club_id = '06680080' WHERE club_id = 'club-colmar-aje';
DELETE FROM club_addresses WHERE club_id = 'p2-club-colmaraje';
DELETE FROM clubs WHERE id IN ('p2-club-colmaraje', 'club-colmar-aje');

-- Colmar MJC -> 06680004
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680004', 'Colmar MJC', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680004')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-colmarmjc', 'club-colmar-mjc'));
UPDATE teams SET club_id = '06680004' WHERE club_id IN ('p2-club-colmarmjc', 'club-colmar-mjc');
UPDATE users SET club_id = '06680004' WHERE club_id IN ('p2-club-colmarmjc', 'club-colmar-mjc');
UPDATE club_channels SET club_id = '06680004' WHERE club_id IN ('p2-club-colmarmjc', 'club-colmar-mjc');
UPDATE club_logos SET club_id = '06680004' WHERE club_id = 'p2-club-colmarmjc' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680004');
UPDATE club_logos SET club_id = '06680004' WHERE club_id = 'club-colmar-mjc' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680004');
UPDATE club_addresses SET club_id = '06680004' WHERE club_id = 'p2-club-colmarmjc';
DELETE FROM club_addresses WHERE club_id = 'club-colmar-mjc';
DELETE FROM clubs WHERE id IN ('p2-club-colmarmjc', 'club-colmar-mjc');

-- Ensisheim / Ensisheim TTMC / TTMC Ensisheim -> 06680123 (confirmed same club)
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680123', 'Ensisheim TTMC', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680123')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('99000004', 'club-ensisheim', '99000008'));
UPDATE teams SET club_id = '06680123' WHERE club_id IN ('99000004', 'club-ensisheim', '99000008');
UPDATE users SET club_id = '06680123' WHERE club_id IN ('99000004', 'club-ensisheim', '99000008');
UPDATE club_channels SET club_id = '06680123' WHERE club_id IN ('99000004', 'club-ensisheim', '99000008');
UPDATE club_logos SET club_id = '06680123' WHERE club_id = '99000004' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680123');
UPDATE club_logos SET club_id = '06680123' WHERE club_id = 'club-ensisheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680123');
UPDATE club_logos SET club_id = '06680123' WHERE club_id = '99000008' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680123');
UPDATE club_addresses SET club_id = '06680123' WHERE club_id = '99000004';
DELETE FROM club_addresses WHERE club_id IN ('club-ensisheim', '99000008');
DELETE FROM clubs WHERE id IN ('99000004', 'club-ensisheim', '99000008');

-- FC Mulhouse -> 06680006
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680006', 'FC Mulhouse', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680006')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-fcmulhouse', 'club-fc-mulhouse'));
UPDATE teams SET club_id = '06680006' WHERE club_id IN ('p2-club-fcmulhouse', 'club-fc-mulhouse');
UPDATE users SET club_id = '06680006' WHERE club_id IN ('p2-club-fcmulhouse', 'club-fc-mulhouse');
UPDATE club_channels SET club_id = '06680006' WHERE club_id IN ('p2-club-fcmulhouse', 'club-fc-mulhouse');
UPDATE club_logos SET club_id = '06680006' WHERE club_id = 'p2-club-fcmulhouse' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680006');
UPDATE club_logos SET club_id = '06680006' WHERE club_id = 'club-fc-mulhouse' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680006');
UPDATE club_addresses SET club_id = '06680006' WHERE club_id = 'p2-club-fcmulhouse';
DELETE FROM club_addresses WHERE club_id = 'club-fc-mulhouse';
DELETE FROM clubs WHERE id IN ('p2-club-fcmulhouse', 'club-fc-mulhouse');

-- Huningue -> 06680102
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680102', 'Huningue', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680102')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-huningue', 'club-huningue'));
UPDATE teams SET club_id = '06680102' WHERE club_id IN ('p2-club-huningue', 'club-huningue');
UPDATE users SET club_id = '06680102' WHERE club_id IN ('p2-club-huningue', 'club-huningue');
UPDATE club_channels SET club_id = '06680102' WHERE club_id IN ('p2-club-huningue', 'club-huningue');
UPDATE club_logos SET club_id = '06680102' WHERE club_id = 'p2-club-huningue' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680102');
UPDATE club_logos SET club_id = '06680102' WHERE club_id = 'club-huningue' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680102');
UPDATE club_addresses SET club_id = '06680102' WHERE club_id = 'club-huningue';
DELETE FROM club_addresses WHERE club_id = 'p2-club-huningue';
DELETE FROM clubs WHERE id IN ('p2-club-huningue', 'club-huningue');

-- Illzach -> 06680091
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680091', 'Illzach', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680091')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-illzach', 'club-illzach'));
UPDATE teams SET club_id = '06680091' WHERE club_id IN ('p2-club-illzach', 'club-illzach');
UPDATE users SET club_id = '06680091' WHERE club_id IN ('p2-club-illzach', 'club-illzach');
UPDATE club_channels SET club_id = '06680091' WHERE club_id IN ('p2-club-illzach', 'club-illzach');
UPDATE club_logos SET club_id = '06680091' WHERE club_id = 'p2-club-illzach' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680091');
UPDATE club_logos SET club_id = '06680091' WHERE club_id = 'club-illzach' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680091');
UPDATE club_addresses SET club_id = '06680091' WHERE club_id = 'club-illzach';
DELETE FROM club_addresses WHERE club_id = 'p2-club-illzach';
DELETE FROM clubs WHERE id IN ('p2-club-illzach', 'club-illzach');

-- Ingersheim -> 06680090
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680090', 'Ingersheim', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680090')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-ingersheim', 'club-ingersheim'));
UPDATE teams SET club_id = '06680090' WHERE club_id IN ('p2-club-ingersheim', 'club-ingersheim');
UPDATE users SET club_id = '06680090' WHERE club_id IN ('p2-club-ingersheim', 'club-ingersheim');
UPDATE club_channels SET club_id = '06680090' WHERE club_id IN ('p2-club-ingersheim', 'club-ingersheim');
UPDATE club_logos SET club_id = '06680090' WHERE club_id = 'p2-club-ingersheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680090');
UPDATE club_logos SET club_id = '06680090' WHERE club_id = 'club-ingersheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680090');
UPDATE club_addresses SET club_id = '06680090' WHERE club_id = 'club-ingersheim';
DELETE FROM club_addresses WHERE club_id = 'p2-club-ingersheim';
DELETE FROM clubs WHERE id IN ('p2-club-ingersheim', 'club-ingersheim');

-- Issenheim -> 06680071
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680071', 'Issenheim', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680071')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-issenheim', 'club-issenheim'));
UPDATE teams SET club_id = '06680071' WHERE club_id IN ('p2-club-issenheim', 'club-issenheim');
UPDATE users SET club_id = '06680071' WHERE club_id IN ('p2-club-issenheim', 'club-issenheim');
UPDATE club_channels SET club_id = '06680071' WHERE club_id IN ('p2-club-issenheim', 'club-issenheim');
UPDATE club_logos SET club_id = '06680071' WHERE club_id = 'p2-club-issenheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680071');
UPDATE club_logos SET club_id = '06680071' WHERE club_id = 'club-issenheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680071');
UPDATE club_addresses SET club_id = '06680071' WHERE club_id = 'p2-club-issenheim';
DELETE FROM club_addresses WHERE club_id = 'club-issenheim';
DELETE FROM clubs WHERE id IN ('p2-club-issenheim', 'club-issenheim');

-- Kembs / Kembs TT -> 06680140
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680140', 'Kembs TT', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680140')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('club-kembs', 'p2-club-kembs'));
UPDATE teams SET club_id = '06680140' WHERE club_id IN ('club-kembs', 'p2-club-kembs');
UPDATE users SET club_id = '06680140' WHERE club_id IN ('club-kembs', 'p2-club-kembs');
UPDATE club_channels SET club_id = '06680140' WHERE club_id IN ('club-kembs', 'p2-club-kembs');
UPDATE club_logos SET club_id = '06680140' WHERE club_id = 'club-kembs' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680140');
UPDATE club_logos SET club_id = '06680140' WHERE club_id = 'p2-club-kembs' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680140');
UPDATE club_addresses SET club_id = '06680140' WHERE club_id = 'club-kembs';
DELETE FROM club_addresses WHERE club_id = 'p2-club-kembs';
DELETE FROM clubs WHERE id IN ('club-kembs', 'p2-club-kembs');

-- Moussey / Moussey CS -> 06100004
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06100004', 'Moussey CS', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06100004')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('club-moussey', 'p2-club-moussey'));
UPDATE teams SET club_id = '06100004' WHERE club_id IN ('club-moussey', 'p2-club-moussey');
UPDATE users SET club_id = '06100004' WHERE club_id IN ('club-moussey', 'p2-club-moussey');
UPDATE club_channels SET club_id = '06100004' WHERE club_id IN ('club-moussey', 'p2-club-moussey');
UPDATE club_logos SET club_id = '06100004' WHERE club_id = 'club-moussey' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06100004');
UPDATE club_logos SET club_id = '06100004' WHERE club_id = 'p2-club-moussey' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06100004');
UPDATE club_addresses SET club_id = '06100004' WHERE club_id = 'club-moussey';
DELETE FROM club_addresses WHERE club_id = 'p2-club-moussey';
DELETE FROM clubs WHERE id IN ('club-moussey', 'p2-club-moussey');

-- Mulhouse TT -> 06680105 (3 rows)
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680105', 'Mulhouse TT', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680105')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-mulhousett', 'club-mulhouse-tt', 'club-1784639991762-wjtoa'));
UPDATE teams SET club_id = '06680105' WHERE club_id IN ('p2-club-mulhousett', 'club-mulhouse-tt', 'club-1784639991762-wjtoa');
UPDATE users SET club_id = '06680105' WHERE club_id IN ('p2-club-mulhousett', 'club-mulhouse-tt', 'club-1784639991762-wjtoa');
UPDATE club_channels SET club_id = '06680105' WHERE club_id IN ('p2-club-mulhousett', 'club-mulhouse-tt', 'club-1784639991762-wjtoa');
UPDATE club_logos SET club_id = '06680105' WHERE club_id = 'p2-club-mulhousett' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680105');
UPDATE club_logos SET club_id = '06680105' WHERE club_id = 'club-mulhouse-tt' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680105');
UPDATE club_logos SET club_id = '06680105' WHERE club_id = 'club-1784639991762-wjtoa' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680105');
UPDATE club_addresses SET club_id = '06680105' WHERE club_id = 'p2-club-mulhousett';
DELETE FROM club_addresses WHERE club_id IN ('club-mulhouse-tt', 'club-1784639991762-wjtoa');
DELETE FROM clubs WHERE id IN ('p2-club-mulhousett', 'club-mulhouse-tt', 'club-1784639991762-wjtoa');

-- Rosenau / Rosenau TT -> 06680125
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680125', 'Rosenau TT', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680125')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('club-rosenau', 'p2-club-rosenau'));
UPDATE teams SET club_id = '06680125' WHERE club_id IN ('club-rosenau', 'p2-club-rosenau');
UPDATE users SET club_id = '06680125' WHERE club_id IN ('club-rosenau', 'p2-club-rosenau');
UPDATE club_channels SET club_id = '06680125' WHERE club_id IN ('club-rosenau', 'p2-club-rosenau');
UPDATE club_logos SET club_id = '06680125' WHERE club_id = 'club-rosenau' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680125');
UPDATE club_logos SET club_id = '06680125' WHERE club_id = 'p2-club-rosenau' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680125');
UPDATE club_addresses SET club_id = '06680125' WHERE club_id = 'club-rosenau';
DELETE FROM club_addresses WHERE club_id = 'p2-club-rosenau';
DELETE FROM clubs WHERE id IN ('club-rosenau', 'p2-club-rosenau');

-- Saint-Louis -> 06680082
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680082', 'Saint-Louis', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680082')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-saintlouis', 'club-saint-louis'));
UPDATE teams SET club_id = '06680082' WHERE club_id IN ('p2-club-saintlouis', 'club-saint-louis');
UPDATE users SET club_id = '06680082' WHERE club_id IN ('p2-club-saintlouis', 'club-saint-louis');
UPDATE club_channels SET club_id = '06680082' WHERE club_id IN ('p2-club-saintlouis', 'club-saint-louis');
UPDATE club_logos SET club_id = '06680082' WHERE club_id = 'p2-club-saintlouis' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680082');
UPDATE club_logos SET club_id = '06680082' WHERE club_id = 'club-saint-louis' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680082');
UPDATE club_addresses SET club_id = '06680082' WHERE club_id = 'club-saint-louis';
DELETE FROM club_addresses WHERE club_id = 'p2-club-saintlouis';
DELETE FROM clubs WHERE id IN ('p2-club-saintlouis', 'club-saint-louis');

-- Soultz -> 06680138
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680138', 'Soultz', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680138')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-soultz', 'club-soultz'));
UPDATE teams SET club_id = '06680138' WHERE club_id IN ('p2-club-soultz', 'club-soultz');
UPDATE users SET club_id = '06680138' WHERE club_id IN ('p2-club-soultz', 'club-soultz');
UPDATE club_channels SET club_id = '06680138' WHERE club_id IN ('p2-club-soultz', 'club-soultz');
UPDATE club_logos SET club_id = '06680138' WHERE club_id = 'p2-club-soultz' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680138');
UPDATE club_logos SET club_id = '06680138' WHERE club_id = 'club-soultz' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680138');
UPDATE club_addresses SET club_id = '06680138' WHERE club_id = 'club-soultz';
DELETE FROM club_addresses WHERE club_id = 'p2-club-soultz';
DELETE FROM clubs WHERE id IN ('p2-club-soultz', 'club-soultz');

-- Thann -> 06680111
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680111', 'Thann', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680111')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-thann', 'club-thann'));
UPDATE teams SET club_id = '06680111' WHERE club_id IN ('p2-club-thann', 'club-thann');
UPDATE users SET club_id = '06680111' WHERE club_id IN ('p2-club-thann', 'club-thann');
UPDATE club_channels SET club_id = '06680111' WHERE club_id IN ('p2-club-thann', 'club-thann');
UPDATE club_logos SET club_id = '06680111' WHERE club_id = 'p2-club-thann' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680111');
UPDATE club_logos SET club_id = '06680111' WHERE club_id = 'club-thann' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680111');
UPDATE club_addresses SET club_id = '06680111' WHERE club_id = 'club-thann';
DELETE FROM club_addresses WHERE club_id = 'p2-club-thann';
DELETE FROM clubs WHERE id IN ('p2-club-thann', 'club-thann');

-- Vittel Saint Rémy / Vittel St Remy -> 06880022
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06880022', 'Vittel Saint Rémy', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06880022')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('99000009', 'club-vittel'));
UPDATE teams SET club_id = '06880022' WHERE club_id IN ('99000009', 'club-vittel');
UPDATE users SET club_id = '06880022' WHERE club_id IN ('99000009', 'club-vittel');
UPDATE club_channels SET club_id = '06880022' WHERE club_id IN ('99000009', 'club-vittel');
UPDATE club_logos SET club_id = '06880022' WHERE club_id = '99000009' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880022');
UPDATE club_logos SET club_id = '06880022' WHERE club_id = 'club-vittel' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06880022');
UPDATE club_addresses SET club_id = '06880022' WHERE club_id = '99000009';
DELETE FROM club_addresses WHERE club_id = 'club-vittel';
DELETE FROM clubs WHERE id IN ('99000009', 'club-vittel');

-- Wintzenfeld / Wintzenheim / Wintzfelden -> 06680116 (confirmed same club)
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680116', 'Wintzfelden', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680116')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('99000010', '99000011', 'club-wintzfelden'));
UPDATE teams SET club_id = '06680116' WHERE club_id IN ('99000010', '99000011', 'club-wintzfelden');
UPDATE users SET club_id = '06680116' WHERE club_id IN ('99000010', '99000011', 'club-wintzfelden');
UPDATE club_channels SET club_id = '06680116' WHERE club_id IN ('99000010', '99000011', 'club-wintzfelden');
UPDATE club_logos SET club_id = '06680116' WHERE club_id = '99000010' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680116');
UPDATE club_logos SET club_id = '06680116' WHERE club_id = '99000011' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680116');
UPDATE club_logos SET club_id = '06680116' WHERE club_id = 'club-wintzfelden' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680116');
UPDATE club_addresses SET club_id = '06680116' WHERE club_id = 'club-wintzfelden';
DELETE FROM club_addresses WHERE club_id IN ('99000010', '99000011');
DELETE FROM clubs WHERE id IN ('99000010', '99000011', 'club-wintzfelden');

-- Wittelsheim -> 06680118
INSERT INTO clubs (id, display_name, is_archived)
  SELECT '06680118', 'Wittelsheim', 0
  WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE id = '06680118')
    AND EXISTS (SELECT 1 FROM clubs WHERE id IN ('p2-club-wittelsheim', 'club-wittelsheim'));
UPDATE teams SET club_id = '06680118' WHERE club_id IN ('p2-club-wittelsheim', 'club-wittelsheim');
UPDATE users SET club_id = '06680118' WHERE club_id IN ('p2-club-wittelsheim', 'club-wittelsheim');
UPDATE club_channels SET club_id = '06680118' WHERE club_id IN ('p2-club-wittelsheim', 'club-wittelsheim');
UPDATE club_logos SET club_id = '06680118' WHERE club_id = 'p2-club-wittelsheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680118');
UPDATE club_logos SET club_id = '06680118' WHERE club_id = 'club-wittelsheim' AND NOT EXISTS (SELECT 1 FROM club_logos WHERE club_id = '06680118');
UPDATE club_addresses SET club_id = '06680118' WHERE club_id = 'club-wittelsheim';
DELETE FROM club_addresses WHERE club_id = 'p2-club-wittelsheim';
DELETE FROM clubs WHERE id IN ('p2-club-wittelsheim', 'club-wittelsheim');

-- Benfeld (99000001), Eloyes (99000003), Saint-Dié (99000005),
-- Staffelfelden (99000006), Troyes (99000007): no real number known —
-- left on their synthetic id from 0017, no action needed.
