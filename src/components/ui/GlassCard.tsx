"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { border, elevation, motion, radius, surface } from "@/lib/design-tokens";
import { presets } from "@/lib/ui-presets";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Glassmorphism card component with optional hover effects.
 *
 * Surface, border, blur and shadow come from `presets.card`
 * (`src/lib/ui-presets.ts`) — edit the tokens there to restyle every card.
 */
export default function GlassCard({
  children,
  className = "",
  hover = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        presets.card,
        hover &&
          cn(
            motion.base,
            border.subtleHover,
            surface.cardHover,
            elevation.cardHover
          ),
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          radius.card,
          "bg-gradient-to-br from-white/5 via-transparent to-transparent light:from-neutral-900/[0.03]"
        )}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
