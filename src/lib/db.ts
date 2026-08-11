import Database from 'better-sqlite3';

export const db = new Database(
    process.env.DATABASE_PATH ?? './data/app.sqlite',
);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Automatically ensure our custom tables exist at startup
// ponytail: lazy table creation on boot instead of manual migration scripts
db.exec(`
  CREATE TABLE IF NOT EXISTS gateway_handoffs (
    token       TEXT PRIMARY KEY,
    domain      TEXT NOT NULL,
    return_path TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    consumed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS gateway_sessions (
    token       TEXT PRIMARY KEY,
    domain      TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_gateway_sessions_domain ON gateway_sessions(domain);
`);
