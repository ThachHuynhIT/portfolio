"use client";

import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic, Track, EqPreset } from "@/context/MusicContext";
import MusicSidebar from "./MusicSidebar";
import MusicRoomBar from "./MusicRoomBar";
import LiveReactionOverlay from "./LiveReactionOverlay";

// Split out of the initial /music bundle — only needed once the user
// switches into lyrics/zen mode or opens the room modal.
const LyricsView = dynamic(() => import("./LyricsView"), { ssr: false });
const ZenModeView = dynamic(() => import("./ZenModeView"), { ssr: false });
const MusicRoomModal = dynamic(() => import("./MusicRoomModal"), { ssr: false });
import {
  SpectrumBarsVisualizer,
  WaveVisualizer,
  PulsarVisualizer,
} from "./Visualizers";
import { useTranslation } from "@/context/LanguageContext";
import "@/app/music/music.css";

interface MusicPlayerProps {
  tracks?: Track[];
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MusicPlayerContent({ initialTracks }: { initialTracks?: Track[] }) {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const {
    tracks,
    setTracks,
    currentTrack,
    currentIndex,
    filteredTracks,
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    isLoading,
    visualizerStyle,
    setVisualizerStyle,
    isZenMode,
    setIsZenMode,
    activeTab,
    setActiveTab,
    isPlayerCollapsed,
    setIsPlayerCollapsed,
    togglePlayerCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    likedTrackIds,
    toggleLike,
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    showOnlyLiked,
    setShowOnlyLiked,
    sortBy,
    setSortBy,
    eqPreset,
    setEqPreset,
    sleepTimer,
    setSleepTimerMinutes,
    playTrackByIndex,
    playTrackById,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    setIsShuffle,
    cycleRepeat,
    cycleSpeed,
    audioMetrics,
    room,
    setIsRoomModalOpen,
    setPrefilledRoomCode,
    deckMode,
    setDeckMode,
  } = useMusic();

  const seekContainerRef = useRef<HTMLDivElement>(null);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState(0);

  // Spotify Charts State
  const [chartFilter, setChartFilter] = useState<"plays" | "liked" | "recent">("plays");
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  // Search state & click-outside ref
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtered tracks for the dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Suggest top 5 most played tracks when focused without query
      return [...tracks]
        .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
        .slice(0, 5);
    }
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.lyrics && t.lyrics.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  // Liked tracks collection
  const likedTracks = useMemo(() => {
    return tracks.filter((t) => likedTrackIds.has(t.id));
  }, [tracks, likedTrackIds]);

  const totalLikedDuration = useMemo(() => {
    return likedTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [likedTracks]);

  const chartTracks = useMemo(() => {
    const list = [...tracks];
    if (chartFilter === "plays") {
      return list.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
    }
    if (chartFilter === "liked") {
      return list.sort((a, b) => {
        const aLiked = likedTrackIds.has(a.id) ? 1 : 0;
        const bLiked = likedTrackIds.has(b.id) ? 1 : 0;
        if (bLiked !== aLiked) return bLiked - aLiked;
        return (b.playCount ?? 0) - (a.playCount ?? 0);
      });
    }
    return list;
  }, [tracks, chartFilter, likedTrackIds]);

  const totalPlays = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.playCount ?? 0), 0);
  }, [tracks]);

  const maxPlays = useMemo(() => {
    return Math.max(...tracks.map((t) => t.playCount ?? 0), 1);
  }, [tracks]);

  const handlePlayChartFromStart = () => {
    if (chartTracks.length > 0) {
      playTrackById(chartTracks[0].id);
    }
  };

  const handleShufflePlayCharts = () => {
    setIsShuffle(true);
    if (chartTracks.length > 0) {
      const randomIdx = Math.floor(Math.random() * chartTracks.length);
      playTrackById(chartTracks[randomIdx].id);
    }
  };

  // Check URL query param ?room=CODE on load
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam && roomParam.length === 5 && !room) {
      setPrefilledRoomCode(roomParam.toUpperCase());
      setIsRoomModalOpen(true);
    }
  }, [searchParams, room, setPrefilledRoomCode, setIsRoomModalOpen]);

  // Sync initial tracks from server page if available
  useEffect(() => {
    if (initialTracks && initialTracks.length > 0) {
      const formatted = initialTracks.map((t) => ({
        ...t,
        lyrics:
          t.lyrics ||
          `[00:02.00] 🎵 ${t.title} - ${t.artist}\n[00:08.50] Hi-Res Audio Lounge & Chill Vibes\n[00:16.00] Enjoy the soundtrack and relaxing atmosphere\n[00:26.00] Flow state, deep focus and smooth harmony\n[00:38.00] Let the rhythm take over your mind...`,
      }));
      setTracks(formatted);
    }
  }, [initialTracks, setTracks]);

  // Scrubbing handlers
  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekContainerRef.current || !duration) return;
    const rect = seekContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekPos(pos * 100);
    setHoverSeekTime(pos * duration);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekContainerRef.current || !duration) return;
    const rect = seekContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pos * duration);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyM") {
        e.preventDefault();
        toggleMute();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) nextTrack();
        else seekTo(Math.min(duration, currentTime + 5));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) prevTrack();
        else seekTo(Math.max(0, currentTime - 5));
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.code === "KeyL" && currentTrack) {
        e.preventDefault();
        toggleLike(currentTrack.id);
      } else if (e.code === "KeyZ") {
        e.preventDefault();
        setIsZenMode((z) => !z);
      } else if (e.code === "Escape") {
        // Escape always exits Zen Mode if active
        setIsZenMode(false);
      } else if (e.code === "KeyC") {
        e.preventDefault();
        togglePlayerCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
    duration,
    currentTime,
    currentTrack,
    toggleLike,
    setIsZenMode,
    togglePlayerCollapsed,
    seekTo,
    setVolume,
    volume,
  ]);

  if (!currentTrack) {
    return (
      <div className="music-studio-app">
        <div className="music-studio-layout">
          <MusicSidebar />
          <div className="music-stage-wrapper">
            <main className="music-main-stage flex items-center justify-center min-h-[70vh]">
              <div className="music-empty-card text-center p-8 rounded-3xl bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 max-w-md">
                <div className="text-5xl mb-4">🎧</div>
                <h2 className="text-xl font-bold text-white light:text-neutral-900 mb-2">No Tracks Found</h2>
                <p className="text-white/50 light:text-neutral-500 text-sm mb-6">
                  The sound library is currently empty. Add tracks from the Admin Manager.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isCurrentLiked = likedTrackIds.has(currentTrack.id);

  // Calculate Stereo VU needle angles (-45deg to +45deg)
  const leftVuDeg = -40 + Math.min(85, (audioMetrics.bass * 70 + audioMetrics.avgVolume * 25));
  const rightVuDeg = -40 + Math.min(85, (audioMetrics.mid * 65 + audioMetrics.treble * 25));

  return (
    <div className={`music-studio-app ${isZenMode ? "music-studio-app--zen" : ""}`}>
      {/* Dynamic Ambient Background Glow */}
      <div
        className="music-ambient-glow"
        style={{
          opacity: isPlaying ? 0.6 + audioMetrics.bass * 0.4 : 0.35,
          transform: `scale(${isPlaying ? 1 + audioMetrics.bass * 0.15 : 1})`,
        }}
        aria-hidden="true"
      />

      {/* Floating Room Status & Controls (when in room) */}
      <MusicRoomBar />

      {/* Live Floating Reaction Emojis Overlay */}
      <LiveReactionOverlay />

      {/* Room Modal (Create/Join 5-char room) */}
      <MusicRoomModal />

      {/* ── FULLSCREEN ZEN MODE OVERHAUL ── */}
      {isZenMode ? (
        <ZenModeView />
      ) : (
        /* ── REGULAR STUDIO APP LAYOUT ── */
        <div className="music-studio-layout">
          {/* Dedicated Sidebar */}
          <MusicSidebar />

          {/* Right Stage Wrapper: Sticky Top Bar + Main Stage Content + Right-Aligned Player Bar */}
          <div className="music-stage-wrapper">
            {/* Top Stage Bar (Sticky on Top: Search, Navigation Tabs, Lounge Tools) */}
            <header className="music-top-bar">
              {/* Mobile menu trigger */}
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="music-mobile-menu-btn"
                  aria-label={t("music.studioNav", "Open Music Navigation")}
                >
                  <span>☰</span>
                  <span className="text-xs font-semibold">{t("common.menu", "Menu")}</span>
                </button>
              </div>

              {/* Search Bar with Floating Dropdown */}
              <div className="music-top-search" ref={searchContainerRef}>
                <span className="music-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={t("music.search.placeholder", "Search tracks, artists, albums, lyrics...")}
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchFocused(false);
                    }
                  }}
                  className="music-top-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                    }}
                    className="music-search-clear-btn"
                    title={t("music.clearFilter", "Clear")}
                  >
                    ✕
                  </button>
                )}

                {/* Floating Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="music-search-dropdown"
                    >
                      <div className="music-search-dropdown-header">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 light:text-neutral-500">
                          {searchQuery.trim()
                            ? `${t("music.search.results", "Search Results")} (${searchResults.length})`
                            : t("music.search.trending", "Trending Suggestions")}
                        </span>
                        <button
                          onClick={() => setIsSearchFocused(false)}
                          className="text-[10px] text-white/40 light:text-neutral-500 hover:text-white light:hover:text-neutral-900"
                        >
                          {t("music.search.close", "Close ✕")}
                        </button>
                      </div>

                      <div className="music-search-dropdown-list">
                        {searchResults.length === 0 ? (
                          <div className="music-search-empty">
                            <span className="text-xl">🔍</span>
                            <div className="text-xs text-white/70 light:text-neutral-600">
                              {t("music.search.emptyTitle", "No tracks found for")} &quot;{searchQuery}&quot;
                            </div>
                            <div className="text-[11px] text-white/40 light:text-neutral-500">
                              {t("music.search.emptyDesc", "Try searching by artist, track title, or genre")}
                            </div>
                          </div>
                        ) : (
                          searchResults.map((track) => {
                            const isCurrent = currentTrack?.id === track.id;
                            const isThisPlaying = isPlaying && isCurrent;
                            const isLiked = likedTrackIds.has(track.id);

                            return (
                              <div
                                key={track.id}
                                onClick={() => {
                                  playTrackById(track.id);
                                }}
                                className={`music-search-item group ${
                                  isCurrent ? "music-search-item--active" : ""
                                }`}
                              >
                                {/* Thumbnail with hover play overlay */}
                                <div className="music-search-item-thumb">
                                  {track.thumbnailUrl ? (
                                    <Image
                                      src={track.thumbnailUrl}
                                      alt={track.title}
                                      fill
                                      sizes="38px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">
                                      🎵
                                    </div>
                                  )}
                                  <div
                                    className={`music-search-item-play-overlay ${
                                      isThisPlaying ? "!opacity-100" : ""
                                    }`}
                                  >
                                    {isThisPlaying ? (
                                      <span className="w-2.5 h-2.5 bg-[#1db954] rounded-full animate-ping" />
                                    ) : (
                                      <span className="text-xs text-white light:text-neutral-900">▶</span>
                                    )}
                                  </div>
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`text-xs font-semibold truncate ${
                                      isCurrent ? "text-[#1db954]" : "text-white light:text-neutral-900 group-hover:text-white light:hover:text-neutral-900 light:group-hover:text-neutral-900"
                                    }`}
                                  >
                                    {track.title}
                                  </div>
                                  <div className="text-[11px] text-white/50 light:text-neutral-500 truncate flex items-center gap-1.5">
                                    <span>{track.artist}</span>
                                    {track.genre && (
                                      <>
                                        <span>•</span>
                                        <span className="text-purple-400/80">{track.genre}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Action: Like and Duration */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLike(track.id);
                                    }}
                                    className={`text-xs transition-transform active:scale-125 ${
                                      isLiked
                                        ? "text-rose-400"
                                        : "text-white/20 light:text-neutral-400 hover:text-white/70 light:hover:text-neutral-600"
                                    }`}
                                    title={isLiked ? t("music.favorites.removeTooltip", "Unlike") : t("music.playerBar.likeTrack", "Like")}
                                  >
                                    {isLiked ? "❤️" : "🤍"}
                                  </button>
                                  <span className="text-[11px] font-mono text-white/40 light:text-neutral-500 tabular-nums">
                                    {formatTime(track.duration)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Spotify View Navigation Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] light:bg-neutral-900/[0.04] rounded-xl border border-white/10 light:border-neutral-900/10 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab("player");
                    setShowOnlyLiked(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "player"
                      ? "bg-white text-black shadow-md font-bold"
                      : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                  }`}
                >
                  <span>🎛️</span>
                  <span>{t("music.quickPills.player", "Player")}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("charts");
                    setShowOnlyLiked(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "charts"
                      ? "bg-[#1db954] text-black shadow-md font-bold"
                      : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                  }`}
                >
                  <span>🏆</span>
                  <span>{t("music.quickPills.charts", "Top Charts")}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("favorites");
                    setShowOnlyLiked(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "favorites"
                      ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md font-bold"
                      : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                  }`}
                >
                  <span>❤️</span>
                  <span>{t("music.quickPills.favorites", "Favorites")}</span>
                  {likedTrackIds.size > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono font-bold">
                      {likedTrackIds.size}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("queue");
                    setShowOnlyLiked(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "queue"
                      ? "bg-white text-black shadow-md font-bold"
                      : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                  }`}
                >
                  <span>📑</span>
                  <span>{t("music.quickPills.queue", "Queue")}</span>
                </button>
              </div>

              {/* Global Lounge Tools (Listen Together, Sleep Timer, Zen Mode) */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {/* Listen Together Quick Button */}
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    room
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20"
                      : "bg-white/5 light:bg-neutral-900/[0.04] hover:bg-white/10 light:hover:bg-neutral-900/[0.06] text-white/90 light:text-neutral-800 border-white/10 light:border-neutral-900/10"
                  }`}
                  title={t("music.roomTooltip", "Listen together via 5-character room code")}
                >
                  <span>🎧</span>
                  <span className="hidden sm:inline">{room ? `#${room.code}` : t("music.roomButton", "Listen Together")}</span>
                </button>

                {/* Sleep Timer Selector */}
                <select
                  value={sleepTimer.minutes === null ? "off" : sleepTimer.minutes === 0 ? "end" : String(sleepTimer.minutes)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "off") setSleepTimerMinutes(null);
                    else if (v === "end") setSleepTimerMinutes(0);
                    else setSleepTimerMinutes(Number(v));
                  }}
                  className={`music-sort-select ${sleepTimer.minutes !== null ? "!border-cyan-400 !text-cyan-300" : ""}`}
                  title={t("music.sleepTimer.title", "Sleep Timer")}
                  aria-label={t("music.sleepTimer.title", "Sleep Timer")}
                >
                  <option value="off">{t("music.sleepTimer.off", "⏱️ Timer: Off")}</option>
                  <option value="15">{t("music.sleepTimer.m15", "⏱️ Timer: 15 mins")}</option>
                  <option value="30">{t("music.sleepTimer.m30", "⏱️ Timer: 30 mins")}</option>
                  <option value="45">{t("music.sleepTimer.m45", "⏱️ Timer: 45 mins")}</option>
                  <option value="60">{t("music.sleepTimer.m60", "⏱️ Timer: 60 mins")}</option>
                  <option value="end">{t("music.sleepTimer.endTrack", "⏱️ Timer: End of Track")}</option>
                </select>

                {/* Sleep Timer Countdown Badge */}
                {sleepTimer.remainingSeconds !== null && (
                  <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30 animate-pulse">
                    ⏱️ {Math.floor(sleepTimer.remainingSeconds / 60)}:
                    {(sleepTimer.remainingSeconds % 60).toString().padStart(2, "0")}
                  </span>
                )}

                {/* Zen Mode Button */}
                <button
                  onClick={() => setIsZenMode(true)}
                  className="music-zen-btn"
                  title={t("music.zen.zenModeTooltip", "Fullscreen Zen Mode (Hotkey: Z)")}
                >
                  <span>📺</span>
                  <span className="hidden sm:inline">Zen Mode</span>
                </button>
              </div>
            </header>

            {/* Main Stage Content (Scrolls beneath sticky top bar) */}
            <main className="music-main-stage">
              {/* ── TAB 1: TURNTABLE & VISUALIZER DECK ── */}
            {activeTab === "player" && (
              <section className="music-deck-section">
                {/* ── TRACK CONTROLS TOOLBAR (Chỉ ảnh hưởng bài hát hiện tại) ── */}
                <div className="w-full flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 backdrop-blur-md">
                  {/* Deck Mode Toggle: Đĩa Than vs Lời Bài Hát (Karaoke) */}
                  <div className="flex items-center gap-1.5 p-1 bg-black/40 light:bg-white/70 rounded-xl border border-white/10 light:border-neutral-900/10">
                    <button
                      onClick={() => setDeckMode("vinyl")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        deckMode === "vinyl"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                          : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                      }`}
                    >
                      <span>💿</span>
                      <span>{t("music.deck.vinyl", "Vinyl & Studio")}</span>
                    </button>
                    <button
                      onClick={() => setDeckMode("lyrics")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        deckMode === "lyrics"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                          : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                      }`}
                    >
                      <span>🎤</span>
                      <span>{t("music.deck.lyrics", "Live Lyrics (Karaoke)")}</span>
                    </button>
                  </div>

                  {/* Single-Track Audio Equalizer Preset */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 light:text-neutral-500 font-medium hidden sm:inline">{t("music.deck.eqLabel", "Equalizer Preset:")}</span>
                    <select
                      value={eqPreset}
                      onChange={(e) => setEqPreset(e.target.value as EqPreset)}
                      className="music-sort-select !bg-black/40 light:bg-white/70 !border-white/15 light:border-neutral-900/15"
                      title={t("music.deck.eqLabel", "Graphic Equalizer Preset (Current track only)")}
                      aria-label="Equalizer Preset"
                    >
                      <option value="flat">{t("music.eq.flat", "🎚️ EQ: Flat / Studio")}</option>
                      <option value="bass_boost">{t("music.eq.bass_boost", "🔊 EQ: Bass Boost")}</option>
                      <option value="vocal">{t("music.eq.vocal", "🎤 EQ: Vocal & Acoustic")}</option>
                      <option value="electronic">{t("music.eq.electronic", "🌌 EQ: Synth & EDM")}</option>
                      <option value="chill">{t("music.eq.chill", "☕ EQ: Chill Lofi")}</option>
                    </select>
                  </div>
                </div>

                {deckMode === "lyrics" ? (
                  /* ── IN-DECK KARAOKE LIVE SYNCED LYRICS ── */
                  <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
                    {/* Compact Playing Track Bar at the top of Lyrics */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 backdrop-blur-md">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 light:bg-neutral-900/[0.06] border border-white/10 light:border-neutral-900/10 relative group">
                          {currentTrack.thumbnailUrl ? (
                            <Image
                              src={currentTrack.thumbnailUrl}
                              alt={currentTrack.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🎵</div>
                          )}
                          {isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-white light:text-neutral-900 truncate">
                              {currentTrack.title}
                            </h2>
                            <button
                              onClick={() => toggleLike(currentTrack.id)}
                              className={`text-sm ${isCurrentLiked ? "text-red-500" : "text-white/40 light:text-neutral-500 hover:text-white light:hover:text-neutral-900"} cursor-pointer`}
                              title={isCurrentLiked ? t("music.favorites.removeTooltip", "Unlike") : t("music.playerBar.likeTrack", "Like")}
                            >
                              {isCurrentLiked ? "❤️" : "🤍"}
                            </button>
                          </div>
                          <p className="text-xs text-white/60 light:text-neutral-600 truncate">
                            {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Audio pulse bars visual feedback */}
                        <div className="hidden sm:flex items-center gap-1 h-6 px-2.5 py-1 rounded-lg bg-black/40 light:bg-white/70 border border-white/10 light:border-neutral-900/10">
                          <span
                            className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                            style={{ height: isPlaying ? `${Math.max(4, audioMetrics.bass * 20)}px` : "4px" }}
                          />
                          <span
                            className="w-1 bg-purple-400 rounded-full transition-all duration-75"
                            style={{ height: isPlaying ? `${Math.max(4, audioMetrics.mid * 20)}px` : "8px" }}
                          />
                          <span
                            className="w-1 bg-pink-400 rounded-full transition-all duration-75"
                            style={{ height: isPlaying ? `${Math.max(4, audioMetrics.treble * 20)}px` : "6px" }}
                          />
                        </div>

                        <button
                          onClick={() => setDeckMode("vinyl")}
                          className="px-3 py-1.5 rounded-xl bg-white/10 light:bg-neutral-900/[0.06] hover:bg-white/15 light:hover:bg-neutral-900/10 text-xs font-semibold text-white/80 light:text-neutral-800 hover:text-white light:hover:text-neutral-900 border border-white/10 light:border-neutral-900/10 transition-all flex items-center gap-1.5 cursor-pointer"
                          title={t("music.deck.backToVinyl", "Back to Vinyl")}
                        >
                          <span>💿</span>
                          <span className="hidden sm:inline">{t("music.deck.backToVinyl", "Back to Vinyl")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Synchronized Lyrics Component */}
                    <LyricsView compact={false} />
                  </div>
                ) : (
                  <>
                    {/* Turntable / Vinyl Rig */}
                    <div className="music-turntable-wrapper">
                      {/* Vinyl Record */}
                      <div
                        className={`music-vinyl ${isPlaying ? "music-vinyl--spinning" : ""}`}
                        style={{
                          animationPlayState: isPlaying ? "running" : "paused",
                          transform: `scale(${isPlaying ? 1 + audioMetrics.bass * 0.03 : 1})`,
                          boxShadow: isPlaying
                            ? `0 0 ${20 + audioMetrics.bass * 40}px rgba(168, 85, 247, 0.4), 0 20px 50px rgba(0,0,0,0.8)`
                            : "0 20px 50px rgba(0,0,0,0.8)",
                        }}
                      >
                        <div className="music-vinyl-grooves" />
                        <div className="music-vinyl-center">
                          {currentTrack.thumbnailUrl ? (
                            <Image
                              src={currentTrack.thumbnailUrl}
                              alt=""
                              fill
                              sizes="86px"
                              className="music-vinyl-art"
                            />
                          ) : (
                            <div className="music-vinyl-placeholder">TH</div>
                          )}
                          <div className="music-vinyl-hole" />
                        </div>
                      </div>

                      {/* 3D Cover Card */}
                      <motion.div
                        className="music-cover-card"
                        whileHover={{ scale: 1.02, rotateY: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {currentTrack.thumbnailUrl ? (
                          <Image
                            src={currentTrack.thumbnailUrl}
                            alt={currentTrack.title}
                            fill
                            sizes="(max-width: 640px) 180px, 240px"
                            priority
                            className="music-cover-img"
                          />
                        ) : (
                          <div className="music-cover-default">
                            <span className="text-6xl">🎵</span>
                          </div>
                        )}

                        {/* Album Cover Badges */}
                        <div className="music-cover-overlay">
                          <div className="music-cover-top-badge">
                            <span className="music-lossless-badge">{t("music.deck.hiResBadge", "HI-RES AUDIO")}</span>
                            {currentTrack.genre && (
                              <span className="music-genre-badge">{currentTrack.genre}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {/* Real Tonearm with playing rotation */}
                      <div
                        className={`music-tonearm ${isPlaying ? "music-tonearm--playing" : ""}`}
                        aria-hidden="true"
                      >
                        <div className="music-tonearm-base" />
                        <div className="music-tonearm-arm" />
                        <div className="music-tonearm-head" />
                      </div>
                    </div>

                    {/* Track Metadata */}
                    <div className="music-stage-meta">
                      <div className="flex items-center justify-center gap-3">
                        <h1 className="music-stage-title">{currentTrack.title}</h1>
                        <button
                          onClick={() => toggleLike(currentTrack.id)}
                          className={`music-main-heart-btn ${isCurrentLiked ? "music-main-heart-btn--liked" : ""}`}
                          title={isCurrentLiked ? t("music.playerBar.unlikeTrack", "Liked!") : t("music.playerBar.likeTrack", "Add to Liked Songs (L)")}
                        >
                          {isCurrentLiked ? "❤️" : "🤍"}
                        </button>
                      </div>

                      <p className="music-stage-artist">{currentTrack.artist}</p>

                      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                        {currentTrack.album && (
                          <span className="music-pill-meta">💿 {currentTrack.album}</span>
                        )}
                        <span className="music-pill-meta">
                          🔥 {currentTrack.playCount.toLocaleString()} {t("music.deck.plays", "plays")}
                        </span>
                        <span className="music-pill-meta">
                          ⏱️ {formatTime(currentTrack.duration)}
                        </span>
                        <button
                          onClick={() => setDeckMode("lyrics")}
                          className="music-pill-meta hover:bg-white/10 light:hover:bg-neutral-900/[0.06] text-cyan-300 border-cyan-500/30 cursor-pointer"
                        >
                          🎤 {t("music.deck.viewLyrics", "View Lyrics")}
                        </button>
                      </div>
                    </div>

                    {/* Real-Time Web Audio Visualizer */}
                    <div className="flex items-center justify-between px-2 mb-2 w-full max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70 light:text-neutral-600">
                          {t("music.deck.visualizerTitle", "Audio Visualizer")}
                        </span>
                        {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-1 bg-white/[0.04] light:bg-neutral-900/[0.04] p-1 rounded-xl border border-white/10 light:border-neutral-900/10 text-xs">
                        <button
                          onClick={() => setVisualizerStyle("bars")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            visualizerStyle === "bars"
                              ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold shadow"
                              : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                          }`}
                        >
                          {t("music.deck.bars", "Bars")}
                        </button>
                        <button
                          onClick={() => setVisualizerStyle("wave")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            visualizerStyle === "wave"
                              ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold shadow"
                              : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                          }`}
                        >
                          {t("music.deck.wave", "Wave")}
                        </button>
                        <button
                          onClick={() => setVisualizerStyle("pulsar")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            visualizerStyle === "pulsar"
                              ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold shadow"
                              : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                          }`}
                        >
                          {t("music.deck.pulsar", "Pulsar")}
                        </button>
                      </div>
                    </div>

                    <div className="music-stage-visualizer w-full max-w-3xl">
                      {visualizerStyle === "bars" && <SpectrumBarsVisualizer />}
                      {visualizerStyle === "wave" && <WaveVisualizer />}
                      {visualizerStyle === "pulsar" && <PulsarVisualizer />}
                    </div>
                  </>
                )}

                {/* Quick Track Grid / Playlist Preview */}
                <div className="music-quick-library w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 light:border-neutral-900/10">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-white/90 light:text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                        <span>🎵</span>
                        <span>{t("music.collection.title", "Soundtrack Collection")}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 light:bg-neutral-900/[0.06] text-white/60 light:text-neutral-600 font-mono font-normal">
                          {filteredTracks.length} {t("music.collection.tracksCount", "tracks")}
                        </span>
                      </h3>

                      {/* Active Filter Chips that affect this list */}
                      {selectedGenre !== "All" && (
                        <div className="music-active-chip">
                          <span>{t("music.collection.moodFilter", "Mood")}: {selectedGenre}</span>
                          <button onClick={() => setSelectedGenre("All")} title={t("music.clearFilter", "Clear")}>✕</button>
                        </div>
                      )}

                      {showOnlyLiked && (
                        <div className="music-active-chip music-active-chip--liked">
                          <span>❤️ {t("music.collection.likedFilter", "Liked")}</span>
                          <button onClick={() => setShowOnlyLiked(false)} title={t("music.clearFilter", "Clear")}>✕</button>
                        </div>
                      )}
                    </div>

                    {/* List Controls: Liked quick toggle & Sort dropdown */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <button
                        onClick={() => setShowOnlyLiked(!showOnlyLiked)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          showOnlyLiked
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20"
                            : "bg-white/5 light:bg-neutral-900/[0.04] text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 border-white/10 light:border-neutral-900/10"
                        }`}
                        title={t("music.collection.likedFilter", "Only show liked tracks in list")}
                      >
                        <span>{showOnlyLiked ? "❤️" : "🤍"}</span>
                        <span>{t("music.collection.likedBtn", "Liked")}</span>
                      </button>

                      {/* Sort dropdown */}
                      <div className="flex items-center gap-1.5 bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 rounded-xl px-2.5 py-1">
                        <span className="text-xs text-white/40 light:text-neutral-500">⇅</span>
                        <select
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(e.target.value as "default" | "title" | "plays" | "duration")
                          }
                          className="bg-transparent text-xs text-white/90 light:text-neutral-800 focus:outline-none cursor-pointer pr-1 py-0.5"
                          aria-label={t("music.collection.sort.label", "Sort:")}
                        >
                          <option value="default" className="bg-[#121212] text-white light:bg-white light:text-neutral-900">{t("music.collection.sort.default", "Sort: Default")}</option>
                          <option value="plays" className="bg-[#121212] text-white light:bg-white light:text-neutral-900">{t("music.collection.sort.plays", "Sort: Most Played")}</option>
                          <option value="title" className="bg-[#121212] text-white light:bg-white light:text-neutral-900">{t("music.collection.sort.title", "Sort: Track Title")}</option>
                          <option value="duration" className="bg-[#121212] text-white light:bg-white light:text-neutral-900">{t("music.collection.sort.duration", "Sort: Duration")}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="music-grid-tracks">
                    {filteredTracks.map((t) => {
                      const originalIdx = tracks.findIndex((item) => item.id === t.id);
                      const isSelected = t.id === currentTrack.id;
                      const isLiked = likedTrackIds.has(t.id);

                      return (
                        <div
                          key={t.id}
                          onClick={() => playTrackByIndex(originalIdx)}
                          className={`music-grid-card ${isSelected ? "music-grid-card--active" : ""}`}
                        >
                          <div className="music-grid-thumb">
                            {t.thumbnailUrl ? (
                              <Image
                                src={t.thumbnailUrl}
                                alt={t.title}
                                fill
                                sizes="(max-width: 640px) 45vw, 180px"
                              />
                            ) : (
                              <div className="music-grid-default-art">🎵</div>
                            )}
                            <div className="music-grid-play-overlay">
                              {isSelected && isPlaying ? "⏸" : "▶"}
                            </div>
                          </div>

                          <div className="music-grid-info">
                            <div className="music-grid-title" title={t.title}>
                              {t.title}
                            </div>
                            <div className="music-grid-artist">{t.artist}</div>
                          </div>

                          <div className="music-grid-footer">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(t.id);
                              }}
                              className={`text-xs ${isLiked ? "text-red-400" : "text-white/30 light:text-neutral-400 hover:text-white light:hover:text-neutral-900"}`}
                            >
                              {isLiked ? "❤️" : "🤍"}
                            </button>
                            <span className="text-[11px] text-white/40 light:text-neutral-500 tabular-nums">
                              {formatTime(t.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── TAB: SPOTIFY MUSIC CHARTS & LEADERBOARD ── */}
            {activeTab === "charts" && (
              <section className="spotify-charts-container">
                {/* 1. Spotify Hero Billboard Banner */}
                <div className="spotify-charts-hero">
                  <div className="spotify-charts-hero-backdrop" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 p-6 sm:p-8">
                    {/* Big Chart Cover Artwork / Badge */}
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl shadow-2xl flex-shrink-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950 flex flex-col items-center justify-center text-white border border-emerald-400/30 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="text-5xl sm:text-6xl mb-1 relative z-10">🏆</span>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-300 relative z-10">
                        TOP CHARTS
                      </span>
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl" />
                    </div>

                    {/* Chart Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                          {t("music.charts.badge", "TRENDING LEADERBOARD")}
                        </span>
                        <span className="text-[11px] text-white/40 light:text-neutral-500 font-mono">{t("music.charts.edition", "SPOTIFY EDITION")}</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white light:text-neutral-900 tracking-tight mb-3">
                        {t("music.charts.title", "Most Played Soundtracks")}
                      </h1>

                      <p className="text-sm text-white/70 light:text-neutral-600 max-w-2xl mb-4 font-light leading-relaxed">
                        {t("music.charts.desc", "A curated collection of the most enjoyed chillout, lofi, and synthwave melodies on Vibe Lounge. Ranked by actual play counts.")}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 light:text-neutral-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white">
                            TH
                          </span>
                          <span>{t("music.charts.curatedBy", "Curated by")} <strong>Thạch Huỳnh</strong></span>
                        </div>
                        <span>•</span>
                        <span>{chartTracks.length} {t("music.charts.tracks", "tracks")}</span>
                        <span>•</span>
                        <span>{totalPlays.toLocaleString()} {t("music.charts.plays", "plays")}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono">{t("music.charts.lossless", "Lossless Hi-Res")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Quick Podium Badges */}
                  {chartTracks.length >= 3 && (
                    <div className="px-6 sm:px-8 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 light:border-neutral-900/10 pt-4 relative z-10">
                      {chartTracks.slice(0, 3).map((topT, idx) => {
                        const medals = [
                          t("music.charts.top1", "🥇 Top 1 Trending"),
                          t("music.charts.top2", "🥈 Top 2 Favorite"),
                          t("music.charts.top3", "🥉 Top 3 Featured"),
                        ];
                        const isThisPlaying = isPlaying && currentTrack?.id === topT.id;
                        return (
                          <div
                            key={topT.id}
                            onClick={() => playTrackById(topT.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl bg-black/40 light:bg-white/70 border transition-all cursor-pointer ${
                              isThisPlaying
                                ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                                : "border-white/10 light:border-neutral-900/10 hover:border-white/20 light:hover:border-neutral-900/15 hover:bg-white/5 light:hover:bg-neutral-900/[0.04]"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative bg-white/10 light:bg-neutral-900/[0.06]">
                              {topT.thumbnailUrl ? (
                                <Image src={topT.thumbnailUrl} alt={topT.title} fill sizes="40px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                              )}
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-amber-300 block">{medals[idx]}</span>
                              <div className="text-xs font-bold text-white light:text-neutral-900 truncate">{topT.title}</div>
                              <span className="text-[11px] text-white/50 light:text-neutral-500 truncate block">{topT.artist}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                                {(topT.playCount ?? 0).toLocaleString()}
                              </span>
                              <span className="text-[9px] text-white/40 light:text-neutral-500 block">{t("music.charts.plays", "plays")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Action Bar: Big Spotify Green Play Button & Filter Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 pt-6">
                  <div className="flex items-center gap-4">
                    {/* Spotify Iconic Circular Big Green Play Button */}
                    <button
                      onClick={handlePlayChartFromStart}
                      className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 active:scale-95 transition-all"
                      title={t("music.charts.playAll", "Play all from #1")}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" className="translate-x-0.5">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </button>

                    {/* Shuffle Play Button */}
                    <button
                      onClick={handleShufflePlayCharts}
                      className={`p-3 rounded-full border transition-all ${
                        isShuffle
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-white/5 light:bg-neutral-900/[0.04] hover:bg-white/10 light:hover:bg-neutral-900/[0.06] text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 border-white/10 light:border-neutral-900/10"
                      }`}
                      title={t("music.charts.shuffle", "Shuffle play charts")}
                    >
                      <ShuffleIcon />
                    </button>

                    <div className="h-6 w-px bg-white/10 light:bg-neutral-900/[0.06]" />

                    <span className="text-xs text-white/60 light:text-neutral-600">
                      {t("music.charts.showing", "Showing")} <strong>{chartTracks.length}</strong> {t("music.charts.tracks", "tracks")}
                    </span>
                  </div>

                  {/* Chart Sorting Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] light:bg-neutral-900/[0.04] rounded-xl border border-white/10 light:border-neutral-900/10 self-start sm:self-auto">
                    <button
                      onClick={() => setChartFilter("plays")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartFilter === "plays"
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                          : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                      }`}
                    >
                      {t("music.charts.topPlays", "🔥 Top Played")}
                    </button>
                    <button
                      onClick={() => setChartFilter("liked")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartFilter === "liked"
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                          : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                      }`}
                    >
                      {t("music.charts.topLiked", "❤️ Most Liked")}
                    </button>
                    <button
                      onClick={() => setChartFilter("recent")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartFilter === "recent"
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                          : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                      }`}
                    >
                      {t("music.charts.topRecent", "✨ Recently Added")}
                    </button>
                  </div>
                </div>

                {/* 3. Spotify Track Table */}
                <div className="px-4 sm:px-8 pb-16">
                  <div className="spotify-track-table">
                    {/* Header */}
                    <div className="spotify-table-header">
                      <div className="w-10 text-center font-bold">{t("music.charts.table.rank", "#")}</div>
                      <div className="flex-1 min-w-0">{t("music.charts.table.title", "TITLE")}</div>
                      <div className="hidden md:block w-48">{t("music.charts.table.albumGenre", "ALBUM / GENRE")}</div>
                      <div className="hidden sm:block w-36 text-right">{t("music.charts.table.plays", "PLAYS")}</div>
                      <div className="w-24 text-right pr-2">{t("music.charts.table.duration", "DURATION")}</div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                      {chartTracks.map((track, index) => {
                        const isCurrent = currentTrack?.id === track.id;
                        const isThisPlaying = isCurrent && isPlaying;
                        const isLiked = likedTrackIds.has(track.id);
                        const isHovered = hoveredTrackId === track.id;
                        const rank = index + 1;
                        const playPercent = Math.round(((track.playCount ?? 0) / maxPlays) * 100);

                        return (
                          <div
                            key={track.id}
                            onMouseEnter={() => setHoveredTrackId(track.id)}
                            onMouseLeave={() => setHoveredTrackId(null)}
                            onClick={() => playTrackById(track.id)}
                            className={`spotify-table-row group ${
                              isCurrent ? "spotify-table-row--active" : ""
                            }`}
                          >
                            {/* Rank / Play Icon Col */}
                            <div className="w-10 text-center flex items-center justify-center flex-shrink-0">
                              {isHovered ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCurrent) {
                                      togglePlay();
                                    } else {
                                      playTrackById(track.id);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow hover:scale-110 transition-transform"
                                  title={isThisPlaying ? t("music.charts.pause", "Pause") : t("music.charts.play", "Play Track")}
                                >
                                  {isThisPlaying ? (
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="translate-x-0.5">
                                      <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                  )}
                                </button>
                              ) : isThisPlaying ? (
                                <div className="music-mini-bars">
                                  <span style={{ backgroundColor: "#1db954" }} />
                                  <span style={{ backgroundColor: "#1db954" }} />
                                  <span style={{ backgroundColor: "#1db954" }} />
                                </div>
                              ) : rank === 1 ? (
                                <span className="text-base" title="Top 1">🥇</span>
                              ) : rank === 2 ? (
                                <span className="text-base" title="Top 2">🥈</span>
                              ) : rank === 3 ? (
                                <span className="text-base" title="Top 3">🥉</span>
                              ) : (
                                <span className="text-xs font-mono text-white/50 light:text-neutral-500">{rank}</span>
                              )}
                            </div>

                            {/* Title & Artist & Thumbnail Col */}
                            <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/10 light:bg-neutral-900/[0.06] flex-shrink-0 shadow relative">
                                {track.thumbnailUrl ? (
                                  <Image src={track.thumbnailUrl} alt={track.title} fill sizes="44px" className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-sm font-semibold truncate transition-colors ${
                                  isCurrent ? "text-[#1db954] font-bold" : "text-white light:text-neutral-900 group-hover:text-white light:hover:text-neutral-900 light:group-hover:text-neutral-900"
                                }`}>
                                  {track.title}
                                </div>
                                <div className="text-xs text-white/50 light:text-neutral-500 truncate flex items-center gap-2">
                                  <span>{track.artist}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 light:bg-neutral-900/[0.06] text-white/70 light:text-neutral-600 font-mono uppercase">
                                    Lossless
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Album / Genre Col */}
                            <div className="hidden md:block w-48 text-xs text-white/60 light:text-neutral-600 truncate pr-4">
                              {track.album || track.genre || t("music.infoView.singleRelease", "Single Release")}
                            </div>

                            {/* Plays count & popularity bar Col */}
                            <div className="hidden sm:flex flex-col items-end justify-center w-36 pr-4">
                              <span className="text-xs font-mono font-medium text-white/80 light:text-neutral-800 tabular-nums">
                                {(track.playCount ?? 0).toLocaleString()} {t("music.charts.plays", "plays")}
                              </span>
                              <div className="w-20 h-1 rounded-full bg-white/10 light:bg-neutral-900/[0.06] mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#1db954] rounded-full"
                                  style={{ width: `${Math.max(5, playPercent)}%` }}
                                />
                              </div>
                            </div>

                            {/* Duration & Heart Like Col */}
                            <div className="w-24 flex items-center justify-end gap-3 flex-shrink-0 pr-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLike(track.id);
                                }}
                                className={`text-sm transition-transform active:scale-125 ${
                                  isLiked ? "text-emerald-400" : "text-white/20 light:text-neutral-400 hover:text-white/80 light:hover:text-neutral-800"
                                }`}
                                title={isLiked ? t("music.favorites.removeTooltip", "Unlike") : t("music.playerBar.likeTrack", "Like")}
                              >
                                {isLiked ? "❤️" : "🤍"}
                              </button>
                              <span className="text-xs font-mono text-white/50 light:text-neutral-500 tabular-nums">
                                {formatTime(track.duration)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── TAB: FAVORITE TRACKS (BÀI HÁT YÊU THÍCH) ── */}
            {activeTab === "favorites" && (
              <section className="spotify-charts-container">
                {/* 1. Hero Billboard Banner */}
                <div className="spotify-charts-hero !from-rose-950/40 !via-pink-950/30">
                  <div
                    className="spotify-charts-hero-backdrop"
                    style={{
                      background:
                        "radial-gradient(circle at top left, rgba(244, 63, 94, 0.25) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 p-6 sm:p-8">
                    {/* Big Heart Cover Artwork */}
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl shadow-2xl flex-shrink-0 bg-gradient-to-br from-rose-600 via-pink-600 to-purple-900 flex flex-col items-center justify-center text-white border border-rose-400/40 relative overflow-hidden group shadow-rose-900/40">
                      <div className="absolute inset-0 bg-black/15" />
                      <span className="text-5xl sm:text-6xl mb-1 relative z-10 drop-shadow-md">
                        ❤️
                      </span>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-200 relative z-10">
                        FAVORITES
                      </span>
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-400/30 rounded-full blur-xl" />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30">
                          {t("music.favorites.badge", "FAVORITE COLLECTION")}
                        </span>
                        <span className="text-[11px] text-white/40 light:text-neutral-500 font-mono">{t("music.favorites.edition", "SPOTIFY EDITION")}</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white light:text-neutral-900 tracking-tight mb-3">
                        {t("music.favorites.title", "Favorite Tracks")}
                      </h1>

                      <p className="text-sm text-white/70 light:text-neutral-600 max-w-2xl mb-4 font-light leading-relaxed">
                        {t("music.favorites.desc", "All your saved and loved melodies on Vibe Lounge. Automatically synced and stored in your browser.")}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 light:text-neutral-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                            ❤️
                          </span>
                          <span>
                            <strong>{likedTracks.length}</strong> {t("music.favorites.savedCount", "saved tracks")}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{formatTime(totalLikedDuration)} {t("music.favorites.totalDuration", "total duration")}</span>
                        <span>•</span>
                        <span className="text-rose-400 font-mono">{t("music.favorites.lossless", "Lossless Hi-Res")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 pt-6">
                  <div className="flex items-center gap-4">
                    {/* Big Play Button */}
                    <button
                      onClick={() => {
                        if (likedTracks.length > 0) {
                          playTrackById(likedTracks[0].id);
                        }
                      }}
                      disabled={likedTracks.length === 0}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                        likedTracks.length > 0
                          ? "bg-gradient-to-tr from-rose-500 to-pink-500 text-white hover:scale-105 active:scale-95 shadow-rose-500/30 cursor-pointer"
                          : "bg-white/10 light:bg-neutral-900/[0.06] text-white/30 light:text-neutral-400 cursor-not-allowed"
                      }`}
                      title={likedTracks.length > 0 ? t("music.favorites.title", "Play all favorites") : t("music.favorites.emptyTitle", "No tracks")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="26"
                        height="26"
                        className="translate-x-0.5"
                      >
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </button>

                    {/* Shuffle Button */}
                    {likedTracks.length > 1 && (
                      <button
                        onClick={() => {
                          setIsShuffle(true);
                          const rand = Math.floor(Math.random() * likedTracks.length);
                          playTrackById(likedTracks[rand].id);
                        }}
                        className="p-3 rounded-full bg-white/5 light:bg-neutral-900/[0.04] hover:bg-white/10 light:hover:bg-neutral-900/[0.06] text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 border border-white/10 light:border-neutral-900/10 transition-all text-sm"
                        title={t("music.charts.shuffle", "Shuffle play favorites")}
                      >
                        🔀
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-white/40 light:text-neutral-500">
                    {t("music.favorites.removeTooltip", "Click ❤️ to remove from favorites")}
                  </div>
                </div>

                {/* 3. Table of Liked Tracks */}
                <div className="px-4 sm:px-8 pb-12">
                  {likedTracks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-white/[0.02] light:bg-neutral-900/[0.04] border border-dashed border-white/10 light:border-neutral-900/10 flex flex-col items-center justify-center max-w-md mx-auto my-8">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-4">
                        💔
                      </div>
                      <h3 className="text-base font-bold text-white light:text-neutral-900 mb-2">
                        {t("music.favorites.emptyTitle", "No favorite tracks yet")}
                      </h3>
                      <p className="text-xs text-white/50 light:text-neutral-500 mb-6 leading-relaxed">
                        {t("music.favorites.emptyDesc", "Click the heart icon on any track to save it here for quick access.")}
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab("charts");
                          setShowOnlyLiked(false);
                        }}
                        className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                      >
                        <span>🏆</span>
                        <span>{t("music.favorites.exploreBtn", "Explore Soundtracks")}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 light:border-neutral-900/10 bg-black/30 light:bg-white/70 backdrop-blur-md overflow-hidden shadow-2xl">
                      {/* Table Header */}
                      <div className="flex items-center px-4 py-3 text-[11px] font-bold text-white/40 light:text-neutral-500 uppercase tracking-wider border-b border-white/10 light:border-neutral-900/10">
                        <div className="w-10 text-center">{t("music.charts.table.rank", "#")}</div>
                        <div className="flex-1 min-w-0 pr-2">{t("music.charts.table.title", "TITLE & ARTIST")}</div>
                        <div className="hidden md:block w-48 pr-4">{t("music.charts.table.albumGenre", "ALBUM / GENRE")}</div>
                        <div className="hidden sm:block w-28 text-right pr-4">{t("music.charts.table.plays", "PLAYS")}</div>
                        <div className="w-24 text-right pr-2">{t("music.charts.table.duration", "DURATION")}</div>
                      </div>

                      {/* Table Rows */}
                      <div className="divide-y divide-white/5">
                        {likedTracks.map((track, idx) => {
                          const isCurrent = currentTrack?.id === track.id;
                          const isThisPlaying = isPlaying && isCurrent;

                          return (
                            <div
                              key={track.id}
                              onClick={() => playTrackById(track.id)}
                              className={`flex items-center px-4 py-3 cursor-pointer group transition-colors ${
                                isCurrent ? "bg-rose-500/10" : "hover:bg-white/5 light:hover:bg-neutral-900/[0.04]"
                              }`}
                            >
                              {/* # Col */}
                              <div className="w-10 text-center flex items-center justify-center flex-shrink-0">
                                {isThisPlaying ? (
                                  <div className="music-mini-bars">
                                    <span style={{ backgroundColor: "#f43f5e" }} />
                                    <span style={{ backgroundColor: "#f43f5e" }} />
                                    <span style={{ backgroundColor: "#f43f5e" }} />
                                  </div>
                                ) : (
                                  <span className="text-xs font-mono text-white/40 light:text-neutral-500 group-hover:hidden">
                                    {idx + 1}
                                  </span>
                                )}
                                <span className="hidden group-hover:inline-block text-xs text-white light:text-neutral-900">
                                  ▶
                                </span>
                              </div>

                              {/* Title, Artist, Thumb */}
                              <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 light:bg-neutral-900/[0.06] flex-shrink-0 shadow relative">
                                  {track.thumbnailUrl ? (
                                    <Image
                                      src={track.thumbnailUrl}
                                      alt={track.title}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">
                                      🎵
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={`text-sm font-semibold truncate ${
                                      isCurrent ? "text-rose-400 font-bold" : "text-white light:text-neutral-900"
                                    }`}
                                  >
                                    {track.title}
                                  </div>
                                  <div className="text-xs text-white/50 light:text-neutral-500 truncate flex items-center gap-2">
                                    <span>{track.artist}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Album / Genre */}
                              <div className="hidden md:block w-48 text-xs text-white/60 light:text-neutral-600 truncate pr-4">
                                {track.album || track.genre || t("music.infoView.singleRelease", "Single Release")}
                              </div>

                              {/* Plays count */}
                              <div className="hidden sm:block w-28 text-right text-xs font-mono text-white/70 light:text-neutral-600 pr-4">
                                {(track.playCount ?? 0).toLocaleString()}
                              </div>

                              {/* Duration & Unlike button */}
                              <div className="w-24 flex items-center justify-end gap-3 flex-shrink-0 pr-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLike(track.id);
                                  }}
                                  className="text-sm text-rose-400 hover:scale-125 transition-transform"
                                  title={t("music.favorites.removeTooltip", "Remove from favorites")}
                                >
                                  ❤️
                                </button>
                                <span className="text-xs font-mono text-white/50 light:text-neutral-500 tabular-nums">
                                  {formatTime(track.duration)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── TAB 2: QUEUE LIST ── */}
            {activeTab === "queue" && (
              <section className="music-queue-view">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white light:text-neutral-900">{t("music.queueView.title", "Up Next Queue")}</h2>
                    <p className="text-xs text-white/50 light:text-neutral-500">
                      {tracks.length} {t("music.queueView.desc", "tracks queued for continuous playback")}
                    </p>
                  </div>
                </div>

                <div className="music-queue-list">
                  {tracks.map((track, i) => {
                    const isSelected = i === currentIndex;
                    const isLiked = likedTrackIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrackByIndex(i)}
                        className={`music-queue-item ${isSelected ? "music-queue-item--active" : ""}`}
                      >
                        <div className="w-8 text-center text-xs text-white/40 light:text-neutral-500 font-mono">
                          {isSelected && isPlaying ? (
                            <div className="music-mini-bars">
                              <span />
                              <span />
                              <span />
                            </div>
                          ) : (
                            i + 1
                          )}
                        </div>

                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 light:bg-neutral-900/[0.06] border border-white/10 light:border-neutral-900/10">
                          {track.thumbnailUrl ? (
                            <Image
                              src={track.thumbnailUrl}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">
                              🎵
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white light:text-neutral-900 truncate">
                            {track.title}
                          </div>
                          <div className="text-xs text-white/50 light:text-neutral-500 truncate flex items-center gap-1.5">
                            <span>{track.artist}</span>
                            {track.genre && (
                              <>
                                <span>•</span>
                                <span className="text-purple-400">{track.genre}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id);
                            }}
                            className={`text-xs ${isLiked ? "text-red-400" : "text-white/30 light:text-neutral-400 hover:text-white light:hover:text-neutral-900"}`}
                            title={isLiked ? t("music.favorites.removeTooltip", "Unlike") : t("music.playerBar.likeTrack", "Like track")}
                          >
                            {isLiked ? "❤️" : "🤍"}
                          </button>
                          <div className="text-xs text-white/40 light:text-neutral-500 tabular-nums">
                            {formatTime(track.duration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── TAB 4: TRACK INFO & AUDIO SPECS + ANALOG VU METERS ── */}
            {activeTab === "info" && (
              <section className="music-info-view">
                <div className="music-info-card">
                  <h3 className="text-lg font-bold text-white light:text-neutral-900 mb-4 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>{t("music.infoView.title", "Audio Specifications & Analog VU Studio")}</span>
                  </h3>

                  {/* Dual Stereo Analog VU Meters */}
                  <div className="p-4 rounded-2xl bg-black/40 light:bg-white/70 border border-white/10 light:border-neutral-900/10 mb-6">
                    <div className="text-xs font-bold text-white/60 light:text-neutral-600 uppercase tracking-wider mb-3 text-center">
                      {t("music.infoView.stereoVu", "STEREO ANALOG VU METERS (REAL-TIME dB)")}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Channel VU */}
                      <div className="music-vu-meter-box">
                        <div className="music-vu-scale">
                          <span>-20</span>
                          <span>-10</span>
                          <span>-5</span>
                          <span>0</span>
                          <span className="text-red-400">+3</span>
                        </div>
                        <div className="music-vu-dial">
                          <div
                            className="music-vu-needle"
                            style={{ transform: `rotate(${leftVuDeg}deg)` }}
                          />
                          <div className="music-vu-center-pin" />
                        </div>
                        <div className="text-[11px] font-bold text-cyan-400 text-center mt-1 font-mono">
                          {t("music.infoView.ch1", "CH 1 (L)")}
                        </div>
                      </div>

                      {/* Right Channel VU */}
                      <div className="music-vu-meter-box">
                        <div className="music-vu-scale">
                          <span>-20</span>
                          <span>-10</span>
                          <span>-5</span>
                          <span>0</span>
                          <span className="text-red-400">+3</span>
                        </div>
                        <div className="music-vu-dial">
                          <div
                            className="music-vu-needle"
                            style={{ transform: `rotate(${rightVuDeg}deg)` }}
                          />
                          <div className="music-vu-center-pin" />
                        </div>
                        <div className="text-[11px] font-bold text-purple-400 text-center mt-1 font-mono">
                          {t("music.infoView.ch2", "CH 2 (R)")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-8">
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.trackTitle", "TRACK TITLE")}</span>
                      <span className="text-white light:text-neutral-900 font-medium">{currentTrack.title}</span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.artist", "ARTIST")}</span>
                      <span className="text-white light:text-neutral-900 font-medium">{currentTrack.artist}</span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.album", "ALBUM")}</span>
                      <span className="text-white light:text-neutral-900 font-medium">
                        {currentTrack.album || t("music.infoView.singleRelease", "Single Release")}
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.genreMood", "GENRE & MOOD")}</span>
                      <span className="text-white light:text-neutral-900 font-medium">
                        {currentTrack.genre || t("music.infoView.uncategorized", "Uncategorized")}
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.activeEq", "ACTIVE EQUALIZER")}</span>
                      <span className="text-purple-400 font-medium capitalize">
                        {eqPreset.replace("_", " ")} Preset
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 light:text-neutral-500 text-xs block">{t("music.infoView.streamEngine", "STREAM ENGINE")}</span>
                      <span className="text-cyan-400 font-medium">
                        {t("music.infoView.engineDesc", "Web Audio API (5-Band EQ / 64 Bins)")}
                      </span>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Cheat Sheet */}
                  <div className="pt-6 border-t border-white/10 light:border-neutral-900/10">
                    <h4 className="text-xs font-bold text-white/60 light:text-neutral-600 uppercase tracking-wider mb-4">
                      {t("music.infoView.shortcutsTitle", "Studio Keyboard Shortcuts")}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs text-white/70 light:text-neutral-600">
                      <div>
                        <kbd className="music-kbd">Space</kbd> {t("music.infoView.shortcuts.playPause", "Play / Pause")}
                      </div>
                      <div>
                        <kbd className="music-kbd">M</kbd> {t("music.infoView.shortcuts.mute", "Mute / Unmute")}
                      </div>
                      <div>
                        <kbd className="music-kbd">← / →</kbd> {t("music.infoView.shortcuts.seek", "Seek -5s / +5s")}
                      </div>
                      <div>
                        <kbd className="music-kbd">Shift + ← / →</kbd> {t("music.infoView.shortcuts.prevNext", "Prev / Next")}
                      </div>
                      <div>
                        <kbd className="music-kbd">↑ / ↓</kbd> {t("music.infoView.shortcuts.volume", "Volume Up / Down")}
                      </div>
                      <div>
                        <kbd className="music-kbd">L</kbd> {t("music.infoView.shortcuts.like", "Like / Favorite")}
                      </div>
                      <div>
                        <kbd className="music-kbd">Z</kbd> {t("music.infoView.shortcuts.zen", "Zen Fullscreen")}
                      </div>
                      <div>
                        <kbd className="music-kbd">C</kbd> {t("music.infoView.shortcuts.collapse", "Collapse Player")}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* ─────────────────────────────────────────────────────────────
              COLLAPSIBLE PRO BOTTOM PLAYER BAR (Inside Right Stage Column)
          ────────────────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
          {isPlayerCollapsed ? (
            /* ── COLLAPSED MINI FLOATING DOCK ── */
            <motion.div
              key="collapsed-player"
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="music-collapsed-dock"
            >
              {/* Mini cover art */}
              <div
                className={`music-dock-art ${isPlaying ? "animate-[spin_6s_linear_infinite]" : ""}`}
              >
                {currentTrack.thumbnailUrl ? (
                  <Image src={currentTrack.thumbnailUrl} alt="" fill sizes="38px" />
                ) : (
                  <span>🎵</span>
                )}
              </div>

              {/* Mini track title */}
              <div className="music-dock-info" onClick={togglePlayerCollapsed}>
                <div className="music-dock-title truncate">{currentTrack.title}</div>
                <div className="music-dock-artist truncate">{currentTrack.artist}</div>
              </div>

              {/* Mini live pulse */}
              <div className="music-mini-bars">
                <span style={{ height: isPlaying ? `${Math.max(4, audioMetrics.bass * 14)}px` : "3px" }} />
                <span style={{ height: isPlaying ? `${Math.max(4, audioMetrics.mid * 14)}px` : "3px" }} />
                <span style={{ height: isPlaying ? `${Math.max(4, audioMetrics.treble * 14)}px` : "3px" }} />
              </div>

              {/* Mini controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePlay}
                  className="music-dock-btn music-dock-btn--play"
                  title={isPlaying ? t("music.playerBar.pauseTooltip", "Pause (Space)") : t("music.playerBar.playTooltip", "Play (Space)")}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <button
                  onClick={nextTrack}
                  className="music-dock-btn"
                  title={t("music.playerBar.nextTooltip", "Next Track")}
                >
                  <NextIcon />
                </button>

                {/* Expand Button */}
                <button
                  onClick={togglePlayerCollapsed}
                  className="music-dock-btn music-dock-btn--expand"
                  title={t("music.playerBar.expandTooltip", "Expand Player Bar (C)")}
                >
                  <span>▲</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── EXPANDED FULL PRO STUDIO BAR ── */
            <motion.footer
              key="expanded-player"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="music-bottom-bar"
            >
              {/* Left: Track preview */}
              <div className="music-bar-track">
                <div className="music-bar-thumb">
                  {currentTrack.thumbnailUrl ? (
                    <Image src={currentTrack.thumbnailUrl} alt="" fill sizes="52px" />
                  ) : (
                    <div className="music-default-art">🎵</div>
                  )}
                </div>
                <div className="music-bar-meta">
                  <div className="flex items-center gap-2">
                    <span className="music-bar-title">{currentTrack.title}</span>
                    <button
                      onClick={() => toggleLike(currentTrack.id)}
                      className={`text-xs transition-colors ${isCurrentLiked ? "text-red-400" : "text-white/30 light:text-neutral-400 hover:text-white light:hover:text-neutral-900"
                        }`}
                      title={isCurrentLiked ? t("music.playerBar.unlikeTrack", "Liked!") : t("music.playerBar.likeTrack", "Like track")}
                    >
                      {isCurrentLiked ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <span className="music-bar-artist">{currentTrack.artist}</span>
                </div>
              </div>

              {/* Center: Buttons + Scrub Bar */}
              <div className="music-bar-center">
                {/* Playback Buttons */}
                <div className="music-playback-buttons">
                  <button
                    id="music-shuffle-btn"
                    onClick={() => setIsShuffle((s) => !s)}
                    className={`music-ctrl-btn ${isShuffle ? "music-ctrl-btn--active" : ""}`}
                    aria-label="Shuffle"
                    title={isShuffle ? t("music.playerBar.shuffleOn", "Shuffle On") : t("music.playerBar.shuffleOff", "Shuffle Off")}
                  >
                    <ShuffleIcon />
                  </button>

                  <button
                    id="music-prev-btn"
                    onClick={prevTrack}
                    className="music-ctrl-btn music-ctrl-btn--skip"
                    aria-label="Previous Track"
                    title={t("music.playerBar.prevTooltip", "Previous Track (Shift+Left)")}
                  >
                    <PrevIcon />
                  </button>

                  <button
                    id="music-play-btn"
                    onClick={togglePlay}
                    className="music-ctrl-btn music-ctrl-btn--play-main"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    disabled={isLoading}
                    title={isPlaying ? t("music.playerBar.pauseTooltip", "Pause (Space)") : t("music.playerBar.playTooltip", "Play (Space)")}
                  >
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : isPlaying ? (
                      <PauseIcon />
                    ) : (
                      <PlayIcon />
                    )}
                  </button>

                  <button
                    id="music-next-btn"
                    onClick={nextTrack}
                    className="music-ctrl-btn music-ctrl-btn--skip"
                    aria-label="Next Track"
                    title={t("music.playerBar.nextTooltip", "Next Track (Shift+Right)")}
                  >
                    <NextIcon />
                  </button>

                  <button
                    id="music-repeat-btn"
                    onClick={cycleRepeat}
                    className={`music-ctrl-btn ${repeatMode !== "none" ? "music-ctrl-btn--active" : ""}`}
                    aria-label={`Repeat: ${repeatMode}`}
                    title={`${t("music.playerBar.repeatMode", "Repeat")}: ${repeatMode}`}
                  >
                    {repeatMode === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
                  </button>
                </div>

                {/* Scrub Timeline */}
                <div className="music-timeline">
                  <span className="music-time-label">{formatTime(currentTime)}</span>

                  <div
                    ref={seekContainerRef}
                    className="music-scrub-track"
                    onClick={handleSeekClick}
                    onMouseMove={handleSeekMouseMove}
                    onMouseLeave={() => setHoverSeekTime(null)}
                  >
                    {/* Buffer Bar */}
                    <div
                      className="music-scrub-buffer"
                      style={{ width: `${buffered}%` }}
                    />

                    {/* Progress Bar */}
                    <div
                      className="music-scrub-progress"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="music-scrub-handle" />
                    </div>

                    {/* Hover Tooltip */}
                    {hoverSeekTime !== null && (
                      <div
                        className="music-scrub-tooltip"
                        style={{ left: `${hoverSeekPos}%` }}
                      >
                        {formatTime(hoverSeekTime)}
                      </div>
                    )}
                  </div>

                  <span className="music-time-label">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right: Karaoke, Speed, Volume, Collapse Button */}
              <div className="music-bar-right">
                {/* Quick Karaoke Toggle Button */}
                <button
                  onClick={() => {
                    setActiveTab("player");
                    setDeckMode(deckMode === "lyrics" && activeTab === "player" ? "vinyl" : "lyrics");
                  }}
                  className={`music-ctrl-btn music-ctrl-btn--sm ${
                    deckMode === "lyrics" && activeTab === "player"
                      ? "!text-cyan-300 !border-cyan-500/40 !bg-cyan-500/20"
                      : "text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900"
                  }`}
                  title={
                    deckMode === "lyrics" && activeTab === "player"
                      ? t("music.playerBar.karaokeClose", "Close Lyrics (Back to Vinyl)")
                      : t("music.playerBar.karaokeOpen", "Open Lyrics (Karaoke)")
                  }
                  aria-label="Karaoke"
                >
                  🎤
                </button>

                {/* Playback speed */}
                <button
                  onClick={cycleSpeed}
                  className="music-speed-badge"
                  title={t("music.playerBar.speed", "Playback Speed")}
                >
                  {playbackRate}x
                </button>

                {/* Volume Slider */}
                <div className="music-volume-group">
                  <button
                    id="music-mute-btn"
                    onClick={toggleMute}
                    className="music-ctrl-btn music-ctrl-btn--sm"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    title={t("music.playerBar.muteTooltip", "Mute / Unmute (M)")}
                  >
                    {isMuted || volume === 0 ? (
                      <MuteIcon />
                    ) : volume < 0.5 ? (
                      <VolumeLowIcon />
                    ) : (
                      <VolumeHighIcon />
                    )}
                  </button>

                  <div className="music-volume-slider-wrap">
                    <input
                      id="music-volume-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="music-volume-slider"
                      style={{ "--val": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                      aria-label="Volume"
                    />
                  </div>
                </div>

                {/* Collapse Player Button */}
                <button
                  onClick={togglePlayerCollapsed}
                  className="music-collapse-btn"
                  title={t("music.playerBar.collapseTooltip", "Collapse Player Bar (Hotkey: C)")}
                >
                  <span>▼</span>
                  <span className="hidden lg:inline text-[11px]">{t("music.playerBar.collapseLabel", "Collapse")}</span>
                </button>
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MusicPlayer(props: MusicPlayerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black light:bg-white" />}>
      <MusicPlayerContent initialTracks={props.tracks} />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);

const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 18l8.5-6L6 6v12zm2.5-6 6-4.35v8.7L8.5 12zM16 6h2v12h-2z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);

const RepeatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
  </svg>
);

const RepeatOneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v6H13z" />
  </svg>
);

const VolumeHighIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeLowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
);

const MuteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="animate-spin">
    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
  </svg>
);
