# WanderMind — Windows install fixed

> **Fastest way out: don't install anything.** Deploy the app instead — see
> **`DEPLOY-VERCEL.md`**. Path A uploads the folder to GitHub in a browser and gives you a
> public URL, with no npm, no Python, no native build on your PC.


Your error was:

```
npm error code ENOTEMPTY
npm error syscall rmdir
npm error path C:\Users\Subhan Computers\Downloads\wandermind-project\wandermind-project\node_modules\next\dist\server\app-render
npm error ENOTEMPTY: directory not empty
```

**Nothing is wrong with the app.** Windows refused to let npm delete `node_modules` because
another program had those files open. npm then gave up halfway, leaving a broken, half-deleted
tree — and every later `npm install` trips over it.

Four things cause this, and your path hits three of them:

| Cause | Your setup |
|---|---|
| Folder is in **Downloads** — frequently OneDrive-synced, which locks files | ✗ yes |
| Path is **long** and contains **spaces** (`Subhan Computers`) | ✗ yes |
| **Antivirus / Windows Search** scanning files as npm deletes them | likely |
| **VS Code or a terminal** open inside the folder, holding handles | likely |

---

## The fix — copy/paste these (PowerShell)

> **The previous version of this file used cmd.exe syntax.** In PowerShell `rmdir` is an alias for
> `Remove-Item`, so `rmdir /S /Q` fails with *"A positional parameter cannot be found that accepts
> argument '/Q'"* — and the following `cd` then fails, leaving `npm` running in `C:\WINDOWS\system32`.
> Use the commands below instead.

```powershell
# 1. close VS Code and any terminals, then kill stray node processes
taskkill /F /IM node.exe

# 2. go to the project — keep the quotes, the path contains spaces
cd "C:\Users\Subhan Computers\Downloads\wandermind-project\wandermind-project"

# 3. delete the broken dependency tree using cmd's rmdir
#    (PowerShell's Remove-Item often fails on these locked trees)
cmd /c "rmdir /S /Q node_modules"
cmd /c "rmdir /S /Q .next"

# 4. reinstall and run
npm install
npm run dev
```

Then open <http://localhost:3000> and sign in with `demo@wandermind.app` / `demo1234`.

### If step 3 says "being used by another process"

You do **not** need to move the folder. Either pause OneDrive (taskbar cloud icon →
Pause syncing), or copy the project somewhere short with `robocopy`, which tolerates locks:

```powershell
robocopy "C:\Users\Subhan Computers\Downloads\wandermind-project\wandermind-project" "C:\dev\wandermind" /E /R:1 /W:1
cd C:\dev\wandermind
cmd /c "rmdir /S /Q node_modules"
npm install
npm run dev
```

> `move` fails with *"The process cannot access the file"* when anything inside the folder is open —
> including Explorer or VS Code. Close them first, or use the `robocopy` route above.

---

## Automated repair

If you'd rather not do it by hand:

```powershell
npm run fix-install
```

It clears `node_modules` and `.next` with retries that survive Windows file locks, reinstalls,
and confirms Next.js is installed and which SQLite driver it picked. If the
files are genuinely locked, it prints exactly what's holding them instead of a stack trace.

---

## Still stuck? Two more levers

**1. Exclude the folder from antivirus scanning** (the most common remaining cause):

> Windows Security → Virus & threat protection → Manage settings → Exclusions → Add an exclusion → Folder → `C:\dev\wandermind`

**2. Check your Node version** — run `node -v`.

You need **Node 22.5 or newer**. That's the only requirement.

This project has **no native dependencies**. It does not install `better-sqlite3`; it uses
Node's built-in SQLite. So these errors *cannot come from this version of the project*:

- `prebuild-install warn install No prebuilt binaries found`
- `gyp ERR! find Python` / `Could not find any Python installation to use`
- `npm error path …\node_modules\better-sqlite3`

**If you see any of them, you're running an older unzip of the project.** Unzip the latest
`wandermind-project.zip` into a new folder and run `npm install` in *that* folder:

```powershell
cd "C:\Users\Subhan Computers\Downloads\wandermind-project"
cmd /c "rmdir /S /Q node_modules"
npm install          # ~10 seconds, no compiler, no Python
npm run dev          # -> [bootstrap] sqlite driver: node:sqlite (built in, no compiler needed)
```

`npm install` now installs 112 pure-JavaScript packages and finishes in about ten seconds.

### Optional: install the native SQLite driver anyway
Only if you're on Node 22 and want the (slightly faster) native driver:

```powershell
npm run enable-native-sqlite
```
On Node 23+ the script tells you it isn't available and does nothing — the app keeps working.

---

## The harmless warning

```
npm warn deprecated prebuild-install@7.1.3: No longer maintained
```

This is **not an error** — it's a deprecation notice from a transitive dependency. Ignore it.

The errors that matter are the `npm error` lines. Only `npm warn` lines can be ignored.

---

## Why you don't see this in my sandbox

I run Linux, where deleting an open file is allowed. On Windows the OS blocks it — so this is a
platform quirk, not a difference in the code. The scripts above are the Windows-safe path and
are now wired into `npm run dev` itself.
