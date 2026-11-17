import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/AppShell";
import { PlanWizard } from "@/components/trips/PlanWizard";

export const metadata = { title: "New trip · WanderMind" };

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const user = await requireUser();
  const { destination } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="New trip"
        title="Let's plan something real"
        subtitle="Four quick steps. I'll price it against your budget and tell you where it breaks before you book anything."
      />
      <PlanWizard defaultOrigin={user.home_city} defaultDestination={destination} />
    </>
  );
}
