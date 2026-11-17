import Link from "next/link";
import { cx, fmtDate, money, relDays } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { StatusPill, ProgressBar } from "@/components/shared/StatCard";
import { personalityLabel } from "@/lib/types";
import type { TripSummary } from "@/lib/types";

export function TripCard({ trip, compact }: { trip: TripSummary; compact?: boolean }) {
  const ratio = trip.budget_total > 0 ? (trip.planned_spend || trip.logged_spend) / trip.budget_total : 0;
  const done = trip.end_date < new Date().toISOString().slice(0, 10);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className={cx("card card-hover group block overflow-hidden", trip.status === "archived" && "opacity-70")}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.cover_image || "/img/hero.jpg"}
          alt={trip.destination}
          className={cx("w-full object-cover transition duration-500 group-hover:scale-[1.03]", compact ? "h-28" : "h-40")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md bg-ink-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
            {trip.destination}
          </span>
          {!done && trip.status !== "archived" && (
            <span className="rounded-md bg-ember-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-950">
              {relDays(trip.start_date)}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <StatusPill status={trip.status} />
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug text-white">
            {trip.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 text-xs fg-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" size={13} />
            {fmtDate(trip.start_date)} – {fmtDate(trip.end_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="users" size={13} />
            {trip.travelers}
          </span>
        </div>

        {!compact && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {trip.personalities.slice(0, 3).map((p) => (
              <span key={p} className="chip px-2 py-0.5 text-[10px]">
                {personalityLabel(p)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="fg-muted">
              {money(trip.planned_spend || trip.logged_spend, trip.currency, true)} planned
            </span>
            <span className={cx("font-semibold tabular-nums", ratio > 1 ? "text-red-300" : "fg-muted")}>
              of {money(trip.budget_total, trip.currency, true)}
            </span>
          </div>
          <ProgressBar ratio={ratio} color={ratio > 1 ? "#f87171" : ratio > 0.9 ? "#ffb457" : "#4bc0ae"} />
        </div>
      </div>
    </Link>
  );
}
