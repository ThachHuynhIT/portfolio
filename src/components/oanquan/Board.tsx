"use client";

import { useEffect, useRef, useState } from "react";
import { ROWS } from "@/lib/oanquan/board";
import type { OQGameView, OQMove } from "@/lib/oanquan/protocol";
import { cn } from "@/lib/utils";

/** What the board shows while a move is being replayed stone by stone. */
export interface SowFrame {
  seq: number;
  dan: number[];
  quan: boolean[];
  /** Square the hand is over (just sown into / picked up from). */
  cell: number | null;
  /** Stones still in the hand. */
  hand: number;
  /** Squares captured so far in this move (flash). */
  captured: number[];
  /** Captures not yet shown (this move's remaining + queued moves), so piles count up as they land. */
  pending: Record<string, { dan: number; quan: number }>;
  player: string;
}

const STEP_MS = 180;
/** Long relays are sped up so the replay never eats most of the next player's turn. */
const MAX_REPLAY_MS = 6500;
/** If more moves pile up than this (e.g. the tab was in the background), skip to the newest. */
const MAX_QUEUE = 2;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const capturesOf = (m: OQMove) => {
  let dan = 0;
  let quan = 0;
  for (const s of m.steps) {
    if (s.k !== "capture") continue;
    dan += s.dan;
    if (s.quan) quan += 1;
  }
  return { dan, quan };
};

/**
 * Replays each new `lastMove` from the board before it, one stone per ~180 ms, in order
 * (a move that arrives mid-replay waits its turn). The move already on the board when the
 * table opens is not replayed.
 */
export function useSowReplay(g: OQGameView | null): SowFrame | null {
  const move = g?.lastMove ?? null;
  const seq = move?.seq ?? null;
  // Every broadcast brings a new object; key the replay on the move's seq only.
  const moveRef = useRef(move);
  moveRef.current = move;
  const initial = useRef<number | null>(seq);
  const queue = useRef<OQMove[]>([]);
  const running = useRef<{ timers: ReturnType<typeof setTimeout>[] } | null>(null);
  const [frame, setFrame] = useState<SowFrame | null>(null);

  const playNext = useRef<() => void>(() => {});
  playNext.current = () => {
    const next = queue.current.shift();
    if (!next) {
      running.current = null;
      setFrame(null);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    running.current = { timers };
    const delay = Math.max(55, Math.min(STEP_MS, MAX_REPLAY_MS / Math.max(1, next.steps.length)));
    replay(next, delay, queue.current, setFrame, timers, () => playNext.current());
  };

  useEffect(() => {
    const m = moveRef.current;
    if (!m || m.seq === initial.current || prefersReducedMotion()) return;
    if (queue.current.some((q) => q.seq === m.seq)) return;
    queue.current.push(m);
    if (queue.current.length > MAX_QUEUE) queue.current = queue.current.slice(-1);
    if (!running.current) playNext.current();
  }, [seq]);

  useEffect(
    () => () => {
      running.current?.timers.forEach(clearTimeout);
      running.current = null;
      queue.current = [];
    },
    [],
  );

  return frame;
}

function replay(
  move: OQMove,
  delay: number,
  queued: OQMove[],
  setFrame: (f: SowFrame | null) => void,
  timers: ReturnType<typeof setTimeout>[],
  done: () => void,
) {
  const pending: SowFrame["pending"] = {};
  for (const m of [move, ...queued]) {
    const c = capturesOf(m);
    const p = (pending[m.player] ??= { dan: 0, quan: 0 });
    p.dan += c.dan;
    p.quan += c.quan;
  }
  const f: SowFrame = {
    seq: move.seq,
    dan: move.before.dan.slice(),
    quan: move.before.quan.slice(),
    cell: move.cell,
    hand: 0,
    captured: [],
    pending,
    player: move.player,
  };
  const emit = () => setFrame({ ...f, dan: f.dan.slice(), quan: f.quan.slice(), pending: JSON.parse(JSON.stringify(f.pending)) });
  emit();
  move.steps.forEach((s, i) => {
    timers.push(
      setTimeout(() => {
        if (s.k === "pick") {
          f.hand = s.n;
          f.dan[s.cell] = 0;
          f.cell = s.cell;
        } else if (s.k === "sow") {
          f.hand = Math.max(0, f.hand - 1);
          f.dan[s.cell] += 1;
          f.cell = s.cell;
        } else {
          f.dan[s.cell] = 0;
          if (s.quan) f.quan[s.cell === 0 ? 0 : 1] = false;
          f.cell = s.cell;
          f.captured = [...f.captured, s.cell];
          f.pending[move.player].dan -= s.dan;
          if (s.quan) f.pending[move.player].quan -= 1;
        }
        emit();
      }, delay * (i + 1)),
    );
  });
  // Hold the last frame a moment, then the next queued move (or the real board).
  timers.push(setTimeout(done, delay * (move.steps.length + 1) + 350));
}

// ─── Board ───────────────────────────────────────────────────────────

/** Squares in screen order for whoever sits at the bottom (side 0 or 1). */
export function layoutFor(bottomSide: 0 | 1) {
  const bottom = ROWS[bottomSide].slice();
  const top = ROWS[1 - bottomSide].slice().reverse();
  return { top, bottom, left: bottomSide === 0 ? 0 : 6, right: bottomSide === 0 ? 6 : 0 };
}

export function OQBoard({
  dan,
  quan,
  bottomSide,
  selectable,
  selected,
  onSelect,
  onSow,
  frame,
  lastCell,
}: {
  dan: number[];
  quan: boolean[];
  /** Side shown on the bottom row (yours; side 0 for spectators). */
  bottomSide: 0 | 1;
  /** Squares you may pick right now. */
  selectable: number[];
  selected: number | null;
  onSelect: (cell: number | null) => void;
  /** Sow the selected square: −1 = left, +1 = right (as seen on screen). */
  onSow: (dir: 1 | -1) => void;
  frame: SowFrame | null;
  /** Square the last move started from (subtle marker). */
  lastCell: number | null;
}) {
  const { top, bottom, left, right } = layoutFor(bottomSide);
  const cup = (cell: number, row: "top" | "bottom") => (
    <Cup
      key={cell}
      cell={cell}
      count={dan[cell]}
      mine={row === "bottom"}
      selectable={selectable.includes(cell)}
      selected={selected === cell}
      active={frame?.cell === cell}
      flash={!!frame?.captured.includes(cell)}
      hand={frame?.cell === cell ? frame.hand : 0}
      started={!frame && lastCell === cell}
      onClick={() => onSelect(selected === cell ? null : cell)}
      onSow={onSow}
    />
  );
  return (
    <div
      className="relative grid w-full select-none grid-cols-[1.35fr_repeat(5,minmax(0,1fr))_1.35fr] grid-rows-2 gap-[1.2%] rounded-[1.6rem] p-[2.2%] shadow-[0_18px_40px_rgba(0,0,0,0.55),inset_0_2px_0_rgba(255,220,160,0.25),inset_0_-6px_14px_rgba(0,0,0,0.45)] sm:rounded-[2.4rem]"
      style={{
        background:
          "repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 9px), repeating-linear-gradient(88deg, rgba(255,230,180,0.05) 0 1px, transparent 1px 23px), linear-gradient(180deg, #a8682f 0%, #8a5023 45%, #6e3c18 100%)",
      }}
    >
      <QuanCup cell={left} side="left" count={dan[left]} hasQuan={quan[left === 0 ? 0 : 1]} active={frame?.cell === left} flash={!!frame?.captured.includes(left)} hand={frame?.cell === left ? frame.hand : 0} />
      {top.map((c) => cup(c, "top"))}
      <QuanCup cell={right} side="right" count={dan[right]} hasQuan={quan[right === 0 ? 0 : 1]} active={frame?.cell === right} flash={!!frame?.captured.includes(right)} hand={frame?.cell === right ? frame.hand : 0} />
      {bottom.map((c) => cup(c, "bottom"))}
      {/* Divider groove between the two rows. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-[16%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/25 shadow-[0_1px_0_rgba(255,220,160,0.18)]" />
    </div>
  );
}

const STONE_TONES = ["#d9d2c3", "#bfb6a5", "#8f8a80", "#e7dcc8", "#a49a8a", "#cfc3ad", "#7d776f"];

/** Up to `max` pebbles scattered in a cup (deterministic, golden-angle spiral). */
function Pebbles({ n, max = 16, spread = 34, size = 19 }: { n: number; max?: number; spread?: number; size?: number }) {
  const shown = Math.min(n, max);
  return (
    <>
      {Array.from({ length: shown }, (_, i) => {
        const r = shown === 1 ? 0 : spread * Math.sqrt((i + 0.5) / shown);
        const a = i * 2.39996 + 0.7;
        return (
          <span
            key={i}
            aria-hidden
            className="absolute rounded-[45%] shadow-[0_1px_1.5px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(0,0,0,0.35),inset_1px_1px_1.5px_rgba(255,255,255,0.55)]"
            style={{
              width: `${size}%`,
              height: `${size * 0.82}%`,
              left: `${50 + r * Math.cos(a) - size / 2}%`,
              top: `${50 + r * Math.sin(a) - (size * 0.82) / 2}%`,
              background: STONE_TONES[(i * 3) % STONE_TONES.length],
              transform: `rotate(${(i * 47) % 180}deg)`,
            }}
          />
        );
      })}
    </>
  );
}

function CountBadge({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 min-w-[1.35em] rounded-full bg-black/70 px-1 text-center font-mono text-[clamp(10px,2.6vw,15px)] font-black leading-[1.35em] text-amber-100 ring-1 ring-amber-200/30",
        n === 0 && "opacity-40",
        className,
      )}
    >
      {n}
    </span>
  );
}

function HandBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-300 px-1.5 text-[11px] font-black text-black shadow-lg">
      ✋{n}
    </span>
  );
}

function Cup({
  cell,
  count,
  mine,
  selectable,
  selected,
  active,
  flash,
  hand,
  started,
  onClick,
  onSow,
}: {
  cell: number;
  count: number;
  mine: boolean;
  selectable: boolean;
  selected: boolean;
  active: boolean;
  flash: boolean;
  hand: number;
  started: boolean;
  onClick: () => void;
  onSow: (dir: 1 | -1) => void;
}) {
  return (
    <div className="relative aspect-square">
      <button
        type="button"
        disabled={!selectable}
        onClick={onClick}
        aria-label={`Ô ${cell}: ${count} dân${selectable ? " — bấm để chọn" : ""}`}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[30%] transition-[box-shadow,transform] duration-150",
          "shadow-[inset_0_6px_12px_rgba(0,0,0,0.65),inset_0_-2px_4px_rgba(255,210,150,0.18),0_1px_0_rgba(255,220,160,0.25)]",
          mine ? "bg-[radial-gradient(circle_at_50%_40%,#5a3417,#3a1f0b_75%)]" : "bg-[radial-gradient(circle_at_50%_40%,#4d2c13,#2f1808_75%)]",
          selectable && !selected && "cursor-pointer ring-2 ring-amber-300/60 hover:ring-amber-200 motion-safe:hover:-translate-y-0.5",
          selected && "ring-[3px] ring-amber-300",
          active && "ring-[3px] ring-sky-300",
          flash && "ring-[3px] ring-emerald-300 bg-emerald-900/60",
          started && "ring-1 ring-amber-100/40",
        )}
      >
        <Pebbles n={count} />
      </button>
      <CountBadge n={count} className="bottom-[3%] right-[3%]" />
      <HandBadge n={hand} />
      {selected && (
        <div className="absolute inset-0 z-20 flex overflow-hidden rounded-[30%] ring-[3px] ring-amber-300">
          <button
            type="button"
            onClick={() => onSow(-1)}
            className="flex flex-1 items-center justify-center bg-black/55 text-lg font-black text-amber-200 hover:bg-amber-500/50 active:bg-amber-500/70"
            aria-label="Rải sang trái"
          >
            ◀
          </button>
          <span className="w-px bg-amber-200/40" />
          <button
            type="button"
            onClick={() => onSow(1)}
            className="flex flex-1 items-center justify-center bg-black/55 text-lg font-black text-amber-200 hover:bg-amber-500/50 active:bg-amber-500/70"
            aria-label="Rải sang phải"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

function QuanCup({
  cell,
  side,
  count,
  hasQuan,
  active,
  flash,
  hand,
}: {
  cell: number;
  side: "left" | "right";
  count: number;
  hasQuan: boolean;
  active: boolean;
  flash: boolean;
  hand: number;
}) {
  return (
    <div className="relative row-span-2" aria-label={`Ô quan ${cell}: ${hasQuan ? "còn quan, " : ""}${count} dân`}>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden shadow-[inset_0_8px_16px_rgba(0,0,0,0.7),inset_0_-2px_5px_rgba(255,210,150,0.18),0_1px_0_rgba(255,220,160,0.25)] transition-[box-shadow]",
          side === "left" ? "rounded-l-[999px] rounded-r-[22%]" : "rounded-r-[999px] rounded-l-[22%]",
          "bg-[radial-gradient(ellipse_at_50%_45%,#4f2d12,#2a1506_78%)]",
          active && "ring-[3px] ring-sky-300",
          flash && "ring-[3px] ring-emerald-300 bg-emerald-900/60",
        )}
      >
        {hasQuan && (
          <span
            aria-hidden
            className="absolute left-1/2 top-[26%] h-[30%] w-[66%] -translate-x-1/2 rounded-[48%_52%_45%_55%] shadow-[0_3px_5px_rgba(0,0,0,0.7),inset_-3px_-4px_7px_rgba(0,0,0,0.45),inset_3px_3px_5px_rgba(255,255,255,0.45)]"
            style={{ background: "radial-gradient(circle at 35% 30%, #f3e3b4, #b8955a 55%, #7a5a2c)" }}
          />
        )}
        <div className={cn("absolute inset-x-[8%]", hasQuan ? "bottom-[6%] top-[52%]" : "inset-y-[16%]")}>
          <Pebbles n={count} max={14} spread={30} size={hasQuan ? 26 : 22} />
        </div>
      </div>
      {hasQuan && (
        <span className="pointer-events-none absolute left-1/2 top-[6%] z-10 -translate-x-1/2 rounded-full bg-amber-400/90 px-1.5 text-[10px] font-black uppercase tracking-wide text-black">
          Quan
        </span>
      )}
      <CountBadge n={count} className={cn("bottom-[4%]", side === "left" ? "left-[30%]" : "right-[30%]")} />
      <HandBadge n={hand} />
    </div>
  );
}
