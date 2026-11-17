"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, ensureReady, uid, nowIso } from "../db";
import { requireUser } from "../auth";
import { buildPlan } from "../planner";
import { getTrip } from "../queries";
import { findDestination } from "../data/places";
import type { Pace } from "../types";

const tripSchema = z.object({
  title: z.string().min(2, "Give the trip a name"),
  origin: z.string().min(2, "Where are you leaving from?"),
  destination: z.string().min(2, "Where are you going?"),
  start_date: z.string().min(8, "Pick a start date"),
  end_date: z.string().min(8, "Pick an end date"),
  budget_total: z.coerce.number().positive("Budget must be more than zero"),
  travelers: z.coerce.number().int().min(1).max(20),
  pace: z.enum(["slow", "balanced", "packed"]),
  personalities: z.string().optional(),
  notes: z.string().optional(),
});

export type TripActionState = {
  ok?: boolean;
  error?: string;
  tripId?: string;
  warnings?: { title: string; body: string; severity: string }[];
};

function normalise(input: z.infer<typeof tripSchema>, currency: string) {
  if (input.end_date < input.start_date) {
    // tolerate reversed dates rather than failing the user
    [input.start_date, input.end_date] = [input.end_date, input.start_date];
  }
  const dest = findDestination(input.destination);
  return {
    ...input,
    country: dest?.country ?? "Pakistan",
    currency,
    cover_image: dest?.image ?? "/img/hero.jpg",
    personalities: input.personalities
      ? input.personalities.split(",").filter(Boolean)
      : (["foodie"] as string[]),
  };
}

export async function createTripAction(_prev: any, formData: FormData): Promise<TripActionState> {
  const user = await requireUser();
  await ensureReady();
  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const data = normalise(parsed.data, user.currency);
  const db = getDb();
  const id = uid("trip");
  const ts = nowIso();
  const generate = formData.get("generate") !== "false";

  db.prepare(
    `INSERT INTO trips (id, user_id, title, origin, destination, country, start_date, end_date,
      budget_total, currency, travelers, personalities, pace, status, cover_image, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    user.id,
    data.title,
    data.origin,
    data.destination,
    data.country,
    data.start_date,
    data.end_date,
    data.budget_total,
    data.currency,
    data.travelers,
    JSON.stringify(data.personalities),
    data.pace,
    generate ? "planned" : "draft",
    data.cover_image,
    data.notes ?? "",
    ts,
    ts
  );

  let warnings: TripActionState["warnings"] = [];
  if (generate) {
    const res = await generatePlanAction(id);
    warnings = res.warnings ?? [];
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { ok: true, tripId: id, warnings };
}

export async function updateTripAction(_prev: any, formData: FormData): Promise<TripActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const trip = await getTrip(id, user.id);
  if (!trip) return { error: "Trip not found" };
  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const data = normalise(parsed.data, trip.currency);
  getDb()
    .prepare(
      `UPDATE trips SET title=?, origin=?, destination=?, country=?, start_date=?, end_date=?,
        budget_total=?, travelers=?, personalities=?, pace=?, cover_image=?, notes=?, updated_at=?
       WHERE id=? AND user_id=?`
    )
    .run(
      data.title,
      data.origin,
      data.destination,
      data.country,
      data.start_date,
      data.end_date,
      data.budget_total,
      data.travelers,
      JSON.stringify(data.personalities),
      data.pace,
      data.cover_image,
      data.notes ?? "",
      nowIso(),
      id,
      user.id
    );
  revalidatePath(`/trips/${id}`);
  revalidatePath("/trips");
  return { ok: true, tripId: id };
}

export async function setTripStatusAction(id: string, status: string) {
  const user = await requireUser();
  getDb()
    .prepare("UPDATE trips SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .run(status, nowIso(), id, user.id);
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTripAction(id: string) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM trips WHERE id = ? AND user_id = ?").run(id, user.id);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function duplicateTripAction(id: string) {
  const user = await requireUser();
  const db = getDb();
  const trip = await getTrip(id, user.id);
  if (!trip) return { error: "Trip not found" };
  const newId = uid("trip");
  const ts = nowIso();
  db.prepare(
    `INSERT INTO trips (id, user_id, title, origin, destination, country, start_date, end_date,
      budget_total, currency, travelers, personalities, pace, status, cover_image, notes, created_at, updated_at)
     SELECT ?, user_id, title || ' (copy)', origin, destination, country, start_date, end_date,
      budget_total, currency, travelers, personalities, pace, 'draft', cover_image, notes, ?, ?
     FROM trips WHERE id = ? AND user_id = ?`
  ).run(newId, ts, ts, id, user.id);
  const items = db
    .prepare("SELECT * FROM itinerary_items WHERE trip_id = ?")
    .all(id) as any[];
  const ins = db.prepare(
    `INSERT INTO itinerary_items (id, trip_id, day_date, position, kind, title, subtitle, start_time,
      end_time, location_name, cost, booking_url, booking_label, provider_name, image, rating,
      price_band, map_url, tags, is_live, meta, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const it of items) {
    ins.run(
      uid("itm"), newId, it.day_date, it.position, it.kind, it.title, it.subtitle, it.start_time,
      it.end_time, it.location_name, it.cost, it.booking_url, it.booking_label, it.provider_name,
      it.image, it.rating, it.price_band, it.map_url, it.tags, it.is_live, it.meta, ts
    );
  }
  revalidatePath("/trips");
  return { ok: true, tripId: newId };
}

export async function generatePlanAction(tripId: string, replace = true) {
  const user = await requireUser();
  await ensureReady();
  const trip = await getTrip(tripId, user.id);
  if (!trip) return { error: "Trip not found" };

  const plan = await buildPlan({
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    budget: trip.budget_total,
    currency: trip.currency,
    travelers: trip.travelers,
    personalities: trip.personalities as string[],
    pace: trip.pace as Pace,
  });

  const db = getDb();
  const ts = nowIso();
  if (replace) {
    db.prepare("DELETE FROM itinerary_items WHERE trip_id = ?").run(tripId);
    db.prepare("DELETE FROM expenses WHERE trip_id = ? AND kind = 'planned'").run(tripId);
  }
  const ins = db.prepare(
    `INSERT INTO itinerary_items (id, trip_id, day_date, position, kind, title, subtitle, start_time,
      end_time, location_name, cost, booking_url, booking_label, provider_name, image, rating,
      price_band, map_url, tags, is_live, meta, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const it of plan.items) {
    ins.run(
      uid("itm"), tripId, it.day_date, it.position, it.kind, it.title, it.subtitle ?? "",
      it.start_time ?? "", it.end_time ?? "", it.location_name ?? "", it.cost,
      it.booking_url ?? "", it.booking_label ?? "", it.provider_name ?? "", it.image ?? "",
      it.rating ?? null, it.price_band ?? "", it.map_url ?? "", JSON.stringify(it.tags ?? []),
      it.is_live ? 1 : 0, it.meta ? JSON.stringify(it.meta) : null, ts
    );
  }
  const exp = db.prepare(
    `INSERT INTO expenses (id, trip_id, user_id, category, label, amount, currency, spent_on, kind, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  for (const line of plan.budget) {
    if (line.key === "buffer") continue;
    exp.run(
      uid("exp"), tripId, user.id,
      line.key === "activity" ? "activity" : line.key,
      `${line.label} (planned)`, line.amount, trip.currency, trip.start_date, "planned", ts
    );
  }
  db.prepare("UPDATE trips SET status = 'planned', updated_at = ? WHERE id = ?").run(ts, tripId);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  revalidatePath("/budget");

  return {
    ok: true as const,
    summary: plan.summary,
    total: plan.total,
    fits: plan.fits,
    delta: plan.delta,
    warnings: plan.warnings.map((w) => ({ title: w.title, body: w.body, severity: w.severity })),
  };
}

/** Re-plan a single day keeping everything else — used by the chat actions. */
export async function regenerateDayAction(tripId: string, day: string) {
  const user = await requireUser();
  const trip = await getTrip(tripId, user.id);
  if (!trip) return { error: "Trip not found" };
  const plan = await buildPlan({
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    budget: trip.budget_total,
    currency: trip.currency,
    travelers: trip.travelers,
    personalities: trip.personalities as string[],
    pace: trip.pace as Pace,
  });
  const dayItems = plan.items.filter((i) => i.day_date === day);
  const db = getDb();
  db.prepare("DELETE FROM itinerary_items WHERE trip_id = ? AND day_date = ?").run(tripId, day);
  const ts = nowIso();
  const ins = db.prepare(
    `INSERT INTO itinerary_items (id, trip_id, day_date, position, kind, title, subtitle, start_time,
      end_time, location_name, cost, booking_url, booking_label, provider_name, image, rating,
      price_band, map_url, tags, is_live, meta, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const it of dayItems) {
    ins.run(
      uid("itm"), tripId, it.day_date, it.position, it.kind, it.title, it.subtitle ?? "",
      it.start_time ?? "", it.end_time ?? "", it.location_name ?? "", it.cost,
      it.booking_url ?? "", it.booking_label ?? "", it.provider_name ?? "", it.image ?? "",
      it.rating ?? null, it.price_band ?? "", it.map_url ?? "", JSON.stringify(it.tags ?? []),
      it.is_live ? 1 : 0, it.meta ? JSON.stringify(it.meta) : null, ts
    );
  }
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function createTripFromDiscoveryAction(input: {
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  personalities: string[];
  pace: Pace;
}) {
  const user = await requireUser();
  const fd = new FormData();
  fd.set("title", input.title);
  fd.set("origin", input.origin);
  fd.set("destination", input.destination);
  fd.set("start_date", input.start_date);
  fd.set("end_date", input.end_date);
  fd.set("budget_total", String(input.budget));
  fd.set("travelers", String(input.travelers));
  fd.set("pace", input.pace);
  fd.set("personalities", input.personalities.join(","));
  fd.set("generate", "true");
  const res = await createTripAction(null, fd);
  return res;
}

