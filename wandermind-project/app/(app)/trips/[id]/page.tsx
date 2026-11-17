import { requireUser } from "@/lib/auth";
import { getItinerary, getTrip } from "@/lib/queries";
import { ItineraryBoard } from "@/components/trips/ItineraryBoard";
import { Icon } from "@/components/ui/Icon";
import { money, minsToDur, timeToMins } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TripItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getTrip(id, user.id);
  if (!trip) notFound();
  const items = await getItinerary(id);

  const planned = items.reduce((s, i) => s + i.cost, 0);
  const transport = items.filter((i) => i.kind === "transport");
  const stay = items.find((i) => i.kind === "stay");
  const left = trip.budget_total - planned;
  const days = new Set(items.map((i) => i.day_date)).size;

  const outbound = transport[0];
  const travelTime = transport.reduce((s, t) => {
    if (!t.start_time || !t.end_time) return s;
    const diff = timeToMins(t.end_time) - timeToMins(t.start_time);
    return s + (diff > 0 ? diff : diff + 1440);
  }, 0);

  if (!items.length) {
    return <ItineraryBoard trip={trip} items={items} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="card flex items-start gap-3 p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sea-500/12 text-sea-300">
            <Icon name="plane" size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">Outbound</p>
            <p className="truncate text-xs font-semibold">{outbound ? outbound.title : "Not set"}</p>
            <p className="truncate text-[10px] fg-muted">
              {outbound ? `${outbound.start_time} · ${money(outbound.cost, trip.currency)}` : "—"}
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-500/12 text-sand-300">
            <Icon name="bed" size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">Staying</p>
            <p className="truncate text-xs font-semibold">{stay ? stay.title.replace("Check in — ", "") : "Not set"}</p>
            <p className="truncate text-[10px] fg-muted">{stay ? money(stay.cost, trip.currency) : "—"}</p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ember-500/12 text-ember-300">
            <Icon name="wallet" size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">
              {left >= 0 ? "Left to spend" : "Over budget"}
            </p>
            <p className={`truncate text-xs font-semibold ${left < 0 ? "text-red-300" : ""}`}>
              {money(Math.abs(left), trip.currency)}
            </p>
            <p className="truncate text-[10px] fg-muted">
              {days} planned days · {travelTime ? `${minsToDur(travelTime)} in transit` : "—"}
            </p>
          </div>
        </div>
      </div>

      <ItineraryBoard trip={trip} items={items} />
    </div>
  );
}
