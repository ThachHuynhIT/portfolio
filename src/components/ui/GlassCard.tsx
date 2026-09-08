"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Glassmorphism card component with optional hover effects
 */
export default function GlassCard({
  children,
  className = "",
  hover = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "light:border-neutral-900/10 light:bg-neutral-900/[0.04]",
        "p-6 shadow-xl shadow-black/10 light:shadow-neutral-400/10",
        hover && "transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/5 light:hover:border-neutral-900/15 light:hover:bg-neutral-900/[0.06]",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent light:from-neutral-900/[0.03] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
