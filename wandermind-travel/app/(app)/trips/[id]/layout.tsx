import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getItinerary, getTrip } from "@/lib/queries";
import { TripTabs } from "@/components/trips/TripTabs";
import { TripActions } from "@/components/trips/TripActions";
import { StatusPill, ProgressBar } from "@/components/shared/StatCard";
import { Icon } from "@/components/ui/Icon";
import { cx, daysBetween, fmtDate, money, relDays } from "@/lib/utils";
import { personalityLabel } from "@/lib/types";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getTrip(id, user.id);
  if (!trip) notFound();
  const items = await getItinerary(id);
  const planned = items.reduce((s, i) => s + i.cost, 0);
  const ratio = trip.budget_total ? planned / trip.budget_total : 0;
  const days = daysBetween(trip.start_date, trip.end_date);

  return (
    <>
      <div className="relative overflow-hidden border-b hairline">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trip.cover_image || "/img/hero.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg))] via-ink-950/85 to-ink-950/50" />
        <div className="relative px-5 pb-5 pt-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
              {trip.destination}, {trip.country}
            </span>
            <StatusPill status={trip.status} />
            <span className="rounded-md bg-white/10 px-2 py-1 font-medium text-white/80 backdrop-blur">
              {relDays(trip.start_date)}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[30px]">
                {trip.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/75">
                <span className="flex items-center gap-1.5">
                  <Icon name="route" size={13} /> {trip.origin} → {trip.destination}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar" size={13} /> {fmtDate(trip.start_date)} – {fmtDate(trip.end_date)} · {days} days
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="users" size={13} /> {trip.travelers} traveller{trip.travelers > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="wallet" size={13} /> {money(planned, trip.currency)} of {money(trip.budget_total, trip.currency)}
                </span>
              </div>
            </div>
            <TripActions tripId={trip.id} status={trip.status} title={trip.title} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {trip.personalities.map((p) => (
              <span key={p} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                {personalityLabel(p)}
              </span>
            ))}
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium capitalize text-white/80 backdrop-blur">
              {trip.pace} pace
            </span>
          </div>

          <div className="mt-4 max-w-md">
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-white/60">
              <span>Budget used</span>
              <span className={cx("tabular-nums", ratio > 1 && "text-red-300")}>{Math.round(ratio * 100)}%</span>
            </div>
            <ProgressBar ratio={ratio} height={5} color={ratio > 1 ? "#f87171" : ratio > 0.9 ? "#ffb457" : "#4bc0ae"} />
          </div>
        </div>
      </div>

      <TripTabs tripId={trip.id} itemCount={items.length} />

      {children}
    </>
  );
}
