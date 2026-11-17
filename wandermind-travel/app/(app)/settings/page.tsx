import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { liveConfig } from "@/lib/providers/live";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Settings · WanderMind" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const cfg = liveConfig();

  const integrations = [
    {
      name: "Flight search",
      detail: cfg.amadeus ? "Amadeus Self-Service (live)" : "Curated estimates + live booking links",
      on: cfg.amadeus,
      env: "AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET",
    },
    {
      name: "Restaurants & places",
      detail: cfg.places ? "Google Places (live)" : "Curated place library with real map links",
      on: cfg.places,
      env: "GOOGLE_PLACES_API_KEY",
    },
    {
      name: "Assistant model",
      detail: cfg.llm ? "Live LLM (streaming)" : "Built-in reasoning mode",
      on: cfg.llm,
      env: "OPENAI_API_KEY or GEMINI_API_KEY or ANTHROPIC_API_KEY",
    },
    {
      name: "Destination photography",
      detail: cfg.unsplash ? "Unsplash (live)" : "Bundled editorial imagery",
      on: cfg.unsplash,
      env: "UNSPLASH_ACCESS_KEY",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Your defaults, and what's actually live underneath the app."
      />
      <div className="max-w-3xl space-y-5 px-5 py-6 sm:px-8">
        <SettingsForm user={user} />

        <section className="card p-5">
          <h2 className="section-title text-base">Data sources</h2>
          <p className="mt-1 text-xs fg-muted">
            Everything works without keys — the app falls back to curated, dated estimates and links out to
            the real booking engines. Add the env vars below and the same screens switch to live data, with no code changes.
          </p>
          <div className="mt-4 divide-hair">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-start gap-3 py-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    i.on ? "bg-sea-500/15 text-sea-300" : "bg-white/[0.06] fg-muted"
                  }`}
                >
                  <Icon name={i.on ? "check" : "dots"} size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-[11px] fg-muted">{i.detail}</p>
                  {!i.on && <code className="mt-1 block truncate text-[10px] text-sea-300/70">{i.env}</code>}
                </div>
                <span className={`badge shrink-0 ${i.on ? "bg-sea-500/15 text-sea-300" : "bg-white/[0.06] fg-muted"}`}>
                  {i.on ? "Live" : "Fallback"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title text-base">About this build</h2>
          <p className="mt-1.5 text-xs leading-relaxed fg-muted">
            WanderMind plans trips; it never takes payments. Every transport, stay and restaurant card links to the
            operator's own booking page (airline, Pakistan Railways, Daewoo, Booking.com, Google Maps).
            Prices are estimates unless a live provider is configured, and every card is labelled
            <span className="mx-1 badge bg-white/[0.06] fg-muted">Est.</span> or
            <span className="mx-1 badge bg-sea-500/15 text-sea-300">Live</span> so you always know which you're looking at.
          </p>
        </section>
      </div>
    </>
  );
}
