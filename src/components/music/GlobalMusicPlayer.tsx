"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";

export default function GlobalMusicPlayer() {
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
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="relative group overflow-hidden rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/15 p-3 shadow-2xl shadow-purple-950/40 text-white flex items-center gap-3">
          {/* Progress bar line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-pink-500 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Vinyl / Cover Art */}
          <Link href="/music" className="relative flex-shrink-0 group/art">
            <div
              className={`w-12 h-12 rounded-xl overflow-hidden bg-white/10 border border-white/15 relative shadow-md transition-transform duration-300 group-hover/art:scale-105 ${
                isPlaying ? "animate-[spin_8s_linear_infinite]" : ""
              }`}
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
                <div className="w-full h-full flex items-center justify-center text-lg bg-gradient-to-br from-purple-900 to-indigo-950">
                  🎵
                </div>
              )}
            </div>

            {/* Reactive center dot */}
            {isPlaying && (
              <span
                className="absolute inset-0 rounded-xl pointer-events-none border border-cyan-400/60"
                style={{
                  boxShadow: `0 0 ${8 + audioMetrics.bass * 12}px rgba(6, 182, 212, ${0.4 + audioMetrics.bass * 0.4})`,
                }}
              />
            )}
          </Link>

          {/* Track Info */}
          <div className="flex-1 min-w-0 pr-1">
            <Link
              href="/music"
              className="block text-xs font-semibold text-white hover:text-cyan-300 transition-colors truncate"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </Link>
            <div className="text-[11px] text-white/50 truncate">
              {currentTrack.artist}
            </div>

            {/* Mini real-time reactive sound wave */}
            <div className="flex items-center gap-[2px] h-2 mt-1">
              {[0.4, 0.9, 0.6, 0.3, 0.8].map((factor, i) => {
                const height = isPlaying
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
                    className="w-[2px] rounded-full bg-cyan-400/80 transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
              <span className="text-[9px] text-purple-400/90 font-medium ml-1">
                {t("music.globalMini.loungeActive", "Lounge Active")}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all shadow-sm"
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
              className="w-7 h-7 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all"
              title={t("music.playerBar.nextTooltip", "Next Track")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M6 18l8.5-6L6 6v12zm2.5-6 6-4.35v8.7L8.5 12zM16 6h2v12h-2z" />
              </svg>
            </button>

            <Link
              href="/music"
              className="w-7 h-7 rounded-full hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 flex items-center justify-center transition-all text-xs"
              title={t("music.globalMini.openStudio", "Open Full Music Studio")}
            >
              ↗
            </Link>

            <button
              onClick={() => setIsDismissed(true)}
              className="w-6 h-6 rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 flex items-center justify-center text-xs transition-colors ml-0.5"
              title={t("music.globalMini.hideWidget", "Hide Mini Widget")}
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
