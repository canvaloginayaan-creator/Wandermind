# WanderMind

A full-stack travel planner that plans the trip your budget actually buys — then argues with you about the parts that won't work.

Tell it where you're going, when, how much you have, and what kind of traveller you are. It builds a day-by-day, dated itinerary with transport, stays, restaurants and activities — each priced, each linked to a real booking page — and it tells you plainly when the numbers don't hold.

**Demo login:** `demo@wandermind.app` / `demo1234` (or press "Explore with the demo account")

---

## Run it in VS Code (Windows / macOS / Linux)

This is **not** a static site, so the **Live Server** extension will not work — it serves plain
HTML files and WanderMind needs Node (server components, server actions, SQLite). The equivalent
of "Live Server" here is `npm run dev`.

1. **Download the project** — grab `wandermind-project.zip` from the workspace and unzip it
   anywhere (e.g. `~/Projects/wandermind`).
2. **Open the folder, not the file** — in VS Code: `File → Open Folder…` → pick `wandermind`.
   Opening a single file will not load `tsconfig.json`, Tailwind or the `@/` alias.
3. **Open a terminal** inside VS Code: `` Ctrl+` `` (macOS: `Cmd+`` ` ``).
4. **Install once:** `npm install`
5. **Start the dev server:** `npm run dev` → open <http://localhost:3000>

That's it. Leave the terminal running; edits hot-reload.

### Faster than typing commands
- `Ctrl+Shift+B` (macOS `Cmd+Shift+B`) runs the default build task → starts `npm run dev`.
- `F5` starts the **"WanderMind: Next.js (server-side)"** launch config, which boots the server,
  waits for `Ready in`, and opens Chrome already attached to the debugger (`⇧⌘Y` for breakpoints).
- **Terminal → Run Task** gives you `dev`, `build`, and `reset demo data`.

### If `localhost:3000` won't load
| Symptom | Cause | Fix |
|---|---|---|
| `npm: command not found` | Node isn't installed | Install Node 20+ from nodejs.org, reopen VS Code |
| `Cannot find module 'better-sqlite3'` | Native module built for a different Node | `rm -rf node_modules && npm install` |
| `Module not found: Can't resolve '@/lib/…'` | Folder not opened at project root | `File → Open Folder…` on the folder containing `package.json` |
| Port 3000 already in use | Another server is running | `npm run dev -- -p 3001`, or kill the old process |
| Blank page / "site can't be reached" | You opened `index.html` via Live Server | Stop Live Server, use `npm run dev` |
| Want a production preview | Dev server ≠ production build | `npm run build && npm start` |

> **Using VS Code Remote / Codespaces / WSL?** The server binds `0.0.0.0`, so the Ports panel
> will forward 3000 automatically — click the forwarded URL rather than `localhost`.

## Run it (terminal only)

```bash
npm install
npm run dev          # http://localhost:3000
```

The database creates and seeds itself on first request — 5 realistic trips, ~100 itinerary stops, expenses, saved places and an assistant conversation. No `.env` and no API keys are needed.

```bash
npm run build && npm start   # production
```

`npm run dev` and `npm start` both run `scripts/bootstrap.mjs` first (`predev` / `prestart`). It installs
dependencies if `node_modules` is missing, creates `data/`, and checkpoints a leftover SQLite WAL — so one
command always ends in a working server, even after a container restart or a fresh clone.

---

## What's in it

### Planning engine (`lib/planner.ts`)
- **Dated, time-aware scheduling.** It knows an 8pm sleeper out of Karachi lands at 3pm the next day, so day one is a train and there's no fake "breakfast at 16:30" in the plan. Meals only appear inside the usable window; nothing is scheduled before you arrive or after you must leave for the airport.
- **Transport scoring.** Every flight, train, coach and private car is scored on comfort, price relative to your transport allowance, and travel hours — so a 31-hour coach never beats a 3-hour flight just because it's cheap, but a 17-hour business sleeper *does* beat a flight on a ₨95,000 two-person budget. Return legs mirror the outbound fare so the price doesn't randomly double.
- **Budget envelope, not apologies.** Food and activities are chosen inside a per-meal / per-activity cap derived from what's left after transport and stay, so the plan is *built* inside the budget rather than generated and then trimmed.
- **Realism checks** — season, trip length vs. travel days, thin daily envelopes, over/under budget, northern-flight cancellation risk, and "a much cheaper way exists" when a coach undercuts your flight without eating the trip.

### Conversational assistant (`lib/assistant.ts`, `/api/chat`)
Streams responses that reference *your* numbers — the outbound at 20:00, ₨10,738 per person per day, the headroom. Ask it to make things cheaper, more honest, or to rebuild a day. With an LLM key (`OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) the same panel switches to a live model with your trip as context; without one it uses a built-in reasoning engine so the feature never disappears.

### Data layer (`lib/providers/`)
One `TravelProvider` interface, two implementations:
- **Mock** — deterministic, date-aware, seedable. Real prices for real routes, and every booking link is genuine: Google Flights, Pakistan Railways, Daewoo/Faisal Movers, Booking.com, Google Maps.
- **Live** — Amadeus flight offers and Google Places, activated purely by env vars with per-call fallback.

Every card is badged **Live** or **Est.** so nobody is misled about what they're looking at.

### App
- Email + password auth (bcrypt, httpOnly session cookie, protected routes) plus a one-click demo account.
- Sidebar dashboard → Overview, Trips, Explore, Budget, Saved places, Settings; bottom nav on mobile.
- **Full CRUD:** trips (create via 4-step wizard, edit, duplicate, archive, delete, re-plan), itinerary stops (add, edit, drag-reorder, move between days, delete, rebuild a day), expenses (add, edit, delete, planned vs actual), saved places (add, edit, delete, save-from-itinerary).
- Optimistic updates everywhere a mutation happens, with rollback and toasts on failure.
- Skeletons, empty states with real calls to action, responsive layouts, and a light/dark theme toggle.
- Editorial photography generated for the demo, served locally — no external image dependencies.

---

## Stack

Next.js 15 (App Router, server actions) · React 19 · TypeScript · Tailwind CSS · SQLite via better-sqlite3 · Zod on every boundary.

```
app/            routes: (auth), (app) dashboard/trips/explore/budget/saved/settings, /api/chat
components/     shell, trips, chat, saved, settings, ui primitives
lib/            planner, assistant, llm, providers, queries, actions, seed, data
data/           SQLite file (created at runtime, git-ignored)
```

## Notes and limits

- WanderMind plans; it never takes payment. Every booking link goes to the operator.
- Prices are estimates unless a live provider is configured — the badge on each card tells you which.
- Intercity travel covers Pakistan's rail/coach network plus private cars; international legs are flights only.
- The assistant can re-plan and re-price, but it won't silently change a trip you've already booked.
