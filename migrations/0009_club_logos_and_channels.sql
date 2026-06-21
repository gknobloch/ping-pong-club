-- Club logos (#135). Mirrors player_avatars (#124): the image is stored base64
-- in D1 and served via a dedicated endpoint, so the bulk /api/data payload stays
-- light (it only carries logo_updated_at for cache-busting).
CREATE TABLE IF NOT EXISTS club_logos (
  club_id      TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  data         TEXT NOT NULL,        -- base64-encoded image bytes (no data: prefix)
  content_type TEXT NOT NULL,        -- e.g. image/png
  updated_at   TEXT NOT NULL         -- ISO timestamp, used as the cache-busting version
);

-- Club communication channels (#135). Mirrors club_addresses: nested in Club on
-- the frontend, a separate table in D1. sort_order drives the admin-defined
-- ordering (reorderable).
CREATE TABLE IF NOT EXISTS club_channels (
  id           TEXT PRIMARY KEY,
  club_id      TEXT NOT NULL,
  type         TEXT NOT NULL,        -- website | whatsapp | facebook | other
  link         TEXT NOT NULL,
  display_name TEXT,                  -- optional; NULL → fall back to the type label
  sort_order   INTEGER NOT NULL DEFAULT 0
);
