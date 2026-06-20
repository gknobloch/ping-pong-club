-- Player avatars (issue #124). Stored as base64 in D1, served via a dedicated
-- endpoint so the bulk /api/data payload stays light (it carries only
-- updated_at, used for cache-busting on the client).
CREATE TABLE IF NOT EXISTS player_avatars (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data         TEXT NOT NULL,        -- base64-encoded image bytes (no data: prefix)
  content_type TEXT NOT NULL,        -- e.g. image/jpeg
  updated_at   TEXT NOT NULL         -- ISO timestamp, used as the cache-busting version
);
