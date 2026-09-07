import { Skeleton, PhotoSkeleton } from "@/components/ui/Skeleton";

export default function PhotographyLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="text-center mb-12 flex flex-col items-center">
        <Skeleton className="h-6 w-32 rounded-full mb-4" />
        <Skeleton className="h-10 sm:h-12 w-64 sm:w-96 rounded-2xl mb-4" />
        <Skeleton className="h-4 w-72 sm:w-80 rounded-lg" />
      </div>

      {/* Toolbar Skeleton (Tabs & Controls) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid of Artwork Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
