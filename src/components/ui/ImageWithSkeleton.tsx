"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Skeleton, TwinklingStars } from "./Skeleton";

export interface ImageWithSkeletonProps
  extends Omit<ImageProps, "onLoad" | "onError"> {
  containerClassName?: string;
  skeletonClassName?: string;
  fallbackText?: string;
}

/**
 * ImageWithSkeleton - High performance Next.js image component with:
 * - Shimmer skeleton loading state
 * - Smooth fade-in transition on load
 * - Fallback error state
 * - Automatic lazy loading & async decoding
 */
export default function ImageWithSkeleton({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  containerClassName = "",
  skeletonClassName = "",
  fallbackText,
  priority = false,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no source provided
  if (!src) {
    return (
      <div
        className={`relative flex items-center justify-center bg-slate-900/60 border border-white/5 text-slate-500 text-xs ${
          fill ? "w-full h-full" : ""
        } ${containerClassName}`}
      >
        <span>{fallbackText || "No image"}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        fill ? "w-full h-full" : "inline-block"
      } ${containerClassName}`}
    >
      {/* Shimmer Skeleton Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div
          className={`absolute inset-0 z-0 ${
            isLoaded ? "opacity-0" : "opacity-100"
          } transition-opacity duration-500 ${skeletonClassName}`}
        >
          <Skeleton className="w-full h-full rounded-none" />
          <TwinklingStars />
        </div>
      )}

      {/* Error State */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-500 text-xs p-3 text-center">
          <span className="text-xl mb-1">🖼️</span>
          <span>{fallbackText || "Unable to display image"}</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt || "Image"}
          fill={fill}
          width={!fill ? width || 600 : undefined}
          height={!fill ? height || 400 : undefined}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-500 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
}
