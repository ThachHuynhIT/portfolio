"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBox } from "@/components/games/ChatBox";
import { useGameRoom } from "@/components/games/gameClient";
import { EmojiBar, SeatBubble, SpectatorReactions, useLiveReactions } from "@/components/tienlen/Effects";
import { DeltaBadge, ScoreboardModal, signed } from "@/components/tienlen/Scoreboard";
import {
  ACTION_TYPES,
  CARDS,
  CAT_TYPES,
  type CardType,
  type Expansion,
  type MCard,
  EXPANSIONS,
  NAMEABLE_TYPES,
  NOW_TYPES,
  PACKS,
  TARGETED_TYPES,
  WILD_CAT,
  cardName,
} from "@/lib/meono/cards";
import {
  DEFAULT_MEO_SETTINGS,
  MEONO_WS_PATH,
  type MeoRoomView,
  type MeoSeatView,
  NOPE_SECONDS_OPTIONS,
  TURN_SECONDS_OPTIONS,
  insertRange,
} from "@/lib/meono/protocol";
import { RankPointsPicker } from "@/components/games/RankPointsPicker";
import type { Reaction } from "@/lib/tienlen";
import { cn } from "@/lib/utils";
import { CardGuide } from "./CardGuide";
import { MeoCard } from "./MeoCard";

const SCORE_NOTE =
  "Điểm theo thứ hạng: người sống sót cuối cùng Nhất, ai bị loại trước xếp sau. Chủ bàn chọn điểm Nhất / Nhì, các hạng cuối trừ tương ứng, tổng mỗi ván luôn bằng 0.";

/** Shift server-clock deadlines onto the local clock. */
function localize(view: MeoRoomView): MeoRoomView {
  const g = view.current;
  if (!g) return view;
  const skew = Date.now() - view.serverTime;
  const shift = (t: number | null) => (t ? t + skew : t);
  return {
    ...view,
    current: {
      ...g,
      turnDeadline: shift(g.turnDeadline),
      pending: g.pending ? { ...g.pending, deadline: g.pending.deadline + skew } : null,
      choice: g.choice ? { ...g.choice, deadline: g.choice.deadline + skew } : null,
    },
  };
}

function useNow(active: boolean, every = 200) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}

/** What a selection of cards would do, mirroring the server's rules. */
function classify(types: CardType[]): { kind: string; target: boolean; named: "hand" | "discard" | null } | { error: string } | null {
  if (!types.length) return null;
  if (types.length === 1) {
    const t = types[0];
    if (ACTION_TYPES.includes(t)) return { kind: t, target: TARGETED_TYPES.includes(t), named: null };
    if (t === "nope") return { error: "“Không!” chỉ dùng để chặn người khác" };
    if (t === "exploding") return { error: "Mèo Nổ đang được Mèo Chạy Rông che chở — không đánh ra được" };
    if (t === "streaking") return { error: "Mèo Chạy Rông chỉ cần giữ trong tay" };
    if (t === "defuse") return { error: "Gỡ bom tự dùng khi rút phải Mèo Nổ" };
    return { error: "Lá mèo phải đánh theo đôi hoặc bộ ba" };
  }
  const isSet =
    types.every((t) => t === types[0]) ||
    (types.every((t) => t === WILD_CAT || CAT_TYPES.includes(t)) && new Set(types.filter((t) => t !== WILD_CAT)).size === 1);
  if ((types.length === 2 || types.length === 3) && isSet) {
    return types.length === 2 ? { kind: "pair", target: true, named: null } : { kind: "triple", target: true, named: "hand" };
  }
  if (types.length === 5 && new Set(types).size === 5) return { kind: "five", target: false, named: "discard" };
  return { error: "Bộ bài không hợp lệ" };
}

interface BoomFx {
  id: number;
  tone: string;
  text: string;
}

export default function MeoTable({ code, name, watch }: { code: string; name: string; watch?: boolean }) {
  const { view, status, error, call } = useGameRoom<MeoRoomView>(MEONO_WS_PATH, code, name, watch ? "watch" : "play", localize);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const act = useCallback(
    async (msg: Record<string, unknown> & { type: string }) => {
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
            <Link href={`/meo-no/${code}?watch=1`} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
              Vào xem 👀
            </Link>
          )}
          <Link href="/meo-no" className="rounded-lg border border-white/25 px-4 py-2 font-semibold">
            Về sảnh
          </Link>
        </div>
      </div>
    );
  }
  if (!view) {
    return <p className="flex min-h-[70vh] animate-pulse items-center justify-center text-orange-100/80">Đang kết nối bàn {code}…</p>;
  }
  return (
    <>
      <Board view={view} reconnecting={status === "reconnecting"} act={act} toast={toast} />
      <ChatBox messages={view.chat} meId={view.meId} myName={name} onSend={(text) => act({ type: "chat", text })} />
    </>
  );
}

function Board({
  view,
  reconnecting,
  act,
  toast,
}: {
  view: MeoRoomView;
  reconnecting: boolean;
  act: (msg: Record<string, unknown> & { type: string }) => Promise<boolean>;
  toast: string | null;
}) {
  const g = view.current;
  const spectator = view.role === "spectator";
  const me = view.seats.find((s) => s?.id === view.meId) ?? null;
  const playing = g?.status === "playing";
  const meAlive = !!me && playing && me.inGame && !me.out;
  const myTurn = meAlive && g?.turn === view.meId;
  const nameOf = (id: string) =>
    view.seats.find((s) => s?.id === id)?.name ?? view.history.flatMap((h) => h.results).find((r) => r.id === id)?.name ?? "?";

  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [named, setNamed] = useState<CardType | "">("");
  const [focus, setFocus] = useState<CardType | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [busy, setBusy] = useState(false);

  const hand = view.hand;
  const handKey = hand.map((c) => c.id).join(",");
  useEffect(() => {
    setSelected((sel) => sel.filter((id) => hand.some((c) => c.id === id)));
  }, [handKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lời nguyền mông mèo: the hand arrives face down, in blind order — keep that order.
  const cursed = !!me?.cursed;
  const sortedHand = useMemo(
    () => (cursed ? hand : hand.slice().sort((a, b) => a.type.localeCompare(b.type) || a.id - b.id)),
    [hand, cursed],
  );
  const selectedTypes = selected.map((id) => hand.find((c) => c.id === id)?.type).filter((t): t is CardType => !!t);
  const plan = cursed
    ? selected.length
      ? ({ kind: "blind", target: false, named: null } as const)
      : null
    : classify(selectedTypes);
  const planError = plan && "error" in plan ? plan.error : null;
  const planOk = plan && !("error" in plan) ? plan : null;

  const g2 = g;
  const pending = g2?.pending ?? null;
  const choice = g2?.choice ?? null;
  const now = useNow(!!pending || !!choice || playing);

  const opponents = view.seats.filter((s): s is MeoSeatView => !!s && s.id !== view.meId);
  const needTarget = !!planOk?.target;
  const needName = planOk?.named ?? null;
  // “Now” cards (Sửa tương lai ngay) can be played on anyone's turn.
  const nowPlay = meAlive && !!planOk && NOW_TYPES.includes(planOk.kind as CardType);
  const canPlay =
    (myTurn || nowPlay) && !pending && !choice && !!planOk && (!needTarget || !!target) && (!needName || !!named) && !busy;
  const canDraw = myTurn && !pending && !choice && !busy;
  const myNope = hand.find((c) => c.type === "nope");

  const toggle = (c: MCard) => {
    setFocus(c.type);
    // Answering a Favor: pick exactly one card.
    if ((choice?.kind === "favor" && choice.from === view.meId) || (choice?.kind === "offer" && choice.player === view.meId)) {
      setSelected([c.id]);
      return;
    }
    setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]));
  };

  const run = async (msg: Record<string, unknown> & { type: string }) => {
    setBusy(true);
    const ok = await act(msg);
    setBusy(false);
    return ok;
  };
  const doPlay = async () => {
    if (await run({ type: "mplay", cards: selected, target: target ?? undefined, named: named || undefined })) {
      setSelected([]);
      setTarget(null);
      setNamed("");
    }
  };

  // Explosion / defuse effects from the log.
  const [fx, setFx] = useState<BoomFx | null>(null);
  const lastLog = useRef<number | null>(null);
  const latestLogId = g?.log.at(-1)?.id ?? 0;
  useEffect(() => {
    const log = g?.log ?? [];
    const latest = log[log.length - 1];
    if (!latest) return;
    if (lastLog.current === null) {
      lastLog.current = latest.id;
      return;
    }
    const fresh = log.filter((e) => e.id > (lastLog.current ?? 0));
    lastLog.current = latest.id;
    const big = fresh.reverse().find((e) => e.tone === "boom" || e.tone === "defuse" || e.tone === "nope");
    if (big) setFx({ id: latest.id, tone: big.tone!, text: big.text });
  }, [latestLogId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Hide on its own timer so later state updates can't cancel it (that left the overlay stuck).
  useEffect(() => {
    if (!fx) return;
    const t = setTimeout(() => setFx(null), fx.tone === "boom" ? 2400 : 1500);
    return () => clearTimeout(t);
  }, [fx]);

  const live = useLiveReactions(view.reactions);
  const reactionsFor = (id: string): Reaction[] => live.filter((r) => r.playerId === id);

  const kick = async (s: MeoSeatView) => {
    if (!window.confirm(playing && s.inGame ? `Kích ${s.name}? Họ sẽ bị loại khỏi ván này.` : `Kích ${s.name} khỏi bàn?`)) return;
    await act({ type: "kick", playerId: s.id });
  };

  const [copied, setCopied] = useState(false);
  const copyInvite = async () => {
    const url = new URL(`/meo-no/${view.code}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Chép link mời:", url);
    }
  };

  const secondsLeft = (deadline: number | null | undefined) => (deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null);
  const focusInfo = focus ? CARDS[focus] : null;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col gap-3 px-3 pb-4 pt-3 sm:px-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/meo-no" className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 hover:bg-black/60">
            ← Sảnh
          </Link>
          <span className="rounded-md bg-black/30 px-2 py-1 font-mono text-base font-bold tracking-[0.2em] text-amber-300">{view.code}</span>
          <button onClick={copyInvite} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10">
            {copied ? "Đã chép link ✓" : "Chép link mời"}
          </button>
          <button onClick={() => setShowScores(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10">
            🏆 Bảng điểm
          </button>
          <button onClick={() => setShowGuide(true)} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10">
            📖 Lá bài
          </button>
        </div>
        <div className="flex items-center gap-3 text-orange-100/70">
          {(g?.expansions ?? view.expansions).map((e) => (
            <span key={e} title={PACKS[e].name}>
              {PACKS[e].emoji} {PACKS[e].name.replace("Gói ", "")}
            </span>
          ))}
          {view.spectators.length > 0 && <span title={view.spectators.join(", ")}>👀 {view.spectators.length}</span>}
          {reconnecting && <span className="animate-pulse text-amber-300">Đang kết nối lại…</span>}
        </div>
      </div>

      {spectator && (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-black/30 px-3 py-2 text-sm text-orange-100/80">
          <span>👀 Bạn đang xem với tư cách khán giả</span>
          {view.seats.some((s) => s === null) && !playing && (
            <Link href={`/meo-no/${view.code}`} className="rounded-md bg-amber-400 px-3 py-1 font-semibold text-black">
              Vào chơi
            </Link>
          )}
        </div>
      )}

      <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Table */}
        <div className="relative flex min-h-[340px] flex-col rounded-[2rem] border-[6px] border-[#4a2412] bg-[radial-gradient(ellipse_at_center,#7c2d12_0%,#431407_60%,#26100a_100%)] p-3 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)] sm:p-4">
          <SpectatorReactions reactions={live.filter((r) => !r.playerId)} />
          <BoomOverlay fx={fx} />

          {/* Opponents */}
          <div className="flex flex-wrap justify-center gap-3">
            {opponents.length === 0 && <p className="py-4 text-sm text-orange-100/50">Chưa có ai khác — gửi link mời nhé!</p>}
            {opponents.map((s) => (
              <Seat
                key={s.id}
                seat={s}
                isTurn={g?.turn === s.id}
                turnsLeft={g?.turn === s.id ? g.turnsLeft : 0}
                deadline={g?.turn === s.id ? g.turnDeadline : null}
                now={now}
                reactions={reactionsFor(s.id)}
                selectable={(needTarget || cursed) && myTurn && s.inGame && !s.out}
                selected={target === s.id}
                onSelect={() => setTarget(s.id)}
                onKick={me?.isHost && !s.connected && !s.kicked ? () => void kick(s) : undefined}
                turnMs={(view.settings?.turnSeconds ?? 30) * 1000}
                claimedBy={(g?.claims ?? []).filter((c) => c.victim === s.id).map((c) => nameOf(c.by))}
              />
            ))}
          </div>

          {/* Center */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-3">
            {!g || g.status === "ended" ? (
              <Waiting view={view} me={me} act={act} nameOf={nameOf} />
            ) : (
              <>
                <div className="flex items-end gap-5">
                  <button
                    onClick={() => void run({ type: "draw" })}
                    disabled={!canDraw}
                    className="group relative flex flex-col items-center gap-1 disabled:cursor-default"
                    aria-label="Rút bài"
                  >
                    <div className="relative">
                      <MeoCard type="exploding" faceDown size="md" className={cn(canDraw && "ring-2 ring-amber-300 group-hover:-translate-y-1")} />
                      <span className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-xs text-amber-200">{g.deckCount}</span>
                    </div>
                    <span className="text-xs text-orange-100/70">{canDraw ? "Bấm để rút" : "Chồng bài"}</span>
                  </button>
                  <div className="flex flex-col items-center gap-1">
                    {g.discard.length ? (
                      <MeoCard type={g.discard[g.discard.length - 1]} size="md" />
                    ) : (
                      <div className="aspect-[5/7] w-[4.6rem] rounded-xl border-2 border-dashed border-white/15 sm:w-20" />
                    )}
                    <span className="text-xs text-orange-100/70">Đã đánh ({g.discard.length})</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="rounded-full bg-black/40 px-2 py-0.5">Chiều: {g.dir === 1 ? "↻ xuôi" : "↺ ngược"}</span>
                  {g.implodingAt !== null && (
                    <span className="rounded-full bg-violet-700/60 px-2 py-0.5 font-semibold">
                      🌀 Mèo Tự Huỷ ở lá thứ {g.implodingAt + 1} từ trên xuống
                    </span>
                  )}
                </div>
                <p className="text-center text-sm">
                  {myTurn ? (
                    <b className="text-amber-300">Lượt của bạn{g.turnsLeft > 1 ? ` (còn ${g.turnsLeft} lượt)` : ""} — đánh bài hoặc rút để kết thúc lượt</b>
                  ) : g.turn ? (
                    <>
                      Lượt của <b>{nameOf(g.turn)}</b>
                      {g.turnsLeft > 1 && ` (còn ${g.turnsLeft} lượt)`}
                    </>
                  ) : null}
                  {g.turnDeadline && !pending && !choice && <span className="ml-2 text-orange-100/60">⏱ {secondsLeft(g.turnDeadline)}s</span>}
                </p>

                {pending && (
                  <PendingBar
                    pending={pending}
                    nameOf={nameOf}
                    secondsLeft={secondsLeft(pending.deadline) ?? 0}
                    canNope={meAlive && !!myNope}
                    onNope={() => myNope && void run({ type: "nope", card: myNope.id })}
                  />
                )}
                {choice && <ChoicePanel view={view} choice={choice} nameOf={nameOf} secondsLeft={secondsLeft(choice.deadline) ?? 0} run={run} selected={selected} />}
                {view.future && (
                  <div className="rounded-xl bg-black/40 p-2 text-center">
                    <p className="mb-1 text-xs text-fuchsia-200">
                      {view.sharedBy ? "🤝 Được chia sẻ tương lai — trái là lá trên cùng" : "🔮 Tương lai (chỉ bạn thấy) — trái là lá trên cùng"}
                    </p>
                    <div className="flex gap-2">
                      {view.future.map((t, i) => (
                        <MeoCard key={i} type={t} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Me */}
          {me && !spectator && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Seat
                  seat={me}
                  self
                  isTurn={g?.turn === me.id}
                  turnsLeft={g?.turn === me.id ? g.turnsLeft : 0}
                  deadline={g?.turn === me.id ? g.turnDeadline : null}
                  now={now}
                  reactions={reactionsFor(me.id)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Side: log */}
        <aside className="flex max-h-[420px] flex-col rounded-2xl border border-white/10 bg-black/30 p-3 lg:max-h-none">
          <h3 className="mb-2 text-sm font-bold text-amber-200">Diễn biến</h3>
          <ol className="flex-1 space-y-1 overflow-y-auto text-sm">
            {(g?.log ?? []).slice().reverse().map((e) => (
              <li
                key={e.id}
                className={cn(
                  "rounded-md px-2 py-1",
                  e.tone === "boom" && "bg-rose-600/30 text-rose-100",
                  e.tone === "defuse" && "bg-emerald-600/25 text-emerald-100",
                  e.tone === "nope" && "bg-red-900/40 text-red-100",
                  e.tone === "steal" && "bg-amber-600/20 text-amber-100",
                  (!e.tone || e.tone === "info") && "text-orange-50/80",
                )}
              >
                {e.text}
              </li>
            ))}
            {!g?.log.length && <li className="text-orange-100/50">Chưa có gì xảy ra.</li>}
          </ol>
        </aside>
      </div>

      {/* Hand + actions */}
      {!spectator && hand.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {focusInfo && (
            <p className="max-w-2xl rounded-lg bg-black/40 px-3 py-1.5 text-center text-sm text-orange-50/90">
              <b className="text-amber-200">{focusInfo.emoji} {focusInfo.name}:</b> {focusInfo.effect}
            </p>
          )}
          <div className="flex w-full flex-wrap justify-center gap-1.5 pt-4">
            {sortedHand.map((c) => (
              <MeoCard key={c.id} type={c.type} selected={selected.includes(c.id)} onClick={() => toggle(c)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {myTurn && selected.length > 0 && (
              <span className={cn("rounded-md px-2 py-1", planError ? "bg-rose-900/50 text-rose-200" : "bg-black/40 text-orange-100")}>
                {planError ??
                  (planOk?.kind === "pair"
                    ? "Đôi: rút trộm 1 lá"
                    : planOk?.kind === "triple"
                      ? "Bộ ba: gọi tên lá muốn lấy"
                      : planOk?.kind === "five"
                        ? "5 lá khác nhau: nhặt 1 lá từ chồng đã đánh"
                        : planOk
                          ? cardName(planOk.kind as CardType)
                          : "")}
                {needTarget && (target ? ` → ${nameOf(target)}` : " — chọn người ở trên")}
              </span>
            )}
            {myTurn && needName && (
              <select
                value={named}
                onChange={(e) => setNamed(e.target.value as CardType)}
                className="rounded-md border border-white/20 bg-black/50 px-2 py-1.5"
                aria-label="Loại lá muốn lấy"
              >
                <option value="">— chọn lá —</option>
                {(needName === "discard" ? [...new Set(g?.discard ?? [])] : NAMEABLE_TYPES).map((t) => (
                  <option key={t} value={t}>
                    {CARDS[t].emoji} {CARDS[t].name}
                  </option>
                ))}
              </select>
            )}
            <Btn primary onClick={doPlay} disabled={!canPlay}>
              Đánh
            </Btn>
            <Btn onClick={() => void run({ type: "draw" })} disabled={!canDraw}>
              Rút bài
            </Btn>
            <Btn onClick={() => (setSelected([]), setTarget(null), setNamed(""))} disabled={!selected.length}>
              Bỏ chọn
            </Btn>
            {pending && meAlive && myNope && (
              <Btn danger onClick={() => void run({ type: "nope", card: myNope.id })}>
                🚫 Không!
              </Btn>
            )}
            <EmojiBar onSend={(e) => void act({ type: "emoji", emoji: e })} />
          </div>
        </div>
      )}
      {(spectator || hand.length === 0) && (
        <div className="flex justify-center">
          <EmojiBar onSend={(e) => void act({ type: "emoji", emoji: e })} />
        </div>
      )}

      {showGuide && <CardGuide enabled={g?.expansions ?? view.expansions} onClose={() => setShowGuide(false)} />}
      {showScores && <ScoreboardModal view={view} note={SCORE_NOTE} onClose={() => setShowScores(false)} />}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}

function Btn({ children, onClick, disabled, primary, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-w-[80px] rounded-lg px-4 py-2 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
        primary && "bg-amber-400 text-black enabled:hover:bg-amber-300",
        danger && "animate-pulse bg-red-600 text-white enabled:hover:bg-red-500",
        !primary && !danger && "border border-white/25 bg-black/25 enabled:hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function Seat({
  seat,
  self,
  isTurn,
  turnsLeft,
  deadline,
  now,
  reactions,
  selectable,
  selected,
  onSelect,
  onKick,
  turnMs = 30_000,
  claimedBy = [],
}: {
  seat: MeoSeatView;
  self?: boolean;
  isTurn: boolean;
  turnsLeft: number;
  deadline: number | null;
  now: number;
  reactions: Reaction[];
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onKick?: () => void;
  turnMs?: number;
  claimedBy?: string[];
}) {
  const left = deadline ? Math.min(1, Math.max(0, (deadline - now) / turnMs)) : 0;
  const Tag = selectable ? "button" : "div";
  return (
    <Tag
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "relative flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors",
        selectable && "cursor-pointer bg-amber-400/10 ring-1 ring-amber-300/50 hover:bg-amber-400/20",
        selected && "bg-amber-400/30 ring-2 ring-amber-300",
      )}
    >
      <span className="relative inline-flex">
        {isTurn && (
          <span
            className="absolute -inset-1 rounded-full"
            style={{
              background: `conic-gradient(${left < 0.27 ? "#f43f5e" : "#fbbf24"} ${left * 360}deg, transparent 0)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
            }}
          />
        )}
        <SeatBubble reactions={reactions} />
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-500 text-lg font-bold text-black",
            (!seat.connected || seat.kicked) && "opacity-50 grayscale",
            seat.out && "from-zinc-500 to-zinc-700",
          )}
        >
          {seat.out ? "💀" : seat.name.charAt(0).toUpperCase()}
        </span>
      </span>
      <span className="max-w-[6rem] truncate text-xs font-semibold">
        {seat.name}
        {self && " (bạn)"}
      </span>
      <span className="flex flex-wrap items-center justify-center gap-1 text-[11px]">
        {seat.isHost && <span title="Chủ bàn">👑</span>}
        {seat.inGame && !seat.out && <span className="rounded bg-black/40 px-1.5 font-mono">🂠 {seat.cardCount}</span>}
        {isTurn && turnsLeft > 1 && <span className="rounded bg-red-600/60 px-1.5">×{turnsLeft}</span>}
        {seat.out && <span className="rounded bg-zinc-700 px-1.5">Đã nổ</span>}
        {!seat.connected && !seat.kicked && <span className="rounded bg-rose-900/60 px-1.5 text-rose-200">Mất kết nối</span>}
        {seat.kicked && <span className="rounded bg-rose-900/60 px-1.5 text-rose-200">Bị kích</span>}
        {seat.cursed && (
          <span className="rounded bg-rose-500/40 px-1.5" title="Lời nguyền mông mèo: đang chơi bài úp">
            🍑 Bị nguyền
          </span>
        )}
        {claimedBy.map((n) => (
          <span key={n} className="rounded bg-teal-600/50 px-1.5" title={`Lá tiếp theo người này rút sẽ về tay ${n}`}>
            🫳 {n}
          </span>
        ))}
        {seat.games > 0 && <span className={cn("font-mono", seat.points > 0 ? "text-emerald-300" : seat.points < 0 ? "text-rose-300" : "")}>{signed(seat.points)}đ</span>}
      </span>
      {!!seat.marked?.length && (
        <span className="flex gap-0.5" title="Lá bị Đánh dấu — ai cũng thấy">
          {seat.marked.map((t, i) => (
            <MeoCard key={i} type={t} size="sm" className="!w-7" tooltip={false} />
          ))}
        </span>
      )}
      {onKick && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onKick();
          }}
          className="rounded bg-rose-600 px-1.5 text-[11px] font-semibold text-white hover:bg-rose-500"
        >
          Kích
        </span>
      )}
    </Tag>
  );
}

const PENDING_LABEL: Record<string, string> = { pair: "đôi mèo", triple: "bộ ba mèo", five: "5 lá khác nhau" };

function PendingBar({
  pending,
  nameOf,
  secondsLeft,
  canNope,
  onNope,
}: {
  pending: NonNullable<NonNullable<MeoRoomView["current"]>["pending"]>;
  nameOf: (id: string) => string;
  secondsLeft: number;
  canNope: boolean;
  onNope: () => void;
}) {
  const label = PENDING_LABEL[pending.kind] ?? cardName(pending.kind as CardType);
  const blocked = pending.nopes % 2 === 1;
  return (
    <div className="w-full max-w-md rounded-xl border border-red-400/40 bg-black/50 p-3 text-center">
      <p className="text-sm">
        <b>{nameOf(pending.by)}</b> đánh <b className="text-amber-200">{label}</b>
        {pending.target && (
          <>
            {" "}
            → <b>{nameOf(pending.target)}</b>
          </>
        )}
        {pending.named && <> (đòi {cardName(pending.named)})</>}
      </p>
      <p className={cn("mt-1 text-sm font-bold", blocked ? "text-red-300" : "text-emerald-300")}>
        {pending.nopes === 0 ? "Chưa ai chặn" : blocked ? `Đang bị chặn (×${pending.nopes})` : `Đã được gỡ chặn (×${pending.nopes})`}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          key={pending.deadline}
          className="h-full bg-red-500"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: Math.max(secondsLeft, 0.1), ease: "linear" }}
        />
      </div>
      <p className="mt-1 text-xs text-orange-100/60">Còn {secondsLeft}s để đánh “Không!”</p>
      {canNope && (
        <button onClick={onNope} className="mt-2 animate-pulse rounded-lg bg-red-600 px-5 py-2 font-black text-white hover:bg-red-500">
          🚫 KHÔNG!
        </button>
      )}
    </div>
  );
}

function ChoicePanel({
  view,
  choice,
  nameOf,
  secondsLeft,
  run,
  selected,
}: {
  view: MeoRoomView;
  choice: NonNullable<NonNullable<MeoRoomView["current"]>["choice"]>;
  nameOf: (id: string) => string;
  secondsLeft: number;
  run: (msg: Record<string, unknown> & { type: string }) => Promise<boolean>;
  selected: number[];
}) {
  const deckCount = view.current?.deckCount ?? 0;
  // Not in the top / bottom 10% of the deck (anywhere if the deck is tiny).
  const [minPos, maxPos] = insertRange(deckCount);
  const [pos, setPos] = useState(minPos);
  const safePos = Math.min(maxPos, Math.max(minPos, pos));
  const [order, setOrder] = useState<MCard[]>(view.alter ?? []);
  useEffect(() => setOrder(view.alter ?? []), [view.alter?.map((c) => c.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = choice.kind === "favor" ? choice.from === view.meId : choice.player === view.meId;
  const timer = <span className="text-orange-100/60"> · {secondsLeft}s</span>;

  if (!mine) {
    const who = choice.kind === "favor" ? choice.from : choice.player;
    const what =
      choice.kind === "favor"
        ? `đang chọn 1 lá để đưa cho ${nameOf(choice.to)}`
        : choice.kind === "offer"
          ? choice.mode === "potluck"
            ? "đang chọn 1 lá góp lên đầu chồng bài"
            : "đang chọn 1 lá bỏ vào chồng bài"
          : choice.kind === "bury"
            ? "đang chôn lá trên cùng vào chồng bài"
        : choice.kind === "alter"
          ? "đang sắp xếp lại tương lai"
          : choice.kind === "implode"
            ? "đang đặt Mèo Tự Huỷ (ngửa) vào chồng bài"
            : "đang bí mật nhét Mèo Nổ vào chồng bài";
    return (
      <p className="rounded-xl bg-black/40 px-3 py-2 text-sm">
        <b>{nameOf(who)}</b> {what}…{timer}
      </p>
    );
  }

  if (choice.kind === "favor") {
    return (
      <div className="rounded-xl border border-amber-300/40 bg-black/50 p-3 text-center text-sm">
        <p>
          🙏 <b>{nameOf(choice.to)}</b> xin bạn 1 lá — chọn 1 lá trên tay rồi bấm Đưa{timer}
        </p>
        <button
          disabled={selected.length !== 1}
          onClick={() => void run({ type: "give", card: selected[0] })}
          className="mt-2 rounded-lg bg-amber-400 px-4 py-1.5 font-semibold text-black disabled:opacity-40"
        >
          Đưa lá đã chọn
        </button>
      </div>
    );
  }

  if (choice.kind === "offer") {
    return (
      <div className="rounded-xl border border-amber-300/40 bg-black/50 p-3 text-center text-sm">
        <p>
          {choice.mode === "potluck" ? "🍲 Góp nồi — chọn 1 lá đặt lên đầu chồng bài" : "🗑️ Dọn rác — chọn 1 lá bỏ vào chồng bài (sẽ được xáo)"}
          {timer}
        </p>
        <button
          disabled={selected.length !== 1}
          onClick={() => void run({ type: "give", card: selected[0] })}
          className="mt-2 rounded-lg bg-amber-400 px-4 py-1.5 font-semibold text-black disabled:opacity-40"
        >
          {choice.mode === "potluck" ? "Góp lá đã chọn" : "Bỏ lá đã chọn"}
        </button>
      </div>
    );
  }

  if (choice.kind === "bury") {
    const buryPos = Math.min(deckCount, Math.max(0, pos));
    return (
      <div className="w-full max-w-md rounded-xl border border-zinc-300/40 bg-black/50 p-3 text-center text-sm">
        <p>
          ⚰️ Chôn lá trên cùng (không ai biết là lá gì) vào đâu?{timer}
        </p>
        <input type="range" min={0} max={deckCount} value={buryPos} onChange={(e) => setPos(Number(e.target.value))} className="mt-2 w-full accent-amber-400" aria-label="Vị trí chôn" />
        <p className="text-amber-200">
          {buryPos === 0 ? "Trên cùng" : buryPos === deckCount ? "Dưới cùng" : `Lá thứ ${buryPos + 1}`} <span className="text-xs text-orange-100/50">/ {deckCount + 1} lá</span>
        </p>
        <button onClick={() => void run({ type: "insert", position: buryPos })} className="mt-2 rounded-md bg-amber-400 px-3 py-1 font-semibold text-black">
          Chôn ở đây
        </button>
      </div>
    );
  }

  if (choice.kind === "alter") {
    const move = (i: number, d: number) =>
      setOrder((o) => {
        const a = o.slice();
        const j = i + d;
        if (j < 0 || j >= a.length) return a;
        [a[i], a[j]] = [a[j], a[i]];
        return a;
      });
    return (
      <div className="rounded-xl border border-purple-300/40 bg-black/50 p-3 text-center text-sm">
        <p className="mb-2">
          🪄 Sắp xếp lại tương lai (trái = lá trên cùng){"share" in choice && choice.share ? " — người kế tiếp sẽ được xem" : ""}
          {timer}
        </p>
        <div className="flex justify-center gap-3">
          {order.map((c, i) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <MeoCard type={c.type} size="sm" />
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-white/10 px-1.5 disabled:opacity-30">
                  ◀
                </button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="rounded bg-white/10 px-1.5 disabled:opacity-30">
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => void run({ type: "alter", order: order.map((c) => c.id) })} className="mt-2 rounded-lg bg-amber-400 px-4 py-1.5 font-semibold text-black">
          Xong
        </button>
      </div>
    );
  }

  // Hide a kitten: defuse (secret) or imploding (face up).
  const label = (i: number) => (i === 0 ? "Trên cùng" : i === deckCount ? "Dưới cùng" : `Lá thứ ${i + 1}`);
  const limited = minPos > 0;
  return (
    <div className="w-full max-w-md rounded-xl border border-emerald-300/40 bg-black/50 p-3 text-center text-sm">
      <p>
        {choice.kind === "implode" ? "🌀 Đặt Mèo Tự Huỷ (ngửa, ai cũng thấy) vào đâu?" : "🧯 Gỡ bom thành công! Bí mật nhét Mèo Nổ vào đâu?"}
        {timer}
      </p>
      <input
        type="range"
        min={minPos}
        max={maxPos}
        value={safePos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-2 w-full accent-amber-400"
        aria-label="Vị trí"
      />
      <p className="text-amber-200">
        {label(safePos)} <span className="text-xs text-orange-100/50">/ {deckCount} lá</span>
      </p>
      {limited && (
        <p className="text-xs text-orange-100/60">
          Không được nhét vào 10% trên cùng / dưới cùng — chọn từ lá thứ {minPos + 1} đến lá thứ {maxPos + 1}.
        </p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button onClick={() => void run({ type: "insert", position: minPos })} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10">
          {limited ? "Cao nhất" : "Trên cùng"}
        </button>
        <button
          onClick={() => void run({ type: "insert", position: minPos + Math.floor(Math.random() * (maxPos - minPos + 1)) })}
          className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
        >
          Ngẫu nhiên
        </button>
        <button onClick={() => void run({ type: "insert", position: maxPos })} className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10">
          {limited ? "Thấp nhất" : "Dưới cùng"}
        </button>
        <button onClick={() => void run({ type: "insert", position: safePos })} className="rounded-md bg-amber-400 px-3 py-1 font-semibold text-black">
          Nhét vào {label(safePos).toLowerCase()}
        </button>
      </div>
    </div>
  );
}

function Waiting({
  view,
  me,
  act,
  nameOf,
}: {
  view: MeoRoomView;
  me: MeoSeatView | null;
  act: (msg: Record<string, unknown> & { type: string }) => Promise<boolean>;
  nameOf: (id: string) => string;
}) {
  const g = view.current;
  const count = view.seats.filter(Boolean).length;
  const ended = g?.status === "ended";
  const last = view.history[view.history.length - 1];
  const isHost = !!me?.isHost && view.role === "player";
  const settings = view.settings ?? DEFAULT_MEO_SETTINGS;
  const toggle = (e: Expansion) =>
    void act({ type: "settings", expansions: view.expansions.includes(e) ? view.expansions.filter((x) => x !== e) : [...view.expansions, e] });

  return (
    <div className="w-full max-w-md rounded-2xl bg-black/45 p-4 backdrop-blur-sm">
      {ended && g ? (
        <>
          <h2 className="mb-2 text-lg font-bold text-amber-300">🏁 {nameOf(g.finished[0])} sống sót cuối cùng!</h2>
          <ol className="mb-3 space-y-1 text-sm">
            {g.finished.map((id, i) => (
              <li key={id} className="flex items-center justify-between">
                <span>
                  <b className="mr-2 text-amber-300">#{i + 1}</b>
                  {i === 0 ? "😼 " : "💥 "}
                  {nameOf(id)}
                  {id === view.meId && " (bạn)"}
                </span>
                {last?.results.find((r) => r.id === id) && <DeltaBadge delta={last.results.find((r) => r.id === id)!.delta} />}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <h2 className="mb-1 text-lg font-bold text-amber-300">😼 Mèo Nổ</h2>
          <p className="mb-3 text-sm text-orange-100/80">
            {count}/{view.maxPlayers} người · gửi link mời để bạn bè vào bàn
          </p>
        </>
      )}

      <div className="mb-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-100/60">Gói mở rộng</p>
        {EXPANSIONS.map((e) => {
          const on = view.expansions.includes(e);
          return (
            <label
              key={e}
              className={cn(
                "flex items-start gap-2 rounded-lg p-2 text-sm",
                on ? "bg-amber-400/15 ring-1 ring-amber-300/50" : "bg-white/5",
                isHost ? "cursor-pointer" : "cursor-default",
              )}
            >
              <input type="checkbox" checked={on} disabled={!isHost} onChange={() => toggle(e)} className="mt-1 accent-amber-400" />
              <span>
                <b>
                  {PACKS[e].emoji} {PACKS[e].name}
                </b>
                <span className="block text-xs text-orange-100/60">{PACKS[e].blurb}</span>
              </span>
            </label>
          );
        })}
        {!isHost && <p className="text-xs text-orange-100/50">Chỉ chủ bàn chọn được gói mở rộng.</p>}
      </div>

      <div className="mb-3 space-y-2 rounded-lg bg-white/5 p-2 text-xs">
        <p className="font-semibold uppercase tracking-wide text-orange-100/60">Luật bàn</p>
        <label className="flex items-center justify-between gap-2">
          <span>Thời gian mỗi lượt</span>
          <select
            value={settings.turnSeconds}
            disabled={!isHost}
            onChange={(e) => void act({ type: "settings", turnSeconds: Number(e.target.value) })}
            className="rounded bg-black/40 px-1 py-0.5"
          >
            {TURN_SECONDS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v} giây
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Thời gian bấm “Không!”</span>
          <select
            value={settings.nopeSeconds}
            disabled={!isHost}
            onChange={(e) => void act({ type: "settings", nopeSeconds: Number(e.target.value) })}
            className="rounded bg-black/40 px-1 py-0.5"
          >
            {NOPE_SECONDS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {String(v).replace(".", ",")} giây
              </option>
            ))}
          </select>
        </label>
        <RankPointsPicker
          first={settings.first}
          second={settings.second}
          players={count}
          editable={isHost}
          onChange={(v) => void act({ type: "settings", ...v })}
        />
      </div>

      {isHost ? (
        <button
          onClick={() => void act({ type: "start" })}
          disabled={count < 2}
          className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {count < 2 ? "Cần ít nhất 2 người" : ended ? "Ván mới" : "Bắt đầu"}
        </button>
      ) : (
        <p className="text-sm text-orange-100/70">{view.role === "spectator" ? "Chờ ván mới…" : "Chờ chủ bàn bắt đầu…"}</p>
      )}
    </div>
  );
}

function BoomOverlay({ fx }: { fx: BoomFx | null }) {
  return (
    <AnimatePresence>
      {fx && (
        <motion.div
          key={fx.id}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {fx.tone === "boom" && (
            <motion.div
              className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle,rgba(251,146,60,0.8)_0%,rgba(220,38,38,0.4)_40%,transparent_75%)]"
              animate={{ opacity: [0, 1, 0.3, 0.8, 0] }}
              transition={{ duration: 1.8 }}
            />
          )}
          <motion.div
            className={cn(
              "relative text-center font-black drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
              fx.tone === "boom" ? "text-6xl text-orange-300 sm:text-8xl" : fx.tone === "defuse" ? "text-5xl text-emerald-300" : "text-5xl text-red-400",
            )}
            initial={{ scale: 3, opacity: 0, rotate: -10 }}
            animate={{ scale: [3, 0.9, 1.1, 1], opacity: 1, rotate: [-10, 5, -2, 0] }}
            transition={{ duration: 0.5 }}
          >
            {fx.tone === "boom" ? "💥 BÙM!" : fx.tone === "defuse" ? "🧯 PHÙ!" : "🚫 KHÔNG!"}
          </motion.div>
          <motion.p className="relative mt-2 max-w-sm rounded-full bg-black/60 px-3 py-1 text-center text-sm text-white" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
            {fx.text}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
