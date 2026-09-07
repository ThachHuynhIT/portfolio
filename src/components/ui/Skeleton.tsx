import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rounded" | "circular" | "rectangular";
  shimmer?: boolean;
}

/**
 * Base Skeleton component with high-performance shimmer animation.
 */
export function Skeleton({
  className = "",
  variant = "rounded",
  shimmer = true,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rounded: "rounded-xl",
    circular: "rounded-full",
    rectangular: "rounded-none",
  }[variant];

  return (
    <div
      className={`relative overflow-hidden bg-white/[0.05] border border-white/5 ${variantClasses} ${className}`}
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Photo / Artwork Skeleton placeholder with configurable aspect ratio.
 */
export function PhotoSkeleton({
  aspectRatio = "aspect-[16/10]",
  className = "",
}: {
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 ${aspectRatio} ${className}`}
    >
      <Skeleton className="w-full h-full rounded-2xl" />
      {/* Subtle bottom gradient bar */}
      <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between">
        <Skeleton className="h-4 w-1/3 rounded-lg" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Universal Card Skeleton (Projects, Blog, Albums)
 */
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-white/10 p-5 backdrop-blur-sm overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>

      {/* Meta tags */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-2.5 rounded-lg" />

      {/* Excerpt / Description */}
      <div className="space-y-2 mb-4 flex-1">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
      </div>

      {/* Footer / CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Section Skeleton for dynamic below-the-fold imports
 */
export function SectionSkeleton({
  title = "Loading section...",
  cardCount = 3,
  className = "",
}: {
  title?: string;
  cardCount?: number;
  className?: string;
}) {
  return (
    <section className={`relative py-28 overflow-hidden ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header Skeleton */}
        <div className="text-center mb-14 max-w-2xl mx-auto flex flex-col items-center">
          <Skeleton className="h-6 w-24 rounded-full mb-4" />
          <Skeleton className="h-10 w-72 sm:w-96 rounded-2xl mb-3" />
          <Skeleton className="h-4 w-full sm:w-80 rounded-lg mb-1.5" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: cardCount }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Compact Text Skeleton
 */
export function TextSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-4 rounded ${idx === lines - 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
