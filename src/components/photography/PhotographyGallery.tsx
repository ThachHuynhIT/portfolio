"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoItem, PhotoAlbum } from "@/lib/types";
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
  initialAlbums?: PhotoAlbum[];
}

export default function PhotographyGallery({ initialPhotos, initialAlbums = [] }: PhotographyGalleryProps) {
  const { t, locale } = useTranslation();

  // Tab: "photos" (all artworks) vs "albums" (collections)
  const [activeTab, setActiveTab] = useState<"photos" | "albums">("photos");
  const [albumSearchQuery, setAlbumSearchQuery] = useState("");

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
    const albumsCount = initialAlbums.length;
    return { total, featuredCount, withBeforeAfter, videosCount, catsCount, albumsCount };
  }, [initialPhotos, categories, initialAlbums]);

  // Filtered photos based on category & search
  const filteredPhotos = useMemo(() => {
    const list = initialPhotos.filter((p) => {
      let matchCategory = true;
      if (selectedCategory === "featured") {
        matchCategory = Boolean(p.featured);
      } else if (selectedCategory !== "all") {
        matchCategory = p.category === selectedCategory;
      }

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle =
        p.title.toLowerCase().includes(q) ||
        (p.title_vi ? p.title_vi.toLowerCase().includes(q) : false);
      const matchDesc =
        (p.description ? p.description.toLowerCase().includes(q) : false) ||
        (p.description_vi ? p.description_vi.toLowerCase().includes(q) : false);
      const matchLocation =
        (p.location ? p.location.toLowerCase().includes(q) : false) ||
        (p.location_vi ? p.location_vi.toLowerCase().includes(q) : false);
      const matchTag = p.tags?.some((tag) => tag.toLowerCase().includes(q));
      const matchCamera =
        p.camera?.model?.toLowerCase().includes(q) ||
        p.camera?.make?.toLowerCase().includes(q) ||
        p.camera?.lens?.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchLocation || matchTag || matchCamera;
    });

    // Priority: Items marked featured are sorted first!
    return [...list].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [initialPhotos, selectedCategory, searchQuery]);

  // Filtered albums: ensure albums have at least 1 photo and featured albums are sorted first!
  const filteredAlbums = useMemo(() => {
    const validAlbums = initialAlbums.filter((album) => {
      const ids = new Set(album.photoIds || []);
      const count = initialPhotos.filter(
        (p) => ids.has(p.id) || p.albumId === album.id
      ).length;
      return count > 0;
    });

    const list = !albumSearchQuery.trim()
      ? validAlbums
      : validAlbums.filter((a) => {
          const q = albumSearchQuery.toLowerCase();
          const matchTitle =
            a.title.toLowerCase().includes(q) ||
            (a.title_vi ? a.title_vi.toLowerCase().includes(q) : false);
          const matchDesc =
            (a.description ? a.description.toLowerCase().includes(q) : false) ||
            (a.description_vi ? a.description_vi.toLowerCase().includes(q) : false);
          return matchTitle || matchDesc;
        });

    // Priority: Albums marked featured are sorted first!
    return [...list].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [initialAlbums, initialPhotos, albumSearchQuery]);

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
        {/* ── Hero Header ── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 mb-10 shadow-2xl bg-slate-950">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"
              alt="Photography Hero Background"
              fill
              priority
              className="object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50 backdrop-blur-[1.5px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
          </div>

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
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer shadow-md ${
                  activeTab === "photos"
                    ? "bg-purple-600/30 border-purple-400/50 text-white"
                    : "bg-black/60 border-white/15 text-slate-300 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span><strong>{stats.total}</strong> {t("photography.totalPhotos")}</span>
              </button>

              {stats.albumsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("albums")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer shadow-md ${
                    activeTab === "albums"
                      ? "bg-cyan-500/30 border-cyan-400/50 text-white"
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                  }`}
                >
                  <span>📁</span>
                  <span><strong>{stats.albumsCount}</strong> {t("photography.albumsCount") || "Albums"}</span>
                </button>
              )}

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
            </div>
          </motion.div>
        </section>

        {/* ── Main View Switcher: All Photos vs Albums ── */}
        <div className="flex items-center justify-center sm:justify-start gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 w-fit mb-8 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "photos"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon name="camera" size={15} />
            <span>{t("photography.tabAllPhotos") || "Tất cả tác phẩm"} ({initialPhotos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("albums")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "albums"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon name="grid" size={15} />
            <span>{t("photography.tabAlbums") || "Bộ sưu tập (Albums)"} ({filteredAlbums.length})</span>
          </button>
        </div>

        {/* ── TAB 1: ALL PHOTOS & ARTWORKS ── */}
        {activeTab === "photos" && (
          <div className="space-y-8">
            {/* Controls Toolbar (Categories, Search & Layout Switcher) */}
            <section className="space-y-5">
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

            {/* Active Layout Display */}
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
        )}

        {/* ── TAB 2: ALBUMS (COLLECTIONS) ── */}
        {activeTab === "albums" && (
          <section className="space-y-8">
            {/* Search Bar for Albums */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Icon
                  name="search"
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={albumSearchQuery}
                  onChange={(e) => setAlbumSearchQuery(e.target.value)}
                  placeholder={t("photography.searchAlbumsPlaceholder") || "Tìm kiếm album..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                {albumSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAlbumSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {t("photography.albumsCount") || "Albums"}: <strong>{filteredAlbums.length}</strong>
              </div>
            </div>

            {/* Albums Grid */}
            {filteredAlbums.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <div className="w-12 h-12 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Icon name="grid" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t("photography.noAlbumsFound") || "Không tìm thấy Album nào"}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                  {t("photography.noAlbumsDesc") || "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ album."}
                </p>
                <button
                  type="button"
                  onClick={() => setAlbumSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                >
                  {t("photography.resetAlbumSearch") || "Đặt lại tìm kiếm"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredAlbums.map((album) => {
                  const title = locale === "vi" && album.title_vi ? album.title_vi : album.title;
                  const desc = locale === "vi" && album.description_vi ? album.description_vi : album.description;
                  const albumPhotos = initialPhotos.filter(
                    (p) => album.photoIds?.includes(p.id) || p.albumId === album.id
                  );
                  const photoCount = albumPhotos.length;
                  const previewPhotos = albumPhotos.slice(0, 3);
                  const coverUrl =
                    (photoCount === 1 ? albumPhotos[0]?.image : album.coverImage) ||
                    albumPhotos[0]?.image ||
                    album.coverImage;

                  return (
                    <Link
                      key={album.id}
                      href={`/photography/album/${album.slug}`}
                      className="group relative rounded-3xl overflow-hidden bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col"
                    >
                      {/* Cover Photo */}
                      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                        {coverUrl && (
                          <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-cyan-300 backdrop-blur-md border border-white/15 shadow flex items-center gap-1.5">
                            <span>🖼️</span>
                            <span>{photoCount} {t("photography.photosInAlbum") || "tác phẩm"}</span>
                          </span>
                        </div>

                        {album.featured && (
                          <div className="absolute top-3.5 right-3.5 z-10">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-black shadow-lg flex items-center gap-1">
                              <span>⭐ {t("photography.featured")}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Album Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-2">
                            {title}
                          </h3>
                          {desc && (
                            <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed font-light">
                              {desc}
                            </p>
                          )}
                        </div>

                        {/* Miniature Avatars + CTA */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center -space-x-2">
                            {previewPhotos.map((p, idx) => (
                              <div
                                key={p.id}
                                className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800"
                                style={{ zIndex: 3 - idx }}
                              >
                                <Image
                                  src={p.image}
                                  alt={p.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {photoCount > 3 && (
                              <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                +{photoCount - 3}
                              </div>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                            <span>{t("photography.viewAlbum") || "Khám phá Album"}</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
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
