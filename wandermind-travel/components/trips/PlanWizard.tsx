"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTripAction } from "@/lib/actions/trips";
import { PERSONALITIES, PACES } from "@/lib/types";
import { CITIES } from "@/lib/data/geo";
import { DESTINATIONS, findDestination } from "@/lib/data/places";
import { addDays, cx, daysBetween, money, todayIso } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { estimateTrip } from "@/lib/estimate";

const STEPS = ["Where & when", "Traveller type", "Budget & pace", "Review"];

const BUDGET_PRESETS = [60000, 120000, 250000, 400000];

const PROGRESS = [
  "Reading your dates…",
  "Checking flights and rail on those exact days…",
  "Comparing stays against what's left…",
  "Choosing food that matches your type…",
  "Adding up the whole trip…",
  "Running the honesty checks…",
];

export function PlanWizard({
  defaultOrigin = "Karachi",
  defaultDestination = "",
}: {
  defaultOrigin?: string;
  defaultDestination?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination || "Hunza");
  const [startDate, setStartDate] = useState(addDays(todayIso(), 30));
  const [endDate, setEndDate] = useState(addDays(todayIso(), 36));
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(120000);
  const [types, setTypes] = useState<string[]>(["foodie"]);
  const [pace, setPace] = useState("balanced");
  const [notes, setNotes] = useState("");
  const [tick, setTick] = useState(0);

  const [state, action, pending] = useActionState(createTripAction, null as any);

  const days = daysBetween(startDate, endDate);
  const dest = findDestination(destination);
  const estimate = useMemo(
    () => estimateTrip(destination, days, travelers, origin),
    [destination, days, travelers, origin]
  );

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, [pending]);

  useEffect(() => {
    if (state?.ok && state.tripId && !(state as any).warnings?.length) {
      router.push(`/trips/${state.tripId}`);
    }
  }, [state, router]);

  const toggleType = (id: string) =>
    setTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  if (pending) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-ember-400/30" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ember-500 text-ink-950">
            <Icon name="compass" size={28} strokeWidth={2} className="animate-[spin_6s_linear_infinite]" />
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Building your {destination} plan</h2>
        <p className="mt-2 text-sm fg-muted">
          {days} days · {travelers} traveller{travelers > 1 ? "s" : ""} · {money(budget, "PKR")}
        </p>
        <div className="mt-7 space-y-2 text-left">
          {PROGRESS.map((p, i) => {
            const active = i === tick % PROGRESS.length;
            const done = i < tick % PROGRESS.length;
            return (
              <div
                key={p}
                className={cx(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition duration-500",
                  active ? "border-ember-400/40 bg-ember-500/10 text-ember-200" : done ? "border-sea-400/25 bg-sea-500/5 text-sea-200/80" : "border-transparent fg-muted opacity-50"
                )}
              >
                {active ? <Spinner /> : done ? <Icon name="check" size={14} className="text-sea-300" /> : <Icon name="dots" size={14} />}
                {p}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (state?.ok && state.tripId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="badge bg-sea-500/15 text-sea-300">
            <Icon name="check" size={11} /> Plan ready
          </span>
          <span className="text-xs fg-muted">{destination} · {days} days</span>
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Here's the honest version</h2>

        <div className="mt-6 space-y-3">
          {state.warnings?.length ? (
            state.warnings.map((w: any, i: number) => (
              <div
                key={i}
                className={cx(
                  "card p-4",
                  w.severity === "blocker" && "border-red-500/35 bg-red-500/[0.06]",
                  w.severity === "warn" && "border-amber-400/30 bg-amber-500/[0.05]",
                  w.severity === "info" && "border-sea-400/25"
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Icon
                    name={w.severity === "info" ? "info" : "alert"}
                    size={15}
                    className={cx(
                      w.severity === "blocker" && "text-red-300",
                      w.severity === "warn" && "text-amber-300",
                      w.severity === "info" && "text-sea-300"
                    )}
                  />
                  {w.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed fg-muted">{w.body}</p>
              </div>
            ))
          ) : (
            <div className="card border-sea-400/30 p-4">
              <p className="text-sm font-semibold text-sea-300">No red flags</p>
              <p className="mt-1 text-xs fg-muted">
                The budget holds and the pacing is realistic for {days} days.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <button onClick={() => router.push(`/trips/${state.tripId}`)} className="btn-primary">
            Open the itinerary
            <Icon name="arrowRight" size={15} />
          </button>
          <button onClick={() => router.push(`/trips/${state.tripId}/assistant`)} className="btn-ghost">
            <Icon name="sparkles" size={15} />
            Talk it through instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      {/* stepper */}
      <ol className="mb-8 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <button
              onClick={() => i < step && setStep(i)}
              className={cx(
                "flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                i === step ? "bg-ember-500/15 text-ember-300" : i < step ? "text-sea-300" : "fg-muted"
              )}
            >
              <span
                className={cx(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  i === step ? "bg-ember-500 text-ink-950" : i < step ? "bg-sea-500/20 text-sea-300" : "bg-white/[0.07]"
                )}
              >
                {i < step ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-[rgb(var(--line))]" />}
          </li>
        ))}
      </ol>

      <form action={action} className="space-y-6">
        <input type="hidden" name="title" value={buildTitle(origin, destination, types)} />
        <input type="hidden" name="origin" value={origin} />
        <input type="hidden" name="destination" value={destination} />
        <input type="hidden" name="start_date" value={startDate} />
        <input type="hidden" name="end_date" value={endDate} />
        <input type="hidden" name="budget_total" value={budget} />
        <input type="hidden" name="travelers" value={travelers} />
        <input type="hidden" name="pace" value={pace} />
        <input type="hidden" name="personalities" value={types.join(",")} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="generate" value="true" />

        {step === 0 && (
          <div className="animate-fade-up space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Leaving from</label>
                <select className="input" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Going to</label>
                <select className="input" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.city}>
                      {d.city}, {d.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dest && (
              <div className="card flex gap-4 overflow-hidden p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dest.image} alt={dest.city} className="h-auto w-32 shrink-0 object-cover sm:w-40" />
                <div className="py-3.5 pr-4">
                  <p className="text-[11px] uppercase tracking-wider fg-muted">{dest.country}</p>
                  <h3 className="font-display text-lg font-semibold">{dest.city}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed fg-muted">{dest.blurb}</p>
                  <p className="mt-2 text-[11px] text-sea-300">{dest.weather_note}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Start date</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  min={todayIso()}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value >= endDate) setEndDate(addDays(e.target.value, 4));
                  }}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input type="date" className="input" value={endDate} min={addDays(startDate, 1)} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Travellers</label>
                <div className="flex items-center gap-1 rounded-xl border hairline surface-2 p-1">
                  <button type="button" onClick={() => setTravelers((t) => Math.max(1, t - 1))} className="btn-quiet h-9 w-9 rounded-lg p-0">
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold tabular-nums">{travelers}</span>
                  <button type="button" onClick={() => setTravelers((t) => Math.min(20, t + 1))} className="btn-quiet h-9 w-9 rounded-lg p-0">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border hairline surface-2 p-3.5 text-xs">
              <p className="flex items-center gap-2 font-semibold">
                <Icon name="info" size={14} className="text-sea-300" />
                {days} day{days > 1 ? "s" : ""}, {Math.max(1, days - 1)} night{Math.max(1, days - 1) > 1 ? "s" : ""}
              </p>
              <p className="mt-1 leading-relaxed fg-muted">
                Day 1 and day {days} are travel days on most routes to {destination}. You'll get about{" "}
                {Math.max(0, days - 2)} full day{Math.max(0, days - 2) === 1 ? "" : "s"} on the ground.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">What kind of traveller are you?</p>
              <p className="mt-1 text-sm fg-muted">Pick everything that applies. This decides what fills your days.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERSONALITIES.map((p) => {
                const active = types.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleType(p.id)}
                    className={cx(
                      "group flex items-start gap-3 rounded-xl border p-3 text-left transition",
                      active
                        ? "border-ember-400/60 bg-ember-500/10"
                        : "border-[rgb(var(--line))] surface-2 hover:border-sea-400/40"
                    )}
                  >
                    <span className="text-lg leading-none">{p.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug fg-muted">{p.blurb}</span>
                    </span>
                    {active && <Icon name="check" size={14} className="mt-0.5 shrink-0 text-ember-400" />}
                  </button>
                );
              })}
            </div>
            {types.length === 0 && (
              <p className="text-xs text-amber-300">Pick at least one — otherwise I'll be guessing.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-5">
            <div>
              <label className="label">Total budget for everyone</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm fg-muted">₨</span>
                <input
                  type="number"
                  className="input pl-8 text-lg font-semibold tabular-nums"
                  value={budget}
                  min={5000}
                  step={5000}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BUDGET_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={cx("chip", budget === b && "chip-active")}
                  >
                    {money(b, "PKR", true)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs fg-muted">
                That's {money(Math.round(budget / travelers), "PKR")} per person, about{" "}
                {money(Math.round(budget / travelers / days), "PKR")} a day.
              </p>
            </div>

            <div className="rounded-xl border hairline surface-2 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="fg-muted">Typical mid-range cost for this trip</span>
                <span className="font-semibold tabular-nums">{money(estimate, "PKR")}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (budget / Math.max(1, estimate)) * 100)}%`,
                    background: budget >= estimate ? "#4bc0ae" : "#ffb457",
                  }}
                />
              </div>
              <p className={cx("mt-2 text-[11px]", budget >= estimate ? "text-sea-300" : "text-amber-300")}>
                {budget >= estimate
                  ? `Comfortable — you have roughly ${money(budget - estimate, "PKR")} of room.`
                  : `About ${money(estimate - budget, "PKR")} short of a comfortable version. Doable, but I'll show you the trade-offs.`}
              </p>
            </div>

            <div>
              <label className="label">Pace</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {PACES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id)}
                    className={cx(
                      "rounded-xl border p-3 text-left transition",
                      pace === p.id ? "border-ember-400/60 bg-ember-500/10" : "border-[rgb(var(--line))] surface-2 hover:border-sea-400/40"
                    )}
                  >
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="mt-0.5 block text-[11px] fg-muted">{p.blurb}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="notes">
                Anything I should know? (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none"
                placeholder="Travelling with parents, no long treks. Must eat karahi. Hate early starts."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up space-y-4">
            <h3 className="font-display text-xl font-semibold tracking-tight">Before I build it</h3>
            <div className="card divide-hair">
              {[
                { k: "Route", v: `${origin} → ${destination}, ${dest?.country ?? "Pakistan"}`, i: "route" },
                { k: "Dates", v: `${startDate} → ${endDate} (${days} days)`, i: "calendar" },
                { k: "Party", v: `${travelers} traveller${travelers > 1 ? "s" : ""}`, i: "users" },
                { k: "Budget", v: money(budget, "PKR"), i: "wallet" },
                { k: "Type", v: types.map((t) => PERSONALITIES.find((p) => p.id === t)?.label).join(", ") || "—", i: "sparkles" },
                { k: "Pace", v: PACES.find((p) => p.id === pace)?.label ?? pace, i: "clock" },
              ].map((r) => (
                <div key={r.k} className="flex items-center gap-3 px-4 py-3">
                  <Icon name={r.i} size={15} className="shrink-0 text-sea-300" />
                  <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider fg-muted">{r.k}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{r.v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed fg-muted">
              I'll build the days around these, price everything, and then tell you where it doesn't hold.
              You can change any of it afterwards.
            </p>
            {state?.error && (
              <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                {state.error}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t hairline pt-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={cx("btn-quiet text-sm", step === 0 && "invisible")}
          >
            <Icon name="chevronLeft" size={15} />
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={step === 1 && types.length === 0}
              className="btn-primary text-sm"
            >
              Continue
              <Icon name="chevronRight" size={15} />
            </button>
          ) : (
            <button type="submit" className="btn-primary text-sm">
              <Icon name="sparkles" size={15} />
              Build my plan
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function buildTitle(origin: string, destination: string, types: string[]) {
  const flavour = types.includes("foodie")
    ? ", eating everything"
    : types.includes("nature")
    ? ", slowly"
    : types.includes("adventure")
    ? ", no rest days"
    : "";
  return `${destination}${flavour}`;
}
