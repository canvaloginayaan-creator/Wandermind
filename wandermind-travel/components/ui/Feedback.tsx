import { cx } from "@/lib/utils";
import { Icon } from "./Icon";
import Link from "next/link";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-4 h-2 w-full" />
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card flex gap-4 p-4">
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <Skeleton className="mt-3 h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "compass",
  title,
  body,
  action,
  href,
  onAction,
  compact,
}: {
  icon?: string;
  title: string;
  body: string;
  action?: string;
  href?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed hairline text-center",
        compact ? "px-5 py-8" : "px-6 py-14"
      )}
    >
      <div className="relative mb-4">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sea-400/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border hairline surface-2 text-sea-300">
          <Icon name={icon} size={24} />
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed fg-muted">{body}</p>
      {action && href && (
        <Link href={href} className="btn-primary mt-5">
          {action}
          <Icon name="arrowRight" size={15} />
        </Link>
      )}
      {action && !href && (
        <button onClick={onAction} className="btn-primary mt-5">
          {action}
          <Icon name="arrowRight" size={15} />
        </button>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Icon name="loader" size={16} className={cx("animate-spin", className)} />;
}

export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="badge bg-sea-500/15 text-sea-300">
      <span className="h-1.5 w-1.5 rounded-full bg-sea-300" />
      Live
    </span>
  ) : (
    <span className="badge bg-white/[0.06] text-[rgb(var(--muted))]" title="Curated estimate — not a live quote">
      Est.
    </span>
  );
}
