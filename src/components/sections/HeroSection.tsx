"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { SiteConfig } from "@/lib/types";

// Same raymarched black hole engine as the 404 page (src/components/3d/blackhole),
// used here in non-interactive/decorative mode — the sole 3D visual in the
// Hero. Mounts its own canvas + WebGLRenderer (not an R3F scene), so it
// doesn't go through SceneContainer.
const BlackHoleCanvas = dynamic(
  () => import("@/components/3d/blackhole/BlackHoleCanvas"),
  { ssr: false }
);

export interface HeroSectionProps {
  siteConfig: SiteConfig;
}

export default function HeroSection({ siteConfig }: HeroSectionProps) {
  const { t, locale } = useTranslation();
  const { resolvedTheme } = useTheme();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    >
      {/* Black hole — sole 3D visual in the Hero. Fixed (not absolute) so it
          stays pinned in the viewport instead of scrolling away with the
          Hero's own box; later sections' opaque backgrounds naturally cover
          it once scrolled past. Faded at the edges so it reads as part of
          the background rather than a hard-edged canvas. */}
      {isMounted && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            maskImage: "radial-gradient(ellipse 65% 65% at 50% 45%, black 45%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse 65% 65% at 50% 45%, black 45%, transparent 85%)",
          }}
        >
          <BlackHoleCanvas
            className="absolute inset-0"
            interactive={false}
            scrollEffect
            brightness={resolvedTheme === "light" ? 0.6 : 1}
            particleBrightness={resolvedTheme === "light" ? 0.45 : 0.75}
          />
        </div>
      )}

      {/* Readability scrim — the black hole is a page-wide persistent
          background now, not just a Hero accent, so text everywhere needs a
          contrast floor independent of what the render happens to look
          like underneath. Unmasked (unlike the canvas above) so it covers
          the full viewport, not just the center. */}
      {isMounted && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            // Light theme needs a much heavier scrim: most cards site-wide use
            // near-transparent bg-neutral-900/[0.04] + mid-gray text, designed
            // against a plain page background — against the render's varying
            // brightness that combo loses almost all contrast otherwise.
            background: resolvedTheme === "light" ? "rgba(255,255,255,0.82)" : "rgba(5,5,5,0.45)",
          }}
        />
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
    </section>
  );
}
