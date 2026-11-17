/**
 * Shared dependency-install helpers.
 *
 * Windows note: deleting a node_modules tree routinely fails with EPERM / EBUSY /
 * ENOTEMPTY because antivirus, the Windows Search indexer, OneDrive sync, or an
 * open editor holds handles on files inside it. Node's fs.rm with maxRetries is
 * specifically designed to survive that, so we use it instead of a plain rmdir.
 */
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const log = (msg) => console.log(`[bootstrap] ${msg}`);
export const isWindows = process.platform === "win32";

export function hasDeps(root) {
  // better-sqlite3 is optional: Node 22.5+ ships node:sqlite as a fallback,
  // so only Next.js is required for the app to boot.
  return existsSync(join(root, "node_modules", "next", "package.json"));
}

/** Which SQLite driver will this machine use? */
export function sqliteDriver(root) {
  if (existsSync(join(root, "node_modules", "better-sqlite3", "package.json"))) {
    try {
      require.resolve("better-sqlite3", { paths: [root] });
      return "better-sqlite3 (native)";
    } catch {}
  }
  try {
    // Node 22.5+
    return require("node:sqlite") ? "node:sqlite (built in, no compiler needed)" : "none";
  } catch {
    return "none";
  }
}

export function nodeMajor() {
  return Number(process.versions.node.split(".")[0]);
}

export function nodeVersion() {
  return process.versions.node;
}

/** Remove a directory tree, retrying on the lock errors Windows throws. */
export function robustRemove(target, label) {
  if (!existsSync(target)) return true;
  try {
    rmSync(target, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
    log(`removed ${label}`);
    return true;
  } catch (err) {
    log(`could not remove ${label}: ${err.code ?? err.message}`);
    return false;
  }
}

export function runNpm(args, root) {
  // .cmd shim is required on Windows when spawning npm without a shell
  const npm = isWindows ? "npm.cmd" : "npm";
  return spawnSync(npm, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
    env: { ...process.env, npm_config_fund: "false", npm_config_audit: "false" },
  });
}

/** Warn about the two locations that cause most Windows install failures. */
export function warnAboutLocation(root) {
  if (!isWindows) return;
  const lower = root.toLowerCase();
  const problems = [];
  if (lower.includes("onedrive")) problems.push("the folder is inside OneDrive (sync locks files)");
  if (lower.includes("\\downloads")) problems.push("the folder is in Downloads (often OneDrive-synced)");
  if (root.includes(" ")) problems.push("the path contains spaces");
  if (root.length > 90) problems.push("the path is very long (Windows MAX_PATH)");
  if (problems.length) {
    log("heads-up — this location will cause trouble on Windows:");
    for (const p of problems) log(`  · ${p}`);
    log("  recommended: move the project to something short, e.g. C:\\dev\\wandermind");
  }
}

export function printWindowsAdvice(root) {
  if (!isWindows) {
    log("If this keeps failing: rm -rf node_modules .next && npm install");
    return;
  }
  console.log(`
[bootstrap] Install could not complete. On Windows this is almost always a file lock.

Do this, in order:

  1. Close VS Code, any terminals, and any Explorer window showing the project.
  2. Stop stray Node processes:      taskkill /F /IM node.exe
  3. Delete the broken tree:         rmdir /S /Q node_modules
                                     rmdir /S /Q .next
  4. Reinstall:                      npm install

If step 3 says "operation not permitted" or "directory not empty":

  · Move the project out of Downloads/OneDrive first, e.g.:
        mkdir C:\\dev
        move "${root}" C:\\dev\\wandermind
    then reopen that folder in VS Code and run the steps again.

  · Or exclude the folder from Windows Defender real-time scanning:
        Settings → Privacy & security → Windows Security → Virus & threat protection
        → Manage settings → Exclusions → Add an exclusion → Folder

  · Or pause OneDrive syncing (taskbar cloud icon → Pause syncing).

Node version:  v${nodeVersion()}   (needs 22.5 or newer)
This app has NO native dependencies: it uses Node's built-in SQLite
(node:sqlite). If you ever see node-gyp / Python / MSVC errors, you are
running an older copy of this project — unzip the latest one.

Or run the automated repair:   npm run fix-install
`);
}
