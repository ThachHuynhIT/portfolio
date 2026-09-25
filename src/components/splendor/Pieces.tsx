"use client";

import { CARD_BY_ID, GEMS, GEM_NAMES, type Gem, NOBLE_BY_ID, type Token } from "@/lib/splendor/cards";
import { cn } from "@/lib/utils";

/** Original artwork: every piece is drawn here in SVG / CSS (no third-party card scans). */

export const GEM_STYLE: Record<Token, { base: string; light: string; dark: string; text: string }> = {
  white: { base: "#e5e7eb", light: "#ffffff", dark: "#9ca3af", text: "#111827" },
  blue: { base: "#2563eb", light: "#93c5fd", dark: "#1e3a8a", text: "#ffffff" },
  green: { base: "#16a34a", light: "#86efac", dark: "#14532d", text: "#ffffff" },
  red: { base: "#dc2626", light: "#fca5a5", dark: "#7f1d1d", text: "#ffffff" },
  black: { base: "#374151", light: "#9ca3af", dark: "#030712", text: "#ffffff" },
  gold: { base: "#f59e0b", light: "#fde68a", dark: "#92400e", text: "#1c1917" },
};

/** A faceted gem. */
export function GemIcon({ gem, className }: { gem: Token; className?: string }) {
  const c = GEM_STYLE[gem];
  const id = `gem-${gem}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label={GEM_NAMES[gem]} role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.55" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      {gem === "gold" ? (
        <>
          <circle cx="12" cy="12" r="10" fill={`url(#${id})`} stroke={c.dark} strokeWidth="1" />
          <circle cx="12" cy="12" r="6.5" fill="none" stroke={c.light} strokeWidth="1.2" opacity="0.8" />
          <path d="M12 7.5 L13.3 10.6 L16.5 10.8 L14 12.9 L14.8 16 L12 14.3 L9.2 16 L10 12.9 L7.5 10.8 L10.7 10.6 Z" fill={c.light} />
        </>
      ) : (
        <>
          <path d="M6 3 H18 L22 9 L12 21 L2 9 Z" fill={`url(#${id})`} stroke={c.dark} strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M2 9 H22 M6 3 L9 9 L12 21 L15 9 L18 3 M9 9 L12 3 L15 9" fill="none" stroke={c.light} strokeWidth="0.7" opacity="0.7" />
          <path d="M6 3 L9 9 L2 9 Z" fill="#fff" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

/** A poker-chip style token. */
export function TokenChip({
  gem,
  count,
  size = "md",
  selected,
  dimmed,
  onClick,
  title,
}: {
  gem: Token;
  count?: number;
  size?: "sm" | "md" | "lg";
  selected?: number;
  dimmed?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const c = GEM_STYLE[gem];
  const px = size === "lg" ? "h-14 w-14" : size === "md" ? "h-11 w-11" : "h-8 w-8";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      title={title ?? GEM_NAMES[gem]}
      className={cn("relative shrink-0 transition-transform", onClick && "hover:-translate-y-0.5 active:scale-95", dimmed && "opacity-35")}
    >
      <span
        className={cn("flex items-center justify-center rounded-full shadow-md", px)}
        style={{
          background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 55%, ${c.dark})`,
          border: `3px dashed ${c.light}`,
          outline: `2px solid ${c.dark}`,
        }}
      >
        <GemIcon gem={gem} className="h-3/5 w-3/5 drop-shadow" />
      </span>
      {count !== undefined && (
        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/80 px-1 text-[11px] font-bold text-white ring-1 ring-white/30">
          {count}
        </span>
      )}
      {!!selected && (
        <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-black text-black shadow">
          +{selected}
        </span>
      )}
    </Tag>
  );
}

/** Scenery per tier: mine (1), caravan road (2), palace (3) — simple silhouettes. */
function TierScene({ tier, color }: { tier: 1 | 2 | 3; color: string }) {
  return (
    <svg viewBox="0 0 50 40" className="absolute inset-x-0 bottom-0 h-3/5 w-full" preserveAspectRatio="none" aria-hidden>
      {tier === 1 && (
        <>
          <path d="M0 40 L0 26 L10 16 L18 24 L28 12 L38 22 L50 14 L50 40 Z" fill={color} opacity="0.35" />
          <path d="M20 40 L20 30 Q25 24 30 30 L30 40 Z" fill="#000" opacity="0.35" />
        </>
      )}
      {tier === 2 && (
        <>
          <path d="M0 40 L0 30 Q12 22 25 28 T50 26 L50 40 Z" fill={color} opacity="0.35" />
          <path d="M8 30 h8 v-5 h-8 z M30 29 h10 v-6 h-10 z" fill="#000" opacity="0.25" />
          <circle cx="40" cy="10" r="4" fill="#fff" opacity="0.3" />
        </>
      )}
      {tier === 3 && (
        <>
          <path d="M0 40 L0 30 L50 30 L50 40 Z" fill={color} opacity="0.35" />
          <path d="M12 30 V18 L16 13 L20 18 V30 M22 30 V14 L25 8 L28 14 V30 M30 30 V18 L34 13 L38 18 V30" fill="#000" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

const TIER_FRAME = { 1: "#65a30d", 2: "#d97706", 3: "#2563eb" } as const;

/** A development card face. */
export function DevCardView({
  id,
  size = "md",
  onClick,
  affordable,
  highlight,
  className,
}: {
  id: number;
  size?: "sm" | "md";
  onClick?: () => void;
  affordable?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  const card = CARD_BY_ID[id];
  const c = GEM_STYLE[card.bonus];
  const Tag = onClick ? "button" : "div";
  const w = size === "md" ? "w-[4.6rem] sm:w-24" : "w-14";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "relative aspect-[5/7] shrink-0 overflow-hidden rounded-lg text-left shadow-lg transition-transform",
        w,
        onClick && "hover:-translate-y-1 hover:shadow-xl",
        affordable && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent",
        highlight && "ring-2 ring-amber-300",
        className,
      )}
      style={{
        background: `linear-gradient(160deg, ${c.light} 0%, ${c.base} 45%, ${c.dark} 100%)`,
        border: `2px solid ${TIER_FRAME[card.tier]}`,
      }}
      title={`Thẻ ${GEM_NAMES[card.bonus]} · ${card.points} điểm · giá ${GEMS.filter((g) => card.cost[g]).map((g) => `${card.cost[g]} ${GEM_NAMES[g]}`).join(", ")}`}
    >
      <TierScene tier={card.tier} color={c.dark} />
      <div className="relative flex items-center justify-between bg-white/75 px-1 py-0.5">
        <span className="text-base font-black leading-none text-stone-900 sm:text-xl">{card.points || ""}</span>
        <GemIcon gem={card.bonus} className="h-4 w-4 sm:h-6 sm:w-6" />
      </div>
      <div className="absolute bottom-0.5 left-0.5 grid grid-flow-col grid-rows-2 gap-[2px]">
        {GEMS.filter((g) => card.cost[g]).map((g) => (
          <span
            key={g}
            className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black shadow sm:h-5 sm:w-5 sm:text-[11px]"
            style={{ background: GEM_STYLE[g].base, color: GEM_STYLE[g].text, border: `1px solid ${GEM_STYLE[g].light}` }}
          >
            {card.cost[g]}
          </span>
        ))}
      </div>
      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-white/70">{"I".repeat(card.tier)}</span>
    </Tag>
  );
}

export function CardBack({ tier, count, onClick, size = "md" }: { tier: 1 | 2 | 3; count?: number; onClick?: () => void; size?: "sm" | "md" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "relative flex aspect-[5/7] shrink-0 flex-col items-center justify-center rounded-lg shadow-lg",
        size === "md" ? "w-[4.6rem] sm:w-24" : "w-14",
        onClick && "hover:-translate-y-1",
      )}
      style={{
        background: `repeating-linear-gradient(45deg, ${TIER_FRAME[tier]}, ${TIER_FRAME[tier]} 6px, #0000 6px, #0000 12px), #1c1917`,
        border: `2px solid ${TIER_FRAME[tier]}`,
      }}
      title={`Chồng thẻ cấp ${tier}`}
    >
      <span className="rounded-full bg-black/60 px-2 py-0.5 text-sm font-black text-white">{"I".repeat(tier)}</span>
      {count !== undefined && <span className="mt-1 rounded bg-black/60 px-1.5 text-[10px] text-white/80">{count} thẻ</span>}
    </Tag>
  );
}

/** Noble tile: 3 points, required bonuses. */
export function NobleTile({ id, size = "md", dim }: { id: number; size?: "sm" | "md"; dim?: boolean }) {
  const n = NOBLE_BY_ID[id];
  return (
    <div
      className={cn(
        "relative aspect-square shrink-0 overflow-hidden rounded-lg shadow-lg",
        size === "md" ? "w-16 sm:w-20" : "w-10",
        dim && "opacity-40",
      )}
      style={{ background: "linear-gradient(145deg,#fef3c7,#d6b370 60%,#8a6a2f)" }}
      title={`Quý tộc · ${n.points} điểm · cần ${GEMS.filter((g) => n.req[g]).map((g) => `${n.req[g]} thẻ ${GEM_NAMES[g]}`).join(", ")}`}
    >
      <svg viewBox="0 0 40 40" className="absolute bottom-0 right-0 h-3/4 w-3/4 opacity-30" aria-hidden>
        <path d="M8 34 L10 18 L16 24 L20 12 L24 24 L30 18 L32 34 Z" fill="#78350f" />
      </svg>
      <span className={cn("absolute left-1 top-0.5 font-black text-stone-900", size === "md" ? "text-lg" : "text-xs")}>{n.points}</span>
      <div className="absolute bottom-1 left-1 flex flex-col gap-[2px]">
        {GEMS.filter((g) => n.req[g]).map((g) => (
          <span
            key={g}
            className={cn("flex items-center justify-center rounded-sm font-black shadow", size === "md" ? "h-4 w-3.5 text-[10px]" : "h-2.5 w-2 text-[7px]")}
            style={{ background: GEM_STYLE[g].base, color: GEM_STYLE[g].text }}
          >
            {n.req[g]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Small colour square for a bonus count. */
export function BonusPip({ gem, n }: { gem: Gem; n: number }) {
  return (
    <span
      className="flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-black shadow"
      style={{ background: GEM_STYLE[gem].base, color: GEM_STYLE[gem].text, opacity: n ? 1 : 0.3 }}
      title={`${n} thẻ ${GEM_NAMES[gem]}`}
    >
      {n}
    </span>
  );
}
