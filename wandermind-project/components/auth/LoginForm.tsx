"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, demoLoginAction } from "@/lib/actions/auth";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null as any);

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm fg-muted">Your trips are where you left them.</p>

      <form action={action} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue="demo@wandermind.app"
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            defaultValue="demo1234"
            className="input"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
            {state.error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest fg-muted">
        <span className="h-px flex-1 bg-[rgb(var(--line))]" />
        or
        <span className="h-px flex-1 bg-[rgb(var(--line))]" />
      </div>

      <form action={demoLoginAction}>
        <button type="submit" className="btn-ghost w-full">
          <Icon name="sparkles" size={15} />
          Explore with the demo account
        </button>
      </form>

      <p className="mt-6 text-center text-sm fg-muted">
        New here?{" "}
        <Link href="/register" className="link">
          Create an account
        </Link>
      </p>
    </div>
  );
}
