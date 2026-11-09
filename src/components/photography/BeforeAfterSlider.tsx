"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/design-tokens";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  alt?: string;
  className?: string;
  initialPosition?: number; // 0 to 100
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Original / RAW",
  afterLabel = "Edited / Retouched",
  aspectRatio = "landscape",
  alt = "Comparison",
  className = "",
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const percent = Math.max(0, Math.min(100, (x / width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const onMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const onMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX);
    };

    const onTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleMove]);

  const aspectClass =
    aspectRatio === "portrait"
      ? "aspect-[4/5]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[16/10]";

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none overflow-hidden rounded-lg bg-portfolio-hull border border-portfolio-hairline cursor-ew-resize group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-accretion)] ", aspectClass, className)}
      onMouseDown={onMouseDown}
      onTouchStart={() => setIsDragging(true)}
      role="slider"
      aria-valuenow={Math.round(sliderPos)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Before and after image comparison slider"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(0, p - 5));
        if (e.key === "ArrowRight") setSliderPos((p) => Math.min(100, p + 5));
      }}
    >
      {/* ── After Image (Base layer - full width) ── */}
      <div className="absolute inset-0 w-full h-full">
        <ImageWithSkeleton containerClassName="photography-media"
          src={afterImage}
          alt={`${alt} - ${afterLabel}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          className="object-cover pointer-events-none"
          priority={false}
        />
        {/* After Badge */}
        <span className={cn("absolute top-4 right-4 z-10 px-3 py-1", radius.pill, "text-xs font-semibold tracking-wider uppercase bg-portfolio-hull text-portfolio-accretion", "border border-portfolio-hairline")}>
          {afterLabel}
        </span>
      </div>

      {/* ── Before Image (Clipped overlay) ── */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden will-change-[clip-path]"
        style={{
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
        }}
      >
        <ImageWithSkeleton containerClassName="photography-media"
          src={beforeImage}
          alt={`${alt} - ${beforeLabel}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          className="object-cover pointer-events-none"
          priority={false}
        />
        {/* Before Badge */}
        <span className={cn("absolute top-4 left-4 z-10 px-3 py-1", radius.pill, "text-xs font-semibold tracking-wider uppercase bg-portfolio-hull text-portfolio-accretion", "border border-portfolio-hairline")}>
          {beforeLabel}
        </span>
      </div>

      {/* ── Divider Bar with Handle ── */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-portfolio-accretion pointer-events-none transition-transform"
        style={{ left: `${sliderPos}%` }}
      >
        <div className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9", radius.pill, "bg-portfolio-hull border-2 border-portfolio-accretion text-portfolio-ink flex items-center justify-center", " transition-transform")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-portfolio-ink"
          >
            <polyline points="8 7 3 12 8 17" />
            <polyline points="16 7 21 12 16 17" />
          </svg>
        </div>
      </div>

      {/* Instruction hint banner */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
        <span className={cn("px-3 py-1 text-[11px] font-medium text-white/90 bg-black/70", radius.pill, "border border-portfolio-hairline opacity-75 group-hover:opacity-100 transition-opacity")}>
          Drag slider to compare RAW & Retouched
        </span>
      </div>
    </div>
  );
}
