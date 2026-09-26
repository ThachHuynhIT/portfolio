import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Games",
  description: "Các game mình tự làm: Tiến Lên Miền Nam, Mèo Nổ, Cờ Tỷ Phú, Đá Quý và Đấu Súng chơi online cùng bạn bè, cùng Contra phiên bản trình duyệt.",
};

interface GameCard {
  href: string;
  title: string;
  emoji: string;
  tagline: string;
  tags: string[];
  gradient: string;
}

const GAMES: GameCard[] = [
  {
    href: "/tien-len",
    title: "Tiến Lên Miền Nam",
    emoji: "🃏",
    tagline: "Đánh bài online 2–4 người: chặt heo, tới trắng, bảng xếp hạng, khán giả và emoji.",
    tags: ["Online", "2–4 người", "Realtime"],
    gradient: "from-emerald-500/30 via-emerald-700/20 to-transparent",
  },
  {
    href: "/meo-no",
    title: "Mèo Nổ",
    emoji: "😼",
    tagline: "Rút bài né bom, “Không!” chặn nhau, 2 gói mở rộng và hướng dẫn từng lá. Chơi 2–6 người.",
    tags: ["Online", "2–6 người", "Gói mở rộng"],
    gradient: "from-orange-500/30 via-rose-700/20 to-transparent",
  },
  {
    href: "/co-ty-phu",
    title: "Cờ Tỷ Phú",
    emoji: "🎩",
    tagline: "Mua đất Hạ Long, Hội An, Phú Quốc… xây nhà, thu tiền thuê, đổi đất với bạn bè. Chơi 2–6 người.",
    tags: ["Online", "2–6 người", "Địa danh Việt Nam"],
    gradient: "from-lime-500/30 via-teal-700/20 to-transparent",
  },
  {
    href: "/splendor",
    title: "Đá Quý (Splendor)",
    emoji: "💎",
    tagline: "Lấy đá, mua thẻ, thu hút quý tộc — ai đạt điểm uy tín trước thì thắng. Chơi 2–4 người.",
    tags: ["Online", "2–4 người", "Chiến thuật"],
    gradient: "from-fuchsia-500/30 via-violet-700/20 to-transparent",
  },
  {
    href: "/bang",
    title: "Đấu Súng (Bang!)",
    emoji: "🤠",
    tagline: "Cảnh sát trưởng, Phó, Kẻ cướp, Kẻ phản bội — vai trò bí mật, 63 nhân vật và 7 bản mở rộng. Chơi 3–8 người.",
    tags: ["Online", "3–8 người", "Vai trò bí mật"],
    gradient: "from-amber-500/30 via-orange-800/20 to-transparent",
  },
  {
    href: "/contra",
    title: "Contra",
    emoji: "🔫",
    tagline: "Game bắn súng màn hình ngang kiểu 8-bit, chơi ngay trên trình duyệt.",
    tags: ["1 người", "Arcade", "Canvas"],
    gradient: "from-sky-500/30 via-indigo-700/20 to-transparent",
  },
];

export default function GamesPage() {
  return (
    <main className="relative z-10 min-h-[100dvh] px-4 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <p className="mb-3 text-4xl" aria-hidden>
            🎮
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            <span className="gradient-text">Games</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Những game mình tự viết — chơi online với bạn bè hoặc giải trí một mình, ngay trên trình duyệt.
          </p>
        </header>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.gradient} opacity-70 transition-opacity group-hover:opacity-100`} />
                <span className="relative text-5xl transition-transform group-hover:scale-110" aria-hidden>
                  {g.emoji}
                </span>
                <h2 className="relative mt-4 text-xl font-bold">{g.title}</h2>
                <p className="relative mt-2 flex-1 text-sm text-white/70">{g.tagline}</p>
                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {g.tags.map((t) => (
                    <span key={t} className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-xs text-white/80">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="relative mt-5 text-sm font-semibold text-amber-300">Chơi ngay →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
