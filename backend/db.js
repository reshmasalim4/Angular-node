import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.js';

fs.mkdirSync(path.dirname(path.resolve(config.dbPath)), { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id      TEXT NOT NULL UNIQUE,
    email          TEXT NOT NULL UNIQUE,
    name           TEXT,
    picture        TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const upsertStmt = db.prepare(`
  INSERT INTO users (google_id, email, name, picture, email_verified)
  VALUES (@googleId, @email, @name, @picture, @emailVerified)
  ON CONFLICT(google_id) DO UPDATE SET
    email          = excluded.email,
    name           = excluded.name,
    picture        = excluded.picture,
    email_verified = excluded.email_verified,
    last_login_at  = datetime('now')
  RETURNING *
`);

const findByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');

/** Insert a new user or refresh an existing one from a verified Google profile. */
export function upsertGoogleUser({ googleId, email, name, picture, emailVerified }) {
  return upsertStmt.get({
    googleId,
    email,
    name: name ?? null,
    picture: picture ?? null,
    emailVerified: emailVerified ? 1 : 0
  });
}

export function findUserById(id) {
  return findByIdStmt.get(id);
}
