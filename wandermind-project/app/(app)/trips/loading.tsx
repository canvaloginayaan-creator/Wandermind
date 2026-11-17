import { Skeleton, TripCardSkeleton } from "@/components/ui/Feedback";

export default function TripsLoading() {
  return (
    <div>
      <div className="border-b hairline px-5 py-7 sm:px-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2.5 h-8 w-48" />
      </div>
      <div className="px-5 py-6 sm:px-8">
        <div className="mb-5 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
