import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureReady, uid, nowIso } from "@/lib/db";
import { getItinerary, getMessages, getTrip } from "@/lib/queries";
import { assistantReply } from "@/lib/assistant";
import { eachDay } from "@/lib/utils";
import { liveConfig } from "@/lib/providers/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureReady();
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { tripId?: string; content?: string };
  const content = (body.content ?? "").trim().slice(0, 2000);
  if (!body.tripId || !content) return new Response("Bad request", { status: 400 });

  const trip = await getTrip(body.tripId, user.id);
  if (!trip) return new Response("Not found", { status: 404 });

  const db = getDb();
  db.prepare(
    "INSERT INTO messages (id, trip_id, user_id, role, content, created_at) VALUES (?,?,?,?,?,?)"
  ).run(uid("msg"), trip.id, user.id, "user", content, nowIso());

  const [items, history] = await Promise.all([getItinerary(trip.id), getMessages(trip.id)]);
  const plannedSpend = items.reduce((s, i) => s + i.cost, 0);
  const logged = db
    .prepare("SELECT COALESCE(SUM(amount),0) AS s FROM expenses WHERE trip_id = ? AND kind='actual'")
    .get(trip.id) as { s: number };

  const reply = await assistantReply(
    {
      trip,
      items,
      plannedSpend,
      loggedSpend: Number(logged.s ?? 0),
      days: eachDay(trip.start_date, trip.end_date).length,
    },
    content,
    history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
  );

  const encoder = new TextEncoder();
  const assistantId = uid("msg");

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `[[meta]]${JSON.stringify({ id: assistantId, source: reply.source, llm: liveConfig().llm })}\n`
        )
      );
      const tokens = reply.content.match(/\S+\s*/g) ?? [reply.content];
      // let faster for LLM output (already high quality), slower "thinking" cadence for reasoning
      const delay = reply.source === "live-llm" ? 8 : 18;
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
        await new Promise((r) => setTimeout(r, delay));
      }
      db.prepare(
        "INSERT INTO messages (id, trip_id, user_id, role, content, created_at) VALUES (?,?,?,?,?,?)"
      ).run(assistantId, trip.id, user.id, "assistant", reply.content, nowIso());
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
