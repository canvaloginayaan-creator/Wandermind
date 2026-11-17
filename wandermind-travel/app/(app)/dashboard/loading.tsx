import { Skeleton, TripCardSkeleton } from "@/components/ui/Feedback";

export default function DashboardLoading() {
  return (
    <div>
      <div className="border-b hairline px-5 py-7 sm:px-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2.5 h-8 w-80 max-w-full" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      </div>
      <div className="space-y-7 px-5 py-6 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-24" />
              <Skeleton className="mt-2 h-2.5 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      </div>
    </div>
  );
}
