"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="music-visualizer" aria-hidden="true">
      {bars.map((_, i) => (
        <div
          key={i}
          className={`music-bar ${isPlaying ? "music-bar--playing" : ""}`}
          style={{ "--bar-index": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [isLoading, setIsLoading] = useState(false);

  const currentTrack = tracks[currentIndex];

  // Sync audio element when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.volume = isMuted ? 0 : volume;
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const playTrack = useCallback(
    async (index: number) => {
      setCurrentIndex(index);
      setIsPlaying(true);
      // actual play is triggered by the useEffect above via src change
      const audio = audioRef.current;
      if (audio && index === currentIndex) {
        audio.currentTime = 0;
        await audio.play();
      }
    },
    [currentIndex]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    if (isShuffle) {
      const next = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(next);
    } else {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }
    setIsPlaying(true);
  }, [isShuffle, tracks.length]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleEnded = useCallback(() => {
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play(); }
    } else if (repeatMode === "all" || currentIndex < tracks.length - 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, currentIndex, tracks.length, nextTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const cycleRepeat = () => {
    setRepeatMode((m) => (m === "none" ? "all" : m === "all" ? "one" : "none"));
  };

  if (!currentTrack) {
    return (
      <div className="music-empty">
        <p>No tracks available. Add some tracks in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="music-layout">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={handleEnded}
        onCanPlay={() => {
          setIsLoading(false);
          if (isPlaying) audioRef.current?.play();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* ─── SIDEBAR: Track List ─── */}
      <aside className="music-sidebar">
        <div className="music-sidebar__header">
          <h2 className="music-sidebar__title">Tracks</h2>
          <span className="music-sidebar__count">{tracks.length} songs</span>
        </div>
        <ul className="music-tracklist" role="listbox" aria-label="Track list">
          {tracks.map((track, i) => (
            <li
              key={track.id}
              role="option"
              aria-selected={i === currentIndex}
              className={`music-track-item ${i === currentIndex ? "music-track-item--active" : ""}`}
              onClick={() => playTrack(i)}
            >
              {/* Thumbnail */}
              <div className="music-track-thumb">
                {track.thumbnailUrl ? (
                  <img src={track.thumbnailUrl} alt={track.title} />
                ) : (
                  <DefaultAlbumArt />
                )}
                {i === currentIndex && (
                  <div className="music-track-thumb__overlay">
                    <AudioVisualizer isPlaying={isPlaying} />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="music-track-info">
                <span className="music-track-info__title">{track.title}</span>
                <span className="music-track-info__artist">{track.artist}</span>
              </div>
              {/* Duration */}
              <span className="music-track-duration">
                {formatTime(track.duration)}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* ─── MAIN: Now Playing ─── */}
      <main className="music-main">
        <div className="music-now-playing">
          {/* Album Art */}
          <div className={`music-album-art ${isPlaying ? "music-album-art--spinning" : ""}`}>
            {currentTrack.thumbnailUrl ? (
              <img src={currentTrack.thumbnailUrl} alt={currentTrack.title} />
            ) : (
              <DefaultAlbumArt size="large" />
            )}
            <div className="music-album-art__glow" />
          </div>

          {/* Track Meta */}
          <div className="music-meta">
            <h1 className="music-meta__title">{currentTrack.title}</h1>
            <p className="music-meta__artist">{currentTrack.artist}</p>
            {currentTrack.album && (
              <p className="music-meta__album">{currentTrack.album}</p>
            )}
            {currentTrack.genre && (
              <span className="music-genre-badge">{currentTrack.genre}</span>
            )}
          </div>

          {/* Visualizer */}
          <div className="music-main-visualizer">
            <AudioVisualizer isPlaying={isPlaying} />
          </div>
        </div>
      </main>

      {/* ─── BOTTOM: Player Controls ─── */}
      <footer className="music-controls">
        {/* Track info (mini) */}
        <div className="music-controls__track">
          <div className="music-controls__thumb">
            {currentTrack.thumbnailUrl ? (
              <img src={currentTrack.thumbnailUrl} alt="" />
            ) : (
              <DefaultAlbumArt />
            )}
          </div>
          <div>
            <p className="music-controls__title">{currentTrack.title}</p>
            <p className="music-controls__artist">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center controls */}
        <div className="music-controls__center">
          {/* Buttons row */}
          <div className="music-controls__buttons">
            <button
              id="music-shuffle-btn"
              className={`music-ctrl-btn ${isShuffle ? "music-ctrl-btn--active" : ""}`}
              onClick={() => setIsShuffle((s) => !s)}
              aria-label="Shuffle"
              title="Shuffle"
            >
              <ShuffleIcon />
            </button>
            <button
              id="music-prev-btn"
              className="music-ctrl-btn music-ctrl-btn--nav"
              onClick={prevTrack}
              aria-label="Previous"
            >
              <PrevIcon />
            </button>
            <button
              id="music-play-btn"
              className="music-ctrl-btn music-ctrl-btn--play"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
            >
              {isLoading ? <LoadingIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              id="music-next-btn"
              className="music-ctrl-btn music-ctrl-btn--nav"
              onClick={nextTrack}
              aria-label="Next"
            >
              <NextIcon />
            </button>
            <button
              id="music-repeat-btn"
              className={`music-ctrl-btn ${repeatMode !== "none" ? "music-ctrl-btn--active" : ""}`}
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeatMode}`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
            </button>
          </div>

          {/* Seek bar */}
          <div className="music-seek">
            <span className="music-seek__time">{formatTime(currentTime)}</span>
            <input
              ref={seekRef}
              id="music-seekbar"
              type="range"
              className="music-seek__bar"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek"
              style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
            />
            <span className="music-seek__time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="music-controls__volume">
          <button
            id="music-mute-btn"
            className="music-ctrl-btn"
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <input
            id="music-volume-bar"
            type="range"
            className="music-seek__bar music-volume__bar"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
            aria-label="Volume"
            style={{ "--progress": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
          />
        </div>
      </footer>
    </div>
  );
}

// ── Default album art ──────────────────────────────────────────────────────
function DefaultAlbumArt({ size = "small" }: { size?: "small" | "large" }) {
  return (
    <div className={`music-default-art ${size === "large" ? "music-default-art--large" : ""}`}>
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity=".3" />
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" opacity=".6" />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <path d="M32 10 L36 6 L36 20 L32 18 Z" fill="currentColor" opacity=".5" />
      </svg>
    </div>
  );
}

// ── Icon Components ────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
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
const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);
const MuteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const LoadingIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="music-loading-spin">
    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
  </svg>
);
