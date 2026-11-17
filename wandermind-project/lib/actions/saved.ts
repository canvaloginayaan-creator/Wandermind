"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, ensureReady, uid, nowIso } from "../db";
import { requireUser } from "../auth";
import { mapUrl } from "../utils";

const savedSchema = z.object({
  name: z.string().min(1, "Name it"),
  city: z.string().min(1, "Which city?"),
  category: z.string().default("food"),
  note: z.string().optional().default(""),
  price_band: z.string().optional().default("$$"),
  rating: z.coerce.number().optional(),
  image: z.string().optional().default(""),
  trip_id: z.string().optional(),
});

export async function addSavedPlaceAction(_prev: any, formData: FormData) {
  const user = await requireUser();
  const parsed = savedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  await ensureReady();
  const id = uid("sp");
  getDb()
    .prepare(
      `INSERT INTO saved_places (id, user_id, trip_id, name, city, category, note, image, rating,
        price_band, map_url, url, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      id,
      user.id,
      parsed.data.trip_id || null,
      parsed.data.name,
      parsed.data.city,
      parsed.data.category,
      parsed.data.note ?? "",
      parsed.data.image || "",
      parsed.data.rating ?? null,
      parsed.data.price_band ?? "",
      mapUrl(parsed.data.name, parsed.data.city),
      mapUrl(parsed.data.name, parsed.data.city),
      nowIso()
    );
  revalidatePath("/saved");
  revalidatePath("/trips");
  return { ok: true, id };
}

export async function updateSavedPlaceAction(input: {
  id: string;
  name?: string;
  city?: string;
  note?: string;
  category?: string;
  price_band?: string;
}) {
  const user = await requireUser();
  await ensureReady();
  const db = getDb();
  const row = db.prepare("SELECT * FROM saved_places WHERE id = ? AND user_id = ?").get(input.id, user.id) as any;
  if (!row) return { error: "Not found" };
  const fields: string[] = [];
  const values: any[] = [];
  for (const k of ["name", "city", "note", "category", "price_band"] as const) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(input[k]);
    }
  }
  if (!fields.length) return { ok: true };
  values.push(input.id);
  db.prepare(`UPDATE saved_places SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  revalidatePath("/saved");
  return { ok: true };
}

export async function deleteSavedPlaceAction(id: string) {
  const user = await requireUser();
  await ensureReady();
  getDb().prepare("DELETE FROM saved_places WHERE id = ? AND user_id = ?").run(id, user.id);
  revalidatePath("/saved");
  return { ok: true };
}

/** Save a place straight from an itinerary card. */
export async function saveFromItineraryAction(input: {
  name: string;
  city: string;
  category: string;
  image: string;
  rating: number | null;
  price_band: string;
  trip_id: string;
}) {
  const user = await requireUser();
  await ensureReady();
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM saved_places WHERE user_id = ? AND name = ? AND city = ?")
    .get(user.id, input.name, input.city) as any;
  if (existing) return { ok: true, id: existing.id, already: true };
  const id = uid("sp");
  db.prepare(
    `INSERT INTO saved_places (id, user_id, trip_id, name, city, category, note, image, rating,
      price_band, map_url, url, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    user.id,
    input.trip_id,
    input.name,
    input.city,
    input.category,
    "Saved from an itinerary",
    input.image,
    input.rating,
    input.price_band,
    mapUrl(input.name, input.city),
    mapUrl(input.name, input.city),
    nowIso()
  );
  revalidatePath("/saved");
  return { ok: true, id };
}
