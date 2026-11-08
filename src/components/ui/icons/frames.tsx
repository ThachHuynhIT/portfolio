import type { ReactNode } from "react";

export interface StrokeIconProps<N extends string = string> {
  name: N;
  size: number;
  className: string;
  filled: boolean;
}

export interface BrandIconProps<N extends string = string> {
  name: N;
  size: number;
  className: string;
}

/** Wrapper every brand logo renders in; also used empty as the lazy-load slot. */
export function BrandIconFrame({
  size,
  className,
  children,
}: {
  size: number;
  className: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

/** Empty svg with the same box as a lucide icon — the slot shown while a lazy stroke registry loads. */
export function StrokeIconSlot({ size, className }: { size: number; className: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" />;
}
