import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cờ Tỷ Phú Việt Nam — chơi online",
  description: "Cờ Tỷ Phú với các địa danh Việt Nam: mua đất Hạ Long, Hội An, Phú Quốc… xây nhà, thu tiền thuê, chơi online 2–6 người.",
};

export default function CoTyPhuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,#0f3b2e_0%,#06140f_70%)] text-sky-50">{children}</div>
  );
}
