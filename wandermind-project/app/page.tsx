import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { DESTINATIONS, PLACES } from "@/lib/data/places";
import { money } from "@/lib/utils";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const highlights = [
    { icon: "plane", title: "Flights & trains, priced", body: "Return legs for your exact dates, with a link straight to the operator's booking page." },
    { icon: "wallet", title: "A budget that adds up", body: "Transport, stay, food, activities and a real buffer — per person, per day." },
    { icon: "utensils", title: "Places you can open", body: "Every restaurant comes with a photo, hours, map pin and a link that works outside the app." },
    { icon: "sparkles", title: "An honest assistant", body: "It asks before it plans — and tells you when the trip you want isn't the trip your budget buys." },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] glow-ember" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500 text-ink-950">
            <Icon name="compass" size={20} strokeWidth={2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">WanderMind</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-quiet text-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Start planning
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
        <div>
          <span className="chip chip-active">
            <Icon name="sparkles" size={13} />
            Built for travellers from Pakistan
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Plan the trip your
            <br />
            budget actually buys.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed fg-muted">
            Tell WanderMind where you're going, when, and what kind of traveller you are. It builds a
            day-by-day plan with real flights, trains, hotels and restaurants — then argues with you
            about the parts that won't work.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-primary">
              Plan my first trip
              <Icon name="arrowRight" size={15} />
            </Link>
            <Link href="/login?demo=1" className="btn-ghost">
              <Icon name="eye" size={15} />
              Look around the demo
            </Link>
          </div>
          <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t hairline pt-6">
            {[
              { k: "8", v: "destinations seeded" },
              { k: `${PLACES.length}`, v: "places, mapped" },
              { k: "PKR", v: "priced end to end" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-2xl font-semibold">{s.k}</dt>
                <dd className="mt-0.5 text-xs fg-muted">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/hero.jpg" alt="Northern Pakistan from a train window" className="h-56 w-full object-cover sm:h-72" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="badge bg-sea-500/15 text-sea-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sea-300" /> Itinerary ready
                </span>
                <span className="text-xs fg-muted">4 days · 2 travellers</span>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">Lahore, and eating my way through it</h3>
              <div className="mt-4 space-y-2.5">
                {[
                  { t: "08:10", d: "PIA PK-305 KHI → LHE", i: "plane", c: "₨41,200" },
                  { t: "13:00", d: "Phajja Siri Paye, Kashmir Road", i: "utensils", c: "₨1,400" },
                  { t: "16:30", d: "Wazir Khan Mosque + Delhi Gate", i: "pin", c: "₨600" },
                  { t: "20:00", d: "Butt Karahi, Ichhra", i: "utensils", c: "₨3,000" },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-3 rounded-xl border hairline surface-2 px-3 py-2.5">
                    <span className="w-11 text-[11px] font-semibold tabular-nums fg-muted">{r.t}</span>
                    <Icon name={r.i} size={15} className="text-sea-300" />
                    <span className="flex-1 truncate text-sm">{r.d}</span>
                    <span className="text-xs tabular-nums fg-muted">{r.c}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-ember-400/30 bg-ember-500/10 p-3">
                <p className="text-xs leading-relaxed text-ember-300">
                  <strong className="font-semibold">Reality check:</strong> December fog at Karachi
                  airport delays flights by hours, not minutes. Take the Friday morning departure and
                  you keep your Saturday.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.title} className="card card-hover p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sea-500/12 text-sea-300">
                <Icon name={h.icon} size={18} />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed fg-muted">{h.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">Where people are going</h2>
              <p className="mt-1 text-sm fg-muted">Starting estimates for a 5-day mid-range trip from Karachi.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.slice(0, 4).map((d) => (
              <Link
                key={d.id}
                href={`/register?destination=${encodeURIComponent(d.city)}`}
                className="card card-hover group overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt={d.city} className="h-32 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                <div className="p-4">
                  <p className="text-[11px] uppercase tracking-wider fg-muted">{d.country}</p>
                  <h3 className="mt-0.5 font-display text-lg font-semibold">{d.city}</h3>
                  <p className="mt-1 text-xs fg-muted">{d.tagline}</p>
                  <p className="mt-3 text-xs font-semibold text-sea-300">
                    from {money(d.daily_band * 5 * 2, "PKR", true)} · 5 days
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative border-t hairline px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 text-xs fg-muted sm:flex-row sm:items-center">
          <p>WanderMind — a planning tool, not a travel agency. Booking links go to the operators.</p>
          <p>Demo login: demo@wandermind.app · demo1234</p>
        </div>
      </footer>
    </div>
  );
}
