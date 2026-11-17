"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addItemAction,
  deleteItemAction,
  moveItemToDayAction,
  reorderItemsAction,
  updateItemAction,
} from "@/lib/actions/itinerary";
import { regenerateDayAction } from "@/lib/actions/trips";
import { saveFromItineraryAction } from "@/lib/actions/saved";
import { cx, fmtDate, money, minsToDur, timeToMins } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, LiveBadge, Spinner } from "@/components/ui/Feedback";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { ItineraryItem, Trip } from "@/lib/types";

const KIND_META: Record<string, { icon: string; label: string; tone: string }> = {
  transport: { icon: "plane", label: "Travel", tone: "text-sea-300 bg-sea-500/12" },
  stay: { icon: "bed", label: "Stay", tone: "text-sand-300 bg-sand-500/12" },
  food: { icon: "utensils", label: "Food", tone: "text-ember-300 bg-ember-500/12" },
  activity: { icon: "camera", label: "Activity", tone: "text-violet-300 bg-violet-500/12" },
  note: { icon: "pencil", label: "Note", tone: "text-white/60 bg-white/[0.07]" },
};

type Draft = {
  id?: string;
  day_date: string;
  kind: string;
  title: string;
  subtitle: string;
  start_time: string;
  end_time: string;
  location_name: string;
  cost: number;
  booking_url: string;
  price_band: string;
};

export function ItineraryBoard({ trip, items }: { trip: Trip; items: ItineraryItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<ItineraryItem | null>(null);
  const [busyDay, setBusyDay] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => setList(items), [items]);

  const days = [...new Set(list.map((i) => i.day_date))].sort();
  const dayList = days.length ? days : [trip.start_date];

  const dayTotal = (day: string) =>
    list.filter((i) => i.day_date === day).reduce((s, i) => s + i.cost, 0);

  const persistOrder = (day: string, ordered: ItineraryItem[]) => {
    setList((prev) => [
      ...prev.filter((i) => i.day_date !== day),
      ...ordered.map((it, idx) => ({ ...it, position: idx })),
    ]);
    start(async () => {
      const res: any = await reorderItemsAction(trip.id, day, ordered.map((o) => o.id));
      if (res?.error) {
        toast.error("Couldn't save the new order");
        router.refresh();
      }
    });
  };

  const onDrop = (day: string, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const dayItems = list.filter((i) => i.day_date === day);
    const from = dayItems.findIndex((i) => i.id === dragId);
    const to = dayItems.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...dayItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(day, next);
    setDragId(null);
  };

  const remove = (item: ItineraryItem) => {
    const snapshot = list;
    setList((prev) => prev.filter((i) => i.id !== item.id));
    setDeleting(null);
    start(async () => {
      const res: any = await deleteItemAction(item.id);
      if (res?.error) {
        setList(snapshot);
        toast.error("Couldn't delete that stop");
      } else {
        toast.success("Removed from the itinerary");
        router.refresh();
      }
    });
  };

  const save = (item: ItineraryItem) => {
    start(async () => {
      const res: any = await saveFromItineraryAction({
        name: item.location_name.split(",")[0] || item.title,
        city: trip.destination,
        category: item.kind === "food" ? "food" : "activity",
        image: item.image,
        rating: item.rating,
        price_band: item.price_band,
        trip_id: trip.id,
      });
      if (res?.already) toast.info("Already in your saved places");
      else toast.success("Saved", "Find it under Saved places");
    });
  };

  const regenerate = (day: string) => {
    setBusyDay(day);
    start(async () => {
      const res: any = await regenerateDayAction(trip.id, day);
      setBusyDay(null);
      if (res?.error) toast.error("Couldn't rebuild that day", res.error);
      else {
        toast.success("Day rebuilt", "Swapped for a different mix from the same budget.");
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {!list.length && (
        <EmptyState
          icon="calendar"
          title="No plan yet"
          body="This trip has dates and a budget but no days. Build the itinerary and I'll fill it with transport, food and things to do — then tell you if the money works."
          action="Build the itinerary"
          onAction={() => {
            setBusyDay("all");
            start(async () => {
              const res: any = await regenerateDayAction(trip.id, trip.start_date);
              setBusyDay(null);
              if (res?.error) toast.error("Couldn't build it", res.error);
              else {
                toast.success("First day built", "Tap Re-plan in the header for the full trip.");
                router.refresh();
              }
            });
          }}
        />
      )}

      <div className="space-y-8">
        {list.length > 0 &&
          dayList.map((day, dayIndex) => {
            const dayItems = list
              .filter((i) => i.day_date === day)
              .sort((a, b) => a.position - b.position);
            if (!dayItems.length) return null;
            return (
              <section key={day}>
                <div className="sticky top-[49px] z-10 -mx-4 mb-3 flex items-center justify-between gap-3 border-b hairline bg-[rgb(var(--bg))]/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6">
                  <div className="flex items-baseline gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ember-500/15 text-[11px] font-bold text-ember-300">
                      {dayIndex + 1}
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">{fmtDate(day, { weekday: "long", day: "numeric", month: "long" })}</h2>
                      <p className="text-[10px] fg-muted">
                        {dayItems.length} stop{dayItems.length === 1 ? "" : "s"} · {money(dayTotal(day), trip.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => regenerate(day)}
                      disabled={busyDay === day}
                      className="btn-quiet rounded-lg px-2 py-1.5 text-[11px]"
                      title="Rebuild this day"
                    >
                      {busyDay === day ? <Spinner /> : <Icon name="refresh" size={13} />}
                      <span className="hidden sm:inline">Rebuild</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditing({
                          day_date: day,
                          kind: "activity",
                          title: "",
                          subtitle: "",
                          start_time: "10:00",
                          end_time: "",
                          location_name: "",
                          cost: 0,
                          booking_url: "",
                          price_band: "",
                        })
                      }
                      className="btn-quiet rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      <Icon name="plus" size={13} />
                      Add
                    </button>
                  </div>
                </div>

                <div className="relative space-y-2.5 pl-1">
                  <div className="absolute bottom-3 left-[26px] top-3 w-px bg-[rgb(var(--line))] sm:left-[30px]" />
                  {busyDay === day && (
                    <div className="ml-10 space-y-2">
                      <div className="skeleton h-20 w-full" />
                      <div className="skeleton h-20 w-full" />
                    </div>
                  )}
                  {dayItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      currency={trip.currency}
                      dragging={dragId === item.id}
                      onDragStart={() => setDragId(item.id)}
                      onDragEnd={() => setDragId(null)}
                      onDrop={() => onDrop(day, item.id)}
                      onEdit={() =>
                        setEditing({
                          id: item.id,
                          day_date: item.day_date,
                          kind: item.kind,
                          title: item.title,
                          subtitle: item.subtitle,
                          start_time: item.start_time,
                          end_time: item.end_time,
                          location_name: item.location_name,
                          cost: item.cost,
                          booking_url: item.booking_url,
                          price_band: item.price_band,
                        })
                      }
                      onDelete={() => setDeleting(item)}
                      onSave={() => save(item)}
                      onMove={async (newDay) => {
                        const snapshot = list;
                        setList((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, day_date: newDay } : i))
                        );
                        const res: any = await moveItemToDayAction(item.id, newDay);
                        if (res?.error) {
                          setList(snapshot);
                          toast.error("Couldn't move that stop");
                        } else {
                          toast.success(`Moved to ${fmtDate(newDay)}`);
                          router.refresh();
                        }
                      }}
                      days={dayList}
                    />
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      <ItemEditor
        draft={editing}
        trip={trip}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this stop?"
        body={`“${deleting?.title ?? ""}” will be taken out of the itinerary. You can add it back at any time.`}
        confirmLabel="Remove"
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}

function ItemRow({
  item,
  currency,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onEdit,
  onDelete,
  onSave,
  onMove,
  days,
}: {
  item: ItineraryItem;
  currency: string;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onMove: (day: string) => void;
  days: string[];
}) {
  const [menu, setMenu] = useState(false);
  const [over, setOver] = useState(false);
  const meta = KIND_META[item.kind] ?? KIND_META.activity;
  const duration =
    item.start_time && item.end_time
      ? minsToDur(Math.max(0, timeToMins(item.end_time) - timeToMins(item.start_time)))
      : "";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDrop();
      }}
      className={cx(
        "group relative flex gap-2.5 rounded-xl transition-all duration-200",
        dragging && "opacity-40",
        over && "translate-y-0.5"
      )}
    >
      <div className="relative z-10 flex w-14 shrink-0 flex-col items-center pt-3 sm:w-16">
        <span className="rounded-md bg-[rgb(var(--bg))] px-1.5 py-0.5 text-[10px] font-bold tabular-nums fg-muted">
          {item.start_time || "—:—"}
        </span>
        <span className={cx("mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[rgb(var(--bg))]", meta.tone)}>
          <Icon name={meta.icon} size={13} />
        </span>
      </div>

      <div
        className={cx(
          "card card-hover relative mb-0 flex min-w-0 flex-1 gap-3 p-3",
          over && "border-ember-400/60"
        )}
      >
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-[62px] w-[62px] shrink-0 rounded-lg object-cover sm:h-[70px] sm:w-[70px]"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">
                {meta.label}
                {item.provider_name ? ` · ${item.provider_name}` : ""}
              </p>
              <h3 className="mt-0.5 truncate text-sm font-semibold leading-snug">{item.title}</h3>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setMenu((m) => !m)}
                className="rounded-lg p-1 fg-muted opacity-0 transition hover:bg-white/[0.06] group-hover:opacity-100"
                aria-label="Stop actions"
              >
                <Icon name="dots" size={15} />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-7 z-40 w-48 animate-fade-up rounded-xl border hairline surface p-1 shadow-lift">
                    <button onClick={() => { setMenu(false); onEdit(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:surface-2">
                      <Icon name="pencil" size={13} /> Edit stop
                    </button>
                    <button onClick={() => { setMenu(false); onSave(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:surface-2">
                      <Icon name="bookmark" size={13} /> Save place
                    </button>
                    {item.booking_url && (
                      <a href={item.booking_url} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:surface-2">
                        <Icon name="external" size={13} /> {item.booking_label || "Open link"}
                      </a>
                    )}
                    <div className="my-1 h-px bg-[rgb(var(--line))]" />
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider fg-muted">Move to day</p>
                    <div className="max-h-32 overflow-y-auto">
                      {days.map((d, i) => (
                        <button
                          key={d}
                          onClick={() => { setMenu(false); onMove(d); }}
                          disabled={d === item.day_date}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:surface-2 disabled:opacity-40"
                        >
                          Day {i + 1} · {fmtDate(d)}
                        </button>
                      ))}
                    </div>
                    <div className="my-1 h-px bg-[rgb(var(--line))]" />
                    <button onClick={() => { setMenu(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-red-300 hover:bg-red-500/10">
                      <Icon name="trash" size={13} /> Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed fg-muted">
            {item.subtitle || item.location_name}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px]">
            {item.rating != null && (
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <Icon name="star" size={11} /> {item.rating.toFixed(1)}
              </span>
            )}
            {item.price_band && <span className="fg-muted">{item.price_band}</span>}
            {duration && item.kind === "transport" && (
              <span className="flex items-center gap-1 fg-muted">
                <Icon name="clock" size={11} /> {duration}
              </span>
            )}
            <LiveBadge live={Boolean(item.is_live)} />
            {item.cost > 0 && (
              <span className="ml-auto font-semibold tabular-nums">{money(item.cost, currency)}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.map_url && item.kind !== "transport" && (
              <a
                href={item.map_url}
                target="_blank"
                rel="noreferrer"
                className="chip px-2 py-0.5 text-[10px] hover:border-sea-400/50 hover:text-sea-300"
              >
                <Icon name="pin" size={11} /> Map
              </a>
            )}
            {item.booking_url && (
              <a
                href={item.booking_url}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  "chip px-2 py-0.5 text-[10px]",
                  item.kind === "transport"
                    ? "border-ember-400/50 bg-ember-500/10 text-ember-300"
                    : "hover:border-sea-400/50 hover:text-sea-300"
                )}
              >
                <Icon name="external" size={11} /> {item.booking_label || "Book"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemEditor({
  draft,
  trip,
  onClose,
  onSaved,
}: {
  draft: Draft | null;
  trip: Trip;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Draft | null>(draft);
  const [saving, setSaving] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    setForm(draft);
  }, [draft]);

  if (!form) return null;

  const set = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("Give the stop a name first");
      return;
    }
    setSaving(true);
    if (form.id) {
      const res: any = await updateItemAction({
        id: form.id,
        title: form.title,
        subtitle: form.subtitle,
        start_time: form.start_time,
        end_time: form.end_time,
        location_name: form.location_name,
        cost: form.cost,
        booking_url: form.booking_url,
        kind: form.kind,
      });
      setSaving(false);
      if (res?.error) return toast.error("Couldn't save", res.error);
      toast.success("Stop updated");
    } else {
      const fd = new FormData();
      fd.set("trip_id", trip.id);
      fd.set("day_date", form.day_date);
      fd.set("kind", form.kind);
      fd.set("title", form.title);
      fd.set("subtitle", form.subtitle);
      fd.set("start_time", form.start_time);
      fd.set("end_time", form.end_time);
      fd.set("location_name", form.location_name);
      fd.set("cost", String(form.cost));
      fd.set("booking_url", form.booking_url);
      fd.set("price_band", form.price_band);
      const res: any = await addItemAction(null, fd);
      setSaving(false);
      if (res?.error) return toast.error("Couldn't add it", res.error);
      toast.success("Added to the day");
    }
    onSaved();
  };

  return (
    <Modal
      open={Boolean(draft)}
      onClose={onClose}
      title={form.id ? "Edit stop" : "Add a stop"}
      subtitle={`${fmtDate(form.day_date, { weekday: "long", day: "numeric", month: "long" })} · ${trip.destination}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" size={15} />}
            {form.id ? "Save changes" : "Add stop"}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(KIND_META).map(([k, m]) => (
            <button
              key={k}
              onClick={() => set({ kind: k })}
              className={cx("chip px-2.5 py-1.5", form.kind === k && "chip-active")}
            >
              <Icon name={m.icon} size={12} />
              {m.label}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Dinner at Kolachi" />
        </div>
        <div>
          <label className="label">Details</label>
          <input className="input" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Sea-facing deck · ask for the outer table" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start</label>
            <input type="time" className="input" value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="time" className="input" value={form.end_time} onChange={(e) => set({ end_time: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location_name} onChange={(e) => set({ location_name: e.target.value })} placeholder="Clifton, Karachi" />
          </div>
          <div>
            <label className="label">Cost (total)</label>
            <input type="number" className="input" value={form.cost} onChange={(e) => set({ cost: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">Booking / map link</label>
          <input className="input" value={form.booking_url} onChange={(e) => set({ booking_url: e.target.value })} placeholder="https://…" />
        </div>
      </div>
    </Modal>
  );
}
