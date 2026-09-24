"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EMOJIS, type LastPlay, RANK_TWO, type Reaction, rankOf } from "@/lib/tienlen";
import { cn } from "@/lib/utils";

export interface ChopFx {
  key: string;
  heo: boolean;
  by: string;
}

/**
 * Watches the table's last play and fires a one-shot effect when someone
 * chặt — a big "CHẶT HEO!" when the chopped combo was 2s, a smaller "CHẶT!" otherwise.
 */
export function useChopEffect(lastPlay: LastPlay | null, nameOf: (id: string) => string): ChopFx | null {
  const [fx, setFx] = useState<ChopFx | null>(null);
  const seen = useRef<string | null>(null);
  const key = lastPlay ? `${lastPlay.playerId}:${lastPlay.combo.cards.join(",")}` : null;

  useEffect(() => {
    if (!lastPlay || !key || seen.current === key) return;
    const first = seen.current === null;
    seen.current = key;
    // Don't replay a chop that was already on the table when we connected.
    if (first || !lastPlay.chop) return;
    const heo = !!lastPlay.chopped && rankOf(lastPlay.chopped.top) === RANK_TWO;
    setFx({ key, heo, by: nameOf(lastPlay.playerId) });
    const id = setTimeout(() => setFx((cur) => (cur?.key === key ? null : cur)), heo ? 2200 : 1400);
    return () => clearTimeout(id);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return fx;
}

export function ChopOverlay({ fx }: { fx: ChopFx | null }) {
  return (
    <AnimatePresence>
      {fx && (
        <motion.div
          key={fx.key}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {fx.heo && (
            <motion.div
              className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle,rgba(244,63,94,0.55)_0%,rgba(244,63,94,0)_70%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 0.9, 0] }}
              transition={{ duration: 1.6 }}
            />
          )}
          <motion.div
            className={cn(
              "relative select-none text-center font-black tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]",
              fx.heo ? "text-5xl text-rose-400 sm:text-7xl" : "text-4xl text-amber-300 sm:text-5xl",
            )}
            initial={{ scale: 3, rotate: -12, opacity: 0 }}
            animate={{ scale: [3, 0.9, 1.1, 1], rotate: [-12, 4, -2, 0], opacity: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            {fx.heo ? "CHẶT HEO! 🐷🔪" : "CHẶT! 💥"}
          </motion.div>
          <motion.p
            className="relative mt-2 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {fx.by} chặt!
          </motion.p>
          {fx.heo &&
            Array.from({ length: 10 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute text-3xl"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                animate={{
                  x: Math.cos((i / 10) * Math.PI * 2) * 180,
                  y: Math.sin((i / 10) * Math.PI * 2) * 120,
                  opacity: 0,
                  scale: 1.3,
                  rotate: 360,
                }}
                transition={{ duration: 1.3, ease: "easeOut" }}
              >
                {i % 2 ? "🐷" : "💥"}
              </motion.span>
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Screen-shake wrapper, keyed by the chop so it replays per chop. */
export function Shake({ fx, children, className }: { fx: ChopFx | null; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={fx?.heo ? { x: [0, -14, 12, -10, 8, -5, 3, 0], y: [0, 4, -4, 3, -2, 1, 0, 0] } : fx ? { x: [0, -5, 5, -3, 0] } : { x: 0, y: 0 }}
      transition={{ duration: fx?.heo ? 0.6 : 0.3 }}
      key={fx?.key ?? "still"}
    >
      {children}
    </motion.div>
  );
}

const BUBBLE_MS = 3000;

/** Reactions to show right now, each once, for BUBBLE_MS after it arrives. */
export function useLiveReactions(reactions: Reaction[]): Reaction[] {
  const [live, setLive] = useState<(Reaction & { until: number })[]>([]);
  const seen = useRef(new Set<string>());
  const first = useRef(true);

  useEffect(() => {
    const fresh = reactions.filter((r) => !seen.current.has(r.id));
    fresh.forEach((r) => seen.current.add(r.id));
    // Skip whatever was already in the room when we connected.
    if (first.current) {
      first.current = false;
      return;
    }
    if (!fresh.length) return;
    const until = Date.now() + BUBBLE_MS;
    setLive((cur) => [...cur, ...fresh.map((r) => ({ ...r, until }))]);
  }, [reactions]);

  // Expire bubbles on their own clock — state updates arrive constantly and must not reset it.
  const active = live.length > 0;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setLive((cur) => cur.filter((r) => r.until > Date.now())), 300);
    return () => clearInterval(id);
  }, [active]);

  return live;
}

/** Floating emoji above a seat. */
export function SeatBubble({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.span
            key={r.id}
            className="absolute -translate-x-1/2 text-3xl drop-shadow-lg"
            initial={{ y: 10, opacity: 0, scale: 0.4 }}
            animate={{ y: -36, opacity: 1, scale: 1.2 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Spectators' reactions, stacked at the side of the table. */
export function SpectatorReactions({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="pointer-events-none absolute right-3 top-16 z-20 flex flex-col items-end gap-1">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className="rounded-full bg-black/55 px-2.5 py-1 text-sm text-white backdrop-blur"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="mr-1 text-emerald-100/70">👀 {r.name}</span>
            <span className="text-lg">{r.emoji}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function EmojiBar({ onSend, disabled }: { onSend: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="rounded-lg border border-emerald-200/25 bg-black/25 px-3 py-2 text-lg leading-none transition-colors enabled:hover:bg-white/10 disabled:opacity-40"
        aria-label="Gửi emoji"
        aria-expanded={open}
      >
        😀
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-40 mb-2 grid w-max -translate-x-1/2 grid-cols-6 gap-1 rounded-xl border border-emerald-200/20 bg-[#0b2a1c]/95 p-2 shadow-xl backdrop-blur">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onSend(e);
                setOpen(false);
              }}
              className="rounded-md p-1.5 text-2xl leading-none transition-transform hover:scale-125 hover:bg-white/10"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
