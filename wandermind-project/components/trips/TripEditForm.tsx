"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTripAction, generatePlanAction, deleteTripAction, setTripStatusAction } from "@/lib/actions/trips";
import { PACES, PERSONALITIES, type Trip } from "@/lib/types";
import { CITIES } from "@/lib/data/geo";
import { DESTINATIONS } from "@/lib/data/places";
import { cx, daysBetween, money } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function TripEditForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(updateTripAction, null as any);
  const [types, setTypes] = useState<string[]>(trip.personalities);
  const [destination, setDestination] = useState(trip.destination);
  const [start, setStart] = useState(trip.start_date);
  const [end, setEnd] = useState(trip.end_date);
  const [budget, setBudget] = useState(trip.budget_total);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Trip updated");
      router.refresh();
    }
    if (state?.error) toast.error("Couldn't save", state.error);
  }, [state]);

  const toggle = (id: string) =>
    setTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  return (
    <>
      <form action={action} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <input type="hidden" name="id" value={trip.id} />
        <input type="hidden" name="personalities" value={types.join(",")} />

        <div className="card space-y-4 p-5">
          <h2 className="section-title text-base">The basics</h2>
          <div>
            <label className="label">Trip name</label>
            <input name="title" defaultValue={trip.title} className="input" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">From</label>
              <select name="origin" defaultValue={trip.origin} className="input">
                {CITIES.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">To</label>
              <select
                name="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="input"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.city}>
                    {d.city}, {d.country}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Start</label>
              <input type="date" name="start_date" value={start} onChange={(e) => setStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">End</label>
              <input type="date" name="end_date" value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Travellers</label>
              <input type="number" name="travelers" min={1} max={20} defaultValue={trip.travelers} className="input" />
            </div>
            <div>
              <label className="label">Budget (total)</label>
              <input
                type="number"
                name="budget_total"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="input"
                min={1000}
                step={1000}
              />
            </div>
          </div>
          <p className="text-[11px] fg-muted">
            {daysBetween(start, end)} days · {money(Math.round(budget / Math.max(1, daysBetween(start, end))), trip.currency)} per
            day for the whole party
          </p>
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="section-title text-base">Traveller type</h2>
          <div className="flex flex-wrap gap-1.5">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={cx("chip px-2.5 py-1.5", types.includes(p.id) && "chip-active")}
              >
                <span>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <label className="label mt-2">Pace</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PACES.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-2 rounded-xl border hairline surface-2 p-3 transition has-[:checked]:border-ember-400/60 has-[:checked]:bg-ember-500/10"
                >
                  <input type="radio" name="pace" value={p.id} defaultChecked={trip.pace === p.id} className="mt-0.5 accent-ember-500" />
                  <span>
                    <span className="block text-xs font-semibold">{p.label}</span>
                    <span className="block text-[10px] fg-muted">{p.blurb}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="section-title text-base">Notes to self</h2>
          <textarea name="notes" defaultValue={trip.notes} rows={4} className="input resize-none" placeholder="Anything the plan should respect…" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t hairline pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setBusy("replan");
                const res: any = await generatePlanAction(trip.id);
                setBusy(null);
                if (res?.error) toast.error("Couldn't rebuild", res.error);
                else {
                  toast.success("Plan rebuilt from these settings", res.summary?.slice(0, 120));
                  router.refresh();
                }
              }}
              className="btn-ghost text-xs"
              disabled={busy === "replan"}
            >
              {busy === "replan" ? <Spinner /> : <Icon name="refresh" size={14} />}
              Rebuild plan with these settings
            </button>
            <button
              type="button"
              onClick={async () => {
                await setTripStatusAction(trip.id, trip.status === "archived" ? "planned" : "archived");
                toast.success(trip.status === "archived" ? "Trip restored" : "Trip archived");
                router.refresh();
              }}
              className="btn-ghost text-xs"
            >
              <Icon name="archive" size={14} />
              {trip.status === "archived" ? "Restore" : "Archive"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger text-xs">
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
          <button type="submit" className="btn-primary text-sm" disabled={pending}>
            {pending ? <Spinner /> : <Icon name="check" size={15} />}
            Save changes
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this trip?"
        body={`“${trip.title}” and everything attached to it will be permanently removed.`}
        onConfirm={async () => {
          await deleteTripAction(trip.id);
          toast.success("Trip deleted");
          router.push("/trips");
        }}
      />
    </>
  );
}
