-- Corrects placeholder/wrong FFTT affiliation numbers for opponent clubs
-- created before the FFTT club import (#247) existed. Real numbers confirmed
-- against apiv2.fftt.com's poolOpponents/xml_club_detail.php (see #246/#247
-- discussion). Guarded by display_name so this is a no-op for any of these
-- clubs that don't exist yet, or already carry the right number — safe to
-- re-run, matching the deploy pipeline's unconditional re-apply of every
-- migration on each deploy.
UPDATE clubs SET affiliation_number = '06880123' WHERE display_name = 'Etival';
UPDATE clubs SET affiliation_number = '06680125' WHERE display_name = 'Rosenau';
UPDATE clubs SET affiliation_number = '06670045' WHERE display_name = 'RC Strasbourg';
UPDATE clubs SET affiliation_number = '06880022' WHERE display_name = 'Vittel St Remy';
UPDATE clubs SET affiliation_number = '06680091' WHERE display_name = 'Illzach';
UPDATE clubs SET affiliation_number = '06100004' WHERE display_name = 'Moussey';
UPDATE clubs SET affiliation_number = '06880002' WHERE display_name = 'Anould';
UPDATE clubs SET affiliation_number = '06680004' WHERE display_name = 'Colmar MJC';
UPDATE clubs SET affiliation_number = '06680080' WHERE display_name = 'Colmar AJE';
UPDATE clubs SET affiliation_number = '06680082' WHERE display_name = 'Saint-Louis';
UPDATE clubs SET affiliation_number = '06680102' WHERE display_name = 'Huningue';
UPDATE clubs SET affiliation_number = '06680090' WHERE display_name = 'Ingersheim';
UPDATE clubs SET affiliation_number = '06680071' WHERE display_name = 'Issenheim';
UPDATE clubs SET affiliation_number = '06680116' WHERE display_name = 'Wintzfelden';
UPDATE clubs SET affiliation_number = '06680111' WHERE display_name = 'Thann';
UPDATE clubs SET affiliation_number = '06680138' WHERE display_name = 'Soultz';
UPDATE clubs SET affiliation_number = '06680118' WHERE display_name = 'Wittelsheim';
UPDATE clubs SET affiliation_number = '06680006' WHERE display_name = 'FC Mulhouse';
UPDATE clubs SET affiliation_number = '06680140' WHERE display_name = 'Kembs';
UPDATE clubs SET affiliation_number = '06680123' WHERE display_name = 'Ensisheim TTMC';
UPDATE clubs SET affiliation_number = '06880064' WHERE display_name = 'Ballons des Vosges';
UPDATE clubs SET affiliation_number = '06680105' WHERE display_name = 'Mulhouse TT';
