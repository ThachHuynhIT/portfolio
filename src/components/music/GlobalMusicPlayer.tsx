"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { useMusic } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";
import Icon from "@/components/ui/Icon";

const miniPlayerReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function GlobalMusicPlayer() {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const { t } = useTranslation();
  const {
    currentTrack,
    isPlaying,
    hasStartedPlayback,
    togglePlay,
    nextTrack,
    audioMetrics,
    currentTime,
    duration,
  } = useMusic();

  const [isDismissed, setIsDismissed] = useState(false);

  // If on music page, admin, or couple page, don't show the global floating overlay
  if (
    pathname?.startsWith("/music") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/couple")
  ) {
    return null;
  }

  // Only show floating mini player if the user has actually started listening (hasStartedPlayback || isPlaying || currentTime > 0)
  if (!currentTrack || isDismissed || (!hasStartedPlayback && !isPlaying && currentTime === 0)) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* In-flow spacer after the footer so the fixed player never hides the
          last bit of the page (footer links, form submit) on phones. */}
      <div aria-hidden="true" className="h-28 sm:h-0" />
      <AnimatePresence>
        <motion.div
          variants={reducedMotion ? undefined : miniPlayerReveal}
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
          exit={reducedMotion ? undefined : "hidden"}
          className="portfolio-theme fixed z-50 max-w-sm ml-auto left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:bottom-6 [&_button]:rounded-lg [&_button]:hover:text-portfolio-accretion [&_a]:hover:text-portfolio-accretion [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-portfolio-accretion [&_button:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-portfolio-accretion [&_a:focus-visible]:outline-offset-2"
        >
          <div className="relative group overflow-hidden rounded-2xl bg-portfolio-hull border border-portfolio-hairline  p-3 shadow-sm text-portfolio-ink  flex items-center gap-2">
            {/* Progress bar line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-portfolio-hull  overflow-hidden">
              <div
                className="h-full bg-portfolio-accretion text-portfolio-on-accretion transition-all duration-200 motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Vinyl / Cover Art */}
            <Link href="/music" className="relative flex-shrink-0 group/art">
              <div
                className="w-12 h-12 rounded-lg overflow-hidden bg-portfolio-hull border border-portfolio-hairline relative"
              >
                {currentTrack.thumbnailUrl ? (
                  <Image
                    src={currentTrack.thumbnailUrl}
                    alt={currentTrack.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-portfolio-accretion text-portfolio-on-accretion">
                    <Icon name="music" size={16} />
                  </div>
                )}
              </div>

              {/* Reactive center dot */}
              {isPlaying && (
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none border border-portfolio-accretion"
                />
              )}
            </Link>

            {/* Track Info */}
            <div className="flex-1 min-w-0 pr-1">
              <Link
                href="/music"
                className="block text-xs font-semibold text-portfolio-ink  hover:text-portfolio-accretion transition-colors truncate"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </Link>
              <div className="text-[11px] text-portfolio-dust  truncate">
                {currentTrack.artist}
              </div>

              {/* Mini real-time reactive sound wave */}
              <div className="flex items-center gap-[2px] h-2 mt-1">
                {[0.4, 0.9, 0.6, 0.3, 0.8].map((factor, i) => {
                  const height = isPlaying && !reducedMotion
                    ? Math.max(
                        2,
                        Math.min(
                          8,
                          (audioMetrics.bass * 6 + audioMetrics.avgVolume * 4) * factor + 2
                        )
                      )
                    : 2;
                  return (
                    <span
                      key={i}
                      className="w-[2px] rounded-full bg-portfolio-accretion transition-all duration-75 motion-reduce:transition-none"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
                <span className="text-[9px] text-portfolio-accretion font-medium ml-1">
                  {t("music.globalMini.loungeActive", "Lounge Active")}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? t("music.playerBar.pauseTooltip", "Pause") : t("music.playerBar.playTooltip", "Play")}
                className="w-11 h-11 rounded-lg bg-portfolio-hull  hover:bg-portfolio-hull  active:scale-95 flex items-center justify-center text-portfolio-ink hover:text-portfolio-accretion transition-all motion-reduce:transition-none shadow-sm"
                title={isPlaying ? t("music.playerBar.pauseTooltip", "Pause") : t("music.playerBar.playTooltip", "Play")}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={nextTrack}
                aria-label={t("music.playerBar.nextTooltip", "Next Track")}
                className="w-11 h-11 rounded-lg hover:bg-portfolio-hull  active:scale-95 flex items-center justify-center text-portfolio-dust  hover:text-portfolio-ink hover:text-portfolio-accretion transition-all motion-reduce:transition-none"
                title={t("music.playerBar.nextTooltip", "Next Track")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M6 18l8.5-6L6 6v12zm2.5-6 6-4.35v8.7L8.5 12zM16 6h2v12h-2z" />
                </svg>
              </button>

              <Link
                href="/music"
                aria-label={t("music.globalMini.openStudio", "Open Full Music Studio")}
                className="w-11 h-11 rounded-lg hover:bg-portfolio-hull text-portfolio-accretion hover:text-portfolio-accretion flex items-center justify-center transition-all text-xs"
                title={t("music.globalMini.openStudio", "Open Full Music Studio")}
              >
                <Icon name="externalLink" size={13} />
              </Link>

              <button
                onClick={() => setIsDismissed(true)}
                aria-label={t("music.globalMini.hideWidget", "Hide Mini Widget")}
                className="w-11 h-11 rounded-lg text-portfolio-dust  hover:text-portfolio-accretion hover:bg-portfolio-hull  flex items-center justify-center text-xs transition-colors ml-0.5"
                title={t("music.globalMini.hideWidget", "Hide Mini Widget")}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
