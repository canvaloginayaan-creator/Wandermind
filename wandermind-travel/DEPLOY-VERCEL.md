# Deploy WanderMind to Vercel

Two ways. **Path A needs no `npm install` on your PC at all** — use it if npm on Windows
keeps fighting you.

Both paths deploy the same code. The app is already Vercel-ready — and the build now
**repairs itself** if you accidentally upload an older copy:

- `vercel.json` is included (framework `nextjs`, region `sin1` — Singapore, closest to PK).
- The install command is `node scripts/vercel-install.mjs`, which strips every trace of the
  native `better-sqlite3` module from `package.json` / `package-lock.json` *before* running
  `npm install`. So a stale upload can no longer explode with `gyp ERR! make failed`.
- Serverless filesystems are read-only, so `lib/db.ts` puts the SQLite file in `/tmp`
  automatically whenever `VERCEL=1`. The demo data is re-created by the seed code on the
  first request, so the site is never empty.
- No native modules. Vercel's Node 22/26 builds it fine.

> **Honest caveat:** `/tmp` is per-instance and is wiped on cold starts, and two
> simultaneous instances each get their own copy. So changes you make in the deployed demo
> (new trips, expenses) can disappear, and may only be visible on some requests. That's fine
> for a demo/portfolio link; for real durable data you'd swap `lib/sqlite.ts` for Postgres,
> Turso or Neon. Locally, the file persists in `data/wandermind.db` as normal.

---

## Path A — GitHub upload → Vercel import (no npm, no CLI)

1. Go to <https://github.com/new>. Name it `wandermind`, **Private** is fine, do **not**
   add a README. Click *Create repository*.
2. On the empty repo page click **uploading an existing file**.
3. Unzip `wandermind-project.zip` somewhere, then drag **the contents of the
   `wandermind-project` folder** (not the folder itself) into the browser upload area:
   `app`, `components`, `lib`, `public`, `scripts`, `data`, `package.json`,
   `package-lock.json`, `next.config.ts`, `vercel.json`, `tsconfig.json`, … 
   Drag the whole set at once; GitHub keeps the folder structure.
4. Commit.
5. Go to <https://vercel.com/new> → **Import** that repository →
   *Framework Preset* should already say **Next.js** → click **Deploy**.
6. First build takes ~1–2 minutes. You get a URL like
   `wandermind-xxxx.vercel.app`.
7. Open it, click **Sign in**, and use `demo@wandermind.app` / `demo1234`.

If the build fails, open the log and look for `Module not found`. The only module the app
loads at runtime is `node:sqlite`, which is built into Node — it is never installed.

---

## Path B — CLI, one command

You need Node 22.5+ and working npm. From the project folder:

```powershell
cd "C:\dev\wandermind"
npx vercel login          # once, opens the browser
npx vercel --prod         # deploys, prints the URL
```

`vercel.json` means you answer "no" to every question except the project name
(`wandermind`). The CLI does **not** need `npm install` first — Vercel installs on its
build machine.

---

## Optional: make the assistant use a real LLM

Without keys the assistant answers with the built-in reasoning engine (it's honest and
budget-aware, just not free-form). To use a hosted model, add an env var in
**Vercel → Project → Settings → Environment Variables**, then redeploy:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-…` (or `ANTHROPIC_API_KEY`) |

Live flight data (instead of the mock schedule) is the same idea: `AMADEUS_CLIENT_ID` +
`AMADEUS_CLIENT_SECRET`. Everything degrades gracefully when they're absent.

---

## If the build log says `gyp ERR! build error` / `make failed with exit code: 2`

```
npm error gyp ERR! cwd /vercel/path0/.../node_modules/better-sqlite3
npm error gyp ERR! $npm_package_version 11.10.0
Error: [BUILD_UTILS_SPAWN_1] Command "npm install" exited with 1
```

`better-sqlite3` **does not exist in this version of the project**. If npm is still building
it, Vercel is reading old files — either an older upload, or the stale `package-lock.json`
from it is still in the repository.

Check it in 5 seconds: in your project folder run

```powershell
Select-String -Path package.json,package-lock.json -Pattern better-sqlite3
```

- **No output** → the files are clean. The repo on GitHub is stale: delete the old files in
  GitHub (or start a fresh repo) and re-upload.
- **Any output** → you're in the old unzip. Use the newest `wandermind-project.zip`.

With the current `vercel.json` the build log of a healthy deploy contains lines like:

```
[vercel-install] dependency tree already clean
[vercel-install] running npm install --no-audit --no-fund
added 112 packages in 7s
[vercel-install] done — the app runs on Node's built-in SQLite
```

If you see `stale native dependency repaired` instead of "already clean", it worked anyway.

## Where the folder goes (Root Directory)

In your build log the install ran in `/vercel/path0/wandermind-project/node_modules`, which
means your repo has a **folder inside it** (`wandermind-project/`). That works only if Vercel
found `package.json` in that subfolder. To avoid surprises pick one:

- **Preferred:** upload the *contents* (`app`, `components`, `lib`, `public`, `scripts`,
  `package.json`, `vercel.json`, …) directly at the repo root, so `package.json` is at the top.
- Or: Vercel → Project → **Settings → General → Root Directory** → set `wandermind-project`.

Either is fine, but `vercel.json` must sit next to `package.json`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails: `next: not found` | Repository wasn't uploaded with `package.json` at the root. Re-upload. |
| Build fails: `node-gyp` / `better-sqlite3` | You deployed an older copy of the project. `package.json` must have **no** `better-sqlite3` line. |
| `500` on every page, log says `Unable to open database` | Set `WANDERMIND_DATA_DIR=/tmp/wandermind` in the project env vars and redeploy. |
| Login works but data resets | Expected — see the `/tmp` caveat above. |
| `403` on the deployment URL | Deployment Protection is on. Vercel → Project → Settings → Deployment Protection → *Vercel Authentication* → **Disabled** (or use the share link). |
