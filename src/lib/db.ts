import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

const dbPath = './data/app.sqlite';

let _db: Database.Database | null = null;

function initDb(): Database.Database {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const instance = new Database(dbPath, { timeout: 5000 });
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');

    instance.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text not null primary key, 
      "name" text not null, 
      "email" text not null unique, 
      "emailVerified" integer not null, 
      "image" text, 
      "createdAt" date not null, 
      "updatedAt" date not null
    );
    CREATE TABLE IF NOT EXISTS "session" (
      "id" text not null primary key, 
      "expiresAt" date not null, 
      "token" text not null unique, 
      "createdAt" date not null, 
      "updatedAt" date not null, 
      "ipAddress" text, 
      "userAgent" text, 
      "userId" text not null references "user" ("id") on delete cascade
    );
    CREATE TABLE IF NOT EXISTS "account" (
      "id" text not null primary key, 
      "accountId" text not null, 
      "providerId" text not null, 
      "userId" text not null references "user" ("id") on delete cascade, 
      "accessToken" text, 
      "refreshToken" text, 
      "idToken" text, 
      "accessTokenExpiresAt" date, 
      "refreshTokenExpiresAt" date, 
      "scope" text, 
      "password" text, 
      "createdAt" date not null, 
      "updatedAt" date not null
    );
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" text not null primary key, 
      "identifier" text not null, 
      "value" text not null, 
      "expiresAt" date not null, 
      "createdAt" date not null, 
      "updatedAt" date not null
    );
    CREATE INDEX IF NOT EXISTS "session_userId_idx" on "session" ("userId");
    CREATE INDEX IF NOT EXISTS "account_userId_idx" on "account" ("userId");
    CREATE INDEX IF NOT EXISTS "verification_identifier_idx" on "verification" ("identifier");
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

    return instance;
}

// db is a Proxy, not a real Database — this avoids opening the SQLite
// file at import time. Next.js imports route files during `next build`
// to inspect them, so a real `new Database(...)` at module scope would
// run mid-build, and parallel build workers would fight over the file
// lock (SQLITE_BUSY). The Proxy delays the real connection until the
// first actual use, at request time, when there's no race.
export const db = new Proxy({} as Database.Database, {
    // Runs on every property read (db.prepare, db.exec, ...).
    get(_target, prop, _receiver) {
        if (!_db) _db = initDb(); // open the file + migrate, once
        const value = Reflect.get(_db, prop, _db); // read from the REAL db
        return typeof value === 'function' ? value.bind(_db) : value; // rebind methods to it
    },

    // `instanceof` skips `get` entirely — it checks the prototype chain
    // directly. better-auth uses `db instanceof Database` to detect the
    // SQLite dialect, so without this trap it sees an empty object and
    // fails. This makes the Proxy report the real db's prototype instead.
    getPrototypeOf(_target) {
        if (!_db) _db = initDb();
        return Reflect.getPrototypeOf(_db);
    },

    // Same idea for the `in` operator, in case anything checks method
    // presence that way instead of using instanceof.
    has(_target, prop) {
        if (!_db) _db = initDb();
        return Reflect.has(_db, prop);
    },
});
