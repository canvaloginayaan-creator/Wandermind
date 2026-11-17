/**
 * `npm run fix-install` — the repair path when npm install fails with
 * EPERM / EBUSY / ENOTEMPTY (the classic Windows "directory not empty").
 *
 * It removes the broken trees with lock-aware retries, then reinstalls and
 * verifies that the two dependencies the app actually needs are present.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  hasDeps,
  log,
  printWindowsAdvice,
  robustRemove,
  runNpm,
  warnAboutLocation,
} from "./install-deps.mjs";

const root = process.cwd();
let ok = true;

console.log(`[fix-install] platform=${process.platform} node=v${process.versions.node} npm install dir=${root}`);
warnAboutLocation(root);

ok = robustRemove(join(root, "node_modules"), "node_modules") && ok;
robustRemove(join(root, ".next"), ".next");

if (!ok) {
  console.log("\n[fix-install] node_modules is locked by another process.");
  printWindowsAdvice(root);
  process.exit(1);
}

log("reinstalling dependencies");
const res = runNpm(["install", "--no-audit", "--no-fund"], root);

if (res.status !== 0 || !hasDeps(root)) {
  printWindowsAdvice(root);
  process.exit(res.status || 1);
}

log("done — node_modules is healthy. Now run: npm run dev");
