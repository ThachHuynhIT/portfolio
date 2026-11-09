"use client";

import type { PhotoItem } from "@/lib/types";
import BeforeAfterSlider from "./BeforeAfterSlider";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius } from "@/lib/design-tokens";

interface CompareLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function CompareLayout({ photos, onSelectPhoto }: CompareLayoutProps) {
  const { locale } = useTranslation();
  const comparablePhotos = photos.filter((p) => !!p.beforeImage);

  if (comparablePhotos.length === 0) {
    return (
      <div className={cn("portfolio-solid portfolio-reveal text-center py-20 bg-portfolio-hull border border-portfolio-hairline", "rounded-lg p-8")}>
        <div className={cn("w-12 h-12", radius.pill, "bg-portfolio-hull text-portfolio-accretion flex items-center justify-center mx-auto mb-4")}>
          <Icon name="compare" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-portfolio-ink mb-2">
          No comparison photos in this category
        </h3>
        <p className="text-sm text-portfolio-dust max-w-md mx-auto">
          Only photos with both RAW/original and retouched versions are displayed here. Try selecting another category or &quot;All&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {comparablePhotos.map((photo) => {
        const title = locale === "vi" && photo.title_vi ? photo.title_vi : photo.title;
        const location = locale === "vi" && photo.location_vi ? photo.location_vi : photo.location;

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
          <div
            key={photo.id}
            className={cn("portfolio-reveal rounded-lg p-6 md:p-8 bg-portfolio-hull border border-portfolio-hairline")}
          >
            {/* Header info */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between", gap.loose, "mb-6")}>
              <div>
                <div className={cn("flex flex-wrap items-center", gap.tight, "mb-2")}>
                  {photo.category && (
                    <span className={cn("px-3 py-1", radius.pill, "text-xs font-medium text-portfolio-accretion border border-portfolio-hairline")}>
                      {photo.category}
                    </span>
                  )}
                  {photo.date && <span className="text-xs text-portfolio-dust">{photo.date}</span>}
                  {location && location.trim() !== "" && (
                    <span className="text-xs text-portfolio-dust">• {location}</span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-portfolio-ink break-words">{title}</h3>
              </div>

              <button
                type="button"
                onClick={() => onSelectPhoto(photo)}
                className={cn("portfolio-action portfolio-action-secondary inline-flex items-center", gap.tight, "px-4 py-2", radius.control, "bg-portfolio-hull hover:bg-portfolio-hull text-portfolio-ink text-xs font-semibold border border-portfolio-hairline transition-all self-start md:self-auto")}
              >
                <Icon name="maximize" size={14} />
                <span>View Fullscreen</span>
              </button>
            </div>

            {/* Interactive Slider */}
            <div className="mb-6">
              <BeforeAfterSlider
                beforeImage={photo.beforeImage!}
                afterImage={photo.image}
                aspectRatio={photo.aspectRatio}
                alt={photo.title}
                beforeLabel="RAW / Original"
                afterLabel="Retouched"
              />
            </div>

            {/* Retouch Notes & EXIF Footer: only render if at least one exists */}
            {(hasEditingInfo || hasCameraInfo) && (
              <div className={cn("grid grid-cols-1 md:grid-cols-2", gap.loose, "text-xs pt-4", "border-t border-portfolio-hairline")}>
                {hasEditingInfo && (
                  <div className={cn(radius.control, "bg-portfolio-hull border border-portfolio-hairline p-4")}>
                    <span className="font-semibold text-portfolio-accretion uppercase tracking-wider block mb-1 text-[10px]">
                      Post-Processing Workflow
                    </span>
                    {photo.editing?.notes && (
                      <p className="text-portfolio-dust leading-relaxed">
                        {photo.editing.notes}
                      </p>
                    )}
                    {photo.editing?.software && (
                      <span className="inline-block mt-2 text-[11px] text-portfolio-accretion font-medium">
                        Software: {photo.editing.software}
                      </span>
                    )}
                    {photo.editing?.colorGrade && (
                      <span className="inline-block mt-1 ml-2 text-[11px] text-portfolio-accretion font-medium">
                        Tone: {photo.editing.colorGrade}
                      </span>
                    )}
                  </div>
                )}

                {hasCameraInfo && (
                  <div className={cn(radius.control, "bg-portfolio-hull border border-portfolio-hairline p-4 flex flex-col justify-between")}>
                    <span className="font-semibold text-portfolio-accretion uppercase tracking-wider block mb-1 text-[10px]">
                      Technical Specs
                    </span>
                    <div className={cn("grid grid-cols-2", gap.tight, "text-portfolio-dust")}>
                      {(photo.camera?.make || photo.camera?.model) && (
                        <div>
                          <span className="text-portfolio-dust block text-[10px]">Gear</span>
                          <span>{[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}</span>
                        </div>
                      )}
                      {photo.camera?.lens && (
                        <div>
                          <span className="text-portfolio-dust block text-[10px]">Lens</span>
                          <span>{photo.camera.lens}</span>
                        </div>
                      )}
                      {(photo.camera?.aperture || photo.camera?.shutterSpeed) && (
                        <div>
                          <span className="text-portfolio-dust block text-[10px]">Aperture & Shutter</span>
                          <span>{[photo.camera?.aperture, photo.camera?.shutterSpeed].filter(Boolean).join(" • ")}</span>
                        </div>
                      )}
                      {photo.camera?.iso && (
                        <div>
                          <span className="text-portfolio-dust block text-[10px]">ISO</span>
                          <span>ISO {photo.camera.iso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
