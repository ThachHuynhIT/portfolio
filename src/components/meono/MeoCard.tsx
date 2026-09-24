"use client";

import { CARDS, type CardType } from "@/lib/meono/cards";
import { cn } from "@/lib/utils";

interface MeoCardProps {
  type: CardType;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  className?: string;
  /** Show the rules text as a native tooltip. */
  tooltip?: boolean;
}

const SIZES = {
  sm: "w-12 text-[9px] [--emoji:1.25rem]",
  md: "w-[4.6rem] text-[10px] [--emoji:1.9rem] sm:w-20",
  lg: "w-28 text-xs [--emoji:2.8rem]",
};

/** A Mèo Nổ card drawn with CSS + emoji. */
export function MeoCard({ type, selected, onClick, size = "md", faceDown, className, tooltip = true }: MeoCardProps) {
  const info = CARDS[type];
  const Tag = onClick ? "button" : "div";
  if (faceDown) {
    return (
      <div
        className={cn(
          "aspect-[5/7] shrink-0 rounded-xl border-2 border-white/20 bg-[repeating-linear-gradient(135deg,#7c2d12_0_6px,#9a3412_6px_12px)] shadow-md",
          SIZES[size],
          className,
        )}
      >
        <div className="flex h-full items-center justify-center text-[length:var(--emoji)] opacity-80">🐱</div>
      </div>
    );
  }
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!selected : undefined}
      aria-label={info.name}
      title={tooltip ? `${info.name}\n${info.effect}` : undefined}
      className={cn(
        "relative flex aspect-[5/7] shrink-0 select-none flex-col items-center justify-between overflow-hidden rounded-xl border-2 bg-gradient-to-br p-1 font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,0.4)] transition-transform duration-150",
        info.color,
        SIZES[size],
        selected ? "-translate-y-4 border-amber-300 ring-2 ring-amber-300" : "border-white/25",
        onClick && "cursor-pointer hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        onClick && selected && "hover:-translate-y-4",
        className,
      )}
    >
      <span className="w-full truncate text-left leading-tight drop-shadow">{info.name}</span>
      <span className="text-[length:var(--emoji)] leading-none drop-shadow-lg">{info.emoji}</span>
      <span className="w-full text-right opacity-70">{info.pack !== "base" ? (info.pack === "imploding" ? "🌀" : "☢️") : ""}</span>
    </Tag>
  );
}
