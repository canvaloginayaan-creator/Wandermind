/**
 * Optional: install the native SQLite module (`better-sqlite3`).
 *
 * You almost certainly do not need this. Node 22.5+ ships `node:sqlite`, and the app
 * uses it automatically — that's the default path on Node 23/24/26 and it needs no
 * compiler. `better-sqlite3` is NOT installed by `npm install` precisely so that a
 * machine without Python / Visual Studio Build Tools can never fail to install.
 *
 * Run this only if you are on Node 20 and want the native driver:
 *
 *     npm run enable-native-sqlite
 */
import { spawnSync } from "node:child_process";
import { nodeMajor, isWindows, log, sqliteDriver } from "./install-deps.mjs";

const root = process.cwd();
const major = nodeMajor();

log(`node v${process.versions.node}`);
log(`current driver: ${sqliteDriver(root)}`);

if (major < 22 || major >= 23) {
  log("");
  log("better-sqlite3 only publishes prebuilt binaries for Node LTS lines (20, 22).");
  log(`On Node ${major} npm would have to compile it from source, which needs Python`);
  log("and Visual Studio Build Tools. That is exactly the failure this project avoids.");
  log("");
  log("Good news: you do not need it. Node's built-in SQLite is already in use.");
  log("Nothing to do — just run: npm run dev");
  process.exit(0);
}

log("installing better-sqlite3 (prebuilt binary available for this Node)…");
const npm = isWindows ? "npm.cmd" : "npm";
const res = spawnSync(npm, ["install", "better-sqlite3@^11", "--no-save", "--no-audit", "--no-fund"], {
  cwd: root,
  stdio: "inherit",
  shell: isWindows,
});

if (res.status === 0) {
  log(`done — driver is now: ${sqliteDriver(root)}`);
} else {
  log("install failed; nothing is broken. The app keeps using node:sqlite.");
  process.exit(0);
}
