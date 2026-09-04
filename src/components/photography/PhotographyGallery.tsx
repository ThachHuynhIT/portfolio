"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import MasonryLayout from "./MasonryLayout";
import GridLayout from "./GridLayout";
import CompareLayout from "./CompareLayout";
import StoryLayout from "./StoryLayout";
import PhotoLightboxModal from "./PhotoLightboxModal";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";

type LayoutMode = "masonry" | "grid" | "compare" | "story";

interface PhotographyGalleryProps {
  initialPhotos: PhotoItem[];
}

export default function PhotographyGallery({ initialPhotos }: PhotographyGalleryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialPhotos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [initialPhotos]);

  // Statistics
  const stats = useMemo(() => {
    const total = initialPhotos.length;
    const featuredCount = initialPhotos.filter((p) => p.featured).length;
    const withBeforeAfter = initialPhotos.filter((p) => !!p.beforeImage).length;
    const videosCount = initialPhotos.filter((p) => p.mediaType === "video" || Boolean(p.videoUrl)).length;
    const catsCount = categories.length;
    return { total, featuredCount, withBeforeAfter, videosCount, catsCount };
  }, [initialPhotos, categories]);

  // Filtered photos based on category & search
  const filteredPhotos = useMemo(() => {
    return initialPhotos.filter((p) => {
      let matchCategory = true;
      if (selectedCategory === "featured") {
        matchCategory = Boolean(p.featured);
      } else if (selectedCategory !== "all") {
        matchCategory = p.category === selectedCategory;
      }

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchLocation = p.location?.toLowerCase().includes(q);
      const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
      const matchCamera =
        p.camera?.model?.toLowerCase().includes(q) ||
        p.camera?.make?.toLowerCase().includes(q) ||
        p.camera?.lens?.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchLocation || matchTag || matchCamera;
    });
  }, [initialPhotos, selectedCategory, searchQuery]);

  const handleOpenLightbox = (photo: PhotoItem) => {
    setActivePhoto(photo);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  return (
    <div className="min-h-screen pt-28 pb-24 text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-purple-600/10 via-indigo-600/10 to-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* ── Hero Header with Horizontal Landscape Background Image ── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 mb-14 shadow-2xl bg-slate-950">
          {/* Horizontal Landscape Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"
              alt="Photography Hero Background"
              fill
              priority
              className="object-cover object-center opacity-40"
            />
            {/* Multi-layer gradient overlays for text contrast and cinematic feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50 backdrop-blur-[1.5px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
          </div>

          {/* Foreground Content */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center max-w-3xl mx-auto px-6 py-14 sm:py-20"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-black/60 text-cyan-300 border border-cyan-500/30 backdrop-blur-md mb-5 shadow-sm">
              <Icon name="camera" size={14} />
              <span>{t("photography.badge")}</span>
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
              {t("photography.titlePrefix")}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                {t("photography.titleHighlight")}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-light drop-shadow">
              {t("photography.subtitle")}
            </p>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8 text-xs font-mono">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-slate-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span><strong>{stats.total}</strong> {t("photography.totalPhotos")}</span>
              </div>
              {stats.featuredCount > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-amber-300 shadow-md">
                  <span className="text-amber-400">⭐</span>
                  <span><strong>{stats.featuredCount}</strong> {t("photography.featured")}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-slate-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span><strong>{stats.catsCount}</strong> {t("photography.categoriesCount")}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-slate-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span><strong>{stats.withBeforeAfter}</strong> {t("photography.beforeAfterCount")}</span>
              </div>
              {stats.videosCount > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-cyan-500/30 backdrop-blur-md text-cyan-300 shadow-md">
                  <Icon name="video" size={13} className="text-cyan-400" />
                  <span><strong>{stats.videosCount}</strong> Videos</span>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Controls Toolbar (Categories, Search & Layout Switcher) ── */}
        <section className="space-y-5 mb-10">
          {/* Top Bar: Search and Layout Modes */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Icon
                name="search"
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("photography.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>

            {/* Layout Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setLayoutMode("masonry")}
                title="Masonry Layout"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "masonry"
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name="masonry" size={14} />
                <span className="hidden sm:inline">{t("photography.layouts.masonry")}</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                title="Grid Layout"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "grid"
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name="grid" size={14} />
                <span className="hidden sm:inline">{t("photography.layouts.grid")}</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode("compare")}
                title="Before & After Retouch Comparison"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "compare"
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name="compare" size={14} />
                <span className="hidden sm:inline">{t("photography.layouts.compare")}</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode("story")}
                title="Editorial Story Layout"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "story"
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name="image" size={14} />
                <span className="hidden sm:inline">{t("photography.layouts.story")}</span>
              </button>
            </div>
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === "all"
                  ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {t("photography.all")} ({initialPhotos.length})
            </button>

            {stats.featuredCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory("featured")}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === "featured"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-lg shadow-amber-500/20"
                    : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                }`}
              >
                <span>⭐ {t("photography.featured")}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === "featured"
                      ? "bg-black/20 text-black font-extrabold"
                      : "bg-amber-400/20 text-amber-200"
                  }`}
                >
                  {stats.featuredCount}
                </span>
              </button>
            )}

            {categories.map((cat) => {
              const count = initialPhotos.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                      : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-black/10 text-black font-bold" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Active Layout Display ── */}
        <section>
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Icon name="search" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No matching artworks found
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                Try searching with different keywords or reset filters to display all artworks.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${layoutMode}-${selectedCategory}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {layoutMode === "masonry" && (
                  <MasonryLayout
                    photos={filteredPhotos}
                    onSelectPhoto={handleOpenLightbox}
                  />
                )}
                {layoutMode === "grid" && (
                  <GridLayout
                    photos={filteredPhotos}
                    onSelectPhoto={handleOpenLightbox}
                  />
                )}
                {layoutMode === "compare" && (
                  <CompareLayout
                    photos={filteredPhotos}
                    onSelectPhoto={handleOpenLightbox}
                  />
                )}
                {layoutMode === "story" && (
                  <StoryLayout
                    photos={filteredPhotos}
                    onSelectPhoto={handleOpenLightbox}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      <PhotoLightboxModal
        photo={activePhoto}
        photos={filteredPhotos}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        onSelectPhoto={(p) => setActivePhoto(p)}
      />
    </div>
  );
}
