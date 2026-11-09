"use client";

import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

import type { PhotoItem } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

interface StoryLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function StoryLayout({ photos, onSelectPhoto }: StoryLayoutProps) {
  const { locale } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-16">
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

        const hasEditingInfo = Boolean(
          photo.editing &&
            (photo.editing.software || photo.editing.colorGrade || photo.editing.notes)
        );

        return (
          <article
            key={photo.id}
            className={cn("portfolio-reveal portfolio-reveal--iris group", "rounded-lg overflow-hidden bg-portfolio-hull border border-portfolio-hairline hover:border-portfolio-accretion", "transition-colors")}
          >
            {/* Main Visual */}
            <div
              className="relative w-full aspect-[16/10] overflow-hidden bg-portfolio-hull cursor-pointer"
              onClick={() => onSelectPhoto(photo)}
            >
              <ImageWithSkeleton containerClassName="photography-media"
                src={photo.image}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover transition-transform duration-700 "
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

              {/* Video Play badge */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn("w-16 h-16", radius.pill, "bg-portfolio-hull", "border border-portfolio-hairline text-portfolio-ink flex items-center justify-center  transition-transform")}>
                    <Icon name="play" size={24} className="text-portfolio-accretion translate-x-0.5" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 z-10">
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5", radius.pill, "text-xs font-medium bg-portfolio-hull text-portfolio-ink", "border border-portfolio-hairline hover:border-portfolio-accretion transition-colors")}>
                  <Icon name={isVideo ? "play" : "maximize"} size={13} />
                  <span>{isVideo ? "Xem Video" : "Xem Ảnh Lớn"}</span>
                </span>
              </div>
            </div>

            {/* Editorial Content */}
            <div className="p-6 md:p-8 space-y-5">
              <div className={cn("flex flex-wrap items-center justify-between min-w-0 break-words", gap.base, "text-xs text-portfolio-dust")}>
                <div className={cn("flex items-center", gap.tight)}>
                  <span className={cn("px-2.5 py-0.5", radius.pill, "bg-portfolio-hull text-portfolio-ink font-medium")}>
                    {photo.category}
                  </span>
                  {isVideo && (
                    <span className={cn("px-2.5 py-0.5", radius.pill, "bg-portfolio-hull text-portfolio-accretion border border-portfolio-hairline font-bold uppercase text-[10px]")}>
                      Video
                    </span>
                  )}
                  {photo.date && <span>{photo.date}</span>}
                </div>
                {location && location.trim() !== "" && (
                  <span className="flex items-center gap-1 text-portfolio-dust">
                    <Icon name="globe" size={12} className="text-portfolio-accretion" />
                    {location}
                  </span>
                )}
              </div>

              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold break-words text-portfolio-ink mb-3 hover:text-portfolio-accretion transition-colors cursor-pointer"
                  onClick={() => onSelectPhoto(photo)}
                >
                  {title}
                </h2>
                {desc && desc.trim() !== "" && (
                  <p className="text-base text-portfolio-dust leading-relaxed font-light">
                    {desc}
                  </p>
                )}
              </div>

              {/* Editing and EXIF Badges: only show if at least one exists */}
              {(hasCameraInfo || hasEditingInfo) && (
                <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap.loose, "pt-2")}>
                  {hasCameraInfo && (
                    <div className={cn(radius.control, "bg-portfolio-hull border border-portfolio-hairline p-4 text-xs")}>
                      <div className={cn("flex items-center", gap.tight, "text-portfolio-accretion font-semibold mb-2")}>
                        <Icon name="camera" size={13} />
                        <span>Gear & Settings</span>
                      </div>
                      {(photo.camera?.make || photo.camera?.model) && (
                        <p className="text-portfolio-dust font-medium">
                          {[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}
                        </p>
                      )}
                      {photo.camera?.lens && (
                        <p className="text-portfolio-dust mt-0.5">
                          {photo.camera.lens}
                        </p>
                      )}
                      <p className="text-portfolio-dust font-mono mt-1 text-[11px]">
                        {[photo.camera?.focalLength, photo.camera?.aperture, photo.camera?.shutterSpeed, photo.camera?.iso ? `ISO ${photo.camera.iso}` : ""]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}

                  {hasEditingInfo && (
                    <div className={cn(radius.control, "bg-portfolio-hull border border-portfolio-hairline p-4 text-xs")}>
                      <div className={cn("flex items-center", gap.tight, "text-portfolio-accretion font-semibold mb-2")}>
                        <Icon name="compare" size={13} />
                        <span>Color Concept</span>
                      </div>
                      {photo.editing?.colorGrade && (
                        <p className="text-portfolio-dust font-medium">{photo.editing.colorGrade}</p>
                      )}
                      {photo.editing?.notes && (
                        <p className="text-portfolio-dust mt-1 text-xs leading-relaxed">
                          {photo.editing.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
