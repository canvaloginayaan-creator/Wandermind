"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpenseAction, deleteExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type ItineraryItem, type Trip } from "@/lib/types";
import { cx, fmtDate, money } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { BudgetRing, ProgressBar } from "@/components/shared/StatCard";
import { EmptyState, Spinner } from "@/components/ui/Feedback";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { todayIso } from "@/lib/utils";

const cat = (id: string) => EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[5];

export function TripBudget({
  trip,
  expenses,
  items,
}: {
  trip: Trip;
  expenses: Expense[];
  items: ItineraryItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(expenses);
  const [filter, setFilter] = useState<"all" | "actual" | "planned">("all");
  const [editing, setEditing] = useState<Partial<Expense> | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [, start] = useTransition();

  useEffect(() => setList(expenses), [expenses]);

  const itineraryTotal = items.reduce((s, i) => s + i.cost, 0);
  const actual = list.filter((e) => e.kind === "actual").reduce((s, e) => s + e.amount, 0);
  const planned = list.filter((e) => e.kind === "planned").reduce((s, e) => s + e.amount, 0);
  const committed = Math.max(itineraryTotal, planned);
  const remaining = trip.budget_total - committed;

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    amount: list.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0);

  const visible = list
    .filter((e) => filter === "all" || e.kind === filter)
    .sort((a, b) => (a.spent_on < b.spent_on ? 1 : -1));

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim()) {
      toast.error("What was it for?");
      return;
    }
    setSaving(true);
    if (editing.id) {
      const snapshot = list;
      setList((prev) =>
        prev.map((e) =>
          e.id === editing.id ? ({ ...e, ...editing } as Expense) : e
        )
      );
      const res: any = await updateExpenseAction({
        id: editing.id,
        label: editing.label,
        amount: Number(editing.amount ?? 0),
        category: editing.category,
        spent_on: editing.spent_on,
        kind: editing.kind,
      });
      setSaving(false);
      if (res?.error) {
        setList(snapshot);
        toast.error("Couldn't update", res.error);
        return;
      }
      toast.success("Expense updated");
      setEditing(null);
      router.refresh();
      return;
    }

    const fd = new FormData();
    fd.set("trip_id", trip.id);
    fd.set("label", editing.label ?? "");
    fd.set("amount", String(editing.amount ?? 0));
    fd.set("category", editing.category ?? "other");
    fd.set("spent_on", editing.spent_on ?? todayIso());
    fd.set("kind", editing.kind ?? "actual");
    const res: any = await addExpenseAction(null, fd);
    setSaving(false);
    if (res?.error) {
      toast.error("Couldn't add it", res.error);
      return;
    }
    toast.success("Expense logged");
    setEditing(null);
    router.refresh();
  };

  const remove = (exp: Expense) => {
    const snapshot = list;
    setList((prev) => prev.filter((e) => e.id !== exp.id));
    setDeleting(null);
    start(async () => {
      const res: any = await deleteExpenseAction(exp.id);
      if (res?.error) {
        setList(snapshot);
        toast.error("Couldn't remove it");
      } else {
        toast.success("Expense removed");
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div className="card flex items-center justify-center gap-5 p-5">
          <BudgetRing
            ratio={trip.budget_total ? committed / trip.budget_total : 0}
            label="committed"
            size={132}
            sub={`${money(committed, trip.currency, true)} of ${money(trip.budget_total, trip.currency, true)}`}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">Itinerary estimate</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums">{money(itineraryTotal, trip.currency)}</p>
            <p className="mt-0.5 text-[10px] fg-muted">Everything the plan costs</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">Logged actuals</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums">{money(actual, trip.currency)}</p>
            <p className="mt-0.5 text-[10px] fg-muted">{list.filter((e) => e.kind === "actual").length} entries</p>
          </div>
          <div className={cx("card p-4", remaining < 0 && "border-red-500/35")}>
            <p className="text-[10px] font-semibold uppercase tracking-wider fg-muted">
              {remaining < 0 ? "Over budget" : "Headroom"}
            </p>
            <p className={cx("mt-1 font-display text-xl font-semibold tabular-nums", remaining < 0 && "text-red-300")}>
              {money(Math.abs(remaining), trip.currency)}
            </p>
            <p className="mt-0.5 text-[10px] fg-muted">
              {remaining < 0 ? "Cut a night or switch transport" : "Buffer for the unplanned"}
            </p>
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title text-base">Where it goes</h3>
          <div className="mt-4 space-y-3">
            {byCategory.map((c) => {
              const ratio = committed ? c.amount / committed : 0;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 font-medium capitalize">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <span className="tabular-nums fg-muted">
                      {money(c.amount, trip.currency)} · {Math.round(ratio * 100)}%
                    </span>
                  </div>
                  <ProgressBar ratio={ratio} color={c.color} height={5} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(["all", "actual", "planned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx("chip px-2.5 py-1.5 capitalize", filter === f && "chip-active")}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setEditing({
              trip_id: trip.id,
              category: "food",
              kind: "actual",
              spent_on: todayIso(),
              amount: 0,
              label: "",
            } as Partial<Expense>)
          }
          className="btn-primary text-xs"
        >
          <Icon name="plus" size={14} />
          Log an expense
        </button>
      </div>

      {visible.length ? (
        <div className="card divide-hair overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1fr_.8fr_.9fr_auto] gap-3 border-b hairline px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider fg-muted sm:grid">
            <span>What</span>
            <span>Category</span>
            <span>When</span>
            <span className="text-right">Amount</span>
            <span className="w-8" />
          </div>
          {visible.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 transition hover:surface-2 sm:grid-cols-[1.6fr_1fr_.8fr_.9fr_auto] sm:gap-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.label}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] fg-muted">
                  <span className={cx("badge", e.kind === "actual" ? "bg-sea-500/15 text-sea-300" : "bg-white/[0.07] fg-muted")}>
                    {e.kind}
                  </span>
                  <span className="sm:hidden">{fmtDate(e.spent_on)}</span>
                </p>
              </div>
              <span className="hidden items-center gap-1.5 text-xs capitalize sm:flex">
                <span className="h-2 w-2 rounded-full" style={{ background: cat(e.category).color }} />
                {cat(e.category).label}
              </span>
              <span className="hidden text-xs fg-muted sm:block">{fmtDate(e.spent_on)}</span>
              <span className="text-right text-sm font-semibold tabular-nums">{money(e.amount, trip.currency)}</span>
              <div className="flex items-center justify-end gap-0.5">
                <button
                  onClick={() => setEditing(e)}
                  className="rounded-md p-1.5 fg-muted transition hover:bg-white/[0.06] hover:text-sea-300"
                  aria-label="Edit expense"
                >
                  <Icon name="pencil" size={13} />
                </button>
                <button
                  onClick={() => setDeleting(e)}
                  className="rounded-md p-1.5 fg-muted transition hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Delete expense"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon="wallet"
          title="No expenses logged"
          body="Log what you actually spend and the plan adjusts its honesty — the gap between estimate and reality is usually where trips go wrong."
          action="Log the first one"
          onAction={() =>
            setEditing({ trip_id: trip.id, category: "food", kind: "actual", spent_on: todayIso(), amount: 0, label: "" } as Partial<Expense>)
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit expense" : "Log an expense"}
        subtitle="Planned = what you expect to spend. Actual = what you already spent."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : <Icon name="check" size={15} />}
              {editing?.id ? "Save" : "Add"}
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3.5">
            <div>
              <label className="label">What was it for?</label>
              <input
                className="input"
                value={editing.label ?? ""}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="Dinner at Butt Karahi"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  className="input"
                  value={editing.amount ?? 0}
                  onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={(editing.spent_on ?? todayIso()).slice(0, 10)}
                  onChange={(e) => setEditing({ ...editing, spent_on: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditing({ ...editing, category: c.id as ExpenseCategory })}
                    className={cx("chip px-2.5 py-1.5", editing.category === c.id && "chip-active")}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex gap-1.5">
                {(["actual", "planned"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setEditing({ ...editing, kind: k })}
                    className={cx("chip px-2.5 py-1.5 capitalize", editing.kind === k && "chip-active")}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this expense?"
        body={`“${deleting?.label ?? ""}” — ${money(deleting?.amount ?? 0, trip.currency)} will come out of the ledger.`}
        confirmLabel="Remove"
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
