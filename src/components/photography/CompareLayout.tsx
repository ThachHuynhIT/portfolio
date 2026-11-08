"use client";

import { motion } from "framer-motion";
import type { PhotoItem } from "@/lib/types";
import BeforeAfterSlider from "./BeforeAfterSlider";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { border, gap, radius, text } from "@/lib/design-tokens";

interface CompareLayoutProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export default function CompareLayout({ photos, onSelectPhoto }: CompareLayoutProps) {
  const { locale } = useTranslation();
  const comparablePhotos = photos.filter((p) => !!p.beforeImage);

  if (comparablePhotos.length === 0) {
    return (
      <div className={cn("text-center py-20 bg-white/[0.02] border border-white/10", radius.card, "p-8 light:bg-neutral-900/[0.03] light:border-neutral-900/10")}>
        <div className={cn("w-12 h-12", radius.pill, "bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4")}>
          <Icon name="compare" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 light:text-neutral-900">
          No comparison photos in this category
        </h3>
        <p className="text-sm text-white/50 max-w-md mx-auto light:text-neutral-500">
          Only photos with both RAW/original and retouched versions are displayed here. Try selecting another category or &quot;All&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {comparablePhotos.map((photo, index) => {
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
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className={cn(radius.panel, "p-6 md:p-8 bg-slate-900/40 border border-white/10 shadow-xl light:bg-white light:border-neutral-900/10 light:shadow-neutral-400/10")}
          >
            {/* Header info */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between", gap.loose, "mb-6")}>
              <div>
                <div className={cn("flex items-center", gap.tight, "mb-2")}>
                  {photo.category && (
                    <span className={cn("px-3 py-1", radius.pill, "text-xs font-medium bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30")}>
                      {photo.category}
                    </span>
                  )}
                  {photo.date && <span className="text-xs text-slate-400 light:text-neutral-500">{photo.date}</span>}
                  {location && location.trim() !== "" && (
                    <span className="text-xs text-slate-400 light:text-neutral-500">• {location}</span>
                  )}
                </div>
                <h3 className={cn("text-xl md:text-2xl font-bold", text.primary)}>{title}</h3>
              </div>

              <button
                type="button"
                onClick={() => onSelectPhoto(photo)}
                className={cn("inline-flex items-center", gap.tight, "px-4 py-2", radius.control, "bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all self-start md:self-auto light:bg-neutral-900/[0.06] light:hover:bg-neutral-900/10 light:text-neutral-900 light:border-neutral-900/10")}
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
              <div className={cn("grid grid-cols-1 md:grid-cols-2", gap.loose, "text-xs pt-4", border.dividerTop)}>
                {hasEditingInfo && (
                  <div className={cn(radius.control, "bg-purple-500/[0.04] border border-purple-500/20 p-4 light:border-purple-500/25")}>
                    <span className="font-semibold text-purple-300 uppercase tracking-wider block mb-1 text-[10px] light:text-purple-700">
                      Post-Processing Workflow
                    </span>
                    {photo.editing?.notes && (
                      <p className="text-slate-300 leading-relaxed light:text-neutral-600">
                        {photo.editing.notes}
                      </p>
                    )}
                    {photo.editing?.software && (
                      <span className="inline-block mt-2 text-[11px] text-purple-400 font-medium light:text-purple-700">
                        Software: {photo.editing.software}
                      </span>
                    )}
                    {photo.editing?.colorGrade && (
                      <span className="inline-block mt-1 ml-2 text-[11px] text-cyan-400 font-medium light:text-cyan-700">
                        Tone: {photo.editing.colorGrade}
                      </span>
                    )}
                  </div>
                )}

                {hasCameraInfo && (
                  <div className={cn(radius.control, "bg-white/[0.03] border border-white/10 p-4 flex flex-col justify-between light:bg-neutral-900/[0.03] light:border-neutral-900/10")}>
                    <span className="font-semibold text-cyan-400 uppercase tracking-wider block mb-1 text-[10px] light:text-cyan-700">
                      Technical Specs
                    </span>
                    <div className={cn("grid grid-cols-2", gap.tight, "text-slate-300 light:text-neutral-600")}>
                      {(photo.camera?.make || photo.camera?.model) && (
                        <div>
                          <span className="text-slate-500 block text-[10px] light:text-neutral-400">Gear</span>
                          <span>{[photo.camera?.make, photo.camera?.model].filter(Boolean).join(" ")}</span>
                        </div>
                      )}
                      {photo.camera?.lens && (
                        <div>
                          <span className="text-slate-500 block text-[10px] light:text-neutral-400">Lens</span>
                          <span>{photo.camera.lens}</span>
                        </div>
                      )}
                      {(photo.camera?.aperture || photo.camera?.shutterSpeed) && (
                        <div>
                          <span className="text-slate-500 block text-[10px] light:text-neutral-400">Aperture & Shutter</span>
                          <span>{[photo.camera?.aperture, photo.camera?.shutterSpeed].filter(Boolean).join(" • ")}</span>
                        </div>
                      )}
                      {photo.camera?.iso && (
                        <div>
                          <span className="text-slate-500 block text-[10px] light:text-neutral-400">ISO</span>
                          <span>ISO {photo.camera.iso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
