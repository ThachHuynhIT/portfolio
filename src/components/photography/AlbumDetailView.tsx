"use client";

import { useState } from "react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
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
import { cn } from "@/lib/utils";
import { border, elevation, gap, layout, radius, text } from "@/lib/design-tokens";

type LayoutMode = "masonry" | "grid" | "compare" | "story";

interface AlbumDetailViewProps {
  album: PhotoAlbum;
  photos: PhotoItem[];
  otherAlbums: PhotoAlbum[];
}

export default function AlbumDetailView({ album, photos, otherAlbums }: AlbumDetailViewProps) {
  const { t, locale } = useTranslation();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const albumTitle = locale === "vi" && album.title_vi ? album.title_vi : album.title;
  const albumDesc = locale === "vi" && album.description_vi ? album.description_vi : album.description;
  const coverUrl =
    (photos.length === 1 ? photos[0]?.image : album.coverImage) ||
    photos[0]?.image ||
    album.coverImage;

  const handleOpenLightbox = (photo: PhotoItem) => {
    setActivePhoto(photo);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  return (
    <div className={cn("min-h-screen pt-28 pb-24", text.primary)}>
      {/* Ambient background blur */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className={cn("absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-500/10 blur-[130px]", radius.pill)} />
      </div>

      <div className={cn(layout.container)}>
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/photography"
            className={cn("inline-flex items-center", gap.tight, "text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors group px-3.5 py-2", radius.control, "bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 light:text-neutral-500 light:bg-neutral-900/[0.03] light:border-neutral-900/10")}
          >
            <span className="group-hover:-translate-x-0.5 transition-transform"><Icon name="arrowLeft" size={14} /></span>
            <span>{t("photography.backToGallery") || "Quay lại Thư viện ảnh"}</span>
          </Link>

          <span className="text-xs text-slate-500 font-mono light:text-neutral-400">
            {photos.length} {t("photography.photosInAlbum") || "tác phẩm"}
          </span>
        </div>

        {/* ── Cinematic Album Hero Banner ──
            NOTE: same "theater" rationale as the photography gallery hero —
            the background photo + dark gradient overlay stays dark-only in
            both themes for legibility; only the outer card border gets a
            light: counterpart. */}
        <section className={cn("relative overflow-hidden", radius.panel, border.subtle, "mb-12 shadow-2xl bg-slate-950")}>
          {coverUrl && (
            <div className="absolute inset-0 z-0">
              <ImageWithSkeleton
                src={coverUrl}
                alt={albumTitle}
                fill
                priority
                className="object-cover object-center opacity-30 blur-[2px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
            </div>
          )}

          <div className="relative z-10 p-8 sm:p-14 max-w-4xl">
            <div className={cn("flex items-center", gap.tight, "mb-4")}>
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1", radius.pill, "text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30", elevation.blur, "shadow-sm")}>
                <Icon name="folder" size={12} />
                <span>{t("photography.albumCollectionBadge") || "Album Collection"}</span>
              </span>
              {album.featured && (
                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1", radius.pill, "text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40")}>
                  <Icon name="star" size={12} /> {t("photography.featuredBadge") || "Nổi bật"}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
              {albumTitle}
            </h1>

            {albumDesc && (
              <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-3xl font-light drop-shadow mb-6">
                {albumDesc}
              </p>
            )}

            <div className={cn("flex flex-wrap items-center", gap.loose, "text-xs font-mono text-slate-400")}>
              <div className={cn("flex items-center", gap.tight, "px-3 py-1", radius.chip, "bg-black/60 border border-white/10")}>
                <Icon name="image" size={12} className="text-cyan-400" />
                <span><strong>{photos.length}</strong> {t("photography.photosInAlbum") || "tác phẩm"}</span>
              </div>
              <div className={cn("flex items-center", gap.tight, "px-3 py-1", radius.chip, "bg-black/60 border border-white/10")}>
                <Icon name="calendar" size={12} />
                <span>{new Date(album.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Controls Toolbar (Layout Switcher) ── */}
        <section className={cn("flex flex-col sm:flex-row sm:items-center justify-between", gap.loose, "mb-8")}>
          <h2 className={cn("text-lg font-bold text-white flex items-center", gap.tight, "light:text-neutral-900")}>
            <span>{t("photography.worksInCollection") || "Tác phẩm trong bộ sưu tập"}</span>
            <span className={cn("text-xs px-2 py-0.5", radius.pill, "bg-cyan-500/20 text-cyan-300 font-mono light:text-cyan-800")}>
              {photos.length}
            </span>
          </h2>

          <div className={cn("flex items-center gap-1.5 p-1", radius.control, "bg-white/[0.04] border border-white/10 self-start sm:self-auto light:bg-neutral-900/[0.04] light:border-neutral-900/10")}>
            <button
              type="button"
              onClick={() => setLayoutMode("masonry")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === "masonry"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white light:text-neutral-500 light:hover:text-neutral-900"
              }`}
            >
              <Icon name="masonry" size={14} />
              <span>{t("photography.layouts.masonry")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === "grid"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white light:text-neutral-500 light:hover:text-neutral-900"
              }`}
            >
              <Icon name="grid" size={14} />
              <span>{t("photography.layouts.grid")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("compare")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === "compare"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white light:text-neutral-500 light:hover:text-neutral-900"
              }`}
            >
              <Icon name="compare" size={14} />
              <span>{t("photography.layouts.compare")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("story")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === "story"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white light:text-neutral-500 light:hover:text-neutral-900"
              }`}
            >
              <Icon name="image" size={14} />
              <span>{t("photography.layouts.story")}</span>
            </button>
          </div>
        </section>

        {/* ── Photos Layout View ── */}
        <section className="mb-20">
          {photos.length === 0 ? (
            <div className={cn("text-center py-20 bg-white/[0.02] border border-white/5", radius.panel, "p-8 light:bg-neutral-900/[0.03] light:border-neutral-900/10")}>
              <Icon name="image" size={32} className="text-slate-600 mx-auto mb-3 light:text-neutral-400" />
              <h3 className="text-lg font-semibold text-white mb-1 light:text-neutral-900">
                {locale === "vi" ? "Chưa có tác phẩm nào trong Album này" : "No artworks in this album yet"}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4 light:text-neutral-500">
                Vui lòng quay lại Thư viện ảnh để khám phá các bộ sưu tập khác.
              </p>
              <Link
                href="/photography"
                className={cn("px-4 py-2", radius.control, "bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors inline-block")}
              >
                Quay lại Thư viện ảnh
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={layoutMode}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {layoutMode === "masonry" && (
                  <MasonryLayout photos={photos} onSelectPhoto={handleOpenLightbox} />
                )}
                {layoutMode === "grid" && (
                  <GridLayout photos={photos} onSelectPhoto={handleOpenLightbox} />
                )}
                {layoutMode === "compare" && (
                  <CompareLayout photos={photos} onSelectPhoto={handleOpenLightbox} />
                )}
                {layoutMode === "story" && (
                  <StoryLayout photos={photos} onSelectPhoto={handleOpenLightbox} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* ── Other Curated Albums Recommendation ── */}
        {otherAlbums.length > 0 && (
          <section className="pt-12 border-t border-white/10 space-y-6 light:border-neutral-900/10">
            <div className="flex items-center justify-between">
              <h3 className={cn("text-xl font-bold text-white flex items-center", gap.tight, "light:text-neutral-900")}>
                <Icon name="folder" size={18} /> {t("photography.otherAlbumsTitle") || "Các Bộ Sưu Tập Khác"}
              </h3>
              <Link
                href="/photography"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
              >
                {t("photography.viewAllAlbums") || "Xem tất cả"} <Icon name="arrowRight" size={12} />
              </Link>
            </div>

            <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3", gap.grid)}>
              {otherAlbums.slice(0, 3).map((item) => {
                const title = locale === "vi" && item.title_vi ? item.title_vi : item.title;
                const desc = locale === "vi" && item.description_vi ? item.description_vi : item.description;

                return (
                  <Link
                    key={item.id}
                    href={`/photography/album/${item.slug}`}
                    className={cn("group", radius.card, "overflow-hidden bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 transition-all shadow-md flex flex-col light:bg-white light:border-neutral-900/10")}
                  >
                    <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden light:bg-slate-100">
                      {item.coverImage && (
                        <ImageWithSkeleton
                          src={item.coverImage}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={cn("px-2.5 py-0.5", radius.pill, "text-[10px] font-bold bg-black/75 text-cyan-300", elevation.blur, "border border-white/10")}>
                          {item.photoIds?.length || 0} {t("photography.photosInAlbum") || "tác phẩm"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1 light:text-neutral-900">
                        {title}
                      </h4>
                      {desc && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed light:text-neutral-500">
                          {desc}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        photo={activePhoto}
        photos={photos}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        onSelectPhoto={(p) => setActivePhoto(p)}
      />
    </div>
  );
}
