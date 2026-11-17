import { requireUser } from "@/lib/auth";
import { getItinerary, getMessages, getTrip } from "@/lib/queries";
import { AssistantChat } from "@/components/chat/AssistantChat";
import { openingQuestion } from "@/lib/assistant";
import { eachDay } from "@/lib/utils";
import { liveConfig } from "@/lib/providers/live";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TripAssistantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getTrip(id, user.id);
  if (!trip) notFound();
  const [items, messages] = await Promise.all([getItinerary(id), getMessages(id)]);
  const plannedSpend = items.reduce((s, i) => s + i.cost, 0);
  const days = eachDay(trip.start_date, trip.end_date).length;

  const opening = openingQuestion({
    trip,
    items,
    plannedSpend,
    loggedSpend: 0,
    days,
  });

  return (
    <AssistantChat
      trip={trip}
      initialMessages={messages}
      opening={opening}
      plannedSpend={plannedSpend}
      days={days}
      llmOn={liveConfig().llm}
    />
  );
}
