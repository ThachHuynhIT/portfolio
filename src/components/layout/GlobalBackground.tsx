"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { isExcludedRoute } from "@/lib/constants";

const StarryBackground3D = dynamic(() => import("@/components/3d/StarryBackground3D"), { ssr: false });
// Prototype approval gate: flip this one constant to disable light-theme dots.
const SHOW_LIGHT_PORTFOLIO_STARS = true;

export function PortfolioScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className={isExcludedRoute(pathname) ? undefined : "portfolio-theme"}>{children}</div>;
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const { resolvedTheme, isMounted } = useTheme();
  const scrollRef = useRef(0);
  const [homeStarsVisible, setHomeStarsVisible] = useState(false);
  const homeStarsVisibleRef = useRef(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const hasBeenVisibleRef = useRef(false);
  const dotsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frame = 0;
      const hero = document.getElementById("home");
      const sections = document.getElementById("portfolio-sections");
      const heroBottom = hero?.getBoundingClientRect().bottom ?? window.innerHeight;
      const rect = sections?.getBoundingClientRect();
      const visible = !document.hidden && heroBottom < window.innerHeight && Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight);
      if (visible !== homeStarsVisibleRef.current) {
        homeStarsVisibleRef.current = visible;
        setHomeStarsVisible(visible);
      }
      if (visible && !hasBeenVisibleRef.current) {
        hasBeenVisibleRef.current = true;
        setHasBeenVisible(true);
      }
      if (reduced.matches) {
        scrollRef.current = 0;
        dotsRef.current?.style.setProperty("--star-scroll", "0px");
        return;
      }
      if (!visible) return;
      scrollRef.current = window.scrollY;
      dotsRef.current?.style.setProperty("--star-scroll", `${window.scrollY * -0.025}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin") || !isMounted) return null;
  if (pathname === "/") {
    if (resolvedTheme === "light") return SHOW_LIGHT_PORTFOLIO_STARS
      ? <div ref={dotsRef} aria-hidden="true" className="portfolio-theme portfolio-light-stars fixed inset-0 -z-10 pointer-events-none" style={{ visibility: homeStarsVisible ? "visible" : "hidden" }} /> : null;
    return hasBeenVisible ? <StarryBackground3D portfolio scrollRef={scrollRef} paused={!homeStarsVisible} /> : null;
  }
  if (resolvedTheme === "light") return <div className="fixed inset-0 -z-10 bg-gradient-radial from-purple-300/25 via-cyan-100/15 to-transparent" />;
  return <StarryBackground3D />;
}
