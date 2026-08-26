"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic, EqPreset } from "@/context/MusicContext";
import LyricsView from "./LyricsView";
import {
  SpectrumBarsVisualizer,
  WaveVisualizer,
  PulsarVisualizer,
} from "./Visualizers";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ZenModeView() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    setIsZenMode,
    likedTrackIds,
    toggleLike,
    visualizerStyle,
    setVisualizerStyle,
    audioMetrics,
    ambientSounds,
    toggleAmbientSound,
    setAmbientSoundVolume,
    eqPreset,
    setEqPreset,
    sleepTimer,
    setSleepTimerMinutes,
  } = useMusic();

  const [zenView, setZenView] = useState<"lyrics" | "visualizer" | "ambient">("lyrics");
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls after 3s of mouse inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    };

    // Escape key to exit Zen Mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setIsZenMode(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [setIsZenMode]);

  if (!currentTrack) return null;

  const isCurrentLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="music-zen-fullscreen">
      {/* ── Dynamic Ambient Mesh Aura ── */}
      <div
        className="music-zen-mesh"
        style={{
          transform: `scale(${1 + audioMetrics.bass * 0.25})`,
          opacity: isPlaying ? 0.7 + audioMetrics.avgVolume * 0.3 : 0.3,
          filter: `blur(${80 + audioMetrics.bass * 40}px)`,
        }}
      />

      {/* ── Top Header Controls ── */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="music-zen-header"
          >
            {/* Mode Switchers */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15">
              <button
                onClick={() => setZenView("lyrics")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  zenView === "lyrics"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                🎤 Karaoke Lyrics
              </button>
              <button
                onClick={() => setZenView("visualizer")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  zenView === "visualizer"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                🌊 Full Visualizer
              </button>
              <button
                onClick={() => setZenView("ambient")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  zenView === "ambient"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                🌧️ Nature Ambience
              </button>
            </div>

            {/* Quick Actions (EQ, Sleep Timer, Exit) */}
            <div className="flex items-center gap-2">
              {/* EQ preset in Zen Mode */}
              <select
                value={eqPreset}
                onChange={(e) => setEqPreset(e.target.value as EqPreset)}
                className="music-sort-select !bg-black/50 backdrop-blur-xl !text-xs hidden sm:block"
                title="Equalizer Preset"
              >
                <option value="flat">🎚️ Flat</option>
                <option value="bass_boost">🔊 Bass Boost</option>
                <option value="vocal">🎤 Vocal</option>
                <option value="electronic">🌌 Synth/EDM</option>
                <option value="chill">☕ Chill</option>
              </select>

              {/* Sleep timer in Zen Mode */}
              <select
                value={sleepTimer.minutes === null ? "off" : sleepTimer.minutes === 0 ? "end" : String(sleepTimer.minutes)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "off") setSleepTimerMinutes(null);
                  else if (v === "end") setSleepTimerMinutes(0);
                  else setSleepTimerMinutes(Number(v));
                }}
                className={`music-sort-select !bg-black/50 backdrop-blur-xl !text-xs hidden sm:block ${
                  sleepTimer.minutes !== null ? "!border-cyan-400 !text-cyan-300" : ""
                }`}
                title="Sleep Timer"
              >
                <option value="off">⏱️ Sleep: Off</option>
                <option value="15">⏱️ 15m</option>
                <option value="30">⏱️ 30m</option>
                <option value="45">⏱️ 45m</option>
                <option value="60">⏱️ 60m</option>
                <option value="end">⏱️ End Track</option>
              </select>

              {sleepTimer.remainingSeconds !== null && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-full border border-cyan-500/40">
                  ⏱️ {Math.floor(sleepTimer.remainingSeconds / 60)}:
                  {(sleepTimer.remainingSeconds % 60).toString().padStart(2, "0")}
                </span>
              )}

              {/* Exit Zen Button */}
              <button
                onClick={() => setIsZenMode(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xl transition-all"
                title="Exit Fullscreen Zen Mode (Esc / Z)"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Exit Zen</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Main Zen Stage ── */}
      <main className="music-zen-stage">
        {zenView === "lyrics" && (
          <div className="music-zen-split-grid">
            {/* Left: Giant 3D Turntable */}
            <div className="music-zen-vinyl-column">
              <div
                className={`music-zen-giant-vinyl ${isPlaying ? "music-vinyl--spinning" : ""}`}
                style={{
                  animationPlayState: isPlaying ? "running" : "paused",
                  transform: `scale(${isPlaying ? 1 + audioMetrics.bass * 0.05 : 1})`,
                  boxShadow: `0 0 ${30 + audioMetrics.bass * 60}px rgba(168, 85, 247, 0.4), 0 25px 60px rgba(0,0,0,0.9)`,
                }}
              >
                <div className="music-vinyl-grooves" />
                <div className="music-zen-giant-art">
                  {currentTrack.thumbnailUrl ? (
                    <img src={currentTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎵</span>
                  )}
                  <div className="music-vinyl-hole" />
                </div>
              </div>

              {/* Tonearm */}
              <div className={`music-zen-tonearm ${isPlaying ? "music-zen-tonearm--playing" : ""}`}>
                <div className="music-tonearm-base" />
                <div className="music-tonearm-arm !h-[140px]" />
                <div className="music-tonearm-head" />
              </div>

              {/* Track Title */}
              <div className="text-center mt-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {currentTrack.title}
                </h1>
                <p className="text-base text-white/60 font-medium mt-1">{currentTrack.artist}</p>
                {currentTrack.album && (
                  <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 mt-2 inline-block">
                    💿 {currentTrack.album}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Live Karaoke Synced Lyrics Display */}
            <div className="music-zen-lyrics-column">
              <LyricsView compact={false} />
            </div>
          </div>
        )}

        {zenView === "visualizer" && (
          <div className="music-zen-visualizer-view">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-pink-400">
                {currentTrack.title}
              </h1>
              <p className="text-lg text-white/60 mt-2">{currentTrack.artist}</p>
            </div>

            <div className="music-zen-vis-full-container">
              {visualizerStyle === "bars" && <SpectrumBarsVisualizer />}
              {visualizerStyle === "wave" && <WaveVisualizer />}
              {visualizerStyle === "pulsar" && <PulsarVisualizer />}
            </div>
          </div>
        )}

        {zenView === "ambient" && (
          <div className="music-zen-ambient-view">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2">
                🌧️ Nature Soundscape Mixer
              </h2>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Layer calming ambient sounds over your music for ultimate focus, coding, and meditation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
              {/* Rain Sound */}
              <div className={`music-ambient-card ${ambientSounds.rain ? "music-ambient-card--active" : ""}`}>
                <div className="text-4xl mb-2">🌧️</div>
                <div className="font-bold text-white text-base">Gentle Rain</div>
                <p className="text-xs text-white/50 mb-4">Soft rain on a rooftop</p>

                <button
                  onClick={() => toggleAmbientSound("rain")}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mb-3 ${
                    ambientSounds.rain
                      ? "bg-cyan-500 text-black font-bold"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {ambientSounds.rain ? "Active" : "Turn On"}
                </button>

                {ambientSounds.rain && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={ambientSounds.rainVolume}
                    onChange={(e) => setAmbientSoundVolume("rain", Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                )}
              </div>

              {/* Fireplace Sound */}
              <div className={`music-ambient-card ${ambientSounds.fire ? "music-ambient-card--active" : ""}`}>
                <div className="text-4xl mb-2">🔥</div>
                <div className="font-bold text-white text-base">Warm Fireplace</div>
                <p className="text-xs text-white/50 mb-4">Cozy crackling firewood</p>

                <button
                  onClick={() => toggleAmbientSound("fire")}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mb-3 ${
                    ambientSounds.fire
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {ambientSounds.fire ? "Active" : "Turn On"}
                </button>

                {ambientSounds.fire && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={ambientSounds.fireVolume}
                    onChange={(e) => setAmbientSoundVolume("fire", Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                )}
              </div>

              {/* Vinyl Crackle */}
              <div className={`music-ambient-card ${ambientSounds.vinyl ? "music-ambient-card--active" : ""}`}>
                <div className="text-4xl mb-2">📻</div>
                <div className="font-bold text-white text-base">Vinyl Noise</div>
                <p className="text-xs text-white/50 mb-4">Vintage needle texture</p>

                <button
                  onClick={() => toggleAmbientSound("vinyl")}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mb-3 ${
                    ambientSounds.vinyl
                      ? "bg-purple-500 text-white font-bold"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {ambientSounds.vinyl ? "Active" : "Turn On"}
                </button>

                {ambientSounds.vinyl && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={ambientSounds.vinylVolume}
                    onChange={(e) => setAmbientSoundVolume("vinyl", Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Floating Player Bar ── */}
      <AnimatePresence>
        {showControls && (
          <motion.footer
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="music-zen-footer"
          >
            {/* Scrub Timeline */}
            <div className="music-zen-timeline-wrap">
              <span className="text-xs text-white/50 font-mono">{formatTime(currentTime)}</span>
              <div
                className="music-zen-scrub-track"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  seekTo(pos * duration);
                }}
              >
                <div className="music-zen-scrub-progress" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-white/50 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between w-full max-w-4xl mt-3">
              {/* Left track snippet */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className={`text-lg transition-transform active:scale-125 ${
                    isCurrentLiked ? "text-red-400" : "text-white/40 hover:text-white"
                  }`}
                  title="Like track"
                >
                  {isCurrentLiked ? "❤️" : "🤍"}
                </button>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white truncate max-w-[160px]">
                    {currentTrack.title}
                  </div>
                  <div className="text-[11px] text-white/50 truncate max-w-[160px]">
                    {currentTrack.artist}
                  </div>
                </div>
              </div>

              {/* Center Playback Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevTrack}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-sm"
                  title="Previous Track"
                >
                  ⏮
                </button>

                <button
                  onClick={togglePlay}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 text-white font-bold flex items-center justify-center shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-transform"
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <button
                  onClick={nextTrack}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-sm"
                  title="Next Track"
                >
                  ⏭
                </button>
              </div>

              {/* Right Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white/60 hover:text-white text-sm p-1"
                >
                  {isMuted || volume === 0 ? "🔇" : "🔊"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
