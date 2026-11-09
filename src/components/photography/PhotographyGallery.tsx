"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useState, useMemo } from "react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import Link from "next/link";

import type { PhotoItem, PhotoAlbum } from "@/lib/types";
import MasonryLayout from "./MasonryLayout";
import GridLayout from "./GridLayout";
import CompareLayout from "./CompareLayout";
import StoryLayout from "./StoryLayout";
import PhotoLightboxModal from "./PhotoLightboxModal";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

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
    <div className="portfolio-page">
      <section className="portfolio-section">
        <div className="portfolio-column min-w-0">
        <PageHeader title={<>{t("photography.titlePrefix")}{t("photography.titleHighlight")}</>} intro={t("photography.subtitle")}>
          <span className="text-xs text-portfolio-accretion">{t("photography.badge")}</span>
            {/* Quick Stats Badges */}
            <div className={cn("flex flex-wrap items-center justify-center", gap.base, "sm:gap-4 mt-8 text-xs font-mono")}>
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                aria-pressed={activeTab === "photos"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", activeTab === "photos" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
              >
                <span className={cn("w-2 h-2", radius.pill, "bg-portfolio-hull")} />
                <span><strong>{stats.total}</strong> {t("photography.totalPhotos")}</span>
              </button>

              {stats.albumsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("albums")}
                  aria-pressed={activeTab === "albums"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", activeTab === "albums" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                >
                  <Icon name="folder" size={13} />
                  <span><strong>{stats.albumsCount}</strong> {t("photography.albumsCount") || "Albums"}</span>
                </button>
              )}

              {stats.featuredCount > 0 && (
                <div className={cn("flex items-center", gap.tight, "px-3.5 py-1.5", radius.pill, "bg-portfolio-hull border border-portfolio-hairline", "text-portfolio-accretion")}>
                  <Icon name="star" size={13} className="text-portfolio-accretion" />
                  <span><strong>{stats.featuredCount}</strong> {t("photography.featured")}</span>
                </div>
              )}
              <div className={cn("flex items-center", gap.tight, "px-3.5 py-1.5", radius.pill, "bg-portfolio-hull border border-portfolio-hairline", "text-portfolio-dust")}>
                <span className={cn("w-2 h-2", radius.pill, "bg-portfolio-hull")} />
                <span><strong>{stats.catsCount}</strong> {t("photography.categoriesCount")}</span>
              </div>
              <div className={cn("flex items-center", gap.tight, "px-3.5 py-1.5", radius.pill, "bg-portfolio-hull border border-portfolio-hairline", "text-portfolio-dust")}>
                <span className={cn("w-2 h-2", radius.pill, "bg-portfolio-hull")} />
                <span><strong>{stats.withBeforeAfter}</strong> {t("photography.beforeAfterCount")}</span>
              </div>
            </div>
        </PageHeader>
        {/* ── Main View Switcher: All Photos vs Albums ── */}
        <div className={cn("flex items-center justify-center sm:justify-start", gap.tight, "p-1.5", "rounded-lg bg-portfolio-hull", "border border-portfolio-hairline", "max-w-full flex-wrap mb-8")}>
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            aria-pressed={activeTab === "photos"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", activeTab === "photos" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
          >
            <Icon name="camera" size={15} />
            <span>{t("photography.tabAllPhotos") || "Tất cả tác phẩm"} ({initialPhotos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("albums")}
            aria-pressed={activeTab === "albums"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", activeTab === "albums" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
          >
            <Icon name="grid" size={15} />
            <span>{t("photography.tabAlbums") || "Bộ sưu tập (Albums)"} ({filteredAlbums.length})</span>
          </button>
        </div>

        {/* ── TAB 1: ALL PHOTOS & ARTWORKS ── */}
        {activeTab === "photos" && (
          <div className="space-y-8">
            {/* Controls Toolbar (Categories, Search & Layout Switcher) */}
            <section className="portfolio-solid portfolio-reveal space-y-5">
              <div className={cn("flex flex-col md:flex-row md:items-center justify-between", gap.loose)}>
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Icon
                    name="search"
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-portfolio-dust"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("photography.searchPlaceholder")}
                    className={cn("portfolio-input w-full pl-10 pr-12 py-2.5", radius.control, "bg-portfolio-hull border border-portfolio-hairline text-sm text-portfolio-ink placeholder:text-portfolio-dust focus:outline-none focus:border-portfolio-accretion focus:ring-2 focus:ring-portfolio-accretion transition-all")}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t("photography.clearSearch", "Clear search")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-portfolio-dust focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--portfolio-accretion)] hover:text-portfolio-ink"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>

                {/* Layout Mode Switcher */}
                <div className={cn("flex flex-wrap items-center gap-1.5 p-1 max-w-full", radius.control, "bg-portfolio-hull border border-portfolio-hairline self-start md:self-auto")}>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("masonry")}
                    title="Masonry Layout"
                    aria-pressed={layoutMode === "masonry"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "masonry" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                  >
                    <Icon name="masonry" size={14} />
                    <span className="hidden sm:inline">{t("photography.layouts.masonry")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode("grid")}
                    title="Grid Layout"
                    aria-pressed={layoutMode === "grid"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "grid" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                  >
                    <Icon name="grid" size={14} />
                    <span className="hidden sm:inline">{t("photography.layouts.grid")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode("compare")}
                    title="Before & After Retouch Comparison"
                    aria-pressed={layoutMode === "compare"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "compare" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                  >
                    <Icon name="compare" size={14} />
                    <span className="hidden sm:inline">{t("photography.layouts.compare")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode("story")}
                    title="Editorial Story Layout"
                    aria-pressed={layoutMode === "story"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "story" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                  >
                    <Icon name="image" size={14} />
                    <span className="hidden sm:inline">{t("photography.layouts.story")}</span>
                  </button>
                </div>
              </div>

              {/* Categories Horizontal Pills */}
              <div className={cn("flex items-center", gap.tight, "min-w-0 max-w-full overflow-x-auto pb-2 scrollbar-none")}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  aria-pressed={selectedCategory === "all"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", selectedCategory === "all" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                >
                  {t("photography.all")} ({initialPhotos.length})
                </button>

                {stats.featuredCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("featured")}
                    aria-pressed={selectedCategory === "featured"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", selectedCategory === "featured" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                  >
                    <Icon name="star" size={12} /> {t("photography.featured")}
                    <span
                      className={cn("text-[10px] px-1.5 py-0.2 rounded-full ", selectedCategory === "featured"
                          ? "bg-portfolio-hull text-portfolio-ink font-extrabold"
                          : "bg-portfolio-hull text-portfolio-accretion")}
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
                      aria-pressed={isActive} className={cn("portfolio-action flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs border rounded-lg", isActive ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
                    >
                      <span>{cat}</span>
                      <span
                        className={cn("text-[10px] px-1.5 py-0.2 rounded-full ", isActive ? "bg-portfolio-hull text-portfolio-ink font-bold" : "bg-portfolio-hull text-portfolio-dust")}
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
                <div className={cn("portfolio-solid portfolio-reveal text-center py-20 bg-portfolio-hull border border-portfolio-hairline", "rounded-lg p-8")}>
                  <div className={cn("w-12 h-12", radius.pill, "bg-portfolio-hull text-portfolio-dust flex items-center justify-center mx-auto mb-3")}>
                    <Icon name="search" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-portfolio-ink mb-1">
                    No matching artworks found
                  </h3>
                  <p className="text-sm text-portfolio-dust max-w-sm mx-auto mb-4">
                    Try searching with different keywords or reset filters to display all artworks.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className={cn("portfolio-action portfolio-action-secondary px-4 py-2", radius.control, "bg-portfolio-hull hover:bg-portfolio-hull text-portfolio-ink text-xs font-medium transition-colors")}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                  <div
                    key={`${layoutMode}-${selectedCategory}`}

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
                  </div>

              )}
            </section>
          </div>
        )}

        {/* ── TAB 2: ALBUMS (COLLECTIONS) ── */}
        {activeTab === "albums" && (
          <section className="space-y-8">
            {/* Search Bar for Albums */}
            <div className={cn("portfolio-solid portfolio-reveal flex flex-col sm:flex-row sm:items-center justify-between", gap.loose)}>
              <div className="relative w-full sm:w-80">
                <Icon
                  name="search"
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-portfolio-dust"
                />
                <input
                  type="text"
                  value={albumSearchQuery}
                  onChange={(e) => setAlbumSearchQuery(e.target.value)}
                  placeholder={t("photography.searchAlbumsPlaceholder") || "Tìm kiếm album..."}
                  className={cn("portfolio-input w-full pl-10 pr-12 py-2.5", radius.control, "bg-portfolio-hull border border-portfolio-hairline text-sm text-portfolio-ink placeholder:text-portfolio-dust focus:outline-none focus:border-portfolio-accretion focus:ring-2 focus:ring-portfolio-accretion transition-all")}
                />
                {albumSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAlbumSearchQuery("")}
                    aria-label={t("photography.clearSearch", "Clear search")} className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-portfolio-dust focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--portfolio-accretion)]"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-portfolio-dust font-mono">
                {t("photography.albumsCount") || "Albums"}: <strong>{filteredAlbums.length}</strong>
              </div>
            </div>

            {/* Albums Grid */}
            {filteredAlbums.length === 0 ? (
              <div className={cn("portfolio-solid portfolio-reveal text-center py-20 bg-portfolio-hull border border-portfolio-hairline", "rounded-lg p-8")}>
                <div className={cn("w-12 h-12", radius.pill, "bg-portfolio-hull text-portfolio-dust flex items-center justify-center mx-auto mb-3")}>
                  <Icon name="grid" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-portfolio-ink mb-1">
                  {t("photography.noAlbumsFound") || "Không tìm thấy Album nào"}
                </h3>
                <p className="text-sm text-portfolio-dust max-w-sm mx-auto mb-4">
                  {t("photography.noAlbumsDesc") || "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ album."}
                </p>
                <button
                  type="button"
                  onClick={() => setAlbumSearchQuery("")}
                  className={cn("portfolio-action portfolio-action-secondary px-4 py-2", radius.control, "bg-portfolio-hull hover:bg-portfolio-hull text-portfolio-ink text-xs font-medium transition-colors")}
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
                      className={cn("portfolio-reveal portfolio-reveal--lens group relative", "rounded-lg overflow-hidden bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion", "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--portfolio-accretion)] focus-visible:outline-offset-2", "flex flex-col")}
                    >
                      {/* Cover Photo */}
                      <div className="relative aspect-[16/10] w-full bg-portfolio-hull overflow-hidden">
                        {coverUrl && (
                          <ImageWithSkeleton containerClassName="photography-media"
                            src={coverUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

                        {/* Top Badges */}
                        <div className={cn("absolute top-3.5 left-3.5 flex items-center", gap.tight, "z-10")}>
                          <span className={cn("px-3 py-1", radius.pill, "text-xs font-bold bg-portfolio-hull text-portfolio-accretion", "border border-portfolio-hairline flex items-center gap-1.5")}>
                            <Icon name="image" size={12} />
                            <span>{photoCount} {t("photography.photosInAlbum") || "tác phẩm"}</span>
                          </span>
                        </div>

                        {album.featured && (
                          <div className="absolute top-3.5 right-3.5 z-10">
                            <span className={cn("px-2.5 py-1", radius.pill, "text-xs font-bold bg-portfolio-hull text-portfolio-ink flex items-center gap-1")}>
                              <Icon name="star" size={12} /> {t("photography.featured")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Album Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-portfolio-ink group-hover:text-portfolio-accretion group-focus-within:text-portfolio-accretion transition-colors break-words mb-2">
                            {title}
                          </h3>
                          {desc && (
                            <p className="text-xs text-portfolio-dust line-clamp-2 leading-relaxed font-light">
                              {desc}
                            </p>
                          )}
                        </div>

                        {/* Miniature Avatars + CTA */}
                        <div className="pt-4 border-t border-portfolio-hairline flex flex-wrap gap-3 items-center justify-between">
                          <div className="flex items-center -space-x-2">
                            {previewPhotos.map((p, idx) => (
                              <div
                                key={p.id}
                                className={cn("relative w-7 h-7", radius.pill, "overflow-hidden border-2 border-portfolio-hairline bg-portfolio-hull")}
                                style={{ zIndex: 3 - idx }}
                              >
                                <ImageWithSkeleton containerClassName="photography-media"
                                  src={p.image}
                                  alt={p.title}
                                  fill
                                  sizes="28px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {photoCount > 3 && (
                              <div className={cn("w-7 h-7", radius.pill, "bg-portfolio-hull border-2 border-portfolio-hairline flex items-center justify-center text-[10px] font-bold text-portfolio-dust")}>
                                +{photoCount - 3}
                              </div>
                            )}
                          </div>

                          <span className="portfolio-text-link inline-flex items-center gap-1.5 text-xs font-semibold text-portfolio-accretion group-hover:text-portfolio-accretion group-focus-within:text-portfolio-accretion  transition-all">
                            <span>{t("photography.viewAlbum") || "Khám phá Album"}</span>
                            <Icon name="arrowRight" size={12} />
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
      </section>
      {/* Lightbox Modal */}
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
