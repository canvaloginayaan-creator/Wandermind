/**
 * Install command used by Vercel (see vercel.json).
 *
 * Why this exists
 * ---------------
 * `better-sqlite3` is a native module. If it ever appears in package.json — which happens
 * when an older copy of the project is uploaded/pushed, or when a stale package-lock.json
 * is reused — the Vercel build machine tries to compile it and dies with
 *
 *     gyp ERR! build error   Error: `make` failed with exit code: 2
 *     Error: [BUILD_UTILS_SPAWN_1] Command "npm install" exited with 1
 *
 * This project does not need it: SQLite comes from `node:sqlite`, which is built into
 * Node 22.5+. So before installing we strip every trace of the native module from
 * package.json and package-lock.json. If the uploaded tree is clean (normal case) this
 * changes nothing; if it is stale, it repairs it instead of failing the build.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const NATIVE = "better-sqlite3";
const log = (m) => console.log(`[vercel-install] ${m}`);
let repaired = false;

/* ---------- package.json ---------- */
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

const TYPES = `@types/${NATIVE}`;

for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (pkg[field] && TYPES in pkg[field]) {
    delete pkg[field][TYPES];
    repaired = true;
    log(`removed ${TYPES} from ${field}`);
  }
  if (pkg[field] && NATIVE in pkg[field]) {
    delete pkg[field][NATIVE];
    repaired = true;
    log(`removed ${NATIVE} from ${field}`);
    if (Object.keys(pkg[field]).length === 0) delete pkg[field];
  }
}
if (pkg.engines && typeof pkg.engines.node === "string" && pkg.engines.node !== ">=22.5.0") {
  pkg.engines.node = ">=22.5.0";
  repaired = true;
}
if (repaired) writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

/* ---------- package-lock.json ---------- */
const lockPath = join(root, "package-lock.json");
if (existsSync(lockPath)) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    let lockChanged = false;

    if (lock.packages) {
      // the package itself and anything only it pulled in (bindings, prebuild-install…)
      for (const key of Object.keys(lock.packages)) {
        if (key === `node_modules/${NATIVE}` || key.startsWith(`node_modules/${NATIVE}/`) || key === `node_modules/${TYPES}`) {
          delete lock.packages[key];
          lockChanged = true;
        }
      }
      const rootEntry = lock.packages[""];
      if (rootEntry) {
        for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
          if (rootEntry[field] && TYPES in rootEntry[field]) {
            delete rootEntry[field][TYPES];
            lockChanged = true;
          }
          if (rootEntry[field] && NATIVE in rootEntry[field]) {
            delete rootEntry[field][NATIVE];
            lockChanged = true;
            if (Object.keys(rootEntry[field]).length === 0) delete rootEntry[field];
          }
        }
      }
    }
    if (lock.dependencies && NATIVE in lock.dependencies) {
      delete lock.dependencies[NATIVE];
      lockChanged = true;
    }

    if (lockChanged) {
      writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
      repaired = true;
      log("stripped native-module entries from package-lock.json");
    }
  } catch (err) {
    log(`could not parse package-lock.json (${err.message}) — deleting it`);
    writeFileSync(lockPath, ""); // npm will regenerate
  }
}

log(repaired ? "stale native dependency repaired" : "dependency tree already clean");

/* ---------- install ---------- */
const args = ["install", "--no-audit", "--no-fund"];
log(`running npm ${args.join(" ")}`);
const res = spawnSync("npm", args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

if (res.status !== 0) {
  log("npm install failed — see the log above");
  process.exit(res.status ?? 1);
}

/* ---------- verify ---------- */
const installed = join(root, "node_modules", NATIVE);
if (existsSync(installed)) {
  log(`WARNING: ${NATIVE} still present in node_modules (it will not be used — node:sqlite wins)`);
}
log("done — the app runs on Node's built-in SQLite");
