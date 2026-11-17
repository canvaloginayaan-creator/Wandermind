# WanderMind — Full-Stack Travel Planner
### Refined build brief (the "prompt I will build against") + connector checklist

---

## 1. The refined prompt (what I'll actually build from)

> **Build "WanderMind", a full-stack AI travel-planning web app.**
>
> **Core loop:** a traveler signs up, tells the app *where from*, *where to (or "surprise me")*, *exact travel dates*, *budget + currency*, *party size*, and picks a **traveler personality** (multi-select: Foodie, Adventure Seeker, Nature Lover, Culture & History, Nightlife, Relaxation/Wellness, Budget Backpacker, Luxury, Family-Friendly, Photography, Shopping, Pilgrimage). The app then produces a complete, dated, budget-constrained trip plan and — critically — **talks to the user like a well-travelled friend, not a search results page**.
>
> **1. Itinerary generation**
> - Day-by-day plan across the exact date range, with realistic pacing (travel-time-aware, not 8 attractions a day).
> - Outbound + return **long-haul transport** (flight options with airline, route, times, duration, stops, price in the user's currency, and a **deep link to the booking page** on the airline/OTA that actually sells it).
> - **Intercity legs** (train / bus / private car / domestic flight) chosen to fit *inside* the remaining budget, each with a booking deep link (rail operator, bus aggregator, or carrier).
> - Stay suggestions by neighbourhood + nightly price band within budget.
> - Food plan: specific named restaurants/cafés/street-food spots per day, each with **photo preview, rating, price band, opening hours, map location, and a live link** (Google Maps / Zomato / TripAdvisor / venue site).
> - Cost ledger: transport + stay + food + activities + buffer, with a **budget-fit verdict** ("this works", "this is PKR 42,000 over — here are 3 trade-offs").
>
> **2. Conversational layer (the differentiator)**
> - A chat panel on every trip: the assistant asks clarifying questions *before* over-generating ("Is this a relaxed trip or a pack-everything-in trip? Do you mind overnight trains?").
> - **Reality checks**: it pushes back honestly — "Your PKR 150k budget can't do Hunza + Skardu + a Dubai layover in 6 days. Pick two and I'll make it excellent." Every warning is actionable, never a dead end.
> - Quick-reply chips, streaming responses, and the ability to say "make day 3 cheaper" / "swap the museum for a hike" and have the plan **re-plan in place**.
>
> **3. Data layer (honest engineering)**
> - A single `TravelProvider` interface with pluggable adapters: `flights`, `intercity`, `stays`, `places/food`, `geocode`, `images`.
> - Ships with a **high-fidelity mock provider** (deterministic, date-aware, seedable) so the app is fully demoable with **zero API keys**.
> - Real adapters for Amadeus/Duffel (flights), Rome2Rio/Transitland (intercity), Google Places/OSM Overpass (food & POIs), Unsplash/Wikimedia (images) that switch on purely via `.env` keys — no code changes.
> - **All third-party calls happen server-side**, behind proxy routes with caching + rate limiting (never from the browser), and images are proxied same-origin so they render even in restricted previews.
> - Every recommendation carries an `isLiveData` / `isDemoData` badge so the user is never misled about what's real.
>
> **4. App shell & UX**
> - Email + password auth (hashed, httpOnly session cookie, protected routes), plus guest/demo login.
> - **Dashboard with a collapsible sidebar**: Overview, Trips, Explore (destination inspiration), Budgets, Saved places, Chat/Assistant, Profile, Settings.
> - **Full CRUD** on core resources: **Trips** (create/edit/archive/delete/duplicate), **Itinerary items/stops** (reorder, edit, delete, add from library, swap), **Saved places / wishlist**, **Expense entries** (add/edit/delete, auto-totals per category), plus trip collaborators or notes if cheap.
> - Optimistic updates on every mutation (add/reorder/delete reflect instantly, roll back on error), toast notifications.
> - **Loading states** everywhere: skeletons for cards/itineraries/maps, streaming chat, button spinners, route-level `loading.tsx`.
> - **Empty states** with illustration + a real call-to-action for every list, plus a first-run onboarding wizard.
> - Responsive: sidebar → bottom nav on mobile; cards reflow; tables become stacked lists. Dark mode.
> - Seeded demo data: 3–4 realistic trips (e.g. a Karachi→Hunza nature trip, a Lahore foodie weekend, a Bangkok budget run), itineraries, expenses, saved places, and a chat transcript — so it feels alive on first load.
>
> **5. Stack** (see §3 — pending your pick)
> - Next.js 15 App Router + TypeScript + Tailwind + shadcn-style components, SQLite (better-sqlite3) via a typed data layer, Zod validation on every boundary, server actions for mutations, streaming for AI/chat.
> - Runs locally with `npm run dev`, seeded via `npm run seed`, fully functional in the sandboxed preview.

---

## 2. Connectors — what you *should* turn on (and what you don't need)

Current state in this conversation:

| Connector | State | Needed to build? |
|---|---|---|
| **vercel** | connected but **OFF** | **Yes — turn this on if you want the app deployed to a real URL** at the end. Otherwise optional. |
| **google_drive** | connected but **OFF** | Only if you want the spec/exported trip PDFs saved to Drive. Nice-to-have. |
| **dropbox** | connected but **OFF** | Not needed. Skip. |
| **notion** | not connected | Not needed for the build. Optional: push the spec or trip summaries to a Notion page. |
| **google_calendar** | not connected | **Genuinely useful**: "add this trip / each day's activities to my calendar" + read your availability when picking dates. Turn on only if you want that feature. |
| **gmail** | not connected | Not needed. |

**Bottom line: turn on `vercel` (opt.), and connect `google_calendar` only if you want calendar sync as a real feature.** None of these are blockers — the app runs without any of them.

### What actually blocks "live data" (not a connector — API keys)
Connectors won't give the app flight/restaurant data. Those come from third-party APIs, each needing **your own key**, and most need approval/paid tiers:

| Need | Real source | Reality |
|---|---|---|
| Flights | Amadeus Self-Service, Duffel, Kiwi/Tequila | Amadeus free tier is fine for demos (test env is limited/flaky); Duffel needs an account + sandbox token. |
| Trains / intercity | Rome2Rio, Transitland, IRCTC/eRail (no public API), Rail Europe | No good free global option; Rome2Rio is paid. Booking is usually a **deep link**, not a booking API. |
| Restaurants / places / photos | Google Places API, Foursquare, Yelp, OSM Overpass + Wikimedia | Google Places is the best but **requires billing enabled**. OSM Overpass + Wikimedia/Unsplash = **free, no key**, good enough for photo + location + rating-less POIs. |
| Maps tiles | MapLibre + OSM tiles | Free, no key. |

**My recommendation:** build it **mock-first with real deep links** (booking links to airline/IRCTC/Rail Europe/Google Maps all work as normal links), plus a `PROVIDERS` env switch. If you hand me an Amadeus or Duffel sandbox key + a Google Places key later, the same app flips to truly live data with no rewrite. That way nothing is fake-pretending-to-be-real, and you get a working product today instead of blocked-on-approval.

---

## 3. Decisions I need from you (before I write code)

1. **Stack** — Next.js full-stack (recommended, one codebase, easiest to deploy) vs. FastAPI + React (Python for the AI/scoring logic).
2. **Market/scope** — Pakistan-first domestic (PKR, Hunza/Skardu/Lahore/Karachi) + international, or global-from-day-one?
3. **Live data now or later** — mock-first with deep links (I can start immediately) vs. you supply API keys first (I wire real providers, but I'd be blocked until keys arrive).
4. **"AI"** — deterministic rule-based planner + scripted conversational logic (works offline, no key, predictable) vs. LLM-backed chat (needs an OpenAI/Gemini key; the conversational "reality check" feature is much better with it).

---

## 4. Build order once you confirm

1. Scaffold Next.js + Tailwind + design tokens (dark-first, single accent), app shell + sidebar + auth.
2. SQLite schema + migration + seed script (trips, itinerary items, places, expenses, users, chat).
3. Dashboard overview (stats, upcoming trip, budget rings, recent activity).
4. Trip CRUD + onboarding wizard (personality, dates, budget, pace).
5. Plan generator (provider interface + mock adapter) + itinerary editor with drag-reorder + optimistic updates.
6. Food/place cards: photo, rating band, hours, map link, booking deep link, saved-places CRUD.
7. Budget ledger + expense CRUD + budget-fit verdict engine.
8. Conversational panel: clarifying questions, reality checks, in-place re-planning.
9. Polish: skeletons, empty states, toasts, responsive, dark mode, `README` + `.env.example`.
10. Optional: deploy to Vercel.
