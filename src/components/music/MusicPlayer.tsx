"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string | null;
  genre?: string | null;
  playCount: number;
}

interface MusicPlayerProps {
  tracks: Track[];
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type VisualizerStyle = "bars" | "wave" | "pulsar";
type TabView = "player" | "queue" | "info";

export default function MusicPlayer({ tracks: initialTracks }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekContainerRef = useRef<HTMLDivElement>(null);

  // Tracks & Playback state
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>("bars");
  const [isZenMode, setIsZenMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("player");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "title" | "plays" | "duration">("default");

  // Liked tracks (localStorage)
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Tooltip seek time
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState(0);

  // Track play count registered
  const playCountLoggedRef = useRef<string | null>(null);

  // Initialize liked tracks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_music_likes");
      if (saved) {
        setLikedTrackIds(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("portfolio_music_likes", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Compute unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.genre && t.genre.trim()) set.add(t.genre.trim());
    });
    return ["All", ...Array.from(set)];
  }, [tracks]);

  // Filtered & sorted tracks list
  const filteredTracks = useMemo(() => {
    let list = tracks.filter((t) => {
      const matchSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.album && t.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.genre && t.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGenre =
        selectedGenre === "All" ||
        (t.genre && t.genre.toLowerCase() === selectedGenre.toLowerCase());

      const matchLiked = !showOnlyLiked || likedTrackIds.has(t.id);

      return matchSearch && matchGenre && matchLiked;
    });

    if (sortBy === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "plays") {
      list = [...list].sort((a, b) => b.playCount - a.playCount);
    } else if (sortBy === "duration") {
      list = [...list].sort((a, b) => b.duration - a.duration);
    }

    return list;
  }, [tracks, searchQuery, selectedGenre, showOnlyLiked, likedTrackIds, sortBy]);

  const currentTrack = tracks[currentIndex] || tracks[0];

  // Sync audio element when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;
    setCurrentTime(0);
    setDuration(currentTrack.duration || 0);
    setIsLoading(true);
    playCountLoggedRef.current = null;

    if (isPlaying) {
      audio
        .play()
        .then(() => setIsLoading(false))
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Volume & rate sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Count plays after 6s of playback
  useEffect(() => {
    if (
      isPlaying &&
      currentTime > 6 &&
      currentTrack &&
      playCountLoggedRef.current !== currentTrack.id
    ) {
      playCountLoggedRef.current = currentTrack.id;
      fetch(`/api/music/tracks/${currentTrack.id}`, { method: "GET" })
        .then((res) => res.json())
        .then((updated) => {
          if (updated && updated.id) {
            setTracks((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, playCount: updated.playCount } : t))
            );
          }
        })
        .catch(() => {});
    }
  }, [currentTime, isPlaying, currentTrack]);

  // Play a specific track by its original index
  const playTrackByIndex = useCallback(
    (index: number) => {
      if (index === currentIndex && isPlaying) {
        togglePlay();
        return;
      }
      setCurrentIndex(index);
      setIsPlaying(true);
      const audio = audioRef.current;
      if (audio && index === currentIndex) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, isPlaying]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Audio playback error:", err);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const next = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(next);
    } else {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }
    setIsPlaying(true);
  }, [isShuffle, tracks.length]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleEnded = useCallback(() => {
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else if (repeatMode === "all" || currentIndex < tracks.length - 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, currentIndex, tracks.length, nextTrack]);

  // Scrubbing
  const handleSeekChange = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

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
    handleSeekChange(pos * duration);
  };

  const cycleRepeat = () => {
    setRepeatMode((m) => (m === "none" ? "all" : m === "all" ? "one" : "none"));
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
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
        setIsMuted((m) => !m);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) nextTrack();
        else handleSeekChange(Math.min(duration, currentTime + 5));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) prevTrack();
        else handleSeekChange(Math.max(0, currentTime - 5));
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.05));
        setIsMuted(false);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.05));
      } else if (e.code === "KeyL" && currentTrack) {
        e.preventDefault();
        toggleLike(currentTrack.id);
      } else if (e.code === "KeyZ") {
        e.preventDefault();
        setIsZenMode((z) => !z);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, duration, currentTime, currentTrack, toggleLike]);

  if (!currentTrack) {
    return (
      <div className="music-empty-state">
        <div className="music-empty-card">
          <div className="music-empty-icon">🎧</div>
          <h2 className="text-xl font-bold text-white mb-2">No Tracks Found</h2>
          <p className="text-white/50 text-sm mb-6 max-w-sm">
            Music library is currently empty. Check back later or add songs via the Admin panel.
          </p>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isCurrentLiked = likedTrackIds.has(currentTrack.id);

  return (
    <div className={`music-studio ${isZenMode ? "music-studio--zen" : ""}`}>
      {/* Dynamic Ambient Background Light */}
      <div className="music-ambient-glow" aria-hidden="true" />

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onProgress={() => {
          if (audioRef.current && audioRef.current.buffered.length > 0) {
            const end = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
            setBuffered(duration > 0 ? (end / duration) * 100 : 0);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleEnded}
        onCanPlay={() => {
          setIsLoading(false);
          if (isPlaying) audioRef.current?.play().catch(() => {});
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Zen Mode Exit Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="music-zen-exit-btn"
          title="Exit Zen Mode (Esc or Z)"
        >
          <span>✕ Exit Zen Mode</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN STUDIO GRID
      ────────────────────────────────────────────────────────────── */}
      <div className="music-studio-grid">
        {/* ── LEFT: Playlist & Library Sidebar ── */}
        {!isZenMode && (
          <aside className="music-library">
            {/* Header & Search */}
            <div className="music-library-header">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  <h2 className="text-base font-bold text-white tracking-wide">Library</h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.08] text-white/70 font-medium">
                  {filteredTracks.length} / {tracks.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search tracks, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="music-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Genre Pills Filter */}
              <div className="music-genre-scroller">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`music-genre-chip ${selectedGenre === g ? "music-genre-chip--active" : ""}`}
                  >
                    {g}
                  </button>
                ))}
                <button
                  onClick={() => setShowOnlyLiked((prev) => !prev)}
                  className={`music-genre-chip ${showOnlyLiked ? "music-genre-chip--liked" : ""}`}
                  title="Show only liked songs"
                >
                  ❤️ Liked ({likedTrackIds.size})
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className="music-tracklist-wrapper">
              {filteredTracks.length === 0 ? (
                <div className="music-tracklist-empty">
                  <p className="text-white/40 text-sm">No songs match your filter.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedGenre("All");
                      setShowOnlyLiked(false);
                    }}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <ul className="music-tracklist" role="listbox" aria-label="Song list">
                  {filteredTracks.map((track) => {
                    const originalIndex = tracks.findIndex((t) => t.id === track.id);
                    const isSelected = track.id === currentTrack.id;
                    const isLiked = likedTrackIds.has(track.id);

                    return (
                      <li
                        key={track.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => playTrackByIndex(originalIndex)}
                        className={`music-track-item ${isSelected ? "music-track-item--active" : ""}`}
                      >
                        {/* Index / Play Status */}
                        <div className="music-track-num">
                          {isSelected && isPlaying ? (
                            <div className="music-mini-bars">
                              <span />
                              <span />
                              <span />
                            </div>
                          ) : (
                            <span className="music-track-idx">
                              {originalIndex + 1}
                            </span>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="music-track-thumb">
                          {track.thumbnailUrl ? (
                            <img src={track.thumbnailUrl} alt={track.title} />
                          ) : (
                            <div className="music-default-art">
                              <span>🎵</span>
                            </div>
                          )}
                          <div className="music-track-thumb-overlay">
                            {isSelected && isPlaying ? "⏸" : "▶"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="music-track-details">
                          <span className="music-track-title">{track.title}</span>
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            <span className="truncate max-w-[120px]">{track.artist}</span>
                            {track.genre && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-purple-400/80 text-[11px] truncate max-w-[70px]">
                                  {track.genre}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Heart & Duration */}
                        <div className="music-track-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleLike(track.id)}
                            className={`music-item-heart-btn ${isLiked ? "music-item-heart-btn--liked" : ""}`}
                            title={isLiked ? "Unlike track" : "Like track"}
                          >
                            {isLiked ? "❤️" : "🤍"}
                          </button>
                          <span className="music-track-time">
                            {formatTime(track.duration)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        )}

        {/* ── CENTER: Visualizer & Turntable Deck ── */}
        <main className={`music-stage ${isZenMode ? "music-stage--zen" : ""}`}>
          {/* Top Mode Bar */}
          {!isZenMode && (
            <div className="music-stage-nav">
              <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab("player")}
                  className={`music-tab-btn ${activeTab === "player" ? "music-tab-btn--active" : ""}`}
                >
                  🎧 Turntable
                </button>
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`music-tab-btn ${activeTab === "queue" ? "music-tab-btn--active" : ""}`}
                >
                  📑 Queue ({tracks.length})
                </button>
                <button
                  onClick={() => setActiveTab("info")}
                  className={`music-tab-btn ${activeTab === "info" ? "music-tab-btn--active" : ""}`}
                >
                  ℹ️ Details
                </button>
              </div>

              {/* Visualizer Preset & Zen Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setVisualizerStyle("bars")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${visualizerStyle === "bars" ? "bg-purple-500/30 text-purple-300" : "text-white/60 hover:text-white"}`}
                    title="Spectrum Bars"
                  >
                    Bars
                  </button>
                  <button
                    onClick={() => setVisualizerStyle("wave")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${visualizerStyle === "wave" ? "bg-cyan-500/30 text-cyan-300" : "text-white/60 hover:text-white"}`}
                    title="Neon Wave"
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setVisualizerStyle("pulsar")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${visualizerStyle === "pulsar" ? "bg-pink-500/30 text-pink-300" : "text-white/60 hover:text-white"}`}
                    title="Pulsar Glow"
                  >
                    Pulsar
                  </button>
                </div>

                <button
                  onClick={() => setIsZenMode(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                  title="Enter Fullscreen Zen Mode (Hot-key: Z)"
                >
                  <span>📺</span>
                  <span>Zen Mode</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: Turntable & Vinyl Visualizer */}
          {activeTab === "player" && (
            <div className="music-deck-container">
              {/* Turntable / Vinyl Rig */}
              <div className="music-turntable-wrapper">
                {/* Vinyl Record */}
                <div
                  className={`music-vinyl ${isPlaying ? "music-vinyl--spinning" : ""}`}
                  style={{
                    animationPlayState: isPlaying ? "running" : "paused",
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

                {/* Cover Art Case */}
                <motion.div
                  className="music-cover-card"
                  whileHover={{ scale: 1.02, rotateY: 4 }}
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

                {/* Tonearm */}
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

                <div className="flex items-center justify-center gap-2 mt-2">
                  {currentTrack.album && (
                    <span className="text-xs text-white/50 bg-white/[0.05] px-3 py-1 rounded-full border border-white/10">
                      💿 {currentTrack.album}
                    </span>
                  )}
                  <span className="text-xs text-white/50 bg-white/[0.05] px-3 py-1 rounded-full border border-white/10">
                    🔥 {currentTrack.playCount.toLocaleString()} plays
                  </span>
                </div>
              </div>

              {/* Real-time Dynamic Visualizer Display */}
              <div className="music-stage-visualizer">
                {visualizerStyle === "bars" && (
                  <SpectrumBarsVisualizer isPlaying={isPlaying} />
                )}
                {visualizerStyle === "wave" && (
                  <WaveVisualizer isPlaying={isPlaying} />
                )}
                {visualizerStyle === "pulsar" && (
                  <PulsarVisualizer isPlaying={isPlaying} />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Queue List */}
          {activeTab === "queue" && (
            <div className="music-queue-view">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Up Next</h3>
                <span className="text-xs text-white/50">
                  Click any track to jump
                </span>
              </div>
              <div className="music-queue-list">
                {tracks.map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => playTrackByIndex(i)}
                    className={`music-queue-item ${i === currentIndex ? "music-queue-item--active" : ""}`}
                  >
                    <div className="w-8 text-center text-xs text-white/40">
                      {i === currentIndex ? "▶" : i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                      {track.thumbnailUrl ? (
                        <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                      <div className="text-xs text-white/50 truncate">{track.artist}</div>
                    </div>
                    <div className="text-xs text-white/40 tabular-nums">
                      {formatTime(track.duration)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Track Info */}
          {activeTab === "info" && (
            <div className="music-info-view">
              <div className="music-info-card">
                <h3 className="text-lg font-bold text-white mb-4">Track Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">TITLE</span>
                    <span className="text-white font-medium">{currentTrack.title}</span>
                  </div>
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">ARTIST</span>
                    <span className="text-white font-medium">{currentTrack.artist}</span>
                  </div>
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">ALBUM</span>
                    <span className="text-white font-medium">{currentTrack.album || "Single"}</span>
                  </div>
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">GENRE</span>
                    <span className="text-white font-medium">{currentTrack.genre || "Uncategorized"}</span>
                  </div>
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">DURATION</span>
                    <span className="text-white font-medium">{formatTime(currentTrack.duration)}</span>
                  </div>
                  <div className="music-info-field">
                    <span className="text-white/40 text-xs block">PLAY COUNT</span>
                    <span className="text-white font-medium">{currentTrack.playCount.toLocaleString()} plays</span>
                  </div>
                </div>

                {/* Keyboard shortcuts cheatsheet */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                    Keyboard Shortcuts
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                    <div><kbd className="music-kbd">Space</kbd> Play / Pause</div>
                    <div><kbd className="music-kbd">M</kbd> Mute / Unmute</div>
                    <div><kbd className="music-kbd">← / →</kbd> Seek -5s / +5s</div>
                    <div><kbd className="music-kbd">Shift + ← / →</kbd> Prev / Next</div>
                    <div><kbd className="music-kbd">↑ / ↓</kbd> Volume Up / Down</div>
                    <div><kbd className="music-kbd">L</kbd> Like / Favorite</div>
                    <div><kbd className="music-kbd">Z</kbd> Toggle Zen Mode</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM PRO PLAYER CONTROLS
      ────────────────────────────────────────────────────────────── */}
      <footer className="music-bottom-bar">
        {/* Track preview */}
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
                className={`text-xs ${isCurrentLiked ? "text-red-400" : "text-white/30 hover:text-white"}`}
                title="Like track"
              >
                {isCurrentLiked ? "❤️" : "🤍"}
              </button>
            </div>
            <span className="music-bar-artist">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Center: Buttons + Scrub Bar */}
        <div className="music-bar-center">
          {/* Main playback buttons */}
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

        {/* Right side: Speed, Zen, Volume */}
        <div className="music-bar-right">
          {/* Playback speed switcher */}
          <button
            onClick={cycleSpeed}
            className="music-speed-badge"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          {/* Volume Control */}
          <div className="music-volume-group">
            <button
              id="music-mute-btn"
              onClick={() => setIsMuted((m) => !m)}
              className="music-ctrl-btn music-ctrl-btn--sm"
              aria-label={isMuted ? "Unmute" : "Mute"}
              title="Mute / Unmute (M)"
            >
              {isMuted || volume === 0 ? <MuteIcon /> : volume < 0.5 ? <VolumeLowIcon /> : <VolumeHighIcon />}
            </button>

            <div className="music-volume-slider-wrap">
              <input
                id="music-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="music-volume-slider"
                style={{ "--val": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUALIZER PRESET COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SpectrumBarsVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const barsCount = 36;
  return (
    <div className="music-spectrum-bars" aria-hidden="true">
      {Array.from({ length: barsCount }).map((_, i) => (
        <div
          key={i}
          className={`music-spectrum-bar ${isPlaying ? "music-spectrum-bar--live" : ""}`}
          style={
            {
              "--idx": i,
              "--height-factor": `${15 + ((i * 13) % 85)}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function WaveVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className={`music-wave-container ${isPlaying ? "music-wave--live" : ""}`} aria-hidden="true">
      <div className="music-wave-line wave-1" />
      <div className="music-wave-line wave-2" />
      <div className="music-wave-line wave-3" />
    </div>
  );
}

function PulsarVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className={`music-pulsar-wrap ${isPlaying ? "music-pulsar--live" : ""}`} aria-hidden="true">
      <div className="music-pulsar-ring ring-1" />
      <div className="music-pulsar-ring ring-2" />
      <div className="music-pulsar-ring ring-3" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON COMPONENTS
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
