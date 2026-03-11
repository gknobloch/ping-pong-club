-- Phase 2 seed data for PPA Rixheim
-- Run AFTER seed.sql

-- Phase 2
INSERT INTO phases (id, season_id, name, display_name, is_archived, is_active) VALUES
  ('phase-2', 'season-1', 'Phase 2', '2025/2026 Phase 2', 0, 1);

-- Divisions (all 4 players per game)
INSERT INTO divisions (id, phase_id, display_name, rank, players_per_game) VALUES
  ('p2-div-gee', 'phase-2', 'GEE', 1, 4),
  ('p2-div-ge1', 'phase-2', 'GE1', 2, 4),
  ('p2-div-ge3', 'phase-2', 'GE3', 3, 4),
  ('p2-div-ge6', 'phase-2', 'GE6', 6, 4),
  ('p2-div-ge7', 'phase-2', 'GE7', 7, 4);

-- ============================================================
-- OPPONENT CLUBS (one per unique opponent organization)
-- ============================================================
INSERT INTO clubs (id, affiliation_number, display_name, is_archived) VALUES
  ('p2-club-bergheim', '', 'Bergheim', 0),
  ('p2-club-rosenau', '', 'Rosenau', 0),
  ('p2-club-illzach', '', 'Illzach', 0),
  ('p2-club-vittel', '', 'Vittel Saint Rémy', 0),
  ('p2-club-anould', '', 'Anould', 0),
  ('p2-club-troyes', '', 'Troyes', 0),
  ('p2-club-moussey', '', 'Moussey', 0),
  ('p2-club-benfeld', '', 'Benfeld', 0),
  ('p2-club-saintdie', '', 'Saint-Dié', 0),
  ('p2-club-colmarmjc', '', 'Colmar MJC', 0),
  ('p2-club-eloyes', '', 'Eloyes', 0),
  ('p2-club-mulhousett', '', 'Mulhouse TT', 0),
  ('p2-club-ingersheim', '', 'Ingersheim', 0),
  ('p2-club-colmaraje', '', 'Colmar AJE', 0),
  ('p2-club-soultz', '', 'Soultz', 0),
  ('p2-club-wintzenheim', '', 'Wintzenheim', 0),
  ('p2-club-staffelfelden', '', 'Staffelfelden', 0),
  ('p2-club-issenheim', '', 'Issenheim', 0),
  ('p2-club-wittelsheim', '', 'Wittelsheim', 0),
  ('p2-club-fcmulhouse', '', 'FC Mulhouse', 0),
  ('p2-club-huningue', '', 'Huningue', 0),
  ('p2-club-thann', '', 'Thann', 0),
  ('p2-club-wintzenfeld', '', 'Wintzenfeld', 0),
  ('p2-club-kembs', '', 'Kembs', 0),
  ('p2-club-ttmcensisheim', '', 'TTMC Ensisheim', 0),
  ('p2-club-ensisheim', '', 'Ensisheim', 0),
  ('p2-club-saintlouis', '', 'Saint-Louis', 0);

-- Opponent addresses (placeholder, one per club)
INSERT INTO club_addresses (id, club_id, label, street, postal_code, city, is_default) VALUES
  ('p2-addr-bergheim', 'p2-club-bergheim', 'Salle', '', '', 'Bergheim', 1),
  ('p2-addr-rosenau', 'p2-club-rosenau', 'Salle', '', '', 'Rosenau', 1),
  ('p2-addr-illzach', 'p2-club-illzach', 'Salle', '', '', 'Illzach', 1),
  ('p2-addr-vittel', 'p2-club-vittel', 'Salle', '', '', 'Vittel', 1),
  ('p2-addr-anould', 'p2-club-anould', 'Salle', '', '', 'Anould', 1),
  ('p2-addr-troyes', 'p2-club-troyes', 'Salle', '', '', 'Troyes', 1),
  ('p2-addr-moussey', 'p2-club-moussey', 'Salle', '', '', 'Moussey', 1),
  ('p2-addr-benfeld', 'p2-club-benfeld', 'Salle', '', '', 'Benfeld', 1),
  ('p2-addr-saintdie', 'p2-club-saintdie', 'Salle', '', '', 'Saint-Dié', 1),
  ('p2-addr-colmarmjc', 'p2-club-colmarmjc', 'Salle', '', '', 'Colmar', 1),
  ('p2-addr-eloyes', 'p2-club-eloyes', 'Salle', '', '', 'Eloyes', 1),
  ('p2-addr-mulhousett', 'p2-club-mulhousett', 'Salle', '', '', 'Mulhouse', 1),
  ('p2-addr-ingersheim', 'p2-club-ingersheim', 'Salle', '', '', 'Ingersheim', 1),
  ('p2-addr-colmaraje', 'p2-club-colmaraje', 'Salle', '', '', 'Colmar', 1),
  ('p2-addr-soultz', 'p2-club-soultz', 'Salle', '', '', 'Soultz', 1),
  ('p2-addr-wintzenheim', 'p2-club-wintzenheim', 'Salle', '', '', 'Wintzenheim', 1),
  ('p2-addr-staffelfelden', 'p2-club-staffelfelden', 'Salle', '', '', 'Staffelfelden', 1),
  ('p2-addr-issenheim', 'p2-club-issenheim', 'Salle', '', '', 'Issenheim', 1),
  ('p2-addr-wittelsheim', 'p2-club-wittelsheim', 'Salle', '', '', 'Wittelsheim', 1),
  ('p2-addr-fcmulhouse', 'p2-club-fcmulhouse', 'Salle', '', '', 'Mulhouse', 1),
  ('p2-addr-huningue', 'p2-club-huningue', 'Salle', '', '', 'Huningue', 1),
  ('p2-addr-thann', 'p2-club-thann', 'Salle', '', '', 'Thann', 1),
  ('p2-addr-wintzenfeld', 'p2-club-wintzenfeld', 'Salle', '', '', 'Wintzenfeld', 1),
  ('p2-addr-kembs', 'p2-club-kembs', 'Salle', '', '', 'Kembs', 1),
  ('p2-addr-ttmcensisheim', 'p2-club-ttmcensisheim', 'Salle', '', '', 'Ensisheim', 1),
  ('p2-addr-ensisheim', 'p2-club-ensisheim', 'Salle', '', '', 'Ensisheim', 1),
  ('p2-addr-saintlouis', 'p2-club-saintlouis', 'Salle', '', '', 'Saint-Louis', 1);

-- ============================================================
-- PPA RIXHEIM PLAYERS (club-1)
-- ============================================================

-- Equipe 1 (GEE)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-1', 'Gregory', 'Canaque', '425881', '', '', 'active', 'club-1', NULL),
  ('p2-player-2', 'Quentin', 'Colle', '8810008', '', '', 'active', 'club-1', NULL),
  ('p2-player-3', 'Stéphane', 'Lach', '681364', '', '', 'active', 'club-1', NULL),
  ('p2-player-4', 'Enzo', 'Lotz', '6716966', '', '', 'active', 'club-1', NULL),
  ('p2-player-5', 'Joris', 'Szulc', '686910', '', '', 'active', 'club-1', NULL);

-- Equipe 2 (GE1)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-6', 'Christian', 'Buchi', '6815117', '', '', 'active', 'club-1', NULL),
  ('p2-player-7', 'Hervé', 'Ceroni', '684545', '', '', 'active', 'club-1', NULL),
  ('p2-player-8', 'Cédric', 'Cunin', '6810711', '', '', 'active', 'club-1', NULL),
  ('p2-player-9', 'Fabrice', 'Dangelser', '682480', '', '', 'active', 'club-1', NULL),
  ('p2-player-10', 'Olivier', 'Philippe', '683975', '', '', 'active', 'club-1', NULL);

-- Equipe 3 (GE3)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-11', 'Nello', 'Cristini', '683787', '', '', 'active', 'club-1', NULL),
  ('p2-player-12', 'Sébastien', 'Rentz', '687433', '', '', 'active', 'club-1', NULL),
  ('p2-player-13', 'Sébastien', 'Schatt', '685143', '', '', 'active', 'club-1', NULL),
  ('p2-player-14', 'Yannick', 'Schill', '6814304', '', '', 'active', 'club-1', NULL);

-- Equipe 4 (GE6)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-15', 'Nicolas', 'Broglin', '6815877', '', '', 'active', 'club-1', NULL),
  ('p2-player-16', 'Didier', 'Clément', '392885', '', '', 'active', 'club-1', NULL),
  ('p2-player-17', 'Bastien', 'Dangelser', '684113', '', '', 'active', 'club-1', NULL),
  ('p2-player-18', 'Bertrand', 'De Courtpoint', '6813454', '', '', 'active', 'club-1', NULL),
  ('p2-player-19', 'Mathieu', 'Mougey', '6810243', '', '', 'active', 'club-1', NULL),
  ('p2-player-20', 'David', 'Schmitt', '6815675', '', '', 'active', 'club-1', NULL);

-- Equipe 5 (GE6)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-21', 'Abdelaziz', 'Arif', '9131446', '', '', 'active', 'club-1', NULL),
  ('p2-player-22', 'Patricia', 'De Pauli', '6812597', '', '', 'active', 'club-1', NULL),
  ('p2-player-23', 'Christophe', 'Heurtin', '6816317', '', '', 'active', 'club-1', NULL),
  ('p2-player-24', 'Gilles', 'Knobloch', '6814428', '', '', 'active', 'club-1', NULL),
  ('p2-player-25', 'Jordan', 'Presenli', '6718937', '', '', 'active', 'club-1', NULL),
  ('p2-player-26', 'Frédéric', 'Zilbermann', '689768', '', '', 'active', 'club-1', NULL);

-- Equipe 6 (GE7)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-27', 'Jacky', 'Antony', '6815563', '', '', 'active', 'club-1', NULL),
  ('p2-player-28', 'Stéphane', 'Donditz', '6816101', '', '', 'active', 'club-1', NULL),
  ('p2-player-29', 'Christophe', 'Hueber', '686956', '', '', 'active', 'club-1', NULL),
  ('p2-player-30', 'Jean-Claude', 'Lafluge', '68357', '', '', 'active', 'club-1', NULL),
  ('p2-player-31', 'Gilles', 'Metz', '6816164', '', '', 'active', 'club-1', NULL),
  ('p2-player-32', 'Vincent', 'Rambeau', '6815464', '', '', 'active', 'club-1', NULL);

-- Equipe 7 (GE7)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-33', 'Eric', 'Cavasino', '6815606', '', '', 'active', 'club-1', NULL),
  ('p2-player-34', 'Boris', 'Fessler', '6816176', '', '', 'active', 'club-1', NULL),
  ('p2-player-35', 'Luc', 'Guehl', '6816152', '', '', 'active', 'club-1', NULL),
  ('p2-player-36', 'Bruno', 'Lafont', '6816419', '', '', 'active', 'club-1', '500'),
  ('p2-player-37', 'Alain', 'Schillinger', '6816418', '', '', 'active', 'club-1', '500');

-- Equipe 8 (GE7)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-38', 'Quentin', 'Broglin', '6816118', '', '', 'active', 'club-1', NULL),
  ('p2-player-39', 'Samuel', 'Canemolla', '6816075', '', '', 'active', 'club-1', NULL),
  ('p2-player-40', 'Yvan', 'Meyer', '6815960', '', '', 'active', 'club-1', NULL),
  ('p2-player-41', 'Nathan', 'Moreau', '6816100', '', '', 'active', 'club-1', NULL),
  ('p2-player-42', 'Sacha', 'Petit', '6816097', '', '', 'active', 'club-1', NULL),
  ('p2-player-43', 'Léo', 'Remetter', '6815965', '', '', 'active', 'club-1', NULL),
  ('p2-player-44', 'Mathéo', 'Scremin', '6816084', '', '', 'active', 'club-1', NULL);

-- Remplaçants (no team assignment)
INSERT INTO players (id, first_name, last_name, license_number, email, phone, status, club_id, points) VALUES
  ('p2-player-45', 'Marie-Line', 'Wertenschlag', '686416', '', '', 'active', 'club-1', NULL);

-- ============================================================
-- PPA RIXHEIM TEAMS
-- ============================================================
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-team-1', 'club-1', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'addr-1', 'Samedi', '16h00', 'p2-player-1', '["p2-player-1","p2-player-2","p2-player-3","p2-player-4","p2-player-5"]', NULL, '#dc2626', NULL),
  ('p2-team-2', 'club-1', 'phase-2', 2, 'p2-div-ge1', 'p2-grp-ge1', 'addr-1', 'Samedi', '16h00', 'p2-player-6', '["p2-player-6","p2-player-7","p2-player-8","p2-player-9","p2-player-10"]', NULL, '#7f1d1d', NULL),
  ('p2-team-3', 'club-1', 'phase-2', 3, 'p2-div-ge3', 'p2-grp-ge3', 'addr-1', 'Samedi', '16h00', 'p2-player-11', '["p2-player-11","p2-player-12","p2-player-13","p2-player-14"]', NULL, '#ea580c', NULL),
  ('p2-team-4', 'club-1', 'phase-2', 4, 'p2-div-ge6', 'p2-grp-ge6a', 'addr-1', 'Jeudi', '19h30', 'p2-player-15', '["p2-player-15","p2-player-16","p2-player-17","p2-player-18","p2-player-19","p2-player-20"]', NULL, '#ca8a04', NULL),
  ('p2-team-5', 'club-1', 'phase-2', 5, 'p2-div-ge6', 'p2-grp-ge6b', 'addr-1', 'Jeudi', '20h00', 'p2-player-21', '["p2-player-21","p2-player-22","p2-player-23","p2-player-24","p2-player-25","p2-player-26"]', NULL, '#16a34a', NULL),
  ('p2-team-6', 'club-1', 'phase-2', 6, 'p2-div-ge7', 'p2-grp-ge7a', 'addr-1', 'Jeudi', '20h00', 'p2-player-27', '["p2-player-27","p2-player-28","p2-player-29","p2-player-30","p2-player-31","p2-player-32"]', NULL, '#ef4444', NULL),
  ('p2-team-7', 'club-1', 'phase-2', 7, 'p2-div-ge7', 'p2-grp-ge7b', 'addr-1', 'Samedi', '13h30', 'p2-player-33', '["p2-player-33","p2-player-34","p2-player-35","p2-player-36","p2-player-37"]', NULL, '#2563eb', NULL),
  ('p2-team-8', 'club-1', 'phase-2', 8, 'p2-div-ge7', 'p2-grp-ge7b', 'addr-1', 'Samedi', '13h30', 'p2-player-38', '["p2-player-38","p2-player-39","p2-player-40","p2-player-41","p2-player-42","p2-player-43","p2-player-44"]', NULL, '#7c3aed', NULL);

-- ============================================================
-- OPPONENT TEAMS
-- Each group has 8 teams total (PPA team(s) + opponents)
-- ============================================================

-- GEE group opponents (Team 1's group)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-bergheim-2', 'p2-club-bergheim', 'phase-2', 2, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-bergheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-rosenau-1', 'p2-club-rosenau', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-rosenau', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-illzach-2', 'p2-club-illzach', 'phase-2', 2, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-illzach', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-vittel-1', 'p2-club-vittel', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-vittel', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-anould-1', 'p2-club-anould', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-anould', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-troyes-1', 'p2-club-troyes', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-troyes', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-moussey-1', 'p2-club-moussey', 'phase-2', 1, 'p2-div-gee', 'p2-grp-gee', 'p2-addr-moussey', '', '', '', '[]', NULL, NULL, NULL);

-- GE1 group opponents (Team 2's group)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-anould-2', 'p2-club-anould', 'phase-2', 2, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-anould', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-benfeld-1', 'p2-club-benfeld', 'phase-2', 1, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-benfeld', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-saintdie-2', 'p2-club-saintdie', 'phase-2', 2, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-saintdie', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-vittel-2', 'p2-club-vittel', 'phase-2', 2, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-vittel', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-colmarmjc-2', 'p2-club-colmarmjc', 'phase-2', 2, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-colmarmjc', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-eloyes-1', 'p2-club-eloyes', 'phase-2', 1, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-eloyes', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-mulhousett-3', 'p2-club-mulhousett', 'phase-2', 3, 'p2-div-ge1', 'p2-grp-ge1', 'p2-addr-mulhousett', '', '', '', '[]', NULL, NULL, NULL);

-- GE3 group opponents (Team 3's group)
-- NOTE: J1 and J3 opponents are guesses — update if incorrect
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-colmarmjc-1', 'p2-club-colmarmjc', 'phase-2', 1, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-colmarmjc', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-ingersheim-1', 'p2-club-ingersheim', 'phase-2', 1, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-ingersheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-staffelfelden-1', 'p2-club-staffelfelden', 'phase-2', 1, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-staffelfelden', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-colmaraje-2', 'p2-club-colmaraje', 'phase-2', 2, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-colmaraje', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-soultz-1', 'p2-club-soultz', 'phase-2', 1, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-soultz', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-wintzenheim-1', 'p2-club-wintzenheim', 'phase-2', 1, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-wintzenheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-illzach-4', 'p2-club-illzach', 'phase-2', 4, 'p2-div-ge3', 'p2-grp-ge3', 'p2-addr-illzach', '', '', '', '[]', NULL, NULL, NULL);

-- GE6 group A opponents (Team 4's group)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-issenheim-2', 'p2-club-issenheim', 'phase-2', 2, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-issenheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-wittelsheim-4', 'p2-club-wittelsheim', 'phase-2', 4, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-wittelsheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-fcmulhouse-2', 'p2-club-fcmulhouse', 'phase-2', 2, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-fcmulhouse', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-huningue-3', 'p2-club-huningue', 'phase-2', 3, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-huningue', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-thann-3', 'p2-club-thann', 'phase-2', 3, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-thann', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-wintzenfeld-3', 'p2-club-wintzenfeld', 'phase-2', 3, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-wintzenfeld', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-kembs-2', 'p2-club-kembs', 'phase-2', 2, 'p2-div-ge6', 'p2-grp-ge6a', 'p2-addr-kembs', '', '', '', '[]', NULL, NULL, NULL);

-- GE6 group B opponents (Team 5's group)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-rosenau-6', 'p2-club-rosenau', 'phase-2', 6, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-rosenau', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-ttmcensisheim-1', 'p2-club-ttmcensisheim', 'phase-2', 1, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-ttmcensisheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-kembs-3', 'p2-club-kembs', 'phase-2', 3, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-kembs', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-soultz-4', 'p2-club-soultz', 'phase-2', 4, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-soultz', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-mulhousett-6', 'p2-club-mulhousett', 'phase-2', 6, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-mulhousett', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-issenheim-3', 'p2-club-issenheim', 'phase-2', 3, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-issenheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-wittelsheim-5', 'p2-club-wittelsheim', 'phase-2', 5, 'p2-div-ge6', 'p2-grp-ge6b', 'p2-addr-wittelsheim', '', '', '', '[]', NULL, NULL, NULL);

-- GE7 group A opponents (Team 6's group)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-fcmulhouse-3', 'p2-club-fcmulhouse', 'phase-2', 3, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-fcmulhouse', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-illzach-9', 'p2-club-illzach', 'phase-2', 9, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-illzach', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-kembs-4', 'p2-club-kembs', 'phase-2', 4, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-kembs', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-thann-5', 'p2-club-thann', 'phase-2', 5, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-thann', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-mulhousett-7', 'p2-club-mulhousett', 'phase-2', 7, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-mulhousett', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-issenheim-4', 'p2-club-issenheim', 'phase-2', 4, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-issenheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-ensisheim-2', 'p2-club-ensisheim', 'phase-2', 2, 'p2-div-ge7', 'p2-grp-ge7a', 'p2-addr-ensisheim', '', '', '', '[]', NULL, NULL, NULL);

-- GE7 group B opponents (Teams 7 & 8's group — 6 opponents since 2 PPA teams)
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('p2-opp-saintlouis-3', 'p2-club-saintlouis', 'phase-2', 3, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-saintlouis', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-huningue-4', 'p2-club-huningue', 'phase-2', 4, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-huningue', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-kembs-5', 'p2-club-kembs', 'phase-2', 5, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-kembs', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-issenheim-6', 'p2-club-issenheim', 'phase-2', 6, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-issenheim', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-rosenau-7', 'p2-club-rosenau', 'phase-2', 7, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-rosenau', '', '', '', '[]', NULL, NULL, NULL),
  ('p2-opp-illzach-11', 'p2-club-illzach', 'phase-2', 11, 'p2-div-ge7', 'p2-grp-ge7b', 'p2-addr-illzach', '', '', '', '[]', NULL, NULL, NULL);

-- ============================================================
-- GROUPS (with all team IDs)
-- ============================================================
INSERT INTO groups_tbl (id, division_id, number, team_ids) VALUES
  ('p2-grp-gee', 'p2-div-gee', 1, '["p2-team-1","p2-opp-bergheim-2","p2-opp-rosenau-1","p2-opp-illzach-2","p2-opp-vittel-1","p2-opp-anould-1","p2-opp-troyes-1","p2-opp-moussey-1"]'),
  ('p2-grp-ge1', 'p2-div-ge1', 1, '["p2-team-2","p2-opp-anould-2","p2-opp-benfeld-1","p2-opp-saintdie-2","p2-opp-vittel-2","p2-opp-colmarmjc-2","p2-opp-eloyes-1","p2-opp-mulhousett-3"]'),
  ('p2-grp-ge3', 'p2-div-ge3', 1, '["p2-team-3","p2-opp-colmarmjc-1","p2-opp-ingersheim-1","p2-opp-staffelfelden-1","p2-opp-colmaraje-2","p2-opp-soultz-1","p2-opp-wintzenheim-1","p2-opp-illzach-4"]'),
  ('p2-grp-ge6a', 'p2-div-ge6', 1, '["p2-team-4","p2-opp-issenheim-2","p2-opp-wittelsheim-4","p2-opp-fcmulhouse-2","p2-opp-huningue-3","p2-opp-thann-3","p2-opp-wintzenfeld-3","p2-opp-kembs-2"]'),
  ('p2-grp-ge6b', 'p2-div-ge6', 2, '["p2-team-5","p2-opp-rosenau-6","p2-opp-ttmcensisheim-1","p2-opp-kembs-3","p2-opp-soultz-4","p2-opp-mulhousett-6","p2-opp-issenheim-3","p2-opp-wittelsheim-5"]'),
  ('p2-grp-ge7a', 'p2-div-ge7', 1, '["p2-team-6","p2-opp-fcmulhouse-3","p2-opp-illzach-9","p2-opp-kembs-4","p2-opp-thann-5","p2-opp-mulhousett-7","p2-opp-issenheim-4","p2-opp-ensisheim-2"]'),
  ('p2-grp-ge7b', 'p2-div-ge7', 2, '["p2-team-7","p2-team-8","p2-opp-saintlouis-3","p2-opp-huningue-4","p2-opp-kembs-5","p2-opp-issenheim-6","p2-opp-rosenau-7","p2-opp-illzach-11"]');

-- ============================================================
-- MATCH DAYS (7 per group)
-- ============================================================

-- GEE (Saturdays)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-gee-1', 'p2-grp-gee', 1, '2026-02-07'),
  ('p2-md-gee-2', 'p2-grp-gee', 2, '2026-03-07'),
  ('p2-md-gee-3', 'p2-grp-gee', 3, '2026-03-21'),
  ('p2-md-gee-4', 'p2-grp-gee', 4, '2026-04-11'),
  ('p2-md-gee-5', 'p2-grp-gee', 5, '2026-05-09'),
  ('p2-md-gee-6', 'p2-grp-gee', 6, '2026-05-30'),
  ('p2-md-gee-7', 'p2-grp-gee', 7, '2026-06-06');

-- GE1 (Saturdays)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge1-1', 'p2-grp-ge1', 1, '2026-02-07'),
  ('p2-md-ge1-2', 'p2-grp-ge1', 2, '2026-03-07'),
  ('p2-md-ge1-3', 'p2-grp-ge1', 3, '2026-03-21'),
  ('p2-md-ge1-4', 'p2-grp-ge1', 4, '2026-04-11'),
  ('p2-md-ge1-5', 'p2-grp-ge1', 5, '2026-05-09'),
  ('p2-md-ge1-6', 'p2-grp-ge1', 6, '2026-05-30'),
  ('p2-md-ge1-7', 'p2-grp-ge1', 7, '2026-06-06');

-- GE3 (Saturdays, J4 Sunday)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge3-1', 'p2-grp-ge3', 1, '2026-02-07'),
  ('p2-md-ge3-2', 'p2-grp-ge3', 2, '2026-03-07'),
  ('p2-md-ge3-3', 'p2-grp-ge3', 3, '2026-03-21'),
  ('p2-md-ge3-4', 'p2-grp-ge3', 4, '2026-04-12'),
  ('p2-md-ge3-5', 'p2-grp-ge3', 5, '2026-05-09'),
  ('p2-md-ge3-6', 'p2-grp-ge3', 6, '2026-05-30'),
  ('p2-md-ge3-7', 'p2-grp-ge3', 7, '2026-06-06');

-- GE6a (mixed days)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge6a-1', 'p2-grp-ge6a', 1, '2026-02-05'),
  ('p2-md-ge6a-2', 'p2-grp-ge6a', 2, '2026-03-07'),
  ('p2-md-ge6a-3', 'p2-grp-ge6a', 3, '2026-03-19'),
  ('p2-md-ge6a-4', 'p2-grp-ge6a', 4, '2026-04-09'),
  ('p2-md-ge6a-5', 'p2-grp-ge6a', 5, '2026-05-07'),
  ('p2-md-ge6a-6', 'p2-grp-ge6a', 6, '2026-05-28'),
  ('p2-md-ge6a-7', 'p2-grp-ge6a', 7, '2026-06-04');

-- GE6b (mixed days)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge6b-1', 'p2-grp-ge6b', 1, '2026-02-05'),
  ('p2-md-ge6b-2', 'p2-grp-ge6b', 2, '2026-03-07'),
  ('p2-md-ge6b-3', 'p2-grp-ge6b', 3, '2026-03-17'),
  ('p2-md-ge6b-4', 'p2-grp-ge6b', 4, '2026-04-11'),
  ('p2-md-ge6b-5', 'p2-grp-ge6b', 5, '2026-05-08'),
  ('p2-md-ge6b-6', 'p2-grp-ge6b', 6, '2026-05-30'),
  ('p2-md-ge6b-7', 'p2-grp-ge6b', 7, '2026-06-04');

-- GE7a (mixed days)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge7a-1', 'p2-grp-ge7a', 1, '2026-02-05'),
  ('p2-md-ge7a-2', 'p2-grp-ge7a', 2, '2026-03-05'),
  ('p2-md-ge7a-3', 'p2-grp-ge7a', 3, '2026-03-17'),
  ('p2-md-ge7a-4', 'p2-grp-ge7a', 4, '2026-04-09'),
  ('p2-md-ge7a-5', 'p2-grp-ge7a', 5, '2026-05-08'),
  ('p2-md-ge7a-6', 'p2-grp-ge7a', 6, '2026-05-29'),
  ('p2-md-ge7a-7', 'p2-grp-ge7a', 7, '2026-06-06');

-- GE7b (mixed days — Teams 7 & 8 share this group)
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('p2-md-ge7b-1', 'p2-grp-ge7b', 1, '2026-02-07'),
  ('p2-md-ge7b-2', 'p2-grp-ge7b', 2, '2026-03-03'),
  ('p2-md-ge7b-3', 'p2-grp-ge7b', 3, '2026-03-19'),
  ('p2-md-ge7b-4', 'p2-grp-ge7b', 4, '2026-04-07'),
  ('p2-md-ge7b-5', 'p2-grp-ge7b', 5, '2026-05-07'),
  ('p2-md-ge7b-6', 'p2-grp-ge7b', 6, '2026-05-28'),
  ('p2-md-ge7b-7', 'p2-grp-ge7b', 7, '2026-06-04');

-- ============================================================
-- GAMES (PPA Rixheim games only, alternating home/away)
-- ============================================================

-- Team 1 (GEE) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t1-j1', 'p2-md-gee-1', 'p2-team-1', 'p2-opp-bergheim-2', '16h00'),
  ('p2-game-t1-j2', 'p2-md-gee-2', 'p2-opp-rosenau-1', 'p2-team-1', '16h00'),
  ('p2-game-t1-j3', 'p2-md-gee-3', 'p2-team-1', 'p2-opp-illzach-2', '16h00'),
  ('p2-game-t1-j4', 'p2-md-gee-4', 'p2-opp-vittel-1', 'p2-team-1', '16h00'),
  ('p2-game-t1-j5', 'p2-md-gee-5', 'p2-team-1', 'p2-opp-anould-1', '16h00'),
  ('p2-game-t1-j6', 'p2-md-gee-6', 'p2-opp-troyes-1', 'p2-team-1', '16h00'),
  ('p2-game-t1-j7', 'p2-md-gee-7', 'p2-team-1', 'p2-opp-moussey-1', '16h00');

-- Team 2 (GE1) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t2-j1', 'p2-md-ge1-1', 'p2-team-2', 'p2-opp-anould-2', '16h00'),
  ('p2-game-t2-j2', 'p2-md-ge1-2', 'p2-opp-benfeld-1', 'p2-team-2', '16h00'),
  ('p2-game-t2-j3', 'p2-md-ge1-3', 'p2-team-2', 'p2-opp-saintdie-2', '16h00'),
  ('p2-game-t2-j4', 'p2-md-ge1-4', 'p2-opp-vittel-2', 'p2-team-2', '16h00'),
  ('p2-game-t2-j5', 'p2-md-ge1-5', 'p2-team-2', 'p2-opp-colmarmjc-2', '16h00'),
  ('p2-game-t2-j6', 'p2-md-ge1-6', 'p2-opp-eloyes-1', 'p2-team-2', '16h00'),
  ('p2-game-t2-j7', 'p2-md-ge1-7', 'p2-team-2', 'p2-opp-mulhousett-3', '16h00');

-- Team 3 (GE3) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t3-j1', 'p2-md-ge3-1', 'p2-team-3', 'p2-opp-colmarmjc-1', '16h00'),
  ('p2-game-t3-j2', 'p2-md-ge3-2', 'p2-opp-ingersheim-1', 'p2-team-3', '16h00'),
  ('p2-game-t3-j3', 'p2-md-ge3-3', 'p2-team-3', 'p2-opp-staffelfelden-1', '16h00'),
  ('p2-game-t3-j4', 'p2-md-ge3-4', 'p2-opp-colmaraje-2', 'p2-team-3', '9h30'),
  ('p2-game-t3-j5', 'p2-md-ge3-5', 'p2-team-3', 'p2-opp-soultz-1', '16h00'),
  ('p2-game-t3-j6', 'p2-md-ge3-6', 'p2-opp-wintzenheim-1', 'p2-team-3', '16h00'),
  ('p2-game-t3-j7', 'p2-md-ge3-7', 'p2-team-3', 'p2-opp-illzach-4', '16h00');

-- Team 4 (GE6a) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t4-j1', 'p2-md-ge6a-1', 'p2-team-4', 'p2-opp-issenheim-2', '19h30'),
  ('p2-game-t4-j2', 'p2-md-ge6a-2', 'p2-opp-wittelsheim-4', 'p2-team-4', '16h00'),
  ('p2-game-t4-j3', 'p2-md-ge6a-3', 'p2-team-4', 'p2-opp-fcmulhouse-2', '19h30'),
  ('p2-game-t4-j4', 'p2-md-ge6a-4', 'p2-opp-huningue-3', 'p2-team-4', '20h00'),
  ('p2-game-t4-j5', 'p2-md-ge6a-5', 'p2-team-4', 'p2-opp-thann-3', '19h30'),
  ('p2-game-t4-j6', 'p2-md-ge6a-6', 'p2-opp-wintzenfeld-3', 'p2-team-4', '19h30'),
  ('p2-game-t4-j7', 'p2-md-ge6a-7', 'p2-team-4', 'p2-opp-kembs-2', '20h30');

-- Team 5 (GE6b) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t5-j1', 'p2-md-ge6b-1', 'p2-team-5', 'p2-opp-rosenau-6', '20h00'),
  ('p2-game-t5-j2', 'p2-md-ge6b-2', 'p2-opp-ttmcensisheim-1', 'p2-team-5', '13h30'),
  ('p2-game-t5-j3', 'p2-md-ge6b-3', 'p2-team-5', 'p2-opp-kembs-3', '20h30'),
  ('p2-game-t5-j4', 'p2-md-ge6b-4', 'p2-opp-soultz-4', 'p2-team-5', '16h00'),
  ('p2-game-t5-j5', 'p2-md-ge6b-5', 'p2-team-5', 'p2-opp-mulhousett-6', '20h00'),
  ('p2-game-t5-j6', 'p2-md-ge6b-6', 'p2-opp-issenheim-3', 'p2-team-5', '16h00'),
  ('p2-game-t5-j7', 'p2-md-ge6b-7', 'p2-team-5', 'p2-opp-wittelsheim-5', '19h30');

-- Team 6 (GE7a) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t6-j1', 'p2-md-ge7a-1', 'p2-team-6', 'p2-opp-fcmulhouse-3', '20h00'),
  ('p2-game-t6-j2', 'p2-md-ge7a-2', 'p2-opp-illzach-9', 'p2-team-6', '19h30'),
  ('p2-game-t6-j3', 'p2-md-ge7a-3', 'p2-team-6', 'p2-opp-kembs-4', '20h30'),
  ('p2-game-t6-j4', 'p2-md-ge7a-4', 'p2-opp-thann-5', 'p2-team-6', '19h30'),
  ('p2-game-t6-j5', 'p2-md-ge7a-5', 'p2-team-6', 'p2-opp-mulhousett-7', '20h00'),
  ('p2-game-t6-j6', 'p2-md-ge7a-6', 'p2-opp-issenheim-4', 'p2-team-6', '20h00'),
  ('p2-game-t6-j7', 'p2-md-ge7a-7', 'p2-team-6', 'p2-opp-ensisheim-2', '16h00');

-- Team 7 (GE7b) games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t7-j1', 'p2-md-ge7b-1', 'p2-team-8', 'p2-team-7', '13h30'),
  ('p2-game-t7-j2', 'p2-md-ge7b-2', 'p2-opp-saintlouis-3', 'p2-team-7', '20h00'),
  ('p2-game-t7-j3', 'p2-md-ge7b-3', 'p2-team-7', 'p2-opp-huningue-4', '19h30'),
  ('p2-game-t7-j4', 'p2-md-ge7b-4', 'p2-opp-kembs-5', 'p2-team-7', '20h30'),
  ('p2-game-t7-j5', 'p2-md-ge7b-5', 'p2-team-7', 'p2-opp-issenheim-6', '19h30'),
  ('p2-game-t7-j6', 'p2-md-ge7b-6', 'p2-opp-rosenau-7', 'p2-team-7', '20h00'),
  ('p2-game-t7-j7', 'p2-md-ge7b-7', 'p2-team-7', 'p2-opp-illzach-11', '19h30');

-- Team 8 (GE7b) games (J1 already covered above as t7-j1)
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('p2-game-t8-j2', 'p2-md-ge7b-2', 'p2-team-8', 'p2-opp-issenheim-6', '16h00'),
  ('p2-game-t8-j3', 'p2-md-ge7b-3', 'p2-opp-saintlouis-3', 'p2-team-8', '13h30'),
  ('p2-game-t8-j4', 'p2-md-ge7b-4', 'p2-team-8', 'p2-opp-rosenau-7', '20h00'),
  ('p2-game-t8-j5', 'p2-md-ge7b-5', 'p2-opp-huningue-4', 'p2-team-8', '13h30'),
  ('p2-game-t8-j6', 'p2-md-ge7b-6', 'p2-team-8', 'p2-opp-illzach-11', '20h00'),
  ('p2-game-t8-j7', 'p2-md-ge7b-7', 'p2-opp-kembs-5', 'p2-team-8', '20h00');
