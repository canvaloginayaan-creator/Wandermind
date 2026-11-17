import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listTrips } from "@/lib/queries";
import { PageHeader } from "@/components/shell/AppShell";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { cx, money } from "@/lib/utils";

export const metadata = { title: "Trips · WanderMind" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "draft", label: "Drafts" },
  { id: "past", label: "Past" },
  { id: "archived", label: "Archived" },
];

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const { filter = "all" } = await searchParams;
  const all = await listTrips(user.id);
  const today = new Date().toISOString().slice(0, 10);

  const trips = all.filter((t) => {
    if (filter === "upcoming") return t.end_date >= today && t.status !== "archived";
    if (filter === "past") return t.end_date < today && t.status !== "archived";
    if (filter === "draft") return t.status === "draft";
    if (filter === "archived") return t.status === "archived";
    return t.status !== "archived";
  });

  const committed = trips.reduce((s, t) => s + t.budget_total, 0);

  return (
    <>
      <PageHeader
        eyebrow="Your travel"
        title="Trips"
        subtitle={`${all.length} trip${all.length === 1 ? "" : "s"} on file · ${money(committed, user.currency)} of budget in play.`}
        actions={
          <>
            <Link href="/explore" className="btn-ghost text-sm">
              <Icon name="mountain" size={15} />
              Explore
            </Link>
            <Link href="/trips/new" className="btn-primary text-sm">
              <Icon name="plus" size={15} />
              New trip
            </Link>
          </>
        }
      />

      <div className="px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={f.id === "all" ? "/trips" : `/trips?filter=${f.id}`}
              className={cx("chip px-3 py-1.5", filter === f.id && "chip-active")}
            >
              {f.label}
              <span className="ml-1 tabular-nums opacity-60">
                {f.id === "all"
                  ? all.filter((t) => t.status !== "archived").length
                  : f.id === "upcoming"
                  ? all.filter((t) => t.end_date >= today && t.status !== "archived").length
                  : f.id === "past"
                  ? all.filter((t) => t.end_date < today && t.status !== "archived").length
                  : all.filter((t) => t.status === (f.id === "draft" ? "draft" : "archived")).length}
              </span>
            </Link>
          ))}
        </div>

        {trips.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={filter === "archived" ? "archive" : "compass"}
            title={filter === "draft" ? "No drafts sitting around" : filter === "archived" ? "Nothing archived" : "No trips in this view"}
            body={
              filter === "draft"
                ? "Everything you've started has a plan attached. Good."
                : "Start with a destination and a budget — the rest builds itself."
            }
            action="Plan a trip"
            href="/trips/new"
          />
        )}
      </div>
    </>
  );
}
