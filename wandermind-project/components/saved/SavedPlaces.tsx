"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSavedPlaceAction, deleteSavedPlaceAction, updateSavedPlaceAction } from "@/lib/actions/saved";
import { cx, fmtDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Spinner } from "@/components/ui/Feedback";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { SavedPlace } from "@/lib/types";

const CATS = ["food", "cafe", "activity", "nature", "culture", "shopping", "stay"];
const BANDS = ["$", "$$", "$$$", "$$$$"];

export function SavedPlaces({ places, cities }: { places: SavedPlace[]; cities: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(places);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<SavedPlace> | null>(null);
  const [deleting, setDeleting] = useState<SavedPlace | null>(null);
  const [saving, setSaving] = useState(false);
  const [, start] = useTransition();

  useEffect(() => setList(places), [places]);

  const visible = list.filter((p) => filter === "all" || p.city === filter);

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.city?.trim()) {
      toast.error("Name and city are both needed");
      return;
    }
    setSaving(true);
    if (editing.id) {
      const snapshot = list;
      setList((prev) => prev.map((p) => (p.id === editing.id ? ({ ...p, ...editing } as SavedPlace) : p)));
      const res: any = await updateSavedPlaceAction({
        id: editing.id,
        name: editing.name,
        city: editing.city,
        note: editing.note,
        category: editing.category,
        price_band: editing.price_band,
      });
      setSaving(false);
      if (res?.error) {
        setList(snapshot);
        toast.error("Couldn't save", res.error);
        return;
      }
      toast.success("Place updated");
      setEditing(null);
      router.refresh();
      return;
    }
    const fd = new FormData();
    fd.set("name", editing.name);
    fd.set("city", editing.city);
    fd.set("category", editing.category ?? "food");
    fd.set("note", editing.note ?? "");
    fd.set("price_band", editing.price_band ?? "$$");
    const res: any = await addSavedPlaceAction(null, fd);
    setSaving(false);
    if (res?.error) {
      toast.error("Couldn't save it", res.error);
      return;
    }
    toast.success("Saved to your places");
    setEditing(null);
    router.refresh();
  };

  const remove = (place: SavedPlace) => {
    const snapshot = list;
    setList((prev) => prev.filter((p) => p.id !== place.id));
    setDeleting(null);
    start(async () => {
      const res: any = await deleteSavedPlaceAction(place.id);
      if (res?.error) {
        setList(snapshot);
        toast.error("Couldn't remove it");
      } else {
        toast.success("Removed");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter("all")} className={cx("chip px-3 py-1.5", filter === "all" && "chip-active")}>
            All
          </button>
          {[...new Set(list.map((p) => p.city))].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={cx("chip px-3 py-1.5", filter === c && "chip-active")}>
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditing({ category: "food", price_band: "$$", city: cities[0] })}
          className="btn-primary text-xs"
        >
          <Icon name="plus" size={14} />
          Save a place
        </button>
      </div>

      {visible.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <article key={p.id} className="card card-hover group overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || "/img/food-street.jpg"} alt={p.name} className="h-32 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                <span className="absolute left-2.5 top-2.5 rounded-md bg-ink-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
                  {p.category}
                </span>
                <div className="absolute inset-x-3 bottom-2.5">
                  <h3 className="truncate font-display text-base font-semibold text-white">{p.name}</h3>
                  <p className="text-[10px] text-white/65">
                    {p.city} {p.rating ? `· ★ ${p.rating.toFixed(1)}` : ""} {p.price_band}
                  </p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="line-clamp-2 min-h-[32px] text-[11px] leading-relaxed fg-muted">
                  {p.note || "No note yet."}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  {p.map_url && (
                    <a href={p.map_url} target="_blank" rel="noreferrer" className="chip px-2 py-0.5 text-[10px]">
                      <Icon name="pin" size={10} /> Map
                    </a>
                  )}
                  <span className="text-[10px] fg-muted">{fmtDate(p.created_at.slice(0, 10))}</span>
                  <div className="ml-auto flex items-center gap-0.5">
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded-md p-1.5 fg-muted transition hover:bg-white/[0.06] hover:text-sea-300"
                      aria-label="Edit"
                    >
                      <Icon name="pencil" size={12} />
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      className="rounded-md p-1.5 fg-muted transition hover:bg-red-500/10 hover:text-red-300"
                      aria-label="Delete"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bookmark"
          title="Nothing saved yet"
          body="Save restaurants, forts and viewpoints from any itinerary — or add one by hand. They stay here across every trip."
          action="Save your first place"
          onAction={() => setEditing({ category: "food", price_band: "$$", city: cities[0] })}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit place" : "Save a place"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : <Icon name="check" size={15} />}
              Save
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3.5">
            <div>
              <label className="label">Name</label>
              <input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Butt Karahi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <select className="input" value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })}>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={editing.category ?? "food"} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATS.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Price band</label>
              <div className="flex gap-1.5">
                {BANDS.map((b) => (
                  <button key={b} onClick={() => setEditing({ ...editing, price_band: b })} className={cx("chip px-3 py-1.5", editing.price_band === b && "chip-active")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Why you saved it</label>
              <textarea
                rows={3}
                className="input resize-none"
                value={editing.note ?? ""}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                placeholder="Go at 7pm before the queue. Order by weight."
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this place?"
        body={`“${deleting?.name ?? ""}” will disappear from your saved places.`}
        confirmLabel="Remove"
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
