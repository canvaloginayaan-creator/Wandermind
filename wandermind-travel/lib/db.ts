import fs from "node:fs";
import path from "node:path";
import { openDatabase, type DB } from "./sqlite";

/**
 * Where the SQLite file lives.
 *
 * Locally: ./data/wandermind.db (survives restarts, seeded demo data on first boot).
 * Serverless (Vercel, Lambda): the deployment filesystem is READ-ONLY — only /tmp is
 * writable. So we put the database in /tmp and let the seed code recreate the demo
 * data on first request. /tmp is per-instance and cold starts reset it, which is fine
 * for a demo but is NOT durable storage. Set WANDERMIND_DATA_DIR to override.
 */
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);
const DATA_DIR =
  process.env.WANDERMIND_DATA_DIR ||
  (isServerless ? path.join("/tmp", "wandermind") : path.join(process.cwd(), "data"));
const DB_PATH = path.join(DATA_DIR, "wandermind.db");

declare global {
  // eslint-disable-next-line no-var
  var __wm_db: DB | undefined;
}

function createDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const { db, driver } = openDatabase(DB_PATH);
  console.log(`[wandermind] sqlite driver: ${driver}`);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: DB) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    home_city TEXT NOT NULL DEFAULT 'Karachi',
    currency TEXT NOT NULL DEFAULT 'PKR',
    avatar_hue INTEGER NOT NULL DEFAULT 28,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Pakistan',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget_total REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PKR',
    travelers INTEGER NOT NULL DEFAULT 1,
    personalities TEXT NOT NULL DEFAULT '[]',
    pace TEXT NOT NULL DEFAULT 'balanced',
    status TEXT NOT NULL DEFAULT 'draft',
    cover_image TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS itinerary_items (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_date TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL DEFAULT 'activity',
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL DEFAULT '',
    end_time TEXT NOT NULL DEFAULT '',
    location_name TEXT NOT NULL DEFAULT '',
    cost REAL NOT NULL DEFAULT 0,
    booking_url TEXT NOT NULL DEFAULT '',
    booking_label TEXT NOT NULL DEFAULT '',
    provider_name TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    rating REAL,
    price_band TEXT NOT NULL DEFAULT '',
    map_url TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    is_live INTEGER NOT NULL DEFAULT 0,
    meta TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_items_trip ON itinerary_items(trip_id, day_date, position);

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'other',
    label TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PKR',
    spent_on TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'actual',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);

  CREATE TABLE IF NOT EXISTS saved_places (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'food',
    note TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    rating REAL,
    price_band TEXT NOT NULL DEFAULT '',
    map_url TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_places(user_id);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id, created_at);
  `);
}

declare global {
  // eslint-disable-next-line no-var
  var __wm_seed: Promise<void> | undefined;
}

export function getDb(): DB {
  if (!global.__wm_db) {
    global.__wm_db = createDb();
    global.__wm_seed = ensureSeeded(global.__wm_db);
  }
  return global.__wm_db;
}

/** Await this in server components/actions so first-load demo data exists. */
export async function ensureReady() {
  getDb();
  if (global.__wm_seed) await global.__wm_seed;
}

async function ensureSeeded(db: DB) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (row.c > 0) return;
  try {
    const { seedDatabase } = await import("./seed");
    await seedDatabase(db);
  } catch (err) {
    console.error("[wandermind] seed failed", err);
  }
}

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export const nowIso = () => new Date().toISOString();
