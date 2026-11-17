/**
 * Self-healing bootstrap — runs automatically before `npm run dev` / `npm start`.
 *
 * In containerised environments (and CI caches) `node_modules` and `.next` are not
 * part of the saved workspace, so after a restart the source survives but the
 * dependency tree does not. This makes `npm run dev` a single command that always
 * ends in a working server:
 *
 *   1. installs dependencies if `next` / `better-sqlite3` are missing
 *   2. clears a half-written node_modules before retrying (Windows lock-safe)
 *   3. creates the data directory if needed
 *   4. checkpoints a leftover SQLite WAL so reads aren't served from a stale file
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  hasDeps,
  log,
  nodeMajor,
  printWindowsAdvice,
  robustRemove,
  runNpm,
  sqliteDriver,
  warnAboutLocation,
} from "./install-deps.mjs";

const root = process.cwd();
const DATA_DIR = process.env.WANDERMIND_DATA_DIR || join(root, "data");
const DB_PATH = join(DATA_DIR, "wandermind.db");

if (!hasDeps(root)) {
  warnAboutLocation(root);

  // A failed install leaves a partial tree that makes the next install fail with
  // ENOTEMPTY. Clear it first; if it can't be cleared, explain rather than retry.
  const nodeModules = join(root, "node_modules");
  if (existsSync(nodeModules)) {
    log("partial node_modules found — clearing it before reinstalling");
    if (!robustRemove(nodeModules, "node_modules")) {
      printWindowsAdvice(root);
      process.exit(1);
    }
  }

  log("dependencies missing — running npm install");
  let res = runNpm(["install", "--no-audit", "--no-fund"], root);
  if (!hasDeps(root)) {
    // Second attempt: ignore anything optional. There are no optional deps any more,
    // but a stale node_modules / npm cache entry can still drag a native build in.
    log("install did not produce next/ — retrying with --omit=optional");
    res = runNpm(["install", "--omit=optional", "--no-audit", "--no-fund"], root);
  }
  if (!hasDeps(root)) {
    printWindowsAdvice(root);
    process.exit(res.status || 1);
  }
  if (res.status !== 0) {
    log("npm reported an error, but the required packages are present — continuing");
  }
  log("dependencies installed");
} else {
  log("dependencies present");
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
  log(`created ${DATA_DIR}`);
}

const driver = sqliteDriver(root);
if (driver === "none") {
  log(`WARNING: this Node (v${process.versions.node}) has no SQLite driver.`);
  log("  Node 22.5+ ships node:sqlite, which is all this app needs.");
  log("  Install Node 22 LTS or newer from nodejs.org, then run: npm run dev");
  if (nodeMajor() < 22) {
    log("  (or, on Node 20 only: npm run enable-native-sqlite — needs Python + MSVC)");
    process.exit(1);
  }
} else {
  log(`sqlite driver: ${driver}`);
}

if (existsSync(DB_PATH) && driver !== "none") {
  try {
    const isNative = driver.startsWith("better-sqlite3");
    const raw = isNative
      ? new (await import("better-sqlite3")).default(DB_PATH)
      : new (await import("node:sqlite")).DatabaseSync(DB_PATH);

    const check = isNative
      ? raw.pragma("integrity_check", { simple: true })
      : Object.values(raw.prepare("PRAGMA integrity_check").get() ?? {})[0];

    if (isNative) raw.pragma("wal_checkpoint(TRUNCATE)");
    else raw.exec("PRAGMA wal_checkpoint(TRUNCATE)");

    const trips = raw.prepare("SELECT COUNT(*) AS c FROM trips").get()?.c ?? 0;
    raw.close();
    log(`database ok (integrity: ${check}, ${trips} trips)`);
  } catch (err) {
    log(`database check skipped: ${err?.message ?? err}`);
  }
} else if (!existsSync(DB_PATH)) {
  log("no database yet — demo data will seed on first request");
}
