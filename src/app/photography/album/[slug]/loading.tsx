import { Skeleton, PhotoSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

export default function AlbumDetailLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Back button skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className={cn("h-8 w-36", radius.control)} />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Album Banner Skeleton */}
      <div className={cn("relative aspect-[21/9] w-full", radius.panel, "overflow-hidden mb-12 border border-white/10 bg-slate-900/60 p-8 sm:p-14 flex flex-col justify-end light:border-neutral-900/10 light:bg-slate-100")}>
        <Skeleton className={cn("h-6 w-32", radius.pill, "mb-4")} />
        <Skeleton className={cn("h-10 sm:h-12 w-2/3 sm:w-1/2", radius.card, "mb-4")} />
        <Skeleton className={cn("h-4 w-full sm:w-2/3", radius.chip, "mb-2")} />
        <Skeleton className={cn("h-4 w-1/3", radius.chip, "mb-4")} />
        <div className={cn("flex items-center", gap.base)}>
          <Skeleton className={cn("h-7 w-28", radius.chip)} />
          <Skeleton className={cn("h-7 w-28", radius.chip)} />
        </div>
      </div>

      {/* Artwork Grid Skeleton */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap.grid)}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <PhotoSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}
