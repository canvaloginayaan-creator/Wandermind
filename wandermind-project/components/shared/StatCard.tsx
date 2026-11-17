import { cx } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: "default" | "ember" | "sea" | "warn";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] fg-muted">{label}</p>
        <span
          className={cx(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "ember" && "bg-ember-500/12 text-ember-400",
            tone === "sea" && "bg-sea-500/12 text-sea-300",
            tone === "warn" && "bg-amber-500/12 text-amber-300",
            tone === "default" && "bg-white/[0.06] fg-muted"
          )}
        >
          <Icon name={icon} size={15} />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] fg-muted">{hint}</p>}
    </div>
  );
}

export function BudgetRing({
  ratio,
  size = 128,
  stroke = 10,
  label,
  sub,
  color = "#ffb457",
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1.15, ratio));
  const dash = c * Math.min(1, clamped);
  const over = ratio > 1;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "#f87171" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cx("font-display text-xl font-semibold tabular-nums", over && "text-red-300")}>
          {Math.round(ratio * 100)}%
        </span>
        <span className="text-[10px] uppercase tracking-wider fg-muted">{label}</span>
        {sub && <span className="mt-0.5 text-[10px] fg-muted">{sub}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({
  ratio,
  color = "#4bc0ae",
  height = 6,
}: {
  ratio: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.08]" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(2, ratio * 100))}%`, background: color }}
      />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-white/[0.08] text-[rgb(var(--muted))]" },
    planned: { label: "Planned", cls: "bg-sea-500/15 text-sea-300" },
    booked: { label: "Booked", cls: "bg-ember-500/15 text-ember-300" },
    archived: { label: "Archived", cls: "bg-white/[0.05] text-[rgb(var(--muted))]" },
  };
  const s = map[status] ?? map.draft;
  return <span className={cx("badge", s.cls)}>{s.label}</span>;
}
