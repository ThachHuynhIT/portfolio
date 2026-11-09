"use client";

import { useMemo } from "react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

interface MasonryLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function MasonryLayout({ photos, onSelectPhoto }: MasonryLayoutProps) {
  const { t, locale } = useTranslation();
  const columns = useMemo(() => {
    const cols: PhotoItem[][] = [[], [], []];
    photos.forEach((photo, index) => {
      cols[index % 3].push(photo);
    });
    return cols;
  }, [photos]);

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap.grid, "items-start")}>
      {columns.map((colPhotos, colIndex) => (
        <div key={colIndex} className={cn("flex flex-col", gap.grid)}>
          {colPhotos.map((photo) => {
            const title = locale === "vi" && photo.title_vi ? photo.title_vi : photo.title;
            const desc = locale === "vi" && photo.description_vi ? photo.description_vi : photo.description;
            const isVideo = photo.mediaType === "video" || Boolean(photo.videoUrl);
            const isPortrait = photo.aspectRatio === "portrait";
            const aspectClass = isPortrait
              ? "aspect-[3/4]"
              : photo.aspectRatio === "square"
              ? "aspect-square"
              : "aspect-[16/10]";

            const hasCameraInfo = Boolean(
              photo.camera &&
                (photo.camera.make ||
                  photo.camera.model ||
                  photo.camera.lens ||
                  photo.camera.focalLength ||
                  photo.camera.aperture ||
                  photo.camera.shutterSpeed ||
                  photo.camera.iso)
            );

            return (
              <article
                key={photo.id}
                className={cn("portfolio-reveal group relative min-w-0", "rounded-lg bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion", "transition-colors", "cursor-pointer")}
          >
              <button
                type="button"
                aria-label={title}
                onClick={() => onSelectPhoto(photo)}
                className="absolute inset-0 z-20 rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-accretion)]">
                <span className="sr-only">{title}</span>
              </button>
              <div className="overflow-hidden rounded-lg h-full">
                {/* Image Container */}
                <div className={cn("relative w-full overflow-hidden ", aspectClass)}>
                  <ImageWithSkeleton containerClassName="photography-media"
                    src={photo.image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100" />

                  {/* Video Play Overlay */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={cn("w-12 h-12", radius.pill, "bg-portfolio-hull", "border border-portfolio-hairline text-portfolio-ink flex items-center justify-center  transition-transform")}>
                        <Icon name="play" size={18} className="text-portfolio-accretion translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badges on Top */}
                  <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-1.5 z-10">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {photo.featured && (
                        <span className={cn("px-2 py-0.5", radius.pill, "whitespace-nowrap text-[10px] font-bold bg-portfolio-hull text-portfolio-ink flex items-center gap-1")}>
                          <Icon name="star" size={10} /> {t("photography.featured", "Featured")}
                        </span>
                      )}
                      {photo.category && (
                        <span className={cn("px-2.5 py-1", radius.pill, "whitespace-nowrap text-[11px] font-medium bg-portfolio-hull text-portfolio-dust", "border border-portfolio-hairline")}>
                          {photo.category}
                        </span>
                      )}
                      {isVideo && (
                        <span className={cn("px-2 py-0.5", radius.pill, "whitespace-nowrap text-[10px] font-bold uppercase tracking-wider bg-portfolio-hull text-portfolio-ink flex items-center gap-1")}>
                          <Icon name="play" size={10} />
                          <span>Video</span>
                        </span>
                      )}
                    </div>

                    {!isVideo && photo.beforeImage && (
                      <span className={cn("px-2 py-0.5", radius.pill, "whitespace-nowrap text-[10px] font-semibold tracking-wider uppercase", "bg-portfolio-hull text-portfolio-accretion border border-portfolio-control", "text-portfolio-ink flex items-center gap-1")}>
                        <Icon name="compare" size={11} />
                        <span>Before / After</span>
                      </span>
                    )}
                  </div>

                  {/* Info Overlay on Bottom — hover-reveal with a mouse, always
                      visible on touch screens (no hover to reveal it there) */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 transition-all duration-300 z-10 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 group-focus-within:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100">
                    <h3 className="text-base font-bold text-white break-words mb-1 group-hover:text-white transition-colors">
                      {title}
                    </h3>

                    {desc && desc.trim() !== "" && (
                      <p className="text-xs text-white/70 line-clamp-2 mb-3">
                        {desc}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-white/60 pt-2 border-t border-portfolio-hairline">
                      <span>{photo.date}</span>
                      {hasCameraInfo && (
                        <span className="font-mono text-white">
                          {photo.camera?.model || photo.camera?.make} {photo.camera?.focalLength && `• ${photo.camera.focalLength}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
            </div>
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
}
