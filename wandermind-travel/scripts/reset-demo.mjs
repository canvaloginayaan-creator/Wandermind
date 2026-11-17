// Deletes the local SQLite database. The demo data re-seeds itself on the next
// request, so `npm run reset-demo && npm run dev` gives you a clean slate.
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.WANDERMIND_DATA_DIR || "data";
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log(`Removed ${dir}/ — demo data will be recreated on the next request.`);
} else {
  console.log("No local data directory — nothing to reset.");
}
