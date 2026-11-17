"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, logoutAction } from "@/lib/actions/auth";
import { CITIES } from "@/lib/data/geo";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { initials } from "@/lib/utils";
import type { User } from "@/lib/types";

export function SettingsForm({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(updateProfileAction, null as any);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <section className="card p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-ink-950"
          style={{ background: `hsl(${user.avatar_hue} 70% 62%)` }}
        >
          {initials(user.name)}
        </span>
        <div>
          <h2 className="section-title text-base">{user.name}</h2>
          <p className="text-[11px] fg-muted">{user.email}</p>
        </div>
        <form action={logoutAction} className="ml-auto">
          <button className="btn-ghost text-xs">
            <Icon name="logout" size={14} />
            Sign out
          </button>
        </form>
      </div>

      <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" defaultValue={user.name} className="input" required />
        </div>
        <div>
          <label className="label">Home city</label>
          <select name="home_city" defaultValue={user.home_city} className="input">
            {CITIES.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Currency</label>
          <select name="currency" defaultValue={user.currency} className="input">
            {["PKR", "USD", "AED", "EUR"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full text-sm" disabled={pending}>
            {pending ? <Spinner /> : <Icon name="check" size={15} />}
            Save profile
          </button>
        </div>
      </form>
    </section>
  );
}
