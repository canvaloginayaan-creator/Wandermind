import { getDb, ensureReady } from "./db";
import type {
  Expense,
  ItineraryItem,
  Message,
  SavedPlace,
  Trip,
  TripSummary,
} from "./types";
import { eachDay } from "./utils";

const parseTrip = (r: any): Trip => ({
  ...r,
  personalities: typeof r.personalities === "string" ? JSON.parse(r.personalities) : r.personalities,
});

const parseItem = (r: any): ItineraryItem => ({
  ...r,
  tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags ?? [],
  meta: typeof r.meta === "string" && r.meta ? JSON.parse(r.meta) : r.meta ?? null,
});

export async function listTrips(userId: string): Promise<TripSummary[]> {
  await ensureReady();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.*,
        (SELECT COUNT(*) FROM itinerary_items i WHERE i.trip_id = t.id) AS itinerary_count,
        (SELECT COALESCE(SUM(cost),0) FROM itinerary_items i WHERE i.trip_id = t.id) AS planned_spend,
        (SELECT COALESCE(SUM(amount),0) FROM expenses e WHERE e.trip_id = t.id AND e.kind='actual') AS logged_spend
       FROM trips t WHERE t.user_id = ?
       ORDER BY CASE t.status WHEN 'booked' THEN 0 WHEN 'planned' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END,
                t.start_date ASC`
    )
    .all(userId) as any[];
  return rows.map((r) => ({
    ...parseTrip(r),
    itinerary_count: Number(r.itinerary_count ?? 0),
    planned_spend: Number(r.planned_spend ?? 0),
    logged_spend: Number(r.logged_spend ?? 0),
  }));
}

export async function getTrip(tripId: string, userId: string): Promise<Trip | null> {
  await ensureReady();
  const row = getDb()
    .prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?")
    .get(tripId, userId) as any;
  return row ? parseTrip(row) : null;
}

export async function getItinerary(tripId: string): Promise<ItineraryItem[]> {
  await ensureReady();
  const rows = getDb()
    .prepare(
      "SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY day_date ASC, position ASC"
    )
    .all(tripId) as any[];
  return rows.map(parseItem);
}

export async function getExpenses(tripId: string): Promise<Expense[]> {
  await ensureReady();
  return getDb()
    .prepare("SELECT * FROM expenses WHERE trip_id = ? ORDER BY spent_on DESC, created_at DESC")
    .all(tripId) as Expense[];
}

export async function getAllExpenses(userId: string): Promise<(Expense & { trip_title: string })[]> {
  await ensureReady();
  return getDb()
    .prepare(
      `SELECT e.*, t.title AS trip_title FROM expenses e
       JOIN trips t ON t.id = e.trip_id
       WHERE e.user_id = ? ORDER BY e.spent_on DESC LIMIT 300`
    )
    .all(userId) as any[];
}

export async function getSavedPlaces(userId: string): Promise<SavedPlace[]> {
  await ensureReady();
  return getDb()
    .prepare("SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as SavedPlace[];
}

export async function getMessages(tripId: string): Promise<Message[]> {
  await ensureReady();
  return getDb()
    .prepare("SELECT * FROM messages WHERE trip_id = ? ORDER BY created_at ASC")
    .all(tripId) as Message[];
}

export async function getDashboardStats(userId: string) {
  await ensureReady();
  const db = getDb();
  const trips = await listTrips(userId);
  const active = trips.filter((t) => t.status !== "archived");
  const upcoming = active
    .filter((t) => t.end_date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const spent = db
    .prepare("SELECT COALESCE(SUM(amount),0) AS s FROM expenses WHERE user_id = ? AND kind='actual'")
    .get(userId) as { s: number };
  const planned = active.reduce((sum, t) => sum + t.planned_spend, 0);
  const budget = active.reduce((sum, t) => sum + t.budget_total, 0);
  const days = active.reduce(
    (sum, t) => sum + eachDay(t.start_date, t.end_date).length,
    0
  );
  const saved = db
    .prepare("SELECT COUNT(*) AS c FROM saved_places WHERE user_id = ?")
    .get(userId) as { c: number };

  return {
    trips: active,
    upcoming,
    nextTrip: upcoming[0] ?? null,
    totals: {
      trips: active.length,
      days,
      budget,
      planned,
      spent: Number(spent.s ?? 0),
      savedPlaces: Number(saved.c ?? 0),
      countries: new Set(active.map((t) => t.country)).size,
    },
  };
}
