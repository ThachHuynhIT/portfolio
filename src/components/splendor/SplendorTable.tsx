"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBox } from "@/components/games/ChatBox";
import { DraggableRow, useHandOrder } from "@/components/games/DraggableHand";
import { RankPointsPicker } from "@/components/games/RankPointsPicker";
import { useGameRoom } from "@/components/games/gameClient";
import { EmojiBar, SeatBubble, SpectatorReactions, useLiveReactions } from "@/components/tienlen/Effects";
import { DeltaBadge, ScoreboardModal, signed } from "@/components/tienlen/Scoreboard";
import {
  CARD_BY_ID,
  GEMS,
  GEM_NAMES,
  type Gem,
  MAX_RESERVED,
  TARGET_OPTIONS,
  TOKENS,
  TURN_SECONDS_OPTIONS,
  type Token,
} from "@/lib/splendor/cards";
import { SPLENDOR_WS_PATH, type SPGameView, type SPPlayerView, type SPRoomView, type SPSeatView } from "@/lib/splendor/protocol";
import type { Reaction } from "@/lib/tienlen";
import { cn } from "@/lib/utils";
import { BonusPip, CardBack, DevCardView, NobleTile, TokenChip } from "./Pieces";

type Act = (msg: Record<string, unknown> & { type: string }) => Promise<boolean>;

const SCORE_NOTE =
  "Điểm theo thứ hạng (điểm uy tín cao hơn xếp trên, bằng nhau thì ai ít thẻ hơn xếp trên). Chủ bàn chọn điểm Nhất / Nhì, các hạng cuối trừ tương ứng, tổng mỗi ván luôn bằng 0.";

function localize(view: SPRoomView): SPRoomView {
  const g = view.current;
  if (!g?.deadline) return view;
  const skew = Date.now() - view.serverTime;
  return { ...view, current: { ...g, deadline: g.deadline + skew } };
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

const emptyPick = (): Record<Token, number> => ({ white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 });

export default function SplendorTable({ code, name, watch }: { code: string; name: string; watch?: boolean }) {
  const { view, status, error, call } = useGameRoom<SPRoomView>(SPLENDOR_WS_PATH, code, name, watch ? "watch" : "play", localize);
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
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-rose-300">{error}</p>
        <div className="mt-4 flex gap-2">
          {error?.includes("đủ") && (
            <Link href={`/splendor/${code}?watch=1`} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
              Vào xem 👀
            </Link>
          )}
          <Link href="/splendor" className="rounded-lg border border-white/25 px-4 py-2 font-semibold">
            Về sảnh
          </Link>
        </div>
      </div>
    );
  }
  if (!view) return <p className="flex min-h-[70vh] animate-pulse items-center justify-center text-violet-100/80">Đang kết nối bàn {code}…</p>;
  return (
    <>
      <Table view={view} reconnecting={status === "reconnecting"} act={act} toast={toast} />
      <ChatBox messages={view.chat} meId={view.meId} myName={name} onSend={(text) => act({ type: "chat", text })} />
    </>
  );
}

function Table({ view, reconnecting, act, toast }: { view: SPRoomView; reconnecting: boolean; act: Act; toast: string | null }) {
  const g = view.current;
  const playing = g?.status === "playing";
  const me = view.seats.find((s) => s?.id === view.meId) ?? null;
  const mine = g?.players.find((p) => p.id === view.meId) ?? null;
  const myTurn = !!mine && playing && g?.turn === view.meId;
  const now = useNow(!!playing);
  const nameOf = (id: string) => view.seats.find((s) => s?.id === id)?.name ?? view.history.flatMap((h) => h.results).find((r) => r.id === id)?.name ?? "?";

  const [pick, setPick] = useState<Record<Token, number>>(emptyPick);
  const [focus, setFocus] = useState<{ card?: number; tier?: 1 | 2 | 3; reserved?: boolean } | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setPick(emptyPick()), [g?.turn, g?.phase]);

  const run = async (msg: Record<string, unknown> & { type: string }) => {
    setBusy(true);
    const ok = await act(msg);
    setBusy(false);
    return ok;
  };

  const live = useLiveReactions(view.reactions);
  const reactionsFor = (id: string): Reaction[] => live.filter((r) => r.playerId === id);

  const [copied, setCopied] = useState(false);
  const copyInvite = async () => {
    const url = new URL(`/splendor/${view.code}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Chép link mời:", url);
    }
  };

  const kick = async (s: SPSeatView) => {
    if (!window.confirm(playing && s.inGame ? `Kích ${s.name}? Họ sẽ xếp cuối ván này.` : `Kích ${s.name} khỏi bàn?`)) return;
    await act({ type: "kick", playerId: s.id });
  };

  // Gem picking: 3 different, or 2 of one colour (pile ≥ 4).
  const picked = GEMS.flatMap((gem) => Array.from({ length: pick[gem] }, () => gem));
  const togglePick = (gem: Gem) => {
    if (!myTurn || g?.phase !== "turn" || !g) return;
    setPick((p) => {
      const n = { ...p };
      const total = GEMS.reduce((t, x) => t + p[x], 0);
      if (p[gem] === 1 && total === 1 && g.bank[gem] >= 4) n[gem] = 2;
      else if (p[gem] > 0) n[gem] = 0;
      else if (total < 3 && !GEMS.some((x) => p[x] === 2) && g.bank[gem] > 0) n[gem] = 1;
      return n;
    });
  };
  const doTake = async () => {
    if (await run({ type: "take", gems: picked })) setPick(emptyPick());
  };

  const canAfford = (cardId: number) => {
    if (!mine) return false;
    const card = CARD_BY_ID[cardId];
    let gold = 0;
    for (const gem of GEMS) gold += Math.max(0, (card.cost[gem] ?? 0) - mine.bonuses[gem] - mine.tokens[gem]);
    return gold <= mine.tokens.gold;
  };

  const secondsLeft = g?.deadline ? Math.max(0, Math.ceil((g.deadline - now) / 1000)) : null;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col gap-3 px-2 pb-24 pt-3 sm:px-4 short:gap-2 short:pt-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/splendor" className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 hover:bg-black/60">
            ← Sảnh
          </Link>
          <span className="rounded-md bg-black/30 px-2 py-1 font-mono text-base font-bold tracking-[0.2em] text-amber-300">{view.code}</span>
          <button onClick={copyInvite} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Chép link mời" aria-label="Chép link mời">
            {copied ? "✓" : "🔗"}
            <span className="hidden sm:inline"> {copied ? "Đã chép link" : "Chép link mời"}</span>
          </button>
          <button onClick={() => setShowScores(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Bảng điểm" aria-label="Bảng điểm">
            🏆<span className="hidden sm:inline"> Bảng điểm</span>
          </button>
          <button onClick={() => setShowRules(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10" title="Luật chơi" aria-label="Luật chơi">
            📖<span className="hidden sm:inline"> Luật chơi</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-violet-100/70">
          {g && <span>🎯 {g.target} điểm</span>}
          {view.spectators.length > 0 && <span title={view.spectators.join(", ")}>👀 {view.spectators.length}</span>}
          {reconnecting && <span className="animate-pulse text-amber-300">Đang kết nối lại…</span>}
        </div>
      </div>

      {!g || g.status === "ended" ? (
        <div className="flex flex-1 items-center justify-center">
          <Waiting view={view} me={me} act={act} nameOf={nameOf} />
        </div>
      ) : (
        <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_19rem] short:grid-cols-[minmax(0,1fr)_15rem] short:gap-2">
          {/* Market */}
          <div className="relative flex min-w-0 flex-col gap-3 rounded-3xl border border-amber-200/10 bg-[radial-gradient(ellipse_at_top,#3b1d5c_0%,#1a0f2b_70%)] p-3 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] sm:p-4 short:gap-2 short:self-start short:p-2">
            <SpectatorReactions reactions={live.filter((r) => !r.playerId)} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {g.nobleRow.map((n) => (
                  <NobleTile key={n} id={n} />
                ))}
              </div>
              <p className="text-sm text-violet-100/80">
                {myTurn ? <b className="text-amber-300">Lượt của bạn</b> : <>Lượt của <b>{nameOf(g.turn ?? "")}</b></>}
                {secondsLeft !== null && <span className={cn("ml-2 font-mono", secondsLeft <= 8 && "text-rose-400")}>⏱ {secondsLeft}s</span>}
                {g.endTriggered && <span className="ml-2 rounded bg-amber-500/30 px-1.5 text-amber-200">Vòng cuối!</span>}
              </p>
            </div>

            {[3, 2, 1].map((tier) => (
              <div key={tier} className="flex items-center gap-2 overflow-x-auto pb-1 short:pb-0">
                <CardBack
                  tier={tier as 1 | 2 | 3}
                  count={g.deckCounts[tier - 1]}
                  onClick={g.deckCounts[tier - 1] ? () => setFocus({ tier: tier as 1 | 2 | 3 }) : undefined}
                />
                {g.board[tier - 1].map((c, i) =>
                  c === null ? (
                    <div key={`e${i}`} className="aspect-[5/7] w-[min(4.8rem,calc((100vw-4.75rem)/5))] shrink-0 rounded-lg border border-dashed border-white/15 sm:w-[6.5rem] short:w-[4.4rem]" />
                  ) : (
                    <motion.div key={c} initial={{ scale: 0.6, opacity: 0, rotateY: 90 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }}>
                      <DevCardView id={c} onClick={() => setFocus({ card: c })} affordable={myTurn && canAfford(c)} highlight={g.last?.card === c} />
                    </motion.div>
                  ),
                )}
              </div>
            ))}

            {/* Bank */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/30 p-2 min-[400px]:gap-3">
              {TOKENS.map((t) => (
                <TokenChip
                  key={t}
                  gem={t}
                  count={g.bank[t]}
                  size="lg"
                  selected={t === "gold" ? 0 : pick[t as Gem]}
                  dimmed={g.bank[t] === 0}
                  onClick={t === "gold" ? undefined : () => togglePick(t as Gem)}
                  title={t === "gold" ? "Vàng — chỉ lấy khi giữ thẻ" : `${GEM_NAMES[t]} — bấm để chọn (bấm lần 2 để lấy 2 viên nếu còn ≥ 4)`}
                />
              ))}
              {myTurn && g.phase === "turn" && (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => void doTake()}
                    disabled={!picked.length || busy}
                    className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-black hover:bg-amber-300 disabled:opacity-40"
                  >
                    💎 Lấy {picked.length ? picked.length : ""} đá
                  </button>
                  {!!picked.length && (
                    <button onClick={() => setPick(emptyPick())} className="rounded-lg border border-white/25 px-3 py-2 text-sm">
                      Bỏ chọn
                    </button>
                  )}
                </div>
              )}
            </div>

            {myTurn && g.phase === "discard" && mine && <DiscardPanel p={mine} need={g.discardNeed} run={run} busy={busy} />}
          </div>

          {/* Players */}
          <aside className="grid content-start gap-3 sm:grid-cols-2 lg:flex lg:flex-col short:grid-cols-1 short:gap-2">
            {g.players.map((p) => {
              const seat = view.seats.find((s) => s?.id === p.id);
              return (
                <PlayerPanel
                  key={p.id}
                  p={p}
                  name={nameOf(p.id)}
                  seat={seat ?? null}
                  self={p.id === view.meId}
                  isTurn={g.turn === p.id}
                  target={g.target}
                  reactions={reactionsFor(p.id)}
                  onReserved={(c) => setFocus({ card: c, reserved: true })}
                  orderKey={p.id === view.meId ? `splendor:order:${view.code}:${view.meId}` : null}
                  onKick={me?.isHost && seat && !seat.connected && !seat.kicked ? () => void kick(seat) : undefined}
                />
              );
            })}
            <div className="rounded-2xl bg-black/35 p-3 sm:col-span-2 short:col-span-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-100/60">Diễn biến</p>
              <ul className="flex max-h-56 flex-col-reverse gap-1 overflow-y-auto text-xs">
                {g.log
                  .slice()
                  .reverse()
                  .map((e) => (
                    <li key={e.id} className={cn("rounded px-2 py-1", e.tone === "noble" ? "bg-amber-500/20 text-amber-100" : e.tone === "buy" ? "bg-emerald-500/15" : "text-white/75")}>
                      {e.text}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="sm:col-span-2 short:col-span-1">
              <EmojiBar onSend={(emoji) => void act({ type: "emoji", emoji })} />
            </div>
          </aside>
        </div>
      )}

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

      {focus && g && (
        <CardModal
          focus={focus}
          g={g}
          mine={mine}
          myTurn={myTurn}
          busy={busy}
          canAfford={canAfford}
          run={run}
          onClose={() => setFocus(null)}
        />
      )}
      {showScores && <ScoreboardModal view={view} onClose={() => setShowScores(false)} note={SCORE_NOTE} />}
      {showRules && (
        <Modal onClose={() => setShowRules(false)}>
          <h2 className="mb-3 text-lg font-bold text-amber-300">📖 Luật Đá Quý</h2>
          <SplendorRules />
        </Modal>
      )}
    </div>
  );
}

function PlayerPanel({
  p,
  name,
  seat,
  self,
  isTurn,
  target,
  reactions,
  onReserved,
  onKick,
  orderKey,
}: {
  p: SPPlayerView;
  name: string;
  seat: SPSeatView | null;
  self: boolean;
  isTurn: boolean;
  target: number;
  reactions: Reaction[];
  onReserved: (card: number) => void;
  onKick?: () => void;
  /** Your own panel: drag to arrange your reserved cards. */
  orderKey?: string | null;
}) {
  const mineReserved = p.reserved.filter((c): c is number => c !== null);
  const reservedOrder = useHandOrder(mineReserved, orderKey ?? null);
  const tokenTotal = Object.values(p.tokens).reduce((a, b) => a + b, 0);
  return (
    <div className={cn("relative rounded-2xl p-3 short:p-2", isTurn ? "bg-amber-400/15 ring-1 ring-amber-300/60" : "bg-black/35", self && "max-lg:order-first")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="relative flex min-w-0 items-center gap-2">
          <SeatBubble reactions={reactions} />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-600 font-bold text-black">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 truncate text-sm font-semibold">
              {seat?.isHost && <span title="Chủ bàn">👑</span>}
              <span className="truncate">{name}</span>
              {self && <span className="text-xs font-normal text-white/60">(bạn)</span>}
            </span>
            <span className="flex flex-wrap gap-1 text-[11px] text-white/60">
              {seat && !seat.connected && !seat.kicked && <span className="rounded bg-rose-900/60 px-1 text-rose-200">Mất kết nối</span>}
              {seat?.kicked && <span className="rounded bg-rose-900/60 px-1 text-rose-200">Bị kích</span>}
              {seat && seat.games > 0 && <span className={cn("font-mono", seat.points > 0 ? "text-emerald-300" : seat.points < 0 ? "text-rose-300" : "")}>{signed(seat.points)}đ</span>}
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="block text-2xl font-black leading-none text-amber-300">{p.prestige}</span>
          <span className="text-[10px] text-white/50">/ {target} điểm</span>
        </span>
        {onKick && (
          <button onClick={onKick} className="absolute right-2 top-2 rounded bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
            Kích
          </button>
        )}
      </div>
      <div className="flex items-center gap-1" title="Thẻ đã mua (giảm giá vĩnh viễn)">
        <span className="w-10 text-[10px] text-white/50">Thẻ</span>
        {GEMS.map((gem) => (
          <BonusPip key={gem} gem={gem} n={p.bonuses[gem]} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="w-10 text-[10px] text-white/50">Đá {tokenTotal}/10</span>
        {TOKENS.filter((t) => p.tokens[t]).map((t) => (
          <TokenChip key={t} gem={t} count={p.tokens[t]} size="sm" />
        ))}
      </div>
      {(p.reserved.length > 0 || p.nobles.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {self && mineReserved.length > 0 && (
            <DraggableRow
              items={reservedOrder.ordered}
              onMove={reservedOrder.move}
              className="gap-1"
              renderItem={(c) => <DevCardView id={c} size="sm" onClick={() => onReserved(c)} />}
            />
          )}
          {!self && p.reserved.map((c, i) =>
            c === null ? (
              <span key={i} className="flex h-8 w-6 items-center justify-center rounded bg-stone-700 text-[10px]" title="Thẻ đang giữ (úp)">
                📌
              </span>
            ) : (
              <DevCardView key={c} id={c} size="sm" onClick={self ? () => onReserved(c) : undefined} />
            ),
          )}
          {p.nobles.map((n) => (
            <NobleTile key={n} id={n} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

function CardModal({
  focus,
  g,
  mine,
  myTurn,
  busy,
  canAfford,
  run,
  onClose,
}: {
  focus: { card?: number; tier?: 1 | 2 | 3; reserved?: boolean };
  g: SPGameView;
  mine: SPPlayerView | null;
  myTurn: boolean;
  busy: boolean;
  canAfford: (c: number) => boolean;
  run: Act;
  onClose: () => void;
}) {
  const canAct = myTurn && g.phase === "turn" && !!mine;
  const reserveFull = (mine?.reserved.length ?? 0) >= MAX_RESERVED;
  const done = (p: Promise<boolean>) => void p.then((ok) => ok && onClose());
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center gap-3">
        {focus.card !== undefined ? <DevCardView id={focus.card} size="lg" /> : <CardBack tier={focus.tier!} count={g.deckCounts[focus.tier! - 1]} />}
        {focus.card !== undefined && (
          <p className="text-center text-sm text-white/80">
            Thẻ <b>{GEM_NAMES[CARD_BY_ID[focus.card].bonus]}</b> · {CARD_BY_ID[focus.card].points} điểm · giảm vĩnh viễn 1 {GEM_NAMES[CARD_BY_ID[focus.card].bonus]} cho các lần mua sau
          </p>
        )}
        {canAct ? (
          <div className="flex flex-wrap justify-center gap-2">
            {focus.card !== undefined && (
              <button
                onClick={() => done(run({ type: "buy", card: focus.card! }))}
                disabled={busy || !canAfford(focus.card)}
                className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
              >
                🛒 Mua
              </button>
            )}
            {!focus.reserved && (
              <button
                onClick={() => done(run(focus.card !== undefined ? { type: "reserve", card: focus.card } : { type: "reserve", tier: focus.tier! }))}
                disabled={busy || reserveFull}
                className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-black hover:bg-amber-300 disabled:opacity-40"
              >
                📌 Giữ {focus.card === undefined ? "1 thẻ úp" : ""} {g.bank.gold > 0 ? "+ 1 Vàng" : ""}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/50">Mua hoặc giữ thẻ trong lượt của bạn.</p>
        )}
        {canAct && focus.card !== undefined && !canAfford(focus.card) && <p className="text-xs text-rose-300">Chưa đủ đá để mua thẻ này.</p>}
        {canAct && reserveFull && !focus.reserved && <p className="text-xs text-white/50">Bạn đã giữ đủ {MAX_RESERVED} thẻ.</p>}
      </div>
    </Modal>
  );
}

function DiscardPanel({ p, need, run, busy }: { p: SPPlayerView; need: number; run: Act; busy: boolean }) {
  const [give, setGive] = useState<Record<Token, number>>(emptyPick);
  const total = Object.values(give).reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-2xl bg-rose-500/15 p-3 ring-1 ring-rose-400/40">
      <p className="mb-2 text-sm">
        Bạn có quá 10 viên — chọn <b>{need}</b> viên để trả lại ({total}/{need}):
      </p>
      <div className="flex flex-wrap gap-3">
        {TOKENS.filter((t) => p.tokens[t]).map((t) => (
          <div key={t} className="flex flex-col items-center gap-1">
            <TokenChip gem={t} count={p.tokens[t] - give[t]} />
            <div className="flex gap-1">
              <button onClick={() => setGive((g) => ({ ...g, [t]: Math.max(0, g[t] - 1) }))} className="h-6 w-6 rounded bg-white/10" disabled={!give[t]}>
                −
              </button>
              <span className="w-4 text-center text-sm">{give[t]}</span>
              <button
                onClick={() => setGive((g) => ({ ...g, [t]: Math.min(p.tokens[t], g[t] + 1) }))}
                className="h-6 w-6 rounded bg-white/10"
                disabled={give[t] >= p.tokens[t] || total >= need}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => void run({ type: "discard", tokens: give })}
        disabled={busy || total !== need}
        className="mt-3 rounded-lg bg-amber-400 px-4 py-2 font-bold text-black disabled:opacity-40"
      >
        Trả lại
      </button>
    </div>
  );
}

function Waiting({ view, me, act, nameOf }: { view: SPRoomView; me: SPSeatView | null; act: Act; nameOf: (id: string) => string }) {
  const g = view.current;
  const count = view.seats.filter(Boolean).length;
  const ended = g?.status === "ended";
  const last = view.history[view.history.length - 1];
  const isHost = !!me?.isHost && view.role === "player";
  const s = view.settings;
  return (
    <div className="w-full max-w-md rounded-3xl border border-amber-200/15 bg-black/45 p-5 backdrop-blur">
      {ended && g ? (
        <>
          <h2 className="mb-2 text-xl font-black text-amber-300">🏆 {nameOf(g.finished[0])} thắng!</h2>
          <ol className="mb-4 space-y-1 text-sm">
            {g.finished.map((id, i) => {
              const p = g.players.find((x) => x.id === id);
              const d = last?.results.find((r) => r.id === id)?.delta;
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span>
                    <b className="mr-2 text-amber-300">#{i + 1}</b>
                    {nameOf(id)}
                    {id === view.meId && " (bạn)"}
                    {p && <span className="ml-2 text-white/60">{p.prestige} điểm · {p.owned.length} thẻ</span>}
                  </span>
                  {d !== undefined && <DeltaBadge delta={d} />}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <>
          <h2 className="mb-1 text-xl font-black text-amber-300">💎 Đá Quý</h2>
          <p className="mb-4 text-sm text-violet-100/80">{count}/4 người · gửi link mời để bạn bè vào bàn</p>
        </>
      )}
      <div className="mb-4 space-y-2 rounded-xl bg-white/5 p-3 text-xs">
        <p className="font-semibold uppercase tracking-wide text-violet-100/60">Luật bàn</p>
        <label className="flex items-center justify-between gap-2">
          <span>Điểm uy tín để thắng</span>
          <select value={s.target} disabled={!isHost} onChange={(e) => void act({ type: "settings", target: Number(e.target.value) })} className="rounded bg-black/40 px-1 py-0.5">
            {TARGET_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v} điểm
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Thời gian mỗi lượt</span>
          <select value={s.turnSeconds} disabled={!isHost} onChange={(e) => void act({ type: "settings", turnSeconds: Number(e.target.value) })} className="rounded bg-black/40 px-1 py-0.5">
            {TURN_SECONDS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v} giây
              </option>
            ))}
          </select>
        </label>
        <RankPointsPicker first={s.first} second={s.second} players={count} editable={isHost} onChange={(v) => void act({ type: "settings", ...v })} />
        {!isHost && <p className="text-white/40">Chỉ chủ bàn đổi được luật.</p>}
      </div>
      {isHost ? (
        <button
          onClick={() => void act({ type: "start" })}
          disabled={count < 2}
          className="w-full rounded-lg bg-amber-400 px-4 py-2 font-bold text-black hover:bg-amber-300 disabled:opacity-40"
        >
          {count < 2 ? "Cần ít nhất 2 người" : ended ? "Ván mới" : "Bắt đầu"}
        </button>
      ) : (
        <p className="text-sm text-violet-100/70">{view.role === "spectator" ? "Chờ ván mới…" : "Chờ chủ bàn bắt đầu…"}</p>
      )}
    </div>
  );
}

export function SplendorRules() {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm">
      <li>2–4 người buôn đá quý. Mỗi lượt chọn đúng <b>1</b> việc:</li>
      <li>
        <b>Lấy đá:</b> 3 viên khác màu, hoặc 2 viên cùng màu (khi đống đó còn ít nhất 4 viên). Bấm vào đá ở ngân hàng để chọn, bấm lần 2 để lấy 2 viên.
      </li>
      <li>
        <b>Giữ thẻ:</b> lấy 1 thẻ đang ngửa (hoặc 1 thẻ úp từ chồng bài) vào tay, kèm 1 Vàng nếu còn. Giữ tối đa 3 thẻ.
      </li>
      <li>
        <b>Mua thẻ:</b> trả đá theo giá (Vàng thay được mọi màu). Mỗi thẻ đã mua giảm vĩnh viễn 1 viên màu đó cho các lần mua sau, và nhiều thẻ có điểm uy tín.
      </li>
      <li>Giữ tối đa 10 viên đá; dư thì phải trả lại.</li>
      <li>Có đủ số thẻ theo yêu cầu của một Quý tộc thì họ tự đến thăm cuối lượt (+3 điểm).</li>
      <li>Khi có người đạt số điểm thắng (mặc định 15), chơi nốt vòng đó cho đều lượt. Nhiều điểm nhất thắng; bằng điểm thì ai ít thẻ hơn thắng.</li>
    </ul>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#1b1030] p-5 text-violet-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-sm hover:bg-white/10" aria-label="Đóng">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
