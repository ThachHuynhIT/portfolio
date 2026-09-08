"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui";
import { siteConfig } from "@/lib/constants";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

// Dynamic imports for 3D components to avoid SSR issues with Three.js
const SceneContainer = dynamic(
  () => import("@/components/3d/SceneContainer"),
  { ssr: false }
);

const Hero3DScene = dynamic(
  () => import("@/components/3d/Hero3DScene"),
  { ssr: false }
);

export default function HeroSection() {
  const { t, locale } = useTranslation();
  const { resolvedTheme } = useTheme();

  // Mutable ref instead of React state: Hero3DScene reads x/y inside an
  // r3f useFrame loop every animation frame, so mutating this object in
  // place avoids re-rendering the whole Hero tree on every mousemove.
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const rafPendingRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fades the Hero's own 3D background (the purple sphere scene) out as the
  // visitor scrolls away from it, revealing the site-wide starfield/warp
  // tunnel background underneath. Mutated directly on the DOM node (never
  // React state) so scrolling doesn't re-render the Hero tree — same
  // performance rationale as mousePositionRef above.
  const heroSceneWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let rafPending = false;

    const applyFade = () => {
      if (heroSceneWrapperRef.current) {
        const fadeDistance = window.innerHeight * 0.7;
        const opacity = Math.max(0, 1 - window.scrollY / fadeDistance);
        heroSceneWrapperRef.current.style.opacity = String(opacity);
      }
      rafPending = false;
    };

    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(applyFade);
    };

    applyFade();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const { clientX, clientY } = e;

      // Throttle to one update per animation frame — the r3f scene already
      // smooths toward this value with a lerp, so sub-frame precision from
      // native mousemove event rates (60-120+Hz) buys nothing visually.
      if (rafPendingRef.current) return;
      rafPendingRef.current = true;

      requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        mousePositionRef.current.x = (clientX / innerWidth - 0.5) * 2;
        mousePositionRef.current.y = (clientY / innerHeight - 0.5) * 2;
        rafPendingRef.current = false;
      });
    },
    []
  );

  const handleViewWork = useCallback(() => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleDownloadCV = useCallback(() => {
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "";
    link.click();
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Background - Original interactive centerpiece.
          Wrapped so its opacity can fade out on scroll (see
          heroSceneWrapperRef above) without touching SceneContainer itself. */}
      {isMounted && (
        <div ref={heroSceneWrapperRef} className="absolute inset-0">
          <SceneContainer highQuality>
            <Hero3DScene mousePosition={mousePositionRef.current} theme={resolvedTheme} />
          </SceneContainer>
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 backdrop-blur-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-white/70 light:text-neutral-600">{t("hero.available")}</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
          >
            <span className="text-white light:text-neutral-900">{t("hero.greetingPrefix")}</span>
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent ml-3">
              {siteConfig.author.name.split(" ")[0]}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/70 light:text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {locale === "vi" && siteConfig.author.bio_vi ? siteConfig.author.bio_vi : t("hero.bio")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" variant="primary" onClick={handleViewWork}>
              {t("hero.viewWork")}
            </Button>
            <Button size="lg" variant="outline" onClick={handleDownloadCV}>
              {t("hero.downloadCV")}
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 light:border-neutral-900/20 flex items-start justify-center p-2"
          >
            <motion.span className="w-1.5 h-1.5 rounded-full bg-white/60 light:bg-neutral-900/60" />
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 light:via-white/30 to-background pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent pointer-events-none" />
    </section>
  );
}
