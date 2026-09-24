"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NameForm } from "@/components/tienlen/NameForm";
import { createRoom, getSavedName, saveName } from "@/components/tienlen/useTienLen";

export default function TienLenLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setName(getSavedName()), []);

  const onCreate = async (n: string) => {
    saveName(n);
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom();
      router.push(`/tien-len/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được phòng");
      setBusy(false);
    }
  };

  const code = joinCode.trim().toUpperCase();

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-20">
      <div className="mb-8 text-center">
        <p className="mb-2 text-4xl" aria-hidden>
          ♠ ♥ ♣ ♦
        </p>
        <h1 className="text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">Tiến Lên Miền Nam</h1>
        <p className="mt-2 text-emerald-100/70">Tạo phòng, gửi link cho bạn bè và chơi ngay — 2 đến 4 người.</p>
      </div>

      <section className="rounded-2xl border border-emerald-200/10 bg-black/30 p-5 backdrop-blur">
        {name !== null && <NameForm initial={name} submitLabel={busy ? "Đang tạo phòng…" : "Tạo phòng mới"} onSubmit={onCreate} busy={busy} />}

        <div className="my-5 flex items-center gap-3 text-xs text-emerald-100/40">
          <span className="h-px flex-1 bg-emerald-100/10" /> hoặc vào phòng có sẵn <span className="h-px flex-1 bg-emerald-100/10" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code) router.push(`/tien-len/${code}`);
          }}
          className="flex gap-2"
        >
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={5}
            placeholder="Mã phòng"
            aria-label="Mã phòng"
            className="min-w-0 flex-1 rounded-lg border border-emerald-200/20 bg-black/30 px-3 py-2 font-mono uppercase tracking-[0.2em] text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-emerald-100/30 focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!code}
            className="rounded-lg border border-emerald-200/25 px-4 py-2 font-semibold text-emerald-50 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            Vào
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      </section>

      <details className="mt-6 text-sm text-emerald-100/70">
        <summary className="cursor-pointer text-emerald-100/90">Luật chơi tóm tắt</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>3 nhỏ nhất, 2 (heo) lớn nhất; chất ♠ &lt; ♣ &lt; ♦ &lt; ♥.</li>
          <li>Bộ: rác, đôi, sám cô, sảnh (≥3 lá, không có 2), đôi thông (≥3 đôi), tứ quý.</li>
          <li>Chặn bằng bộ cùng loại, cùng số lá và lá cao nhất lớn hơn.</li>
          <li>3 đôi thông chặt heo; tứ quý chặt heo, đôi heo, 3 đôi thông; 4 đôi thông chặt tất cả những bộ đó.</li>
          <li>Đã bỏ lượt thì không được đánh lại tới hết vòng.</li>
          <li>Ván đầu người có lá nhỏ nhất (3♠) đi trước; ván sau người thắng đi trước.</li>
          <li>Tới trắng: tứ quý heo, sảnh rồng, 6 đôi, 5 đôi thông.</li>
        </ul>
      </details>
    </main>
  );
}
