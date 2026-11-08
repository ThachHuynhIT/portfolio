"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTheme } from "@/context/ThemeContext";
import { mapHomeBlackHole } from "@/lib/home-black-hole";

const BlackHoleCanvas = dynamic(() => import("@/components/3d/blackhole/BlackHoleCanvas"), { ssr: false });

export default function HomeBlackHole() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onUnavailable = useCallback(() => setLoaderGone(true), []);

  useEffect(() => {
    setReady(false);
    setLoaderGone(false);
  }, [resolvedTheme, motionAllowed]);
  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setLoaderGone(true), 400);
    return () => window.clearTimeout(timeout);
  }, [ready]);
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
    {resolvedTheme === "light" && <div className="portfolio-light-stars absolute inset-0" />}
    <div ref={ref} className="absolute inset-0 origin-right">
      <div className="portfolio-hero-canvas absolute">
        <div className="portfolio-blackhole-fallback absolute inset-0" />
        {motionAllowed && <BlackHoleCanvas className="absolute inset-0" interactive={false} deferStart scrollEffect scrollScope="page" onReady={onReady} onUnavailable={onUnavailable} brightness={resolvedTheme === "light" ? 1.15 : 1} particleBrightness={resolvedTheme === "light" ? 0.9 : 0.75} />}
        {motionAllowed && !loaderGone && <div className="portfolio-hole-loader" style={{ opacity: ready ? 0 : 1 }}>
          {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--ring": index } as CSSProperties} />)}
        </div>}
      </div>
    </div>
  </div>;
}
