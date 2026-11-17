import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-7 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500 text-ink-950">
            <Icon name="compass" size={20} strokeWidth={2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">WanderMind</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-[11px] fg-muted">
          Planning only — bookings are completed on the airline, rail and hotel sites.
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l hairline lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/dest-hunza.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10" />
        <div className="relative flex h-full flex-col justify-end p-10">
          <blockquote className="max-w-md">
            <p className="font-display text-2xl leading-snug tracking-tight text-white">
              “Your ₨150,000 doesn't do Hunza, Skardu and a Dubai stopover in six days. Pick two and
              I'll make it excellent.”
            </p>
            <footer className="mt-4 text-xs text-white/60">
              The kind of thing WanderMind says before you book the wrong trip.
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
