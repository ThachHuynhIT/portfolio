"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBox } from "@/components/games/ChatBox";
import { useGameRoom } from "@/components/games/gameClient";
import { EmojiBar, SeatBubble, SpectatorReactions, useLiveReactions } from "@/components/tienlen/Effects";
import { DeltaBadge, ScoreboardModal, signed } from "@/components/tienlen/Scoreboard";
import {
  AIR_RENT,
  BOARD,
  GROUP_COLORS,
  type Group,
  JAIL_FINE,
  MAX_HOUSES,
  type Ownable,
  START_CASH_OPTIONS,
  type Square,
  TIME_LIMIT_OPTIONS,
  UTIL_MULT,
  groupPositions,
  isOwnable,
  mortgageValue,
  unmortgageCost,
} from "@/lib/typhu/board";
import { SettingsTabs } from "@/components/games/SettingsTabs";
import { RankPointsPicker } from "@/components/games/RankPointsPicker";
import { STEP_SECONDS_OPTIONS, TYPHU_WS_PATH, type TPGameView, type TPPlayerView, type TPRoomView, type TPSeatView, type TradeSide } from "@/lib/typhu/protocol";
import type { Reaction } from "@/lib/tienlen";
import { cn } from "@/lib/utils";

const SCORE_NOTE =
  "Điểm theo thứ hạng: người còn trụ lại (hoặc giàu nhất khi hết giờ) Nhất, ai phá sản trước xếp sau. Chủ bàn chọn điểm Nhất / Nhì, các hạng cuối trừ tương ứng, tổng mỗi ván luôn bằng 0.";

export const TOKENS = [
  { emoji: "🛵", color: "#ef4444" },
  { emoji: "🐃", color: "#3b82f6" },
  { emoji: "🚲", color: "#22c55e" },
  { emoji: "🚤", color: "#eab308" },
  { emoji: "🐉", color: "#a855f7" },
  { emoji: "🎩", color: "#f97316" },
];

const SQUARE_ICON: Partial<Record<Square["kind"], string>> = {
  go: "🏁",
  air: "✈️",
  chance: "❓",
  chest: "🎁",
  tax: "💸",
  jail: "🚔",
  parking: "☕",
  gotojail: "👮",
};

export const money = (n: number) => `${n.toLocaleString("vi-VN")}tr`;

type Act = (msg: Record<string, unknown> & { type: string }) => Promise<boolean>;

/** Shift server-clock deadlines onto the local clock. */
function localize(view: TPRoomView): TPRoomView {
  const g = view.current;
  if (!g) return view;
  const skew = Date.now() - view.serverTime;
  const shift = (t: number | null) => (t ? t + skew : t);
  return {
    ...view,
    current: {
      ...g,
      deadline: shift(g.deadline),
      endsAt: shift(g.endsAt),
      trade: g.trade ? { ...g.trade, deadline: g.trade.deadline + skew } : null,
    },
  };
}

function useNow(active: boolean, every = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}

/** Grid cell (1-based row/col) of a board position on the 11×11 board, Khởi hành bottom-right. */
const BOARD_SIZE = 40;
const GO_TO_JAIL_POS = 30;

/**
 * The squares a token visits between two positions: forward one square at a time, or a few
 * squares back for "lùi 3 ô" cards. Entering jail walks to the Vào tù square first when the
 * dice put the player there, then jumps to the jail.
 */
function walkPath(from: number, to: number, enteredJail: boolean, dice: [number, number] | null): number[] {
  const forward = (a: number, b: number) => {
    const steps: number[] = [];
    for (let p = a; p !== b; ) steps.push((p = (p + 1) % BOARD_SIZE));
    return steps;
  };
  if (enteredJail) {
    const landed = dice ? (from + dice[0] + dice[1]) % BOARD_SIZE : -1;
    return landed === GO_TO_JAIL_POS ? [...forward(from, GO_TO_JAIL_POS), to] : [to];
  }
  const ahead = (to - from + BOARD_SIZE) % BOARD_SIZE;
  if (BOARD_SIZE - ahead <= 3) return Array.from({ length: BOARD_SIZE - ahead }, (_, i) => (from - i - 1 + BOARD_SIZE) % BOARD_SIZE);
  return forward(from, to);
}

/**
 * Where each token is drawn. The server jumps a player straight to their new square; here the
 * token walks there square by square (faster for long card moves) so everyone can follow it.
 */
function useWalkingTokens(g: TPGameView | null) {
  const players = g?.players ?? [];
  const [shown, setShown] = useState<Record<string, number>>(() => Object.fromEntries(players.map((p) => [p.id, p.pos])));
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const jailRef = useRef<Record<string, number>>(Object.fromEntries(players.map((p) => [p.id, p.jail])));
  const dice = g?.dice ?? null;
  const key = players.map((p) => `${p.id}:${p.pos}:${p.jail}`).join("|");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // A new game puts everyone back on Khởi hành: no walk.
    const reset = players.length > 0 && players.every((p) => p.pos === 0) && players.some((p) => (shownRef.current[p.id] ?? 0) !== 0);
    for (const p of players) {
      const from = shownRef.current[p.id];
      const wasJailed = (jailRef.current[p.id] ?? 0) > 0;
      jailRef.current[p.id] = p.jail;
      if (from === p.pos) continue;
      if (from === undefined || reset) {
        setShown((m) => ({ ...m, [p.id]: p.pos }));
        continue;
      }
      const path = walkPath(from, p.pos, !wasJailed && p.jail > 0, dice);
      const step = Math.max(60, Math.min(220, 2600 / path.length));
      path.forEach((pos, i) => timers.push(setTimeout(() => setShown((m) => ({ ...m, [p.id]: pos })), step * (i + 1))));
    }
    return () => timers.forEach(clearTimeout);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (id: string, fallback: number) => shown[id] ?? fallback;
}

function cellOf(i: number): { row: number; col: number; side: "bottom" | "left" | "top" | "right" | "corner" } {
  if (i % 10 === 0) {
    const corners = [
      { row: 11, col: 11 },
      { row: 11, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 11 },
    ];
    return { ...corners[i / 10], side: "corner" };
  }
  if (i < 10) return { row: 11, col: 11 - i, side: "bottom" };
  if (i < 20) return { row: 11 - (i - 10), col: 1, side: "left" };
  if (i < 30) return { row: 1, col: 1 + (i - 20), side: "top" };
  return { row: 1 + (i - 30), col: 11, side: "right" };
}

export default function TyPhuTable({ code, name, watch }: { code: string; name: string; watch?: boolean }) {
  const { view, status, error, call } = useGameRoom<TPRoomView>(TYPHU_WS_PATH, code, name, watch ? "watch" : "play", localize);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const act = useCallback<Act>(
    async (msg) => {
      const res = await call(msg);
      if (!res.ok) setToast(res.error);
      return res.ok;
    },
    [call],
  );

  if (status === "error") {
    const full = error?.includes("đủ");
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-rose-300">{error}</p>
        <div className="mt-4 flex gap-2">
          {full && (
            <Link href={`/co-ty-phu/${code}?watch=1`} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
              Vào xem 👀
            </Link>
          )}
          <Link href="/co-ty-phu" className="rounded-lg border border-white/25 px-4 py-2 font-semibold">
            Về sảnh
          </Link>
        </div>
      </div>
    );
  }
  if (!view) {
    return <p className="flex min-h-[70vh] animate-pulse items-center justify-center text-sky-100/80">Đang kết nối bàn {code}…</p>;
  }
  return (
    <>
      <Table view={view} reconnecting={status === "reconnecting"} act={act} toast={toast} />
      <ChatBox messages={view.chat} meId={view.meId} myName={name} onSend={(text) => act({ type: "chat", text })} />
    </>
  );
}

function Table({ view, reconnecting, act, toast }: { view: TPRoomView; reconnecting: boolean; act: Act; toast: string | null }) {
  const g = view.current;
  const playing = g?.status === "playing";
  const spectator = view.role === "spectator";
  const me = view.seats.find((s) => s?.id === view.meId) ?? null;
  const mine = g?.players.find((p) => p.id === view.meId) ?? null;
  const myTurn = !!mine && playing && !mine.bankrupt && g?.turn === view.meId;
  const now = useNow(!!playing);

  const seatOf = (id: string) => view.seats.find((s) => s?.id === id) ?? null;
  const nameOf = (id: string) =>
    seatOf(id)?.name ?? view.history.flatMap((h) => h.results).find((r) => r.id === id)?.name ?? "?";
  const tokenOf = (id: string) => TOKENS[(seatOf(id)?.color ?? g?.players.findIndex((p) => p.id === id) ?? 0) % TOKENS.length];

  const shownPos = useWalkingTokens(g);
  const [openSquare, setOpenSquare] = useState<number | null>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (msg: Record<string, unknown> & { type: string }) => {
    setBusy(true);
    const ok = await act(msg);
    setBusy(false);
    return ok;
  };

  // Card reveal overlay whenever a new Cơ hội / Khí vận card is drawn.
  const [cardFx, setCardFx] = useState<TPGameView["lastCard"]>(null);
  // Start from the card already on the table when the page opens, so only new draws pop up.
  const lastCardAt = useRef(g?.lastCard?.at ?? 0);
  const drawnAt = g?.lastCard?.at;
  useEffect(() => {
    const c = g?.lastCard;
    if (!c || c.at === lastCardAt.current) return;
    lastCardAt.current = c.at;
    setCardFx(c);
  }, [drawnAt]); // eslint-disable-line react-hooks/exhaustive-deps
  // Auto-hide on its own timer, so later state updates don't cancel it.
  useEffect(() => {
    if (!cardFx) return;
    const t = setTimeout(() => setCardFx(null), 3500);
    return () => clearTimeout(t);
  }, [cardFx]);

  // "Just built" banner, driven by the 🏠 lines in the log.
  const [buildFx, setBuildFx] = useState<{ id: number; text: string; hotel: boolean } | null>(null);
  const lastBuildId = useRef(g?.log.filter((e) => e.text.startsWith("🏠")).at(-1)?.id ?? 0);
  const latestBuild = g?.log.filter((e) => e.text.startsWith("🏠")).at(-1);
  useEffect(() => {
    if (!latestBuild || latestBuild.id <= lastBuildId.current) return;
    lastBuildId.current = latestBuild.id;
    setBuildFx({ id: latestBuild.id, text: latestBuild.text.replace(/^🏠\s*/, ""), hotel: latestBuild.text.includes("khách sạn") });
  }, [latestBuild?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!buildFx) return;
    const t = setTimeout(() => setBuildFx(null), 2200);
    return () => clearTimeout(t);
  }, [buildFx]);

  const live = useLiveReactions(view.reactions);
  const reactionsFor = (id: string): Reaction[] => live.filter((r) => r.playerId === id);

  const kick = async (s: TPSeatView) => {
    if (!window.confirm(playing && s.inGame ? `Kích ${s.name}? Họ sẽ bị tính phá sản.` : `Kích ${s.name} khỏi bàn?`)) return;
    await act({ type: "kick", playerId: s.id });
  };

  const [copied, setCopied] = useState(false);
  const copyInvite = async () => {
    const url = new URL(`/co-ty-phu/${view.code}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Chép link mời:", url);
    }
  };

  const secondsLeft = (t: number | null | undefined) => (t ? Math.max(0, Math.ceil((t - now) / 1000)) : null);
  const incomingTrade = g?.trade && g.trade.to === view.meId ? g.trade : null;
  const outgoingTrade = g?.trade && g.trade.from === view.meId ? g.trade : null;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col gap-3 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 short:gap-2 short:pt-1.5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/co-ty-phu" className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 hover:bg-black/60">
            ← Sảnh
          </Link>
          <span className="rounded-md bg-black/30 px-2 py-1 font-mono text-base font-bold tracking-[0.2em] text-amber-300">{view.code}</span>
          <button onClick={copyInvite} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Chép link mời">
            {copied ? "✓" : "🔗"}
            <span className="hidden sm:inline short:hidden"> {copied ? "Đã chép link" : "Chép link mời"}</span>
          </button>
          <button onClick={() => setShowScores(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Bảng điểm">
            🏆<span className="hidden sm:inline short:hidden"> Bảng điểm</span>
          </button>
          <button onClick={() => setShowRules(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Luật chơi">
            📖<span className="hidden sm:inline short:hidden"> Luật chơi</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-sky-100/70">
          {g?.endsAt && playing && <span title="Hết giờ thì người giàu nhất thắng">⏰ {formatClock(g.endsAt - now)}</span>}
          {view.spectators.length > 0 && <span title={view.spectators.join(", ")}>👀 {view.spectators.length}</span>}
          {reconnecting && <span className="animate-pulse text-amber-300">Đang kết nối lại…</span>}
        </div>
      </div>

      {spectator && (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-black/30 px-3 py-2 text-sm text-sky-100/80">
          <span>👀 Bạn đang xem với tư cách khán giả</span>
          {view.seats.some((s) => s === null) && !playing && (
            <Link href={`/co-ty-phu/${view.code}`} className="rounded-md bg-amber-400 px-3 py-1 font-semibold text-black">
              Vào chơi
            </Link>
          )}
        </div>
      )}

      {/* Sideways phone: board as tall as the screen allows on the left, the side panel scrolling on the right. */}
      <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] short:grid-cols-[auto_minmax(0,1fr)] short:items-start short:gap-2">
        {/* Board */}
        <div className="relative mx-auto w-full max-w-[min(100%,calc(100dvh-7rem))] short:w-[calc(100dvh-3.75rem)] short:max-w-none">
          <SpectatorReactions reactions={live.filter((r) => !r.playerId)} />
          <div
            className="grid aspect-square w-full gap-[2px] rounded-xl border-4 border-[#1e3a2f] bg-[#1e3a2f] shadow-2xl"
            style={{ gridTemplateColumns: "1.6fr repeat(9, 1fr) 1.6fr", gridTemplateRows: "1.6fr repeat(9, 1fr) 1.6fr" }}
          >
            {BOARD.map((sq, i) => (
              <Cell
                key={i}
                index={i}
                sq={sq}
                game={g}
                tokenOf={tokenOf}
                shownPos={shownPos}
                highlight={g?.players.some((p) => p.id === g.turn && shownPos(p.id, p.pos) === i) ?? false}
                onClick={() => setOpenSquare(i)}
              />
            ))}
            {/* Centre */}
            <div className="relative flex flex-col items-center justify-center-safe gap-2 overflow-hidden bg-[radial-gradient(ellipse_at_center,#d9f2e3_0%,#a7d7b8_100%)] p-2 text-emerald-950 sm:p-4 short:gap-1 short:overflow-y-auto short:p-1.5" style={{ gridColumn: "2 / 11", gridRow: "2 / 11" }}>
              <CardOverlay card={cardFx} nameOf={nameOf} onClose={() => setCardFx(null)} />
              <BuildOverlay fx={buildFx} />
              {!g || g.status === "ended" ? (
                <Waiting view={view} me={me} act={act} nameOf={nameOf} />
              ) : (
                <Centre
                  g={g}
                  view={view}
                  myTurn={myTurn}
                  mine={mine}
                  busy={busy}
                  run={run}
                  nameOf={nameOf}
                  secondsLeft={secondsLeft}
                />
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-3 short:max-h-[calc(100dvh-3.75rem)] short:gap-2 short:overflow-y-auto">
          <div className="rounded-2xl bg-black/35 p-3 short:p-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-100/60">Người chơi</p>
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {view.seats
                .filter((s): s is TPSeatView => !!s)
                .map((s) => {
                  const p = g?.players.find((x) => x.id === s.id);
                  return (
                    <PlayerRow
                      key={s.id}
                      seat={s}
                      p={p ?? null}
                      g={g}
                      self={s.id === view.meId}
                      token={TOKENS[s.color % TOKENS.length]}
                      isTurn={g?.turn === s.id && playing}
                      reactions={reactionsFor(s.id)}
                      onOpen={setOpenSquare}
                      onKick={me?.isHost && !s.connected && !s.kicked ? () => void kick(s) : undefined}
                    />
                  );
                })}
            </ul>
            {playing && mine && !mine.bankrupt && (
              <button
                onClick={() => setShowTrade(true)}
                disabled={!!g?.trade}
                className="mt-3 w-full rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/20 disabled:opacity-40"
              >
                🤝 Đổi đất / mua bán
              </button>
            )}
          </div>

          {g?.trade && (
            <TradeCard
              trade={g.trade}
              nameOf={nameOf}
              incoming={!!incomingTrade}
              outgoing={!!outgoingTrade}
              seconds={secondsLeft(g.trade.deadline) ?? 0}
              onAnswer={(accept) => void run({ type: "tradeanswer", accept })}
            />
          )}

          {g && (
            <div className="rounded-2xl bg-black/35 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-100/60">Diễn biến</p>
              <ul className="flex max-h-64 flex-col-reverse gap-1 overflow-y-auto text-xs">
                {g.log
                  .slice()
                  .reverse()
                  .map((e) => (
                    <li
                      key={e.id}
                      className={cn(
                        "rounded px-2 py-1",
                        e.tone === "bad" && "bg-rose-500/15 text-rose-100",
                        e.tone === "money" && "bg-emerald-500/15 text-emerald-100",
                        e.tone === "buy" && "bg-sky-500/15 text-sky-100",
                        e.tone === "jail" && "bg-zinc-500/25",
                        e.tone === "card" && "bg-amber-500/15 text-amber-100",
                        (!e.tone || e.tone === "info") && "text-white/75",
                      )}
                    >
                      {e.text}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <EmojiBar onSend={(emoji) => void act({ type: "emoji", emoji })} />
        </aside>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {openSquare !== null && (
        <SquareModal
          pos={openSquare}
          g={g}
          meId={view.meId}
          myTurn={myTurn}
          nameOf={nameOf}
          run={run}
          busy={busy}
          onClose={() => setOpenSquare(null)}
        />
      )}
      {showTrade && g && <TradeModal g={g} meId={view.meId} nameOf={nameOf} run={run} onClose={() => setShowTrade(false)} />}
      {showScores && <ScoreboardModal view={view} onClose={() => setShowScores(false)} note={SCORE_NOTE} />}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}

const formatClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ─── Board cells ────────────────────────────────────────────────────

/** A little house (green) or hotel (red) drawn in SVG so it stays crisp at any board size. */
function Building({ hotel, className }: { hotel?: boolean; className?: string }) {
  return hotel ? (
    <svg viewBox="0 0 20 12" className={className} aria-hidden>
      <path d="M1 4 L10 0.8 L19 4 V11.5 H1 Z" fill="#dc2626" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      <rect x="4" y="6" width="3" height="3" fill="#fde68a" />
      <rect x="8.5" y="6" width="3" height="5.5" fill="#fde68a" />
      <rect x="13" y="6" width="3" height="3" fill="#fde68a" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <path d="M6 0.8 L11.3 5.6 H9.8 V11.4 H2.2 V5.6 H0.7 Z" fill="#16a34a" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      <rect x="5" y="7.6" width="2" height="3.8" fill="#fef3c7" />
    </svg>
  );
}

/** Houses on a colour band; the newest one pops in when built. */
function Buildings({ count, vertical }: { count: number; vertical: boolean }) {
  // Only buildings added after the page opened get the pop-in.
  const initialCount = useRef(count);
  if (count <= 0) return null;
  const hotel = count === MAX_HOUSES;
  return (
    <span className={cn("flex h-full w-full items-center justify-center gap-[1px] p-[1px]", vertical && "flex-col")}>
      {(hotel ? [0] : Array.from({ length: count }, (_, i) => i)).map((i) => (
        <motion.span
          key={`${hotel ? "hotel" : "house"}-${i}`}
          initial={i < initialCount.current && (!hotel || initialCount.current === MAX_HOUSES) ? false : { scale: 0, y: -8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 14 }}
          className={cn("flex items-center justify-center drop-shadow", vertical ? "w-full" : "h-full", hotel ? (vertical ? "h-[70%]" : "w-[70%]") : vertical ? "h-[30%]" : "w-[30%]")}
        >
          <Building hotel={hotel} className="h-full w-full" />
        </motion.span>
      ))}
    </span>
  );
}

function Cell({
  index,
  sq,
  game,
  tokenOf,
  shownPos,
  highlight,
  onClick,
}: {
  index: number;
  sq: Square;
  game: TPGameView | null;
  tokenOf: (id: string) => { emoji: string; color: string };
  shownPos: (id: string, fallback: number) => number;
  highlight: boolean;
  onClick: () => void;
}) {
  const { row, col, side } = cellOf(index);
  const deed = game?.deeds[index];
  const here = game?.players.filter((p) => !p.bankrupt && shownPos(p.id, p.pos) === index) ?? [];
  const band = sq.kind === "prop" ? GROUP_COLORS[sq.group] : null;
  const owner = deed ? tokenOf(deed.owner) : null;
  const bandSide = side === "bottom" ? "top" : side === "top" ? "bottom" : side === "left" ? "right" : side === "right" ? "left" : null;
  const houses = deed?.houses ?? 0;
  // Owners already there when the page opened don't replay the badge animation.
  const initialOwner = useRef(deed?.owner);
  // Owner badge sits on the outer edge, away from the colour band.
  const badgePos =
    side === "bottom" ? "bottom-[1px] right-[1px]" : side === "top" ? "top-[1px] left-[1px]" : side === "left" ? "left-[1px] top-[1px]" : "right-[1px] bottom-[1px]";

  return (
    <button
      onClick={onClick}
      style={{
        gridRow: row,
        gridColumn: col,
        // Tint in the owner's colour, layered over the cream card colour.
        backgroundImage: owner ? `linear-gradient(135deg, ${owner.color}66, ${owner.color}26 65%, transparent)` : undefined,
        boxShadow: owner ? `inset 0 0 0 3px ${owner.color}` : undefined,
      }}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden bg-[#f4efe1] p-[1px] text-center leading-tight text-emerald-950 transition-colors hover:brightness-105",
        side === "corner" && "bg-[#e6f4ea]",
        highlight && "ring-2 ring-inset ring-amber-400",
        deed?.mortgaged && "opacity-60 grayscale-[40%]",
      )}
      title={deed ? `${sq.name} — chủ ${owner?.emoji}` : sq.name}
    >
      {band && bandSide && (
        <span
          className={cn(
            "absolute",
            bandSide === "top" && "inset-x-0 top-0",
            bandSide === "bottom" && "inset-x-0 bottom-0",
            bandSide === "left" && "inset-y-0 left-0",
            bandSide === "right" && "inset-y-0 right-0",
            bandSide === "top" || bandSide === "bottom" ? (houses ? "h-[40%]" : "h-[22%]") : houses ? "w-[40%]" : "w-[22%]",
          )}
          style={{ background: band }}
        >
          <Buildings count={houses} vertical={bandSide === "left" || bandSide === "right"} />
        </span>
      )}
      <span className="pointer-events-none flex flex-col items-center px-[2px]">
        {SQUARE_ICON[sq.kind] && <span className={cn(side === "corner" ? "text-base sm:text-2xl" : "text-[10px] sm:text-sm")}>{SQUARE_ICON[sq.kind]}</span>}
        {sq.kind === "util" && <span className="text-[10px] sm:text-sm">{sq.name.includes("Điện") ? "💡" : "🚰"}</span>}
        <span className={cn("line-clamp-2 font-semibold", side === "corner" ? "text-[8px] sm:text-xs" : "text-[6px] sm:text-[9px] xl:text-[10px]")}>
          {sq.kind === "air" ? sq.name.replace("Sân bay ", "SB ") : sq.name}
        </span>
        {isOwnable(sq) && !deed && <span className="hidden text-[8px] text-emerald-900/70 sm:block">{money(sq.price)}</span>}
        {deed?.mortgaged && <span className="text-[6px] font-bold text-rose-700 sm:text-[8px]">THẾ CHẤP</span>}
        {sq.kind === "parking" && !!game?.pot && (
          <span className="rounded bg-amber-300 px-1 text-[7px] font-bold text-amber-950 sm:text-[10px]">💰 {money(game.pot)}</span>
        )}
      </span>
      {owner && deed && (
        <motion.span
          key={deed.owner}
          initial={deed.owner === initialOwner.current ? false : { scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={cn(
            "pointer-events-none absolute flex aspect-square h-[30%] min-h-[10px] items-center justify-center rounded-full border border-white text-[6px] shadow sm:text-[10px]",
            badgePos,
          )}
          style={{ background: owner.color }}
        >
          {owner.emoji}
        </motion.span>
      )}
      {here.length > 0 && (
        <span className="absolute inset-0 flex flex-wrap items-center justify-center gap-[1px] p-[2px]">
          {here.map((p) => (
            <motion.span
              key={p.id}
              layoutId={`token-${p.id}`}
              // Short tween per square: the walk itself is the square-by-square steps.
              transition={{ layout: { type: "tween", ease: "easeOut", duration: 0.16 } }}
              className={cn(
                "flex h-[42%] min-h-[12px] w-auto aspect-square items-center justify-center rounded-full border border-white text-[8px] shadow-md sm:text-sm",
                game?.turn === p.id && "ring-2 ring-amber-400",
              )}
              style={{ background: tokenOf(p.id).color }}
            >
              {tokenOf(p.id).emoji}
            </motion.span>
          ))}
        </span>
      )}
    </button>
  );
}

// ─── Centre controls ────────────────────────────────────────────────

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Die({ value, rolling }: { value: number; rolling: number }) {
  return (
    <motion.div
      key={rolling}
      initial={{ rotate: -200, scale: 0.4, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className="grid h-10 w-10 grid-cols-3 grid-rows-3 gap-[2px] rounded-lg bg-white p-1.5 shadow-lg sm:h-14 sm:w-14 sm:p-2"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={cn("rounded-full", PIPS[value]?.includes(i) && "bg-emerald-950")} />
      ))}
    </motion.div>
  );
}

function Centre({
  g,
  view,
  myTurn,
  mine,
  busy,
  run,
  nameOf,
  secondsLeft,
}: {
  g: TPGameView;
  view: TPRoomView;
  myTurn: boolean;
  mine: TPPlayerView | null;
  busy: boolean;
  run: Act;
  nameOf: (id: string) => string;
  secondsLeft: (t: number | null | undefined) => number | null;
}) {
  const turnName = g.turn ? nameOf(g.turn) : "";
  const current = g.players.find((p) => p.id === g.turn);
  const here = current ? BOARD[current.pos] : null;
  const secs = secondsLeft(g.deadline);
  // Re-run the dice animation on every new roll (each roll writes a "🎲" log line).
  const rollId = [...g.log].reverse().find((e) => e.text.startsWith("🎲"))?.id ?? 0;
  const [showBuild, setShowBuild] = useState(false);
  const fullGroups = mine ? ownedFullGroups(g, mine.id) : [];
  const housesOwned = mine ? Object.values(g.deeds).filter((d) => d.owner === mine.id && d.houses > 0).length : 0;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
      <p className="hidden font-black tracking-tight text-emerald-900 sm:block sm:text-3xl">CỜ TỶ PHÚ</p>
      <div className="flex items-center gap-2">
        {g.dice ? (
          <>
            <Die value={g.dice[0]} rolling={rollId} />
            <Die value={g.dice[1]} rolling={rollId + 0.5} />
            <span className="ml-1 font-mono text-lg font-black text-emerald-900 sm:text-2xl">= {g.dice[0] + g.dice[1]}</span>
          </>
        ) : (
          <span className="text-3xl sm:text-5xl">🎲</span>
        )}
      </div>
      <p className="text-xs sm:text-sm">
        {myTurn ? <b>Lượt của bạn</b> : <>Lượt của <b>{turnName}</b></>}
        {secs !== null && <span className={cn("ml-2 font-mono", secs <= 8 && "text-rose-600")}>⏱ {secs}s</span>}
      </p>

      {myTurn && mine && (
        <div className="flex flex-wrap justify-center gap-2">
          {g.phase === "roll" && (
            <>
              <CBtn primary onClick={() => void run({ type: "roll" })} disabled={busy}>
                🎲 {g.rollAgain ? "Tung tiếp (đôi!)" : "Tung xúc xắc"}
              </CBtn>
              {mine.jail > 0 && (
                <>
                  <CBtn onClick={() => void run({ type: "payjail" })} disabled={busy || mine.cash < JAIL_FINE}>
                    Nộp {money(JAIL_FINE)} ra tù
                  </CBtn>
                  {mine.jailCards > 0 && (
                    <CBtn onClick={() => void run({ type: "jailcard" })} disabled={busy}>
                      🗝️ Dùng thẻ ra tù
                    </CBtn>
                  )}
                </>
              )}
            </>
          )}
          {g.phase === "buy" && here && isOwnable(here) && (
            <>
              <CBtn primary onClick={() => void run({ type: "buy" })} disabled={busy || mine.cash < here.price}>
                🏷️ Mua {here.name} · {money(here.price)}
              </CBtn>
              <CBtn onClick={() => void run({ type: "skip" })} disabled={busy}>
                Bỏ qua
              </CBtn>
              <BuyHint g={g} sq={here} meId={mine.id} />
            </>
          )}
          {g.phase === "end" && (
            <CBtn primary onClick={() => void run({ type: "end" })} disabled={busy}>
              Kết thúc lượt ➜
            </CBtn>
          )}
          {g.phase !== "debt" && (
            <CBtn build onClick={() => setShowBuild(true)} disabled={busy || !fullGroups.length} title={fullGroups.length ? undefined : "Cần sở hữu đủ cả một nhóm màu"}>
              🏠 Xây nhà{fullGroups.length ? ` (${fullGroups.length} nhóm)` : ""}
            </CBtn>
          )}
          {g.phase === "debt" && housesOwned > 0 && (
            <CBtn build onClick={() => setShowBuild(true)} disabled={busy}>
              🏚️ Bán nhà
            </CBtn>
          )}
          {g.phase === "debt" && g.debt && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-rose-100 p-2 text-rose-900">
              <p className="text-xs sm:text-sm">
                Bạn nợ <b>{money(g.debt.amount)}</b> ({g.debt.reason}), đang có {money(mine.cash)}. Bấm vào đất của mình để bán nhà hoặc thế chấp.
              </p>
              <div className="flex gap-2">
                <CBtn primary onClick={() => void run({ type: "paydebt" })} disabled={busy || mine.cash < g.debt.amount}>
                  Trả nợ
                </CBtn>
                <CBtn
                  danger
                  onClick={() => {
                    if (window.confirm("Tuyên bố phá sản? Bạn sẽ rời ván này.")) void run({ type: "bankrupt" });
                  }}
                  disabled={busy}
                >
                  Phá sản
                </CBtn>
              </div>
            </div>
          )}
        </div>
      )}
      {!myTurn && g.phase === "buy" && here && <p className="text-xs text-emerald-900/70">{turnName} đang cân nhắc mua {here.name}…</p>}
      {!myTurn && g.phase === "debt" && g.debt && (
        <p className="text-xs text-rose-700">
          {turnName} đang xoay {money(g.debt.amount)} để trả nợ…
        </p>
      )}
      {g.log.length > 0 && (
        <ul className="w-full space-y-0.5 text-[11px] text-emerald-950/80 lg:hidden">
          {g.log.slice(g.phase === "buy" && myTurn ? -1 : -2).map((e) => (
            <li key={e.id} className="truncate rounded bg-white/50 px-2 py-0.5">
              {e.text}
            </li>
          ))}
        </ul>
      )}
      {mine?.jail ? <p className="text-xs text-zinc-700">🚔 Bạn đang ở tù — tung đôi, nộp phạt hoặc dùng thẻ để ra.</p> : null}
      {view.role === "player" && mine && !mine.bankrupt && (
        <p className="hidden text-[11px] text-emerald-900/60 sm:block">Bấm vào một ô để xem chi tiết, xây nhà hoặc thế chấp.</p>
      )}
      {mine?.bankrupt && <p className="text-sm font-semibold text-rose-700">💸 Bạn đã phá sản — xem mọi người chơi tiếp nhé.</p>}
      {showBuild && mine && <BuildPanel g={g} mine={mine} busy={busy} run={run} onClose={() => setShowBuild(false)} />}
    </div>
  );
}

/** One line under the Mua button: the rent you'd earn and how close you are to the full group. */
function BuyHint({ g, sq, meId }: { g: TPGameView; sq: Ownable; meId: string }) {
  let text: React.ReactNode;
  if (sq.kind === "prop") {
    const cells = groupPositions(sq.group);
    const have = cells.filter((p) => g.deeds[p]?.owner === meId).length;
    const others = cells.filter((p) => g.deeds[p] && g.deeds[p].owner !== meId).length;
    text = (
      <>
        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: GROUP_COLORS[sq.group] }} />
        Thuê {money(sq.rent[0])} · khách sạn {money(sq.rent[5])} · nhóm {GROUP_NAMES[sq.group]}: bạn có {have}/{cells.length}
        {have + 1 === cells.length && others === 0 && <b className="text-emerald-700"> — mua là đủ nhóm!</b>}
        {others > 0 && <span className="text-rose-700"> (người khác đã giữ {others})</span>}
      </>
    );
  } else if (sq.kind === "air") {
    const have = Object.entries(g.deeds).filter(([pos, d]) => d.owner === meId && BOARD[Number(pos)].kind === "air").length;
    text = <>Thuê {AIR_RENT.map((r) => money(r)).join(" → ")} theo số sân bay · bạn có {have}/4</>;
  } else {
    text = <>Thuê = xúc xắc × {UTIL_MULT[0]} (có cả hai: × {UTIL_MULT[1]})</>;
  }
  return <p className="w-full rounded-lg bg-white/60 px-2 py-1 text-[11px] text-emerald-950 sm:text-xs">{text}</p>;
}

const GROUP_NAMES: Record<Group, string> = {
  brown: "Nâu",
  lightblue: "Xanh nhạt",
  pink: "Hồng",
  orange: "Cam",
  red: "Đỏ",
  yellow: "Vàng",
  green: "Xanh lá",
  darkblue: "Xanh đậm",
};
const ALL_GROUPS = Object.keys(GROUP_NAMES) as Group[];

/** Colour groups where `id` owns every city (the ones you can build on). */
function ownedFullGroups(g: TPGameView, id: string): Group[] {
  return ALL_GROUPS.filter((grp) => groupPositions(grp).every((p) => g.deeds[p]?.owner === id));
}

/** Build / sell houses on every group you own, without hunting for the squares on the board. */
function BuildPanel({ g, mine, busy, run, onClose }: { g: TPGameView; mine: TPPlayerView; busy: boolean; run: Act; onClose: () => void }) {
  const full = ownedFullGroups(g, mine.id);
  const partial = ALL_GROUPS.filter((grp) => !full.includes(grp) && groupPositions(grp).some((p) => g.deeds[p]?.owner === mine.id));
  const inDebt = g.phase === "debt";
  return (
    <Modal onClose={onClose} dark>
      <div className="text-left">
      <h2 className="mb-1 text-lg font-bold text-amber-300">{inDebt ? "🏚️ Bán nhà" : "🏠 Xây nhà"}</h2>
      <p className="mb-3 text-xs text-sky-100/70">
        Tiền mặt: <b className="text-emerald-300">{money(mine.cash)}</b> · Xây đều từng ô trong nhóm; 4 nhà rồi lên khách sạn. Bán nhà được nửa giá.
      </p>
      {full.length === 0 && <p className="text-sm text-sky-100/70">Bạn chưa sở hữu đủ nhóm màu nào.</p>}
      <div className="space-y-3">
        {full.map((grp) => {
          const cells = groupPositions(grp);
          const houses = cells.map((p) => g.deeds[p].houses);
          const anyMortgaged = cells.some((p) => g.deeds[p].mortgaged);
          return (
            <div key={grp} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between px-3 py-1.5 text-sm font-bold text-black" style={{ background: GROUP_COLORS[grp] }}>
                <span>Nhóm {GROUP_NAMES[grp]}</span>
                {anyMortgaged && <span className="rounded bg-black/30 px-1.5 text-[11px] text-white">có ô đang thế chấp</span>}
              </div>
              <ul className="divide-y divide-white/5">
                {cells.map((pos) => {
                  const sq = BOARD[pos] as Extract<Square, { kind: "prop" }>;
                  const d = g.deeds[pos];
                  const canBuild =
                    !inDebt && !anyMortgaged && d.houses < MAX_HOUSES && d.houses === Math.min(...houses) && mine.cash >= sq.house;
                  const canSell = d.houses > 0 && d.houses === Math.max(...houses);
                  const why = inDebt
                    ? "Đang nợ — chỉ bán được"
                    : anyMortgaged
                      ? "Chuộc hết đất trong nhóm trước"
                      : d.houses >= MAX_HOUSES
                        ? "Đã có khách sạn"
                        : d.houses !== Math.min(...houses)
                          ? "Xây đều: ô khác trong nhóm trước"
                          : mine.cash < sq.house
                            ? `Cần ${money(sq.house)}`
                            : "";
                  return (
                    <li key={pos} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{sq.name}</b>
                        <span className="flex h-5 items-end gap-0.5">
                          {d.houses === 0 && <span className="text-[11px] text-sky-100/50">Đất trống · thuê {money(sq.rent[0] * 2)}</span>}
                          {d.houses === MAX_HOUSES ? (
                            <Building hotel className="h-4" />
                          ) : (
                            Array.from({ length: d.houses }, (_, i) => <Building key={i} className="h-4" />)
                          )}
                          {d.houses > 0 && <span className="ml-1 text-[11px] text-sky-100/60">thuê {money(sq.rent[d.houses])}</span>}
                        </span>
                      </span>
                      <button
                        onClick={() => void run({ type: "sell", pos })}
                        disabled={busy || !canSell}
                        className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold enabled:hover:bg-white/10 disabled:opacity-30"
                        title={`Bán 1 nhà, nhận ${money(sq.house / 2)}`}
                      >
                        − Bán
                      </button>
                      {!inDebt && (
                        <button
                          onClick={() => void run({ type: "build", pos })}
                          disabled={busy || !canBuild}
                          title={why || undefined}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-black enabled:hover:bg-emerald-400 disabled:opacity-30"
                        >
                          + {d.houses === MAX_HOUSES - 1 ? "Khách sạn" : "Nhà"} · {money(sq.house)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {!inDebt && partial.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-100/50">Còn thiếu để xây</p>
          <ul className="space-y-1 text-xs text-sky-100/70">
            {partial.map((grp) => (
              <li key={grp} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: GROUP_COLORS[grp] }} />
                Nhóm {GROUP_NAMES[grp]}: còn thiếu{" "}
                {groupPositions(grp)
                  .filter((p) => g.deeds[p]?.owner !== mine.id)
                  .map((p) => BOARD[p].name)
                  .join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </Modal>
  );
}

function CBtn({
  children,
  onClick,
  disabled,
  primary,
  danger,
  build,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  /** The house-building button: stands out next to the main action. */
  build?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold shadow transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm",
        primary && "bg-emerald-700 text-white enabled:hover:bg-emerald-600",
        danger && "bg-rose-600 text-white enabled:hover:bg-rose-500",
        build && "bg-gradient-to-b from-amber-300 to-orange-500 text-black shadow-[0_3px_0_#9a3412] enabled:hover:brightness-110 enabled:active:translate-y-0.5",
        !primary && !danger && !build && "border border-emerald-800/30 bg-white/70 enabled:hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

function BuildOverlay({ fx }: { fx: { id: number; text: string; hotel: boolean } | null }) {
  return (
    <AnimatePresence>
      {fx && (
        <motion.div
          key={fx.id}
          className="pointer-events-none absolute inset-x-0 top-[12%] z-20 flex flex-col items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ duration: 0.5 }}
            className="h-14 drop-shadow-lg sm:h-20"
          >
            <Building hotel={fx.hotel} className="h-full" />
          </motion.div>
          <p className="mt-1 rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-white shadow sm:text-sm">{fx.text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CardOverlay({ card, nameOf, onClose }: { card: TPGameView["lastCard"]; nameOf: (id: string) => string; onClose: () => void }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.at}
          onClick={onClose}
          className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/25 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // Let clicks through as soon as it starts fading, so it never blocks the roll button.
          exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.2 } }}
        >
          <motion.div
            initial={{ rotateY: 180, scale: 0.6 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className={cn(
              "w-full max-w-xs rounded-2xl border-4 p-4 text-center shadow-2xl",
              card.deck === "chance" ? "border-orange-400 bg-orange-50" : "border-sky-400 bg-sky-50",
            )}
          >
            <p className="text-3xl">{card.deck === "chance" ? "❓" : "🎁"}</p>
            <p className="text-sm font-black uppercase tracking-wide">{card.deck === "chance" ? "Cơ hội" : "Khí vận"}</p>
            <p className="mt-2 text-sm">{card.text}</p>
            <p className="mt-2 text-xs text-black/50">— {nameOf(card.player)}</p>
            <p className="mt-2 text-[11px] text-black/40">Chạm để đóng</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Side panel ─────────────────────────────────────────────────────

function PlayerRow({
  seat,
  p,
  g,
  self,
  token,
  isTurn,
  reactions,
  onOpen,
  onKick,
}: {
  seat: TPSeatView;
  p: TPPlayerView | null;
  g: TPGameView | null;
  self: boolean;
  token: { emoji: string; color: string };
  isTurn: boolean;
  reactions: Reaction[];
  onOpen: (pos: number) => void;
  onKick?: () => void;
}) {
  const owned = g ? Object.entries(g.deeds).filter(([, d]) => d.owner === seat.id).map(([pos]) => Number(pos)) : [];
  return (
    <li className={cn("relative rounded-xl p-2", isTurn ? "bg-amber-400/15 ring-1 ring-amber-300/60" : "bg-white/5", p?.bankrupt && "opacity-50")}>
      <div className="flex items-center gap-2">
        <span className="relative">
          <SeatBubble reactions={reactions} />
          <span
            className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-lg", (!seat.connected || seat.kicked) && "grayscale")}
            style={{ background: token.color }}
          >
            {token.emoji}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {seat.isHost && <span title="Chủ bàn">👑</span>}
            <span className="truncate">{seat.name}</span>
            {self && <span className="text-xs font-normal text-white/60">(bạn)</span>}
          </p>
          <p className="flex flex-wrap items-center gap-1 text-[11px] text-white/70">
            {p && !p.bankrupt && <span className="font-mono text-emerald-300">💰 {money(p.cash)}</span>}
            {p && !p.bankrupt && <span className="font-mono text-white/50" title="Tổng tài sản">≈ {money(p.netWorth)}</span>}
            {p?.jail ? <span className="rounded bg-zinc-600 px-1">🚔 Ở tù</span> : null}
            {p && p.jailCards > 0 && <span title="Thẻ ra tù">🗝️×{p.jailCards}</span>}
            {p?.bankrupt && <span className="rounded bg-rose-900/60 px-1">Phá sản</span>}
            {!seat.connected && !seat.kicked && <span className="rounded bg-rose-900/60 px-1 text-rose-200">Mất kết nối</span>}
            {seat.kicked && <span className="rounded bg-rose-900/60 px-1 text-rose-200">Bị kích</span>}
            {seat.games > 0 && <span className={cn("font-mono", seat.points > 0 ? "text-emerald-300" : seat.points < 0 ? "text-rose-300" : "")}>{signed(seat.points)}đ</span>}
          </p>
        </div>
        {onKick && (
          <button onClick={onKick} className="rounded bg-rose-600 px-1.5 text-[11px] font-semibold text-white hover:bg-rose-500">
            Kích
          </button>
        )}
      </div>
      {owned.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {owned.map((pos) => {
            const sq = BOARD[pos];
            const d = g!.deeds[pos];
            return (
              <button
                key={pos}
                onClick={() => onOpen(pos)}
                title={sq.name}
                className={cn("flex h-5 items-center gap-0.5 rounded px-1 text-[10px] font-semibold text-black", d.mortgaged && "opacity-40 line-through")}
                style={{ background: sq.kind === "prop" ? GROUP_COLORS[sq.group] : "#e5e7eb" }}
              >
                {sq.kind === "air" ? "✈️" : sq.kind === "util" ? (sq.name.includes("Điện") ? "💡" : "🚰") : null}
                {sq.kind === "prop" ? sq.name.split(" ").map((w) => w[0]).join("") : ""}
                {d.houses > 0 && <span>{d.houses === MAX_HOUSES ? "🏨" : `${d.houses}🏠`}</span>}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

// ─── Square details / management ────────────────────────────────────

function SquareModal({
  pos,
  g,
  meId,
  myTurn,
  nameOf,
  run,
  busy,
  onClose,
}: {
  pos: number;
  g: TPGameView | null;
  meId: string;
  myTurn: boolean;
  nameOf: (id: string) => string;
  run: Act;
  busy: boolean;
  onClose: () => void;
}) {
  const sq = BOARD[pos];
  const deed = g?.deeds[pos];
  const mineHere = !!deed && deed.owner === meId && myTurn;
  const inDebt = g?.phase === "debt";
  const group = sq.kind === "prop" ? groupPositions(sq.group) : [];
  const ownsSet = sq.kind === "prop" && !!g && group.every((p) => g.deeds[p]?.owner === meId);

  return (
    <Modal onClose={onClose}>
      <div className="overflow-hidden rounded-xl bg-[#f4efe1] text-emerald-950">
        <div className="p-3 text-center" style={{ background: sq.kind === "prop" ? GROUP_COLORS[sq.group] : "#cfe8d8" }}>
          <p className="text-2xl">{SQUARE_ICON[sq.kind] ?? (sq.kind === "util" ? (sq.name.includes("Điện") ? "💡" : "🚰") : "📍")}</p>
          <p className="text-lg font-black">{sq.name}</p>
          {sq.kind === "prop" && <p className="text-xs">{sq.region}</p>}
        </div>
        <div className="space-y-2 p-4 text-sm">
          {isOwnable(sq) ? <OwnableInfo sq={sq} /> : <p>{SQUARE_TEXT[sq.kind]?.(sq)}</p>}
          {deed && (
            <p className="rounded bg-white/70 px-2 py-1">
              Chủ: <b>{nameOf(deed.owner)}</b>
              {deed.houses > 0 && <> · {deed.houses === MAX_HOUSES ? "1 khách sạn" : `${deed.houses} nhà`}</>}
              {deed.mortgaged && <b className="text-rose-700"> · đang thế chấp</b>}
            </p>
          )}
          {deed && deed.houses > 0 && (
            <div className="flex h-10 items-end justify-center gap-1 rounded bg-emerald-900/10 p-1">
              {deed.houses === MAX_HOUSES ? (
                <Building hotel className="h-full" />
              ) : (
                Array.from({ length: deed.houses }, (_, i) => <Building key={i} className="h-full" />)
              )}
            </div>
          )}
          {g && g.players.some((p) => p.pos === pos && !p.bankrupt) && (
            <p className="text-xs text-emerald-900/70">Đang đứng ở đây: {g.players.filter((p) => p.pos === pos && !p.bankrupt).map((p) => nameOf(p.id)).join(", ")}</p>
          )}
          {mineHere && isOwnable(sq) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {sq.kind === "prop" && !deed.mortgaged && deed.houses < MAX_HOUSES && (
                <CBtn primary onClick={() => void run({ type: "build", pos })} disabled={busy || inDebt || !ownsSet}>
                  🏠 Xây {deed.houses === MAX_HOUSES - 1 ? "khách sạn" : "nhà"} ({money(sq.house)})
                </CBtn>
              )}
              {sq.kind === "prop" && deed.houses > 0 && (
                <CBtn onClick={() => void run({ type: "sell", pos })} disabled={busy}>
                  Bán 1 nhà (+{money(sq.house / 2)})
                </CBtn>
              )}
              {!deed.mortgaged && deed.houses === 0 && (
                <CBtn onClick={() => void run({ type: "mortgage", pos })} disabled={busy}>
                  Thế chấp (+{money(mortgageValue(sq))})
                </CBtn>
              )}
              {deed.mortgaged && (
                <CBtn onClick={() => void run({ type: "unmortgage", pos })} disabled={busy || inDebt}>
                  Chuộc lại ({money(unmortgageCost(sq))})
                </CBtn>
              )}
            </div>
          )}
          {mineHere && sq.kind === "prop" && !ownsSet && <p className="text-xs text-emerald-900/60">Sở hữu đủ cả nhóm màu mới được xây nhà.</p>}
          {deed?.owner === meId && !myTurn && <p className="text-xs text-emerald-900/60">Xây nhà / thế chấp được trong lượt của bạn.</p>}
        </div>
      </div>
    </Modal>
  );
}

function OwnableInfo({ sq }: { sq: Ownable }) {
  if (sq.kind === "prop") {
    const labels = ["Đất trống", "1 nhà", "2 nhà", "3 nhà", "4 nhà", "Khách sạn"];
    return (
      <>
        <p>
          Giá <b>{money(sq.price)}</b> · xây mỗi nhà <b>{money(sq.house)}</b>
        </p>
        <table className="w-full text-xs">
          <tbody>
            {sq.rent.map((r, i) => (
              <tr key={i} className="border-b border-emerald-900/10">
                <td className="py-0.5">{labels[i]}</td>
                <td className="py-0.5 text-right font-mono">{money(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-emerald-900/70">Có đủ nhóm màu mà chưa xây: tiền thuê đất trống ×2. Thế chấp nhận {money(mortgageValue(sq))}.</p>
      </>
    );
  }
  if (sq.kind === "air") {
    return (
      <>
        <p>
          Giá <b>{money(sq.price)}</b>
        </p>
        <p className="text-xs">Tiền thuê theo số sân bay cùng chủ: {AIR_RENT.map((r, i) => `${i + 1} → ${money(r)}`).join(" · ")}</p>
      </>
    );
  }
  return (
    <>
      <p>
        Giá <b>{money(sq.price)}</b>
      </p>
      <p className="text-xs">
        Tiền thuê = tổng xúc xắc × {UTIL_MULT[0]} (có 1 công ty) hoặc × {UTIL_MULT[1]} (có cả điện lẫn nước).
      </p>
    </>
  );
}

const SQUARE_TEXT: Partial<Record<Square["kind"], (sq: Square) => string>> = {
  go: () => "Mỗi lần đi qua hoặc dừng ở đây nhận 200tr.",
  chance: () => "Rút một thẻ Cơ hội: có thể được tiền, phải di chuyển, hoặc vào tù.",
  chest: () => "Rút một thẻ Khí vận: phần lớn là tiền thưởng, đôi khi phải chi.",
  tax: (sq) => `Nộp ${money((sq as Extract<Square, { kind: "tax" }>).amount)} cho ngân hàng.`,
  jail: () => "Chỉ ghé thăm thì không sao. Ở tù: mỗi lượt tung đôi để ra, hoặc nộp 50tr / dùng thẻ ra tù. Sau 3 lượt phải nộp phạt.",
  parking: () => "Nghỉ chân uống ly cà phê — không có gì xảy ra.",
  gotojail: () => "Đi thẳng vào tù, không qua Khởi hành.",
};

// ─── Trading ────────────────────────────────────────────────────────

function TradeCard({
  trade,
  nameOf,
  incoming,
  outgoing,
  seconds,
  onAnswer,
}: {
  trade: NonNullable<TPGameView["trade"]>;
  nameOf: (id: string) => string;
  incoming: boolean;
  outgoing: boolean;
  seconds: number;
  onAnswer: (accept: boolean) => void;
}) {
  const side = (s: TradeSide) =>
    [...s.props.map((p) => BOARD[p].name), s.cash ? money(s.cash) : null].filter(Boolean).join(", ") || "không gì";
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("rounded-2xl p-3 text-sm", incoming ? "bg-amber-400/20 ring-2 ring-amber-300" : "bg-black/35")}
    >
      <p className="mb-1 font-semibold">
        🤝 {nameOf(trade.from)} → {nameOf(trade.to)} <span className="font-mono text-xs text-white/60">({seconds}s)</span>
      </p>
      <p className="text-xs">
        <span className="text-white/60">Đưa:</span> {side(trade.give)}
      </p>
      <p className="text-xs">
        <span className="text-white/60">Đổi lấy:</span> {side(trade.get)}
      </p>
      {incoming && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => onAnswer(true)} className="flex-1 rounded-lg bg-emerald-500 px-3 py-1 font-semibold text-black hover:bg-emerald-400">
            Đồng ý
          </button>
          <button onClick={() => onAnswer(false)} className="flex-1 rounded-lg border border-white/30 px-3 py-1 hover:bg-white/10">
            Từ chối
          </button>
        </div>
      )}
      {outgoing && (
        <button onClick={() => onAnswer(false)} className="mt-2 w-full rounded-lg border border-white/30 px-3 py-1 text-xs hover:bg-white/10">
          Rút lời mời
        </button>
      )}
    </motion.div>
  );
}

function TradeModal({ g, meId, nameOf, run, onClose }: { g: TPGameView; meId: string; nameOf: (id: string) => string; run: Act; onClose: () => void }) {
  const others = g.players.filter((p) => p.id !== meId && !p.bankrupt);
  const [to, setTo] = useState(others[0]?.id ?? "");
  const [give, setGive] = useState<number[]>([]);
  const [get, setGet] = useState<number[]>([]);
  const [giveCash, setGiveCash] = useState(0);
  const [getCash, setGetCash] = useState(0);
  const me = g.players.find((p) => p.id === meId);
  const them = g.players.find((p) => p.id === to);

  const tradable = (owner: string) =>
    Object.entries(g.deeds)
      .filter(([pos, d]) => {
        if (d.owner !== owner) return false;
        const sq = BOARD[Number(pos)];
        return !(sq.kind === "prop" && groupPositions(sq.group).some((p) => (g.deeds[p]?.houses ?? 0) > 0));
      })
      .map(([pos]) => Number(pos));

  const toggle = (list: number[], set: (v: number[]) => void, pos: number) => set(list.includes(pos) ? list.filter((x) => x !== pos) : [...list, pos]);

  const Picker = ({ owner, list, set }: { owner: string; list: number[]; set: (v: number[]) => void }) => {
    const props = tradable(owner);
    if (!props.length) return <p className="text-xs text-white/50">Không có đất đổi được (đất có nhà phải bán nhà trước).</p>;
    return (
      <div className="flex flex-wrap gap-1">
        {props.map((pos) => {
          const sq = BOARD[pos];
          const on = list.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => toggle(list, set, pos)}
              className={cn("rounded px-2 py-0.5 text-xs font-semibold text-black", on ? "ring-2 ring-white" : "opacity-60")}
              style={{ background: sq.kind === "prop" ? GROUP_COLORS[sq.group] : "#e5e7eb" }}
            >
              {sq.name}
              {g.deeds[pos].mortgaged && " (TC)"}
            </button>
          );
        })}
      </div>
    );
  };

  const send = async () => {
    if (await run({ type: "trade", to, give: { props: give, cash: giveCash }, get: { props: get, cash: getCash } })) onClose();
  };

  return (
    <Modal onClose={onClose} dark>
      <h2 className="mb-3 text-lg font-bold text-amber-300">🤝 Đổi đất / mua bán</h2>
      {others.length === 0 ? (
        <p className="text-sm">Không còn ai để đổi.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-white/60">Đổi với</span>
            <select
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setGet([]);
                setGetCash(0);
              }}
              className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5"
            >
              {others.map((p) => (
                <option key={p.id} value={p.id} className="text-black">
                  {nameOf(p.id)} ({money(p.cash)})
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-1 text-xs text-white/60">Bạn đưa</p>
            <Picker owner={meId} list={give} set={setGive} />
            <CashInput value={giveCash} max={me?.cash ?? 0} onChange={setGiveCash} />
          </div>
          <div>
            <p className="mb-1 text-xs text-white/60">Bạn nhận từ {nameOf(to)}</p>
            <Picker owner={to} list={get} set={setGet} />
            <CashInput value={getCash} max={them?.cash ?? 0} onChange={setGetCash} />
          </div>
          <p className="text-xs text-white/50">Đất đang thế chấp (TC) chuyển nguyên trạng. Người kia có 30 giây để trả lời.</p>
          <button
            onClick={() => void send()}
            disabled={!to || (!give.length && !get.length)}
            className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 disabled:opacity-40"
          >
            Gửi lời mời
          </button>
        </div>
      )}
    </Modal>
  );
}

function CashInput({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-1 flex items-center gap-2 text-xs">
      <span className="text-white/60">+ tiền</span>
      <input
        type="number"
        min={0}
        max={max}
        step={10}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))))}
        className="w-24 rounded bg-white/10 px-2 py-1 font-mono"
      />
      <span className="text-white/40">tr (tối đa {money(max)})</span>
    </label>
  );
}

// ─── Waiting / results ──────────────────────────────────────────────

function Waiting({ view, me, act, nameOf }: { view: TPRoomView; me: TPSeatView | null; act: Act; nameOf: (id: string) => string }) {
  const g = view.current;
  const count = view.seats.filter(Boolean).length;
  const ended = g?.status === "ended";
  const last = view.history[view.history.length - 1];
  const isHost = !!me?.isHost && view.role === "player";

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/80 p-3 text-sm shadow-xl sm:p-4">
      {ended && g ? (
        <>
          <h2 className="mb-2 text-base font-black text-emerald-800 sm:text-lg">🏆 {nameOf(g.finished[0])} là tỷ phú!</h2>
          <ol className="mb-3 space-y-1">
            {g.finished.map((id, i) => {
              const p = g.players.find((x) => x.id === id);
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    <b className="mr-1 text-emerald-700">#{i + 1}</b>
                    {nameOf(id)}
                    {id === view.meId && " (bạn)"}
                    {p && !p.bankrupt && <span className="ml-1 font-mono text-xs text-emerald-900/60">{money(p.netWorth)}</span>}
                    {p?.bankrupt && <span className="ml-1 text-xs text-rose-600">phá sản</span>}
                  </span>
                  {last?.results.find((r) => r.id === id) && <DeltaBadge delta={last.results.find((r) => r.id === id)!.delta} />}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <>
          <h2 className="mb-1 text-base font-black text-emerald-800 sm:text-lg">🎩 Cờ Tỷ Phú Việt Nam</h2>
          <p className="mb-3 text-xs text-emerald-900/70 sm:text-sm">{count}/6 người · gửi link mời để bạn bè vào bàn</p>
        </>
      )}

      <SettingsTabs
        light
        className="mb-3 text-emerald-950"
        tabs={[
          {
            id: "money",
            label: "💰 Tiền",
            content: (
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-2">
                  <span>Tiền khởi đầu</span>
                  <select
                    value={view.settings.startCash}
                    disabled={!isHost}
                    onChange={(e) => void act({ type: "settings", startCash: Number(e.target.value) })}
                    className="rounded-md border border-emerald-900/20 bg-white px-2 py-0.5"
                  >
                    {START_CASH_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {money(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <Toggle
                  label="Dừng đúng Khởi hành nhận gấp đôi (400tr)"
                  checked={!!view.settings.doubleGo}
                  disabled={!isHost}
                  onChange={(v) => void act({ type: "settings", doubleGo: v })}
                />
                <Toggle
                  label="Quỹ Nghỉ chân ☕: thuế & tiền phạt dồn vào, ai dừng đó hốt hết"
                  checked={!!view.settings.parkingPot}
                  disabled={!isHost}
                  onChange={(v) => void act({ type: "settings", parkingPot: v })}
                />
              </div>
            ),
          },
          {
            id: "time",
            label: "⏱️ Thời gian",
            content: (
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-2">
                  <span>Giới hạn ván</span>
                  <select
                    value={view.settings.timeLimit}
                    disabled={!isHost}
                    onChange={(e) => void act({ type: "settings", timeLimit: Number(e.target.value) })}
                    className="rounded-md border border-emerald-900/20 bg-white px-2 py-0.5"
                  >
                    {TIME_LIMIT_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v ? `${v} phút` : "Đến khi còn 1 người"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Thời gian mỗi bước</span>
                  <select
                    value={view.settings.stepSeconds ?? 30}
                    disabled={!isHost}
                    onChange={(e) => void act({ type: "settings", stepSeconds: Number(e.target.value) })}
                    className="rounded-md border border-emerald-900/20 bg-white px-2 py-0.5"
                  >
                    {STEP_SECONDS_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v} giây
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ),
          },
          {
            id: "points",
            label: "🏆 Điểm",
            content: (
              <RankPointsPicker
                first={view.settings.first ?? 2}
                second={view.settings.second ?? 1}
                players={count}
                editable={isHost}
                onChange={(v) => void act({ type: "settings", ...v })}
                className="[&_select]:bg-white [&_select]:text-emerald-950"
              />
            ),
          },
        ]}
      />
      {!isHost && <p className="-mt-2 mb-2 text-xs text-emerald-900/50">Chỉ chủ bàn đổi được luật.</p>}

      {isHost ? (
        <button
          onClick={() => void act({ type: "start" })}
          disabled={count < 2}
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {count < 2 ? "Cần ít nhất 2 người" : ended ? "Ván mới" : "Bắt đầu"}
        </button>
      ) : (
        <p className="text-xs text-emerald-900/70">{view.role === "spectator" ? "Chờ ván mới…" : "Chờ chủ bàn bắt đầu…"}</p>
      )}
    </div>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={cn("flex items-center justify-between gap-2", !disabled && "cursor-pointer")}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 shrink-0 accent-emerald-700" />
    </label>
  );
}

// ─── Rules ──────────────────────────────────────────────────────────

export function TyPhuRules() {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm">
      <li>2–6 người, mỗi người bắt đầu với số tiền chủ bàn chọn (mặc định 1.500tr). Mỗi vòng qua Khởi hành nhận 200tr.</li>
      <li>Tung 2 xúc xắc rồi đi. Tung đôi được tung tiếp; đôi 3 lần liền thì vào tù.</li>
      <li>Dừng ở đất, sân bay hay công ty chưa có chủ thì được mua. Không mua thì đất vẫn thuộc ngân hàng.</li>
      <li>Dừng ở đất người khác thì trả tiền thuê. Có đủ cả nhóm màu thì tiền thuê ×2 và được xây nhà — xây đều từng ô, 4 nhà rồi lên khách sạn.</li>
      <li>Sân bay: càng nhiều sân bay càng thu nhiều (25 → 200tr). Điện / nước: tổng xúc xắc × 4, có cả hai thì × 10.</li>
      <li>Thiếu tiền: bán nhà (được nửa giá) hoặc thế chấp đất (nửa giá, chuộc lại mất thêm 10%). Không xoay nổi thì phá sản.</li>
      <li>Ở tù: tung đôi để ra, hoặc nộp 50tr / dùng thẻ ra tù trước khi tung. Sau 3 lượt thì phải nộp phạt.</li>
      <li>Đổi đất với nhau bất cứ lúc nào (kèm tiền nếu muốn). Người còn lại cuối cùng — hoặc giàu nhất khi hết giờ — thắng.</li>
      <li>Mỗi bước có 30 giây; hết giờ hoặc mất kết nối thì máy tự đi (không mua gì).</li>
    </ul>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} dark>
      <h2 className="mb-3 text-lg font-bold text-amber-300">📖 Luật Cờ Tỷ Phú</h2>
      <TyPhuRules />
    </Modal>
  );
}

function Modal({ children, onClose, dark }: { children: React.ReactNode; onClose: () => void; dark?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        className={cn("relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-2xl shadow-2xl", dark && "border border-white/10 bg-[#0c2233] p-5 text-sky-50")}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-2 top-2 z-10 rounded-md bg-black/20 px-2 py-0.5 text-sm hover:bg-black/40" aria-label="Đóng">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
