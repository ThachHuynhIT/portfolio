"use client";

import { useState } from "react";
import { CARDS, type CardType, EXPANSIONS, type Expansion, PACKS, type Pack } from "@/lib/meono/cards";
import { cn } from "@/lib/utils";
import { type CardRole, MeoCard, ROLES, roleOf } from "./MeoCard";

/** How a turn works, in short. */
export function MeoRules() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-50/85">
      <li>Mỗi người bắt đầu với 7 lá + 1 lá Gỡ bom. Chồng bài có (số người − 1) quả Mèo Nổ.</li>
      <li>
        Đến lượt: đánh <b>bao nhiêu lá tuỳ thích</b> (hoặc không đánh), rồi <b>rút 1 lá</b> để kết thúc lượt.
      </li>
      <li>Rút phải Mèo Nổ mà không có Gỡ bom là bị loại. Người cuối cùng còn sống thắng.</li>
      <li>Gỡ bom xong thì bí mật nhét Mèo Nổ lại vào chồng bài — nhưng không được nhét vào 10% lá trên cùng hay dưới cùng (chồng bài ít quá thì nhét đâu cũng được).</li>
      <li>Sau mỗi lá hành động, mọi người có vài giây (mặc định 7 giây, chủ bàn chỉnh được) để đánh “Không!” chặn lại.</li>
      <li>Lá mèo đánh theo đôi (cướp ngẫu nhiên 1 lá) hoặc bộ ba (gọi tên lá muốn lấy). 5 lá khác loại: nhặt 1 lá tuỳ chọn từ chồng đã đánh.</li>
      <li>Hết giờ lượt (mặc định 30 giây) mà chưa rút, hệ thống tự rút giúp bạn.</li>
      <li>Điểm theo thứ hạng (ai bị loại trước xếp sau): chủ bàn chọn điểm Nhất / Nhì (mặc định +2/+1), người cuối và áp chót bị trừ tương ứng, các hạng giữa 0 điểm — tổng luôn bằng 0.</li>
    </ul>
  );
}

/** Card-by-card guide, grouped by pack. `enabled` highlights the packs in play. */
export function CardGuide({ enabled, onClose }: { enabled?: Expansion[]; onClose: () => void }) {
  const [focus, setFocus] = useState<CardType | null>(null);
  // Packs in play at this table come first, the rest after (dimmed).
  const inPlay = (pack: Pack) => pack === "base" || !enabled || enabled.includes(pack as Expansion);
  const all: Pack[] = ["base", ...EXPANSIONS];
  const packs = [...all.filter(inPlay), ...all.filter((p) => !inPlay(p))];
  const firstOff = packs.find((p) => !inPlay(p));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Hướng dẫn lá bài"
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-orange-200/15 bg-[#1c0f0a] p-4 pt-0 text-orange-50 shadow-2xl sm:p-5 sm:pt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky so ✕ stays in reach while scrolling a long guide on a phone. */}
        <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center justify-between bg-[#1c0f0a] px-4 pb-2 pt-3 sm:-mx-5 sm:px-5 sm:pt-4">
          <h2 className="text-lg font-black text-amber-300 sm:text-xl">📖 Hướng dẫn Mèo Nổ</h2>
          <button onClick={onClose} className="grid min-h-9 min-w-9 place-items-center rounded-md text-orange-100/70 hover:bg-white/10" aria-label="Đóng">
            ✕
          </button>
        </div>

        <section className="mb-5 rounded-xl bg-black/25 p-3">
          <h3 className="mb-2 font-bold text-orange-100">Cách chơi</h3>
          <MeoRules />
        </section>

        <section className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-black/25 px-3 py-2 text-xs">
          <span className="font-semibold text-orange-100/70">Màu tên lá:</span>
          {(Object.keys(ROLES) as CardRole[]).map((r) => (
            <span key={r} className={cn("font-bold", ROLES[r].text)}>
              {ROLES[r].emoji} {ROLES[r].label}
            </span>
          ))}
        </section>

        {packs.map((pack) => {
          const cards = (Object.keys(CARDS) as CardType[]).filter((t) => CARDS[t].pack === pack);
          const on = inPlay(pack);
          return (
            <section key={pack} className={cn("mb-5", !on && "opacity-50")}>
              {pack === firstOff && (
                <p className="mb-3 border-t border-white/10 pt-3 text-xs font-semibold uppercase tracking-wide text-orange-100/50">
                  Các gói khác — không dùng ở bàn này
                </p>
              )}
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
                    <MeoCard type={t} size="md" tooltip={false} className="!w-16 [--name:9px]" />
                    <div className="min-w-0 text-sm">
                      <p className={cn("font-bold", ROLES[roleOf(t)].text)}>
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
