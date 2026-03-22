-- Seed data generated from src/mock/data.ts

-- seasons
INSERT INTO seasons (id, display_name, is_archived, is_active) VALUES
  ('season-1', '2025/2026', 0, 1);

-- phases
INSERT INTO phases (id, season_id, name, display_name, is_archived, is_active) VALUES
  ('phase-1', 'season-1', 'Phase 1', '2025/2026 Phase 1', 0, 1);

-- divisions
INSERT INTO divisions (id, phase_id, display_name, rank, players_per_game) VALUES
  ('div-1', 'phase-1', 'GE1', 1, 4),
  ('div-2', 'phase-1', 'GE2', 2, 4),
  ('div-3', 'phase-1', 'GE3', 3, 4),
  ('div-4', 'phase-1', 'GE4', 4, 4),
  ('div-5', 'phase-1', 'GE5', 5, 4);

-- clubs
INSERT INTO clubs (id, affiliation_number, display_name, is_archived) VALUES
  ('club-1', '06680011', 'PPA Rixheim', 0),
  ('club-etival', '06880001', 'Etival', 0),
  ('club-rosenau', '06680002', 'Rosenau', 0),
  ('club-rc-strasbourg', '06670001', 'RC Strasbourg', 0),
  ('club-vittel', '06880002', 'Vittel St Remy', 0),
  ('club-illzach', '06680003', 'Illzach', 0),
  ('club-moussey', '06570001', 'Moussey', 0),
  ('club-anould', '06880003', 'Anould', 0),
  ('club-colmar-mjc', '06680004', 'Colmar MJC', 0),
  ('club-colmar-aje', '06680005', 'Colmar AJE', 0),
  ('club-saint-louis', '06680006', 'Saint-Louis', 0),
  ('club-huningue', '06680007', 'Huningue', 0),
  ('club-ingersheim', '06680008', 'Ingersheim', 0),
  ('club-issenheim', '06680009', 'Issenheim', 0),
  ('club-wintzfelden', '06680010', 'Wintzfelden', 0),
  ('club-thann', '06680012', 'Thann', 0),
  ('club-soultz', '06680013', 'Soultz', 0),
  ('club-wittelsheim', '06680014', 'Wittelsheim', 0),
  ('club-fc-mulhouse', '06680015', 'FC Mulhouse', 0),
  ('club-kembs', '06680016', 'Kembs', 0),
  ('club-ensisheim', '06680017', 'Ensisheim TTMC', 0),
  ('club-ballons', '06680018', 'Ballons des Vosges', 0),
  ('club-mulhouse-tt', '06680019', 'Mulhouse TT', 0);

-- club_addresses
INSERT INTO club_addresses (id, club_id, label, street, postal_code, city, is_default) VALUES
  ('addr-1', 'club-1', 'Gymnase principal', '12 rue du Sport', '68170', 'Rixheim', 1),
  ('addr-2', 'club-1', 'Salle annexe', '5 avenue des Lilas', '68170', 'Rixheim', 0),
  ('addr-etival', 'club-etival', 'Salle', '1 rue du Sport', '68000', 'Etival', 1),
  ('addr-rosenau', 'club-rosenau', 'Salle', '1 rue du Sport', '68000', 'Rosenau', 1),
  ('addr-rcs', 'club-rc-strasbourg', 'Salle', '1 rue du Sport', '68000', 'Strasbourg', 1),
  ('addr-vittel', 'club-vittel', 'Salle', '1 rue du Sport', '68000', 'Vittel', 1),
  ('addr-illzach', 'club-illzach', 'Salle', '1 rue du Sport', '68000', 'Illzach', 1),
  ('addr-moussey', 'club-moussey', 'Salle', '1 rue du Sport', '68000', 'Moussey', 1),
  ('addr-anould', 'club-anould', 'Salle', '1 rue du Sport', '68000', 'Anould', 1),
  ('addr-cmjc', 'club-colmar-mjc', 'Salle', '1 rue du Sport', '68000', 'Colmar', 1),
  ('addr-caje', 'club-colmar-aje', 'Salle', '1 rue du Sport', '68000', 'Colmar', 1),
  ('addr-stlouis', 'club-saint-louis', 'Salle', '1 rue du Sport', '68000', 'Saint-Louis', 1),
  ('addr-huningue', 'club-huningue', 'Salle', '1 rue du Sport', '68000', 'Huningue', 1),
  ('addr-ingersheim', 'club-ingersheim', 'Salle', '1 rue du Sport', '68000', 'Ingersheim', 1),
  ('addr-issenheim', 'club-issenheim', 'Salle', '1 rue du Sport', '68000', 'Issenheim', 1),
  ('addr-wintzfelden', 'club-wintzfelden', 'Salle', '1 rue du Sport', '68000', 'Wintzfelden', 1),
  ('addr-thann', 'club-thann', 'Salle', '1 rue du Sport', '68000', 'Thann', 1),
  ('addr-soultz', 'club-soultz', 'Salle', '1 rue du Sport', '68000', 'Soultz', 1),
  ('addr-wittelsheim', 'club-wittelsheim', 'Salle', '1 rue du Sport', '68000', 'Wittelsheim', 1),
  ('addr-fcm', 'club-fc-mulhouse', 'Salle', '1 rue du Sport', '68000', 'Mulhouse', 1),
  ('addr-kembs', 'club-kembs', 'Salle', '1 rue du Sport', '68000', 'Kembs', 1),
  ('addr-ensisheim', 'club-ensisheim', 'Salle', '1 rue du Sport', '68000', 'Ensisheim', 1),
  ('addr-ballons', 'club-ballons', 'Salle', '1 rue du Sport', '68000', 'Ballons des Vosges', 1),
  ('addr-mutt', 'club-mulhouse-tt', 'Salle', '1 rue du Sport', '68000', 'Mulhouse', 1);

-- groups_tbl
INSERT INTO groups_tbl (id, division_id, number, team_ids) VALUES
  ('group-1', 'div-1', 1, '["team-1","opp-etival-1","opp-rosenau-1","opp-rcs-2","opp-vittel-1","opp-illzach-2","opp-moussey-1","opp-anould-2"]'),
  ('group-2', 'div-2', 1, '["team-2","opp-illzach-3","opp-rosenau-2","opp-cmjc-3","opp-caje-1","opp-stlouis-1","opp-huningue-1","opp-ingersheim-1"]'),
  ('group-3', 'div-3', 1, '["team-3","opp-issenheim-1","opp-illzach-6","opp-wintzfelden-2","opp-huningue-2","opp-thann-2","opp-rosenau-4"]'),
  ('group-4', 'div-4', 1, '["team-4","opp-soultz-2","opp-wittelsheim-5","opp-illzach-8","opp-fcm-3","opp-kembs-2","opp-ensisheim-1","opp-rosenau-6"]'),
  ('group-5', 'div-5', 1, '["team-5","team-6","opp-issenheim-3","opp-illzach-7","opp-ballons-4","opp-mutt-5","opp-wittelsheim-4","opp-wintzfelden-3"]');

-- players
INSERT INTO players (id, first_name, last_name, license_number, email, phone, birth_date, birth_place, status, club_id, points) VALUES
  ('player-admin', 'Admin', 'Global', '0000001', 'admin@example.com', '', NULL, NULL, 'active', '', NULL),
  ('player-club-admin', 'Claire', 'Admin', '0000002', 'club.admin@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('p-szulc', 'Joris', 'Szulc', '686910', 'joris.szulc@example.com', '', NULL, NULL, 'active', 'club-1', '1887'),
  ('p-canaque', 'Gregory', 'Canaque', '425881', 'gregory.canaque@example.com', '', NULL, NULL, 'active', 'club-1', '1763'),
  ('p-colle', 'Quentin', 'Colle', '8810008', 'quentin.colle@example.com', '', NULL, NULL, 'active', 'club-1', '1665'),
  ('p-lach', 'Stéphane', 'Lach', '681364', 'stephane.lach@example.com', '', NULL, NULL, 'active', 'club-1', '1647'),
  ('p-lotz', 'Enzo', 'Lotz', '6716966', 'enzo.lotz@example.com', '', NULL, NULL, 'active', 'club-1', '1566'),
  ('p-buchi', 'Christian', 'Buchi', '6815117', 'christian.buchi@example.com', '', NULL, NULL, 'active', 'club-1', '1791'),
  ('p-philippe', 'Olivier', 'Philippe', '683975', 'olivier.philippe@example.com', '', NULL, NULL, 'active', 'club-1', '1661'),
  ('p-ceroni', 'Hervé', 'Ceroni', '684545', 'herve.ceroni@example.com', '', NULL, NULL, 'active', 'club-1', '1500'),
  ('p-dangelser-f', 'Fabrice', 'Dangelser', '682480', 'fabrice.dangelser@example.com', '', NULL, NULL, 'active', 'club-1', '1301'),
  ('p-cunin', 'Cédric', 'Cunin', '6810711', 'cedric.cunin@example.com', '', NULL, NULL, 'active', 'club-1', '1301'),
  ('p-rentz', 'Sébastien', 'Rentz', '687433', 'sebastien.rentz@example.com', '', NULL, NULL, 'active', 'club-1', '1356'),
  ('p-schatt', 'Sébastien', 'Schatt', '685143', 'sebastien.schatt@example.com', '', NULL, NULL, 'active', 'club-1', '1267'),
  ('p-schill', 'Yannick', 'Schill', '6814304', 'yannick.schill@example.com', '', NULL, NULL, 'active', 'club-1', '1198'),
  ('p-cristini', 'Nello', 'Cristini', '683787', 'nello.cristini@example.com', '', NULL, NULL, 'active', 'club-1', '1186'),
  ('p-dangelser-b', 'Bastien', 'Dangelser', '684113', 'bastien.dangelser@example.com', '', NULL, NULL, 'active', 'club-1', '754'),
  ('p-clement', 'Didier', 'Clément', '392885', 'didier.clement@example.com', '', NULL, NULL, 'active', 'club-1', '889'),
  ('p-mougey', 'Mathieu', 'Mougey', '6810243', 'mathieu.mougey@example.com', '', NULL, NULL, 'active', 'club-1', '728'),
  ('p-decoatpont', 'Bertrand', 'De Coatpont', '6813454', 'bertrand.decoatpont@example.com', '', NULL, NULL, 'active', 'club-1', '727'),
  ('p-broglin', 'Nicolas', 'Broglin', '6815877', 'nicolas.broglin@example.com', '', NULL, NULL, 'active', 'club-1', '713'),
  ('p-schmitt', 'David', 'Schmitt', '6815675', 'david.schmitt@example.com', '', NULL, NULL, 'active', 'club-1', '704'),
  ('p-depauli', 'Patricia', 'De Pauli', '6812597', 'patricia.depauli@example.com', '', NULL, NULL, 'active', 'club-1', '735'),
  ('p-knobloch', 'Gilles', 'Knobloch', '6814428', 'gilles.knobloch@example.com', '', NULL, NULL, 'active', 'club-1', '701'),
  ('p-arif', 'Abdelaziz', 'Arif', '9131446', 'abdelaziz.arif@example.com', '', NULL, NULL, 'active', 'club-1', '702'),
  ('p-heurtin', 'Christophe', 'Heurtin', '6816317', 'christophe.heurtin@example.com', '', NULL, NULL, 'active', 'club-1', '1050'),
  ('p-zilbermann', 'Frédéric', 'Zilbermann', '689768', 'frederic.zilbermann@example.com', '', NULL, NULL, 'active', 'club-1', '707'),
  ('p-hoffmann', 'Marc', 'Hoffmann', '6814449', 'marc.hoffmann@example.com', '06 56 78 90 12', NULL, NULL, 'active', 'club-1', '620');

-- teams (PPA Rixheim)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('team-1', 'club-1', 'phase-1', 1, 'div-1', 'group-1', 'addr-1', 'Samedi', '16h00', 'p-szulc', '["p-szulc","p-canaque","p-colle","p-lach","p-lotz"]', '{"p-szulc":"1887","p-canaque":"1763","p-colle":"1665","p-lach":"1647","p-lotz":"1566"}', '#374151', NULL),
  ('team-2', 'club-1', 'phase-1', 2, 'div-2', 'group-2', 'addr-1', 'Samedi', '16h00', 'p-buchi', '["p-buchi","p-philippe","p-ceroni","p-dangelser-f","p-cunin"]', '{"p-buchi":"1791","p-philippe":"1661","p-ceroni":"1500","p-dangelser-f":"1301","p-cunin":"1301"}', '#b91c1c', NULL),
  ('team-3', 'club-1', 'phase-1', 3, 'div-3', 'group-3', 'addr-1', 'Samedi', '16h00', 'p-rentz', '["p-rentz","p-schatt","p-schill","p-cristini","p-dangelser-b"]', '{"p-rentz":"1356","p-schatt":"1267","p-schill":"1198","p-cristini":"1186","p-dangelser-b":"754"}', '#15803d', NULL),
  ('team-4', 'club-1', 'phase-1', 4, 'div-4', 'group-4', 'addr-1', 'Jeudi', '20h00', 'p-clement', '["p-clement","p-mougey","p-decoatpont","p-broglin","p-schmitt"]', '{"p-clement":"889","p-mougey":"728","p-decoatpont":"727","p-broglin":"713","p-schmitt":"704"}', '#c2410c', NULL),
  ('team-5', 'club-1', 'phase-1', 5, 'div-5', 'group-5', 'addr-1', 'Samedi', '16h00', 'p-heurtin', '["p-depauli","p-knobloch","p-arif","p-heurtin","p-zilbermann"]', '{"p-depauli":"735","p-knobloch":"701","p-arif":"702","p-heurtin":"1050","p-zilbermann":"707"}', '#1d4ed8', NULL),
  ('team-6', 'club-1', 'phase-1', 6, 'div-5', 'group-5', 'addr-2', 'Samedi', '16h00', 'p-hoffmann', '["p-hoffmann"]', NULL, '#be185d', NULL);

-- teams (opponents)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('opp-etival-1', 'club-etival', 'phase-1', 1, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-rosenau-1', 'club-rosenau', 'phase-1', 1, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-rcs-2', 'club-rc-strasbourg', 'phase-1', 2, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-vittel-1', 'club-vittel', 'phase-1', 1, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-illzach-2', 'club-illzach', 'phase-1', 2, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-moussey-1', 'club-moussey', 'phase-1', 1, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-anould-2', 'club-anould', 'phase-1', 2, 'div-1', 'group-1', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-illzach-3', 'club-illzach', 'phase-1', 3, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-rosenau-2', 'club-rosenau', 'phase-1', 2, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-cmjc-3', 'club-colmar-mjc', 'phase-1', 3, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-caje-1', 'club-colmar-aje', 'phase-1', 1, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-stlouis-1', 'club-saint-louis', 'phase-1', 1, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-huningue-1', 'club-huningue', 'phase-1', 1, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-ingersheim-1', 'club-ingersheim', 'phase-1', 1, 'div-2', 'group-2', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-issenheim-1', 'club-issenheim', 'phase-1', 1, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-illzach-6', 'club-illzach', 'phase-1', 6, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-wintzfelden-2', 'club-wintzfelden', 'phase-1', 2, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-huningue-2', 'club-huningue', 'phase-1', 2, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-thann-2', 'club-thann', 'phase-1', 2, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-rosenau-4', 'club-rosenau', 'phase-1', 4, 'div-3', 'group-3', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-soultz-2', 'club-soultz', 'phase-1', 2, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-wittelsheim-5', 'club-wittelsheim', 'phase-1', 5, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-illzach-8', 'club-illzach', 'phase-1', 8, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-fcm-3', 'club-fc-mulhouse', 'phase-1', 3, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-kembs-2', 'club-kembs', 'phase-1', 2, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-ensisheim-1', 'club-ensisheim', 'phase-1', 1, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-rosenau-6', 'club-rosenau', 'phase-1', 6, 'div-4', 'group-4', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-issenheim-3', 'club-issenheim', 'phase-1', 3, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-illzach-7', 'club-illzach', 'phase-1', 7, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-ballons-4', 'club-ballons', 'phase-1', 4, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-mutt-5', 'club-mulhouse-tt', 'phase-1', 5, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-wittelsheim-4', 'club-wittelsheim', 'phase-1', 4, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL),
  ('opp-wintzfelden-3', 'club-wintzfelden', 'phase-1', 3, 'div-5', 'group-5', '', '', '', '', '[]', NULL, NULL, NULL);

-- match_days
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('md-g1-1', 'group-1', 1, '2025-09-27'),
  ('md-g1-2', 'group-1', 2, '2025-10-11'),
  ('md-g1-3', 'group-1', 3, '2025-11-08'),
  ('md-g1-4', 'group-1', 4, '2025-11-15'),
  ('md-g1-5', 'group-1', 5, '2025-11-29'),
  ('md-g1-6', 'group-1', 6, '2025-12-13'),
  ('md-g1-7', 'group-1', 7, '2026-01-10'),
  ('md-g2-1', 'group-2', 1, '2025-09-27'),
  ('md-g2-2', 'group-2', 2, '2025-10-11'),
  ('md-g2-3', 'group-2', 3, '2025-11-08'),
  ('md-g2-4', 'group-2', 4, '2025-11-16'),
  ('md-g2-5', 'group-2', 5, '2025-11-29'),
  ('md-g2-6', 'group-2', 6, '2025-12-13'),
  ('md-g2-7', 'group-2', 7, '2026-01-10'),
  ('md-g3-1', 'group-3', 1, '2025-09-27'),
  ('md-g3-2', 'group-3', 2, '2025-10-10'),
  ('md-g3-3', 'group-3', 3, '2025-11-08'),
  ('md-g3-4', 'group-3', 4, '2025-11-14'),
  ('md-g3-5', 'group-3', 5, '2025-11-29'),
  ('md-g3-6', 'group-3', 6, '2025-12-13'),
  ('md-g3-7', 'group-3', 7, '2026-01-10'),
  ('md-g4-1', 'group-4', 1, '2025-09-22'),
  ('md-g4-2', 'group-4', 2, '2025-10-09'),
  ('md-g4-3', 'group-4', 3, '2025-11-05'),
  ('md-g4-4', 'group-4', 4, '2025-11-13'),
  ('md-g4-5', 'group-4', 5, '2025-11-27'),
  ('md-g4-6', 'group-4', 6, '2025-12-13'),
  ('md-g4-7', 'group-4', 7, '2026-01-08'),
  ('md-g5-1', 'group-5', 1, '2025-09-27'),
  ('md-g5-2', 'group-5', 2, '2025-10-11'),
  ('md-g5-3', 'group-5', 3, '2025-11-07'),
  ('md-g5-4', 'group-5', 4, '2025-11-15'),
  ('md-g5-5', 'group-5', 5, '2025-11-28'),
  ('md-g5-6', 'group-5', 6, '2025-12-13'),
  ('md-g5-7', 'group-5', 7, '2026-01-10');

-- games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('g1-1', 'md-g1-1', 'opp-etival-1', 'team-1', NULL),
  ('g1-2', 'md-g1-2', 'opp-rosenau-1', 'team-1', NULL),
  ('g1-3', 'md-g1-3', 'opp-rcs-2', 'team-1', NULL),
  ('g1-4', 'md-g1-4', 'opp-vittel-1', 'team-1', NULL),
  ('g1-5', 'md-g1-5', 'opp-illzach-2', 'team-1', NULL),
  ('g1-6', 'md-g1-6', 'opp-moussey-1', 'team-1', NULL),
  ('g1-7', 'md-g1-7', 'opp-anould-2', 'team-1', NULL),
  ('g2-1', 'md-g2-1', 'opp-illzach-3', 'team-2', NULL),
  ('g2-2', 'md-g2-2', 'opp-rosenau-2', 'team-2', NULL),
  ('g2-3', 'md-g2-3', 'opp-cmjc-3', 'team-2', NULL),
  ('g2-4', 'md-g2-4', 'opp-caje-1', 'team-2', NULL),
  ('g2-5', 'md-g2-5', 'opp-stlouis-1', 'team-2', NULL),
  ('g2-6', 'md-g2-6', 'opp-huningue-1', 'team-2', NULL),
  ('g2-7', 'md-g2-7', 'opp-ingersheim-1', 'team-2', NULL),
  ('g3-1', 'md-g3-1', 'opp-issenheim-1', 'team-3', NULL),
  ('g3-2', 'md-g3-2', 'opp-illzach-6', 'team-3', '20h00'),
  ('g3-3', 'md-g3-3', 'opp-wintzfelden-2', 'team-3', NULL),
  ('g3-4', 'md-g3-4', 'opp-huningue-2', 'team-3', '20h00'),
  ('g3-5', 'md-g3-5', 'opp-thann-2', 'team-3', NULL),
  ('g3-6', 'md-g3-6', 'opp-rosenau-4', 'team-3', NULL),
  ('g4-1', 'md-g4-1', 'opp-soultz-2', 'team-4', '20h00'),
  ('g4-2', 'md-g4-2', 'opp-wittelsheim-5', 'team-4', NULL),
  ('g4-3', 'md-g4-3', 'opp-illzach-8', 'team-4', '20h00'),
  ('g4-4', 'md-g4-4', 'opp-fcm-3', 'team-4', NULL),
  ('g4-5', 'md-g4-5', 'opp-kembs-2', 'team-4', NULL),
  ('g4-6', 'md-g4-6', 'opp-ensisheim-1', 'team-4', '16h00'),
  ('g4-7', 'md-g4-7', 'opp-rosenau-6', 'team-4', NULL),
  ('g5-1', 'md-g5-1', 'team-6', 'team-5', NULL),
  ('g5-2', 'md-g5-2', 'opp-issenheim-3', 'team-5', NULL),
  ('g5-3', 'md-g5-3', 'opp-illzach-7', 'team-5', '20h00'),
  ('g5-4', 'md-g5-4', 'opp-ballons-4', 'team-5', '20h00'),
  ('g5-5', 'md-g5-5', 'opp-mutt-5', 'team-5', '20h00'),
  ('g5-6', 'md-g5-6', 'opp-wittelsheim-4', 'team-5', NULL),
  ('g5-7', 'md-g5-7', 'opp-wintzfelden-3', 'team-5', NULL);

-- users
INSERT INTO users (id, email, role, player_id, club_ids, captain_team_ids) VALUES
  ('user-1', 'admin@example.com', 'general_admin', 'player-admin', '[]', '[]'),
  ('user-2', 'club.admin@example.com', 'club_admin', 'player-club-admin', '["club-1"]', '[]'),
  ('user-3', 'joris.szulc@example.com', 'captain', 'p-szulc', '["club-1"]', '["team-1"]'),
  ('user-4', 'christophe.heurtin@example.com', 'player', 'p-heurtin', '["club-1"]', '[]'),
  ('user-5', 'gilles.knobloch@example.com', 'player', 'p-knobloch', '["club-1"]', '[]'),
  ('user-6', 'sebastien.rentz@example.com', 'captain', 'p-rentz', '["club-1"]', '["team-3"]');
