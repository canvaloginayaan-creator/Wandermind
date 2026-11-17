/**
 * Self-healing bootstrap — runs automatically before `npm run dev` / `npm start`.
 *
 * Why this exists: in containerised/sandboxed environments (and in CI caches)
 * `node_modules` and `.next` are not part of the saved workspace, so after a
 * restart the source tree survives but the dependency tree does not. This script
 * makes `npm run dev` a single command that always ends in a working server:
 *
 *   1. installs dependencies if `next` / `better-sqlite3` are missing
 *   2. creates the data directory if needed
 *   3. checkpoints a leftover SQLite WAL so reads aren't served from a stale file
 */
import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const DATA_DIR = process.env.WANDERMIND_DATA_DIR || join(root, "data");
const DB_PATH = join(DATA_DIR, "wandermind.db");

const log = (msg) => console.log(`[bootstrap] ${msg}`);

function hasDeps() {
  return (
    existsSync(join(root, "node_modules", "next", "package.json")) &&
    existsSync(join(root, "node_modules", "better-sqlite3", "package.json"))
  );
}

if (!hasDeps()) {
  log("dependencies missing — running npm install");
  const res = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    console.error("[bootstrap] npm install failed — cannot continue");
    process.exit(res.status ?? 1);
  }
} else {
  log("dependencies present");
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
  log(`created ${DATA_DIR}`);
}

if (existsSync(DB_PATH)) {
  try {
    const Database = (await import("better-sqlite3")).default;
    const db = new Database(DB_PATH);
    const check = db.pragma("integrity_check", { simple: true });
    db.pragma("wal_checkpoint(TRUNCATE)");
    const trips = db.prepare("SELECT COUNT(*) AS c FROM trips").get()?.c ?? 0;
    db.close();
    log(`database ok (integrity: ${check}, ${trips} trips)`);
  } catch (err) {
    log(`database check skipped: ${err?.message ?? err}`);
  }
} else {
  log("no database yet — demo data will seed on first request");
}
