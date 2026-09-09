import React from "react";

// Fixed layout (not Math.random()) so server- and client-rendered markup
// always match — random values here would otherwise differ between the
// server render and the client's first render, causing a hydration
// mismatch (see FloatingHearts fix on the couple page for the same issue).
const STAR_LAYOUT = [
  { top: "12%", left: "18%", size: 2, delay: "0s", duration: "2.2s" },
  { top: "22%", left: "72%", size: 3, delay: "0.4s", duration: "2.6s" },
  { top: "68%", left: "8%", size: 2, delay: "0.8s", duration: "2s" },
  { top: "45%", left: "50%", size: 1.5, delay: "1.2s", duration: "2.8s" },
  { top: "80%", left: "85%", size: 2.5, delay: "0.2s", duration: "2.4s" },
  { top: "35%", left: "28%", size: 1.5, delay: "1.6s", duration: "2.2s" },
  { top: "15%", left: "45%", size: 2, delay: "1s", duration: "3s" },
  { top: "60%", left: "65%", size: 1.5, delay: "0.6s", duration: "2.5s" },
  { top: "88%", left: "35%", size: 2, delay: "1.4s", duration: "2.3s" },
  { top: "5%", left: "88%", size: 1.5, delay: "0.9s", duration: "2.7s" },
  { top: "50%", left: "10%", size: 2.5, delay: "1.8s", duration: "2.1s" },
  { top: "75%", left: "55%", size: 1.5, delay: "0.3s", duration: "2.9s" },
] as const;

/**
 * Twinkling star field overlay for image loading placeholders — layered
 * on top of the shimmer sweep, not a replacement for it.
 */
export function TwinklingStars({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {STAR_LAYOUT.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white light:bg-neutral-400 animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
            boxShadow: "0 0 4px 1px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

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
      className={`relative overflow-hidden bg-white/[0.05] border border-white/5 light:bg-neutral-900/[0.04] light:border-neutral-900/[0.06] ${variantClasses} ${className}`}
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent light:via-neutral-900/[0.06] pointer-events-none" />
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
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 light:bg-slate-100 light:border-neutral-900/10 ${aspectRatio} ${className}`}
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
      className={`rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-white/10 light:bg-white light:border-neutral-900/10 light:shadow-sm light:shadow-neutral-400/20 p-5 backdrop-blur-sm overflow-hidden flex flex-col justify-between ${className}`}
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
      <div className="flex items-center justify-between pt-3 border-t border-white/5 light:border-neutral-900/10">
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
