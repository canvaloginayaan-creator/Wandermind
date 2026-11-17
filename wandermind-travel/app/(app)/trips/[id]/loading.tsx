import { Skeleton, ItinerarySkeleton } from "@/components/ui/Feedback";

export default function TripLoading() {
  return (
    <div>
      <div className="border-b hairline px-5 pb-5 pt-8 sm:px-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-9 w-96 max-w-full" />
        <Skeleton className="mt-3 h-3 w-72 max-w-full" />
      </div>
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <ItinerarySkeleton />
      </div>
    </div>
  );
}
