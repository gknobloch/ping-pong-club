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
  ('div-3', 'phase-1', 'GE3', 3, 4);

-- clubs
INSERT INTO clubs (id, affiliation_number, display_name) VALUES
  ('club-1', '06680011', 'PPA Rixheim'),
  ('club-2', '06680022', 'TT Mulhouse'),
  ('club-3', '06680033', 'TT Bergheim'),
  ('club-4', '06680044', 'AS Wittelsheim'),
  ('club-5', '06680055', 'TT Anould'),
  ('club-6', '06680066', 'TT Staffelfelden'),
  ('club-7', '06680077', 'TT Bitschwiller'),
  ('club-8', '06680088', 'TT Cernay');

-- club_addresses
INSERT INTO club_addresses (id, club_id, label, street, postal_code, city, is_default) VALUES
  ('addr-1', 'club-1', 'Gymnase principal', '12 rue du Sport', '68170', 'Rixheim', 1),
  ('addr-2', 'club-1', 'Salle annexe', '5 avenue des Lilas', '68170', 'Rixheim', 0),
  ('addr-3', 'club-2', 'Salle Omnisports', '1 place de la République', '68100', 'Mulhouse', 1),
  ('addr-4', 'club-3', 'Gymnase', '1 rue du Stade', '68750', 'Bergheim', 1),
  ('addr-5', 'club-4', 'Salle', '2 ave des Sports', '68270', 'Wittelsheim', 1),
  ('addr-6', 'club-5', 'Gymnase', '3 rue Principale', '67130', 'Anould', 1),
  ('addr-7', 'club-6', 'Salle', '4 place du Jeu', '68850', 'Staffelfelden', 1),
  ('addr-8', 'club-7', 'Gymnase', '5 rue du Sport', '68220', 'Bitschwiller', 1),
  ('addr-9', 'club-8', 'Salle', '6 rue des Lilas', '68700', 'Cernay', 1);

-- groups_tbl
INSERT INTO groups_tbl (id, division_id, number, team_ids) VALUES
  ('group-1', 'div-1', 1, '["team-1","team-2","team-3","team-4","team-5","team-6","team-7","team-8"]'),
  ('group-2', 'div-2', 1, '["team-9","team-10","team-11","team-12"]'),
  ('group-3', 'div-3', 1, '["team-13","team-14","team-15","team-16","team-17","team-18","team-19","team-20"]');

-- players
INSERT INTO players (id, first_name, last_name, license_number, email, phone, birth_date, birth_place, status, club_id, points) VALUES
  ('player-1', 'Marie', 'Dupont', '6814426', 'marie.dupont@example.com', '06 12 34 56 78', NULL, NULL, 'active', 'club-1', NULL),
  ('player-2', 'Jean', 'Martin', '6814427', 'jean.martin@example.com', '06 23 45 67 89', NULL, NULL, 'active', 'club-2', NULL),
  ('player-3', 'Sophie', 'Bernard', '6814428', 'sophie.bernard@example.com', '06 34 56 78 90', NULL, NULL, 'active', 'club-1', NULL),
  ('player-4', 'Pierre', 'Leroy', '6814429', 'pierre.leroy@example.com', '06 45 67 89 01', NULL, NULL, 'active', 'club-1', NULL),
  ('player-5', 'Admin', 'Global', '0000001', 'admin@example.com', '', NULL, NULL, 'active', '', NULL),
  ('player-6', 'Claire', 'Admin', '0000002', 'club.admin@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-7', 'Lucas', 'Bergheim', '6814430', 'lucas@bergheim.example.com', '', NULL, NULL, 'active', 'club-3', NULL),
  ('player-8', 'Emma', 'Bergheim', '6814431', 'emma@bergheim.example.com', '', NULL, NULL, 'active', 'club-3', NULL),
  ('player-9', 'Hugo', 'Wittelsheim', '6814432', 'hugo@wittelsheim.example.com', '', NULL, NULL, 'active', 'club-4', NULL),
  ('player-10', 'Léa', 'Wittelsheim', '6814433', 'lea@wittelsheim.example.com', '', NULL, NULL, 'active', 'club-4', NULL),
  ('player-11', 'Raphaël', 'Anould', '6814434', 'raphael@anould.example.com', '', NULL, NULL, 'active', 'club-5', NULL),
  ('player-12', 'Chloé', 'Anould', '6814435', 'chloe@anould.example.com', '', NULL, NULL, 'active', 'club-5', NULL),
  ('player-13', 'Nathan', 'Staffelfelden', '6814436', 'nathan@staffelfelden.example.com', '', NULL, NULL, 'active', 'club-6', NULL),
  ('player-14', 'Manon', 'Staffelfelden', '6814437', 'manon@staffelfelden.example.com', '', NULL, NULL, 'active', 'club-6', NULL),
  ('player-15', 'Tom', 'Bitschwiller', '6814438', 'tom@bitschwiller.example.com', '', NULL, NULL, 'active', 'club-7', NULL),
  ('player-16', 'Julie', 'Bitschwiller', '6814439', 'julie@bitschwiller.example.com', '', NULL, NULL, 'active', 'club-7', NULL),
  ('player-17', 'Noah', 'Cernay', '6814440', 'noah@cernay.example.com', '', NULL, NULL, 'active', 'club-8', NULL),
  ('player-18', 'Jade', 'Cernay', '6814441', 'jade@cernay.example.com', '', NULL, NULL, 'active', 'club-8', NULL),
  ('player-19', 'Inès', 'Rixheim', '6814442', 'ines@rixheim.example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-20', 'Thomas', 'Weber', '6814443', 'thomas.weber@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-21', 'Camille', 'Schmitt', '6814444', 'camille.schmitt@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-22', 'Maxime', 'Keller', '6814445', 'maxime.keller@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-23', 'Léonie', 'Muller', '6814446', 'leonie.muller@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-24', 'Antoine', 'Fischer', '6814447', 'antoine.fischer@example.com', '', NULL, NULL, 'active', 'club-1', NULL),
  ('player-25', 'Lucie', 'Meyer', '6814448', 'lucie.meyer@example.com', '', NULL, NULL, 'active', 'club-1', NULL);

-- teams
INSERT INTO teams (id, club_id, phase_id, number, division_id, group_id, game_location_id, default_day, default_time, captain_id, player_ids, roster_initial_points, color, whatsapp_link) VALUES
  ('team-1', 'club-1', 'phase-1', 1, 'div-1', 'group-1', 'addr-1', 'Jeudi', '20h00', 'player-1', '["player-1","player-3","player-4"]', '{"player-1":"850","player-3":"720","player-4":"680"}', '#374151', NULL),
  ('team-2', 'club-2', 'phase-1', 1, 'div-1', 'group-1', 'addr-3', 'Mercredi', '19h30', 'player-2', '["player-2"]', NULL, '#b91c1c', NULL),
  ('team-3', 'club-3', 'phase-1', 1, 'div-1', 'group-1', 'addr-4', 'Mardi', '20h00', 'player-7', '["player-7","player-8"]', NULL, '#15803d', NULL),
  ('team-4', 'club-4', 'phase-1', 1, 'div-1', 'group-1', 'addr-5', 'Mercredi', '19h30', 'player-9', '["player-9","player-10"]', NULL, '#c2410c', NULL),
  ('team-5', 'club-5', 'phase-1', 1, 'div-1', 'group-1', 'addr-6', 'Jeudi', '20h00', 'player-11', '["player-11","player-12"]', NULL, '#1d4ed8', NULL),
  ('team-6', 'club-6', 'phase-1', 1, 'div-1', 'group-1', 'addr-7', 'Vendredi', '19h00', 'player-13', '["player-13","player-14"]', NULL, '#7c2d12', NULL),
  ('team-7', 'club-7', 'phase-1', 1, 'div-1', 'group-1', 'addr-8', 'Lundi', '20h00', 'player-15', '["player-15","player-16"]', NULL, '#4f46e5', NULL),
  ('team-8', 'club-8', 'phase-1', 1, 'div-1', 'group-1', 'addr-9', 'Mercredi', '20h00', 'player-17', '["player-17","player-18"]', NULL, '#0d9488', NULL),
  ('team-9', 'club-1', 'phase-1', 2, 'div-2', 'group-2', 'addr-1', 'Jeudi', '20h00', 'player-6', '["player-6","player-19"]', '{"player-6":"920","player-19":"650"}', '#65a30d', NULL),
  ('team-10', 'club-2', 'phase-1', 2, 'div-2', 'group-2', 'addr-3', 'Mercredi', '19h30', 'player-2', '["player-2"]', NULL, '#dc2626', NULL),
  ('team-11', 'club-3', 'phase-1', 2, 'div-2', 'group-2', 'addr-4', 'Mardi', '20h00', 'player-8', '["player-8"]', NULL, '#059669', NULL),
  ('team-12', 'club-4', 'phase-1', 2, 'div-2', 'group-2', 'addr-5', 'Mercredi', '19h30', 'player-10', '["player-10"]', NULL, '#ea580c', NULL),
  ('team-13', 'club-1', 'phase-1', 3, 'div-3', 'group-3', 'addr-1', 'Vendredi', '20h00', 'player-20', '["player-20","player-21","player-22"]', '{"player-20":"580","player-21":"540","player-22":"510"}', '#0891b2', NULL),
  ('team-14', 'club-5', 'phase-1', 2, 'div-3', 'group-3', 'addr-6', 'Jeudi', '20h00', 'player-12', '["player-12"]', NULL, '#2563eb', NULL),
  ('team-15', 'club-6', 'phase-1', 2, 'div-3', 'group-3', 'addr-7', 'Vendredi', '19h00', 'player-14', '["player-14"]', NULL, '#92400e', NULL),
  ('team-16', 'club-7', 'phase-1', 2, 'div-3', 'group-3', 'addr-8', 'Lundi', '20h00', 'player-16', '["player-16"]', NULL, '#6366f1', NULL),
  ('team-17', 'club-1', 'phase-1', 4, 'div-3', 'group-3', 'addr-2', 'Lundi', '20h00', 'player-23', '["player-23","player-24","player-25"]', '{"player-23":"500","player-24":"480","player-25":"450"}', '#be185d', NULL),
  ('team-18', 'club-2', 'phase-1', 3, 'div-3', 'group-3', 'addr-3', 'Mercredi', '19h30', 'player-2', '["player-2"]', NULL, '#e11d48', NULL),
  ('team-19', 'club-3', 'phase-1', 3, 'div-3', 'group-3', 'addr-4', 'Mardi', '20h00', 'player-7', '["player-7"]', NULL, '#16a34a', NULL),
  ('team-20', 'club-8', 'phase-1', 2, 'div-3', 'group-3', 'addr-9', 'Mercredi', '20h00', 'player-18', '["player-18"]', NULL, '#0f766e', NULL);

-- match_days
INSERT INTO match_days (id, group_id, number, date) VALUES
  ('md-1', 'group-1', 1, '2025-10-02'),
  ('md-2', 'group-1', 2, '2025-10-09'),
  ('md-3', 'group-1', 3, '2025-10-16'),
  ('md-4', 'group-1', 4, '2025-10-23'),
  ('md-5', 'group-1', 5, '2025-10-30'),
  ('md-6', 'group-1', 6, '2025-11-06'),
  ('md-7', 'group-1', 7, '2025-11-13'),
  ('md-g2-1', 'group-2', 1, '2025-10-02'),
  ('md-g2-2', 'group-2', 2, '2025-10-09'),
  ('md-g2-3', 'group-2', 3, '2025-10-16'),
  ('md-g3-1', 'group-3', 1, '2025-10-03'),
  ('md-g3-2', 'group-3', 2, '2025-10-10'),
  ('md-g3-3', 'group-3', 3, '2025-10-17'),
  ('md-g3-4', 'group-3', 4, '2025-10-24'),
  ('md-g3-5', 'group-3', 5, '2025-10-31'),
  ('md-g3-6', 'group-3', 6, '2025-11-07'),
  ('md-g3-7', 'group-3', 7, '2025-11-14');

-- games
INSERT INTO games (id, match_day_id, home_team_id, away_team_id, time) VALUES
  ('game-1', 'md-1', 'team-1', 'team-2', NULL),
  ('game-2', 'md-1', 'team-3', 'team-4', NULL),
  ('game-3', 'md-1', 'team-5', 'team-6', NULL),
  ('game-4', 'md-1', 'team-7', 'team-8', NULL),
  ('game-5', 'md-2', 'team-1', 'team-3', NULL),
  ('game-6', 'md-2', 'team-2', 'team-4', NULL),
  ('game-7', 'md-2', 'team-5', 'team-7', NULL),
  ('game-8', 'md-2', 'team-6', 'team-8', NULL),
  ('game-9', 'md-3', 'team-1', 'team-4', NULL),
  ('game-10', 'md-3', 'team-2', 'team-3', NULL),
  ('game-11', 'md-3', 'team-5', 'team-8', NULL),
  ('game-12', 'md-3', 'team-6', 'team-7', NULL),
  ('game-13', 'md-4', 'team-1', 'team-5', NULL),
  ('game-14', 'md-4', 'team-2', 'team-6', NULL),
  ('game-15', 'md-4', 'team-3', 'team-7', NULL),
  ('game-16', 'md-4', 'team-4', 'team-8', NULL),
  ('game-17', 'md-5', 'team-1', 'team-6', NULL),
  ('game-18', 'md-5', 'team-2', 'team-5', NULL),
  ('game-19', 'md-5', 'team-3', 'team-8', NULL),
  ('game-20', 'md-5', 'team-4', 'team-7', NULL),
  ('game-21', 'md-6', 'team-1', 'team-7', NULL),
  ('game-22', 'md-6', 'team-2', 'team-8', NULL),
  ('game-23', 'md-6', 'team-3', 'team-5', NULL),
  ('game-24', 'md-6', 'team-4', 'team-6', NULL),
  ('game-25', 'md-7', 'team-1', 'team-8', '20h00'),
  ('game-26', 'md-7', 'team-2', 'team-7', '19h30'),
  ('game-27', 'md-7', 'team-3', 'team-6', '20h00'),
  ('game-28', 'md-7', 'team-4', 'team-5', '19h30'),
  ('game-29', 'md-g2-1', 'team-9', 'team-10', NULL),
  ('game-30', 'md-g2-1', 'team-11', 'team-12', NULL),
  ('game-31', 'md-g2-2', 'team-9', 'team-11', NULL),
  ('game-32', 'md-g2-2', 'team-10', 'team-12', NULL),
  ('game-33', 'md-g2-3', 'team-9', 'team-12', NULL),
  ('game-34', 'md-g2-3', 'team-10', 'team-11', NULL),
  ('game-35', 'md-g3-1', 'team-13', 'team-17', NULL),
  ('game-36', 'md-g3-1', 'team-14', 'team-18', NULL),
  ('game-37', 'md-g3-1', 'team-15', 'team-19', NULL),
  ('game-38', 'md-g3-1', 'team-16', 'team-20', NULL),
  ('game-39', 'md-g3-2', 'team-13', 'team-14', NULL),
  ('game-40', 'md-g3-2', 'team-15', 'team-17', NULL),
  ('game-41', 'md-g3-2', 'team-16', 'team-18', NULL),
  ('game-42', 'md-g3-2', 'team-19', 'team-20', NULL),
  ('game-43', 'md-g3-3', 'team-13', 'team-15', NULL),
  ('game-44', 'md-g3-3', 'team-14', 'team-16', NULL),
  ('game-45', 'md-g3-3', 'team-17', 'team-19', NULL),
  ('game-46', 'md-g3-3', 'team-18', 'team-20', NULL),
  ('game-47', 'md-g3-4', 'team-13', 'team-16', NULL),
  ('game-48', 'md-g3-4', 'team-14', 'team-15', NULL),
  ('game-49', 'md-g3-4', 'team-17', 'team-20', NULL),
  ('game-50', 'md-g3-4', 'team-18', 'team-19', NULL),
  ('game-51', 'md-g3-5', 'team-13', 'team-18', NULL),
  ('game-52', 'md-g3-5', 'team-14', 'team-17', NULL),
  ('game-53', 'md-g3-5', 'team-15', 'team-20', NULL),
  ('game-54', 'md-g3-5', 'team-16', 'team-19', NULL),
  ('game-55', 'md-g3-6', 'team-13', 'team-19', NULL),
  ('game-56', 'md-g3-6', 'team-14', 'team-20', NULL),
  ('game-57', 'md-g3-6', 'team-15', 'team-18', NULL),
  ('game-58', 'md-g3-6', 'team-16', 'team-17', NULL),
  ('game-59', 'md-g3-7', 'team-13', 'team-20', NULL),
  ('game-60', 'md-g3-7', 'team-14', 'team-19', NULL),
  ('game-61', 'md-g3-7', 'team-15', 'team-16', NULL),
  ('game-62', 'md-g3-7', 'team-17', 'team-18', NULL);

-- users
INSERT INTO users (id, email, role, player_id, club_ids, captain_team_ids) VALUES
  ('user-1', 'admin@example.com', 'general_admin', 'player-5', '[]', '[]'),
  ('user-2', 'club.admin@example.com', 'club_admin', 'player-6', '["club-1"]', '[]'),
  ('user-3', 'marie.dupont@example.com', 'captain', 'player-1', '["club-1"]', '["team-1"]'),
  ('user-4', 'jean.martin@example.com', 'player', 'player-2', '["club-1"]', '[]'),
  ('user-5', 'sophie.bernard@example.com', 'player', 'player-3', '["club-1"]', '[]'),
  ('user-6', 'pierre.leroy@example.com', 'player', 'player-4', '["club-1"]', '[]');
