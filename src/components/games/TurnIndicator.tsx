import { cn } from "@/lib/utils";

/**
 * "It's your turn" highlight shared by the game tables: a softly pulsing
 * amber-red ring laid over the player's hand / controls (the parent must be
 * `relative`). Only the ring pulses, so cards and buttons stay fully opaque;
 * `motion-safe:` keeps it still for prefers-reduced-motion.
 */
export function TurnRing({ active, className }: { active: boolean; className?: string }) {
  if (!active) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-1.5 rounded-2xl ring-2 ring-rose-400 shadow-[0_0_18px_3px_rgba(251,146,60,0.45),inset_0_0_14px_rgba(251,113,133,0.2)] motion-safe:animate-pulse",
        className,
      )}
    />
  );
}

/** Pill announcing the player's turn (screen readers get it via role="status"). */
export function MyTurnBadge({ className, children = "Lượt của bạn" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-2.5 py-0.5 text-xs font-bold text-black shadow-[0_0_12px_rgba(251,113,133,0.5)]",
        className,
      )}
    >
      <span aria-hidden>⏳</span>
      {children}
    </span>
  );
}
