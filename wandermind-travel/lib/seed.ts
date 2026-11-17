import type { DB } from "./sqlite";
import bcrypt from "bcryptjs";
import { uid, nowIso } from "./db";
import { buildPlan } from "./planner";
import { PLACES } from "./data/places";
import { mapUrl } from "./utils";
import type { Pace, Personality } from "./types";

const DEMO_USER_ID = "usr_demo_ayesha";
export const DEMO_EMAIL = "demo@wandermind.app";
export const DEMO_PASSWORD = "demo1234";

type TripSeed = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  travelers: number;
  personalities: Personality[];
  pace: Pace;
  status: string;
  cover_image: string;
  notes: string;
  generate: boolean;
};

const TRIPS: TripSeed[] = [
  {
    id: "trip_lahore_food",
    title: "Lahore, and eating my way through it",
    origin: "Karachi",
    destination: "Lahore",
    country: "Pakistan",
    start_date: "2026-12-04",
    end_date: "2026-12-07",
    budget_total: 95000,
    travelers: 2,
    personalities: ["foodie", "culture", "shopping"],
    pace: "balanced",
    status: "booked",
    cover_image: "/img/dest-lahore.jpg",
    notes:
      "Nani's house is full so we're hotel-ing it. Must: Butt Karahi, Wazir Khan, Liberty for kurtas. Keep Saturday evening free for Fort Road.",
    generate: true,
  },
  {
    id: "trip_hunza_spring",
    title: "Hunza in blossom season",
    origin: "Karachi",
    destination: "Hunza",
    country: "Pakistan",
    start_date: "2027-04-10",
    end_date: "2027-04-16",
    budget_total: 340000,
    travelers: 2,
    personalities: ["nature", "photo", "adventure", "culture"],
    pace: "slow",
    status: "planned",
    cover_image: "/img/dest-hunza.jpg",
    notes:
      "Blossom timing is everything — last week of March to second week of April. Want at least two nights where nothing is planned.",
    generate: true,
  },
  {
    id: "trip_skardu_deosai",
    title: "Skardu + Deosai (needs planning)",
    origin: "Karachi",
    destination: "Skardu",
    country: "Pakistan",
    start_date: "2027-07-10",
    end_date: "2027-07-17",
    budget_total: 720000,
    travelers: 4,
    personalities: ["adventure", "nature", "photo"],
    pace: "packed",
    status: "draft",
    cover_image: "/img/dest-skardu.jpg",
    notes: "Deosai is only open June–September, so July it is. Need a 4x4 and a guide who actually knows the plateau.",
    generate: false,
  },
  {
    id: "trip_karachi_coast",
    title: "Karachi coast, no itinerary discipline",
    origin: "Islamabad",
    destination: "Karachi",
    country: "Pakistan",
    start_date: "2026-10-02",
    end_date: "2026-10-05",
    budget_total: 70000,
    travelers: 2,
    personalities: ["foodie", "nightlife", "relax"],
    pace: "slow",
    status: "booked",
    cover_image: "/img/dest-karachi.jpg",
    notes: "Went for a cousin's wedding. Ended up eating on Burns Road three nights out of three.",
    generate: true,
  },
  {
    id: "trip_bangkok",
    title: "Bangkok on street food and one nice dinner",
    origin: "Karachi",
    destination: "Bangkok",
    country: "Thailand",
    start_date: "2027-02-12",
    end_date: "2027-02-18",
    budget_total: 620000,
    travelers: 2,
    personalities: ["foodie", "shopping", "nightlife"],
    pace: "balanced",
    status: "planned",
    cover_image: "/img/food-street.jpg",
    notes: "Visa on arrival. Chatuchak is weekend-only so the dates are locked to a Saturday.",
    generate: true,
  },
];

const EXTRA_EXPENSES: {
  trip: string;
  category: string;
  label: string;
  amount: number;
  spent_on: string;
  kind: "planned" | "actual";
}[] = [
  { trip: "trip_lahore_food", category: "transport", label: "Pakistan Railways business sleeper, 2 return seats", amount: 29500, spent_on: "2026-11-09", kind: "actual" },
  { trip: "trip_lahore_food", category: "stay", label: "Luxus Grand, 3 nights deposit", amount: 36000, spent_on: "2026-11-11", kind: "actual" },
  { trip: "trip_lahore_food", category: "food", label: "Advance: Butt Karahi estimate", amount: 3000, spent_on: "2026-11-14", kind: "planned" },
  { trip: "trip_lahore_food", category: "shopping", label: "Kurta budget (Liberty)", amount: 8000, spent_on: "2026-12-05", kind: "planned" },
  { trip: "trip_karachi_coast", category: "food", label: "Burns Road crawl (3 nights)", amount: 5400, spent_on: "2026-10-03", kind: "actual" },
  { trip: "trip_karachi_coast", category: "transport", label: "Careem / local rides", amount: 6800, spent_on: "2026-10-04", kind: "actual" },
  { trip: "trip_karachi_coast", category: "stay", label: "Clifton guesthouse, 3 nights", amount: 24000, spent_on: "2026-10-02", kind: "actual" },
  { trip: "trip_hunza_spring", category: "transport", label: "Hold: ISB→GIL seats (refundable)", amount: 58000, spent_on: "2026-11-15", kind: "planned" },
  { trip: "trip_bangkok", category: "transport", label: "Thai Airways KHI→BKK, 2 pax", amount: 168000, spent_on: "2026-11-12", kind: "planned" },
];

const SAVED_PLACES = [
  { name: "Butt Karahi", city: "Lahore", category: "food", note: "Non-negotiable. Go at 7pm before the queue.", pb: "$$" },
  { name: "Eagle's Nest Viewpoint", city: "Hunza", category: "nature", note: "Sunrise, not sunset. Take a jeep, not the Corolla.", pb: "$" },
  { name: "Burns Road Food Street", city: "Karachi", category: "food", note: "Start at Waheed Kabab House, end at the falooda cart.", pb: "$" },
  { name: "Wazir Khan Mosque", city: "Lahore", category: "culture", note: "Best tilework in the country. Go early, light is better.", pb: "$$" },
  { name: "Jay Fai", city: "Bangkok", category: "food", note: "Queue by 8am. One crab omelette, split it.", pb: "$$$" },
  { name: "Shangrila (Lower Kachura) Lake", city: "Skardu", category: "nature", note: "Morning is glassy. Boats are cash only.", pb: "$$" },
];

const MESSAGES = [
  {
    role: "assistant" as const,
    content:
      "I've read the Lahore plan — 4 days, 2 of you, ₨95,000. Before you book anything, one honest number: your outbound is the 8pm business sleeper, which puts you in Lahore at 3pm the next day. That means day one is a train, and you have two and a half usable days.\n\nThe alternative is a flight at roughly twice the price, which buys you half a day — and in late December, Karachi airport fog can cost you more than that anyway. I'd keep the train and spend the difference on eating.\n\nSo: is food the point of this trip, or is the fort-and-mosque sightseeing the point? I'd build a different itinerary for each.",
  },
  {
    role: "user" as const,
    content: "Food is definitely the point. But I do want the fort and the mosque.",
  },
  {
    role: "assistant" as const,
    content:
      "Good — then mornings for history while it's cool and quiet, evenings for eating. That's roughly what I've built, with one exception I'd change.\n\nYou've got Badshahi Mosque and Lahore Fort on the same day. Both are big, both involve walking on stone, and by the time you finish the second one you won't enjoy it. Split them: fort first thing Saturday, mosque at golden hour on Sunday before Fort Road.\n\nThe other honest thing: ₨95,000 is comfortable but not generous once two rail tickets are paid for. Your arrive-day only has dinner in it because you land at 3pm — that's not me being lazy, that's the timetable. If you want a full first day, the flight is the only way to buy it.",
  },
  {
    role: "user" as const,
    content: "Honestly yes, but I want one night in the old city. Can we do one night each?",
  },
  {
    role: "assistant" as const,
    content:
      "That's the right answer and it's what I'd do. One night inside the Walled City for the atmosphere (and because Fort Road is a five-minute walk home at midnight), the rest in Gulberg where parking, hot water and breakfast actually work.\n\nI've noted it in the trip. Your remaining headroom after transport and stay is about ₨18,000 for food and entries across four days — that's ₨4,500 a day for two people, which is plenty for Lahore if you eat where the city eats.\n\nDo you want me to lock the Friday morning flight instead of the Thursday night one?",
  },
];

export async function seedDatabase(db: DB) {
  const existing = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (existing.c > 0) return;
  const ts = nowIso();

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, home_city, currency, avatar_hue, created_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    DEMO_USER_ID,
    DEMO_EMAIL,
    "Ayesha Khan",
    bcrypt.hashSync(DEMO_PASSWORD, 10),
    "Karachi",
    "PKR",
    22,
    ts
  );

  for (const t of TRIPS) {
    db.prepare(
      `INSERT INTO trips (id, user_id, title, origin, destination, country, start_date, end_date,
        budget_total, currency, travelers, personalities, pace, status, cover_image, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      t.id,
      DEMO_USER_ID,
      t.title,
      t.origin,
      t.destination,
      t.country,
      t.start_date,
      t.end_date,
      t.budget_total,
      "PKR",
      t.travelers,
      JSON.stringify(t.personalities),
      t.pace,
      t.status,
      t.cover_image,
      t.notes,
      ts,
      ts
    );

    if (!t.generate) continue;

    const plan = await buildPlan({
      origin: t.origin,
      destination: t.destination,
      startDate: t.start_date,
      endDate: t.end_date,
      budget: t.budget_total,
      currency: "PKR",
      travelers: t.travelers,
      personalities: t.personalities,
      pace: t.pace,
    });

    const ins = db.prepare(
      `INSERT INTO itinerary_items (id, trip_id, day_date, position, kind, title, subtitle, start_time,
        end_time, location_name, cost, booking_url, booking_label, provider_name, image, rating,
        price_band, map_url, tags, is_live, meta, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );

    for (const it of plan.items) {
      ins.run(
        uid("itm"),
        t.id,
        it.day_date,
        it.position,
        it.kind,
        it.title,
        it.subtitle ?? "",
        it.start_time ?? "",
        it.end_time ?? "",
        it.location_name ?? "",
        it.cost,
        it.booking_url ?? "",
        it.booking_label ?? "",
        it.provider_name ?? "",
        it.image ?? "",
        it.rating ?? null,
        it.price_band ?? "",
        it.map_url ?? "",
        JSON.stringify(it.tags ?? []),
        it.is_live ? 1 : 0,
        it.meta ? JSON.stringify(it.meta) : null,
        ts
      );
    }

    // planned expenses from the generated budget
    const exp = db.prepare(
      `INSERT INTO expenses (id, trip_id, user_id, category, label, amount, currency, spent_on, kind, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    for (const line of plan.budget) {
      if (line.key === "buffer") continue;
      exp.run(
        uid("exp"),
        t.id,
        DEMO_USER_ID,
        line.key === "activity" ? "activity" : line.key,
        `${line.label} (planned)`,
        line.amount,
        "PKR",
        t.start_date,
        "planned",
        ts
      );
    }
  }

  const exp = db.prepare(
    `INSERT INTO expenses (id, trip_id, user_id, category, label, amount, currency, spent_on, kind, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  for (const e of EXTRA_EXPENSES) {
    exp.run(uid("exp"), e.trip, DEMO_USER_ID, e.category, e.label, e.amount, "PKR", e.spent_on, e.kind, ts);
  }

  const sp = db.prepare(
    `INSERT INTO saved_places (id, user_id, trip_id, name, city, category, note, image, rating,
      price_band, map_url, url, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const s of SAVED_PLACES) {
    const src = PLACES.find((p) => p.name === s.name && p.city === s.city);
    sp.run(
      uid("sp"),
      DEMO_USER_ID,
      null,
      s.name,
      s.city,
      s.category,
      s.note,
      src?.image ?? "/img/food-street.jpg",
      src?.rating ?? 4.5,
      s.pb,
      mapUrl(s.name, s.city),
      mapUrl(s.name, s.city),
      ts
    );
  }

  const msg = db.prepare(
    `INSERT INTO messages (id, trip_id, user_id, role, content, created_at) VALUES (?,?,?,?,?,?)`
  );
  MESSAGES.forEach((m, i) => {
    msg.run(
      uid("msg"),
      "trip_lahore_food",
      DEMO_USER_ID,
      m.role,
      m.content,
      new Date(Date.now() - (MESSAGES.length - i) * 3600_000).toISOString()
    );
  });

  console.log("[wandermind] seeded demo data");
}
