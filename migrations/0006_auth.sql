-- Auth: email OTP codes, opaque sessions, and OAuth identity links.

-- One active one-time code per email (replaced on each request).
CREATE TABLE IF NOT EXISTS auth_otp (
  email      TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  expires_at INTEGER NOT NULL,        -- unix epoch ms
  attempts   INTEGER NOT NULL DEFAULT 0
);

-- Opaque bearer tokens (revocable: logout deletes the row).
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,        -- unix epoch ms
  expires_at INTEGER NOT NULL         -- unix epoch ms
);

-- Links an OAuth provider account (provider + subject) to a user.
CREATE TABLE IF NOT EXISTS auth_identities (
  provider TEXT NOT NULL,             -- 'google' | 'apple'
  subject  TEXT NOT NULL,             -- provider's stable user id ('sub')
  user_id  TEXT NOT NULL,
  PRIMARY KEY (provider, subject)
);
