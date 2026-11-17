/**
 * SQLite driver adapter.
 *
 * Why this exists: `better-sqlite3` is a native module. It ships prebuilt binaries
 * for Node LTS lines only, so on a very new Node (23, 24, 26…) `npm install` falls
 * back to compiling it with node-gyp — which needs Python + Visual Studio Build
 * Tools on Windows and fails for most people.
 *
 * Node 22.5+ ships its own SQLite (`node:sqlite`), so we use that when the native
 * module isn't available. Same synchronous API, no compiler, no Python.
 *
 * Preference order:
 *   1. better-sqlite3  (fastest, battle-tested)
 *   2. node:sqlite     (built in, zero install)
 */
import { createRequire } from "node:module";

/**
 * Load modules at runtime instead of letting the bundler resolve them.
 *
 * `better-sqlite3` is deliberately NOT a dependency (see below), so a normal
 * `require("better-sqlite3")` makes webpack print
 *   "Module not found: Can't resolve 'better-sqlite3'"
 * on every single request. Going through createRequire keeps the specifier opaque
 * to webpack: no build warning, and it still resolves from node_modules when the
 * native driver *is* installed.
 */
const runtimeRequire = createRequire(
  typeof __filename !== "undefined" ? __filename : `${process.cwd()}/index.js`
);

type RunResult = { changes: number | bigint; lastInsertRowid: number | bigint };

export type Statement = {
  get: (...params: any[]) => any;
  all: (...params: any[]) => any[];
  run: (...params: any[]) => RunResult;
};

export type DB = {
  prepare: (sql: string) => Statement;
  exec: (sql: string) => void;
  pragma: (sql: string, opts?: { simple?: boolean }) => any;
  transaction: <T extends (...args: any[]) => any>(fn: T) => T;
  close: () => void;
  driver: "better-sqlite3" | "node:sqlite";
};

/**
 * node:sqlite returns rows with a null prototype, which React Server Components
 * refuse to serialise ("Only plain objects ... can be passed to Client Components").
 * better-sqlite3 returns plain objects, so normalise here and both drivers behave
 * identically everywhere else in the app.
 */
const plain = <T>(row: T): T => {
  if (row === undefined || row === null) return row;
  if (Array.isArray(row)) return row.map((r) => plain(r)) as unknown as T;
  if (typeof row === "object") return Object.assign({}, row) as T;
  return row;
};

/** Wrap Node's built-in SQLite so it quacks like better-sqlite3. */
function wrapNodeSqlite(raw: any): DB {
  const db: DB = {
    driver: "node:sqlite",
    prepare(sql: string) {
      const st = raw.prepare(sql);
      return {
        get: (...params: any[]) => plain(st.get(...params)),
        all: (...params: any[]) => plain(st.all(...params)) as any[],
        run: (...params: any[]) => st.run(...params) as RunResult,
      };
    },
    exec(sql: string) {
      raw.exec(sql);
    },
    pragma(sql: string, opts?: { simple?: boolean }) {
      if (sql.includes("=")) {
        raw.exec(`PRAGMA ${sql}`);
        return undefined;
      }
      const row = raw.prepare(`PRAGMA ${sql}`).get();
      if (row === undefined) return undefined;
      if (opts?.simple) return Object.values(row)[0];
      return [row];
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T {
      const wrapped = (...args: any[]) => {
        raw.exec("BEGIN");
        try {
          const out = fn(...args);
          raw.exec("COMMIT");
          return out;
        } catch (err) {
          try {
            raw.exec("ROLLBACK");
          } catch {}
          throw err;
        }
      };
      return wrapped as T;
    },
    close() {
      raw.close();
    },
  };
  return db;
}

function wrapBetterSqlite(raw: any): DB {
  return {
    driver: "better-sqlite3",
    prepare: (sql: string) => raw.prepare(sql),
    exec: (sql: string) => raw.exec(sql),
    pragma: (sql: string, opts?: { simple?: boolean }) => raw.pragma(sql, opts),
    transaction: (fn: any) => raw.transaction(fn),
    close: () => raw.close(),
  };
}

export type OpenResult = { db: DB; driver: DB["driver"] };

/**
 * Open a database file. Throws a readable error only when *neither* driver is
 * usable — with instructions for the platform you're on.
 */
export function openDatabase(file: string): OpenResult {
  // 1. try the native module
  try {
    const Better = runtimeRequire("better-sqlite3");
    const raw = new Better(file);
    return { db: wrapBetterSqlite(raw), driver: "better-sqlite3" };
  } catch (nativeErr: any) {
    // 2. fall back to Node's built-in SQLite (Node 22.5+)
    try {
      const { DatabaseSync } = runtimeRequire("node:sqlite");
      const raw = new DatabaseSync(file);
      return { db: wrapNodeSqlite(raw), driver: "node:sqlite" };
    } catch (builtinErr: any) {
      const nodeMajor = Number(process.versions.node.split(".")[0]);
      const hint =
        nodeMajor >= 22
          ? "your Node should include node:sqlite — run `node -e \"require('node:sqlite')\"` to check it isn't disabled"
          : "install Node 22 LTS or newer (nodejs.org), or let npm build better-sqlite3 by installing Python + Visual Studio Build Tools";
      throw new Error(
        `No usable SQLite driver.\n` +
          `  better-sqlite3: ${nativeErr?.message?.split("\n")[0] ?? nativeErr}\n` +
          `  node:sqlite:    ${builtinErr?.message?.split("\n")[0] ?? builtinErr}\n` +
          `  Node version:   v${process.versions.node}\n` +
          `  Fix: ${hint}`
      );
    }
  }
}

export function hasSqlite(): boolean {
  try {
    runtimeRequire("better-sqlite3");
    return true;
  } catch {}
  try {
    runtimeRequire("node:sqlite");
    return true;
  } catch {}
  return false;
}
