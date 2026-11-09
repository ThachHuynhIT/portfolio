"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useState } from "react";
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
    <div className="portfolio-page">
      <section className="portfolio-section">
        <div className="portfolio-column min-w-0">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
          <Link
            href="/photography"
            className={cn("portfolio-text-link inline-flex items-center", gap.tight, "text-xs font-semibold text-portfolio-dust hover:text-portfolio-accretion transition-colors group px-3.5 py-2", radius.control, "bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion")}
          >
            <span className="group-hover:-translate-x-0.5 transition-transform"><Icon name="arrowLeft" size={14} /></span>
            <span>{t("photography.backToGallery") || "Quay lại Thư viện ảnh"}</span>
          </Link>

          <span className="text-xs text-portfolio-dust font-mono">
            {photos.length} {t("photography.photosInAlbum") || "tác phẩm"}
          </span>
        </div>

        <PageHeader title={albumTitle} intro={albumDesc}>
            <div className={cn("flex flex-wrap items-center", gap.tight, "mb-4")}>
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1", radius.pill, "text-xs font-bold uppercase tracking-wider bg-portfolio-hull text-portfolio-accretion border border-portfolio-hairline")}>
                <Icon name="folder" size={12} />
                <span>{t("photography.albumCollectionBadge") || "Album Collection"}</span>
              </span>
              {album.featured && (
                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1", radius.pill, "text-xs font-bold bg-portfolio-hull text-portfolio-accretion border border-portfolio-hairline")}>
                  <Icon name="star" size={12} /> {t("photography.featuredBadge") || "Nổi bật"}
                </span>
              )}
            </div>

            <div className={cn("flex flex-wrap items-center", gap.loose, "text-xs font-mono text-portfolio-dust")}>
              <div className={cn("flex items-center", gap.tight, "px-3 py-1", radius.chip, "bg-portfolio-hull border border-portfolio-hairline")}>
                <Icon name="image" size={12} className="text-portfolio-accretion" />
                <span><strong>{photos.length}</strong> {t("photography.photosInAlbum") || "tác phẩm"}</span>
              </div>
              <div className={cn("flex items-center", gap.tight, "px-3 py-1", radius.chip, "bg-portfolio-hull border border-portfolio-hairline")}>
                <Icon name="calendar" size={12} />
                <span>{new Date(album.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
        </PageHeader>
        {coverUrl && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-portfolio-hull border border-portfolio-hairline mb-8">
            <ImageWithSkeleton containerClassName="photography-media" src={coverUrl} alt={albumTitle} fill sizes="(max-width: 1120px) 100vw, 1120px" className="object-cover" />
          </div>
        )}
        {/* ── Controls Toolbar (Layout Switcher) ── */}
        <section className={cn("flex flex-col sm:flex-row sm:items-center justify-between", gap.loose, "portfolio-solid mb-8")}>
          <h2 className={cn("text-lg font-bold text-portfolio-ink flex items-center", gap.tight)}>
            <span>{t("photography.worksInCollection") || "Tác phẩm trong bộ sưu tập"}</span>
            <span className={cn("text-xs px-2 py-0.5", radius.pill, "bg-portfolio-hull text-portfolio-accretion font-mono")}>
              {photos.length}
            </span>
          </h2>

          <div className={cn("flex flex-wrap items-center gap-1.5 p-1 max-w-full", radius.control, "bg-portfolio-hull border border-portfolio-hairline self-start sm:self-auto")}>
            <button
              type="button"
              onClick={() => setLayoutMode("masonry")}
              aria-pressed={layoutMode === "masonry"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "masonry" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
            >
              <Icon name="masonry" size={14} />
              <span>{t("photography.layouts.masonry")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("grid")}
              aria-pressed={layoutMode === "grid"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "grid" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
            >
              <Icon name="grid" size={14} />
              <span>{t("photography.layouts.grid")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("compare")}
              aria-pressed={layoutMode === "compare"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "compare" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
            >
              <Icon name="compare" size={14} />
              <span>{t("photography.layouts.compare")}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("story")}
              aria-pressed={layoutMode === "story"} className={cn("portfolio-action flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg min-h-11", layoutMode === "story" ? "bg-portfolio-hull border-portfolio-accretion text-portfolio-accretion" : "bg-portfolio-hull border-portfolio-control text-portfolio-dust hover:border-portfolio-accretion")}
            >
              <Icon name="image" size={14} />
              <span>{t("photography.layouts.story")}</span>
            </button>
          </div>
        </section>

        {/* ── Photos Layout View ── */}
        <section className="mb-20">
          {photos.length === 0 ? (
            <div className={cn("portfolio-solid text-center py-20 bg-portfolio-hull border border-portfolio-hairline", "rounded-lg p-8")}>
              <Icon name="image" size={32} className="text-portfolio-dust mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-portfolio-ink mb-1">
                {locale === "vi" ? "Chưa có tác phẩm nào trong Album này" : "No artworks in this album yet"}
              </h3>
              <p className="text-sm text-portfolio-dust max-w-sm mx-auto mb-4">
                Vui lòng quay lại Thư viện ảnh để khám phá các bộ sưu tập khác.
              </p>
              <Link
                href="/photography"
                className={cn("portfolio-action portfolio-action-secondary px-4 py-2", radius.control, "bg-portfolio-hull text-portfolio-ink text-xs font-medium hover:bg-portfolio-hull transition-colors inline-block")}
              >
                Quay lại Thư viện ảnh
              </Link>
            </div>
          ) : (
              <div
                key={layoutMode}

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
              </div>

          )}
        </section>

        {/* ── Other Curated Albums Recommendation ── */}
        {otherAlbums.length > 0 && (
          <section className="pt-12 border-t border-portfolio-hairline space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h3 className={cn("text-xl font-bold text-portfolio-ink flex items-center", gap.tight)}>
                <Icon name="folder" size={18} /> {t("photography.otherAlbumsTitle") || "Các Bộ Sưu Tập Khác"}
              </h3>
              <Link
                href="/photography"
                className="portfolio-text-link text-xs font-semibold text-portfolio-accretion hover:text-portfolio-accretion transition-colors inline-flex items-center gap-1"
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
                    className={cn("group", "rounded-lg overflow-hidden bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--portfolio-accretion)] focus-visible:outline-offset-2 transition-all flex flex-col")}
                  >
                    <div className="relative aspect-[16/10] w-full bg-portfolio-hull overflow-hidden">
                      {item.coverImage && (
                        <ImageWithSkeleton containerClassName="photography-media"
                          src={item.coverImage}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={cn("px-2.5 py-0.5", radius.pill, "text-[10px] font-bold bg-portfolio-hull text-portfolio-accretion", "border border-portfolio-hairline")}>
                          {item.photoIds?.length || 0} {t("photography.photosInAlbum") || "tác phẩm"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-portfolio-ink group-hover:text-portfolio-accretion group-focus-within:text-portfolio-accretion transition-colors break-words mb-1">
                        {title}
                      </h4>
                      {desc && (
                        <p className="text-xs text-portfolio-dust line-clamp-2 leading-relaxed">
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
      </section>
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
