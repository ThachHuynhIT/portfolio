"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button, CVPreviewModal } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { border, gap, radius, surface, text } from "@/lib/design-tokens";

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
  const hero = siteConfig.sectionsContent?.hero;

  const [isMounted, setIsMounted] = useState(false);
  const [isCVOpen, setIsCVOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleViewWork = useCallback(() => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background py-20 lg:py-0"
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
            className={cn("inline-flex items-center", gap.tight, "px-4 py-2", radius.pill, surface.card, border.subtle, "backdrop-blur-sm mb-8")}
          >
            <span className={cn("w-2 h-2", radius.pill, "bg-green-500 animate-pulse")} />
            <span className="text-sm text-white/70 light:text-neutral-600">
              {resolveSectionText(locale, hero?.available, hero?.available_vi, t("hero.available"))}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
          >
            <span className={cn(text.primary)}>
              {resolveSectionText(locale, hero?.greetingPrefix, hero?.greetingPrefix_vi, t("hero.greetingPrefix"))}
            </span>
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
            {resolveSectionText(
              locale,
              hero?.bio,
              hero?.bio_vi,
              locale === "vi" && siteConfig.author.bio_vi ? siteConfig.author.bio_vi : t("hero.bio")
            )}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={cn("flex flex-col sm:flex-row", gap.loose, "justify-center")}
          >
            <Button size="lg" variant="primary" onClick={handleViewWork}>
              {resolveSectionText(locale, hero?.viewWork, hero?.viewWork_vi, t("hero.viewWork"))}
            </Button>
            {siteConfig.resumeUrl && (
              <Button size="lg" variant="outline" onClick={() => setIsCVOpen(true)}>
                {resolveSectionText(locale, hero?.viewCV, hero?.viewCV_vi, t("hero.viewCV"))}
              </Button>
            )}
          </motion.div>
        </div>

        {siteConfig.resumeUrl && (
          <CVPreviewModal
            url={siteConfig.resumeUrl}
            isOpen={isCVOpen}
            onClose={() => setIsCVOpen(false)}
          />
        )}
      </div>
    </section>
  );
}
