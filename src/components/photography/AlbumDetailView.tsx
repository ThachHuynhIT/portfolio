"use client";

import { useState } from "react";
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
    <div className="min-h-screen pt-28 pb-24 text-white">
      {/* Ambient background blur */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-500/10 blur-[130px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/photography"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors group px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>{t("photography.backToGallery") || "Quay lại Thư viện ảnh"}</span>
          </Link>

          <span className="text-xs text-slate-500 font-mono">
            {photos.length} {t("photography.photosInAlbum") || "tác phẩm"}
          </span>
        </div>

        {/* ── Cinematic Album Hero Banner ── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 mb-12 shadow-2xl bg-slate-950">
          {coverUrl && (
            <div className="absolute inset-0 z-0">
              <Image
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
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-sm">
                <span>📁</span>
                <span>{t("photography.albumCollectionBadge") || "Album Collection"}</span>
              </span>
              {album.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span>⭐ {t("photography.featuredBadge") || "Nổi bật"}</span>
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

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-white/10">
                <span className="text-cyan-400">🖼️</span>
                <span><strong>{photos.length}</strong> {t("photography.photosInAlbum") || "tác phẩm"}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-white/10">
                <span>📅</span>
                <span>{new Date(album.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Controls Toolbar (Layout Switcher) ── */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{t("photography.worksInCollection") || "Tác phẩm trong bộ sưu tập"}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {photos.length}
            </span>
          </h2>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setLayoutMode("masonry")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === "masonry"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
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
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
              <Icon name="image" size={32} className="text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">
                {locale === "vi" ? "Chưa có tác phẩm nào trong Album này" : "No artworks in this album yet"}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                Vui lòng quay lại Thư viện ảnh để khám phá các bộ sưu tập khác.
              </p>
              <Link
                href="/photography"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors inline-block"
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
          <section className="pt-12 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📁 {t("photography.otherAlbumsTitle") || "Các Bộ Sưu Tập Khác"}</span>
              </h3>
              <Link
                href="/photography"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {t("photography.viewAllAlbums") || "Xem tất cả"} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherAlbums.slice(0, 3).map((item) => {
                const title = locale === "vi" && item.title_vi ? item.title_vi : item.title;
                const desc = locale === "vi" && item.description_vi ? item.description_vi : item.description;

                return (
                  <Link
                    key={item.id}
                    href={`/photography/album/${item.slug}`}
                    className="group rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 transition-all shadow-md flex flex-col"
                  >
                    <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                      {item.coverImage && (
                        <Image
                          src={item.coverImage}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/75 text-cyan-300 backdrop-blur-md border border-white/10">
                          {item.photoIds?.length || 0} {t("photography.photosInAlbum") || "tác phẩm"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                        {title}
                      </h4>
                      {desc && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
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
