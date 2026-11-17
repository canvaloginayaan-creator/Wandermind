import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAllExpenses, listTrips } from "@/lib/queries";
import { PageHeader } from "@/components/shell/AppShell";
import { StatCard, ProgressBar } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Budget · WanderMind" };
export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const user = await requireUser();
  const [expenses, trips] = await Promise.all([getAllExpenses(user.id), listTrips(user.id)]);

  const actual = expenses.filter((e) => e.kind === "actual");
  const planned = expenses.filter((e) => e.kind === "planned");
  const totalActual = actual.reduce((s, e) => s + e.amount, 0);
  const totalPlanned = planned.reduce((s, e) => s + e.amount, 0);
  const budget = trips.filter((t) => t.status !== "archived").reduce((s, t) => s + t.budget_total, 0);

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    amount: expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0);
  const catTotal = byCategory.reduce((s, c) => s + c.amount, 0) || 1;

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Budget ledger"
        subtitle="Everything planned and spent across your trips. The gap between the two columns is where trips get real."
        actions={
          <Link href="/trips" className="btn-ghost text-sm">
            <Icon name="compass" size={15} />
            Go to a trip
          </Link>
        }
      />

      <div className="space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total budget" value={money(budget, user.currency, true)} hint={`${trips.length} trips`} icon="wallet" tone="ember" />
          <StatCard label="Committed" value={money(totalPlanned, user.currency, true)} hint="Planned expenses" icon="calendar" tone="sea" />
          <StatCard label="Actually spent" value={money(totalActual, user.currency, true)} hint={`${actual.length} entries`} icon="check" />
          <StatCard
            label="Headroom"
            value={money(Math.max(0, budget - totalPlanned), user.currency, true)}
            hint="Across all trips"
            icon="sparkles"
            tone={budget - totalPlanned < 0 ? "warn" : "default"}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <h2 className="mb-3 section-title">By trip</h2>
            {trips.length ? (
              <div className="card divide-hair">
                {trips.map((t) => {
                  const ratio = t.budget_total ? (t.planned_spend || t.logged_spend) / t.budget_total : 0;
                  return (
                    <Link key={t.id} href={`/trips/${t.id}/budget`} className="block px-4 py-3.5 transition hover:surface-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          <p className="text-[11px] fg-muted">
                            {t.destination} · {fmtDate(t.start_date)} · {t.travelers} traveller{t.travelers > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold tabular-nums">{money(t.planned_spend, t.currency, true)}</p>
                          <p className="text-[10px] tabular-nums fg-muted">of {money(t.budget_total, t.currency, true)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar ratio={ratio} height={5} color={ratio > 1 ? "#f87171" : ratio > 0.9 ? "#ffb457" : "#4bc0ae"} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact icon="wallet" title="No budgets yet" body="Create a trip and its budget breakdown shows up here." action="Plan a trip" href="/trips/new" />
            )}
          </section>

          <section>
            <h2 className="mb-3 section-title">By category</h2>
            {byCategory.length ? (
              <div className="card space-y-3.5 p-5">
                {byCategory.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-2 font-medium">{c.label}</span>
                      <span className="tabular-nums fg-muted">{money(c.amount, user.currency, true)}</span>
                    </div>
                    <ProgressBar ratio={c.amount / catTotal} color={c.color} height={5} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState compact icon="wallet" title="Nothing spent" body="Log expenses inside a trip and the categories fill in." />
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 section-title">Recent entries</h2>
          {expenses.length ? (
            <div className="card divide-hair overflow-hidden">
              {expenses.slice(0, 20).map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.color ?? "#9fb3ae" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.label}</p>
                    <p className="text-[10px] fg-muted">
                      {e.trip_title} · {fmtDate(e.spent_on)} · {e.kind}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{money(e.amount, e.currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon="calendar" title="No entries yet" body="Expenses you log inside a trip appear here." />
          )}
        </section>
      </div>
    </>
  );
}
