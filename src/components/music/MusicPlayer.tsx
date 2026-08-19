"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic, Track, EqPreset } from "@/context/MusicContext";
import MusicSidebar from "./MusicSidebar";
import LyricsView from "./LyricsView";
import ZenModeView from "./ZenModeView";
import MusicRoomModal from "./MusicRoomModal";
import MusicRoomBar from "./MusicRoomBar";
import LiveReactionOverlay from "./LiveReactionOverlay";
import {
  SpectrumBarsVisualizer,
  WaveVisualizer,
  PulsarVisualizer,
} from "./Visualizers";
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
  } = useMusic();

  const seekContainerRef = useRef<HTMLDivElement>(null);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState(0);

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
        <MusicSidebar />
        <main className="music-main-stage flex items-center justify-center min-h-[70vh]">
          <div className="music-empty-card text-center p-8 rounded-3xl bg-white/5 border border-white/10 max-w-md">
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="text-xl font-bold text-white mb-2">No Tracks Found</h2>
            <p className="text-white/50 text-sm mb-6">
              The sound library is currently empty. Add tracks from the Admin Manager.
            </p>
          </div>
        </main>
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

          {/* Main Stage */}
          <main className="music-main-stage">
            {/* Top Stage Bar (Search, Mobile Toggle, Tabs, Room, EQ, Timer, Zen) */}
            <header className="music-top-bar">
              {/* Mobile menu trigger */}
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="music-mobile-menu-btn"
                  aria-label="Open Music Navigation"
                >
                  <span>☰</span>
                  <span className="text-xs font-semibold">Menu</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="music-top-search">
                <span className="music-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search tracks, artists, albums, lyrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="music-top-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="music-search-clear-btn"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Active Filter Chips & Actions */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {selectedGenre !== "All" && (
                  <div className="music-active-chip">
                    <span>Mood: {selectedGenre}</span>
                    <button onClick={() => setSelectedGenre("All")}>✕</button>
                  </div>
                )}

                {showOnlyLiked && (
                  <div className="music-active-chip music-active-chip--liked">
                    <span>❤️ Liked Only</span>
                    <button onClick={() => setShowOnlyLiked(false)}>✕</button>
                  </div>
                )}

                {/* Listen Together Quick Button */}
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    room
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 text-white/90 border-white/10"
                  }`}
                  title="Listen together in a 5-character room"
                >
                  <span>🎧</span>
                  <span className="hidden sm:inline">{room ? `#${room.code}` : "Listen Together"}</span>
                </button>

                {/* Equalizer Preset Selector */}
                <select
                  value={eqPreset}
                  onChange={(e) => setEqPreset(e.target.value as EqPreset)}
                  className="music-sort-select"
                  title="Graphic Equalizer Preset"
                  aria-label="Equalizer Preset"
                >
                  <option value="flat">🎚️ EQ: Flat / Studio</option>
                  <option value="bass_boost">🔊 EQ: Bass Boost</option>
                  <option value="vocal">🎤 EQ: Vocal & Acoustic</option>
                  <option value="electronic">🌌 EQ: Synth & EDM</option>
                  <option value="chill">☕ EQ: Chill Lofi</option>
                </select>

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
                  title="Sleep Timer"
                  aria-label="Sleep Timer"
                >
                  <option value="off">⏱️ Sleep: Off</option>
                  <option value="15">⏱️ Sleep: 15 min</option>
                  <option value="30">⏱️ Sleep: 30 min</option>
                  <option value="45">⏱️ Sleep: 45 min</option>
                  <option value="60">⏱️ Sleep: 60 min</option>
                  <option value="end">⏱️ Sleep: End of Track</option>
                </select>

                {/* Sleep Timer Countdown Badge */}
                {sleepTimer.remainingSeconds !== null && (
                  <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30 animate-pulse">
                    ⏱️ {Math.floor(sleepTimer.remainingSeconds / 60)}:
                    {(sleepTimer.remainingSeconds % 60).toString().padStart(2, "0")}
                  </span>
                )}

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "default" | "title" | "plays" | "duration")
                  }
                  className="music-sort-select"
                  aria-label="Sort tracks by"
                >
                  <option value="default">Sort: Default</option>
                  <option value="plays">Sort: Most Played</option>
                  <option value="title">Sort: Track Title</option>
                  <option value="duration">Sort: Duration</option>
                </select>

                {/* Zen Mode Button */}
                <button
                  onClick={() => setIsZenMode(true)}
                  className="music-zen-btn"
                  title="Fullscreen Zen Mode (Hotkey: Z)"
                >
                  <span>📺</span>
                  <span className="hidden sm:inline">Zen Mode</span>
                </button>
              </div>
            </header>

            {/* ── TAB 1: TURNTABLE & VISUALIZER DECK ── */}
            {activeTab === "player" && (
              <section className="music-deck-section">
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
                        <img src={currentTrack.thumbnailUrl} alt="" className="music-vinyl-art" />
                      ) : (
                        <div className="music-vinyl-placeholder">JD</div>
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
                      <img
                        src={currentTrack.thumbnailUrl}
                        alt={currentTrack.title}
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
                        <span className="music-lossless-badge">HI-RES AUDIO</span>
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
                      title={isCurrentLiked ? "Liked!" : "Add to Liked Songs (L)"}
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
                      🔥 {currentTrack.playCount.toLocaleString()} plays
                    </span>
                    <span className="music-pill-meta">
                      ⏱️ {formatTime(currentTrack.duration)}
                    </span>
                    <button
                      onClick={() => setActiveTab("lyrics")}
                      className="music-pill-meta hover:bg-white/10 text-cyan-300 border-cyan-500/30 cursor-pointer"
                    >
                      🎤 View Lyrics
                    </button>
                  </div>
                </div>

                {/* Real-Time Web Audio Visualizer */}
                <div className="music-stage-visualizer">
                  {visualizerStyle === "bars" && <SpectrumBarsVisualizer />}
                  {visualizerStyle === "wave" && <WaveVisualizer />}
                  {visualizerStyle === "pulsar" && <PulsarVisualizer />}
                </div>

                {/* Quick Track Grid / Playlist Preview */}
                <div className="music-quick-library">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                      Soundtrack Collection ({filteredTracks.length})
                    </h3>
                    <span className="text-xs text-white/40">Click to Play</span>
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
                              <img src={t.thumbnailUrl} alt={t.title} />
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
                              className={`text-xs ${isLiked ? "text-red-400" : "text-white/30 hover:text-white"}`}
                            >
                              {isLiked ? "❤️" : "🤍"}
                            </button>
                            <span className="text-[11px] text-white/40 tabular-nums">
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

            {/* ── TAB 2: KARAOKE LIVE SYNCED LYRICS ── */}
            {activeTab === "lyrics" && (
              <section className="music-lyrics-section max-w-2xl mx-auto w-full">
                <LyricsView />
              </section>
            )}

            {/* ── TAB 3: QUEUE LIST ── */}
            {activeTab === "queue" && (
              <section className="music-queue-view">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Up Next Queue</h2>
                    <p className="text-xs text-white/50">
                      {tracks.length} tracks queued for continuous playback
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
                        <div className="w-8 text-center text-xs text-white/40 font-mono">
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

                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 border border-white/10">
                          {track.thumbnailUrl ? (
                            <img
                              src={track.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">
                              🎵
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {track.title}
                          </div>
                          <div className="text-xs text-white/50 truncate flex items-center gap-1.5">
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
                            className={`text-xs ${isLiked ? "text-red-400" : "text-white/30 hover:text-white"}`}
                            title="Like track"
                          >
                            {isLiked ? "❤️" : "🤍"}
                          </button>
                          <div className="text-xs text-white/40 tabular-nums">
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
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>Audio Specifications & Analog VU Studio</span>
                  </h3>

                  {/* Dual Stereo Analog VU Meters */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 text-center">
                      STEREO ANALOG VU METERS (REAL-TIME dB)
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
                          CH 1 (L)
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
                          CH 2 (R)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-8">
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">TRACK TITLE</span>
                      <span className="text-white font-medium">{currentTrack.title}</span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">ARTIST</span>
                      <span className="text-white font-medium">{currentTrack.artist}</span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">ALBUM</span>
                      <span className="text-white font-medium">
                        {currentTrack.album || "Single Release"}
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">GENRE & MOOD</span>
                      <span className="text-white font-medium">
                        {currentTrack.genre || "Uncategorized"}
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">ACTIVE EQUALIZER</span>
                      <span className="text-purple-400 font-medium capitalize">
                        {eqPreset.replace("_", " ")} Preset
                      </span>
                    </div>
                    <div className="music-info-field">
                      <span className="text-white/40 text-xs block">STREAM ENGINE</span>
                      <span className="text-cyan-400 font-medium">
                        Web Audio API (5-Band EQ / 64 Bins)
                      </span>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Cheat Sheet */}
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">
                      Studio Keyboard Shortcuts
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs text-white/70">
                      <div>
                        <kbd className="music-kbd">Space</kbd> Play / Pause
                      </div>
                      <div>
                        <kbd className="music-kbd">M</kbd> Mute / Unmute
                      </div>
                      <div>
                        <kbd className="music-kbd">← / →</kbd> Seek -5s / +5s
                      </div>
                      <div>
                        <kbd className="music-kbd">Shift + ← / →</kbd> Prev / Next
                      </div>
                      <div>
                        <kbd className="music-kbd">↑ / ↓</kbd> Volume Up / Down
                      </div>
                      <div>
                        <kbd className="music-kbd">L</kbd> Like / Favorite
                      </div>
                      <div>
                        <kbd className="music-kbd">Z</kbd> Zen Fullscreen
                      </div>
                      <div>
                        <kbd className="music-kbd">C</kbd> Collapse Player
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          COLLAPSIBLE PRO BOTTOM PLAYER BAR (When not in Zen Mode)
      ────────────────────────────────────────────────────────────── */}
      {!isZenMode && (
        <AnimatePresence mode="wait">
          {isPlayerCollapsed ? (
            /* ── COLLAPSED MINI FLOATING DOCK (Thu gọn) ── */
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
                  <img src={currentTrack.thumbnailUrl} alt="" />
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
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <button
                  onClick={nextTrack}
                  className="music-dock-btn"
                  title="Next Track"
                >
                  <NextIcon />
                </button>

                {/* Expand Button */}
                <button
                  onClick={togglePlayerCollapsed}
                  className="music-dock-btn music-dock-btn--expand"
                  title="Expand Player Bar (C)"
                >
                  <span>▲</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── EXPANDED FULL PRO STUDIO BAR (Mở rộng) ── */
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
                    <img src={currentTrack.thumbnailUrl} alt="" />
                  ) : (
                    <div className="music-default-art">🎵</div>
                  )}
                </div>
                <div className="music-bar-meta">
                  <div className="flex items-center gap-2">
                    <span className="music-bar-title">{currentTrack.title}</span>
                    <button
                      onClick={() => toggleLike(currentTrack.id)}
                      className={`text-xs transition-colors ${
                        isCurrentLiked ? "text-red-400" : "text-white/30 hover:text-white"
                      }`}
                      title={isCurrentLiked ? "Liked!" : "Like track"}
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
                    title={isShuffle ? "Shuffle On" : "Shuffle Off"}
                  >
                    <ShuffleIcon />
                  </button>

                  <button
                    id="music-prev-btn"
                    onClick={prevTrack}
                    className="music-ctrl-btn music-ctrl-btn--skip"
                    aria-label="Previous Track"
                    title="Previous Track (Shift+Left)"
                  >
                    <PrevIcon />
                  </button>

                  <button
                    id="music-play-btn"
                    onClick={togglePlay}
                    className="music-ctrl-btn music-ctrl-btn--play-main"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    disabled={isLoading}
                    title="Play / Pause (Space)"
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
                    title="Next Track (Shift+Right)"
                  >
                    <NextIcon />
                  </button>

                  <button
                    id="music-repeat-btn"
                    onClick={cycleRepeat}
                    className={`music-ctrl-btn ${repeatMode !== "none" ? "music-ctrl-btn--active" : ""}`}
                    aria-label={`Repeat: ${repeatMode}`}
                    title={`Repeat: ${repeatMode}`}
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

              {/* Right: Speed, Volume, Collapse Button */}
              <div className="music-bar-right">
                {/* Playback speed */}
                <button
                  onClick={cycleSpeed}
                  className="music-speed-badge"
                  title="Playback Speed"
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
                    title="Mute / Unmute (M)"
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

                {/* Collapse Player Button (Thu gọn) */}
                <button
                  onClick={togglePlayerCollapsed}
                  className="music-collapse-btn"
                  title="Collapse Player Bar (Hotkey: C)"
                >
                  <span>▼</span>
                  <span className="hidden lg:inline text-[11px]">Collapse</span>
                </button>
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function MusicPlayer(props: MusicPlayerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
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
