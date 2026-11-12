"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { mapHomeBlackHole } from "@/lib/home-black-hole";
import InteractiveStarfield from "@/components/layout/InteractiveStarfield";

const BlackHoleCanvas = dynamic(() => import("@/components/3d/blackhole/BlackHoleCanvas"), { ssr: false });

export default function HomeBlackHole() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLDivElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  // "Settled" once the canvas has faded in over the silhouette (or WebGL is
  // unavailable): the silhouette's breathing pauses, since nothing shows it.
  const [settled, setSettled] = useState(false);
  const onReady = useCallback(() => { window.setTimeout(() => setSettled(true), 3000); }, []);
  const onUnavailable = useCallback(() => setSettled(true), []);

  useEffect(() => {
    setSettled(false);
  }, [resolvedTheme, motionAllowed]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!media.matches);
    updateMotion();
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el || document.hidden) return;
      const framing = mapHomeBlackHole(media.matches ? 0 : window.scrollY,
        document.getElementById("home")?.offsetHeight ?? window.innerHeight, resolvedTheme === "light", window.innerWidth < 768);
      el.style.transform = `translate3d(${framing.x}vw, ${framing.y}vh, 0) scale(${framing.scale})`;
      stars.current?.style.setProperty("--star-scroll", `${media.matches ? 0 : Math.round(-window.scrollY * 0.06)}px`);
      el.style.opacity = String(framing.opacity);
      el.style.setProperty("--loader-play", document.hidden ? "paused" : "running");
    };
    const schedule = () => {
      ref.current?.style.setProperty("--loader-play", document.hidden ? "paused" : "running");
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    media.addEventListener("change", updateMotion);
    media.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      media.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [resolvedTheme]);

  return <div aria-hidden="true" className="portfolio-home-blackhole pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div ref={stars} className="portfolio-stars absolute inset-0" />
    <InteractiveStarfield variant="home" />
    <div ref={ref} className="portfolio-bh-frame absolute inset-0">
      <div className="portfolio-hero-canvas absolute">
        <div className="portfolio-blackhole-fallback absolute inset-0" data-settled={settled ? "" : undefined}>
          <span className="portfolio-bh-part portfolio-bh-glow" />
          <span className="portfolio-bh-part portfolio-bh-disk" />
          <span className="portfolio-bh-part portfolio-bh-ring" />
          <span className="portfolio-bh-part portfolio-bh-core" />
        </div>
        {motionAllowed && <BlackHoleCanvas className="absolute inset-0" interactive={false} deferStart scrollEffect scrollScope="page" onReady={onReady} onUnavailable={onUnavailable} brightness={resolvedTheme === "light" ? 1.15 : 1} particleBrightness={resolvedTheme === "light" ? 0.9 : 0.75} />}
      </div>
    </div>
  </div>;
}
