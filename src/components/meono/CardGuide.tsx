"use client";

import { useState } from "react";
import { CARDS, type CardType, type Expansion, PACKS, type Pack } from "@/lib/meono/cards";
import { cn } from "@/lib/utils";
import { MeoCard } from "./MeoCard";

/** How a turn works, in short. */
export function MeoRules() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-50/85">
      <li>Mỗi người bắt đầu với 7 lá + 1 lá Gỡ bom. Chồng bài có (số người − 1) quả Mèo Nổ.</li>
      <li>
        Đến lượt: đánh <b>bao nhiêu lá tuỳ thích</b> (hoặc không đánh), rồi <b>rút 1 lá</b> để kết thúc lượt.
      </li>
      <li>Rút phải Mèo Nổ mà không có Gỡ bom là bị loại. Người cuối cùng còn sống thắng.</li>
      <li>Sau mỗi lá hành động, mọi người có vài giây để đánh “Không!” chặn lại.</li>
      <li>Lá mèo đánh theo đôi (cướp ngẫu nhiên 1 lá) hoặc bộ ba (gọi tên lá muốn lấy). 5 lá khác loại: nhặt 1 lá tuỳ chọn từ chồng đã đánh.</li>
      <li>Hết 30 giây mà chưa rút, hệ thống tự rút giúp bạn.</li>
      <li>Điểm theo thứ hạng (ai bị loại trước xếp sau): chủ bàn chọn điểm Nhất / Nhì (mặc định +2/+1), người cuối và áp chót bị trừ tương ứng, các hạng giữa 0 điểm — tổng luôn bằng 0.</li>
    </ul>
  );
}

/** Card-by-card guide, grouped by pack. `enabled` highlights the packs in play. */
export function CardGuide({ enabled, onClose }: { enabled?: Expansion[]; onClose: () => void }) {
  const [focus, setFocus] = useState<CardType | null>(null);
  const packs: Pack[] = ["base", "imploding", "chaos"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Hướng dẫn lá bài"
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-orange-200/15 bg-[#1c0f0a] p-5 text-orange-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-amber-300">📖 Hướng dẫn Mèo Nổ</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-orange-100/70 hover:bg-white/10" aria-label="Đóng">
            ✕
          </button>
        </div>

        <section className="mb-5 rounded-xl bg-black/25 p-3">
          <h3 className="mb-2 font-bold text-orange-100">Cách chơi</h3>
          <MeoRules />
        </section>

        {packs.map((pack) => {
          const cards = (Object.keys(CARDS) as CardType[]).filter((t) => CARDS[t].pack === pack);
          const on = pack === "base" || !enabled || enabled.includes(pack as Expansion);
          return (
            <section key={pack} className={cn("mb-5", !on && "opacity-50")}>
              <h3 className="mb-1 flex items-center gap-2 font-bold text-orange-100">
                {PACKS[pack].emoji} {PACKS[pack].name}
                {enabled && pack !== "base" && (
                  <span className={cn("rounded px-1.5 text-[11px]", on ? "bg-emerald-500/30 text-emerald-200" : "bg-white/10 text-white/60")}>
                    {on ? "đang bật" : "không dùng ở bàn này"}
                  </span>
                )}
              </h3>
              <p className="mb-2 text-xs text-orange-100/60">{PACKS[pack].blurb}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {cards.map((t) => (
                  <li
                    key={t}
                    className={cn("flex gap-3 rounded-xl bg-black/25 p-2.5", focus === t && "ring-2 ring-amber-300")}
                    onMouseEnter={() => setFocus(t)}
                  >
                    <MeoCard type={t} size="sm" tooltip={false} />
                    <div className="min-w-0 text-sm">
                      <p className="font-bold text-amber-200">
                        {CARDS[t].name} <span className="font-normal text-orange-100/50">×{CARDS[t].count}</span>
                      </p>
                      <p className="text-xs text-orange-100/60">{CARDS[t].how}</p>
                      <p className="mt-0.5 text-orange-50/90">{CARDS[t].effect}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
