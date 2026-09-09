"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { SceneContainer } from "@/components/3d";

const BlackHoleScene = dynamic(() => import("@/components/3d/BlackHoleScene"), {
  ssr: false,
});

export default function NotFound() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      <SceneContainer highQuality>
        <BlackHoleScene />
      </SceneContainer>

      {/* Real HTML heading — accessible/crawlable regardless of whether the
          3D canvas renders (WebGL failure, prefers-reduced-motion, no JS). */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none">
        <h1 className="sr-only">404 - Page not found</h1>
        <p className="mt-[22vh] sm:mt-[26vh] text-white/70 text-sm sm:text-base tracking-widest uppercase">
          Trang không tồn tại
        </p>
        <p className="mt-3 max-w-md text-white/50 text-sm sm:text-base">
          Có vẻ trang bạn tìm đã bị hút vào hố đen mất rồi.
        </p>
        <Link
          href="/"
          className="pointer-events-auto mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-md transition-all duration-300"
        >
          <span>Về trang chủ</span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}
