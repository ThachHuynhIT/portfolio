"use client";

import { useState } from "react";
import { CARDS, type CardType } from "@/lib/meono/cards";
import type { MeoPlay } from "@/lib/meono/protocol";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = { pair: "Đôi mèo", triple: "Bộ ba mèo", five: "5 lá khác nhau" };

const RESULT: Record<MeoPlay["result"], { text: string; className: string }> = {
  pending: { text: "⏳ chờ Không!", className: "bg-amber-400/20 text-amber-100" },
  done: { text: "✅ có hiệu lực", className: "bg-emerald-500/20 text-emerald-100" },
  blocked: { text: "🚫 bị chặn", className: "bg-rose-500/25 text-rose-100" },
};

const clock = (at: number) => new Date(at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** A card as a small coloured chip; clicking it shows what it does. */
function CardChip({ type, active, onClick }: { type: CardType; active: boolean; onClick: () => void }) {
  const info = CARDS[type];
  return (
    <button
      onClick={onClick}
      title={info ? `${info.name}: ${info.effect}` : type}
      className={cn(
        "flex items-center gap-1 rounded-md bg-gradient-to-br px-1.5 py-0.5 text-[11px] font-bold text-white shadow",
        info?.color,
        active ? "ring-2 ring-amber-300" : "hover:brightness-110",
      )}
    >
      <span>{info?.emoji}</span>
      <span className="max-w-[7rem] truncate">{info?.name ?? type}</span>
    </button>
  );
}

/** Every card played this game, newest first: who played what, at whom, who said Không! and how it ended. */
export function PlayHistory({ plays, nameOf, meId, className }: { plays: MeoPlay[]; nameOf: (id: string) => string; meId: string; className?: string }) {
  const [focus, setFocus] = useState<{ play: number; type: CardType } | null>(null);
  const info = focus ? CARDS[focus.type] : null;
  const who = (id: string) => (id === meId ? "Bạn" : nameOf(id));

  if (!plays.length) return <p className="text-sm text-orange-100/50">Chưa ai đánh lá nào.</p>;
  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      {info && focus && (
        <div className="rounded-lg border border-amber-300/30 bg-black/40 p-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-amber-200">
              {info.emoji} {info.name}
            </p>
            <button onClick={() => setFocus(null)} className="rounded px-1 text-orange-100/60 hover:bg-white/10" aria-label="Đóng">
              ✕
            </button>
          </div>
          <p className="mt-0.5 text-orange-100/60">
            <b>Khi nào:</b> {info.how}
          </p>
          <p className="mt-0.5 text-orange-50">{info.effect}</p>
        </div>
      )}
      <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {plays
          .slice()
          .reverse()
          .map((p) => {
            const combo = KIND_LABEL[p.kind];
            const result = RESULT[p.result];
            return (
              <li key={p.id} className={cn("rounded-lg border border-white/5 bg-white/5 px-2 py-1.5", p.result === "blocked" && "opacity-75")}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">
                    <b className="text-orange-50">{who(p.by)}</b>
                    {combo && <span className="text-orange-100/60"> · {combo}</span>}
                    {p.target && (
                      <>
                        {" "}
                        → 🎯 <b>{who(p.target)}</b>
                      </>
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] text-orange-100/40">{clock(p.at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {p.cards.map((t, i) => (
                    <CardChip key={i} type={t} active={focus?.play === p.id && focus.type === t} onClick={() => setFocus({ play: p.id, type: t })} />
                  ))}
                  {p.named && (
                    <span className="flex items-center gap-1 text-[11px] text-orange-100/70">
                      đòi <CardChip type={p.named} active={focus?.play === p.id && focus.type === p.named} onClick={() => setFocus({ play: p.id, type: p.named! })} />
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                  <span className={cn("rounded-full px-1.5 py-0.5", result.className)}>{result.text}</span>
                  {p.nopes.map((id, i) => (
                    <span key={i} className="rounded-full bg-red-900/50 px-1.5 py-0.5 text-red-100">
                      🚫 {who(id)}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
      </ol>
      <p className="text-[10px] text-orange-100/40">Bấm vào lá để xem chức năng.</p>
    </div>
  );
}
