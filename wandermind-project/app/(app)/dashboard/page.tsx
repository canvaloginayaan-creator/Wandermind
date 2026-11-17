import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDashboardStats, getSavedPlaces } from "@/lib/queries";
import { PageHeader } from "@/components/shell/AppShell";
import { StatCard, BudgetRing, ProgressBar, StatusPill } from "@/components/shared/StatCard";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { daysBetween, fmtDate, money, relDays } from "@/lib/utils";
import { personalityLabel } from "@/lib/types";

export const metadata = { title: "Overview · WanderMind" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, saved] = await Promise.all([getDashboardStats(user.id), getSavedPlaces(user.id)]);
  const { totals, nextTrip, upcoming, trips } = stats;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const ratio = totals.budget > 0 ? totals.planned / totals.budget : 0;
  const daysToTrip = nextTrip
    ? Math.max(
        0,
        Math.round(
          (new Date(nextTrip.start_date + "T00:00:00Z").getTime() -
            new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) /
            864e5
        )
      )
    : null;

  return (
    <>
      <PageHeader
        eyebrow={greeting}
        title={`${user.name.split(" ")[0]}, here's where things stand`}
        subtitle={
          trips.length
            ? `${totals.trips} active trip${totals.trips === 1 ? "" : "s"} across ${totals.days} days, with ${money(totals.planned, user.currency)} of ${money(totals.budget, user.currency)} committed.`
            : "Nothing planned yet. The good kind of blank page."
        }
        actions={
          <>
            <Link href="/explore" className="btn-ghost text-sm">
              <Icon name="mountain" size={15} />
              Browse destinations
            </Link>
            <Link href="/trips/new" className="btn-primary text-sm">
              <Icon name="plus" size={15} />
              Plan a trip
            </Link>
          </>
        }
      />

      <div className="space-y-7 px-5 py-6 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active trips" value={String(totals.trips)} hint={`${totals.countries} destination${totals.countries === 1 ? "" : "s"}`} icon="compass" tone="ember" />
          <StatCard label="Planned spend" value={money(totals.planned, user.currency, true)} hint={`${Math.round(ratio * 100)}% of budget`} icon="wallet" tone="sea" />
          <StatCard label="Logged actuals" value={money(totals.spent, user.currency, true)} hint="Money actually spent" icon="check" />
          <StatCard label="Saved places" value={String(totals.savedPlaces)} hint="Food, sights, stays" icon="bookmark" />
        </div>

        {nextTrip ? (
          <section className="card overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_1fr]">
              <div className="relative min-h-[188px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nextTrip.cover_image} alt={nextTrip.destination} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/20" />
                <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-ember-500 text-ink-950">Next up</span>
                    <StatusPill status={nextTrip.status} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white">
                      {nextTrip.title}
                    </h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
                      <span className="flex items-center gap-1.5">
                        <Icon name="pin" size={13} /> {nextTrip.origin} → {nextTrip.destination}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="calendar" size={13} /> {fmtDate(nextTrip.start_date)} – {fmtDate(nextTrip.end_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="clock" size={13} /> {daysBetween(nextTrip.start_date, nextTrip.end_date)} days
                      </span>
                    </p>
                    <Link href={`/trips/${nextTrip.id}`} className="btn-primary mt-4 text-sm">
                      Open trip
                      <Icon name="arrowRight" size={15} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] fg-muted">Countdown</p>
                    <p className="mt-0.5 font-display text-3xl font-semibold tabular-nums">
                      {daysToTrip === 0 ? "Today" : `${daysToTrip} days`}
                    </p>
                    <p className="mt-0.5 text-[11px] fg-muted">{relDays(nextTrip.start_date)} · {nextTrip.travelers} travelling</p>
                  </div>
                  <BudgetRing
                    ratio={nextTrip.budget_total ? nextTrip.planned_spend / nextTrip.budget_total : 0}
                    label="budget"
                    size={112}
                    sub={`${money(nextTrip.planned_spend, nextTrip.currency, true)} / ${money(nextTrip.budget_total, nextTrip.currency, true)}`}
                  />
                </div>
                <div className="rounded-xl border hairline surface-2 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] fg-muted">The shape of this trip</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {nextTrip.personalities.map((p) => (
                      <span key={p} className="chip px-2 py-1 text-[11px]">
                        {personalityLabel(p)}
                      </span>
                    ))}
                    <span className="chip px-2 py-1 text-[11px]">{nextTrip.pace} pace</span>
                  </div>
                  <Link href={`/trips/${nextTrip.id}/assistant`} className="btn-ghost mt-3 w-full text-xs">
                    <Icon name="sparkles" size={14} />
                    Ask the assistant about it
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <EmptyState
            icon="compass"
            title="No trips yet"
            body="Tell WanderMind where you want to go and what kind of traveller you are — it'll build the days, price them, and tell you if the budget holds."
            action="Plan your first trip"
            href="/trips/new"
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="section-title">Upcoming &amp; recent</h2>
              <Link href="/trips" className="text-xs font-semibold text-sea-300 hover:underline">
                All trips
              </Link>
            </div>
            {trips.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {trips.slice(0, 4).map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon="calendar" title="Nothing on the calendar" body="Your trips will line up here once you create one." action="Create a trip" href="/trips/new" />
            )}
          </section>

          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="section-title">Budget by trip</h2>
                <Link href="/budget" className="text-xs font-semibold text-sea-300 hover:underline">
                  Ledger
                </Link>
              </div>
              <div className="card divide-hair">
                {trips.length ? (
                  trips.slice(0, 4).map((t) => {
                    const r = t.budget_total ? t.planned_spend / t.budget_total : 0;
                    return (
                      <Link key={t.id} href={`/trips/${t.id}/budget`} className="block px-4 py-3 transition hover:surface-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-medium">{t.title}</span>
                          <span className="shrink-0 text-[11px] tabular-nums fg-muted">
                            {money(t.planned_spend, t.currency, true)} / {money(t.budget_total, t.currency, true)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <ProgressBar ratio={r} height={5} color={r > 1 ? "#f87171" : r > 0.9 ? "#ffb457" : "#4bc0ae"} />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-4 py-6 text-center text-xs fg-muted">No budgets to show yet.</p>
                )}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="section-title">Saved places</h2>
                <Link href="/saved" className="text-xs font-semibold text-sea-300 hover:underline">
                  All
                </Link>
              </div>
              {saved.length ? (
                <div className="card divide-hair">
                  {saved.slice(0, 4).map((s) => (
                    <a key={s.id} href={s.map_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 transition hover:surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image || "/img/food-street.jpg"} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{s.name}</p>
                        <p className="truncate text-[10px] fg-muted">{s.city} · {s.category}</p>
                      </div>
                      <Icon name="external" size={13} className="shrink-0 fg-muted" />
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon="bookmark" title="No saved places" body="Save restaurants and sights from any itinerary and they'll live here." action="Browse places" href="/explore" />
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
