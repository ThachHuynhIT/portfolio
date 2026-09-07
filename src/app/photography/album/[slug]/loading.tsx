import { Skeleton, PhotoSkeleton } from "@/components/ui/Skeleton";

export default function AlbumDetailLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Back button skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Album Banner Skeleton */}
      <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden mb-12 border border-white/10 bg-slate-900/60 p-8 sm:p-14 flex flex-col justify-end">
        <Skeleton className="h-6 w-32 rounded-full mb-4" />
        <Skeleton className="h-10 sm:h-12 w-2/3 sm:w-1/2 rounded-2xl mb-4" />
        <Skeleton className="h-4 w-full sm:w-2/3 rounded-lg mb-2" />
        <Skeleton className="h-4 w-1/3 rounded-lg mb-4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
      </div>

      {/* Artwork Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <PhotoSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}
