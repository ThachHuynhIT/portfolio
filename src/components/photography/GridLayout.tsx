"use client";

import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

interface GridLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function GridLayout({ photos, onSelectPhoto }: GridLayoutProps) {
  const { t, locale } = useTranslation();

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap.grid)}>
      {photos.map((photo) => {
        const title = locale === "vi" && photo.title_vi ? photo.title_vi : photo.title;
        const desc = locale === "vi" && photo.description_vi ? photo.description_vi : photo.description;
        const location = locale === "vi" && photo.location_vi ? photo.location_vi : photo.location;
        const isVideo = photo.mediaType === "video" || Boolean(photo.videoUrl);

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
          <div
            key={photo.id}
            className={cn("portfolio-reveal group relative min-w-0", "rounded-lg bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion", "transition-colors", "cursor-pointer flex flex-col")}
          >
              <button
                type="button"
                aria-label={title}
                onClick={() => onSelectPhoto(photo)}
                className="absolute inset-0 z-20 rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-accretion)]">
                <span className="sr-only">{title}</span>
              </button>
              <div className="overflow-hidden rounded-lg h-full">
            {/* Card Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-portfolio-hull">
              <ImageWithSkeleton containerClassName="photography-media"
                src={photo.image}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500"
              />

              {/* Category badge */}
              <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-1.5">
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

              {/* Before/After tag */}
              {!isVideo && photo.beforeImage && (
                <div className="absolute top-3 right-3 z-10">
                  <span className={cn("px-2 py-0.5", radius.pill, "whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider bg-portfolio-hull text-portfolio-ink", "flex items-center gap-1")}>
                    <Icon name="compare" size={11} />
                    <span>Retouch</span>
                  </span>
                </div>
              )}

              {/* Video Play Overlay */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn("w-12 h-12", radius.pill, "bg-portfolio-hull", "border border-portfolio-hairline text-portfolio-ink flex items-center justify-center  transition-transform")}>
                    <Icon name="play" size={18} className="text-portfolio-accretion translate-x-0.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-portfolio-dust mb-2">
                  <span>{photo.date}</span>
                  {location && location.trim() !== "" && (
                    <span className="truncate max-w-[140px]">{location}</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-portfolio-ink group-hover:text-portfolio-accretion group-focus-within:text-portfolio-accretion transition-colors break-words mb-2">
                  {title}
                </h3>
                {desc && desc.trim() !== "" && (
                  <p className="text-xs text-portfolio-dust line-clamp-2 leading-relaxed mb-4">
                    {desc}
                  </p>
                )}
              </div>

              {/* Camera Exif bottom pill - only render if info exists */}
              {hasCameraInfo && (
                <div className="pt-3 border-t border-portfolio-hairline flex items-center justify-between text-[11px] text-portfolio-dust">
                  <span className="font-mono text-portfolio-accretion">
                    {photo.camera?.model || photo.camera?.make}
                  </span>
                  <span>
                    {[
                      photo.camera?.aperture,
                      photo.camera?.shutterSpeed,
                      photo.camera?.iso ? `ISO ${photo.camera.iso}` : "",
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </div>
              )}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
