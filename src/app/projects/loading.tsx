import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="text-center mb-14 flex flex-col items-center">
        <Skeleton className={cn("h-6 w-28", radius.pill, "mb-4")} />
        <Skeleton className={cn("h-10 sm:h-12 w-64 sm:w-80", radius.card, "mb-4")} />
        <Skeleton className={cn("h-4 w-72 sm:w-96", radius.chip)} />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className={cn("flex items-center justify-center", gap.tight, "mb-12 flex-wrap")}>
        <Skeleton className={cn("h-9 w-20", radius.pill)} />
        <Skeleton className={cn("h-9 w-24", radius.pill)} />
        <Skeleton className={cn("h-9 w-28", radius.pill)} />
        <Skeleton className={cn("h-9 w-24", radius.pill)} />
      </div>

      {/* Projects Grid Skeleton */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap.grid)}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}
