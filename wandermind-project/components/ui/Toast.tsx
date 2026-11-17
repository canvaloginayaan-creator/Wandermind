"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import { Icon } from "./Icon";

type Toast = { id: string; title: string; body?: string; tone: "success" | "error" | "info" };
type Ctx = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => remove(id), t.tone === "error" ? 6000 : 4200);
    },
    [remove]
  );

  const value = useMemo<Ctx>(
    () => ({
      toast,
      success: (title, body) => toast({ title, body, tone: "success" }),
      error: (title, body) => toast({ title, body, tone: "error" }),
      info: (title, body) => toast({ title, body, tone: "info" }),
    }),
    [toast]
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              "pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border p-3.5 shadow-lift backdrop-blur-xl",
              t.tone === "success" && "border-sea-400/40 bg-ink-850/95",
              t.tone === "error" && "border-red-500/40 bg-ink-850/95",
              t.tone === "info" && "border-ember-400/40 bg-ink-850/95"
            )}
          >
            <span
              className={cx(
                "mt-0.5 rounded-full p-1",
                t.tone === "success" && "bg-sea-500/20 text-sea-300",
                t.tone === "error" && "bg-red-500/20 text-red-300",
                t.tone === "info" && "bg-ember-500/20 text-ember-300"
              )}
            >
              <Icon
                name={t.tone === "success" ? "check" : t.tone === "error" ? "alert" : "info"}
                size={14}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs leading-relaxed text-white/60">{t.body}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
