"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type Card,
  type RoomView,
  type SeatView,
  INSTANT_WIN_NAMES,
  TURN_SECONDS,
  canBeat,
  cardLabel,
  comboName,
  detectCombo,
  rankOf,
  suitOf,
} from "@/lib/tienlen";
import { cn } from "@/lib/utils";
import { CardBack, PlayingCard } from "./PlayingCard";
import { inviteLink, useTienLenRoom } from "./useTienLen";

const RANK_TITLES = ["Nhất", "Nhì", "Ba"];
/** Ranking label; whoever finishes last is always "Bét". */
const rankTitle = (i: number, total: number) => (i === total - 1 ? "Bét" : RANK_TITLES[i] ?? String(i + 1));

type SortMode = "rank" | "suit";

function sortHand(hand: Card[], mode: SortMode) {
  const h = hand.slice();
  return mode === "rank" ? h.sort((a, b) => a - b) : h.sort((a, b) => suitOf(a) - suitOf(b) || rankOf(a) - rankOf(b));
}

/** Remaining seconds of the current turn, ticking locally. */
function useCountdown(deadline: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);
  return deadline ? Math.max(0, (deadline - now) / 1000) : null;
}

export default function TienLenTable({ code, name }: { code: string; name: string }) {
  const { view, status, error, play, pass, start } = useTienLenRoom(code, name);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  if (status === "error") {
    return (
      <CenterMessage>
        <p className="text-lg text-rose-300">{error}</p>
        <Link href="/tien-len" className="mt-4 inline-block rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
          Về sảnh
        </Link>
      </CenterMessage>
    );
  }
  if (!view) {
    return (
      <CenterMessage>
        <p className="animate-pulse text-emerald-100/80">Đang kết nối phòng {code}…</p>
      </CenterMessage>
    );
  }

  const act = async (p: Promise<{ ok: boolean; error?: string }>) => {
    const res = await p;
    if (!res.ok && res.error) setToast(res.error);
    return res.ok;
  };

  return (
    <Table
      view={view}
      reconnecting={status === "reconnecting"}
      onPlay={(cards) => act(play(cards))}
      onPass={() => act(pass())}
      onStart={() => act(start())}
      toast={toast}
    />
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">{children}</div>;
}

interface TableProps {
  view: RoomView;
  reconnecting: boolean;
  onPlay: (cards: Card[]) => Promise<boolean>;
  onPass: () => Promise<boolean>;
  onStart: () => Promise<boolean>;
  toast: string | null;
}

function Table({ view, reconnecting, onPlay, onPass, onStart, toast }: TableProps) {
  const { seats, game, meId } = view;
  const me = seats.find((s) => s?.id === meId) ?? null;
  const myIndex = seats.findIndex((s) => s?.id === meId);
  // Turn order goes counter-clockwise: next player sits on my right, then top, then left.
  const at = (offset: number) => seats[(myIndex + offset) % 4] ?? null;
  const nameOf = (id: string) => seats.find((s) => s?.id === id)?.name ?? "?";

  const [selected, setSelected] = useState<Card[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("rank");
  const [busy, setBusy] = useState(false);

  // Drop selections for cards that are no longer in hand.
  const handKey = view.hand.join(",");
  useEffect(() => {
    setSelected((sel) => sel.filter((c) => view.hand.includes(c)));
  }, [handKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const hand = useMemo(() => sortHand(view.hand, sortMode), [view.hand, sortMode]);
  const playing = game?.status === "playing";
  const myTurn = playing && game.turn === meId;
  const lastCombo = game?.lastPlay?.combo ?? null;

  const selectedCombo = selected.length ? detectCombo(selected) : null;
  const playError = !selected.length
    ? null
    : !selectedCombo
      ? "Bộ không hợp lệ"
      : game?.mustInclude != null && !selected.includes(game.mustInclude)
        ? `Phải đánh kèm ${cardLabel(game.mustInclude)}`
        : !canBeat(lastCombo, selectedCombo)
          ? "Không chặn được"
          : null;
  const canPlay = myTurn && !!selectedCombo && !playError && !busy;
  const canPass = myTurn && !!lastCombo && !busy;

  const toggle = (c: Card) => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const doPlay = async () => {
    setBusy(true);
    if (await onPlay(selected)) setSelected([]);
    setBusy(false);
  };
  const doPass = async () => {
    setBusy(true);
    await onPass();
    setSelected([]);
    setBusy(false);
  };

  const inviteUrl = typeof window !== "undefined" ? inviteLink(view.code) : "";
  const [copied, setCopied] = useState(false);
  const copyInvite = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        // Plain http://<ip> pages have no async clipboard API.
        const ta = document.createElement("textarea");
        ta.value = inviteUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("copy failed");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Chép link mời:", inviteUrl);
    }
  };

  const seatProps = (s: SeatView | null) => ({
    seat: s,
    isTurn: !!s && playing && game?.turn === s.id,
    deadline: game?.turnDeadline ?? null,
    // Mid-game nobody is "Bét" yet; once the game ends, the last finisher is.
    rankLabel:
      s && game && game.finished.includes(s.id)
        ? rankTitle(game.finished.indexOf(s.id), game.status === "ended" ? game.finished.length : Infinity)
        : null,
    gameEnded: game?.status === "ended",
  });

  return (
    <div
      className="tl-root relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-3 pb-3 pt-16 sm:px-4"
      style={
        {
          "--cw": "clamp(44px, 9.5vw, 78px)",
          "--cw-sm": "clamp(30px, 6vw, 48px)",
          "--cw-back": "clamp(16px, 3.2vw, 26px)",
        } as React.CSSProperties
      }
    >
      {/* Room bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-emerald-100/60">Phòng</span>
          <span className="rounded-md bg-black/30 px-2 py-1 font-mono text-base font-bold tracking-[0.2em] text-amber-300">
            {view.code}
          </span>
          <button
            onClick={copyInvite}
            className="rounded-md border border-emerald-200/20 px-2 py-1 text-emerald-50 transition-colors hover:bg-white/10"
          >
            {copied ? "Đã chép link ✓" : "Chép link mời"}
          </button>
        </div>
        {reconnecting && <span className="animate-pulse text-amber-300">Đang kết nối lại…</span>}
      </div>

      {/* Felt table */}
      <div className="relative grid flex-1 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr] gap-2 rounded-[2rem] border-[6px] border-[#5b3a1e] bg-[radial-gradient(ellipse_at_center,#1f7a4d_0%,#145c39_55%,#0d3f27_100%)] p-3 shadow-[inset_0_0_60px_rgba(0,0,0,0.5),0_20px_40px_rgba(0,0,0,0.5)] sm:p-5">
        <div className="col-span-3 flex justify-center">
          <Opponent {...seatProps(at(2))} />
        </div>
        <div className="flex items-center">
          <Opponent {...seatProps(at(3))} vertical />
        </div>

        {/* Center: last play / lobby */}
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center">
          {!game || game.status === "ended" ? (
            <WaitingPanel view={view} me={me} onStart={onStart} nameOf={nameOf} />
          ) : game.lastPlay ? (
            <>
              <div className="flex">
                {game.lastPlay.combo.cards.map((c, i) => (
                  <PlayingCard key={c} card={c} size="sm" style={i ? { marginLeft: "calc(var(--cw-sm) * -0.35)" } : undefined} />
                ))}
              </div>
              <p className="text-sm text-emerald-50/90">
                <b>{nameOf(game.lastPlay.playerId)}</b> · {comboName(game.lastPlay.combo)}
                {game.lastPlay.chop && <span className="ml-2 font-black text-rose-400">CHẶT!</span>}
              </p>
            </>
          ) : (
            <p className="text-emerald-50/80">
              {game.turn === meId ? "Bạn" : <b>{nameOf(game.turn ?? "")}</b>} mở vòng mới
              {game.mustInclude != null && ` (phải có ${cardLabel(game.mustInclude)})`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Opponent {...seatProps(at(1))} vertical />
        </div>
      </div>

      {/* My area */}
      <div className="mt-3 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-sm text-emerald-50">
          <SeatBadge {...seatProps(me)} self />
          {myTurn && (
            <span className="font-semibold text-amber-300">
              Lượt của bạn{playError ? ` — ${playError}` : selectedCombo ? ` — ${comboName(selectedCombo)}` : ""}
            </span>
          )}
          {playing && me && !me.inGame && <span className="text-emerald-100/60">Bạn sẽ vào ván sau</span>}
        </div>

        {hand.length > 0 && (
          <div className="flex w-full justify-center overflow-visible pt-5">
            {hand.map((c, i) => (
              <PlayingCard
                key={c}
                card={c}
                selected={selected.includes(c)}
                onClick={() => toggle(c)}
                style={i ? { marginLeft: "calc(var(--cw) * var(--overlap))" } : undefined}
                className="[--overlap:-0.42] sm:[--overlap:-0.3]"
              />
            ))}
          </div>
        )}

        {hand.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <ActionButton onClick={doPlay} disabled={!canPlay} primary>
              Đánh
            </ActionButton>
            <ActionButton onClick={doPass} disabled={!canPass}>
              Bỏ lượt
            </ActionButton>
            <ActionButton onClick={() => setSelected([])} disabled={!selected.length}>
              Bỏ chọn
            </ActionButton>
            <ActionButton onClick={() => setSortMode((m) => (m === "rank" ? "suit" : "rank"))}>
              Xếp: {sortMode === "rank" ? "số" : "chất"}
            </ActionButton>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-w-[84px] rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.35)] enabled:hover:bg-amber-300"
          : "border border-emerald-200/25 bg-black/25 text-emerald-50 enabled:hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

interface SeatDisplayProps {
  seat: SeatView | null;
  isTurn: boolean;
  deadline: number | null;
  rankLabel: string | null;
  gameEnded: boolean;
}

function TurnRing({ deadline }: { deadline: number | null }) {
  const left = useCountdown(deadline);
  if (left == null) return null;
  const pct = Math.min(1, left / TURN_SECONDS);
  return (
    <span
      className="absolute -inset-1 rounded-full"
      style={{
        background: `conic-gradient(${left < 8 ? "#f43f5e" : "#fbbf24"} ${pct * 360}deg, transparent 0)`,
        mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
      }}
    />
  );
}

function Avatar({ seat, isTurn, deadline }: { seat: SeatView; isTurn: boolean; deadline: number | null }) {
  return (
    <span className="relative inline-flex">
      {isTurn && <TurnRing deadline={deadline} />}
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500 text-base font-bold text-black sm:h-12 sm:w-12",
          !seat.connected && "grayscale opacity-50",
        )}
      >
        {seat.name.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

function StatusTags({ seat, rankLabel, gameEnded }: { seat: SeatView; rankLabel: string | null; gameEnded: boolean }) {
  return (
    <span className="flex flex-wrap items-center justify-center gap-1 text-[11px]">
      {seat.isHost && <span title="Chủ phòng">👑</span>}
      {rankLabel && <span className="rounded bg-amber-400 px-1.5 font-bold text-black">{rankLabel}</span>}
      {!gameEnded && seat.passed && <span className="rounded bg-black/40 px-1.5 text-emerald-100/80">Bỏ lượt</span>}
      {!seat.connected && <span className="rounded bg-rose-900/60 px-1.5 text-rose-200">Mất kết nối</span>}
      {seat.wins > 0 && <span className="text-emerald-100/60">{seat.wins} thắng</span>}
    </span>
  );
}

function Opponent({ seat, isTurn, deadline, rankLabel, gameEnded, vertical }: SeatDisplayProps & { vertical?: boolean }) {
  if (!seat) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-100/20 text-xs text-emerald-100/40">
        Trống
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-2", vertical ? "flex-col" : "flex-row")}>
      <div className="flex flex-col items-center gap-1">
        <Avatar seat={seat} isTurn={isTurn} deadline={deadline} />
        <span className="max-w-[88px] truncate text-xs font-medium text-emerald-50 sm:text-sm">{seat.name}</span>
        <StatusTags seat={seat} rankLabel={rankLabel} gameEnded={gameEnded} />
      </div>
      {seat.inGame && seat.cardCount > 0 && (
        <div className="flex items-center gap-1">
          <div className="relative">
            <CardBack />
            <CardBack className="absolute left-1 top-1" />
          </div>
          <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-amber-200">{seat.cardCount}</span>
        </div>
      )}
    </div>
  );
}

function SeatBadge({ seat, isTurn, deadline, rankLabel, gameEnded }: SeatDisplayProps & { self?: boolean }) {
  if (!seat) return null;
  return (
    <span className="flex items-center gap-2">
      <Avatar seat={seat} isTurn={isTurn} deadline={deadline} />
      <span className="flex flex-col items-start">
        <span className="font-medium">{seat.name} (bạn)</span>
        <StatusTags seat={seat} rankLabel={rankLabel} gameEnded={gameEnded} />
      </span>
    </span>
  );
}

function WaitingPanel({
  view,
  me,
  onStart,
  nameOf,
}: {
  view: RoomView;
  me: SeatView | null;
  onStart: () => Promise<boolean>;
  nameOf: (id: string) => string;
}) {
  const { game } = view;
  const count = view.seats.filter(Boolean).length;
  const ended = game?.status === "ended";

  return (
    <div className="w-full max-w-xs rounded-2xl bg-black/35 p-4 backdrop-blur-sm">
      {ended && game ? (
        <>
          <h2 className="mb-2 text-lg font-bold text-amber-300">
            {game.instantWin
              ? `${nameOf(game.instantWin.playerId)} tới trắng — ${INSTANT_WIN_NAMES[game.instantWin.reason]}!`
              : "Kết quả ván"}
          </h2>
          <ol className="mb-3 space-y-1 text-left text-sm">
            {game.finished.map((id, i) => (
              <li key={id} className="flex justify-between gap-4 text-emerald-50">
                <span>
                  <b className="mr-2 text-amber-300">{rankTitle(i, game.finished.length)}</b>
                  {nameOf(id)}
                </span>
                {id === view.meId && <span className="text-emerald-100/60">bạn</span>}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <h2 className="mb-1 text-lg font-bold text-amber-300">Tiến Lên Miền Nam</h2>
          <p className="mb-3 text-sm text-emerald-50/80">
            {count}/4 người · gửi link mời để bạn bè vào phòng
          </p>
        </>
      )}
      {me?.isHost ? (
        <button
          onClick={onStart}
          disabled={count < 2}
          className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {count < 2 ? "Cần ít nhất 2 người" : ended ? "Ván mới" : "Bắt đầu"}
        </button>
      ) : (
        <p className="text-sm text-emerald-100/70">Chờ chủ phòng bắt đầu…</p>
      )}
    </div>
  );
}
