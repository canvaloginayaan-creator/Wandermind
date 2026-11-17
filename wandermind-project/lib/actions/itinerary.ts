"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, ensureReady, uid, nowIso } from "../db";
import { requireUser } from "../auth";
import { getTrip } from "../queries";
import { mapUrl } from "../utils";

async function assertTrip(tripId: string) {
  const user = await requireUser();
  const trip = await getTrip(tripId, user.id);
  if (!trip) throw new Error("Trip not found");
  return trip;
}

const itemSchema = z.object({
  trip_id: z.string().min(3),
  day_date: z.string().min(8),
  kind: z.enum(["transport", "stay", "food", "activity", "note"]).default("activity"),
  title: z.string().min(1, "Give it a name"),
  subtitle: z.string().optional().default(""),
  start_time: z.string().optional().default(""),
  end_time: z.string().optional().default(""),
  location_name: z.string().optional().default(""),
  cost: z.coerce.number().min(0).default(0),
  booking_url: z.string().optional().default(""),
  booking_label: z.string().optional().default(""),
  image: z.string().optional().default(""),
  price_band: z.string().optional().default(""),
});

export async function addItemAction(_prev: any, formData: FormData) {
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const trip = await assertTrip(parsed.data.trip_id);
  await ensureReady();
  const db = getDb();
  const dayCount = db
    .prepare("SELECT COALESCE(MAX(position),-1) AS p FROM itinerary_items WHERE trip_id = ? AND day_date = ?")
    .get(trip.id, parsed.data.day_date) as { p: number };
  const id = uid("itm");
  db.prepare(
    `INSERT INTO itinerary_items (id, trip_id, day_date, position, kind, title, subtitle, start_time,
      end_time, location_name, cost, booking_url, booking_label, provider_name, image, rating,
      price_band, map_url, tags, is_live, meta, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    trip.id,
    parsed.data.day_date,
    dayCount.p + 1,
    parsed.data.kind,
    parsed.data.title,
    parsed.data.subtitle ?? "",
    parsed.data.start_time ?? "",
    parsed.data.end_time ?? "",
    parsed.data.location_name ?? "",
    parsed.data.cost,
    parsed.data.booking_url || mapUrl(parsed.data.title, trip.destination),
    parsed.data.booking_label || "Open in Maps",
    "You",
    parsed.data.image || "",
    null,
    parsed.data.price_band || "",
    mapUrl(parsed.data.title, trip.destination),
    "[]",
    0,
    null,
    nowIso()
  );
  revalidatePath(`/trips/${trip.id}`);
  return { ok: true, id };
}

export async function updateItemAction(input: {
  id: string;
  title?: string;
  subtitle?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  cost?: number;
  booking_url?: string;
  kind?: string;
}) {
  await ensureReady();
  const db = getDb();
  const item = db.prepare("SELECT * FROM itinerary_items WHERE id = ?").get(input.id) as any;
  if (!item) return { error: "Item not found" };
  await assertTrip(item.trip_id);
  const fields: string[] = [];
  const values: any[] = [];
  for (const key of ["title", "subtitle", "start_time", "end_time", "location_name", "cost", "booking_url", "kind"] as const) {
    if (input[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(input[key]);
    }
  }
  if (!fields.length) return { ok: true };
  values.push(input.id);
  db.prepare(`UPDATE itinerary_items SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  revalidatePath(`/trips/${item.trip_id}`);
  return { ok: true };
}

export async function deleteItemAction(id: string) {
  await ensureReady();
  const db = getDb();
  const item = db.prepare("SELECT trip_id FROM itinerary_items WHERE id = ?").get(id) as any;
  if (!item) return { ok: true };
  await assertTrip(item.trip_id);
  db.prepare("DELETE FROM itinerary_items WHERE id = ?").run(id);
  revalidatePath(`/trips/${item.trip_id}`);
  return { ok: true };
}

/** Persist a whole reordered day at once (optimistic DnD). */
export async function reorderItemsAction(tripId: string, day: string, orderedIds: string[]) {
  await assertTrip(tripId);
  const db = getDb();
  const stmt = db.prepare("UPDATE itinerary_items SET position = ? WHERE id = ? AND trip_id = ?");
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => stmt.run(idx, id, tripId));
  });
  tx(orderedIds);
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function moveItemToDayAction(id: string, day: string) {
  await ensureReady();
  const db = getDb();
  const item = db.prepare("SELECT * FROM itinerary_items WHERE id = ?").get(id) as any;
  if (!item) return { error: "Item not found" };
  await assertTrip(item.trip_id);
  const max = db
    .prepare("SELECT COALESCE(MAX(position),-1) AS p FROM itinerary_items WHERE trip_id = ? AND day_date = ?")
    .get(item.trip_id, day) as { p: number };
  db.prepare("UPDATE itinerary_items SET day_date = ?, position = ? WHERE id = ?").run(
    day,
    max.p + 1,
    id
  );
  revalidatePath(`/trips/${item.trip_id}`);
  return { ok: true };
}
