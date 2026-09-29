import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { seedHomes } from '@shared/data/homes';
const root = globalThis as unknown as { rentaraDb?: DatabaseSync };
export function database() {
  if (root.rentaraDb) return root.rentaraDb;
  // This database is created at runtime on a persistent volume, never bundled.
  const file = resolve(
    /* turbopackIgnore: true */ process.env.RENTARA_DB_PATH || './data/rentara.db',
  );
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS homes (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, home_id TEXT NOT NULL REFERENCES homes(id), tenant_id TEXT NOT NULL REFERENCES users(id), move_in TEXT NOT NULL, months INTEGER NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_request ON requests(home_id, tenant_id) WHERE status IN ('pending','accepted');
    CREATE INDEX IF NOT EXISTS requests_tenant ON requests(tenant_id);
    CREATE INDEX IF NOT EXISTS homes_owner ON homes(owner_id);
  `);
  const insert = db.prepare('INSERT OR IGNORE INTO homes (id, owner_id, data) VALUES (?, ?, ?)');
  for (const home of seedHomes) insert.run(home.id, home.ownerId, JSON.stringify(home));
  root.rentaraDb = db;
  return db;
}
