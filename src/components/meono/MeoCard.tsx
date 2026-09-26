"use client";

/* eslint-disable @next/next/no-img-element -- small static card art; next/image adds nothing here */
import { MEO_ART, MEO_ART_VERSION } from "@/lib/meono/art";
import { CARDS, type CardType, PACKS } from "@/lib/meono/cards";
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

const HAS_ART = new Set<string>(MEO_ART);
const artSrc = (name: CardType | "back") => (HAS_ART.has(name) ? `/games/meono/cards/${name}.webp?v=${MEO_ART_VERSION}` : null);

/**
 * A Mèo Nổ card: the artwork from public/games/meono/cards/ when there is one
 * (see scripts/meono-art.mjs), otherwise drawn with CSS + emoji.
 */
export function MeoCard({ type, selected, onClick, size = "md", faceDown, className, tooltip = true }: MeoCardProps) {
  const info = CARDS[type];
  const Tag = onClick ? "button" : "div";
  // "hidden": a card of a cursed hand (Lời nguyền mông mèo) — you pick it blind.
  if (faceDown || !info) {
    const back = info ? artSrc("back") : null;
    return (
      <Tag
        onClick={onClick}
        className={cn(
          "aspect-[5/7] shrink-0 rounded-xl border-2 border-white/20 bg-[repeating-linear-gradient(135deg,#7c2d12_0_6px,#9a3412_6px_12px)] shadow-md transition-transform",
          SIZES[size],
          onClick && "hover:-translate-y-1",
          selected && "-translate-y-3 ring-2 ring-amber-300",
          className,
        )}
      >
        {back ? (
          <img src={back} alt="" draggable={false} className="h-full w-full rounded-[10px] object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[length:var(--emoji)] opacity-80">{info ? "🐱" : "🍑"}</div>
        )}
      </Tag>
    );
  }
  const art = artSrc(type);
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
      {art && <img src={art} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
      <span className={cn("relative w-full truncate text-left leading-tight drop-shadow", art && "-m-1 w-[calc(100%+0.5rem)] bg-gradient-to-b from-black/75 to-transparent px-1 pb-2 pt-0.5")}>
        {info.name}
      </span>
      {!art && <span className="text-[length:var(--emoji)] leading-none drop-shadow-lg">{info.emoji}</span>}
      <span className="relative w-full text-right opacity-70 drop-shadow">{info.pack !== "base" ? PACKS[info.pack].emoji : ""}</span>
    </Tag>
  );
}
