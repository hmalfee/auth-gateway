import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

const dbPath = './data/app.sqlite';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { timeout: 5000 });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Automatically ensure our custom tables exist at startup
db.exec(`
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

export { db };
