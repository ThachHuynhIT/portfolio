"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { mapScrollProgress } from "@/lib/motion-math";

const BlackHoleCanvas = dynamic(() => import("@/components/3d/blackhole/BlackHoleCanvas"), { ssr: false });
export default function HeroCanvas() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      const hero = el?.closest("section");
      if (!el || !hero || document.hidden) return;
      if (media.matches) { el.style.transform = ""; el.style.opacity = ""; return; }
      const rect = hero.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const progress = mapScrollProgress(-rect.top, rect.height);
      el.style.transform = `scale(${1 - progress * 0.24})`;
      el.style.opacity = String(1 - progress * 0.85);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      media.removeEventListener("change", updateMotion);
      media.removeEventListener("change", schedule);
    };
  }, []);
  return <div ref={ref} aria-hidden="true" className="portfolio-hero-canvas pointer-events-none absolute">
    <div className="portfolio-event-horizon absolute inset-0">
      <div className="portfolio-blackhole-fallback absolute inset-0" />
      {motionAllowed && <BlackHoleCanvas className="absolute inset-0" interactive={false} deferStart scrollEffect scrollScope="hero" brightness={resolvedTheme === "light" ? 0.6 : 1} particleBrightness={resolvedTheme === "light" ? 0.45 : 0.75} />}
    </div>
  </div>;
}
