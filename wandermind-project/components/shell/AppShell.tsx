"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx, initials } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { logoutAction } from "@/lib/actions/auth";
import type { User } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/trips", label: "Trips", icon: "compass" },
  { href: "/explore", label: "Explore", icon: "mountain" },
  { href: "/budget", label: "Budget", icon: "wallet" },
  { href: "/saved", label: "Saved places", icon: "bookmark" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("wm-theme");
    if (stored === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.toggle("dark", !next);
    localStorage.setItem("wm-theme", next ? "light" : "dark");
  };

  return (
    <button onClick={toggle} className="btn-quiet w-full justify-start gap-2.5 px-2.5 py-2 text-xs" aria-label="Toggle theme">
      <Icon name={light ? "moon" : "sun"} size={15} />
      {light ? "Dark mode" : "Light mode"}
    </button>
  );
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-500 text-ink-950">
          <Icon name="compass" size={19} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold leading-tight tracking-tight">WanderMind</p>
          <p className="truncate text-[11px] fg-muted">{user.home_city} · {user.currency}</p>
        </div>
      </div>

      <div className="px-3">
        <Link href="/trips/new" className="btn-primary w-full text-sm">
          <Icon name="plus" size={16} />
          New trip
        </Link>
      </div>

      <nav className="mt-5 flex-1 space-y-0.5 px-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/[0.07] text-[rgb(var(--fg))] shadow-sm"
                  : "fg-muted hover:bg-white/[0.04] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon
                name={item.icon}
                size={17}
                className={cx("transition", active ? "text-ember-400" : "group-hover:text-sea-300")}
              />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ember-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t hairline p-2">
        <ThemeToggle />
        <div className="mt-1 flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-ink-950"
            style={{ background: `hsl(${user.avatar_hue} 70% 62%)` }}
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user.name}</p>
            <p className="truncate text-[10px] fg-muted">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg p-1.5 fg-muted transition hover:bg-white/[0.06] hover:text-red-300" title="Sign out">
              <Icon name="logout" size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r hairline bg-[rgb(var(--surface))]/60 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-[264px] border-r hairline surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[232px]">
        {/* mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b hairline bg-[rgb(var(--surface))]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} className="btn-quiet -ml-1 rounded-lg p-2" aria-label="Open menu">
            <Icon name="menu" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ember-500 text-ink-950">
              <Icon name="compass" size={15} strokeWidth={2} />
            </span>
            <span className="font-display text-sm font-semibold">WanderMind</span>
          </div>
          <Link href="/trips/new" className="btn-primary btn-sm">
            <Icon name="plus" size={14} />
            Trip
          </Link>
        </header>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t hairline bg-[rgb(var(--surface))]/95 backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                active ? "text-ember-400" : "fg-muted"
              )}
            >
              <Icon name={item.icon} size={19} />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b hairline px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-7">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ember-400">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
