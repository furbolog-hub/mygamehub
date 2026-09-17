CREATE TABLE IF NOT EXISTS daily_sessions (
  identity_hash TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('dropfish', 'agroclick')),
  moscow_day TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('browser', 'telegram')),
  started_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  finished_at INTEGER,
  result_json TEXT,
  result_code TEXT,
  PRIMARY KEY (identity_hash, game, moscow_day)
);

CREATE INDEX IF NOT EXISTS idx_daily_sessions_day
  ON daily_sessions (moscow_day, game);
