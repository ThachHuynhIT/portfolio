"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Skeleton, TwinklingStars } from "./Skeleton";
import Icon from "./Icon";

export interface ImageWithSkeletonProps
  extends Omit<ImageProps, "onLoad" | "onError"> {
  containerClassName?: string;
  skeletonClassName?: string;
  fallbackText?: string;
  /** Low-res/blurred URL painted instantly behind the skeleton while the real image loads. */
  placeholderSrc?: string;
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
  placeholderSrc,
  priority = false,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no source provided
  if (!src) {
    return (
      <div
        className={`relative flex items-center justify-center bg-slate-900/60 border border-white/5 text-slate-500 light:bg-slate-100 light:border-neutral-900/10 light:text-slate-500 text-xs ${
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
      {/* Instant low-res/blurred placeholder painted while the real image loads */}
      {placeholderSrc && !isLoaded && !hasError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 w-full h-full object-cover scale-110 blur-md transition-opacity duration-500 opacity-100"
        />
      )}

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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-500 light:bg-white/85 light:text-slate-600 text-xs p-3 text-center">
          <Icon name="image" size={22} className="mb-1" />
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
