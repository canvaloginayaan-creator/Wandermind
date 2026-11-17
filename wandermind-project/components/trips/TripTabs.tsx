"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export function TripTabs({ tripId, itemCount }: { tripId: string; itemCount: number }) {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;
  const tabs = [
    { href: base, label: "Itinerary", icon: "calendar", exact: true },
    { href: `${base}/assistant`, label: "Assistant", icon: "sparkles" },
    { href: `${base}/budget`, label: "Budget", icon: "wallet" },
    { href: `${base}/edit`, label: "Settings", icon: "settings" },
  ];

  return (
    <div className="sticky top-0 z-20 border-b hairline bg-[rgb(var(--surface))]/85 backdrop-blur-xl">
      <div className="flex items-center gap-1 overflow-x-auto px-3 sm:px-6">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cx(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition",
                active ? "text-[rgb(var(--fg))]" : "fg-muted hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon name={t.icon} size={15} className={active ? "text-ember-400" : ""} />
              {t.label}
              {t.label === "Itinerary" && itemCount > 0 && (
                <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums fg-muted">
                  {itemCount}
                </span>
              )}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember-400" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
