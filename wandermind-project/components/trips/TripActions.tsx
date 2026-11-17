"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTripAction,
  duplicateTripAction,
  generatePlanAction,
  setTripStatusAction,
} from "@/lib/actions/trips";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function TripActions({
  tripId,
  status,
  title,
}: {
  tripId: string;
  status: string;
  title: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const [regenerating, setRegenerating] = useState(false);

  const regenerate = () => {
    setRegenerating(true);
    start(async () => {
      const res: any = await generatePlanAction(tripId);
      setRegenerating(false);
      setOpen(false);
      if (res?.error) {
        toast.error("Couldn't rebuild the plan", res.error);
        return;
      }
      const over = res.warnings?.find((w: any) => w.severity === "blocker");
      toast.success(
        "Plan rebuilt",
        over ? over.title : `Priced at ${res.total ? "the new budget" : "current budget"} — no blockers.`
      );
      router.refresh();
    });
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={regenerate}
        disabled={regenerating}
        className="btn-ghost text-xs text-white/90"
        title="Rebuild the itinerary from your budget and preferences"
      >
        {regenerating ? <Spinner /> : <Icon name="refresh" size={14} />}
        {regenerating ? "Rebuilding…" : "Re-plan"}
      </button>

      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-white/15 bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/20"
        aria-label="More actions"
      >
        <Icon name="dots" size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-56 animate-fade-up overflow-hidden rounded-xl border hairline surface p-1 shadow-lift">
            <button
              onClick={() => {
                start(async () => {
                  const res: any = await duplicateTripAction(tripId);
                  setOpen(false);
                  if (res?.tripId) {
                    toast.success("Trip duplicated");
                    router.push(`/trips/${res.tripId}`);
                  }
                });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition hover:surface-2"
            >
              <Icon name="copy" size={14} className="fg-muted" />
              Duplicate trip
            </button>
            <button
              onClick={() => {
                const next = status === "archived" ? "planned" : "archived";
                start(async () => {
                  await setTripStatusAction(tripId, next);
                  setOpen(false);
                  toast.success(next === "archived" ? "Trip archived" : "Trip restored");
                  router.refresh();
                });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition hover:surface-2"
            >
              <Icon name="archive" size={14} className="fg-muted" />
              {status === "archived" ? "Restore trip" : "Archive trip"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmDelete(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10"
            >
              <Icon name="trash" size={14} />
              Delete trip
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={pending}
        title="Delete this trip?"
        body={`“${title}” — itinerary, expenses and the assistant conversation will go with it. This can't be undone.`}
        onConfirm={() =>
          start(async () => {
            await deleteTripAction(tripId);
            toast.success("Trip deleted");
            router.push("/trips");
          })
        }
      />
    </div>
  );
}
