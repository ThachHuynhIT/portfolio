import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tiến Lên Miền Nam — chơi online",
  description: "Chơi Tiến Lên Miền Nam online cùng bạn bè: tạo phòng, gửi link mời, 2–4 người.",
};

export default function TienLenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,#0f2e22_0%,#07130e_70%)] text-white">
      <Link
        href="/"
        className="fixed left-3 top-3 z-50 rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-1.5 text-sm text-emerald-50 backdrop-blur transition-colors hover:bg-black/60 sm:left-4 sm:top-4"
      >
        ← Portfolio
      </Link>
      {children}
    </div>
  );
}
