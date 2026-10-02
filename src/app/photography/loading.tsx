import { Skeleton, PhotoSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { border, gap, radius } from "@/lib/design-tokens";

export default function PhotographyLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="text-center mb-12 flex flex-col items-center">
        <Skeleton className={cn("h-6 w-32", radius.pill, "mb-4")} />
        <Skeleton className={cn("h-10 sm:h-12 w-64 sm:w-96", radius.card, "mb-4")} />
        <Skeleton className={cn("h-4 w-72 sm:w-80", radius.chip)} />
      </div>

      {/* Toolbar Skeleton (Tabs & Controls) */}
      <div className={cn("flex flex-col sm:flex-row items-center justify-between", gap.loose, "mb-10 pb-6", border.dividerBottom)}>
        <div className={cn("flex items-center", gap.tight)}>
          <Skeleton className={cn("h-10 w-28", radius.control)} />
          <Skeleton className={cn("h-10 w-28", radius.control)} />
        </div>
        <div className={cn("flex items-center", gap.base, "w-full sm:w-auto")}>
          <Skeleton className={cn("h-10 w-full sm:w-64", radius.control)} />
          <Skeleton className={cn("h-10 w-32", radius.control)} />
        </div>
      </div>

      {/* Grid of Artwork Skeletons */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap.grid)}>
        {Array.from({ length: 9 }).map((_, idx) => (
          <PhotoSkeleton
            key={idx}
            aspectRatio={
              idx % 3 === 0
                ? "aspect-[3/4]"
                : idx % 3 === 1
                ? "aspect-[16/10]"
                : "aspect-square"
            }
          />
        ))}
      </div>
    </div>
  );
}
