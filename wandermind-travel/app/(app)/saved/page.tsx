import { requireUser } from "@/lib/auth";
import { getSavedPlaces } from "@/lib/queries";
import { PageHeader } from "@/components/shell/AppShell";
import { SavedPlaces } from "@/components/saved/SavedPlaces";
import { DESTINATIONS } from "@/lib/data/places";

export const metadata = { title: "Saved places · WanderMind" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser();
  const places = await getSavedPlaces(user.id);
  const cities = DESTINATIONS.map((d) => d.city);

  return (
    <>
      <PageHeader
        eyebrow="Your shortlist"
        title="Saved places"
        subtitle={`${places.length} place${places.length === 1 ? "" : "s"} you've kept — restaurants, viewpoints, forts and shops, with map links that work off-app.`}
      />
      <SavedPlaces places={places} cities={cities} />
    </>
  );
}
