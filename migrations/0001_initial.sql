-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 0
);

-- Phases
CREATE TABLE IF NOT EXISTS phases (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 0
);

-- Divisions
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  players_per_game INTEGER NOT NULL DEFAULT 4
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  affiliation_number TEXT NOT NULL,
  display_name TEXT NOT NULL
);

-- Club addresses (nested in Club on frontend, separate table in DB)
CREATE TABLE IF NOT EXISTS club_addresses (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  label TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

-- Groups (team_ids stored as JSON array)
CREATE TABLE IF NOT EXISTS groups_tbl (
  id TEXT PRIMARY KEY,
  division_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  team_ids TEXT NOT NULL DEFAULT '[]'
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  birth_date TEXT,
  birth_place TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  club_id TEXT NOT NULL DEFAULT '',
  points TEXT
);

-- Teams (player_ids and roster_initial_points stored as JSON)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  phase_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  division_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  game_location_id TEXT NOT NULL,
  default_day TEXT NOT NULL,
  default_time TEXT NOT NULL,
  captain_id TEXT NOT NULL DEFAULT '',
  player_ids TEXT NOT NULL DEFAULT '[]',
  roster_initial_points TEXT,
  color TEXT,
  whatsapp_link TEXT
);

-- Match days
CREATE TABLE IF NOT EXISTS match_days (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  date TEXT NOT NULL
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  match_day_id TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  time TEXT
);

-- Game availabilities
CREATE TABLE IF NOT EXISTS game_availabilities (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  status TEXT NOT NULL,
  overridden_by TEXT
);

-- Game selections (player_ids stored as JSON array)
CREATE TABLE IF NOT EXISTS game_selections (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  player_ids TEXT NOT NULL DEFAULT '[]'
);

-- Users (club_ids and captain_team_ids stored as JSON arrays)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  player_id TEXT,
  club_ids TEXT NOT NULL DEFAULT '[]',
  captain_team_ids TEXT NOT NULL DEFAULT '[]'
);
