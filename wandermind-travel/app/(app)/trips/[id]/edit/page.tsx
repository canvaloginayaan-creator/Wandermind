import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTrip } from "@/lib/queries";
import { TripEditForm } from "@/components/trips/TripEditForm";

export const dynamic = "force-dynamic";

export default async function TripEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getTrip(id, user.id);
  if (!trip) notFound();
  return <TripEditForm trip={trip} />;
}
