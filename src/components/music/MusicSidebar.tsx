"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic, TabView } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function MusicSidebar() {
  const { t, locale } = useTranslation();
  const {
    tracks,
    genres,
    activeTab,
    setActiveTab,
    deckMode,
    setDeckMode,
    selectedGenre,
    setSelectedGenre,
    showOnlyLiked,
    setShowOnlyLiked,
    likedTrackIds,
    visualizerStyle,
    setVisualizerStyle,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isPlaying,
    audioMetrics,
    room,
    setIsRoomModalOpen,
  } = useMusic();

  const pathname = usePathname();

  const handleTabClick = (tab: TabView) => {
    setActiveTab(tab);
    if (tab === "player") setDeckMode("vinyl");
    setShowOnlyLiked(tab === "favorites");
    setIsMobileSidebarOpen(false);
  };

  const handleLikedClick = () => {
    handleTabClick("favorites");
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    setIsMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="music-sidebar-inner">
      {/* ── 1. Top Brand & Portfolio Link ── */}
      <div className="music-sidebar-brand-box">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="music-sidebar-brand"
            title={t("music.returnHome")}
          >
            <div className="music-sidebar-logo-icon">
              <span>🎧</span>
              {isPlaying && (
                <span
                  className="music-logo-pulse"
                  style={{
                    transform: `scale(${1 + audioMetrics.bass * 0.4})`,
                    opacity: 0.6 + audioMetrics.bass * 0.4,
                  }}
                />
              )}
            </div>
            <div>
              <h2 className="music-sidebar-title">{t("music.title")}</h2>
              <span className="music-sidebar-subtitle">{t("music.subtitle")}</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher variant="pill" size="sm" />
            {/* Close button for mobile drawer */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-2 text-white/60 hover:text-white rounded-lg bg-white/5"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Listen Together Room Trigger Button */}
        <button
          onClick={() => {
            setIsRoomModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          className={`w-full mt-3 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
            room
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-md shadow-purple-500/20"
              : "bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-cyan-500/30 hover:from-purple-600/50 hover:to-cyan-500/50 text-white border-white/10"
          }`}
          title={t("music.roomTooltip")}
        >
          <span>🎧</span>
          <span>
            {room
              ? `Room #${room.code} (${room.members.length})`
              : t("music.roomButton")}
          </span>
        </button>

        {/* Back to Portfolio Button */}
        <Link
          href="/"
          className="music-back-portfolio-btn"
          title={t("music.returnHome")}
        >
          <span className="text-xs">←</span>
          <span>{t("common.backToPortfolio")}</span>
        </Link>
      </div>

      {/* ── 2. Navigation Hub Tabs ── */}
      <div className="music-sidebar-section">
        <span className="music-sidebar-heading">
          {locale === "vi" ? "ĐIỀU HƯỚNG STUDIO" : "STUDIO NAVIGATION"}
        </span>
        <nav className="music-sidebar-nav">
          <button
            onClick={() => handleTabClick("player")}
            className={`music-nav-item ${activeTab === "player" ? "music-nav-item--active" : ""}`}
          >
            <span className="music-nav-icon">🎛️</span>
            <span className="flex-1 text-left font-medium">
              {locale === "vi" ? "Đĩa Than Vinyl" : "Turntable Deck"}
            </span>
            {activeTab === "player" && isPlaying && (
              <span className="music-nav-live-dot" />
            )}
          </button>

          <button
            onClick={() => handleTabClick("charts")}
            className={`music-nav-item ${activeTab === "charts" ? "music-nav-item--active" : ""}`}
          >
            <span className="music-nav-icon">🏆</span>
            <span className="flex-1 text-left font-medium">
              {locale === "vi" ? "Bảng Xếp Hạng" : "Top Charts"}
            </span>
            <span className="music-nav-badge text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30">Top</span>
          </button>

          <button
            onClick={() => handleTabClick("queue")}
            className={`music-nav-item ${activeTab === "queue" ? "music-nav-item--active" : ""}`}
          >
            <span className="music-nav-icon">📑</span>
            <span className="flex-1 text-left font-medium">
              {locale === "vi" ? "Hàng Đợi Bài Hát" : "Up Next Queue"}
            </span>
            <span className="music-nav-badge">{tracks.length}</span>
          </button>

          <button
            onClick={() => handleTabClick("info")}
            className={`music-nav-item ${activeTab === "info" ? "music-nav-item--active" : ""}`}
          >
            <span className="music-nav-icon">ℹ️</span>
            <span className="flex-1 text-left font-medium">
              {locale === "vi" ? "Thông Số Âm Thanh" : "Audio Specs"}
            </span>
          </button>

          <button
            onClick={handleLikedClick}
            className={`music-nav-item ${activeTab === "favorites" ? "music-nav-item--active music-nav-item--liked" : ""}`}
          >
            <span className="music-nav-icon">❤️</span>
            <span className="flex-1 text-left font-medium">
              {locale === "vi" ? "Bài Hát Yêu Thích" : "Favorite Tracks"}
            </span>
            <span className="music-nav-badge music-nav-badge--liked">
              {likedTrackIds.size}
            </span>
          </button>
        </nav>
      </div>

      {/* ── 3. Mood & Genre Filters ── */}
      <div className="music-sidebar-section flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="music-sidebar-heading !mb-0">
            {locale === "vi" ? "THỂ LOẠI & TÂM TRẠNG" : "GENRES & MOODS"}
          </span>
          {selectedGenre !== "All" && (
            <button
              onClick={() => setSelectedGenre("All")}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline"
            >
              {locale === "vi" ? "Đặt lại" : "Reset"}
            </button>
          )}
        </div>
        <div className="music-sidebar-genres-scroll">
          {genres.map((g) => {
            const isSelected = selectedGenre === g;
            const count =
              g === "All"
                ? tracks.length
                : tracks.filter((t) => t.genre?.toLowerCase() === g.toLowerCase()).length;

            return (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                className={`music-genre-item ${isSelected ? "music-genre-item--active" : ""}`}
              >
                <span className="music-genre-bullet" />
                <span className="flex-1 text-left truncate">{g}</span>
                <span className="text-[11px] text-white/40">{count}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* ── 6. Audio Engine Status Indicator Footer ── */}
      <div className="music-sidebar-footer">
        <div className="flex items-center gap-2">
          <div className="music-status-dot-wrap">
            <span className="music-status-dot" />
            {isPlaying && <span className="music-status-dot-ping" />}
          </div>
          <div className="text-[11px] leading-tight">
            <div className="text-white/80 font-medium">Web Audio Engine</div>
            <div className="text-white/40">24-bit Lossless Stream</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="music-sidebar-desktop hidden md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="music-sidebar-backdrop md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="music-sidebar-drawer md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
