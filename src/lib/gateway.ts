import { randomBytes, randomUUID } from 'crypto';

import { db } from './db';

const HANDOFF_TTL_MS = 60_000;
const SESSION_TTL_MS = 2_592_000_000;

export function createHandoff(domain: string, returnPath: string) {
    const token = randomUUID();
    db.prepare(
        `INSERT INTO gateway_handoffs (token, domain, return_path, expires_at)
     VALUES (?, ?, ?, ?)`,
    ).run(token, domain, returnPath, Date.now() + HANDOFF_TTL_MS);
    return token;
}

export function consumeHandoff(token: string, domain: string) {
    const row = db
        .prepare(`SELECT * FROM gateway_handoffs WHERE token = ?`)
        .get(token) as
        | {
              token: string;
              domain: string;
              return_path: string;
              expires_at: number;
              consumed_at: number | null;
          }
        | undefined;

    if (!row) return null;
    if (row.consumed_at) return null;
    if (row.domain !== domain) return null;
    if (row.expires_at < Date.now()) return null;

    db.prepare(
        `UPDATE gateway_handoffs SET consumed_at = ? WHERE token = ?`,
    ).run(Date.now(), token);

    return { returnPath: row.return_path };
}

export function createGatewaySession(domain: string) {
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    db.prepare(
        `INSERT INTO gateway_sessions (token, domain, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
    ).run(token, domain, now, now + SESSION_TTL_MS);
    return { token, expiresAt: now + SESSION_TTL_MS };
}

export function isValidGatewaySession(token: string, domain: string) {
    const row = db
        .prepare(
            `SELECT domain, expires_at FROM gateway_sessions WHERE token = ?`,
        )
        .get(token) as { domain: string; expires_at: number } | undefined;

    if (!row) return false;
    if (row.domain !== domain) return false;
    if (row.expires_at < Date.now()) return false;
    return true;
}

// single shared credential → sign-out nukes every domain's session at once
export function revokeAllGatewaySessions() {
    db.prepare(`DELETE FROM gateway_sessions`).run();
}
