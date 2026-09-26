"use client";

import { useEffect, useRef } from "react";
import { type TLMove, comboName, detectCombo } from "@/lib/tienlen";
import { cn } from "@/lib/utils";
import { PlayingCard } from "./PlayingCard";
import { rankTitle } from "./Scoreboard";

/**
 * Everything played in the current game, from the first card, grouped by round.
 * be_game keeps the whole game and starts a fresh list with each new game.
 */
export function MoveHistory({ moves, nameOf, meId, onClose }: { moves: TLMove[]; nameOf: (id: string) => string; meId: string; onClose: () => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [moves.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Split into rounds: a "round" entry starts the next one.
  const rounds: TLMove[][] = [[]];
  for (const m of moves) {
    if (m.kind === "round") rounds.push([m]);
    else rounds[rounds.length - 1].push(m);
  }
  const who = (id: string) => (id === meId ? "Bạn" : nameOf(id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Lịch sử ván"
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-emerald-200/15 bg-[#0b2a1c] text-emerald-50 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-bold text-amber-300">📜 Lịch sử ván này</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 hover:bg-white/10" aria-label="Đóng">
            ✕
          </button>
        </div>
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {!moves.length && <p className="text-sm text-emerald-100/60">Chưa ai đánh lá nào.</p>}
          {rounds.map((round, i) =>
            round.length ? (
              <section key={i} className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/50">
                  Vòng {i + 1}
                  {round[0].kind === "round" && ` · ${who(round[0].player)} mở`}
                </p>
                <ul className="space-y-1">
                  {round
                    .filter((m) => m.kind !== "round")
                    .map((m) => (
                      <li key={m.id} className={cn("flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 text-sm", m.player === meId ? "bg-amber-400/10" : "bg-black/20")}>
                        <b className="min-w-[4.5rem] truncate">{who(m.player)}</b>
                        {m.kind === "play" && m.cards && (
                          <>
                            <span className="flex">
                              {m.cards.map((c, k) => (
                                <PlayingCard key={c} card={c} size="sm" className="!w-8 !text-[10px]" style={k ? { marginLeft: "-0.6rem" } : undefined} />
                              ))}
                            </span>
                            <span className="text-emerald-100/70">{(() => {
                              const combo = detectCombo(m.cards);
                              return combo ? comboName(combo) : "";
                            })()}</span>
                            {m.chop && <span className="font-black text-rose-400">CHẶT!{m.chopPoints ? ` +${m.chopPoints}đ` : ""}</span>}
                          </>
                        )}
                        {m.kind === "pass" && <span className="text-emerald-100/60">bỏ lượt{m.auto && " (tự bỏ — không chặn được)"}</span>}
                        {m.kind === "out" && <span className="font-semibold text-amber-300">🏁 về {rankTitle(m.rank ?? 0, Infinity)}</span>}
                        {m.kind === "burned" && <span className="font-semibold text-orange-400">🔥 chết cháy</span>}
                        {m.kind === "forfeit" && <span className="text-rose-300">bị kích khỏi ván</span>}
                      </li>
                    ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
