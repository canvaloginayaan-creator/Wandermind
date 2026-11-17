import { requireUser } from "@/lib/auth";
import { getExpenses, getItinerary, getTrip } from "@/lib/queries";
import { TripBudget } from "@/components/trips/TripBudget";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TripBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getTrip(id, user.id);
  if (!trip) notFound();
  const [expenses, items] = await Promise.all([getExpenses(id), getItinerary(id)]);
  return <TripBudget trip={trip} expenses={expenses} items={items} />;
}
