import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/AppShell";
import { DESTINATIONS, PLACES } from "@/lib/data/places";
import { estimateTrip } from "@/lib/estimate";
import { PERSONALITIES, personalityLabel } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { cx, money } from "@/lib/utils";
import { LiveBadge } from "@/components/ui/Feedback";

export const metadata = { title: "Explore · WanderMind" };
export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>;
}) {
  const user = await requireUser();
  const { type, city } = await searchParams;

  const destinations = DESTINATIONS.filter((d) => (type ? d.personalities.includes(type as any) : true));
  const places = PLACES.filter((p) => (city ? p.city === city : true)).slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="Inspiration"
        title="Where to go next"
        subtitle={`Priced from ${user.home_city} for a 5-day trip, two travellers, mid-range. Filter by who you are.`}
        actions={
          <Link href="/trips/new" className="btn-primary text-sm">
            <Icon name="plus" size={15} />
            Plan a custom trip
          </Link>
        }
      />

      <div className="space-y-8 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/explore" className={cx("chip px-3 py-1.5", !type && "chip-active")}>
            Everyone
          </Link>
          {PERSONALITIES.slice(0, 8).map((p) => (
            <Link
              key={p.id}
              href={`/explore?type=${p.id}`}
              className={cx("chip px-3 py-1.5", type === p.id && "chip-active")}
            >
              <span>{p.emoji}</span>
              {p.label}
            </Link>
          ))}
        </div>

        {destinations.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {destinations.map((d) => {
              const est = estimateTrip(d.city, 5, 2, user.home_city);
              return (
                <article key={d.id} className="card card-hover group overflow-hidden">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt={d.city} className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/70">{d.country}</p>
                      <h3 className="font-display text-xl font-semibold text-white">{d.city}</h3>
                    </div>
                    <div className="absolute right-3 top-3">
                      <LiveBadge live={false} />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs leading-relaxed fg-muted">{d.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {d.personalities.slice(0, 3).map((p) => (
                        <span key={p} className="chip px-2 py-0.5 text-[10px]">
                          {personalityLabel(p)}
                        </span>
                      ))}
                    </div>
                    <dl className="mt-3.5 grid grid-cols-2 gap-2 border-t hairline pt-3 text-[11px]">
                      <div>
                        <dt className="fg-muted">5 days, 2 people</dt>
                        <dd className="mt-0.5 font-semibold">{money(est, "PKR", true)}</dd>
                      </div>
                      <div>
                        <dt className="fg-muted">Best months</dt>
                        <dd className="mt-0.5 font-medium">{d.best_months.slice(0, 2).join(", ")}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex items-center gap-2">
                      <Link href={`/trips/new?destination=${encodeURIComponent(d.city)}`} className="btn-primary flex-1 text-xs">
                        Plan this
                        <Icon name="arrowRight" size={13} />
                      </Link>
                      <Link href={`/explore?city=${encodeURIComponent(d.city)}`} className="btn-ghost text-xs">
                        Places
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-sm fg-muted">Nothing matches that type yet. Try another filter.</p>
          </div>
        )}

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="section-title">The place library</h2>
              <p className="mt-1 text-sm fg-muted">
                Every restaurant, fort, lake and bazaar the planner draws from — with hours, price bands and map links.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Karachi", "Lahore", "Hunza", "Skardu", "Islamabad", "Bangkok"].map((c) => (
                <Link
                  key={c}
                  href={`/explore?city=${encodeURIComponent(c)}${type ? `&type=${type}` : ""}`}
                  className={cx("chip px-2.5 py-1", city === c && "chip-active")}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <div key={`${p.city}-${p.name}`} className="card flex gap-3 overflow-hidden p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-sm font-semibold">{p.name}</h3>
                    <span className="shrink-0 text-[10px] font-semibold text-amber-300">★ {p.rating}</span>
                  </div>
                  <p className="truncate text-[10px] fg-muted">{p.area} · {p.band} · {p.hours}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug fg-muted">{p.blurb}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] fg-muted">≈ {money(p.cost, "PKR")} pp</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.city)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto flex items-center gap-1 text-[10px] text-sea-300 hover:underline"
                    >
                      <Icon name="pin" size={10} /> Map
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
