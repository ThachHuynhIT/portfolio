"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useMusic } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";
import Icon from "@/components/ui/Icon";

export interface ParsedLyricLine {
  id: number;
  time: number; // in seconds
  text: string;
}

export function parseLrcLyrics(lrcText?: string | null): ParsedLyricLine[] {
  if (!lrcText || !lrcText.trim()) return [];

  const lines = lrcText.split("\n");
  const parsed: ParsedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

  let autoTime = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      const text = trimmed.replace(timeRegex, "").trim();
      if (text) {
        parsed.push({ id: idx, time: totalSeconds, text });
      }
    } else {
      // Plain line without timestamp (estimate every 4 seconds)
      parsed.push({ id: idx, time: autoTime, text: trimmed });
      autoTime += 5;
    }
  });

  return parsed.sort((a, b) => a.time - b.time);
}

export default function LyricsView({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { currentTrack, currentTime, isPlaying, seekTo } = useMusic();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const parsedLyrics = useMemo(() => {
    return parseLrcLyrics(currentTrack?.lyrics);
  }, [currentTrack?.lyrics]);

  // Find active line index
  const activeIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime, parsedLyrics]);

  // Auto-scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && listContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (parsedLyrics.length === 0) {
    return (
      <div className="music-lyrics-empty">
        <div className="flex justify-center mb-3"><Icon name="mic" size={32} /></div>
        <h3 className="text-lg font-bold text-white mb-1">{t("music.lyricsView.emptyTitle", "No Lyrics Available")}</h3>
        <p className="text-white/50 text-sm max-w-sm text-center">
          {t("music.lyricsView.emptyDesc", "Lyrics haven't been added for this track yet. Enjoy the instrumental vibe!")}
        </p>
      </div>
    );
  }

  return (
    <div className={`music-lyrics-wrapper ${compact ? "music-lyrics-wrapper--compact" : ""}`}>
      <div className="music-lyrics-header">
        <div className="flex items-center gap-2">
          <Icon name="mic" size={16} />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            {t("music.lyricsView.header", "Live Synchronized Lyrics")}
          </h3>
        </div>
        <span className="text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 inline-flex items-center gap-1">
          {t("music.lyricsView.seekHint", "Click any line to seek")} <Icon name="zap" size={10} />
        </span>
      </div>

      <div ref={listContainerRef} className="music-lyrics-scroll">
        <div className="music-lyrics-list">
          {parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => seekTo(line.time)}
                className={`music-lyric-line ${isActive ? "music-lyric-line--active" : isPast ? "music-lyric-line--past" : "music-lyric-line--future"}`}
              >
                <span className="music-lyric-time">
                  {Math.floor(line.time / 60)}:
                  {Math.floor(line.time % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
                <span className="music-lyric-text">{line.text}</span>
                {isActive && isPlaying && (
                  <span className="music-lyric-glow-dot" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
