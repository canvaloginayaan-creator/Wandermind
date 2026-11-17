"use server";

import { revalidatePath } from "next/cache";
import { getDb, ensureReady, uid, nowIso } from "../db";
import { requireUser } from "../auth";
import { getItinerary, getMessages, getTrip } from "../queries";
import { assistantReply } from "../assistant";
import { eachDay } from "../utils";

export async function sendMessageAction(tripId: string, content: string) {
  const user = await requireUser();
  await ensureReady();
  const trip = await getTrip(tripId, user.id);
  if (!trip) return { error: "Trip not found" };

  const db = getDb();
  const userMsgId = uid("msg");
  db.prepare(
    "INSERT INTO messages (id, trip_id, user_id, role, content, created_at) VALUES (?,?,?,?,?,?)"
  ).run(userMsgId, tripId, user.id, "user", content, nowIso());

  const [items, history] = await Promise.all([getItinerary(tripId), getMessages(tripId)]);
  const plannedSpend = items.reduce((s, i) => s + i.cost, 0);
  const logged = db
    .prepare("SELECT COALESCE(SUM(amount),0) AS s FROM expenses WHERE trip_id = ? AND kind='actual'")
    .get(tripId) as { s: number };

  const reply = await assistantReply(
    {
      trip,
      items,
      plannedSpend,
      loggedSpend: Number(logged.s ?? 0),
      days: eachDay(trip.start_date, trip.end_date).length,
    },
    content,
    history.map((m) => ({ role: m.role, content: m.content }))
  );

  const id = uid("msg");
  db.prepare(
    "INSERT INTO messages (id, trip_id, user_id, role, content, created_at) VALUES (?,?,?,?,?,?)"
  ).run(id, tripId, user.id, "assistant", reply.content, nowIso());

  revalidatePath(`/trips/${tripId}/assistant`);
  return { ok: true, reply: reply.content, suggestions: reply.suggestions, source: reply.source };
}

export async function clearChatAction(tripId: string) {
  const user = await requireUser();
  await ensureReady();
  const trip = await getTrip(tripId, user.id);
  if (!trip) return { error: "Trip not found" };
  getDb().prepare("DELETE FROM messages WHERE trip_id = ? AND user_id = ?").run(tripId, user.id);
  revalidatePath(`/trips/${tripId}/assistant`);
  return { ok: true };
}
