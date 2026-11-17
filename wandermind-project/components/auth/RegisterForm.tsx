"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { CITIES } from "@/lib/data/geo";

export function RegisterForm({ destination }: { destination?: string }) {
  const [state, action, pending] = useActionState(registerAction, null as any);

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Start planning</h1>
      <p className="mt-2 text-sm fg-muted">
        One account, every trip. No payment details, ever.
        {destination ? ` We'll pre-fill ${destination} for you.` : ""}
      </p>

      <form action={action} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" required className="input" placeholder="Ayesha Khan" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
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
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="home_city">
              Home city
            </label>
            <select id="home_city" name="home_city" className="input" defaultValue="Karachi">
              {CITIES.filter((c) => c.country === "Pakistan").map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="currency">
              Currency
            </label>
            <select id="currency" name="currency" className="input" defaultValue="PKR">
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {state?.error && (
          <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
            {state.error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm fg-muted">
        Already have one?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
