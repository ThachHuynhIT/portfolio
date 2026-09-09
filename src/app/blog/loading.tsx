import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="text-center mb-14 flex flex-col items-center">
        <Skeleton className="h-6 w-24 rounded-full mb-4" />
        <Skeleton className="h-10 sm:h-12 w-64 sm:w-80 rounded-2xl mb-4" />
        <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
      </div>

      {/* Category Tabs Skeleton */}
      <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Blog Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}
