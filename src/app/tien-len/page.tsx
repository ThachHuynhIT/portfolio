"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NameForm } from "@/components/tienlen/NameForm";
import { DeltaBadge } from "@/components/tienlen/Scoreboard";
import {
  type LeaderboardEntry,
  type RoomSummary,
  createRoom,
  fetchApi,
  getSavedName,
  saveName,
} from "@/components/tienlen/useTienLen";
import { cn } from "@/lib/utils";

const ROOMS_REFRESH_MS = 5000;

export default function TienLenLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [roomsError, setRoomsError] = useState(false);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => setName(getSavedName()), []);

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetchApi<{ rooms: RoomSummary[] }>("/api/rooms");
      setRooms(res.rooms);
      setRoomsError(false);
    } catch {
      setRoomsError(true);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void loadRooms();
    }, ROOMS_REFRESH_MS);
    fetchApi<{ players: LeaderboardEntry[] }>("/api/leaderboard?limit=20")
      .then((r) => setBoard(r.players))
      .catch(() => setBoard([]));
    return () => clearInterval(id);
  }, [loadRooms]);

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
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4">
      <Link
        href="/"
        className="inline-block rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-1.5 text-sm text-emerald-50 transition-colors hover:bg-black/60"
      >
        ← Portfolio
      </Link>

      <header className="mb-8 mt-6 text-center">
        <p className="mb-2 text-4xl" aria-hidden>
          ♠ ♥ ♣ ♦
        </p>
        <h1 className="text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">Tiến Lên Miền Nam</h1>
        <p className="mt-2 text-emerald-100/70">Tạo bàn, vào bàn đang chờ, hoặc xem người khác chơi.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Create / join */}
        <section className="h-fit rounded-2xl border border-emerald-200/10 bg-black/30 p-5 backdrop-blur">
          {name !== null && (
            <NameForm initial={name} submitLabel={busy ? "Đang tạo bàn…" : "Tạo bàn mới"} onSubmit={onCreate} busy={busy} />
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-emerald-100/40">
            <span className="h-px flex-1 bg-emerald-100/10" /> hoặc nhập mã bàn <span className="h-px flex-1 bg-emerald-100/10" />
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
              placeholder="Mã bàn"
              aria-label="Mã bàn"
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

          <details className="mt-6 text-sm text-emerald-100/70">
            <summary className="cursor-pointer text-emerald-100/90">Luật chơi & cách tính điểm</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>3 nhỏ nhất, 2 (heo) lớn nhất; chất ♠ &lt; ♣ &lt; ♦ &lt; ♥.</li>
              <li>Bộ: rác, đôi, sám cô, sảnh (≥3 lá, không có 2), đôi thông (≥3 đôi), tứ quý.</li>
              <li>Chặn bằng bộ cùng loại, cùng số lá và lá cao nhất lớn hơn.</li>
              <li>3 đôi thông chặt heo; tứ quý chặt heo, đôi heo, 3 đôi thông; 4 đôi thông chặt tất cả những bộ đó.</li>
              <li>Đã bỏ lượt thì không được đánh lại tới hết vòng.</li>
              <li>Tới trắng: tứ quý heo, sảnh rồng, 6 đôi, 5 đôi thông.</li>
              <li>Điểm: 4 người +3/+1/−1/−3 · 3 người +2/0/−2 · 2 người +1/−1 · tới trắng +2 từ mỗi người.</li>
            </ul>
          </details>
        </section>

        <div className="flex flex-col gap-6">
          {/* Live rooms */}
          <section className="rounded-2xl border border-emerald-200/10 bg-black/30 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-300">Bàn đang mở</h2>
              <button onClick={() => void loadRooms()} className="text-xs text-emerald-100/60 hover:text-emerald-50">
                ↻ Làm mới
              </button>
            </div>
            {rooms === null ? (
              <p className="animate-pulse text-sm text-emerald-100/60">{roomsError ? "Không tải được danh sách bàn." : "Đang tải…"}</p>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-emerald-100/60">Chưa có bàn nào. Tạo bàn mới và mời bạn bè nhé!</p>
            ) : (
              <ul className="space-y-2">
                {rooms.map((r) => {
                  const full = r.players.length >= 4;
                  return (
                    <li key={r.code} className="flex flex-wrap items-center gap-3 rounded-xl bg-black/25 p-3">
                      <span className="font-mono font-bold tracking-[0.15em] text-amber-300">{r.code}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                          r.status === "playing" ? "bg-rose-500/25 text-rose-200" : "bg-emerald-500/25 text-emerald-200",
                        )}
                      >
                        {r.status === "playing" ? "Đang chơi" : "Đang chờ"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-emerald-50/90">
                        {r.players.map((p) => p.name).join(", ") || "—"}
                      </span>
                      <span className="text-xs text-emerald-100/60">
                        {r.players.length}/4{r.spectators > 0 && ` · 👀 ${r.spectators}`}
                      </span>
                      <span className="flex gap-2">
                        {!full && r.status !== "playing" && (
                          <Link href={`/tien-len/${r.code}`} className="rounded-md bg-amber-400 px-3 py-1 text-sm font-semibold text-black hover:bg-amber-300">
                            Vào chơi
                          </Link>
                        )}
                        <Link
                          href={`/tien-len/${r.code}?watch=1`}
                          className="rounded-md border border-emerald-200/25 px-3 py-1 text-sm text-emerald-50 hover:bg-white/10"
                        >
                          Xem
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Leaderboard */}
          <section className="rounded-2xl border border-emerald-200/10 bg-black/30 p-5 backdrop-blur">
            <h2 className="mb-3 text-lg font-bold text-amber-300">🏆 Bảng xếp hạng</h2>
            {board === null ? (
              <p className="animate-pulse text-sm text-emerald-100/60">Đang tải…</p>
            ) : board.length === 0 ? (
              <p className="text-sm text-emerald-100/60">Chưa có ván nào được ghi điểm.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-emerald-100/50">
                  <tr>
                    <th className="pb-1">#</th>
                    <th className="pb-1">Người chơi</th>
                    <th className="pb-1 text-right">Ván</th>
                    <th className="pb-1 text-right">Nhất</th>
                    <th className="pb-1 text-right">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((p, i) => (
                    <tr key={p.name + i} className={cn("border-t border-white/5", name && p.name.toLowerCase() === name.toLowerCase() && "text-amber-200")}>
                      <td className="py-1.5 text-emerald-100/50">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
                      <td className="max-w-[10rem] truncate py-1.5">{p.name}</td>
                      <td className="py-1.5 text-right">{p.games}</td>
                      <td className="py-1.5 text-right">{p.wins}</td>
                      <td className="py-1.5 text-right">
                        <DeltaBadge delta={p.points} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-emerald-100/40">Điểm được cộng dồn theo tên người chơi qua mọi bàn.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
